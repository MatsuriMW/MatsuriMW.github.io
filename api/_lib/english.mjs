// 英语备课 demo 的服务端核心：题库（解密）、检索、模型调用、提示词（大纲、教案、聊天、记忆、复盘）。
// 题库来自 72 份无锡真卷（scripts/split.py 拆题 → demo/build.mjs 加密），只在函数里解密，页面只拿到检索出的单题 / 单篇和出处。
// 检索：按题型、出卷来源（统考 / 校考）、年级学期和考试类型过滤（不够就逐级放宽）→ BM25 + bge-m3 余弦 + 加分项 → bge-reranker 重排。
import fs from "node:fs";
import crypto from "node:crypto";
import zlib from "node:zlib";

const SF = process.env.SF_BASE || "https://api.siliconflow.cn/v1";
const DIMS = 1024;
export const TYPES = ["音标/语音", "单项选择", "完形填空", "阅读理解", "七选五/信息还原", "阅读表达", "阅读填空", "任务型阅读",
    "词汇运用", "动词填空", "综合填空", "语法填空", "完成句子", "句型转换", "补全对话", "书面表达"];
const PASSAGE = new Set(["完形填空", "阅读理解", "七选五/信息还原", "阅读表达", "阅读填空", "任务型阅读", "综合填空", "语法填空", "补全对话", "书面表达"]);
const TEXTBOOK_BOUND = new Set(["词汇运用", "完成句子", "动词填空", "句型转换"]);   // 跟课本单元绑定的题，新教材学生优先用新教材的卷子
const UNIFIED = new Set(["区统考", "市统考", "中考"]);

// ---------- 分词（同第二大脑：中文两字一切，英文按词去停用词） ----------
const CJK = /[㐀-鿿豈-﫿]/;
const STOP = new Set("the and for are but not you with this that from have was were will would can could what when where which who how all any your our their its his her they them then than there here into about just also very more most some such only other of to in on at by is it be as or an if so do does did no yes we he she i me my".split(" "));
function tokenize(text) {
    const out = [];
    for (const m of String(text).toLowerCase().matchAll(/[a-z][a-z'-]{1,}|[㐀-鿿豈-﫿]+/g)) {
        const w = m[0];
        if (CJK.test(w[0])) { if (w.length === 1) out.push(w); for (let i = 0; i + 1 < w.length; i++) out.push(w.slice(i, i + 2)); }
        else if (!STOP.has(w)) out.push(w);
    }
    return out;
}
// 题面里的 ⟦图n⟧：检索和给模型看的时候换成图的描述和图中文字（转写来自 scripts/images.py）
export const withImageText = (u) => u.text.replace(/⟦图(\d+)⟧/g, (_, n) => { const i = (u.imgs || []).find((x) => x.n === +n); return i ? `［图：${i.desc}${i.text ? "；图中文字：" + i.text : ""}］` : ""; });
const searchText = (u) => `${u.type}｜${u.kp.join("、")}｜${u.topic}\n${withImageText(u).slice(0, 1200)}`;

// 题库密钥从服务器上的 DeepSeek key 派生（HKDF），不用另配密钥；换了 DeepSeek key 要重跑 demo/build.mjs 再发布
export function dataKey(secret = process.env.DEEPSEEK_API_KEY) {
    if (!secret) throw new Error("服务器上没有 DeepSeek key，题库解不开");
    return Buffer.from(crypto.hkdfSync("sha256", secret, "wuxi-english-prep", "bank-v1", 32));
}

const rd = (f) => fs.readFileSync(new URL(`../_data/english/${f}`, import.meta.url));
// 取一张图（解密），返回 data URI；只给检索选中的题用
export function imageURI(hash) {
    const raw = rd(`img/${hash.replace(/[^0-9a-f]/g, "")}.enc`);
    const dec = crypto.createDecipheriv("aes-256-gcm", dataKey(), raw.subarray(0, 12));
    dec.setAuthTag(raw.subarray(12, 28));
    return "data:image/jpeg;base64," + Buffer.concat([dec.update(raw.subarray(28)), dec.final()]).toString("base64");
}

// ---------- 题库 ----------
let DB = null;
export function loadDB() {
    if (DB) return DB;
    const raw = rd("units.enc");
    const dec = crypto.createDecipheriv("aes-256-gcm", dataKey(), raw.subarray(0, 12));
    dec.setAuthTag(raw.subarray(12, 28));
    const units = JSON.parse(zlib.gunzipSync(Buffer.concat([dec.update(raw.subarray(28)), dec.final()])));
    const vb = rd("vec.bin"), sb = rd("scales.bin");
    const vec = new Int8Array(vb.buffer, vb.byteOffset, vb.length);
    const scales = new Float32Array(sb.buffer.slice(sb.byteOffset, sb.byteOffset + sb.length));
    // BM25 倒排
    const tf = [], df = new Map();
    let total = 0;
    for (const u of units) {
        const m = new Map();
        for (const t of tokenize(searchText(u))) m.set(t, (m.get(t) || 0) + 1);
        tf.push(m); total += [...m.values()].reduce((a, b) => a + b, 0);
        for (const t of m.keys()) df.set(t, (df.get(t) || 0) + 1);
    }
    const len = tf.map((m) => [...m.values()].reduce((a, b) => a + b, 0));
    DB = { units, byId: new Map(units.map((u, i) => [u.id, i])), vec, scales, tf, df, len, avg: total / units.length, meta: JSON.parse(rd("meta.json")) };
    return DB;
}

function bm25(db, qt, i) {
    let s = 0;
    const m = db.tf[i], N = db.units.length;
    for (const t of qt) {
        const f = m.get(t); if (!f) continue;
        const idf = Math.log(1 + (N - db.df.get(t) + 0.5) / (db.df.get(t) + 0.5));
        s += idf * (f * 2.2) / (f + 1.2 * (0.25 + 0.75 * db.len[i] / db.avg));
    }
    return s;
}
function cosine(db, q, i) {
    let s = 0;
    const o = i * DIMS;
    for (let k = 0; k < DIMS; k++) s += q[k] * db.vec[o + k];
    return s * db.scales[i];
}
const z = (xs) => { const m = xs.reduce((a, b) => a + b, 0) / (xs.length || 1); const sd = Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length || 1)) || 1; return xs.map((x) => (x - m) / sd); };

// 外部接口：函数热着的时候偶尔会复用一条已经被对方关掉的长连接，fetch 直接报「fetch failed」（POST 不会自动重试）。
// 网络层失败就重试一次；HTTP 报错、老师取消（abort）不重试
async function fetchRetry(url, opts) {
    try { return await fetch(url, opts); }
    catch (e) { if (e.name === "AbortError" || opts.signal?.aborted) throw e; return fetch(url, opts); }
}

export async function embed(texts, { signal } = {}) {
    const r = await fetchRetry(`${SF}/embeddings`, {
        method: "POST", signal, headers: { Authorization: `Bearer ${process.env.SILICONFLOW_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "BAAI/bge-m3", input: texts, encoding_format: "float" }),
    });
    if (!r.ok) throw new Error(`embeddings ${r.status} ${(await r.text()).slice(0, 200)}`);
    return (await r.json()).data.sort((a, b) => a.index - b.index).map((d) => {
        let n = 0; for (const x of d.embedding) n += x * x; n = Math.sqrt(n) || 1;
        return Float32Array.from(d.embedding, (x) => x / n);
    });
}
export async function rerank(query, docs, { signal } = {}) {
    const r = await fetchRetry(`${SF}/rerank`, {
        method: "POST", signal, headers: { Authorization: `Bearer ${process.env.SILICONFLOW_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "BAAI/bge-reranker-v2-m3", query, documents: docs, return_documents: false }),
    });
    if (!r.ok) throw new Error(`rerank ${r.status} ${(await r.text()).slice(0, 200)}`);
    return (await r.json()).results.map((x) => ({ index: x.index, score: x.relevance_score }));
}

// 每个题型要几道：短文类按篇（1–2 篇），一句一题的按题（3–6 道）
export function slotSize(type, share) {
    if (PASSAGE.has(type)) return share >= 0.22 ? 2 : 1;
    return Math.max(3, Math.min(6, Math.round(share * 30)));
}

// 考点的上下位说法：拆题时模型给的标签不统一（非谓语动词的单选常标成「动名词」「动词不定式」）
const KP_ALIAS = {
    非谓语动词: ["动名词", "不定式", "分词", "非谓语"], 时态: ["一般现在时", "一般过去时", "一般将来时", "现在完成时", "现在进行时", "过去进行时", "过去将来时", "时态"],
    词形变化: ["词形", "名词复数", "比较级", "最高级", "序数词", "副词", "形容词"], 从句: ["宾语从句", "定语从句", "状语从句", "从句"],
    上下文逻辑: ["上下文", "语境", "逻辑"], 推理判断: ["推理"], 主旨大意: ["主旨", "标题", "大意"], 细节理解: ["细节"],
    情景交际: ["情景", "交际", "日常用语"], 被动语态: ["被动"], 代词: ["代词"], 固定搭配: ["搭配", "短语"],
};
const kpTerms = (k) => [k, ...(KP_ALIAS[k] || [])];
// 题目标签包含要找的说法才算；反过来只认三个字以上的标签（「名词」不能算进「动名词」）
export const kpHit = (u, kps) => kps.filter((k) => u.kp.some((x) => kpTerms(k).some((t) => x.includes(t)) || (x.length >= 3 && k.includes(x))));
const GRADE_OF = { 七: 7, 八: 8, 九: 9 };
// 自定义查询里的中文两字词（去掉题型名本身），用来认话题：「环保话题的完形」→ 环保、话题……
const queryTerms = (q, type) => [...new Set(tokenize(q).filter((t) => CJK.test(t) && t.length === 2 && !type.includes(t) && !"题型考点一篇一道找题话题".includes(t)))];
const topicHit = (u, terms) => terms.some((t) => (u.topic + u.kp.join("")).includes(t));

// 一个题型的候选池：出卷来源过滤 + 年级学期 / 考试类型逐级放宽，返回 { ids, relax }
function pool(db, slot, ctx) {
    const lv = ctx.level === "统考" ? (u) => UNIFIED.has(u.level) : ctx.level === "不统考" ? (u) => u.level === "校考" : () => true;
    const grade = GRADE_OF[ctx.gt[0]];
    const tiers = [
        ["同年级学期、同类考试", (u) => u.gt === ctx.gt && u.kind === ctx.kind],
        ["同年级学期", (u) => u.gt === ctx.gt],
        ["同年级", (u) => u.grade === grade],
        ["相邻年级", (u) => Math.abs(u.grade - grade) <= 1],
        ["全库", () => true],
    ];
    const need = Math.max(slot.n * 3, 6);
    const base = db.units.map((u, i) => i).filter((i) => db.units[i].type === slot.type && !ctx.exclude?.has(db.units[i].id));
    for (const levelOk of [true, false]) {
        for (const [ti, [label, f]] of tiers.entries()) {
            const ids = base.filter((i) => f(db.units[i]) && (!levelOk || lv(db.units[i])));
            if (!(ids.length >= need || (label === "全库" && ids.length))) continue;
            // 范围里对得上考点的题不够：只把对得上的从更宽的范围补进来（先同年级，再相邻年级）
            let extra = 0;
            if (slot.kps.length) {
                for (const [, g] of tiers.slice(ti + 1, 4)) {
                    if (ids.filter((i) => kpHit(db.units[i], slot.kps).length).length >= slot.n) break;
                    for (const i of base) if (!ids.includes(i) && g(db.units[i]) && (!levelOk || lv(db.units[i])) && kpHit(db.units[i], slot.kps).length) { ids.push(i); extra++; }
                }
            }
            // 自定义找题时提到了话题（「环保」）而范围里没有对得上的：话题对得上的从相邻年级、其他出卷来源补进来
            if (slot.terms?.length && ids.filter((i) => topicHit(db.units[i], slot.terms)).length < slot.n) {
                for (const i of base) if (!ids.includes(i) && Math.abs(db.units[i].grade - grade) <= 1 && topicHit(db.units[i], slot.terms)) { ids.push(i); extra++; }
            }
            return { ids, relax: label, extra, levelRelaxed: !levelOk && ctx.level !== "不知道" };
        }
    }
    return { ids: [], relax: "无", extra: 0, levelRelaxed: false };
}

// slots: [{ type, share, kps: [薄弱考点], query?（自定义查询）, n?（要几道）}]
// ctx: { gt, kind, level, school, district, textbook, guidance, difficulty?（偏易 / 适中 / 偏难）, exclude?（不要的题目 id，Set）}
// 难度：题目的难度档（demo/build.mjs 算好）和目标对上的加分，差两档的减分
export const TIER = { 偏易: 0, 适中: 1, 偏难: 2 };
const DIFF_BONUS = 0.35;
// 难度按学生所在的册算（demo/build.mjs 给阅读、完形、语法填空每篇存了六册各自的分和档）：1 = 七上 … 6 = 九下
const BOOK = { 七上: 1, 七下: 2, 八上: 3, 八下: 4, 九上: 5, 九下: 6 };
const BOOK_CN = ["", ...Object.keys(BOOK), "初中不学"];
// 给页面和模型看的：这个学生的难度档、分，和他还没学的生词（哪一册学、词性、在题目还是文章里）
export function diffView(u, gt) {
    const k = BOOK[gt];
    if (!u.diff || !k) return null;
    return { tier: u.diff.tier[k - 1], score: u.diff.score[k - 1],
        words: u.diff.words.filter(([, b]) => b > k).map(([w, b, pos, loc]) => ({ w, book: BOOK_CN[b], pos, loc })) };
}
const diffBonus = (u, ctx) => { const t = u.diff?.tier?.[BOOK[ctx.gt] - 1]; return ctx.difficulty in TIER && t in TIER ? DIFF_BONUS * (1 - Math.abs(TIER[t] - TIER[ctx.difficulty])) : 0; };
export async function retrieve(slots, ctx, { signal, onStage } = {}) {
    const db = loadDB();
    const t0 = Date.now();
    slots = slots.filter((s) => TYPES.includes(s.type)).map((s) => ({ ...s, n: s.n ?? slotSize(s.type, s.share), terms: s.query ? queryTerms(s.query, s.type) : [] }));
    const queries = slots.map((s) => s.query || `${s.type}${s.kps.length ? "：" + s.kps.join("、") : ""}${ctx.guidance ? "。" + ctx.guidance : ""}`);
    const qv = await embed(queries, { signal });
    onStage?.("embed", { ms: Date.now() - t0, n: queries.length });
    const out = await Promise.all(slots.map(async (s, si) => {
        const P = pool(db, s, ctx);
        if (!P.ids.length) return { type: s.type, n: s.n, relax: P.relax, items: [] };
        const qt = tokenize(queries[si]);
        const cos = P.ids.map((i) => cosine(db, qv[si], i)), bm = P.ids.map((i) => bm25(db, qt, i));
        const zc = z(cos), zb = z(bm);
        const cand = P.ids.map((i, k) => {
            const u = db.units[i];
            const hit = kpHit(u, s.kps), topic = topicHit(u, s.terms);
            const sameSchool = ctx.school && u.school === ctx.school, sameDistrict = ctx.district && u.district === ctx.district;
            const f = zc[k] + 0.3 * zb[k] + (hit.length ? 0.8 : 0) + (topic ? 1 : 0) + (sameSchool ? 0.5 : 0) + (sameDistrict ? 0.25 : 0)
                + (ctx.textbook === "新" && TEXTBOOK_BOUND.has(s.type) && u.textbook === "新" ? 0.4 : 0) + (u.year >= 2025 ? 0.15 : 0) + 2 * diffBonus(u, ctx);
            return { i, f, cos: cos[k], bm: bm[k], hit, topic, sameSchool, sameDistrict };
        }).sort((a, b) => b.f - a.f).slice(0, Math.max(12, s.n * 4));
        // 重排：题型 + 考点 + 老师要求 对题面打分
        const rr = await rerank(queries[si], cand.map((c) => { const u = db.units[c.i]; return `${u.kp.join("、")}｜${u.text.slice(0, 700)}`; }), { signal });
        for (const r of rr) cand[r.index].rr = r.score;
        for (const c of cand) c.final = c.rr + (c.hit.length ? 0.5 : 0) + (c.topic ? 0.5 : 0) + (c.sameSchool ? 0.12 : 0) + (c.sameDistrict ? 0.06 : 0) + diffBonus(db.units[c.i], ctx);
        cand.sort((a, b) => b.final - a.final);
        // 挑题：同一份卷子短文类最多 1 篇、单题最多 2 道；「不知道统不统考」两边轮流挑
        const perPaper = {}, pick = [];
        const lanes = ctx.level === "不知道" ? [cand.filter((c) => UNIFIED.has(db.units[c.i].level)), cand.filter((c) => !UNIFIED.has(db.units[c.i].level))] : [cand];
        for (let round = 0; pick.length < s.n && round < cand.length; round++) {
            for (const lane of lanes) {
                const c = lane.find((c) => !pick.includes(c) && (perPaper[db.units[c.i].paper] || 0) < (PASSAGE.has(s.type) ? 1 : 2));
                if (c && pick.length < s.n) { pick.push(c); perPaper[db.units[c.i].paper] = (perPaper[db.units[c.i].paper] || 0) + 1; }
            }
        }
        // 备选：老师在页面上「换一题」时用，同样守每份卷子的上限
        const alts = [];
        for (const c of cand) {
            if (alts.length >= 2) break;
            if (pick.includes(c) || (perPaper[db.units[c.i].paper] || 0) >= (PASSAGE.has(s.type) ? 1 : 2)) continue;
            alts.push(c); perPaper[db.units[c.i].paper] = (perPaper[db.units[c.i].paper] || 0) + 1;
        }
        const show = (c) => {
            const u = db.units[c.i];
            const why = [];
            if (c.hit.length) why.push(`考点对上：${c.hit.join("、")}`);
            if (c.topic) why.push(`话题对上：${u.topic}`);
            if (c.sameSchool) why.push("同校的卷子");
            else if (c.sameDistrict) why.push("同区的卷子");
            why.push(u.level);
            if (u.gt !== ctx.gt || u.kind !== ctx.kind) why.push(`来自${u.gt}${u.kind}`);
            return {
                id: u.id, type: u.type, gt: u.gt, kind: u.kind, year: u.year, level: u.level, school: u.name || u.district || u.school, title: u.title,
                q: u.q, ans: u.ans, ans_src: u.ans_src, kp: u.kp, topic: u.topic, text: u.text, explain: u.explain,   // 给全文：学生版直接印、老师版带完整解析
                imgs: (u.imgs || []).map((i) => ({ n: i.n, w: i.w, h: i.h, kind: i.kind, desc: i.desc, text: i.text, src: imageURI(i.hash) })),
                why, score: { rr: +c.rr.toFixed(3), cos: +c.cos.toFixed(3) }, diff: diffView(u, ctx.gt),
            };
        };
        return {
            type: s.type, n: s.n, query: queries[si], relax: P.relax, extra: P.extra, levelRelaxed: P.levelRelaxed, pool: P.ids.length,
            candidates: cand.length, kpCovered: s.kps.length ? pick.filter((c) => c.hit.length).length : null,
            items: pick.map(show), alts: alts.map(show),
        };
    }));
    onStage?.("search", { ms: Date.now() - t0 });
    return out;
}

// 页面传回来的只有 [{code, id}]，题面一律从题库取，页面塞不进别的内容
export function itemsByIds(list, gt) {
    const db = loadDB();
    return (Array.isArray(list) ? list : []).slice(0, 30).map((x) => {
        const i = db.byId.get(String(x?.id || "")); if (i == null) return null;
        const u = db.units[i];
        return { code: String(x.code || "").replace(/[^E0-9]/g, "").slice(0, 4), type: u.type, gt: u.gt, kind: u.kind, year: u.year, level: u.level,
            school: u.name || u.district || u.school, kp: u.kp, topic: u.topic, ans: u.ans, text: u.text, imgs: u.imgs || [], explain: u.explain, diff: diffView(u, gt) };
    }).filter(Boolean);
}

// ---------- 模型 ----------
// 默认用站长在硅基流动的额度（用户 10-28 定，模型和 DeepSeek 官方是同一个）；EN_LLM_PROVIDER=deepseek 可以切回 DeepSeek 官方。
// 页面上可以填自己的 key（只存在浏览器里，经这里转发）。只认这两个地址，免得函数被拿去请求任意网址
const PROVIDERS = {
    deepseek: { base: "https://api.deepseek.com", model: "deepseek-chat" },
    siliconflow: { base: "https://api.siliconflow.cn/v1", model: "deepseek-ai/DeepSeek-V4.1-Flash", extra: { enable_thinking: false } },
};
export function llmConfig(byok) {
    const P = byok && PROVIDERS[byok.provider];
    if (P && typeof byok.key === "string" && /^[\x21-\x7e]{16,200}$/.test(byok.key)) {
        const model = typeof byok.model === "string" && /^[\w./:-]{2,80}$/.test(byok.model) ? byok.model : P.model;
        return { ...P, key: byok.key, model, own: true };
    }
    const sf = process.env.EN_LLM_PROVIDER !== "deepseek" && process.env.SILICONFLOW_API_KEY;   // 硅基流动的 key 没配就退回 DeepSeek
    return sf ? { ...PROVIDERS.siliconflow, key: process.env.SILICONFLOW_API_KEY, own: false } : { ...PROVIDERS.deepseek, key: process.env.DEEPSEEK_API_KEY, own: false };
}
const DEFAULT_LLM = () => llmConfig(null);
async function llmError(r, cfg) {
    const t = (await r.text()).slice(0, 160);
    if (cfg.own && [401, 402, 403].includes(r.status)) return `你填的 key 用不了（不对、没余额，或者没开通这个模型）：${r.status} ${t}`;
    return `模型接口 ${r.status} ${t}`;
}
export async function* stream(messages, { signal, max_tokens = 3000, temperature = 0.4, cfg = DEFAULT_LLM() } = {}) {
    const r = await fetchRetry(`${cfg.base}/chat/completions`, {
        method: "POST", signal, headers: { Authorization: `Bearer ${cfg.key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: cfg.model, messages, stream: true, temperature, max_tokens, stream_options: { include_usage: true }, ...cfg.extra }),
    });
    if (!r.ok) throw new Error(await llmError(r, cfg));
    const dec = new TextDecoder();
    let buf = "";
    for await (const chunk of r.body) {
        buf += dec.decode(chunk, { stream: true });
        let nl;
        while ((nl = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
            if (!line.startsWith("data:") || line === "data: [DONE]") continue;
            const d = JSON.parse(line.slice(5));
            const t = d.choices?.[0]?.delta?.content;
            if (t) yield t;
            if (d.usage) yield { usage: d.usage };
        }
    }
}
export async function json(messages, { signal, max_tokens = 2000, cfg = DEFAULT_LLM() } = {}) {
    const r = await fetchRetry(`${cfg.base}/chat/completions`, {
        method: "POST", signal, headers: { Authorization: `Bearer ${cfg.key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: cfg.model, messages, temperature: 0.2, max_tokens, response_format: { type: "json_object" }, ...cfg.extra }),
    });
    if (!r.ok) throw new Error(await llmError(r, cfg));
    const d = await r.json();
    const t = d.choices[0].message.content || "";
    let data;
    try { data = JSON.parse(t); } catch { data = JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1)); }   // 有的模型会包一层 ```json
    return { data, usage: d.usage };
}

// ---------- 提示词 ----------
const clip = (s, n) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);
const memLine = (m) => `${m.id}［${m.cat}${m.qtype ? "·" + m.qtype : ""}${m.kp ? "·" + m.kp : ""}${m.strength != null ? `·强度${(+m.strength).toFixed(2)}` : ""}］${clip(m.text, 60)}${m.evidence ? `（依据：${clip(m.evidence, 50)}）` : ""}`;
export const cleanMems = (xs) => (Array.isArray(xs) ? xs : []).slice(0, 40).map((m) => ({
    id: clip(m.id, 8), cat: clip(m.cat, 8), text: clip(m.text, 80), qtype: TYPES.includes(m.qtype) ? m.qtype : "", kp: clip(m.kp, 12),
    strength: m.strength == null || m.strength === "" ? null : Math.max(0, Math.min(1, +m.strength || 0)), evidence: clip(m.evidence, 60),
}));

// 老师设置（MAT-498，字段同 web/memory.js 的 SETTINGS）→ 给模型看的一行
const num = (v, lo, hi, d) => (Number.isFinite(+v) && v !== "" && v != null ? Math.max(lo, Math.min(hi, Math.round(+v))) : d);
const pick = (v, opts, d) => (opts.includes(v) ? v : d);
// lesson：这次课的分钟数（老师可以在第 2 步临时改），和平时不一样时两个都写，免得模型看到两个课时
export function settingsLine(st, lesson) {
    if (!st || typeof st !== "object") return "（没填）";
    const usual = num(st.minutes, 40, 240, 120);
    const lt = pick(st.lessonType, ["一对一", "小班"], "一对一"), dic = num(st.dictation, 0, 30, 0), rec = num(st.recap, 0, 30, 0), focus = num(st.focusTypes, 0, 6, 0), ext = extrasMinutes(st);
    return [
        `课型${lt}，一次课平时 ${usual} 分钟${lesson && lesson !== usual ? `（这次课 ${lesson} 分钟，以这次为准）` : ""}，每周 ${num(st.perWeek, 1, 7, 2)} 次`,
        dic || rec || ext ? `固定环节：${[dic && `开头单词默写 ${dic} 分钟`, ext && `${EXTRAS_NAME} ${ext} 分钟（内容系统已经挑好，环节名就叫「${EXTRAS_NAME}」，不练题型）`, rec && `结尾错题回顾 ${rec} 分钟`].filter(Boolean).join("、")}` : "没有固定环节",
        focus ? `一节课最多主攻 ${focus} 个题型` : "",
        `考前最后一节${pick(st.fullPaper, ["做", "不做"], "不做") === "做" ? "做整卷" : "不做整卷"}`,
        `作业不超过 ${num(st.homeworkMinutes, 0, 120, 30)} 分钟，${pick(st.homeworkScope, ["只练薄弱点", "全面练"], "只练薄弱点")}`,
    ].filter(Boolean).join("；");
}
// ---------- 课外知识补充（用户 10-29）----------
// 现成条目在 demo/extras.json（建库时拷到 api/_data/english/），每节课按用到的例题原文挑 2–3 条拼进大纲和教案，不调模型
const EXTRAS_NAME = "课外知识补充";
export const extrasMinutes = (st) => num(st?.extrasMinutes, 0, 20, 8);   // 老师设置，0 是不加
let EXTRAS = null;
function loadExtras() {
    if (EXTRAS) return EXTRAS;
    const d = JSON.parse(rd("extras.json"));
    for (const e of d.entries) {
        if (e.match) e.re = new RegExp(e.match);
        e.wre = (e.words || []).map((w) => [w, new RegExp(`(?<![a-z])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![a-z])`)]);
    }
    return (EXTRAS = d);
}
const OPT_LINE = /(^|\s)[A-D]\s*[.．、]\s*[A-Za-z]/;
// 一条在这节课的题里对上了什么：词根词缀看这个学生没学过的生词能不能拆；易混词看同一道题的选项里有没有两组以上；其余看原文里有没有这个词、话题对不对
function scoreExtra(e, docs) {
    const hits = [];
    let topic = null;
    for (const d of docs) {
        if (e.groups) {
            for (const o of d.opts) { const m = e.groups.map((g) => g.find((w) => o.has(w))).filter(Boolean); if (m.length >= 2) { hits.push({ code: d.code, w: m.join(" / ") }); break; } }
            continue;
        }
        const fw = e.re ? [...d.fresh].filter((t) => e.re.test(t)) : (e.words || []).filter((w) => d.fresh.has(w));   // 这个学生的生词（原形）
        const ws = e.re ? [...d.words].filter((t) => e.re.test(t)) : e.wre.filter(([, re]) => re.test(d.text)).map(([w]) => w);
        for (const w of [...fw, ...ws]) if (!hits.some((h) => h.w === w)) hits.push({ code: d.code, w, fresh: d.fresh.has(w) });
        if (!topic && e.topics && topicHit(d.it, e.topics)) topic = d.code;
    }
    const fresh = hits.filter((h) => h.fresh).length;
    let s = ["词根词缀", "构词法"].includes(e.cat) ? 2 * fresh + 0.25 * Math.min(4, hits.length - fresh)
        : e.groups ? (hits.length ? 2 : 0) : 1.5 * Math.min(2, hits.length) + 0.5 * fresh;
    if (topic) s += 1.5;
    return { s, hits: hits.sort((a, b) => !!b.fresh - !!a.fresh).slice(0, 4), topic };
}
export function pickExtras(items, gt) {
    const { how, entries } = loadExtras();
    const grade = GRADE_OF[String(gt)[0]] || 9, ok = entries.filter((e) => e.level <= grade);
    const docs = items.map((it) => {
        const text = it.text.toLowerCase().replace(/[’‘]/g, "'");
        return { it, code: it.code, text, words: new Set(text.match(/[a-z][a-z'-]*[a-z]/g)),
            opts: it.text.split("\n").filter((l) => OPT_LINE.test(l)).map((l) => new Set(l.toLowerCase().match(/[a-z]+/g))), fresh: new Set((it.diff?.words || []).map((x) => x.w)) };
    });
    const ranked = ok.map((e) => ({ e, ...scoreExtra(e, docs) })).filter((x) => x.s >= 1)
        .sort((a, b) => b.s - a.s || (b.e.freq || 0) - (a.e.freq || 0));
    const picked = [];
    for (const x of ranked) if (picked.length < 3 && !picked.some((y) => y.e.cat === x.e.cat)) picked.push(x);
    // 文章里对上的不到两条：从最常考的交际俗语里按天轮换补一条，免得每次课都是同一句
    if (picked.length < 2 && !picked.some((y) => y.e.cat === "谚语俗语")) {
        const pool = ok.filter((e) => e.kind === "交际").sort((a, b) => b.freq - a.freq).slice(0, 12);
        if (pool.length) picked.push({ e: pool[Math.floor(Date.now() / 864e5) % pool.length], hits: [], topic: null });
    }
    const show = ({ e, hits, topic }) => {
        const byCode = new Map();
        for (const h of hits) byCode.set(h.code, [...(byCode.get(h.code) || []), h.w]);
        const by = [...byCode].map(([c, ws]) => `${c} 的 ${ws.join("、")}`).join("；");
        const where = by ? "这节课 " + by : topic ? `和 ${topic} 的话题对得上` : "";
        const { re, wre, words, match, groups, topics, ...rest } = e;
        return { ...rest, how: how[e.cat], where, point: clip(`${e.cat}：${e.key}（${e.mean}）${where ? "｜" + where : e.src ? "｜真题：" + e.src : ""}`, 160) };
    };
    return { picked: picked.map(show), candidates: ranked.filter((x) => !picked.includes(x)).slice(0, 12).map(show) };
}
// 大纲里的「课外知识补充」：模型照老师设置排了就用它排的位置，没排就放在结尾那个不练题型的环节（错题回顾）前面；要点、分钟、条目以这里为准。
// 只有读模型输出时按名字找（只在不练题型的环节里找）；之后页面、写教案都按 extras 字段认，老师改了环节名也不受影响
export function withExtras(o, picked, minutes) {
    const mine = (x) => !x.type && x.name.includes("课外知识"), at = o.sections.findIndex(mine);
    o.sections = o.sections.filter((x) => !mine(x));
    if (picked.length) {
        const last = o.sections.at(-1);
        o.sections.splice(at >= 0 ? at : last && !last.type ? o.sections.length - 1 : o.sections.length, 0,
            { id: "", name: EXTRAS_NAME, minutes, type: "", items: [], points: picked.map((x) => x.point), extras: picked.map((x) => x.id) });
    }
    o.sections.forEach((x, i) => (x.id = `s${i + 1}`));
    return o;
}

export const ATTN = ["集中", "一般", "容易分心"];
const attnLine = (a) => (a === "容易分心" ? "注意力容易分散：环节要短、讲和练交替、多给看得见的引导" : ATTN.includes(a) ? `注意力${a}` : "");

// 课次记录：日期、当时教案的占比、讲了什么、错在哪
export const cleanLogs = (xs) => (Array.isArray(xs) ? xs : []).slice(-8).map((l) => ({
    date: clip(l.date, 10), summary: clip(l.summary, 80),
    mix: (Array.isArray(l.plan?.mix) ? l.plan.mix : []).slice(0, 10).map(([t, v]) => [clip(t, 10), Math.round(+v * 100) || 0]),
    errors: (Array.isArray(l.errors) ? l.errors : []).slice(0, 6).map((e) => `${clip(e.qtype, 10)}${e.kp ? "·" + clip(e.kp, 10) : ""}${e.note ? "：" + clip(e.note, 30) : ""}`),
}));
const logLines = (logs) => (logs || []).map((l) => `${l.date}｜${l.summary}${l.mix.length ? `｜当时教案：${l.mix.map(([t, v]) => `${t}${v}%`).join("、")}` : ""}${l.errors.length ? `｜错在：${l.errors.join("；")}` : ""}`);

export function reviewMessages(p) {
    const sys = `你是一位英语家教老师的 personal agent。根据这个学生最近几次课的记录（每次课的教案占比、讲了什么、错在哪）和档案，给下一次课的教案提改进建议。只输出一个 JSON 对象：

{"suggestions": [{"title": "一句话建议，20 字以内", "detail": "具体怎么改，60 字以内", "evidence": "依据哪次课的什么数据，50 字以内，写日期",
  "kind": "占比|讲法|作业|节奏|题源", "type": "相关题型或空字符串", "delta": 这个题型的占比调整（-0.15 到 0.15，不调占比就给 0）}],
 "gaps": "还缺什么数据才能判断得更准，40 字以内"}

规则：
- 只根据给出的记录说话，每条都要指回具体某次课的数据；记录不够就少给，宁缺毋滥，最多 4 条。
- 重点看：同一个薄弱点讲了几次还在错（该换讲法，不是只加时间）；花了时间但已经稳了的（可以减）；下一场考试要考、最近几次课却没覆盖的题型；老师反复手动调整的方向（可以变成默认）。
- type 只能从这些里选：${TYPES.join("、")}，或空字符串。`;
    const lines = [
        `【学生】${clip(p.student?.name, 10)}，${clip(p.student?.gradeLabel, 30)}，${clip(p.student?.schoolLabel, 40)}`,
        `【下一场考试】${clip(p.examLabel, 80)}`,
        `【系统建议的占比】${(Array.isArray(p.mix) ? p.mix : []).slice(0, 12).map((m) => `${clip(m.type, 10)} ${Math.round(+m.share * 100)}%`).join("、")}`,
        `【学生档案】\n${p.studentMems.map(memLine).join("\n") || "（空）"}`,
        `【老师档案】\n${p.teacherMems.map(memLine).join("\n") || "（空）"}`,
        `【老师设置】${settingsLine(p.settings)}`,
        p.weakKps ? `【薄弱知识点（按课次记录累计）】${clip(p.weakKps, 300)}` : "",
        `【最近的调整】${(Array.isArray(p.observations) ? p.observations : []).slice(-6).map((o) => clip(o, 80)).join("；") || "（无）"}`,
        `【课次记录】\n${logLines(p.logs).join("\n") || "（没有记录）"}`,
    ].filter(Boolean);
    return [{ role: "system", content: sys }, { role: "user", content: lines.join("\n") }];
}

// ---------- 大纲 → 教案 ----------
const FOUR = `四个依据都要用上，并且看得出来：
1. 年级：下一场考试的结构（考哪些题型、各多少分），九年级还要看中考趋势。
2. 学校：这场考试用谁的卷子（统考 / 校考）、本校本区的出题习惯。
3. 学生：学生档案里的薄弱点、学习习惯、状态。
4. 老师：老师档案里的讲题习惯、课堂结构、偏好，以及这次课的要求。
优先级：这次课的要求 > 老师档案 > 学生档案 > 考试结构。几条依据冲突时按优先级取舍，并说一句怎么取舍的。`;
const CITE = `- 关键设计后面用方括号标出依据：记忆编号如 [S2]、[T1]，考试结构标 [考]，学校标 [校]。只引用材料里有的编号，不编造学生情况。
- 学校这一维只说材料里写了的事实（出卷来源、库里有哪些卷子），不要推测学校的出题偏好；材料里没有本校卷子就直说。
- 不要把老师或学生带来的份额说成考试结构给的（【本次占比】里写了每个题型的份额来自哪一维）。
- 例题只用材料里给的题，按编号引用，例如「E3（东林中学 2024 九上期末）」。不要自己出题，不要抄题目原文。`;
const diffText = (d) => (d ? `｜难度：${d.tier}${d.words.length ? `（这个学生没学过的词 ${d.words.length} 个：${d.words.slice(0, 5).map((x) => x.w).join("、")}）` : ""}` : "");
const itemLine = (it, n) => `${it.code}［${it.type}］${it.school} ${it.year} ${it.gt}${it.kind}（${it.level}）｜考点：${it.kp.join("、")}${it.topic ? "｜话题：" + it.topic : ""}${diffText(it.diff)}｜答案：${it.ans.filter(Boolean).join(" ")}\n题面：${clip(withImageText(it), n)}`;
function materials(p) {
    const st = p.student, at = attnLine(st.attention);
    return [
        `【学生】${clip(st.name, 10)}，${clip(st.gradeLabel, 30)}，${clip(st.schoolLabel, 40)}${at ? "；" + at : ""}`,
        st.profile ? `【学生画像（老师拖光谱填的，0–100）】${clip(st.profile, 500)}` : "",
        `【学生档案】\n${p.studentMems.map(memLine).join("\n") || "（空）"}`,
        p.weakKps ? `【薄弱知识点（按课次记录累计）】${clip(p.weakKps, 300)}` : "",
        `【老师档案】\n${p.teacherMems.map(memLine).join("\n") || "（空）"}`,
        `【老师设置】${settingsLine(p.settings, p.minutes)}`,
        `【前几次课】\n${logLines(p.logs).join("\n") || "（没有记录）"}`,
        `【这次课的要求】${clip(p.guidance, 300) || "（没有特别要求）"}`,
        `【下一场考试】${clip(p.exam.label, 80)}；出卷：${clip(p.exam.levelLabel, 120)}`,
        `【考试结构】${clip(p.exam.structure, 400)}`,
        `【学校】${clip(p.exam.school, 300)}`,
        `【本次占比】课时 ${p.minutes} 分钟。${p.mix.map((m) => `${m.type} ${Math.round(m.share * 100)}%（约 ${m.minutes} 分钟；来源：${clip(m.from, 60)}）`).join("；")}`,
        `【单元安排】${clip(p.unitPlan, 120)}`,
    ].filter(Boolean);
}

// 第一步：排大纲（JSON），老师在页面上改完再写成教案
export function outlineMessages(p, items) {
    const sys = `你是无锡初中英语老师的备课助手。先给一次课（一对一）排教案大纲，老师确认、修改以后再写成完整教案。

${FOUR}

只输出一个 JSON 对象：
{"title": "学生名 · 这次课的主题",
 "basis": {"年级": "一两句", "学校": "一两句", "学生": "一两句", "老师": "一两句"},
 "adjust": ["根据前几次课的调整，引用日期和数据，1–3 条；没有课次记录就给空数组"],
 "goals": ["教学目标，2–4 条"],
 "sections": [{"name": "环节名", "minutes": 分钟数, "type": "这个环节练的题型，默写、回顾这类环节写空字符串", "items": ["用到的例题编号"], "points": ["讲什么、怎么讲，2–4 条，每条一句"]}],
 "homework": ["课后作业，写题号"],
 "watch": ["下次课观察点，1–3 条"]}

规则：
- sections 按上课顺序排，分钟数加起来等于课时；各题型的分钟数大致按【本次占比】；【老师设置】里的固定环节（开头默写、课外知识补充、结尾回顾）按设置的分钟数排进去。
- 课后作业照【老师设置】的时长上限和范围留。${p.student?.attention === "容易分心" ? `
- 这个学生注意力容易分散：每个环节不超过 ${p.attentionMax} 分钟；讲和练交替，讲 5–8 分钟就让学生动手；每两个讲解环节之间插一个 3–5 分钟的动手小环节（圈线索词、画时间轴、抢答、配对），points 里写清楚怎么做。` : ""}
- 每道例题至少用在一个环节里；items 只能填材料里的 E 编号。
- points 要具体：这几道题考什么、这个学生容易错在哪（对照薄弱点）、照老师的讲题习惯怎么讲。
${CITE}
- type 只能从这些里选：${TYPES.join("、")}，或空字符串。
- 简体中文，不写空话。`;
    const lines = [...materials(p), `【例题和练习】`, ...items.map((it) => itemLine(it, 500))];
    return [{ role: "system", content: sys }, { role: "user", content: lines.join("\n") }];
}

// 模型给的大纲清洗一遍：编号、分钟、题型、题号都只认合法的
// infer：模型刚排的大纲才从要点里补用题；页面传回来的（老师改过的）不补，免得把老师删掉的题加回去
export function cleanOutline(o, codes, infer = false) {
    const arr = (x, n, m) => (Array.isArray(x) ? x : []).slice(0, n).map((v) => clip(v, m)).filter(Boolean);
    const ok = new Set(codes);
    // 模型给的用题常写成「E2（东林 2024）」「E3–E5」，只认里面的 E 编号；一个都没给就从要点里提到的编号补（MAT-484）。
    // 范围只认「E3–E5」「E3–5」「E3～E5」「E3-E5」：短横后面要跟 E，免得「E3 - 10 分钟」「E2-2024」被当成范围；倒序照样展开
    const eCodes = (v) => [...String(v).matchAll(/E(\d+)\s*(?:[–—~～]\s*E?|-\s*E)(\d+)|E(\d+)/g)].flatMap((m) => {
        if (m[3]) return [`E${m[3]}`];
        const [a, b] = [+m[1], +m[2]].sort((x, y) => x - y);
        return b - a > 10 ? [`E${m[1]}`] : Array.from({ length: b - a + 1 }, (_, k) => `E${a + k}`);
    });
    const pickCodes = (xs) => [...new Set(xs.flatMap(eCodes))].filter((c) => ok.has(c));
    const basis = o?.basis && typeof o.basis === "object" ? o.basis : {};
    return {
        title: clip(o?.title, 60),
        basis: Object.fromEntries(["年级", "学校", "学生", "老师"].map((k) => [k, clip(basis[k], 200)])),
        adjust: arr(o?.adjust, 4, 160), goals: arr(o?.goals, 5, 120), homework: arr(o?.homework, 6, 120), watch: arr(o?.watch, 4, 120),
        sections: (Array.isArray(o?.sections) ? o.sections : []).slice(0, 14).map((x, i) => {
            const points = arr(x?.points, 6, 160), items = pickCodes(Array.isArray(x?.items) ? x.items : []);
            return { id: `s${i + 1}`, name: clip(x?.name, 30) || `环节 ${i + 1}`, minutes: Math.max(0, Math.min(240, Math.round(+x?.minutes || 0))),
                type: TYPES.includes(x?.type) ? x.type : "", items: items.length || !infer ? items : pickCodes(points), points,
                ...(Array.isArray(x?.extras) ? { extras: arr(x.extras, 6, 40) } : {}) };
        }),
    };
}
// 注意力容易分散的学生：超过 max 分钟的环节拆成几段（「环节名（续）」），用题和要点按顺序分过去，总分钟数不变
// 分钟均分（前几段多 1 分钟），每段都不超过 max；默写、回顾这类不练题型的环节是老师设置的，不拆
export function splitLong(o, max) {
    const out = [];
    for (const x of o.sections) {
        const k = Math.ceil(x.minutes / max);
        if (k <= 1 || !x.type) { out.push(x); continue; }
        const per = (arr, i) => arr.filter((_, j) => Math.floor(j * k / arr.length) === i);
        const base = Math.floor(x.minutes / k), extra = x.minutes - base * k;
        for (let i = 0; i < k; i++) {
            const pts = per(x.points, i);
            out.push({ ...x, name: i ? `${x.name}（续）`.slice(0, 30) : x.name, minutes: base + (i < extra ? 1 : 0), items: per(x.items, i),
                points: pts.length ? pts : ["接着上一段的题，学生自己做，老师看着纠错"] });
        }
    }
    o.sections = out.map((x, i) => ({ ...x, id: `s${i + 1}` }));
    return o;
}
// 模型排的分钟数加起来常常不等于课时：差额按比例分到练题的环节上（默写、回顾这类固定环节不动）
export function fitMinutes(o, minutes) {
    const typed = o.sections.filter((x) => x.type && x.minutes > 0);
    const tot = o.sections.reduce((a, x) => a + x.minutes, 0), base = typed.reduce((a, x) => a + x.minutes, 0);
    if (!base || tot === minutes) return o;
    let left = minutes - tot;
    const share = left;
    for (const x of typed) { const d = Math.round(share * x.minutes / base); x.minutes = Math.max(1, x.minutes + d); left -= d; }
    typed.sort((a, b) => b.minutes - a.minutes)[0].minutes += left;   // 取整剩下的给最长的环节
    return o;
}
export function outlineText(o) {
    return [
        `标题：${o.title}`,
        `依据：${Object.entries(o.basis || {}).map(([k, v]) => `${k}：${v}`).join("；")}`,
        `根据前几次课的调整：${(o.adjust || []).join("；") || "（无）"}`,
        `教学目标：${(o.goals || []).join("；")}`,
        `环节：`,
        ...(o.sections || []).map((x, i) => `${i + 1}. [${x.id}] ${x.name}（${x.minutes} 分钟${x.type ? "，" + x.type : ""}${x.items.length ? "；用题 " + x.items.join("、") : ""}）${x.points.map((t) => "\n   - " + t).join("")}`),
        `课后作业：${(o.homework || []).join("；")}`,
        `下次课观察点：${(o.watch || []).join("；")}`,
    ].join("\n");
}

// 教案模板（MAT-502）：一组有顺序的小节。kind：basis 四维依据 / flow 课堂流程表 / types 分题型讲解（每个带题型的环节一个 ### 小节）/ text 普通
// 内置模板在 demo/rules.json 的 planTemplates，老师自建的存在浏览器里；页面把整个模板传过来，这里只认合法的字段
const KINDS = ["basis", "flow", "types", "text"];
export function cleanTemplate(t) {
    const used = new Set();   // 四维依据、流程表、分题型讲解各只能有一节，多出来的当普通小节
    const secs = (Array.isArray(t?.sections) ? t.sections : []).slice(0, 10).map((x) => ({ title: clip(x?.title, 16).replace(/[#\n]/g, ""), kind: KINDS.includes(x?.kind) ? x.kind : "text", hint: clip(x?.hint, 80) }))
        .filter((x) => x.title).map((x) => { if (x.kind !== "text" && used.has(x.kind)) x.kind = "text"; used.add(x.kind); return x; });
    if (!t || typeof t !== "object") return null;
    const free = !!t.free || !secs.length;   // 一节都没定的模板就是自由结构（复制「自由结构」后取消「不定小节」也一样）
    return { name: clip(t.name, 16), sections: secs, length: t.length === "short" ? "short" : "normal", visual: !!t.visual, free };
}
const KIND_RULE = {
    basis: "四行，分别以「**年级**」「**学校**」「**学生**」「**老师**」开头，照大纲的依据写",
    flow: "表格：时间 | 环节 | 内容 | 用题；时间按大纲的分钟数累加，写成 0–10 这样的区间",
    types: "大纲里每个带题型的环节一个 ### 小节，标题写「环节名（N 分钟）」",
};
const DEFAULT_TEMPLATE = { sections: [
    { title: "设计依据", kind: "basis", hint: "" }, { title: "根据前几次课的调整", kind: "text", hint: "照大纲；没有就写「第一次课，没有记录」" },
    { title: "教学目标", kind: "text", hint: "" }, { title: "课堂流程", kind: "flow", hint: "" }, { title: "分题型讲解", kind: "types", hint: "" },
    { title: "课后作业", kind: "text", hint: "" }, { title: "下次课观察点", kind: "text", hint: "" }], length: "normal", visual: false };
const templateLines = (t) => t.sections.map((x) => { const r = [KIND_RULE[x.kind], x.hint].filter(Boolean).join("；"); return `## ${x.title}${r ? `（${r}）` : ""}`; }).join("\n");
// 彩色视觉版（注意力容易分散的学生，或者老师选了彩色模板）：页面和 Word 会把 ==词== 画成高亮，题型按颜色区分
export const VISUAL_RULES = `- 这是彩色视觉版，给注意力容易分散的学生用：线索词、关键词、易错点用 ==词== 标出来（每节 3–6 处，只标英文单词或短语、中文关键词，别标整句）；
  每个讲解环节开头单独一行「🎯 这 N 分钟：……」写一个看得见的小目标；解题步骤写成 ①②③；时态题加一行时间轴（用 → 连起几个时间点）。`;

// 第二步：按老师确认过的大纲写完整教案（Markdown，流式）
export function planMessages(p, items) {
    const tpl = p.template || DEFAULT_TEMPLATE, extrasSec = p.outline.sections.find((x) => x.extras?.length);
    const sys = `你是无锡初中英语老师的备课助手，按老师确认、修改过的大纲把一次课的教案写完整。

${FOUR}

规则：
- 严格按大纲：环节、顺序、分钟数、用题都不改；大纲里每条要点都要写到，展开成具体的讲法。大纲是老师改过的，和档案不一致时以大纲为准。
- 大纲里的依据、目标是排大纲时写的，老师之后可能改过环节和分钟：说到分钟数、占比，一律以大纲环节里的分钟数为准，不要照抄依据里的旧数字。
${tpl.sections.some((x) => x.kind === "basis") ? `- 「${tpl.sections.find((x) => x.kind === "basis").title}」写每一维怎么影响了这节课，不要解释占比是怎么算出来的，也不要写来源百分比。几条依据真有冲突时才加一句怎么取舍的，没有冲突就不写。
` : ""}- 教案是给老师上课用的：不要在里面复述这些写作规则（比如「不照抄」「不推测」「以大纲为准」）。
${extrasSec ? `- 大纲里「${extrasSec.name}」这一环节的讲解由系统直接拼进教案：流程表里照常列这一行，但不要为它写讲解小节，也不要在别处展开这些条目。
` : ""}${CITE}
- 每个题型的讲解要具体：这几道题考什么、这个学生容易错在哪、照老师的讲题习惯怎么讲。
${tpl.sections.length && !tpl.free ? `- 用 Markdown，照老师选的教案模板${tpl.name ? `「${tpl.name}」` : ""}，二级标题就用下面这些、按这个顺序，不多不少：
# 标题（用大纲的标题）
${templateLines(tpl)}` : `- 用 Markdown，结构不限：按大纲和这节课的需要自己组织，第一行 # 标题（用大纲的标题），每一部分用 ## 二级标题分开${tpl.sections.length ? `；可以参考这些小节，但不必照搬：${tpl.sections.map((x) => x.title).join("、")}` : ""}。`}
${p.planNote ? `- 老师对这份教案的要求（优先照这个来，和上面冲突时以这里为准）：${p.planNote}\n` : ""}${p.visual ? VISUAL_RULES + "\n" : ""}- 简体中文，具体，不写空话套话，全文 ${tpl.length === "short" ? "500–900" : "1000–1800"} 字。`;
    const lines = [...materials(p), `【大纲（老师确认过）】\n${outlineText(p.outline)}`, `【例题和练习】`,
        ...items.map((it) => `${itemLine(it, 900)}\n解析要点：${clip(it.explain.replace(/【[^】]*】/g, " "), 200)}`)];
    return [{ role: "system", content: sys }, { role: "user", content: lines.join("\n") }];
}

// ---------- 聊天：老师在右下角和 agent 商量，agent 回话并给出修改 ----------
const CHAT_OPS = {
    setup: `- {"op":"set_share","type":"题型","share":0 到 0.6} 调这个题型的占比，其他题型按比例让出
- {"op":"set_guidance","text":"这次课的要求"} 改写「这次课的要求」（整段替换）
- {"op":"set_level","level":"统考|不统考|不知道"} 这场考试用谁的卷子
- {"op":"set_kind","kind":"单元|月考/阶段|期中|期末|中考模拟|中考"} 下一场考试的类型`,
    outline: `- {"op":"set_minutes","sec":"环节编号，如 s2","minutes":分钟}
- {"op":"edit_section","sec":"环节编号","name":"新名字（可省）","type":"题型（可省）","points":["新的要点，整组替换（可省）"]}
- {"op":"add_section","after":"插在哪个环节后面，放最前面就写空字符串","name":"","minutes":0,"type":"","items":[],"points":[]}
- {"op":"remove_section","sec":"环节编号"}
- {"op":"move_section","sec":"环节编号","after":"移到哪个环节后面，放最前面就写空字符串"}
- {"op":"set_items","sec":"环节编号","items":["E1","E3"]} 这个环节用哪几道题，整组替换
- {"op":"find_items","sec":"环节编号","type":"题型","query":"要找什么样的题，比如「环保话题的阅读，考推理判断」","n":1 到 3} 从题库再找题，找到的自动加进这个环节
- {"op":"edit_meta","field":"title|goals|homework|watch|adjust","value":"title 给字符串，其他给字符串数组（整组替换）"}`,
    plan: `- {"op":"replace_section","title":"要替换的那一节的标题行原文，比如「### 阅读理解（30 分钟）」「## 课后作业」","md":"整节新内容，第一行就是标题行"}
- {"op":"find_items","type":"题型","query":"要找什么样的题","n":1 到 3} 从题库再找题；找到以后系统会把新题号告诉你，你再用 replace_section 写进去`,
};
export const CHAT_OP_NAMES = {
    setup: ["set_share", "set_guidance", "set_level", "set_kind"],
    outline: ["set_minutes", "edit_section", "add_section", "remove_section", "move_section", "set_items", "find_items", "edit_meta"],
    plan: ["replace_section", "find_items"],
};
export function chatMessages(p) {
    const what = { setup: "这节课的设置（下一场考试、出卷来源、各题型占比、这次课的要求）", outline: "教案大纲", plan: "教案" }[p.stage];
    const sys = `你是英语家教老师的备课 agent，正在和老师一起改${what}。根据老师的话回复；要改的，同时给出修改。只输出一个 JSON 对象：
{"reply": "给老师的回复，口语、简短（150 字以内），说清改了什么、为什么，或者直接回答问题",
 "ops": [修改，没有就给空数组],
 "memory": [要写进长期记忆的，没有就给空数组]}

能用的修改：
${CHAT_OPS[p.stage]}

memory 的格式：{"op":"add|update|delete","who":"teacher|student","id":"update / delete 时填已有编号","cat":"分类","text":"30 字以内","qtype":"","kp":"","strength":null,"evidence":"依据，40 字以内","why":"30 字以内"}。分类：学生用 薄弱点 / 已掌握 / 学习习惯 / 状态 / 目标；老师用 讲题习惯 / 课堂结构 / 偏好。只有老师说了以后还用得上的话（「以后都…」「我习惯…」「这个学生其实…」）才写 memory，一次性的要求不写。
${SET_OPS}

规则：
- 老师只是提问就只回答，ops 给空数组；要改才给 ops，改动要和 reply 里说的一致，没做的事不要说做了。reply 里说环节名，不说 s2 这种编号。
- 用 find_items 找新题时，这一轮还不知道新题号，reply 里说「先去题库找」就行；找到以后系统会再告诉你新题号，那时再换掉旧题。
- 改分钟数时，各环节加起来要等于课时；需要的话同时调别的环节，并在 reply 里说。
- 例题只能用材料里已有的 E 编号；要新题就用 find_items，不要编题。
- 写教案正文的规则照旧：关键设计标依据 [S2]、[T1]、[考]、[校]，例题按编号引用，不抄题目原文。${p.visual ? "\n" + VISUAL_RULES : ""}
- 题型只能从这些里选：${TYPES.join("、")}。`;
    const st = p.student, at = attnLine(st.attention);
    const lines = [
        `【学生】${clip(st.name, 10)}，${clip(st.gradeLabel, 30)}，${clip(st.schoolLabel, 40)}`,
        st.profile ? `【学生画像（老师拖光谱填的，0–100）】${clip(st.profile, 500)}` : "",
        `【学生档案】\n${p.studentMems.map(memLine).join("\n") || "（空）"}`,
        `【老师档案】\n${p.teacherMems.map(memLine).join("\n") || "（空）"}`,
        `【老师设置】${settingsLine(p.settings, p.minutes)}${at ? "\n【学生特点】" + at : ""}`,
        `【下一场考试】${clip(p.examLabel, 80)}；课时 ${p.minutes} 分钟`,
        `【当前占比】${(Array.isArray(p.mix) ? p.mix : []).slice(0, 14).map((m) => `${clip(m.type, 10)} ${Math.round(+m.share * 100)}%`).join("、") || "（无）"}`,
        `【这次课的要求】${clip(p.guidance, 300) || "（没有）"}`,
        p.stage === "outline" ? `【当前大纲】\n${outlineText(p.outline)}` : "",
        p.stage === "plan" ? `【当前教案】\n${String(p.plan || "").slice(0, 6000)}` : "",
        p.items.length ? `【例题和练习】\n${p.items.map((it) => itemLine(it, 220)).join("\n")}` : "",
        `【最近的对话】\n${(Array.isArray(p.history) ? p.history : []).slice(-8).map((m) => `${m.role === "user" ? "老师" : "你"}：${clip(m.content, 400)}`).join("\n") || "（刚开始）"}`,
        `【老师刚说】${clip(p.message, 600)}`,
    ].filter(Boolean);
    return [{ role: "system", content: sys }, { role: "user", content: lines.join("\n") }];
}

// 改教案里的一节：老师写一句要求（或换了例题），只重写这一节
export function sectionMessages(p) {
    const sys = `你在帮老师改一份英语教案里的一节。只输出改好的这一节 Markdown：第一行原样保留这一节的标题行，后面是新的内容；不要输出别的节，不要加说明。
规则和写整份教案时一样：关键设计后面用方括号标依据（[S2]、[T1]、[考]、[校]），只引用材料里有的编号；例题只用材料里给的 E 编号，不自己出题、不抄题目原文；简体中文，具体，不写空话。
老师这次的修改要求优先；没有提到的地方尽量保持原样，篇幅和原来差不多。${p.planNote ? `\n老师对整份教案的要求：${p.planNote}` : ""}${p.visual ? "\n" + VISUAL_RULES : ""}`;
    const lines = [
        `【学生】${clip(p.student?.name, 10)}，${clip(p.student?.gradeLabel, 30)}`,
        `【学生档案】\n${p.studentMems.map(memLine).join("\n") || "（空）"}`,
        `【老师档案】\n${p.teacherMems.map(memLine).join("\n") || "（空）"}`,
        `【整份教案（供参照，别改别的节）】\n${clip(p.plan, 3500)}`,
        `【例题和练习】`,
        ...p.items.map((it) => itemLine(it, p.focus.includes(it.code) ? 900 : 160)),
        `【要改的这一节】\n${String(p.section || "").slice(0, 3000)}`,
        `【老师的修改要求】${clip(p.instruction, 200)}`,
    ];
    return [{ role: "system", content: sys }, { role: "user", content: lines.join("\n") }];
}

// 改老师设置、学生注意力的 op（记忆和聊天共用）
const SET_OPS = `另外两种改法：老师说到课堂设置的长期变化（「以后一次课 90 分钟」「默写改成 15 分钟」「作业别超过 20 分钟」），用 {"op":"set","who":"teacher","field":"字段","value":值,"why":"30 字以内"} 改【老师设置】，不要再写成一条老师记忆。字段：lessonType（一对一 / 小班）、minutes（一次课分钟）、perWeek（每周几次）、dictation（开头默写分钟）、recap（结尾回顾分钟）、extrasMinutes（课外知识补充分钟，0 是不加）、focusTypes（一节课主攻几个题型，0 / 2 / 3 / 4，0 是不限）、fullPaper（考前最后一节做 / 不做整卷）、homeworkMinutes（作业分钟上限）、homeworkScope（只练薄弱点 / 全面练）、difficulty（不限 / 偏易 / 适中 / 偏难）。
说到学生走神、坐不住、注意力不集中，用 {"op":"set","who":"student","field":"attention","value":"容易分心","why":""}；说到现在能坐住了、很专注，改成「一般」或「集中」。`;

export function memoryMessages(p, kpByType) {
    const sys = `你是一位英语家教老师的 personal agent，替老师维护两份长期记忆：老师档案（编号 T 开头）和当前学生的档案（编号 S 开头）。
老师刚交给你一条记录（课后记录、随口交代、对教案的反馈）。把它变成对记忆的增删改，只输出一个 JSON 对象：

{"ops": [{"op": "add|update|delete", "who": "student|teacher", "id": "update / delete 时填已有编号，add 不填",
  "cat": "分类", "text": "这条记忆本身，一句话，30 字以内", "qtype": "题型或空字符串", "kp": "考点或空字符串",
  "strength": 0 到 1 的数或 null, "evidence": "从记录里摘的依据，40 字以内", "why": "为什么这样改，30 字以内"}],
 "log": {"summary": "这条记录一句话总结", "covered": ["讲了什么"], "errors": [{"qtype": "", "kp": "", "note": ""}]}}

分类：学生用 薄弱点 / 已掌握 / 学习习惯 / 状态 / 目标；老师用 讲题习惯 / 课堂结构 / 偏好。

规则：
1. 只把以后还用得上的写进记忆：学生稳定的弱项、习惯、目标；老师明确说「以后都…」「我习惯…」「别再…」的做法，或者【最近的调整】里反复出现的同一方向。一次性的事只写进 log。
2. 先对照已有记忆：同一件事用 update（合并措辞、调 strength），不要重复 add；新信息和旧记忆矛盾时 update 或 delete 旧的，why 里说清楚。
3. 薄弱点的 strength 表示有多薄弱：第一次出现给 0.5；这次又错了在原值上加 0.15–0.25；这次做对了、有进步就往下调 0.2–0.3，但只做好一次不要删。老师说已经掌握，或者这条薄弱点的依据里已经记过一次做好、这次又做好了，才 delete 它，并 add 一条「已掌握」。其他分类 strength 给 null。
4. qtype 只能从这些里选：${TYPES.join("、")}，或空字符串。kp（ops 和 log.errors 里都一样）必须从这个题型的考点表里选，表里都不合适才写新的：${Object.entries(kpByType).map(([t, ks]) => `${t}：${ks.join("、")}`).join("；")}。
5. 对这一份教案的一次性意见（比如「这次阅读太多了」）只进 log；但如果和【最近的调整】方向一致、已经出现两次以上，就当作老师的偏好写进老师档案。
6. 记录里没提到的不要编；没有要改的，ops 给空数组。
7. ${SET_OPS}`;
    const lines = [
        `【今天】${clip(p.date, 10)}`,
        `【学生】${clip(p.student?.name, 10)}，${clip(p.student?.gradeLabel, 30)}${ATTN.includes(p.student?.attention) ? `；注意力：${p.student.attention}` : ""}`,
        `【学生档案】\n${p.studentMems.map(memLine).join("\n") || "（空）"}`,
        `【老师档案】\n${p.teacherMems.map(memLine).join("\n") || "（空）"}`,
        `【老师设置】${settingsLine(p.settings)}`,
        `【最近的调整】${(Array.isArray(p.observations) ? p.observations : []).slice(-6).map((o) => clip(o, 80)).join("；") || "（无）"}`,
        `【这条记录】${clip(p.text, 1000)}`,
    ];
    return [{ role: "system", content: sys }, { role: "user", content: lines.join("\n") }];
}

// 老师上传一份自己写的 Word 教案（页面用 mammoth 抽出文字），抽出小节结构做成模板
export function templateMessages(text) {
    const sys = `老师上传了一份自己以前写的英语教案，把它的小节结构抽出来，做成以后生成教案用的模板。只输出一个 JSON 对象：
{"name": "模板名，8 字以内，比如「机构格式」", "sections": [{"title": "小节标题，原文的说法，12 字以内", "kind": "basis|flow|types|text", "hint": "这一节写什么，从原教案里看出来的写法要求，40 字以内"}]}
kind：教学过程、课堂流程这类按时间排环节的表格写 flow；按题型 / 环节逐个展开讲解的写 types；「设计依据」「学情分析」这类说明为什么这样设计的写 basis（最多一节）；教学目标、重难点、板书、作业、反思等其他小节一律写 text。flow、types、basis 各最多一节。
按原教案的顺序，最多 10 节；只要结构，不要抄原教案的具体内容。教案标题本身不算一节。`;
    return [{ role: "system", content: sys }, { role: "user", content: String(text).slice(0, 4000) }];   // 不用 clip：要留着换行，模型才看得出标题和表格行
}

// 建档（MAT-508）：老师贴一大段话（家长的话、聊天记录、自己的印象），抽成档案字段、画像维度和几条初始记忆，老师核对后再建档。
// 维度定义由页面传来（web/memory.js 的 DIMS），这里只认传来的 key；学校名原样返回，页面去全市学校表里对
export function intakeMessages(text, dims) {
    const sys = `老师要给一个初中学生建英语家教档案，贴了一段关于这个学生的话（家长的话、聊天记录、老师自己的印象都可能）。把能确定的字段抽出来，只输出一个 JSON 对象：
{"name": "学生的称呼，原文没有就空字符串", "grade": 7 或 8 或 9 或 null（初一 = 七年级 = 7）, "term": "上" 或 "下" 或 null,
 "school": "学校名，尽量写全称并带上原文提到的校区（锡外 → 无锡外国语学校，省锡中 → 江苏省锡山高级中学实验学校）；没提就空字符串",
 "district": "所在区：梁溪区 / 锡山区 / 惠山区 / 滨湖区 / 新吴区 / 经开区 / 江阴市 / 宜兴市，没提就空字符串",
 "progress": {"unit": 学到第几单元（整数）, "stage": "刚开始|学到一半|快学完|学完"} 或 null（「刚学完第四单元」是 unit 4、学完）,
 "dims": [{"key": "维度 key", "value": 0 到 100 的整数, "quote": "原文依据，30 字以内"}],
 "notes": [{"cat": "薄弱点|已掌握|学习习惯|状态|目标", "text": "一句话，30 字以内", "qtype": "题型或空字符串", "quote": "原文依据，40 字以内"}],
 "missing": "原文没提、建档最好补上的信息，30 字以内（写了学校就不算缺所在区，区会按学校自动带出）"}

维度（0 是左端，100 是右端，50 是一般）：
${dims.map((d) => `- ${d.key}：${d.label}（0 ${d.lo} ↔ 100 ${d.hi}）`).join("\n")}

规则：
1. 只抽原文说到的：没依据的字段留空或 null，没依据的维度不给，不要猜。每个维度、每条 notes 都要有原文依据。
2. 维度值按原文的程度给：「特别」「完全」靠两端（10 或 90 左右），「有点」「比较」给 30 或 70 左右，「还行」给 50。
3. notes 放维度表达不了的具体信息：哪类题常错、哪类已经稳了、目标分数、性格和状态。最多 8 条；维度里已经有的不要再写一遍。
4. qtype 只能从这些里选：${TYPES.join("、")}，或空字符串。`;
    return [{ role: "system", content: sys }, { role: "user", content: String(text).slice(0, 3000) }];
}
const INTAKE_CATS = ["薄弱点", "已掌握", "学习习惯", "状态", "目标"];
export function cleanIntake(d, keys) {
    if (!d || typeof d !== "object") return null;
    const int = (v, lo, hi) => (v == null || v === "" || !Number.isFinite(+v) ? null : Math.max(lo, Math.min(hi, Math.round(+v))));
    const seen = new Set(), unit = int(d.progress?.unit, 1, 8);
    return {
        name: clip(d.name, 10), grade: [7, 8, 9].includes(+d.grade) ? +d.grade : null, term: ["上", "下"].includes(d.term) ? d.term : null,
        school: clip(d.school, 30), district: clip(d.district, 6),
        progress: unit ? { unit, stage: ["刚开始", "学到一半", "快学完", "学完"].includes(d.progress.stage) ? d.progress.stage : "学到一半" } : null,
        dims: (Array.isArray(d.dims) ? d.dims : []).filter((x) => keys.includes(x?.key) && int(x.value, 0, 100) != null && !seen.has(x.key) && seen.add(x.key))
            .map((x) => ({ key: x.key, value: int(x.value, 0, 100), quote: clip(x.quote, 40) })),
        notes: (Array.isArray(d.notes) ? d.notes : []).filter((x) => INTAKE_CATS.includes(x?.cat) && clip(x.text, 60)).slice(0, 8)
            .map((x) => ({ cat: x.cat, text: clip(x.text, 60), qtype: TYPES.includes(x.qtype) ? x.qtype : "", quote: clip(x.quote, 60) })),
        missing: clip(d.missing, 40),
    };
}

// ---------- 限流（同第二大脑：Upstash Redis 计数，没配就用函数内存） ----------
const RURL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const RTOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const today = () => new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);
const mem = { day: "", m: new Map() };
export async function hit(ip, action, perIp) {
    const d = today(), k = `en:${d}:${action}:${ip}`, g = `en:${d}:all`;
    let n, total;
    try {
        if (!RURL) throw 0;
        const r = await fetch(`${RURL}/pipeline`, {   // 计数请求不重试（会多记一次），失败了下面退回内存计数
            method: "POST", headers: { Authorization: `Bearer ${RTOKEN}`, "Content-Type": "application/json" }, signal: AbortSignal.timeout(3000),
            body: JSON.stringify([["INCR", k], ["EXPIRE", k, 172800], ["INCR", g], ["EXPIRE", g, 172800]]),
        });
        [n, , total] = (await r.json()).map((x) => x.result);
    } catch {
        if (mem.day !== d) { mem.day = d; mem.m.clear(); }
        mem.m.set(k, (n = (mem.m.get(k) || 0) + 1)); mem.m.set(g, (total = (mem.m.get(g) || 0) + 1));
    }
    const GLOBAL = Number(process.env.EN_GLOBAL_DAILY ?? 400);
    return { ok: n <= perIp && total <= GLOBAL, left: Math.max(0, perIp - n), global: total > GLOBAL };
}
