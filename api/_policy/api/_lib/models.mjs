// 三个云端模型调用（向量、重排、生成）都走这里，顺带录制和回放。
// 平时：照常调接口，并把结果录进 data/replay.json；REPLAY=1：完全不联网，只从录制里取，取不到就报错。
// 这样断网时整条流水线照样跑，路由、校验、工单都是真逻辑，只有模型结果是录好的。
import fs from "node:fs";
import crypto from "node:crypto";
import { embed, rerank, EMBED_MODEL, RERANK_MODEL } from "./embed.mjs";

export const REPLAY = process.env.REPLAY === "1";
const RECORD = !process.env.VERCEL;   // 线上函数没有可写磁盘，也不需要录制
export const GEN_MODEL = "deepseek-chat";
const FILE = new URL("../../data/replay.json", import.meta.url);
const hash = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 16);

let store = null;
function load() {
    if (!store) {
        try { store = RECORD ? JSON.parse(fs.readFileSync(FILE, "utf8")) : {}; } catch { store = {}; }
        for (const k of ["embed", "rerank", "gen"]) store[k] ||= {};
    }
    return store;
}
function save() {
    if (!RECORD) return;
    fs.mkdirSync(new URL("../../data/", import.meta.url), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(load()));
}
export class ReplayMiss extends Error {
    constructor(what) { super(`回放模式下没有录到这一步（${what}），请换一道演示脚本里的问题`); }
}

export async function embedQuery(text, { signal } = {}) {
    const S = load();
    if (REPLAY) {
        const v = S.embed[text];
        if (!v) throw new ReplayMiss("向量");
        return Float32Array.from(v);
    }
    const [v] = await embed([text], { query: true, signal });
    S.embed[text] = Array.from(v, (x) => +x.toFixed(5));
    save();
    return v;
}

export async function rerankDocs(query, docs, { signal } = {}) {
    const S = load(), k = hash(query + "\u0001" + docs.join("\u0001"));
    if (REPLAY) {
        if (!S.rerank[k]) throw new ReplayMiss("重排");
        return S.rerank[k];
    }
    const r = await rerank(query, docs, { signal });
    S.rerank[k] = r;
    save();
    return r;
}

// DeepSeek 流式生成：逐段 yield 文字，最后 yield {usage, model}
export async function* generate(messages, { signal, key = process.env.DEEPSEEK_API_KEY } = {}) {
    const S = load(), k = hash(JSON.stringify(messages));
    if (REPLAY) {
        const g = S.gen[k];
        if (!g) throw new ReplayMiss("生成");
        for (const piece of g.text.match(/[\s\S]{1,6}/g) || []) { await new Promise((r) => setTimeout(r, 25)); yield piece; }
        yield { usage: g.usage, model: g.model };
        return;
    }
    const r = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST", signal,
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: GEN_MODEL, messages, stream: true, temperature: 0.1, max_tokens: 700, stream_options: { include_usage: true } }),
    });
    if (!r.ok) throw new Error(`deepseek ${r.status} ${(await r.text()).slice(0, 200)}`);
    const dec = new TextDecoder();
    let buf = "", text = "", usage = null, model = GEN_MODEL;
    for await (const chunk of r.body) {
        buf += dec.decode(chunk, { stream: true });
        let nl;
        while ((nl = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (data === "[DONE]") continue;
            const j = JSON.parse(data);
            if (j.model) model = j.model;
            const d = j.choices?.[0]?.delta?.content;
            if (d) { text += d; yield d; }
            if (j.usage) usage = j.usage;
        }
    }
    S.gen[k] = { text, usage, model };
    save();
    yield { usage, model };
}

export const MODELS = { embed: EMBED_MODEL, rerank: RERANK_MODEL, gen: GEN_MODEL };
