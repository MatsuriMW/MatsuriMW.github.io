// 向量和重排接口：硅基流动国内站（siliconflow.cn），bge-m3 和 bge-reranker-v2-m3 免费
// 国际站（siliconflow.com）的 key 不通用，也没有 bge-m3；要换站点或模型就设 SF_BASE / EMBED_MODEL / RERANK_MODEL
// 返回 L2 归一化后的 Float32Array
const BASE = process.env.SF_BASE || "https://api.siliconflow.cn/v1";
export const EMBED_MODEL = process.env.EMBED_MODEL || "BAAI/bge-m3";
export const RERANK_MODEL = process.env.RERANK_MODEL || "BAAI/bge-reranker-v2-m3";
export const DIMS = 1024;
// bge-m3 是对称的，问题和块直接算；Qwen3-Embedding 是非对称的，问题要带任务说明
const QUERY_INSTRUCT = "Instruct: Given a question, retrieve passages from a personal Chinese note vault that answer it\nQuery: ";
const norm = (v) => { let s = 0; for (const x of v) s += x * x; s = Math.sqrt(s) || 1; return Float32Array.from(v, (x) => x / s); };

export async function embed(texts, { query = false, key = process.env.SILICONFLOW_API_KEY, signal } = {}) {
    const r = await fetch(`${BASE}/embeddings`, {
        method: "POST", signal,
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: EMBED_MODEL, input: query && EMBED_MODEL.startsWith("Qwen/") ? texts.map((t) => QUERY_INSTRUCT + t) : texts, ...(EMBED_MODEL.startsWith("Qwen/") ? { dimensions: DIMS } : {}), encoding_format: "float" }),
    });
    if (!r.ok) throw new Error(`siliconflow embeddings ${r.status} ${await r.text()}`);
    return (await r.json()).data.sort((a, b) => a.index - b.index).map((d) => norm(d.embedding));
}

// 重排：问题和每个候选成对打分，返回 [{index, score}]，score 在 0–1
export async function rerank(query, docs, { key = process.env.SILICONFLOW_API_KEY, signal } = {}) {
    const r = await fetch(`${BASE}/rerank`, {
        method: "POST", signal,
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: RERANK_MODEL, query, documents: docs, return_documents: false }),
    });
    if (!r.ok) throw new Error(`siliconflow rerank ${r.status} ${await r.text()}`);
    return (await r.json()).results.map((x) => ({ index: x.index, score: x.relevance_score }));
}
