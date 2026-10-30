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
// POST { action: "ingest", name, text } → JSON { doc }：老师上传的教案切块、标题型、算向量，存进老师自己的教案库（MAT-542）；outline 带上 lib（教案库的块）就和题库一起检索
// POST { action: "adapt", sources: [{name, text, items?}], instruction, ... } → text/event-stream：stage → sources（编号统一后的原教案）→ items → extras → outline → done。在原教案上改写（1 份）或几份融合（2–4 份）成这节课的大纲（MAT-542）
// POST { action: "ask", q, history, students, current, exams } → text/event-stream：首页搜索框（MAT-545）。stage(parse) → intent（分拣成什么、参数）→
//   问答：stage(search) → sources（卷子 + 题目，编号从 1 起）→ stage(answer) → delta… → done；组卷、出教案：只到 intent → done，页面带上学生的画像接着调 paper / 排大纲、写教案
// POST { action: "paper", spec, preview: true } → JSON { refs, note }：同类真卷里排前 3 的参照卷（不检索、不计次数），首页拿它给老师几个能组合的方向
// POST { action: "paper", spec } → text/event-stream：ref（参照卷和大题）→ stage(retrieve) → paper（大题、加练、每组出处）→ done。spec 是 ask 分拣出的参数，页面认了学生的再加上
//   maxUnit（按日期推的进度）、scope（各考试的默认范围）、weak（各题型薄弱考点）、exclude（用过的题）、extra（薄弱点加练）
// POST { action: "intake", ... }  → JSON { profile }：建档时老师贴的一段话 → 名字、年级学期、学校、进度、画像维度、初始记忆
// POST { action: "afterclass", words, lesson: {topics, hw}, mix: {lesson, perf, weak, hw, exam}, praise, plan, examLabel, student, studentMems, logs, perf | members: [{name, gradeLabel, schoolLabel, profile, mems, logs, perf}] }
//   perf = { items: [["专注", "很专注"]], good: [题型], weak: [题型] }
//   → JSON { items: [{name, text}] }：发给家长的课后反馈，一对多一人一段
// POST { action: "ocr", images: [dataURL] }  → JSON { text }：建档时传的截图、照片 → 图里的字（最多 3 张）
// POST { action: "feedback", ... }→ JSON { ok }：首页反馈表单，存进 Redis（不调模型）；GET ?feedback=口令 读最近的反馈（口令见 feedbackToken，本地用 demo/feedback.mjs）
// POST { action: "login" | "demo" } → JSON { token, user }：账号登录 / 演示账号一键登录（MAT-510）
// POST { action: "load" | "save" }  → 带 Authorization: Bearer 令牌，读写账号里的整个工作区；save 带 base（上次同步的版本），账号里更新就回 409 和账号里的版本
// POST { action: "items", ids, gt } → 带令牌：换设备后本机没缓存的题面按 id 取回，按 IP 每天限量
// POST { action: "admin", token, op } → 站长管理账号（demo/account.mjs，口令从 DeepSeek key 派生）
// GET                              → 题库规模（带 ?feedback=口令 时返回反馈）
// 状态（学生、老师档案、大纲、教案）在浏览器里；登录了账号的，整个状态再存一份进 Redis（en:data:<uid>），函数本身不存东西。页面传回来的题目只有编号和 id，题面从题库取。
// 页面可以带自己的模型 key（byok），带了就不限次数；不带用站长的 DeepSeek，按 IP 限次。
import crypto from "node:crypto";
import {
    loadDB, retrieve, slotSize, itemsByIds, homeworkSlots, ingest, cleanLib, cleanLibPicked, libRetrieve, cleanSources, adaptMessages, outlineMessages, cleanOutline, fitMinutes, splitLong, planMessages, chatMessages, CHAT_OP_NAMES, memoryMessages, reviewMessages, sectionMessages,
    askMessages, cleanAsk, askSources, qaMessages, paperPlan, fillPaper, EXAM_KINDS,
    templateMessages, cleanTemplate, tidyMessages, intakeMessages, cleanIntake, ocr, okImages, afterclassMessages, AFTER_PARTS, shortenMessages, hanCount, noPronoun, feedbackPush, feedbackList, feedbackToken, stream, json, llmConfig, hit, cleanMems, cleanLogs, pickLogs, pickMems, TYPES, ATTN, TIER, extrasMinutes, pickExtras, withExtras,
    itemBodies, adminToken, verifyToken, acctLogin, acctDemo, dataLoad, dataSave, itemsQuota, acctAdmin,
} from "./_lib/english.mjs";

const env = (k, d) => Number(process.env[k] ?? d);
const PER_IP = { outline: env("EN_PLAN_DAILY", 8), plan: env("EN_PLAN_DAILY", 8), search: env("EN_SEARCH_DAILY", 30), chat: env("EN_CHAT_DAILY", 30),
    section: env("EN_SECTION_DAILY", 30), memory: env("EN_MEMORY_DAILY", 30), review: env("EN_REVIEW_DAILY", 15), template: env("EN_TEMPLATE_DAILY", 10),
    intake: env("EN_INTAKE_DAILY", 15), ocr: env("EN_OCR_DAILY", 10), afterclass: env("EN_AFTERCLASS_DAILY", 15), feedback: env("EN_FEEDBACK_DAILY", 10), tidy: env("EN_TIDY_DAILY", 10),
    ingest: env("EN_INGEST_DAILY", 20), adapt: env("EN_PLAN_DAILY", 8), ask: env("EN_ASK_DAILY", 20), paper: env("EN_PAPER_DAILY", 10) };
const LABEL = { outline: "排大纲", plan: "写教案", search: "找题", chat: "聊天", section: "改教案", memory: "更新记忆", review: "复盘", template: "抽模板", intake: "分析建档描述", ocr: "认图片里的字", afterclass: "写课后反馈", feedback: "提反馈", tidy: "整理记忆", ingest: "存教案库", adapt: "改写教案", ask: "首页提问", paper: "组卷" };
const clip = (s, n) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);
const strs = (x, n, m) => (Array.isArray(x) ? x : []).slice(0, n).map((v) => clip(v, m)).filter(Boolean);

export async function GET(request) {
    const fb = new URL(request.url).searchParams.get("feedback");
    if (fb != null) {
        const ok = fb.length === 32 && process.env.DEEPSEEK_API_KEY && crypto.timingSafeEqual(Buffer.from(fb), Buffer.from(feedbackToken()));
        if (!ok) return Response.json({ error: "口令不对" }, { status: 403 });
        try { return Response.json({ feedback: await feedbackList() }); } catch (e) { return Response.json({ error: String(e.message || e) }, { status: 503 }); }
    }
    try { const db = loadDB(); return Response.json({ ready: true, units: db.units.length, built: db.meta.built }); }
    catch (e) { return Response.json({ ready: false, error: String(e.message || e) }); }
}

// ---------- 账号（MAT-510）：登录、演示账号、读写工作区、取回题面、站长管理，都不调模型、不占次数 ----------
const ACCOUNT = new Set(["login", "demo", "load", "save", "items", "admin"]);
const ipOf = (request) => { const h = request.headers; return h.get("x-real-ip") || (h.get("x-forwarded-for") || "").split(",")[0].trim() || "local"; };
const authOf = (request) => (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
const reply = ({ status = 200, ...x }) => Response.json(x, { status: x.conflict ? 409 : status });
async function account(p, request) {
    try {
        const ip = ipOf(request);
        if (p.action === "login") return reply(await acctLogin(p.user, p.pw, ip));
        if (p.action === "demo") return reply(await acctDemo(ip));
        if (p.action === "admin") {
            const t = String(p.token || ""), ok = t.length === 32 && process.env.DEEPSEEK_API_KEY && crypto.timingSafeEqual(Buffer.from(t), Buffer.from(adminToken()));
            return reply(ok ? await acctAdmin(p) : { error: "口令不对", status: 403 });
        }
        const uid = verifyToken(authOf(request));
        if (!uid) return reply({ error: "登录过期了，请重新登录", status: 401 });
        if (p.action === "load") return reply(await dataLoad(uid));
        if (p.action === "save") return reply(await dataSave(uid, p.data, p.base ?? null));
        const ids = (Array.isArray(p.ids) ? p.ids : []).slice(0, 40);   // items
        if (!(await itemsQuota(ip, ids.length))) return reply({ error: "今天取回题面的次数用完了，明天再来", status: 429 });
        return reply({ items: itemBodies(ids, String(p.gt || "").slice(0, 2)) });
    } catch (e) { return reply({ error: String(e.message || e).slice(0, 200), status: 503 }); }
}

export async function POST(request) {
    let p = {};
    try { p = await request.json(); } catch {}
    if (ACCOUNT.has(p.action)) return account(p, request);
    const action = Object.hasOwn(PER_IP, p.action) || p.action === "extras" ? p.action : "outline";
    const cfg = llmConfig(p.byok);
    let left = null;
    if ((!cfg.own || action === "ocr") && action !== "extras" && !(action === "paper" && p.preview)) {   // extras、组卷的方向预览不调模型，不占次数；看图总用站长的 key，自带 key 也计次
        // 正式账号按账号计次、额度放宽到 5 倍（一个老师自己备课够用）；演示账号和没登录的照旧按 IP
        const uid = verifyToken(authOf(request)), real = !!uid?.startsWith("u:"), per = PER_IP[action] * (real ? 5 : 1);
        const lim = await hit(real ? uid : ipOf(request), action, per);
        if (!lim.ok) return Response.json({ error: lim.global ? "今天全站的额度用完了，明天再来；也可以在聊天框的设置里填自己的 key" : `今天${LABEL[action]}的次数用完了（每人每天 ${per} 次）。可以在聊天框的设置里填自己的 key，就不限次数了` }, { status: 429 });
        left = lim.left;
    }
    const studentMems = cleanMems(p.studentMems), teacherMems = cleanMems(p.teacherMems);
    const student = { name: clip(p.student?.name, 10), gradeLabel: clip(p.student?.gradeLabel, 40), schoolLabel: clip(p.student?.schoolLabel, 40),
        attention: ATTN.includes(p.student?.attention) ? p.student.attention : "", profile: clip(p.student?.profile, 1500), group: strs(p.student?.members, 12, 10) };   // group：一对多时组里的学生
    const settings = p.settings && typeof p.settings === "object" ? p.settings : null;   // 老师设置，settingsLine 里逐个字段校验
    const visual = !!p.visual, weakKps = clip(p.weakKps, 300);
    const logs = cleanLogs(p.logs);
    const ex = p.exam || {};
    const ctx = {
        gt: clip(ex.gt, 2), kind: clip(ex.kind, 6), level: ["统考", "不统考", "不知道"].includes(ex.level) ? ex.level : "不知道",
        school: clip(p.student?.school, 10), district: clip(p.student?.district, 6), textbook: p.student?.textbook === "旧" ? "旧" : "新", guidance: clip(p.guidance, 200),
        difficulty: Object.keys(TIER).includes(p.difficulty) ? p.difficulty : "",
    };
    // 这个学生以前的课上、作业用过的题（MAT-487）：检索默认不再出；老师说「上次那道」「错题重做」时放开
    const used = /上次那[道篇]|错题重做|重做/.test(ctx.guidance) ? new Set() : new Set(strs(p.used, 400, 60));
    const mix = (Array.isArray(p.mix) ? p.mix : []).filter((m) => TYPES.includes(m.type) && +m.share > 0).slice(0, 14)
        .map((m) => ({ type: m.type, share: Math.min(1, +m.share), minutes: Math.round(+m.minutes || 0), from: clip(m.from, 60), kps: strs(m.kps, 4, 12) }));
    const minutes = Math.max(30, Math.min(240, +p.minutes || 120));
    const base = {
        // 档案多了只带相关的（MAT-527）
        student, studentMems: pickMems(studentMems, mix), teacherMems: pickMems(teacherMems, mix), settings, visual, weakKps, attentionMax: Math.max(8, Math.min(30, +p.attentionMax || 15)),
        logs: pickLogs(logs, mix), guidance: clip(p.guidance, 300), minutes, mix, unitPlan: clip(p.unitPlan, 120),   // 最近 2 次 + 相关的 3 次（MAT-527）
        exam: { label: clip(ex.label, 80), levelLabel: clip(ex.levelLabel, 120), structure: clip(ex.structure, 400), school: clip(ex.school, 300) },
    };
    const fail = (e) => Response.json({ error: String(e.message || e).slice(0, 200) }, { status: 500 });

    if (action === "extras") {
        try { return Response.json(pickExtras(itemsByIds(p.items, ctx.gt), ctx.gt)); } catch (e) { return fail(e); }
    }

    if (action === "review") {
        try {
            const { data, usage } = await json(reviewMessages({ student, studentMems, teacherMems, settings, weakKps, logs: logs.slice(-8), observations: p.observations, mix: p.mix, examLabel: p.examLabel }), { signal: request.signal, cfg });
            const sug = (Array.isArray(data.suggestions) ? data.suggestions : []).slice(0, 4).map((x) => ({
                title: clip(x.title, 30), detail: clip(x.detail, 90), evidence: clip(x.evidence, 70), kind: clip(x.kind, 4),
                type: TYPES.includes(x.type) ? x.type : "", delta: Math.max(-0.15, Math.min(0.15, +x.delta || 0)),
            }));
            return Response.json({ suggestions: sug, gaps: clip(data.gaps, 60), usage, left });
        } catch (e) { return fail(e); }
    }

    if (action === "memory") {
        const text = clip(p.text, 2000);   // 带上截图、照片认出来的字（MAT-545）
        if (text.length < 4) return Response.json({ error: "记录太短" }, { status: 400 });
        try {
            const kps = Object.fromEntries(Object.entries(p.kpByType && typeof p.kpByType === "object" ? p.kpByType : {}).filter(([t]) => TYPES.includes(t)).map(([t, ks]) => [t, strs(ks, 14, 10)]));
            const { data, usage } = await json(memoryMessages({ date: clip(p.date, 10), student, studentMems, teacherMems, settings, observations: p.observations, text }, kps), { signal: request.signal, cfg });
            return Response.json({ ops: Array.isArray(data.ops) ? data.ops.slice(0, 12) : [], log: data.log || null, usage, left });
        } catch (e) { return fail(e); }
    }

    if (action === "tidy") {   // 心跳整理（MAT-527 第 4 步）
        try {
            const { data, usage } = await json(tidyMessages({ date: clip(p.date, 10), student, studentMems, teacherMems, says: strs(p.says, 30, 100), observations: strs(p.observations, 12, 80) }), { signal: request.signal, cfg });
            return Response.json({ ops: Array.isArray(data.ops) ? data.ops.slice(0, 12) : [], note: clip(data.note, 120), usage, left });
        } catch (e) { return fail(e); }
    }

    if (action === "feedback") {
        const text = String(p.text || "").trim().slice(0, 1000);
        if (text.length < 2) return Response.json({ error: "写点想说的再提交" }, { status: 400 });
        const c = p.contact && typeof p.contact === "object" ? { name: clip(p.contact.name, 20), kind: ["微信", "电话", "邮箱", "其他"].includes(p.contact.kind) ? p.contact.kind : "其他", value: clip(p.contact.value, 60) } : null;
        const entry = { at: new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 16).replace("T", " "), text, ...(c?.value ? { contact: c } : {}), page: clip(p.page, 10) };
        try { await feedbackPush(entry); return Response.json({ ok: true }); }
        catch { return Response.json({ error: "反馈暂时存不进去，可以直接发邮件到 matsuriismywaifu@gmail.com" }, { status: 503 }); }
    }

    if (action === "afterclass") {
        // 一个学生走 student / studentMems / logs；一对多传 members（每人一份档案 + 个别情况），一次写出每人一段
        const words = Math.max(50, Math.min(800, Math.round(+p.words || 200)));
        const strs = (a, n = 16) => (Array.isArray(a) ? a : []).slice(0, n).map((t) => clip(t, 16)).filter(Boolean);
        const perf = (x) => ({ items: (Array.isArray(x?.items) ? x.items : []).slice(0, 6).map((r) => [clip(r?.[0], 6), clip(r?.[1], 10)]).filter(([a, b]) => a && b), good: strs(x?.good), weak: strs(x?.weak) });
        const students = Array.isArray(p.members) && p.members.length
            ? p.members.slice(0, 8).map((m) => ({ name: clip(m?.name, 10) || "这个学生", gradeLabel: clip(m?.gradeLabel, 40), schoolLabel: clip(m?.schoolLabel, 40), profile: clip(m?.profile, 1500),
                mems: cleanMems(m?.mems), logs: cleanLogs(m?.logs).slice(-3), perf: perf(m?.perf) }))
            : [{ name: student.name || "这个学生", gradeLabel: student.gradeLabel, schoolLabel: student.schoolLabel, profile: student.profile, mems: studentMems, logs: logs.slice(-3), perf: perf(p.perf) }];
        // 各部分占比：全是 0 或没传就按默认；表扬占比 0–100，默认 60
        let mix = AFTER_PARTS.map(([k, n]) => [n, Math.max(0, Math.min(100, Math.round(+p.mix?.[k] || 0)))]);
        if (!mix.some(([, v]) => v)) mix = AFTER_PARTS.map(([, n], i) => [n, [25, 30, 20, 15, 10][i]]);
        const praise = Number.isFinite(+p.praise) && p.praise !== null && p.praise !== "" ? Math.max(0, Math.min(100, Math.round(+p.praise / 10) * 10)) : 60;
        const tok = Math.min(8000, students.length * words * 2 + 300);
        const fit = async (text) => {   // 写超了两成：压一次（不另计次），压坏了就用原来的
            if (hanCount(text) <= words * 1.2) return text;
            const r = await json(shortenMessages(text, words), { signal: request.signal, cfg, max_tokens: Math.min(2500, words * 2 + 300) }).catch(() => null);
            const t2 = String(r?.data?.text || "").trim().slice(0, 2000);
            return t2 && hanCount(t2) < hanCount(text) ? noPronoun(t2) : text;
        };
        try {
            const { data, usage } = await json(afterclassMessages({ students, exam: clip(p.examLabel, 80), plan: clip(p.plan, 800), lesson: { topics: strs(p.lesson?.topics), hw: strs(p.lesson?.hw, 8) }, mix, praise, words }), { signal: request.signal, cfg, max_tokens: tok });
            const raw = students.length > 1 ? (Array.isArray(data.items) ? data.items : []) : [{ text: data.text }];
            // 按顺序对上学生；模型给的名字只作核对，对不上就按位置
            // 按名字对上；模型给了名字但对不上的才按位置（漏写的学生不能被别人那段顶上）
            const byName = raw.some((r) => students.some((x) => clip(r?.name, 10) === x.name));
            const items = students.map((x, i) => ({ name: x.name, text: noPronoun(String((byName ? raw.find((r) => clip(r?.name, 10) === x.name) : raw[i])?.text || "").trim().slice(0, 2000)) }));
            // 一对多还是漏了谁：给漏掉的人各单独写一次（同一节课的资料，不另计次）
            if (students.length > 1) await Promise.all(items.map(async (x, i) => {
                if (x.text) return;
                const r = await json(afterclassMessages({ students: [students[i]], exam: clip(p.examLabel, 80), plan: clip(p.plan, 800), lesson: { topics: strs(p.lesson?.topics), hw: strs(p.lesson?.hw, 8) }, mix, praise, words }),
                    { signal: request.signal, cfg, max_tokens: Math.min(2500, words * 2 + 300) }).catch(() => null);
                x.text = noPronoun(String(r?.data?.text || "").trim().slice(0, 2000));
            }));
            if (!items.some((x) => x.text)) return Response.json({ error: "没写出来，再试一次" }, { status: 502 });
            await Promise.all(items.map(async (x) => { if (x.text) x.text = await fit(x.text); }));
            return Response.json({ items, text: items[0].text, usage, left });
        } catch (e) { return fail(e); }
    }

    if (action === "ocr") {
        const images = okImages(p.images);
        if (!images.length) return Response.json({ error: "没收到能认的图片（JPG / PNG / WebP，一次最多 3 张）" }, { status: 400 });
        try {
            const { text, usage } = await ocr(images, { signal: request.signal });
            if (!text) return Response.json({ error: "图里没认出和学生有关的字" }, { status: 422 });
            return Response.json({ text, usage, left });
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

    if (action === "ingest") {
        const text = String(p.text || "").slice(0, 20000);
        if (text.trim().length < 50) return Response.json({ error: "没从文件里读出多少文字（至少 50 个字）" }, { status: 400 });
        try {
            const { doc, usage } = await ingest(clip(p.name, 40), text, { signal: request.signal, cfg });
            if (!doc) return Response.json({ error: "没读出能用的内容" }, { status: 422 });
            return Response.json({ doc, usage, left });
        } catch (e) { return fail(e); }
    }

    if (action === "adapt") {
        const { sources, items: refs } = cleanSources(p.sources);
        if (!sources.length) return Response.json({ error: "没收到原教案（每份至少 20 个字）" }, { status: 400 });
        return sse(async (send) => {
            const t0 = Date.now();
            send("stage", { k: "adapt" });
            send("sources", sources);
            const own = itemsByIds(refs, ctx.gt);   // 存下来的教案带着的题库例题，编号已经统一
            const { data, usage } = await json(adaptMessages({ ...base, instruction: clip(p.instruction, 300) }, sources, own), { signal: request.signal, max_tokens: 3500, cfg });
            const o0 = cleanOutline(data, own.map((i) => i.code));
            // 要补题的环节：同一题型合成一个检索槽，检索到的按顺序分给这些环节
            const want = new Map();
            (Array.isArray(data.sections) ? data.sections : []).slice(0, 14).forEach((x, i) => {
                const sec = o0.sections[i], need = Math.max(0, Math.min(3, Math.round(+x?.need || 0)));
                if (sec?.type && need) (want.get(sec.type) || want.set(sec.type, []).get(sec.type)).push({ sec, need, query: clip(x?.query, 80) });
            });
            send("stage", { k: "retrieve" });
            const slots = [...want].map(([type, ws]) => ({ type, share: 0.1, kps: mix.find((m) => m.type === type)?.kps || [], query: ws.map((w) => w.query).filter(Boolean).join("；") || undefined, n: ws.reduce((a, w) => a + w.need, 0) }));
            const R = slots.length ? await retrieve(slots, { ...ctx, exclude: new Set([...used, ...refs.map((r) => r.id)]) }, { signal: request.signal }) : [];
            const byId = new Map(itemBodies(refs.map((r) => r.id), ctx.gt).map((x) => [x.id, x]));
            const items = refs.map((r) => byId.get(r.id) && { ...byId.get(r.id), code: r.code }).filter(Boolean);
            let n = refs.length;
            R.forEach((r, k) => {
                const ws = want.get(slots[k].type);
                for (const it of r.items) {
                    const w = ws.find((x) => x.need > 0); if (!w) break;
                    const code = `E${++n}`;
                    items.push({ ...it, code }); w.sec.items.push(code); w.need--;
                }
            });
            send("items", { items, alts: R.flatMap((s) => s.alts), slots: R.map((s) => ({ type: s.type, n: s.n, query: s.query, relax: s.relax, pool: s.pool })), ms: Date.now() - t0 });
            const exMin = extrasMinutes(settings);
            let ex = { picked: [], candidates: [] };
            if (exMin) try { ex = pickExtras(items, ctx.gt); send("extras", ex); } catch (e) { console.error("课外知识没挑成", e); }
            // 改写要求里改了课时（「改成 90 分钟」）就按它排，页面和微信端跟着改这节课的课时
            const total = Math.max(30, Math.min(240, Math.round(+data.minutes || minutes)));
            const o = fitMinutes(exMin ? withExtras(o0, ex.picked, exMin) : o0, total);
            if (total !== minutes) o.lessonMinutes = total;
            send("outline", student.attention === "容易分心" ? splitLong(o, base.attentionMax) : o);
            send("done", { ms: Date.now() - t0, usage, left });
        });
    }

    // 首页搜索框（MAT-545）：先分拣，问答和组卷在这里做完；出教案只把参数交回页面
    if (action === "ask") {
        const q = clip(p.q, 300);
        if (!q) return Response.json({ error: "说点什么" }, { status: 400 });
        const GT = ["七上", "七下", "八上", "八下", "九上", "九下"];
        const students = (Array.isArray(p.students) ? p.students : []).slice(0, 40).map((s) => ({ name: clip(s?.name, 10), gt: GT.includes(s?.gt) ? s.gt : "",
            school: clip(s?.school, 10), schoolName: clip(s?.schoolName, 30), district: clip(s?.district, 6), textbook: s?.textbook === "旧" ? "旧" : "新" })).filter((s) => s.name);
        const current = students.find((s) => s.name === clip(p.current, 10)) || null;
        const exams = Object.fromEntries(Object.entries(p.exams && typeof p.exams === "object" ? p.exams : {}).filter(([g, k]) => GT.includes(g) && EXAM_KINDS.includes(k)));   // 各年级学期的下一场考试，页面按考试日历算
        const history = (Array.isArray(p.history) ? p.history : []).slice(-3).map((h) => ({ q: clip(h?.q, 200), said: clip(h?.said, 200) })).filter((h) => h.q);
        return sse(async (send) => {
            const t0 = Date.now();
            send("stage", { k: "parse" });
            const d = cleanAsk((await json(askMessages({ q, history, students, current }), { signal: request.signal, cfg, max_tokens: 600 })).data);
            // 说到的学生；组卷、出教案没点名的，年级对得上（或没说年级）就按正在备的学生（用户 10-30：认现在登录的是哪份档案），说「通用」的不按学生。
            // 学校、区跟着这个学生走，老师自己说了学校或区的就不带
            const st = d.student ? students.find((s) => s.name === d.student) || students.find((s) => s.name.includes(d.student) || d.student.includes(s.name)) : null;
            const from = st || (d.intent !== "qa" && !d.generic && (!d.gt || d.gt === current?.gt) ? current : null);
            const gt = d.gt || from?.gt || (d.intent === "paper" ? "九上" : "");
            const spec = { ...d, asked: d.student, kindAsked: d.kind, gt, kind: d.kind || (d.intent !== "qa" && gt ? exams[gt] || "期末" : ""), student: (st || (d.intent === "plan" ? current : from))?.name || "",
                school: d.school || (from && !d.district ? from.school || from.schoolName : ""), district: d.district || (from && !d.school ? from.district : ""), textbook: from?.textbook || "新" };
            send("intent", spec);
            if (d.intent === "qa") {
                send("stage", { k: "search" });
                const src = await askSources(spec, d.query || q, { signal: request.signal });
                send("sources", src);
                send("stage", { k: "answer" });
                for await (const x of stream(qaMessages(q, spec, src), { signal: request.signal, max_tokens: 900, cfg })) if (typeof x === "string") send("delta", { t: x });
            }
            send("done", { ms: Date.now() - t0, left });
        });
    }
    if (action === "paper") {
        const s = p.spec && typeof p.spec === "object" ? p.spec : {}, GT = ["七上", "七下", "八上", "八下", "九上", "九下"];
        const scope = Object.fromEntries(["上", "下"].map((t) => [t, Object.fromEntries(Object.entries(s.scope?.[t] || {}).filter(([k]) => EXAM_KINDS.includes(k)).map(([k, v]) => [k, clip(v, 12)]))]));
        const spec = { ...cleanAsk(s), gt: GT.includes(s.gt) ? s.gt : "九上", kind: EXAM_KINDS.includes(s.kind) ? s.kind : "期末", textbook: s.textbook === "旧" ? "旧" : "新",
            maxUnit: Number.isInteger(s.maxUnit) && s.maxUnit >= 1 && s.maxUnit <= 8 ? s.maxUnit : 0, scope, exclude: strs(s.exclude, 400, 60), ref: /^[0-9a-f]{10}$/.test(s.ref || "") ? s.ref : "",
            weak: Object.fromEntries(Object.entries(s.weak && typeof s.weak === "object" ? s.weak : {}).filter(([t]) => TYPES.includes(t)).slice(0, 14).map(([t, ks]) => [t, strs(ks, 3, 12)])),
            extra: (Array.isArray(s.extra) ? s.extra : []).filter((x) => TYPES.includes(x?.type)).slice(0, 2).map((x) => ({ type: x.type, kps: strs(x.kps, 3, 12), n: Math.max(1, Math.min(10, Math.round(+x.n || 1))) })) };
        // preview：只挑参照卷、不检索，首页先给老师几个能组合的方向（用户 10-30：默认不直接给一份卷子）
        if (p.preview) { const { refs, note } = paperPlan(spec); return Response.json({ refs, note }); }
        return sse(async (send) => {
            const t0 = Date.now(), plan = paperPlan(spec);
            if (!plan.secs.length) throw new Error(plan.note);
            send("ref", plan);
            send("stage", { k: "retrieve" });
            send("paper", await fillPaper(spec, plan, { signal: request.signal }));
            send("done", { ms: Date.now() - t0, left });
        });
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
            const exclude = new Set([...strs(p.exclude, 60, 40), ...used]);
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
            const sources = cleanSources(p.sources).sources, lib = cleanLibPicked(p.lib);   // 改写、融合时的原教案；排大纲时从教案库挑中的几节（MAT-542）
            for await (const x of stream(planMessages({ ...base, outline, template: cleanTemplate(p.template), planNote: clip(p.planNote, 300), sources, lib }, items), { signal: request.signal, max_tokens: 4000, cfg })) {
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
        // 题库和老师自己的教案库一起检索（MAT-542）：教案库出错不影响排大纲
        const libIn = cleanLib(p.lib);
        // 作业用题和课上的一起检索，撞上课上的题就跳过（MAT-487）；作业出错不影响排大纲
        const rctx = { ...ctx, exclude: used }, hwSlots = homeworkSlots(mix, settings);
        const [R, H, lib] = await Promise.all([retrieve(mix.map((m) => ({ type: m.type, share: m.share, kps: m.kps })), rctx, { signal: request.signal, onStage: (k, d) => send("stage", { k, ...d }) }),
            // 和课上同一种排法，前几道就是课上那几道：多要课上那么多道再加一道，跳过撞上的
            retrieve(hwSlots.map((s) => ({ ...s, n: s.n + slotSize(s.type, mix.find((m) => m.type === s.type)?.share || 0) + 1 })), rctx, { signal: request.signal }).catch((e) => { console.error("作业用题没检索成", e); return []; }),
            libIn.length ? libRetrieve(libIn, mix, ctx.guidance, { signal: request.signal }).catch((e) => { console.error("教案库没检索成", e); return []; }) : []]);
        if (lib.length) send("lib", lib);
        let n = 0;
        const cls = R.flatMap((s) => s.items.map((it) => ({ ...it, code: `E${++n}` }))), inClass = new Set(cls.map((it) => it.id));
        const hw = H.flatMap((s, k) => s.items.filter((it) => !inClass.has(it.id)).slice(0, hwSlots[k].n)).map((it) => ({ ...it, code: `E${++n}`, hw: true }));
        const items = [...cls, ...hw];
        send("items", { slots: R.map((s) => ({ type: s.type, n: s.n, query: s.query, relax: s.relax, extra: s.extra, levelRelaxed: s.levelRelaxed, pool: s.pool, candidates: s.candidates, kpCovered: s.kpCovered })),
            items, alts: R.flatMap((s) => s.alts), ms: Date.now() - t0 });
        // 课外知识是附加的：挑条目出错（比如条目文件没拷上去）就不加这一节，大纲照排
        const exMin = extrasMinutes(settings);
        let ex = { picked: [], candidates: [] };
        if (exMin) try { ex = pickExtras(cls, ctx.gt); send("extras", ex); } catch (e) { console.error("课外知识没挑成", e); }
        send("stage", { k: "outline" });
        const { data, usage } = await json(outlineMessages({ ...base, lib }, items), { signal: request.signal, max_tokens: 3000, cfg });
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
