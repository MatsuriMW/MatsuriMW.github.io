// 限流：每个 IP 每天 PER_IP 次、全站每天 GLOBAL 次，按北京时间零点清零
// 计数放 Upstash Redis（Vercel Marketplace 开的，env 是 KV_REST_API_URL / KV_REST_API_TOKEN），多个函数实例、实例重启都算同一份
// 没配 Redis（本地预览）退回函数内存计数
export const PER_IP = Number(process.env.PER_IP_DAILY ?? 5);
const GLOBAL = Number(process.env.GLOBAL_DAILY ?? 300);
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const today = () => new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);
const TTL = 2 * 86400;   // 多留一天，跨零点的请求不会撞上刚过期的键

async function redis(cmds) {
    const r = await fetch(`${URL_}/pipeline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify(cmds),
        signal: AbortSignal.timeout(3000),
    });
    if (!r.ok) throw new Error(`redis ${r.status}`);
    return (await r.json()).map((x) => x.result);
}

const mem = { day: "", total: 0, counts: new Map() };
function memHit(ip) {
    const d = today();
    if (d !== mem.day) { mem.day = d; mem.total = 0; mem.counts.clear(); }
    const n = (mem.counts.get(ip) || 0) + 1;
    mem.counts.set(ip, n); mem.total++;
    return [n, mem.total];
}

// 记一次，返回 { ok, left }：先加再判，超了的那次也算进去，刷得越凶越早被挡
export async function hit(ip) {
    let n, total;
    if (URL_ && TOKEN) {
        const d = today(), k = `rag:${d}:ip:${ip}`, g = `rag:${d}:all`;
        try { [n, , total] = await redis([["INCR", k], ["EXPIRE", k, TTL], ["INCR", g], ["EXPIRE", g, TTL]]); }
        catch { [n, total] = memHit(ip); }   // Redis 挂了不让问答整个停掉，退回内存兜底
    } else [n, total] = memHit(ip);
    return { ok: n <= PER_IP && total <= GLOBAL, left: Math.max(0, PER_IP - n), global: total > GLOBAL };
}
