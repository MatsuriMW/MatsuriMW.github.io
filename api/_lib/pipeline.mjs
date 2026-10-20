// 一次问答的完整流水线：圈范围 → 问题向量 → 混合检索 → 重排 → 拒答判断 → 拼提示词 → DeepSeek 流式生成
// 线上函数（api/ask.mjs）和评测脚本（eval/run.mjs）都调这里，评测测到的就是线上跑的
import fs from "node:fs";
import { BlockIndex, parseQueryFilters, plain, fmtDay } from "./core.mjs";
import { embed, rerank } from "./embed.mjs";

// 参数：门槛的数值由评测集标定（见 eval/REPORT.md）。比主集应答题最低分（cos 0.578 / rr 0.055）留出余量，宁可多放进来、让生成层说「没写到」，也不误拒
export const CONFIG = {
    hybridWeight: 0.15, shellPenalty: 3, shellMinChars: 12, minZ: 1.5,
    candidates: 30,      // 交给重排的块数
    perFile: 2,
    minTopCos: Number(process.env.MIN_TOP_COS ?? 0.55),       // 前 10 条最高余弦低于它：拒答（粗门槛）
    minRerank: Number(process.env.MIN_RERANK ?? 0.04),         // 重排后最高分低于它：拒答（细门槛）
    contextK: 6,          // 进提示词的块数
    contextMinRerank: Number(process.env.CONTEXT_MIN_RERANK ?? 0.05),
};

let INDEX = null;
export function loadIndex() {
    if (INDEX) return INDEX;
    const rd = (f) => fs.readFileSync(new URL(`../_data/${f}`, import.meta.url));
    const meta = JSON.parse(rd("meta.json"));
    const blocks = JSON.parse(rd("blocks.json"));
    const vb = rd("vectors.bin"), sb = rd("scales.bin");
    const vectors = new Int8Array(vb.buffer, vb.byteOffset, vb.length);
    const scales = new Float32Array(sb.buffer.slice(sb.byteOffset, sb.byteOffset + sb.length));
    INDEX = new BlockIndex(blocks, { vectors, scales, dims: meta.dims });
    INDEX.meta = meta;
    return INDEX;
}

const show = (b) => ({ title: b.title, folder: b.folder, path: b.path, day: b.day ? fmtDay(b.day) : null, url: b.url || null, text: plain(b.text).slice(0, 600) });

// 检索部分（不生成）。返回给页面的「检索过程」也从这里出
export async function retrieve(question, { today, key, signal, cfg = CONFIG, skipRerank = false } = {}) {
    const idx = loadIndex();
    const t = { start: Date.now() };
    const filters = parseQueryFilters(question, { today, folders: idx.folders });
    const [qvec] = await embed([filters.query], { query: true, key, signal });
    t.embed = Date.now() - t.start;
    const S = idx.search(filters.query, qvec, { limit: cfg.candidates, perFile: cfg.perFile, minZ: cfg.minZ, dateFrom: filters.dateFrom, dateTo: filters.dateTo, folder: filters.folder, ...cfg });
    t.retrieve = Date.now() - t.start - t.embed;
    const hits = S.hits.map((h, rank) => ({ id: h.i, rank: rank + 1, cos: h.cos, bm: h.bm, f: h.f }));
    const topCos = Math.max(-1, ...hits.slice(0, 10).map((h) => h.cos));
    let refused = null;
    if (!hits.length) refused = { stage: "检索", reason: filters.label ? `「${filters.label}」范围里没有过线的块` : "没有块的混合分过线" };
    else if (topCos < cfg.minTopCos) refused = { stage: "检索", reason: `前 10 条最高余弦 ${topCos.toFixed(3)} < 门槛 ${cfg.minTopCos}` };
    // 重排：把问题和每个候选成对打分
    if (!refused && !skipRerank) {
        const docs = hits.map((h) => { const b = idx.blocks[h.id]; return (b.ctx ? b.ctx + "\n" : "") + plain(b.text).slice(0, 1000); });
        const rr = await rerank(filters.query, docs, { key, signal });
        for (const r of rr) hits[r.index].rr = r.score;
        hits.sort((a, b) => (b.rr ?? -1) - (a.rr ?? -1));
        hits.forEach((h, i) => (h.rrRank = i + 1));
        t.rerank = Date.now() - t.start - t.embed - t.retrieve;
        const top = hits[0].rr ?? 0;
        if (top < cfg.minRerank) refused = { stage: "重排", reason: `重排最高分 ${top.toFixed(3)} < 门槛 ${cfg.minRerank}` };
    }
    const context = refused ? [] : hits.filter((h, i) => i < cfg.contextK && (skipRerank || h.rr >= cfg.contextMinRerank || i === 0));
    return {
        filters: { query: filters.query, label: filters.label || null },
        terms: S.terms.slice(0, 12), passed: S.passed, total: idx.blocks.length, topCos,
        hits: hits.map((h) => ({ ...h, ...show(idx.blocks[h.id]), inContext: context.includes(h) })),
        context: context.map((h) => h.id), refused, ms: t,
    };
}

// 给模型看的片段（评委也看同一份，日期、标题这些来源信息两边一致）
export function formatSources(R) {
    const idx = loadIndex();
    return R.context.map((id, k) => {
        const b = idx.blocks[id];
        const where = b.folder === "日记" ? `日记 ${fmtDay(b.day)}` : b.folder === "博客" ? `博客《${b.title}》` : `笔记《${b.title}》`;
        return `[${k + 1}] ${where}${b.ctx ? `（${b.ctx}）` : ""}\n${plain(b.text)}`;
    }).join("\n\n");
}

export function buildMessages(question, R) {
    const sources = formatSources(R);
    return [
        { role: "system", content: [
            "你是「马自立」个人笔记库的问答助手。笔记里有作者自己的想法，也有作者摘录的别人的话，你只能依据下面给出的笔记片段回答。提到作者时就称「作者」，不要用他/她。",
            "规则：",
            "1. 每个事实或观点后面用 [1]、[2] 标出依据的片段编号，可以合并成 [1][3]；不要标没有用到的片段。",
            "2. 片段里没有的内容不要补充，也不要用常识填空。问题问到的某一部分片段里确实没有时，才点明这部分没写到；不要在结尾泛泛加「笔记里没有更多」之类的话。",
            "3. 片段完全答不了这个问题时，只回答：「笔记里没有写到这个。」",
            "4. 摘录的话不要说成作者本人的观点；拿不准时说「笔记里记了」。",
            "5. 用中文，简洁，先给结论，一般不超过 250 字。不要复述规则。",
        ].join("\n") },
        { role: "user", content: `笔记片段：\n\n${sources}\n\n问题：${question}` },
    ];
}

// DeepSeek 流式生成：逐段 yield 文字，最后 yield {usage}
export async function* generate(messages, { key = process.env.DEEPSEEK_API_KEY, signal, model = "deepseek-chat" } = {}) {
    const r = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST", signal,
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, stream: true, temperature: 0.2, max_tokens: 800, stream_options: { include_usage: true } }),
    });
    if (!r.ok) throw new Error(`deepseek ${r.status} ${await r.text()}`);
    const dec = new TextDecoder();
    let buf = "";
    for await (const chunk of r.body) {
        buf += dec.decode(chunk, { stream: true });
        let nl;
        while ((nl = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (data === "[DONE]") return;
            const j = JSON.parse(data);
            const d = j.choices?.[0]?.delta?.content;
            if (d) yield d;
            if (j.usage) yield { usage: j.usage };
        }
    }
}

// 不流式，给评测用
export async function answer(question, opts = {}) {
    const R = await retrieve(question, opts);
    if (R.refused) return { ...R, answer: "笔记里没有写到这个。" };
    let text = "", usage = null;
    for await (const x of generate(buildMessages(question, R), opts)) { if (typeof x === "string") text += x; else usage = x.usage; }
    return { ...R, answer: text, usage };
}
