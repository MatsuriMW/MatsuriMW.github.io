// POST /api/ask  { q }  →  text/event-stream
// 事件：trace（检索过程）→ delta（回答片段，多次）→ done（用时和 token）；出错发 error
import { retrieve, buildMessages, generate, loadIndex } from "./_lib/pipeline.mjs";

const PER_IP = Number(process.env.PER_IP_DAILY ?? 30);       // 每个 IP 每天
const GLOBAL = Number(process.env.GLOBAL_DAILY ?? 600);      // 每个函数实例每天（兜底，防刷爆账单）
const counts = new Map();
let day = "", total = 0;
function allow(ip) {
    const d = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);
    if (d !== day) { day = d; total = 0; counts.clear(); }
    const n = counts.get(ip) || 0;
    if (n >= PER_IP || total >= GLOBAL) return false;
    counts.set(ip, n + 1); total++;
    return true;
}
const cache = new Map();   // 同一个问题当天直接回放（示例问题会被反复点）

export async function POST(request) {
    let q = "";
    try { q = String((await request.json()).q || "").trim().slice(0, 300); } catch {}
    if (q.length < 2) return Response.json({ error: "问题太短" }, { status: 400 });
    const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
    const cached = cache.get(q);
    if (!cached && !allow(ip)) return Response.json({ error: `今天的提问次数用完了（每人每天 ${PER_IP} 次），明天再来` }, { status: 429 });

    const enc = new TextEncoder();
    const stream = new ReadableStream({
        async start(ctl) {
            const send = (event, data) => ctl.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
            try {
                if (cached) {
                    send("trace", cached.trace);
                    for (const piece of cached.answer.match(/[\s\S]{1,12}/g) || []) send("delta", { t: piece });
                    send("done", { ...cached.done, cached: true });
                    return ctl.close();
                }
                const t0 = Date.now();
                const R = await retrieve(q, { signal: request.signal });
                send("trace", R);
                let answer = "", usage = null;
                if (R.refused) { answer = "笔记里没有写到这个。"; send("delta", { t: answer }); }
                else for await (const x of generate(buildMessages(q, R), { signal: request.signal })) {
                    if (typeof x === "string") { answer += x; send("delta", { t: x }); } else usage = x.usage;
                }
                const done = { ms: { ...R.ms, total: Date.now() - t0 }, usage, built: loadIndex().meta.built };
                send("done", done);
                cache.set(q, { trace: R, answer, done });
                if (cache.size > 200) cache.delete(cache.keys().next().value);
            } catch (e) {
                send("error", { message: String(e.message || e).slice(0, 200) });
            }
            ctl.close();
        },
    });
    return new Response(stream, { headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" } });
}

// GET /api/ask：健康检查 + 语料规模，页面加载时用来显示「库里有多少块」
export async function GET() {
    const idx = loadIndex();
    const by = {};
    for (const b of idx.blocks) by[b.folder] = (by[b.folder] || 0) + 1;
    return Response.json({ blocks: idx.blocks.length, folders: by, built: idx.meta.built });
}
