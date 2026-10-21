// POST /api/ask  { q }  →  text/event-stream
// 事件：trace（检索过程）→ delta（回答片段，多次）→ done（用时和 token）；出错发 error
import { retrieve, buildMessages, generate, loadIndex } from "./_lib/pipeline.mjs";
import { hit, PER_IP } from "./_lib/limit.mjs";

const cache = new Map();   // 同一个问题当天直接回放（示例问题会被反复点）；回放也算一次，免得爬虫换着示例题把答案扒走

export async function POST(request) {
    let q = "";
    try { q = String((await request.json()).q || "").trim().slice(0, 300); } catch {}
    if (q.length < 2) return Response.json({ error: "问题太短" }, { status: 400 });
    const h = request.headers;
    const ip = h.get("x-real-ip") || (h.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
    const lim = await hit(ip);
    const left = { "X-RateLimit-Limit": String(PER_IP), "X-RateLimit-Remaining": String(lim.left) };
    if (!lim.ok) return Response.json({ error: lim.global ? "今天全站的提问额度用完了，明天再来" : `今天的提问次数用完了（每人每天 ${PER_IP} 次），明天再来` }, { status: 429, headers: left });
    const cached = cache.get(q);

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
    return new Response(stream, { headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no", ...left } });
}

// GET /api/ask：健康检查 + 语料规模，页面加载时用来显示「库里有多少块」
export async function GET() {
    const idx = loadIndex();
    const by = {};
    for (const b of idx.blocks) by[b.folder] = (by[b.folder] || 0) + 1;
    return Response.json({ blocks: idx.blocks.length, folders: by, built: idx.meta.built });
}
