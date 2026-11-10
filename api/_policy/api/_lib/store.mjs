// 存储：trace.jsonl（每次提问一行）、feedback.jsonl（每次评价一行）、tickets.json、badcases.json（归因状态）、eval-badcases.json（回归集）。
// 同一 traceId 写多次时以最后一行为准（规则追问会把同一个问题补写一遍；评价重复提交也是最后一次为准）。
// 看板上的数字都从这几份记录现算，不另存一份。
// 本机写 data/ 下的文件（回归集写 eval/badcases.json）；线上（Vercel，函数没有可写磁盘）每个访客一份，放 Upstash Redis：
// 请求开始 withStore 把这位访客的几份记录读进内存，下面的函数照常同步读写内存，响应前 flush 写回，7 天不来就过期。
import fs from "node:fs";
import crypto from "node:crypto";
import { AsyncLocalStorage } from "node:async_hooks";
import { REPLAY } from "./models.mjs";
import { redact } from "./redact.mjs";

export const ONLINE = !!process.env.VERCEL;
const D = (f) => (f === "eval-badcases.json" ? new URL("../../eval/badcases.json", import.meta.url) : new URL(`../../data/${f}`, import.meta.url));
if (!ONLINE) fs.mkdirSync(D(""), { recursive: true });

const RURL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const RTOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
async function redis(cmds) {
    if (!RURL) throw new Error("线上没配存储（Upstash）");
    const r = await fetch(`${RURL}/pipeline`, { method: "POST", headers: { Authorization: `Bearer ${RTOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify(cmds), signal: AbortSignal.timeout(5000) });
    if (!r.ok) throw new Error(`redis ${r.status}`);
    return (await r.json()).map((x) => { if (x.error) throw new Error(`redis ${x.error}`); return x.result; });
}
const JSON_FILES = ["tickets.json", "badcases.json", "eval-badcases.json", "session.json"], LINE_FILES = ["trace.jsonl", "feedback.jsonl", "audit.jsonl"];
const TTL = 7 * 86400, MAX_LINES = 1000;
const als = new AsyncLocalStorage();
const box = () => { const c = als.getStore(); if (!c) throw new Error("线上读写记录要在 withStore 里"); return c; };

// 线上：读进这位访客的记录，跑 fn，结束时没写回的再写一次。本机直接跑 fn
export async function withStore(visitor, fn) {
    if (!ONLINE) return fn();
    const k = (f) => `pol:${visitor}:${f}`;
    const res = await redis([...JSON_FILES.map((f) => ["GET", k(f)]), ...LINE_FILES.map((f) => ["LRANGE", k(f), 0, -1])]);
    const c = { k, json: {}, lines: {}, dirty: new Set(), added: {} };
    JSON_FILES.forEach((f, i) => { if (res[i] != null) c.json[f] = JSON.parse(res[i]); });
    LINE_FILES.forEach((f, i) => { c.lines[f] = (res[JSON_FILES.length + i] || []).map((l) => JSON.parse(l)); });
    try { return await als.run(c, fn); } finally { await als.run(c, flush); }
}
export async function flush() {
    if (!ONLINE) return;
    const c = box(), cmds = [];
    for (const f of c.dirty) cmds.push(["SET", c.k(f), JSON.stringify(c.json[f]), "EX", TTL]);
    for (const [f, rows] of Object.entries(c.added)) if (rows.length) cmds.push(["RPUSH", c.k(f), ...rows.map((r) => JSON.stringify(r))], ["LTRIM", c.k(f), -MAX_LINES, -1], ["EXPIRE", c.k(f), TTL]);
    c.dirty.clear(); c.added = {};
    if (cmds.length) await redis(cmds);
}

// 线上限流：调模型的接口每个 IP 每天 PER_IP 次、全站 GLOBAL 次（北京时间零点清零）
const PER_IP = Number(process.env.POLICY_PER_IP_DAILY ?? 80), GLOBAL = Number(process.env.POLICY_GLOBAL_DAILY ?? 1500);
export async function hitLimit(ip) {
    if (!ONLINE) return { ok: true };
    const d = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10), a = `pol:lim:${d}:${ip}`, g = `pol:lim:${d}:all`;
    const [n, , total] = await redis([["INCR", a], ["EXPIRE", a, 2 * 86400], ["INCR", g], ["EXPIRE", g, 2 * 86400]]);
    if (total > GLOBAL) return { ok: false, error: "今天全站的提问额度用完了，明天再来" };
    if (n > PER_IP) return { ok: false, error: `今天的提问次数用完了（每人每天 ${PER_IP} 次），明天再来` };
    return { ok: true };
}

const clone = (v) => JSON.parse(JSON.stringify(v));
const readJSON = (f, d) => {
    if (ONLINE) { const c = box(); return f in c.json ? clone(c.json[f]) : d; }
    try { return JSON.parse(fs.readFileSync(D(f), "utf8")); } catch { return d; }
};
const writeJSON = (f, v) => {
    if (ONLINE) { const c = box(); c.json[f] = clone(v); c.dirty.add(f); return; }
    fs.writeFileSync(D(f), JSON.stringify(v, null, 1));
};
const readLines = (f) => {
    if (ONLINE) return box().lines[f].slice();
    try { return fs.readFileSync(D(f), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)); } catch { return []; }
};
const append = (f, v) => {
    if (ONLINE) { const c = box(); c.lines[f].push(v); (c.added[f] ||= []).push(v); return; }
    fs.appendFileSync(D(f), JSON.stringify(v) + "\n");
};
const now = () => new Date().toISOString();
export const newId = () => crypto.randomBytes(5).toString("hex");

// ---------- trace ----------
export function writeTrace(t) { append("trace.jsonl", { ...t, replay: REPLAY || undefined, ts: t.ts || now() }); }
export function traces({ includeReplay = false } = {}) {
    const m = new Map();
    for (const t of readLines("trace.jsonl")) m.set(t.traceId, t);
    return [...m.values()].filter((t) => includeReplay || !t.replay);
}
export const getTrace = (id) => readLines("trace.jsonl").filter((t) => t.traceId === id).at(-1) || null;

// ---------- 审计：每次检索、每次查条款原文记一行（谁、什么角色、能看到几块、因为角色被过滤掉了哪些） ----------
export function writeAudit(a) { append("audit.jsonl", { ...a, at: now(), replay: REPLAY || undefined }); }
export const audits = () => readLines("audit.jsonl").slice(-200).reverse();

// ---------- 登录状态和档案（演示账户，见 profile.mjs） ----------
export const getSession = () => readJSON("session.json", null);
export const setSession = (v) => writeJSON("session.json", v);

// ---------- 工单 ----------
export const tickets = () => readJSON("tickets.json", []);
const saveTickets = (v) => writeJSON("tickets.json", v);
// 优先级：敏感事项要先处理（可能涉及劳动纠纷）；查个人数据和反馈后转人工次之
export const PRIORITY = { sensitive: "高", personal: "中", feedback: "中", system: "普通", explicit: "普通" };
// acl：检索时因为角色被过滤掉了相关资料，HR 在工单上看得到（员工那边不显示，不暴露有这份资料）
export function createTicket({ traceId, q, subject, reason, reasonType, trail, clauses, category, fromAnswer = null, emp = null, acl = null }) {
    const all = tickets();
    const t = {
        id: `T-${String(all.length + 1).padStart(3, "0")}`, traceId, q, subject, reason, reasonType, priority: PRIORITY[reasonType] || "普通", trail, clauses, category,
        fromAnswer, emp: emp || undefined, acl: acl || undefined, status: "待处理", createdAt: now(), replies: [], replay: REPLAY || undefined,
    };
    all.push(t); saveTickets(all);
    return t;
}
export function replyTicket(id, { text, draft = null }) {
    const all = tickets(), t = all.find((x) => x.id === id);
    if (!t) return null;
    const clean = redact(text).text;
    t.replies.push({ at: now(), text: clean, by: "HR", draft: draft ? { text: draft, unchanged: draft.trim() === clean.trim() } : null });
    t.status = "已回复";
    saveTickets(all);
    return t;
}
export function setDraft(id, draft) {
    const all = tickets(), t = all.find((x) => x.id === id);
    if (!t) return null;
    t.draft = { text: draft, at: now() };
    saveTickets(all);
    return t;
}
function reopenTicket(id, why) {
    const all = tickets(), t = all.find((x) => x.id === id);
    if (!t) return null;
    t.status = "重新打开"; t.reopenedAt = now(); t.reopenReason = why;
    saveTickets(all);
    return t;
}

// ---------- 反馈 ----------
export const REASONS = ["答错了", "没答到点上", "出处不对", "看不懂", "应该转人工", "其他"];
export const CAUSES = ["规则错命中", "规则漏命中", "切块", "检索", "重排", "生成", "HR 回复有误", "手册没写", "门槛不当", "用户误判"];
export const STATUSES = ["待归因", "已归因", "已修复", "已回归"];
const keyOf = (f) => (f.targetType === "human" ? `human:${f.ticketId}:${f.replyIdx ?? 0}` : `${f.targetType}:${f.traceId}`);

// 返回 { feedback, ticket? }。Bad + 要真人：规则 / RAG 回答新建工单；HR 回复则重新打开原工单
export function addFeedback(body) {
    const f = {
        targetType: body.targetType, traceId: body.traceId, ticketId: body.ticketId || null, replyIdx: body.replyIdx ?? null,
        rating: body.rating, reasons: (body.reasons || []).filter((r) => REASONS.includes(r)),
        note: body.note ? redact(String(body.note).slice(0, 500)).text : "", wantHuman: !!body.wantHuman,
        at: now(), replay: REPLAY || undefined,
    };
    if (!["rule", "rag", "human"].includes(f.targetType) || !["good", "ok", "bad"].includes(f.rating)) throw new Error("targetType 或 rating 不对");
    f.key = keyOf(f);
    append("feedback.jsonl", f);
    let ticket = null;
    if (f.rating === "bad" && f.wantHuman) {
        if (f.targetType === "human") ticket = reopenTicket(f.ticketId, "员工对 HR 回复打了 Bad，要真人再看");
        else {
            const existing = tickets().find((t) => t.traceId === f.traceId);
            if (existing) ticket = existing.status === "已回复" ? reopenTicket(existing.id, "员工反馈 Bad，要真人回答") : existing;
            else {
                const tr = getTrace(f.traceId) || {};
                ticket = createTicket({
                    traceId: f.traceId, q: tr.q, subject: tr.subject, reasonType: "feedback",
                    reason: `用户反馈 Bad：${f.reasons.join("、") || "未选原因"}${f.note ? `（${f.note}）` : ""}`,
                    trail: tr.trail || [], clauses: tr.clauses || [], category: tr.category || "其他", fromAnswer: tr.answer || null, emp: tr.emp,
                });
            }
        }
    }
    return { feedback: f, ticket };
}
export function latestFeedback({ includeReplay = false } = {}) {
    const m = new Map();
    for (const f of readLines("feedback.jsonl")) if (includeReplay || !f.replay) m.set(f.key, f);
    return m;
}

// ---------- Bad case 队列 ----------
export function badcases() {
    const state = readJSON("badcases.json", {});
    const T = new Map(tickets().map((t) => [t.id, t]));
    const out = [];
    for (const f of latestFeedback({ includeReplay: true }).values()) {
        if (f.rating !== "bad") continue;
        const tr = getTrace(f.traceId) || {};
        const tk = f.ticketId ? T.get(f.ticketId) : null;
        const s = state[f.key] || {};
        out.push({
            id: f.key, targetType: f.targetType, traceId: f.traceId, ticketId: f.ticketId, at: f.at, replay: f.replay,
            q: tr.q || tk?.q, subject: tr.subject || tk?.subject, route: tr.route, routeReason: tr.reason,
            answer: f.targetType === "human" ? tk?.replies?.[f.replyIdx ?? 0]?.text : tr.answer,
            reasons: f.reasons, note: f.note, wantHuman: f.wantHuman,
            trail: tr.trail || [], hits: tr.hits || [], scores: tr.scores || null, model: tr.model, promptVersion: tr.promptVersion, clauses: tr.clauses || [],
            cause: s.cause || null, status: s.status || "待归因", expectRoute: s.expectRoute || null, expectClause: s.expectClause || null, inEval: !!s.inEval,
        });
    }
    return out.sort((a, b) => b.at.localeCompare(a.at));
}
export function updateBadcase(id, body) {
    const state = readJSON("badcases.json", {});
    const s = (state[id] ||= {});
    if (body.cause !== undefined) { if (body.cause && !CAUSES.includes(body.cause)) throw new Error("归因不在选项里"); s.cause = body.cause; if (body.cause && (!s.status || s.status === "待归因")) s.status = "已归因"; }
    if (body.status !== undefined) { if (!STATUSES.includes(body.status)) throw new Error("状态不对"); s.status = body.status; }
    if (body.expectRoute !== undefined) s.expectRoute = body.expectRoute;
    if (body.expectClause !== undefined) s.expectClause = body.expectClause;
    writeJSON("badcases.json", state);
    const bc = badcases().find((b) => b.id === id);
    if (body.addToEval && bc) {
        if (bc.targetType === "human") throw new Error("HR 回复的 bad case 修的是知识或流程，不进回归集");
        let list = readJSON("eval-badcases.json", []);
        list = list.filter((x) => x.from !== id);
        list.push({ id: `bad-${list.length + 1}`, from: id, q: bc.q, subject: bc.subject, expectRoute: s.expectRoute || "human", expectClause: s.expectClause || null, cause: s.cause, reasons: bc.reasons, note: bc.note, addedAt: now() });
        writeJSON("eval-badcases.json", list);
        s.inEval = true;
        writeJSON("badcases.json", state);
    }
    return badcases().find((b) => b.id === id);
}

// ---------- 看板 ----------
const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : null);
// 分位数（最近秩法），样本少时就是排序后取对应位置
const pctl = (arr, p) => { if (!arr.length) return null; const a = [...arr].sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.ceil(p * a.length) - 1)]; };
export function stats() {
    const T = traces();
    const tk = tickets().filter((t) => !t.replay);
    const fb = [...latestFeedback().values()];
    const tkByTrace = new Map();
    for (const t of tk) if (!tkByTrace.has(t.traceId)) tkByTrace.set(t.traceId, t);
    const ratingOf = (type, traceId) => fb.find((f) => f.targetType === type && f.traceId === traceId)?.rating || null;

    // 人工介入率：产生过工单的问题 / 全部问题
    const handoffKinds = { explicit: 0, sensitive: 0, system: 0, feedback: 0 };
    for (const t of T) {
        const k = tkByTrace.get(t.traceId);
        if (!k) continue;
        handoffKinds[k.reasonType === "personal" ? "sensitive" : k.reasonType] = (handoffKinds[k.reasonType === "personal" ? "sensitive" : k.reasonType] || 0) + 1;
    }
    const withTicket = T.filter((t) => tkByTrace.has(t.traceId)).length;

    // 自然通过率：进入生成环节的 RAG 回答里，校验通过、已展示、没被打 Bad、也没有后续转人工的
    const gen = T.filter((t) => t.route === "rag" && t.generated);
    const shown = gen.filter((t) => t.checks?.ok);
    const passed = shown.filter((t) => ratingOf("rag", t.traceId) !== "bad" && !tkByTrace.has(t.traceId));
    const rated = shown.filter((t) => ratingOf("rag", t.traceId));
    const goodOk = rated.filter((t) => ["good", "ok"].includes(ratingOf("rag", t.traceId)));

    const routes = { rule: 0, rag: 0, human: 0 };
    for (const t of T) routes[t.final || t.route] = (routes[t.final || t.route] || 0) + 1;
    const ratings = { rule: { good: 0, ok: 0, bad: 0 }, rag: { good: 0, ok: 0, bad: 0 }, human: { good: 0, ok: 0, bad: 0 } };
    for (const f of fb) ratings[f.targetType][f.rating]++;
    const badReasons = {}, badCauses = {};
    for (const b of badcases().filter((b) => !b.replay)) {
        for (const r of b.reasons) badReasons[r] = (badReasons[r] || 0) + 1;
        if (b.cause) badCauses[b.cause] = (badCauses[b.cause] || 0) + 1;
    }
    const reasonCount = {};
    for (const t of tk) { const r = t.reason.replace(/[：:].*$/, ""); reasonCount[r] = (reasonCount[r] || 0) + 1; }
    const ruleAnswers = T.filter((t) => t.route === "rule" && t.answer).length;
    const tokens = T.reduce((a, t) => a + (t.usage?.total_tokens || 0), 0);
    const calls = T.reduce((a, t) => a + (t.calls ? t.calls.embed + t.calls.rerank + t.calls.gen : 0), 0);
    const drafts = tk.flatMap((t) => t.replies.filter((r) => r.draft));

    // 知识缺口：检索拒答、生成兜底的工单 + 归因为「手册没写」的 bad case
    // 同一个问题、同一个身份合并成一行，记被问了几次
    const gapMap = new Map();
    for (const g of [
        ...tk.filter((t) => /检索拒答|生成兜底|置信度低|规则表没有覆盖/.test(t.reason)).map((t) => ({ q: t.q, subject: t.subject, from: t.id, why: t.reason.replace(/：.*$/, "") })),
        ...badcases().filter((b) => !b.replay && b.cause === "手册没写").map((b) => ({ q: b.q, subject: b.subject, from: "Bad case", why: "归因：手册没写" })),
    ]) {
        const k = g.subject + "|" + g.q, x = gapMap.get(k);
        if (x) { x.n++; x.from.push(g.from); if (!x.why.includes(g.why)) x.why.push(g.why); }
        else gapMap.set(k, { q: g.q, subject: g.subject, n: 1, from: [g.from], why: [g.why] });
    }
    const gaps = [...gapMap.values()].sort((a, b) => b.n - a.n).map((g) => ({ ...g, from: g.from.join("、"), why: g.why.join("、") }));
    // ---- 工单服务 ----
    const now = Date.now(), ms = (iso) => Date.parse(iso);
    const prio = (t) => t.priority || PRIORITY[t.reasonType] || "普通";
    const openT = tk.filter((t) => t.status !== "已回复");
    const waits = openT.map((t) => now - ms(t.reopenedAt || t.createdAt));
    const repliedT = tk.filter((t) => t.replies.length);
    const firstResp = repliedT.map((t) => ms(t.replies[0].at) - ms(t.createdAt));
    const reopenedT = repliedT.filter((t) => t.reopenedAt);
    const count = (arr, f) => arr.reduce((o, x) => { const k = f(x); o[k] = (o[k] || 0) + 1; return o; }, {});
    const service = {
        total: tk.length, open: openT.length, oldestWaitMs: waits.length ? Math.max(...waits) : null,
        openByPriority: { 高: 0, 中: 0, 普通: 0, ...count(openT, prio) },
        byStatus: { 待处理: 0, 重新打开: 0, 已回复: 0, ...count(tk, (t) => t.status) },
        firstResp: { n: firstResp.length, p50: pctl(firstResp, 0.5), p90: pctl(firstResp, 0.9) },
        replied: repliedT.length, reopened: reopenedT.length, fcr: { num: repliedT.length - reopenedT.length, den: repliedT.length, pct: pct(repliedT.length - reopenedT.length, repliedT.length) },
    };

    // ---- 回答质量：按置信度分档看结果（线上检验门槛：中置信的问题率应明显高于高置信） ----
    const tiers = {};
    for (const k of ["high", "mid"]) {
        const g = gen.filter((t) => t.scores?.tier === k), sh = g.filter((t) => t.checks?.ok);
        tiers[k] = { gen: g.length, shown: sh.length, blocked: g.length - sh.length,
            bad: sh.filter((t) => ratingOf("rag", t.traceId) === "bad").length,
            good: sh.filter((t) => ["good", "ok"].includes(ratingOf("rag", t.traceId))).length,
            handoffAfter: sh.filter((t) => tkByTrace.has(t.traceId)).length };
    }
    const ragT = T.filter((t) => t.route === "rag");
    const refusedAtSearch = ragT.filter((t) => t.final === "human" && !t.scores?.tier).length;
    const refusedAtRerank = ragT.filter((t) => t.scores?.tier === "low").length;
    const blockedKinds = { number: 0, citation: 0, fallback: 0, ...count(gen.filter((t) => t.checks && !t.checks.ok), (t) => t.checks.kind) };
    const slotDone = T.filter((t) => t.viaSlot && t.final === "rule").length, slotPending = T.filter((t) => t.final === "ask_slot").length;

    // ---- 效率与成本 ----
    const lat = {};
    for (const k of ["rule", "rag", "human"]) { const a = T.filter((t) => (t.final || t.route) === k && t.ms != null).map((t) => t.ms); lat[k] = { n: a.length, p50: pctl(a, 0.5), p90: pctl(a, 0.9) }; }
    const genTok = gen.filter((t) => t.usage?.total_tokens).map((t) => t.usage.total_tokens);

    // ---- 员工在问什么 ----
    const topics = Object.entries(count(T.filter((t) => t.final !== "ask_slot"), (t) => t.category || "未说明")).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const subjects = count(T, (t) => t.subject);

    // ---- 闭环漏斗 ----
    const bcs = badcases().filter((b) => !b.replay);
    const evalSize = readJSON("eval-badcases.json", []).length;
    const funnel = { 待归因: 0, 已归因: 0, 已修复: 0, 已回归: 0, ...count(bcs, (b) => b.status) };

    // ---- 实时动态 ----
    const recent = T.slice().sort((a, b) => b.ts.localeCompare(a.ts)).slice(0, 12).map((t) => ({
        ts: t.ts, q: t.q, subject: t.subject, final: t.final, tier: t.scores?.tier || null, ms: t.ms, reason: t.reason, ticketId: tkByTrace.get(t.traceId)?.id || null,
        rating: ratingOf(t.route === "rag" ? "rag" : "rule", t.traceId),
    }));

    return {
        service, tiers, refusedAtSearch, refusedAtRerank, blockedKinds, slot: { done: slotDone, pending: slotPending },
        latency: lat, tokensPerGen: genTok.length ? Math.round(genTok.reduce((a, b) => a + b, 0) / genTok.length) : null,
        callsPerQ: T.length ? +(calls / T.length).toFixed(2) : null,
        topics, subjects, funnel, evalSize, recent,
        questions: T.length,
        handoffRate: { num: withTicket, den: T.length, pct: pct(withTicket, T.length), kinds: handoffKinds },
        naturalPass: { num: passed.length, den: gen.length, pct: pct(passed.length, gen.length), blocked: gen.length - shown.length,
            coverage: { num: rated.length, den: shown.length, pct: pct(rated.length, shown.length) },
            goodRate: { num: goodOk.length, den: rated.length, pct: pct(goodOk.length, rated.length) } },
        routes, ratings, ruleBad: ratings.rule.bad, badReasons, badCauses, ticketReasons: reasonCount,
        ruleAnswers, savedGenCalls: ruleAnswers, tokens, calls,
        drafts: { sent: drafts.length, unchanged: drafts.filter((r) => r.draft.unchanged).length },
        gaps,
        replayExcluded: traces({ includeReplay: true }).length - T.length,
    };
}
