// 接口路由：本机 dev/server.mjs 和线上 api/policy.mjs（Vercel 函数）共用。p 是接口路径，如 /api/ask
import { ask } from "./ask.mjs";
import * as S from "./store.mjs";
import * as P from "./pipeline.mjs";
import { loadRules } from "./rules.mjs";
import { REPLAY, MODELS, generate } from "./models.mjs";

const ipOf = (req) => req.headers["x-real-ip"] || String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "local";
const body = (req) => req.body !== undefined && S.ONLINE ? Promise.resolve(typeof req.body === "object" && req.body ? req.body : {}) : new Promise((r) => { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => { try { r(b ? JSON.parse(b) : {}); } catch { r({}); } }); });
// 写回响应前先把记录存好（线上存 Redis；本机是空操作）
const json = async (res, v, status = 200) => { await S.flush(); res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }); res.end(JSON.stringify(v)); };

// HR 回复草稿（P2）：用工单上附的条款起草一段回复，标明「待确认」，HR 改完才能发。
// 不重新检索：工单没附条款（比如员工只说了「转人工」），就只请员工说明具体问题，不替他猜话题
async function draftFor(t) {
    const ctx = t.clauses || [];
    const sources = ctx.length ? ctx.map((b, k) => `[${k + 1}] ${b.source} ${b.version} ${b.ctx}（第 ${b.page} 页）\n${b.text}`).join("\n\n") : "（没有相关条款）";
    const messages = [
        { role: "system", content: "你是公司 HR，要回复员工转人工的问题。根据下面的手册条款起草一段回复，语气礼貌、简洁（150 字以内）。条款和问题无关时不要引用。手册没写到的内容不要编，直接写「这一点手册没有规定，我核实后再答复您」。员工没说清具体问题时，只请对方说明想咨询什么，不要猜话题。需要员工提供材料或个人信息时，请对方通过系统提交或线下沟通，不要在对话里发送。不要用 Markdown。" },
        { role: "user", content: `手册条款：\n\n${sources}\n\n员工的问题：${t.q}\n转人工原因：${t.reason}` },
    ];
    let text = "";
    for await (const x of generate(messages)) if (typeof x === "string") text += x;
    return text.trim();
}

export async function route(req, res, p) {
    const url = new URL(req.url, "http://localhost"), m = req.method;
    if (p === "/api/ask" && m === "POST") {
        const b = await body(req);
        const lim = await S.hitLimit(ipOf(req));
        if (!lim.ok) return json(res, { error: lim.error }, 429);
        res.writeHead(200, { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" });
        const ac = new AbortController(); res.on("close", () => ac.abort());
        const send = (event, data) => { if (!res.writableEnded) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); };
        await ask(b, send, { signal: ac.signal });
        await S.flush();
        return res.end();
    }
    if (p === "/api/meta") {
        const idx = P.loadIndex();
        const count = {}; for (const b of idx.blocks) count[b.subject] = (count[b.subject] || 0) + 1;
        return json(res, {
            replay: REPLAY, models: MODELS, promptVersion: P.PROMPT_VERSION, gates: { cos: P.CONFIG.minTopCos, fine: P.CONFIG.fineRerank, high: P.CONFIG.highRerank },
            subjects: Object.fromEntries(Object.entries(P.SUBJECTS).map(([k, v]) => [k, { ...v, chunks: count[k] || 0, ...P.staleness(k) }])),
            staleYears: P.STALE_YEARS, reasons: S.REASONS, causes: S.CAUSES, statuses: S.STATUSES, rules: loadRules({ fresh: true }).rules, built: idx.meta.built,
        });
    }
    if (p === "/api/clause") {
        const b = P.loadIndex().blocks.find((x) => x.cid === url.searchParams.get("cid"));
        return b ? json(res, P.showBlock(b)) : json(res, { error: "没有这一条" }, 404);
    }
    if (p === "/api/tickets" && m === "GET") {
        // 每条 HR 回复带上员工最近一次评价，工单详情里显示
        const fb = S.latestFeedback({ includeReplay: true });
        return json(res, S.tickets().slice().reverse().map((t) => ({ ...t, replies: t.replies.map((r, i) => ({ ...r, fb: fb.get(`human:${t.id}:${i}`) || null })) })));
    }
    let mm;
    if ((mm = p.match(/^\/api\/tickets\/(T-\d+)$/)) && m === "GET") {
        const t = S.tickets().find((x) => x.id === mm[1]);
        return t ? json(res, t) : json(res, { error: "没有这张工单" }, 404);
    }
    if ((mm = p.match(/^\/api\/tickets\/(T-\d+)\/reply$/)) && m === "POST") {
        const b = await body(req);
        if (!String(b.text || "").trim()) return json(res, { error: "回复不能为空" }, 400);
        const t = S.replyTicket(mm[1], { text: b.text, draft: b.draft || null });
        return t ? json(res, t) : json(res, { error: "没有这张工单" }, 404);
    }
    if ((mm = p.match(/^\/api\/tickets\/(T-\d+)\/draft$/)) && m === "POST") {
        const t = S.tickets().find((x) => x.id === mm[1]);
        if (!t) return json(res, { error: "没有这张工单" }, 404);
        const lim = await S.hitLimit(ipOf(req));
        if (!lim.ok) return json(res, { error: lim.error }, 429);
        return json(res, S.setDraft(t.id, await draftFor(t)));
    }
    // 答案下面的「转人工」按钮（中置信、属地提示时出现）
    if (p === "/api/handoff" && m === "POST") {
        const b = await body(req);
        const tr = S.getTrace(b.traceId);
        if (!tr) return json(res, { error: "找不到这次提问" }, 404);
        const ex = S.tickets().find((t) => t.traceId === tr.traceId);
        if (ex) return json(res, ex);
        const idx = P.loadIndex();
        const clauses = (tr.clauses || []).map((cid) => idx.blocks.find((x) => x.cid === cid)).filter(Boolean).slice(0, 3).map(P.showBlock);
        return json(res, S.createTicket({ traceId: tr.traceId, q: tr.q, subject: tr.subject, reasonType: "feedback", reason: `看完回答后转人工：${b.why || "员工要求 HR 核实"}`, trail: tr.trail, clauses, category: tr.category || "其他", fromAnswer: tr.answer }));
    }
    if (p === "/api/feedback" && m === "POST") return json(res, S.addFeedback(await body(req)));
    if (p === "/api/badcases" && m === "GET") return json(res, S.badcases());
    if ((mm = p.match(/^\/api\/badcases\/(.+)$/)) && m === "POST") return json(res, S.updateBadcase(decodeURIComponent(mm[1]), await body(req)));
    if (p === "/api/stats") return json(res, S.stats());
    return json(res, { error: "没有这个接口" }, 404);
}
