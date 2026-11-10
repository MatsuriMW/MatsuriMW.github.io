// 一个问题的完整路由：脱敏 → ① 人工闸 → ② 规则闸（缺条件就追问）→ ③ RAG（检索、重排、生成、校验）
// send(event, data) 把每一步推给页面；dry=true 时不写 trace、不建工单（评测用）
import { redact } from "./redact.mjs";
import { handoffGate, matchRules, fillSlot, parseSlotAnswer, lookup, ruleById } from "./rules.mjs";
import { retrieve, buildMessages, CONFIG, PROMPT_VERSION, SUBJECTS, STALE_YEARS, staleness, keywordTop, loadIndex, showBlock, cite, chapterOf, localityHint, clauseBlock } from "./pipeline.mjs";
import { generate, MODELS, REPLAY } from "./models.mjs";
import { checkAnswer, tamper as tamperAnswer } from "./checks.mjs";
import { writeTrace, createTicket, newId, writeAudit } from "./store.mjs";
import { today, upcoming, ROLES } from "./docs.mjs";
import { sendTrace } from "./langsmith.mjs";
import * as C from "./cache.mjs";
import { answerByProfile, companyOf, snapshot } from "./profile.mjs";

// 「资料较旧」按真正引用的那份资料算（引用了 2026 版内部口径就不该标外包手册 2019 年版）；引用了几份取最旧的
function freshness(blocks, subject) {
    const b = blocks.filter(Boolean).sort((x, y) => String(x.date).localeCompare(String(y.date)))[0];
    if (!b) return { stale: staleness(subject), subject: SUBJECTS[subject] };
    const years = (Date.now() - Date.parse(b.date)) / (365.25 * 864e5);
    return { stale: { years: +years.toFixed(1), stale: years > STALE_YEARS }, subject: { ...SUBJECTS[subject], source: b.source, version: b.version, date: b.date } };
}

// 引用的条款在今天之后有待生效的修订：回答下面提示员工
function upcomingOf(b, clause, asOf) {
    const u = b && upcoming(loadIndex().blocks, b, clause, asOf);
    return u ? { ...u, text: loadIndex().blocks.find((x) => x.cid === u.cid)?.text } : null;
}

// emp：登录了就是员工档案（见 profile.mjs），身份按所属公司定，不看页面传的 subject
// role：只从档案来，没登录按员工（评测可以直接传）；asOf：按哪一天有效的条款答，默认今天（评测固定日期，结果不随日子变）
export async function ask({ q, subject = "fosun", ruleId = null, slot = null, traceId = null, tamper = false }, send = () => {}, { dry = false, cfg = CONFIG, signal, emp = null, role = null, asOf = today() } = {}) {
    if (emp && companyOf(emp)) subject = companyOf(emp).subject;
    if (!SUBJECTS[subject]) subject = "fosun";
    role = emp?.role || role || "employee";
    if (!ROLES[role]) role = "employee";
    const t0 = Date.now(), lsx = { t0 };
    const R = redact(String(q || "").slice(0, 300));
    const qr = R.text.trim();
    const trace = {
        traceId: traceId || newId(), q: qr, subject, trail: [], route: null, final: null, reason: null,
        model: null, promptVersion: null, answer: null, usage: null, calls: { embed: 0, rerank: 0, gen: 0 }, redacted: R.found, role, asOf,
        emp: emp ? snapshot(emp) : undefined,
    };
    const step = (gate, status, detail, extra = {}) => { const s = { gate, status, detail, ...extra, at: Date.now() - t0 }; trace.trail.push(s); send("step", s); };
    const finish = (extra = {}) => {
        Object.assign(trace, extra, { ms: Date.now() - t0, replay: REPLAY || undefined });
        if (!dry) { writeTrace(trace); sendTrace(trace, lsx); }
        send("done", { traceId: trace.traceId, route: trace.route, final: trace.final, ms: trace.ms, usage: trace.usage, calls: trace.calls, model: trace.model, replay: REPLAY });
        return trace;
    };
    const handoff = (reasonType, reason, clauses) => {
        trace.final = "human"; trace.reason = reason; trace.clauses = clauses.map((b) => b.cid);
        trace.category = clauses[0] ? chapterOf(clauses[0]) : "未说明";
        let ticket = null;
        if (!dry) ticket = createTicket({ traceId: trace.traceId, q: qr, subject, reason, reasonType, trail: trace.trail, clauses: clauses.slice(0, 3), category: trace.category, emp: trace.emp, acl: trace.acl?.denied.length ? trace.acl : null });
        trace.ticketId = ticket?.id || null;
        send("handoff", { ticketId: trace.ticketId, reason, reasonType, clauses: clauses.slice(0, 3), category: trace.category });
    };

    send("start", { traceId: trace.traceId, q: qr, subject, redacted: R.found, replay: REPLAY, emp: trace.emp });
    if (qr.length < 2) { send("error", { message: "问题太短" }); return trace; }
    if (R.found.length) step("redact", "hit", `已遮盖：${R.found.join("、")}，后面所有环节只看到遮盖后的文字`);

    // 规则追问点回来：同一个问题接着查，不重新过闸
    if (ruleId && slot != null) {
        const rule = ruleById(ruleId);
        const filled = rule && parseSlotAnswer(rule, slot);
        if (rule && filled) {
            trace.route = "rule"; trace.viaSlot = true;   // 追问后答完：看板算追问完成率
            step("human", "pass", "没有要求人工、没有敏感事项");
            step("rule", "hit", `命中规则「${rule.name}」，条件：${rule.slot.name} = ${filled.text}`, { ruleId });
            return ruleAnswer(rule, filled);
        }
    }

    // ① 人工闸
    const h = handoffGate(qr);
    if (h) {
        trace.route = "human";
        step("human", "hit", `${h.label}：命中「${h.hit}」`);
        step("rule", "skip", "人工闸已拦下"); step("rag", "skip", "人工闸已拦下");
        // 只说了「转人工」、没说什么事：不硬凑条款
        const rest = qr.replace(h.hit, "").replace(/[\s\p{P}]|我要|帮我|请|麻烦|一下|聊聊|谢谢/gu, "");
        handoff(h.type, `${h.label}：命中「${h.hit}」`, rest.length >= 4 ? keywordTop(qr, subject, 3, { role, asOf }) : []);
        return finish();
    }
    step("human", "pass", "没有要求人工、没有敏感事项、没有查个人数据");

    // ② 规则闸。登录了先按档案匹配（公司制度、用工地、参保地），没匹配上再走规则表
    if (emp) {
        const pa = answerByProfile(qr, emp);
        if (pa && !pa.delegate) {
            trace.route = "rule";
            step("rule", "hit", `按档案匹配「${pa.topic}」（命中「${pa.hit}」）：${pa.basis.map((b) => `${b.k} ${b.v}`).join("，")}`, { profile: true });
            return profileAnswer(pa);
        }
    }

    const M = matchRules(qr, subject);
    const hits = M.filter((m) => m.hit);
    if (hits.length === 1) {
        const rule = ruleById(hits[0].id);
        trace.route = "rule";
        let filled = fillSlot(rule, qr);
        // 登录了：条件直接用档案里的累计工龄，不用追问
        if (emp && rule.slot.kind === "years" && (!filled || filled.needConfirm)) filled = { value: emp.totalYears, text: `${emp.totalYears} 年`, fromProfile: true };
        if (!filled || filled.needConfirm) {
            const ask = filled?.needConfirm ? rule.slot.confirmAsk : rule.slot.ask;
            step("rule", "ask", `命中规则「${rule.name}」，${filled?.needConfirm ? `问题里的「${filled.text}」是司龄，口径要确认` : `缺条件「${rule.slot.name}」`}，追问`, { ruleId: rule.id, match: hits[0] });
            trace.final = "ask_slot";
            send("ask_slot", { traceId: trace.traceId, ruleId: rule.id, slotName: rule.slot.name, ask, options: rule.slot.options, q: qr });
            return finish();
        }
        step("rule", "hit", `命中规则「${rule.name}」（${hits[0].any} + ${hits[0].all}），条件：${rule.slot.name} = ${filled.text}${filled.fromProfile ? "（取自档案）" : ""}`, { ruleId: rule.id, match: hits[0] });
        return ruleAnswer(rule, filled);
    }
    step("rule", hits.length > 1 ? "conflict" : "pass", hits.length > 1 ? `同时命中 ${hits.map((x) => x.name).join("、")}，不猜，交给 RAG` : ruleMissText(M), { match: M });

    // ③ RAG。先查答案缓存（cache.mjs）：同一问题、同一身份和角色、同一天、同一版本的资料和提示词，答过就直接用
    trace.route = "rag";
    trace.promptVersion = PROMPT_VERSION;
    const useCache = !dry && !tamper;
    const ak = C.key("ans", [C.normQ(qr), subject, role, asOf, loadIndex().meta.built, PROMPT_VERSION, MODELS.gen, cfg.minTopCos, cfg.fineRerank, cfg.highRerank]);
    trace.cacheKey = useCache ? ak : undefined;
    if (useCache) {
        const hit = await C.get(ak);
        if (hit) return cachedAnswer(hit.v, hit.level);
    }
    let Rt;
    const retStart = Date.now() - t0, stages = {};
    try {
        Rt = await retrieve(qr, subject, { cfg, signal, role, asOf, useCache, onStage: (k, d) => { stages[k] = { k, ...d }; send("stage", { k, ...d }); } });
    } catch (e) { send("error", { message: String(e.message || e).slice(0, 200) }); trace.final = "error"; return finish({ error: String(e.message || e) }); }
    lsx.ret = { start: retStart, ms: Rt.ms };
    if (Rt.cached.vec || Rt.cached.rr) trace.cache = { hit: false, vec: Rt.cached.vec, rr: Rt.cached.rr };
    trace.calls.embed = Rt.calls.embed; trace.calls.rerank = Rt.calls.rerank;
    // 权限：过滤掉的相关块只进 trace、审计和工单，不推给页面（员工不该知道有这份资料）
    trace.acl = { role, visible: Rt.hits.length, denied: Rt.denied };
    if (!dry) writeAudit({ traceId: trace.traceId, action: "检索", who: trace.emp ? `${trace.emp.name}（${trace.emp.empNo}）` : "访客（没登录）", role, subject, q: qr, visible: Rt.hits.length, denied: Rt.denied });
    trace.scores = { topCos: Rt.topCos, topRR: Rt.topRR, tier: Rt.tier, gates: Rt.gates };
    trace.hits = Rt.hits.slice(0, 8).map((x) => ({ cid: x.cid, clause: x.clause, cos: x.cos, rr: x.rr ?? null, inContext: x.inContext }));
    const retrieval = { hits: Rt.hits.slice(0, 10).map(({ text, ...x }) => ({ ...x, snippet: text.slice(0, 80) })), topCos: Rt.topCos, topRR: Rt.topRR, tier: Rt.tier, gates: Rt.gates, ms: Rt.ms };
    send("retrieval", retrieval);
    if (Rt.refused) {
        step("rag", "refuse", Rt.refused.reason);
        handoff("system", Rt.refused.reason, Rt.hits.slice(0, 3));
        return finish();
    }
    const ragDetail = `置信度${{ high: "高", mid: "中" }[Rt.tier]}（重排最高分 ${Rt.topRR.toFixed(3)}），用 ${Rt.context.length} 条条款生成`;
    step("rag", "gen", ragDetail);
    let text = "", usage = null, model = MODELS.gen;
    lsx.messages = buildMessages(qr, Rt.context); lsx.gen = { start: Date.now() - t0 };
    try {
        for await (const x of generate(lsx.messages, { signal })) {
            if (typeof x === "string") { text += x; send("draft", { t: x }); } else { usage = x.usage; model = x.model || model; }
        }
    } catch (e) { send("error", { message: String(e.message || e).slice(0, 200) }); trace.final = "error"; return finish({ error: String(e.message || e) }); }
    lsx.gen.end = Date.now() - t0;
    trace.calls.gen = 1; trace.usage = usage; trace.model = model; trace.generated = true;
    if (tamper) { text = tamperAnswer(text); trace.tampered = true; }
    const chk = checkAnswer(text, Rt.context);
    trace.checks = chk; trace.rawAnswer = text;
    send("checks", { ...chk, tampered: tamper, text: tamper ? text : undefined });
    if (!chk.ok) {
        step("check", "fail", chk.reason);
        handoff("system", chk.reason, Rt.context);
        return finish();
    }
    const checkDetail = `引用 [${chk.cited.join("][")}] 都存在；回答里的数字 ${chk.numbers.length ? chk.numbers.join("、") : "（没有）"} 都能在所引条款里找到`;
    step("check", "pass", checkDetail);
    const sources = Rt.context.map((b, k) => ({ n: k + 1, ...b, cite: cite(b) })).filter((x) => chk.cited.includes(x.n));   // 只列回答真正引用的条款
    const local = localityHint(text);
    trace.final = "rag"; trace.answer = text; trace.clauses = Rt.context.map((b) => b.cid); trace.category = chapterOf(Rt.context[0]);
    const idx = loadIndex();
    const soon = sources.map((x) => upcomingOf(idx.blocks.find((b) => b.cid === x.cid), x.clause, asOf)).filter(Boolean);
    const answer = { kind: "rag", text, sources, tier: Rt.tier, locality: local, ...freshness(sources, subject), upcoming: soon };
    send("answer", { ...answer, traceId: trace.traceId });
    if (useCache) await C.set(ak, {
        fromTrace: trace.traceId, at: new Date().toISOString(), tokens: usage?.total_tokens || 0, model, answer, retrieval, stages, checks: chk, checkDetail, ragDetail,
        scores: trace.scores, hits: trace.hits, clauses: trace.clauses, category: trace.category, acl: trace.acl,
    });
    return finish();

    // 命中答案缓存：把当时的检索、分数、校验原样发给页面（轨迹照样能看），不调模型
    function cachedAnswer(c, level) {
        const where = level === "L1" ? "L1 内存" : "L2 全站共享";
        step("cache", "hit", `缓存命中（${where}）：同一问题、同一身份和角色、同一版本的资料今天答过（trace ${c.fromTrace}），不调模型，省下 ${c.tokens} token`);
        for (const k of ["embed", "search", "rerank"]) if (c.stages[k]) send("stage", { ...c.stages[k], ms: 0, cached: true });
        send("retrieval", { ...c.retrieval, cached: true });
        step("rag", "gen", c.ragDetail.replace(/生成$/, "生成过，这次直接用缓存"));
        send("checks", c.checks);
        step("check", "pass", c.checkDetail);
        Object.assign(trace, { final: "rag", answer: c.answer.text, model: c.model, generated: true, checks: c.checks, scores: c.scores, hits: c.hits, clauses: c.clauses, category: c.category,
            acl: c.acl, cache: { hit: true, level, fromTrace: c.fromTrace, tokensSaved: c.tokens } });
        if (!dry) writeAudit({ traceId: trace.traceId, action: "检索（缓存）", who: trace.emp ? `${trace.emp.name}（${trace.emp.empNo}）` : "访客（没登录）", role, subject, q: qr, visible: c.acl?.visible, denied: c.acl?.denied || [] });
        send("answer", { ...c.answer, traceId: trace.traceId, cached: { level, fromTrace: c.fromTrace, tokensSaved: c.tokens } });
        return finish();
    }

    function profileAnswer(pa) {
        const b = pa.clause ? clauseBlock(subject, pa.clause, asOf) : null;
        trace.final = "rule"; trace.profileTopic = pa.topic; trace.answer = pa.text; trace.clauses = b ? [b.cid] : []; trace.category = b ? chapterOf(b) : pa.topic;
        step("lookup", "hit", `查表：${pa.calc?.length ? pa.calc.join("；") : pa.refs[0].label}，不调模型`);
        send("answer", {
            kind: "profile", traceId: trace.traceId, text: pa.text, topic: pa.topic, basis: pa.basis, refs: pa.refs, calc: pa.calc || [], notice: pa.notice || null,
            sources: b ? [{ n: 1, ...showBlock(b), clause: pa.clause, cite: cite(b, pa.clause) }] : [],
            ...freshness([b], subject), upcoming: [upcomingOf(b, pa.clause, asOf)].filter(Boolean),
        });
        return finish();
    }

    function ruleAnswer(rule, filled) {
        const row = lookup(rule, filled);
        const clause = row?.clause || rule.clause;
        const b = clauseBlock(rule.subject, clause, asOf);
        if (!row) {
            const reason = `规则表没有覆盖这个条件：${rule.slot.name} = ${filled.text}`;
            step("rule", "uncovered", reason);
            handoff("system", reason, b ? [showBlock(b)] : []);
            return finish();
        }
        const text = rule.answer.replace("{slot}", filled.text).replace("{value}", row.value);
        trace.final = "rule"; trace.ruleId = rule.id; trace.slot = filled.text; trace.answer = text; trace.clauses = [b.cid]; trace.category = chapterOf(b);
        step("lookup", "hit", `查表：${rule.slot.name} ${filled.text} → ${row.value}（条款 ${clause}），不调模型`);
        send("answer", {
            kind: "rule", traceId: trace.traceId, text, ruleId: rule.id, ruleName: rule.name, clause, quote: [].concat(row.src).join("；"),
            sources: [{ n: 1, ...showBlock(b), clause, cite: cite(b, clause) }],
            ...freshness([b], rule.subject), locality: localityHint(text), upcoming: [upcomingOf(b, clause, asOf)].filter(Boolean),
        });
        return finish();
    }
}

function ruleMissText(M) {
    if (!M.length) return "这个身份下没有规则";
    const near = M.find((m) => m.any);
    if (!near) return "没有命中任何规则";
    if (near.not) return `像「${near.name}」，但含「${near.not}」，排除`;
    return `像「${near.name}」，但没问天数，不命中`;
}
