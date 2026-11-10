// 问答缓存（MAT-603）：两级。
//   L1：进程内存（本机就是这个服务；线上是每个热着的函数实例），最多 300 条，先进先出
//   L2：全站共享，本机 data/cache.json，线上 Upstash（pol:cache:*），2 天过期
// 缓存三样：问题向量（vec）、重排结果（rr）、通过校验的 RAG 回答（ans，连同当时的检索、分数、校验，页面照样能展示轨迹）。
// 规则路、人工路本来就 0 token，不缓存；评测（dry）、篡改演示不读也不写。
// 失效靠键：答案的键里有规范化问题、身份、角色、当天日期、索引版本（导入修订、改内部资料都会重打包）、提示词版本、生成模型、门槛，
// 任何一项变了键就对不上，旧条目放着等过期；被员工打 Bad 的回答当场从两级里删掉，下次重新生成。
import crypto from "node:crypto";
import { kvGet, kvSet, kvDel } from "./store.mjs";

const L1 = new Map(), L1_MAX = 300, TTL = 2 * 86400;
const sha = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 24);
// 规范化：去空白、全角半角问号统一、去掉句末标点。「年假 有几天?」和「年假有几天？」算同一问
export const normQ = (q) => String(q).replace(/\s+/g, "").replace(/\?/g, "？").replace(/[？。！!，,]+$/u, "");
export const key = (kind, parts) => `${kind}:${sha(JSON.stringify(parts))}`;

function l1Set(k, v) { L1.delete(k); L1.set(k, v); if (L1.size > L1_MAX) L1.delete(L1.keys().next().value); }
// 返回 { v, level: "L1" | "L2" } 或 null
export async function get(k) {
    if (L1.has(k)) return { v: L1.get(k), level: "L1" };
    try {
        const v = await kvGet(k);
        if (v != null) { l1Set(k, v); return { v, level: "L2" }; }
    } catch (e) { console.warn("缓存 L2 读失败，当作没命中：", e.message); }
    return null;
}
export async function set(k, v) {
    l1Set(k, v);
    try { await kvSet(k, v, TTL); } catch (e) { console.warn("缓存 L2 写失败：", e.message); }
}
export async function del(k) {
    L1.delete(k);
    try { await kvDel(k); } catch (e) { console.warn("缓存 L2 删失败：", e.message); }
}
export const l1Size = () => L1.size;

// 向量存成 base64，L2 里一条 4KB
export const packVec = (v) => Buffer.from(new Float32Array(v).buffer).toString("base64");
export const unpackVec = (s) => { const b = Buffer.from(s, "base64"); return new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); };
