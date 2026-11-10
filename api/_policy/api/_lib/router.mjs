// 接口路由：本机 dev/server.mjs 和线上 api/policy.mjs（Vercel 函数）共用。p 是接口路径，如 /api/ask
import { ask } from "./ask.mjs";
import * as S from "./store.mjs";
import * as P from "./pipeline.mjs";
import { loadRules } from "./rules.mjs";
import { REPLAY, MODELS, generate } from "./models.mjs";
import { loadProfileData, cleanProfile, companyOf } from "./profile.mjs";
import { ROLES, canSee, today, effectiveAt } from "./docs.mjs";
import { settle, sendFeedback, lsOn, LS_PROJECT } from "./langsmith.mjs";
import fs from "node:fs";

// 登录了就返回档案，没登录返回 null
const empOf = () => { const s = S.getSession(); return s?.loggedIn ? s.profile : null; };
const me = () => { const p = empOf(); return { loggedIn: !!p, profile: p, company: p ? companyOf(p) : null }; };
const roleOf = () => empOf()?.role || "employee";

// 资料版本：已导入的修订（新旧条款对比）、导入任务、各份资料谁能看。
// 本机读 data/ 下的文件（导入任务的进度实时变）；线上读 dev/publish.mjs 打进去的 api/_data/versions.json，只读
const readData = (f, d) => { try { return JSON.parse(fs.readFileSync(new URL(`../../data/${f}`, import.meta.url), "utf8")); } catch { return d; } };
function versionsReport() {
    const idx = P.loadIndex(), asOf = today();
    const snap = S.ONLINE ? JSON.parse(fs.readFileSync(new URL("../_data/versions.json", import.meta.url), "utf8")) : { revisions: readData("revisions.json", []), jobs: readData("import-jobs.json", []) };
    const byCid = new Map(idx.blocks.map((b) => [b.cid, b]));
    const side = (b) => b && { cid: b.cid, clause: b.clause, version: b.version, text: b.text, effectiveFrom: b.effectiveFrom, effectiveTo: b.effectiveTo };
    const revisions = snap.revisions.map((r) => ({
        id: r.id, title: r.title, version: r.version, effectiveFrom: r.effectiveFrom, importedAt: r.importedAt, status: r.effectiveFrom <= asOf ? "已生效" : "待生效",
        changes: r.changes.map((c) => {
            const nb = idx.blocks.find((b) => b.revision === r.id && b.changed?.includes(c.clause));
            const ob = nb?.prevCid ? byCid.get(nb.prevCid) : c.op === "删除" ? idx.blocks.find((b) => b.subject === r.subject && b.clause === c.clause && b.effectiveTo) : null;
            return { op: c.op, clause: c.clause, title: c.title, old: side(ob), new: side(nb) };
        }),
    }));
    const docs = [
        ...Object.entries(P.SUBJECTS).map(([k, v]) => ({ name: `${v.source} ${v.version}`, who: v.label, roles: null, n: idx.blocks.filter((b) => b.subject === k && effectiveAt(b, asOf)).length })),
        ...[...new Set(idx.blocks.filter((b) => b.roles).map((b) => b.doc))].map((d) => { const bs = idx.blocks.filter((b) => b.doc === d); return { name: `${bs[0].source} ${bs[0].version}`, who: "两种用工身份都适用", roles: bs[0].roles, n: bs.length }; }),
    ];
    return { asOf, readOnly: S.ONLINE, revisions, jobs: snap.jobs.slice(-10).reverse(), docs, roles: ROLES };
}

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
        await ask(b, send, { signal: ac.signal, emp: empOf() });
        await Promise.all([S.flush(), settle()]);
        return res.end();
    }
    if (p === "/api/meta") {
        const idx = P.loadIndex(), PD = loadProfileData({ fresh: true });
        const count = {}; for (const b of idx.blocks) count[b.subject] = (count[b.subject] || 0) + 1;
        return json(res, {
            replay: REPLAY, models: MODELS, promptVersion: P.PROMPT_VERSION, gates: { cos: P.CONFIG.minTopCos, fine: P.CONFIG.fineRerank, high: P.CONFIG.highRerank },
            subjects: Object.fromEntries(Object.entries(P.SUBJECTS).map(([k, v]) => [k, { ...v, chunks: count[k] || 0, ...P.staleness(k) }])),
            staleYears: P.STALE_YEARS, reasons: S.REASONS, causes: S.CAUSES, statuses: S.STATUSES, rules: loadRules({ fresh: true }).rules, built: idx.meta.built,
            companies: PD.companies, local: PD.local, demoAccount: { account: PD.demo.account, password: PD.demo.password },
            roles: ROLES, asOf: today(), langsmith: { on: lsOn(), project: LS_PROJECT() },
        });
    }
    // 演示账户登录：不开放注册；档案改动存在登录状态里，退出再登录还在
    if (p === "/api/me") return json(res, me());
    if (p === "/api/login" && m === "POST") {
        const b = await body(req), D = loadProfileData().demo;
        if (b.account !== D.account || b.password !== D.password) return json(res, { error: "账号或密码不对（演示账户见登录框）" }, 401);
        S.setSession({ loggedIn: true, profile: S.getSession()?.profile || D.profile, at: new Date().toISOString() });
        return json(res, me());
    }
    if (p === "/api/logout" && m === "POST") {
        const s = S.getSession();
        if (s) S.setSession({ ...s, loggedIn: false });
        return json(res, me());
    }
    if (p === "/api/profile" && m === "POST") {
        const s = S.getSession();
        if (!s?.loggedIn) return json(res, { error: "先登录" }, 401);
        const b = await body(req);
        S.setSession({ ...s, profile: b.reset ? loadProfileData().demo.profile : cleanProfile(s.profile, b) });
        return json(res, me());
    }
    if (p === "/api/clause") {
        // 没权限的条款和不存在的一样回 404，不暴露有这份资料；被拒记一笔审计
        const b = P.loadIndex().blocks.find((x) => x.cid === url.searchParams.get("cid"));
        if (b && !canSee(roleOf(), b)) {
            const e = empOf();
            S.writeAudit({ action: "查看条款被拒", who: e ? `${e.name}（${e.empNo}）` : "访客（没登录）", role: roleOf(), cid: b.cid, denied: [{ cid: b.cid, clause: b.clause, source: b.source }] });
            return json(res, { error: "没有这一条" }, 404);
        }
        return b ? json(res, P.showBlock(b)) : json(res, { error: "没有这一条" }, 404);
    }
    if (p === "/api/versions") return json(res, versionsReport());
    if (p === "/api/audit") return json(res, S.audits());
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
        return json(res, S.createTicket({ traceId: tr.traceId, q: tr.q, subject: tr.subject, reasonType: "feedback", reason: `看完回答后转人工：${b.why || "员工要求 HR 核实"}`, trail: tr.trail, clauses, category: tr.category || "其他", fromAnswer: tr.answer, emp: tr.emp }));
    }
    if (p === "/api/feedback" && m === "POST") {
        const r = S.addFeedback(await body(req));
        sendFeedback(r.feedback);
        await settle();
        return json(res, r);
    }
    if (p === "/api/badcases" && m === "GET") return json(res, S.badcases());
    if ((mm = p.match(/^\/api\/badcases\/(.+)$/)) && m === "POST") return json(res, S.updateBadcase(decodeURIComponent(mm[1]), await body(req)));
    if (p === "/api/stats") return json(res, S.stats());
    return json(res, { error: "没有这个接口" }, 404);
}
