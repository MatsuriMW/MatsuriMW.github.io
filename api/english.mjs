// /api/english：无锡初中英语备课 demo
// POST { action: "outline", ... } → text/event-stream：stage（检索各步）→ items（例题和备选）→ extras（课外知识补充挑中的和候选，老师设置不加就没有）→ stage(outline) → outline（大纲 JSON）→ done
// POST { action: "plan", ... }    → text/event-stream：delta（教案片段，多次）→ done。按老师确认过的大纲写完整教案
// POST { action: "search", ... }  → JSON { items }：按一句话的要求从题库再找题（大纲里「再找一道」、聊天里 find_items）
// POST { action: "chat", ... }    → JSON { reply, ops, memory }：右下角聊天，agent 回话并给出对设置 / 大纲 / 教案的修改
// POST { action: "extras", ... } → JSON { picked, candidates }：换题、找题以后按现在的用题重挑课外知识（不调模型，不占次数）
// POST { action: "section", ... } → text/event-stream：delta → done。老师要求改某一节、或换了例题后重写讲解
// POST { action: "memory", ... }  → JSON { ops, log }：把一条课后记录变成对老师 / 学生档案的增删改
// POST { action: "review", ... }  → JSON { suggestions, gaps }：读最近几次课的记录，给下一次课的教案提改进建议
// POST { action: "template", ... }→ JSON { template }：从老师上传的旧教案（页面抽出的文字）里抽小节结构，做成教案模板
// POST { action: "intake", ... }  → JSON { profile }：建档时老师贴的一段话 → 名字、年级学期、学校、进度、画像维度、初始记忆
// GET                              → 题库规模
// 状态（学生、老师档案、大纲、教案）都在浏览器里，函数不存任何东西。页面传回来的题目只有编号和 id，题面从题库取。
// 页面可以带自己的模型 key（byok），带了就不限次数；不带用站长的 DeepSeek，按 IP 限次。
import {
    loadDB, retrieve, itemsByIds, outlineMessages, cleanOutline, fitMinutes, splitLong, planMessages, chatMessages, CHAT_OP_NAMES, memoryMessages, reviewMessages, sectionMessages,
    templateMessages, cleanTemplate, intakeMessages, cleanIntake, stream, json, llmConfig, hit, cleanMems, cleanLogs, TYPES, ATTN, TIER, extrasMinutes, pickExtras, withExtras,
} from "./_lib/english.mjs";

const env = (k, d) => Number(process.env[k] ?? d);
const PER_IP = { outline: env("EN_PLAN_DAILY", 8), plan: env("EN_PLAN_DAILY", 8), search: env("EN_SEARCH_DAILY", 30), chat: env("EN_CHAT_DAILY", 30),
    section: env("EN_SECTION_DAILY", 30), memory: env("EN_MEMORY_DAILY", 30), review: env("EN_REVIEW_DAILY", 15), template: env("EN_TEMPLATE_DAILY", 10),
    intake: env("EN_INTAKE_DAILY", 15) };
const LABEL = { outline: "排大纲", plan: "写教案", search: "找题", chat: "聊天", section: "改教案", memory: "更新记忆", review: "复盘", template: "抽模板", intake: "分析建档描述" };
const clip = (s, n) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);
const strs = (x, n, m) => (Array.isArray(x) ? x : []).slice(0, n).map((v) => clip(v, m)).filter(Boolean);

export async function GET() {
    try { const db = loadDB(); return Response.json({ ready: true, units: db.units.length, built: db.meta.built }); }
    catch (e) { return Response.json({ ready: false, error: String(e.message || e) }); }
}

export async function POST(request) {
    let p = {};
    try { p = await request.json(); } catch {}
    const action = Object.hasOwn(PER_IP, p.action) || p.action === "extras" ? p.action : "outline";
    const cfg = llmConfig(p.byok);
    let left = null;
    if (!cfg.own && action !== "extras") {   // extras 不调模型，不占次数
        const h = request.headers;
        const ip = h.get("x-real-ip") || (h.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
        const lim = await hit(ip, action, PER_IP[action]);
        if (!lim.ok) return Response.json({ error: lim.global ? "今天全站的额度用完了，明天再来；也可以在聊天框的设置里填自己的 key" : `今天${LABEL[action]}的次数用完了（每人每天 ${PER_IP[action]} 次）。可以在聊天框的设置里填自己的 key，就不限次数了` }, { status: 429 });
        left = lim.left;
    }
    const studentMems = cleanMems(p.studentMems), teacherMems = cleanMems(p.teacherMems);
    const student = { name: clip(p.student?.name, 10), gradeLabel: clip(p.student?.gradeLabel, 40), schoolLabel: clip(p.student?.schoolLabel, 40),
        attention: ATTN.includes(p.student?.attention) ? p.student.attention : "", profile: clip(p.student?.profile, 500) };
    const settings = p.settings && typeof p.settings === "object" ? p.settings : null;   // 老师设置，settingsLine 里逐个字段校验
    const visual = !!p.visual, weakKps = clip(p.weakKps, 300);
    const logs = cleanLogs(p.logs);
    const ex = p.exam || {};
    const ctx = {
        gt: clip(ex.gt, 2), kind: clip(ex.kind, 6), level: ["统考", "不统考", "不知道"].includes(ex.level) ? ex.level : "不知道",
        school: clip(p.student?.school, 10), district: clip(p.student?.district, 6), textbook: p.student?.textbook === "旧" ? "旧" : "新", guidance: clip(p.guidance, 200),
        difficulty: Object.keys(TIER).includes(p.difficulty) ? p.difficulty : "",
    };
    const mix = (Array.isArray(p.mix) ? p.mix : []).filter((m) => TYPES.includes(m.type) && +m.share > 0).slice(0, 14)
        .map((m) => ({ type: m.type, share: Math.min(1, +m.share), minutes: Math.round(+m.minutes || 0), from: clip(m.from, 60), kps: strs(m.kps, 4, 12) }));
    const minutes = Math.max(30, Math.min(240, +p.minutes || 120));
    const base = {
        student, studentMems, teacherMems, settings, visual, weakKps, attentionMax: Math.max(8, Math.min(30, +p.attentionMax || 15)),
        logs: logs.slice(-3), guidance: clip(p.guidance, 300), minutes, mix, unitPlan: clip(p.unitPlan, 120),
        exam: { label: clip(ex.label, 80), levelLabel: clip(ex.levelLabel, 120), structure: clip(ex.structure, 400), school: clip(ex.school, 300) },
    };
    const fail = (e) => Response.json({ error: String(e.message || e).slice(0, 200) }, { status: 500 });

    if (action === "extras") {
        try { return Response.json(pickExtras(itemsByIds(p.items, ctx.gt), ctx.gt)); } catch (e) { return fail(e); }
    }

    if (action === "review") {
        try {
            const { data, usage } = await json(reviewMessages({ student, studentMems, teacherMems, settings, weakKps, logs, observations: p.observations, mix: p.mix, examLabel: p.examLabel }), { signal: request.signal, cfg });
            const sug = (Array.isArray(data.suggestions) ? data.suggestions : []).slice(0, 4).map((x) => ({
                title: clip(x.title, 30), detail: clip(x.detail, 90), evidence: clip(x.evidence, 70), kind: clip(x.kind, 4),
                type: TYPES.includes(x.type) ? x.type : "", delta: Math.max(-0.15, Math.min(0.15, +x.delta || 0)),
            }));
            return Response.json({ suggestions: sug, gaps: clip(data.gaps, 60), usage, left });
        } catch (e) { return fail(e); }
    }

    if (action === "memory") {
        const text = clip(p.text, 1000);
        if (text.length < 4) return Response.json({ error: "记录太短" }, { status: 400 });
        try {
            const kps = Object.fromEntries(Object.entries(p.kpByType && typeof p.kpByType === "object" ? p.kpByType : {}).filter(([t]) => TYPES.includes(t)).map(([t, ks]) => [t, strs(ks, 14, 10)]));
            const { data, usage } = await json(memoryMessages({ date: clip(p.date, 10), student, studentMems, teacherMems, settings, observations: p.observations, text }, kps), { signal: request.signal, cfg });
            return Response.json({ ops: Array.isArray(data.ops) ? data.ops.slice(0, 12) : [], log: data.log || null, usage, left });
        } catch (e) { return fail(e); }
    }

    if (action === "intake") {
        const text = String(p.text || "").slice(0, 3000);
        if (text.trim().length < 10) return Response.json({ error: "写得太短了，多写几句这个学生的情况" }, { status: 400 });
        const dims = (Array.isArray(p.dims) ? p.dims : []).slice(0, 30).map((d) => ({ key: clip(d?.key, 20), label: clip(d?.label, 10), lo: clip(d?.lo, 10), hi: clip(d?.hi, 10) }))
            .filter((d) => /^\w+$/.test(d.key) && d.label);
        try {
            const { data, usage } = await json(intakeMessages(text, dims), { signal: request.signal, cfg, max_tokens: 1500 });
            const profile = cleanIntake(data, dims.map((d) => d.key));
            if (!profile) return Response.json({ error: "没从这段话里看出学生的信息" }, { status: 422 });
            return Response.json({ profile, usage, left });
        } catch (e) { return fail(e); }
    }

    if (action === "template") {
        const text = String(p.text || "").slice(0, 4000);
        if (text.trim().length < 20) return Response.json({ error: "没从文件里读出文字" }, { status: 400 });
        try {
            const { data, usage } = await json(templateMessages(text), { signal: request.signal, cfg, max_tokens: 1200 });
            const template = cleanTemplate(data);
            if (!template) return Response.json({ error: "没看出这份教案的小节结构" }, { status: 422 });
            return Response.json({ template, usage, left });
        } catch (e) { return fail(e); }
    }

    if (action === "search") {
        const type = TYPES.includes(p.type) ? p.type : null;
        if (!type) return Response.json({ error: "题型不对" }, { status: 400 });
        try {
            const exclude = new Set(strs(p.exclude, 60, 40));
            const [R] = await retrieve([{ type, share: 0.1, kps: strs(p.kps, 4, 12), query: clip(p.query, 120) || undefined, n: Math.max(1, Math.min(3, +p.n || 1)) }], { ...ctx, exclude }, { signal: request.signal });
            return Response.json({ items: R?.items || [], relax: R?.relax, left });
        } catch (e) { return fail(e); }
    }

    if (action === "chat") {
        const stage = ["setup", "outline", "plan"].includes(p.stage) ? p.stage : "setup";
        const message = clip(p.message, 600);
        if (!message) return Response.json({ error: "说点什么" }, { status: 400 });
        try {
            const items = itemsByIds(p.items, ctx.gt);
            const outline = stage === "outline" ? cleanOutline(p.outline, items.map((i) => i.code)) : null;
            if (outline) (p.outline?.sections || []).forEach((x, i) => outline.sections[i] && (outline.sections[i].id = clip(x?.id, 6) || outline.sections[i].id));   // 保留页面上的环节编号
            const history = (Array.isArray(p.history) ? p.history : []).slice(-8).map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: clip(m.content, 400) }));
            const { data, usage } = await json(chatMessages({ ...base, stage, outline, plan: String(p.plan || "").slice(0, 8000), items, history, message, examLabel: base.exam.label, mix: p.mix }),
                { signal: request.signal, cfg, max_tokens: stage === "plan" ? 4000 : 2000 });
            const ops = (Array.isArray(data.ops) ? data.ops : []).filter((o) => CHAT_OP_NAMES[stage].includes(o?.op)).slice(0, 12);
            return Response.json({ reply: clip(data.reply, 600), ops, memory: Array.isArray(data.memory) ? data.memory.slice(0, 6) : [], usage, left });
        } catch (e) { return fail(e); }
    }

    if (action === "section") {
        const items = itemsByIds(p.items, ctx.gt);
        const section = String(p.section || "").slice(0, 3000);
        const messages = sectionMessages({ student, studentMems, teacherMems, visual, planNote: clip(p.planNote, 300), plan: String(p.plan || ""), items, section, instruction: p.instruction, focus: section.match(/E\d+/g) || [] });
        return sse(async (send) => {
            let usage = null;
            for await (const x of stream(messages, { signal: request.signal, max_tokens: 1500, cfg })) { if (typeof x === "string") send("delta", { t: x }); else usage = x.usage; }
            send("done", { usage, left });
        });
    }

    if (action === "plan") {
        const items = itemsByIds(p.items, ctx.gt);
        const outline = cleanOutline(p.outline, items.map((i) => i.code));
        if (!outline.sections.length) return Response.json({ error: "大纲是空的" }, { status: 400 });
        return sse(async (send) => {
            const t0 = Date.now();
            let usage = null;
            for await (const x of stream(planMessages({ ...base, outline, template: cleanTemplate(p.template), planNote: clip(p.planNote, 300) }, items), { signal: request.signal, max_tokens: 4000, cfg })) {
                if (typeof x === "string") send("delta", { t: x }); else usage = x.usage;
            }
            send("done", { ms: Date.now() - t0, usage, left });
        });
    }

    // outline：检索例题 → 排大纲
    if (!mix.length) return Response.json({ error: "占比是空的" }, { status: 400 });
    return sse(async (send) => {
        const t0 = Date.now();
        send("stage", { k: "retrieve" });
        const R = await retrieve(mix.map((m) => ({ type: m.type, share: m.share, kps: m.kps })), ctx, { signal: request.signal, onStage: (k, d) => send("stage", { k, ...d }) });
        let n = 0;
        const items = R.flatMap((s) => s.items.map((it) => ({ ...it, code: `E${++n}` })));
        send("items", { slots: R.map((s) => ({ type: s.type, n: s.n, query: s.query, relax: s.relax, extra: s.extra, levelRelaxed: s.levelRelaxed, pool: s.pool, candidates: s.candidates, kpCovered: s.kpCovered })),
            items, alts: R.flatMap((s) => s.alts), ms: Date.now() - t0 });
        // 课外知识是附加的：挑条目出错（比如条目文件没拷上去）就不加这一节，大纲照排
        const exMin = extrasMinutes(settings);
        let ex = { picked: [], candidates: [] };
        if (exMin) try { ex = pickExtras(items, ctx.gt); send("extras", ex); } catch (e) { console.error("课外知识没挑成", e); }
        send("stage", { k: "outline" });
        const { data, usage } = await json(outlineMessages(base, items), { signal: request.signal, max_tokens: 3000, cfg });
        const o0 = cleanOutline(data, items.map((i) => i.code), true);
        const o = fitMinutes(exMin ? withExtras(o0, ex.picked, exMin) : o0, minutes);
        send("outline", student.attention === "容易分心" ? splitLong(o, base.attentionMax) : o);
        send("done", { ms: Date.now() - t0, usage, left });
    });
}

// 流式响应：fn(send) 里按事件推，出错发 error
function sse(fn) {
    const enc = new TextEncoder();
    const body = new ReadableStream({
        async start(ctl) {
            const send = (event, data) => ctl.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
            try { await fn(send); } catch (e) { send("error", { message: String(e.message || e).slice(0, 200) }); }
            ctl.close();
        },
    });
    return new Response(body, { headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" } });
}
