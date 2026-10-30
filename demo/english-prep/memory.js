// 记忆：老师档案（T）和学生档案（S）。模型只提议增删改（/api/english action=memory），怎么落到档案上由这里决定：
// 每条改动都留「改之前」的样子，可以单条撤销；删掉的进「已忘记」，也能恢复。薄弱点强度按半衰期衰减。纯函数，页面和评测脚本共用。
import { daysBetween } from "./model.js";

export const STUDENT_CATS = ["薄弱点", "已掌握", "学习习惯", "状态", "目标"];
export const TEACHER_CATS = ["讲题习惯", "课堂结构", "编排习惯", "偏好"];   // 编排习惯：MAT-527 第 1 步，从老师对大纲的反复改动里提出来
export const ATTENTION = ["集中", "一般", "容易分心"];

// 学生画像的维度（用户 10-29）：core 的三项建档就显示，其余老师点「+」挑着加。
// 每项分 5 级（用户 10-29：光谱只分三段太粗，改成一格一格的框），levels 是每级的 [短名, 陈述]，从低到高。
// 存的还是 0–100（st.dims），取每级中间的值 10 / 30 / 50 / 70 / 90；模型给的任意值落到所在那一级。lo、hi 是两头的说法，给模型打分用，也是 dimZone 的三段名。
// 学习进度例外：按这一册的单元算，存在 st.progress / st.unit（页面上画）；注意力 1–2 级 / 3 级 / 4–5 级正好是 ATTENTION 的三段，st.attention 跟着变
export const DIMS = [
    { key: "progress", label: "学习进度", core: true },
    { key: "habit", label: "学习习惯", lo: "拖拉马虎", hi: "自觉认真",
        levels: [["拖拉马虎", "作业常拖、常漏，错题不订正"], ["偏拖拉", "作业要催才交，订正马马虎虎"], ["一般", "作业按时交，订正要人提醒"], ["比较自觉", "作业按时认真，会自己订正"], ["自觉认真", "主动预习复习，错题自己整理"]], core: true },
    { key: "attention", label: "注意力集中度", lo: "容易分心", hi: "集中",
        levels: [["很难集中", "几分钟就走神，得一直盯着"], ["容易分心", "能专心十来分钟，之后要提醒"], ["一般", "能专心二十分钟左右，偶尔要拉回来"], ["比较集中", "大部分时间在状态，碰到难题会走神"], ["集中", "整节课都在状态，能长时间独立做题"]], core: true },
    { key: "vocab", label: "词汇量", lo: "偏少", hi: "扎实",
        levels: [["很少", "课本单词大半不认识"], ["偏少", "课本单词认得一半左右，拼写常错"], ["一般", "课本单词基本认得，课外词很少"], ["较好", "课本单词扎实，认得一些课外词"], ["扎实", "课外词也多，阅读很少被生词卡住"]], group: "英语能力" },
    { key: "grammar", label: "语法基础", lo: "薄弱", hi: "扎实",
        levels: [["很薄弱", "时态、词性都分不清"], ["薄弱", "规则知道一些，做题常用错"], ["一般", "常考语法点基本会，复杂句会错"], ["较好", "常考点都会，难点上偶尔错"], ["扎实", "能讲清为什么这样填，语法题很少错"]], group: "英语能力" },
    { key: "reading", label: "阅读速度", lo: "慢", hi: "快",
        levels: [["很慢", "一篇读不完，逐词翻译"], ["慢", "读得完，但时间很紧"], ["一般", "规定时间里能做完"], ["较快", "做完还有时间回头检查"], ["快", "读得快，主旨和细节都抓得住"]], group: "英语能力" },
    { key: "listening", label: "听力", lo: "听不懂", hi: "听得清",
        levels: [["听不懂", "慢速也只能听出零星单词"], ["偏弱", "简单句能听懂，对话一长就跟不上"], ["一般", "常规题能做，细节题常丢分"], ["较好", "大部分能听懂，偶尔漏细节"], ["听得清", "正常语速基本都能听懂"]], group: "英语能力" },
    { key: "speaking", label: "口语表达", lo: "不敢开口", hi: "流利",
        levels: [["不敢开口", "叫到也不肯说"], ["偏弱", "能说单词和短句，说不连贯"], ["一般", "能说简单的句子，常停下来想"], ["较好", "能连着说几句，偶尔有语法错"], ["流利", "说得流利，敢主动开口"]], group: "英语能力" },
    { key: "writing", label: "书面表达", lo: "写不出", hi: "写得好",
        levels: [["写不出", "写不满字数，句子不通"], ["偏弱", "能凑够字数，错误多、句子简单"], ["一般", "要点写得全，表达平淡"], ["较好", "结构清楚，会用连接词"], ["写得好", "有好句型和过渡，基本没有错"]], group: "英语能力" },
    { key: "handwriting", label: "书写卷面", lo: "潦草", hi: "工整",
        levels: [["潦草", "字难认，涂改多"], ["偏乱", "认得出，卷面不整洁"], ["一般", "清楚，但不算好看"], ["较工整", "整齐，涂改少"], ["工整", "字好看、卷面干净，能拿印象分"]], group: "英语能力" },
    { key: "initiative", label: "学习主动性", lo: "要人催", hi: "主动",
        levels: [["要人催", "不催不学"], ["偏被动", "布置了才做，不多做"], ["一般", "布置的认真做，很少主动问"], ["较主动", "不懂会主动问"], ["主动", "自己找题练、给自己定目标"]], group: "学习状态" },
    { key: "confidence", label: "自信心", lo: "容易紧张", hi: "自信",
        levels: [["很紧张", "一考试就慌，会做的也做错"], ["容易紧张", "碰到难题就慌"], ["一般", "正常发挥，偶尔紧张"], ["较自信", "敢碰难题"], ["自信", "心态稳，大考也能正常发挥"]], group: "学习状态" },
    { key: "participation", label: "课堂互动", lo: "不爱发言", hi: "积极发言",
        levels: [["不爱发言", "叫到也很少回答"], ["偏少", "叫到才答，声音小"], ["一般", "叫到能答，很少主动举手"], ["较积极", "会主动回答"], ["积极发言", "抢着答，还会追问"]], group: "学习状态" },
    { key: "parent", label: "家长配合", lo: "很少过问", hi: "配合紧密",
        levels: [["很少过问", "联系不上，或者不回消息"], ["偏少", "偶尔回消息，不管作业"], ["一般", "会问成绩，不怎么督促"], ["较配合", "会督促作业，消息回得及时"], ["配合紧密", "常和老师沟通，在家跟进"]], group: "家庭" },
];
export const DIM = Object.fromEntries(DIMS.map((d) => [d.key, d]));
export const dimLevel = (v) => Math.max(0, Math.min(4, Math.floor(v / 20)));   // 0–100 → 第几级（0–4）
export const levelValue = (i) => 10 + 20 * i;
export const dimZone = (d, v) => (v < 40 ? d.lo : v >= 60 ? d.hi : "一般");   // 三段和级对齐：1–2 级、3 级、4–5 级
const ATT_MID = { 容易分心: 30, 一般: 50, 集中: 70 };
// 存的值。注意力以 st.attention 为准（agent 记一笔也会改它），两边对不上就取那一段的中间；没填过的算 50
export function dimValue(st, key) {
    const v = st.dims?.[key];
    if (key === "attention") return v != null && dimZone(DIM.attention, v) === st.attention ? v : ATT_MID[st.attention];
    return v ?? 50;
}
export function setDim(st, key, v) {
    (st.dims ||= {})[key] = v;
    if (key === "attention") st.attention = dimZone(DIM.attention, v);
}

// 老师设置（MAT-498）：老师自己填的课堂设置和偏好。有 options 的是选项，有 min / max 的是整数
export const SETTINGS = {
    lessonType: { label: "课型", options: ["一对一", "一对多"], def: "一对一" },   // 一对多：几个学生编成一组一起备课（MAT-509；原来叫「小班」）
    minutes: { label: "一次课（分钟）", min: 40, max: 240, def: 120 },
    perWeek: { label: "每周几次", min: 1, max: 7, def: 2 },
    dictation: { label: "开头单词默写（分钟）", min: 0, max: 30, def: 10 },
    recap: { label: "结尾错题回顾（分钟）", min: 0, max: 30, def: 10 },
    extrasMinutes: { label: "课外知识补充（分钟，0 是不加）", min: 0, max: 20, def: 8 },   // 词根词缀、熟词僻义、真考过的俗语谚语……（用户 10-29）
    focusTypes: { label: "一节课主攻几个题型", options: [0, 2, 3, 4], names: { 0: "不限" }, def: 0 },
    fullPaper: { label: "考前最后一节做整卷", options: ["不做", "做"], def: "不做" },
    homeworkMinutes: { label: "作业时长上限（分钟）", min: 0, max: 120, def: 30 },
    homeworkScope: { label: "作业练什么", options: ["只练薄弱点", "全面练"], def: "只练薄弱点" },
    difficulty: { label: "例题难度", options: ["不限", "偏易", "适中", "偏难"], def: "不限" },   // 默认不限：检索排序和原来一样
    visual: { label: "讲义版式", options: ["按学生注意力", "都用彩色", "都用黑白"], def: "按学生注意力" },
    fontSize: { label: "讲义字号", options: ["标准", "大"], def: "标准" },
    answerPos: { label: "老师版答案和解析", options: ["题目下方", "文档末尾"], def: "题目下方" },
    template: { label: "默认教案模板", def: "four" },
};
export const defaultSettings = () => ({ ...Object.fromEntries(Object.entries(SETTINGS).map(([k, f]) => [k, f.def])), bias: {} });
// 校验一个设置值：合法就返回规整后的值，不合法返回 undefined。template 只认已有的模板 id
export function validSetting(field, value, templateIds = []) {
    const f = Object.hasOwn(SETTINGS, field) ? SETTINGS[field] : null;
    if (!f || value == null || value === "") return undefined;
    if (field === "template") return templateIds.includes(value) ? value : undefined;
    if (f.options) return f.options.find((o) => String(o) === String(value));
    const n = Math.round(+value);
    return Number.isFinite(n) ? Math.max(f.min, Math.min(f.max, n)) : undefined;
}
export const showSetting = (field, v) => (SETTINGS[field]?.names?.[v] ?? v);
const clip = (s, n) => String(s ?? "").trim().slice(0, n);
const clone = (x) => JSON.parse(JSON.stringify(x));

// 有效强度：最近一次有证据的日子往后按半衰期衰减
export function effStrength(m, today, halfLife = 45) {
    if (m.strength == null) return null;
    const days = Math.max(0, daysBetween(m.updated || today, today));
    return m.strength * Math.pow(0.5, days / halfLife);
}

// 各题型的薄弱程度（0–1）和对应的薄弱考点（按强度排）。ledger 是 kpLedger 的结果，只给档案里还在的薄弱点调权重：
// 长期薄弱的权重大，待观察的小。老师删掉、或改成「已掌握」的，账本里再长期也不加权
export function weakness(mems, today, halfLife, ledger = [], P = {}) {
    const w = {}, kps = {};
    const factor = (s) => (s === "长期薄弱" ? P.longWeight ?? 1.3 : s === "待观察" ? P.watchWeight ?? 0.7 : 1);
    const key = (r) => r.qtype + "·" + r.kp, status = new Map(ledger.map((r) => [key(r), r.status]));
    for (const m of mems) {
        if (m.cat !== "薄弱点" || !m.qtype) continue;
        const e = (effStrength(m, today, halfLife) ?? 0.5) * factor(status.get(key(m)));
        w[m.qtype] = Math.min(1, (w[m.qtype] || 0) + e);
        (kps[m.qtype] ||= []).push([m.kp, e]);
    }
    for (const t in kps) kps[t] = kps[t].filter(([k]) => k).sort((a, b) => b[1] - a[1]).map(([k]) => k);
    return { w, kps };
}

// 老师侧重：老师档案里带题型的偏好 / 习惯算 0.5，这次课的要求里点名的题型算 1
export function emphasis(teacherMems, guidanceTypes) {
    const e = {};
    for (const m of teacherMems) if (m.qtype && m.cat === "偏好") e[m.qtype] = Math.max(e[m.qtype] || 0, 0.5);
    for (const t in guidanceTypes) e[t] = 1;
    return e;
}

const nextId = (mems, prefix) => prefix + (Math.max(0, ...mems.map((m) => +String(m.id).slice(1) || 0)) + 1);

// ops：模型给的 [{op, who, id, cat, text, qtype, kp, strength, evidence, why}]
// state：{ teacher: [...], student: [...] }（就地改），返回实际生效的改动 [{op, who, why, before, after}]
// op 为 set 时改老师设置（state.settings）或学生的注意力（state.profile.attention）：{op:"set", who, field, value, why}；
// 记下是哪个学生（sid），撤销时改回这个学生，不管老师这时切到了谁
export function applyOps(state, ops, date, source = "课后记录") {
    const applied = [];
    for (const o of ops || []) {
        const who = o.who === "teacher" ? "teacher" : "student";
        if (o.op === "set") {
            const tgt = who === "teacher" ? state.settings : state.profile;
            // 不传模板 id，validSetting 就不认 template；bias 不在 SETTINGS 里也不认：这两项 agent 改不了
            const v = who === "teacher" ? validSetting(o.field, o.value) : o.field === "attention" && ATTENTION.includes(o.value) ? o.value : undefined;
            if (!tgt || v === undefined || tgt[o.field] === v) continue;
            const before = tgt[o.field];
            tgt[o.field] = v;
            if (who === "teacher") logSetting(state, o.field, before, v, date, source);
            applied.push({ op: "set", who, field: o.field, why: clip(o.why, 40), before, after: v, date, sid: who === "student" ? tgt.id : undefined });
            continue;
        }
        const list = state[who];
        const cats = who === "teacher" ? TEACHER_CATS : STUDENT_CATS;
        const cat = cats.includes(o.cat) ? o.cat : null;
        const strength = o.strength == null || o.strength === "" || isNaN(+o.strength) ? null : Math.max(0, Math.min(1, +o.strength));
        const ev = clip(o.evidence, 60);
        // update 常常不带题型，按这条记忆原来的题型对齐
        const qtype = o.qtype || list.find((m) => m.id === o.id)?.qtype;
        const kp = state.kpByType ? alignKp(qtype, clip(o.kp, 12), state.kpByType) : clip(o.kp, 12);
        if (o.op === "add") {
            if (!cat || !clip(o.text, 60)) continue;
            const m = { id: nextId(list, who === "teacher" ? "T" : "S"), cat, text: clip(o.text, 60), qtype: o.qtype || "", kp,
                strength: cat === "薄弱点" ? strength ?? 0.5 : null, evidence: ev, source, created: date, updated: date, history: [{ date, op: "新增", note: ev }] };
            list.push(m);
            applied.push({ op: "add", who, why: clip(o.why, 40), before: null, after: clone(m) });
        } else if (o.op === "update" || o.op === "delete") {
            const i = list.findIndex((m) => m.id === o.id);
            if (i < 0) continue;
            const before = clone(list[i]);
            if (o.op === "delete") {
                list.splice(i, 1);
                (state.forgotten ||= []).push({ ...before, forgotten: date, who });
                applied.push({ op: "delete", who, why: clip(o.why, 40), before, after: null });
            } else {
                const m = list[i];
                if (cat) m.cat = cat;
                if (clip(o.text, 60)) m.text = clip(o.text, 60);
                if (o.qtype !== undefined) m.qtype = o.qtype || m.qtype;
                if (kp) m.kp = kp;
                if (m.cat === "薄弱点" && strength != null) m.strength = strength;
                if (m.cat !== "薄弱点") m.strength = null;
                if (ev) m.evidence = ev;
                m.updated = date;
                m.history = [...(m.history || []), { date, op: "更新", note: ev }].slice(-8);
                applied.push({ op: "update", who, why: clip(o.why, 40), before, after: clone(m) });
            }
        }
    }
    return applied;
}

// 撤销一条改动：加的删掉，改的还原，删的放回去
export function undo(state, a) {
    if (a.op === "set") {
        const tgt = a.who === "teacher" ? state.settings : state.students?.find((st) => st.id === a.sid) || state.profile;
        if (tgt) { tgt[a.field] = a.before; if (a.who === "teacher") logSetting(state, a.field, a.after, a.before, a.date || "", "撤销"); }
        return;
    }
    const list = state[a.who];
    if (a.op === "add") { const i = list.findIndex((m) => m.id === a.after.id); if (i >= 0) list.splice(i, 1); }
    else if (a.op === "update") { const i = list.findIndex((m) => m.id === a.after.id); if (i >= 0) list[i] = clone(a.before); }
    else if (a.op === "delete") { list.push(clone(a.before)); state.forgotten = (state.forgotten || []).filter((m) => m.id !== a.before.id || m.who !== a.who); }
    list.sort((x, y) => +x.id.slice(1) - +y.id.slice(1));
}

// 一条改动给老师看的说法
export function describe(a) {
    if (a.op === "set") return `${a.who === "teacher" ? "老师设置" : "学生"}「${a.who === "teacher" ? SETTINGS[a.field]?.label : "注意力"}」：${showSetting(a.field, a.before) ?? "—"} → ${showSetting(a.field, a.after)}`;
    const m = a.after || a.before;
    return `${a.who === "teacher" ? "老师" : "学生"} ${m.id}：${m.text}`;
}
// 设置的改动历史（最近 40 条），老师在画像里能看到、能撤销
export function logSetting(state, field, before, after, date, source) {
    if (!state.settingsLog) return;
    state.settingsLog.push({ date, field, before, after, source });
    state.settingsLog.splice(0, Math.max(0, state.settingsLog.length - 40));
}

// ---------- 学生薄弱知识点（MAT-500） ----------
// 考点对齐到 kpByType 的考点表：完全一样 → 简写补全成表里的说法（「完成时」→「现在完成时」，三个字以上，取最接近的）
// → 都对不上就原样留着（新考点）。只往具体补，不往笼统并：「动名词」不会变成「名词」，「副词比较级」不会变成「副词」
export function alignKp(qtype, kp, kpByType) {
    const k = String(kp || "").trim();
    const list = kpByType?.[qtype] || [];
    if (!k || list.includes(k)) return k;
    return k.length >= 3 ? list.filter((x) => x.includes(k)).sort((a, b) => a.length - b.length)[0] || k : k;
}

// 知识点账本：每个（题型 · 考点）练了几次、错了几次、在哪几次课、最近一次，分长期薄弱 / 反复出错 / 待观察，再看趋势。
// 「练了」= 这次课讲了这个题型（covered 里提到），或者在这个题型上记了错
export function kpLedger(logs, P = {}) {
    const L = (logs || []).slice().sort((a, b) => a.date.localeCompare(b.date));
    const rows = new Map();
    for (const l of L) for (const e of l.errors || []) {
        if (!e.qtype || !e.kp) continue;
        const key = e.qtype + "·" + e.kp;
        if (!rows.has(key)) rows.set(key, { qtype: e.qtype, kp: e.kp, wrong: [], notes: [] });
        const r = rows.get(key);
        if (!r.wrong.includes(l.date)) { r.wrong.push(l.date); r.notes.push(`${l.date.slice(5)} ${e.note || "错了"}`); }
    }
    const minL = P.longMinLessons ?? 3, minRate = P.longMinRate ?? 0.5;
    const out = [...rows.values()].map((r) => {
        const practiced = L.filter((l) => (l.covered || []).some((c) => c.includes(r.qtype) || c.includes(r.kp)) || (l.errors || []).some((e) => e.qtype === r.qtype));
        const wrongIn = (ls) => ls.filter((l) => r.wrong.includes(l.date)).length / (ls.length || 1);
        const recent = practiced.slice(-3), early = practiced.slice(0, -3);
        const a = wrongIn(recent), b = wrongIn(early);
        const trend = early.length ? (a < b - 0.1 ? "在变好" : a > b + 0.1 ? "在变差" : "差不多")
            : practiced.length ? (r.wrong.includes(practiced.at(-1).date) ? "最近一次还错" : "最近一次没错") : "";
        const rate = r.wrong.length / Math.max(1, practiced.length);
        const status = r.wrong.length >= minL && rate > minRate ? "长期薄弱" : r.wrong.length === 1 ? "待观察" : "反复出错";
        return { ...r, practiced: practiced.length, wrongN: r.wrong.length, rate, last: r.wrong.at(-1), status, trend };
    });
    const ORDER = { 长期薄弱: 0, 反复出错: 1, 待观察: 2 };
    return out.sort((a, b) => ORDER[a.status] - ORDER[b.status] || b.wrongN - a.wrongN || b.rate - a.rate);
}

// ---------- 老师画像（MAT-498）：从老师的操作里统计习惯 ----------
// events：[{date, kind: mix|outline_gen|outline_edit|swap|section|chat, type?, from?, to?, delta?, offGrade?, student?}]
// 同一个题型往同一个方向调了 minRepeat 次以上，就提议设成默认
// 采纳过的那几次调整标 used，不再算进来；之后的调整是相对设了默认以后的占比算的，又攒够了就再提议
export function teacherHabits(events = [], { minRepeat = 3 } = {}) {
    const habits = [];
    const mix = events.filter((e) => e.kind === "mix" && e.type && e.delta && !e.used);
    for (const t of new Set(mix.map((e) => e.type))) for (const sign of [1, -1]) {
        const xs = mix.filter((e) => e.type === t && Math.sign(e.delta) === sign);
        if (xs.length < minRepeat) continue;
        const avg = Math.round(xs.reduce((a, e) => a + e.delta, 0) / xs.length);
        habits.push({ key: `mix:${t}:${sign}`, type: t, delta: avg, n: xs.length, text: `你常把${t}调${sign > 0 ? "高" : "低"}约 ${Math.abs(avg)} 个百分点`,
            evidence: xs.slice(-4).map((e) => `${e.date.slice(5)}${e.student ? " " + e.student : ""}：${e.from}% → ${e.to}%`), events: xs });
    }
    const count = (k) => events.filter((e) => e.kind === k).length;
    const swaps = events.filter((e) => e.kind === "swap");
    const swapTypes = Object.entries(swaps.reduce((m, e) => ((m[e.type] = (m[e.type] || 0) + 1), m), {})).sort((a, b) => b[1] - a[1]);
    return {
        habits,
        stats: { outlines: count("outline_gen"), edited: count("outline_edit"), sections: count("section"), chats: count("chat"), swaps: swaps.length,
            swapTop: swapTypes[0] || null, offGrade: swaps.filter((e) => e.offGrade).length, hard: swaps.filter((e) => e.tier === "偏难").length },
    };
}

// ---------- 编排记忆（MAT-527 第 1 步；用户 10-29「教案的内容如何编排是绝对的核心」）----------
// 老师定下大纲时，对模型给的原样（o0）改了什么，拆成「编排情景」：哪个环节挪到哪个前面、加了 / 删了什么环节、哪部分加减了时间。
// 环节按题型认，没有题型的（默写、动手小环节、回顾）按名字认，去掉「（续）」「·圈线索词」这类后缀
const secKey = (x) => x.type || String(x.name || "").replace(/[（(].*$/, "").replace(/[·:：].*$/, "").replace(/\d+/g, "").trim();
export function arrangeEpisodes(o0, o1) {
    if (!o0?.sections?.length || !o1?.sections?.length) return [];
    const A = o0.sections.map(secKey), B = o1.sections.map(secKey), out = [];
    const common = [...new Set(B)].filter((k) => k && A.includes(k));
    for (const a of common) for (const b of common)
        if (a !== b && A.indexOf(a) < A.indexOf(b) && B.indexOf(b) < B.indexOf(a)) out.push({ kind: "order", key: `order:${b}<${a}`, text: `把${b}放在${a}前面`, mem: `${b}放在${a}前面` });
    for (const k of new Set(B)) if (k && !A.includes(k)) out.push({ kind: "add", key: `add:${k}`, text: `加了「${k}」`, mem: `大纲里加一个「${k}」环节` });
    for (const k of new Set(A)) if (k && !B.includes(k)) out.push({ kind: "del", key: `del:${k}`, text: `删了「${k}」`, mem: `大纲里不排「${k}」环节` });
    const mins = (o) => o.sections.reduce((m, x) => ((m[secKey(x)] = (m[secKey(x)] || 0) + (+x.minutes || 0)), m), {});
    const ma = mins(o0), mb = mins(o1);
    // 默写、回顾、课外知识的分钟归课堂设置管，不算编排
    for (const k of common.filter((k) => !/默写|回顾|课外知识/.test(k))) { const d = mb[k] - ma[k]; if (Math.abs(d) >= 3) out.push({ kind: "min", key: `min:${k}:${Math.sign(d)}`, text: `给${k}${d > 0 ? "加" : "减"}了时间`, mem: `${k}${d > 0 ? "多" : "少"}给些时间` }); }
    return out;
}
// 写进老师的编排情景（S.teacher.arrange，最多 200 条）。say：在大纲 / 教案阶段跟 agent 说的编排要求，原话留着，等心跳整理（第 4 步）再提炼
export function noteArrange(T, { date, student, o0, o1, say }) {
    const xs = say ? [{ kind: "say", key: "say", text: String(say).slice(0, 80) }] : arrangeEpisodes(o0, o1);
    T.arrange = [...(T.arrange || []), ...xs.map((e) => ({ ...e, date, student }))].slice(-200);
    return xs;
}
// 同一种改法在 minRepeat 节课（按日子 + 学生算）以上出现，提议记成「编排习惯」；记过的（used）、否掉的（skip 里的 key）不再提
export function arrangeHabits(episodes = [], { minRepeat = 3, skip = [] } = {}) {
    const by = {};
    for (const e of episodes) if (!e.used && e.kind !== "say" && !skip.includes(e.key)) (by[e.key] ||= []).push(e);
    return Object.entries(by).map(([key, xs]) => ({ key, xs, n: new Set(xs.map((e) => `${e.date}|${e.student || ""}`)).size }))
        .filter((h) => h.n >= minRepeat).sort((a, b) => b.n - a.n)
        .map(({ key, xs, n }) => ({ key, n, text: `你最近 ${n} 节课都${xs[0].text}`, mem: xs[0].mem, evidence: [...new Set(xs.map((e) => `${e.date.slice(5)}${e.student ? " " + e.student : ""}`))].slice(-4), events: xs }));
}
// 记成老师档案的「编排习惯」（state 同 applyOps），用掉的情景标 used。返回 applyOps 的结果，撤销照旧
export function adoptArrange(state, T, h, date, source = "编排习惯") {
    const applied = applyOps(state, [{ op: "add", who: "teacher", cat: "编排习惯", text: h.mem, evidence: `最近 ${h.n} 节课都这样改：${h.evidence.join("、")}`, why: "老师反复这样改大纲" }], date, source);
    for (const e of h.events) e.used = true;
    return applied;
}

// 旧版本存下来的状态补上新字段（老师设置、画像事件、模板、注意力），考点对齐一遍。就地改，可以重复跑
export function upgradeState(S, kpByType) {
    const T = S.teacher;
    if (!T.settings) {
        // 旧版本从「课堂结构」记忆里抠课时：60 分钟以上是课时，以下的加起来是固定环节。照旧算，按说的是默写还是回顾分开，
        // 没写的就是 0（不能套新默认的 10 + 10，否则旧用户每节课平白少 20 分钟）；抠完的那几条记忆挪进「已忘记」，免得和设置两头说
        const cs = T.mems.filter((m) => m.cat === "课堂结构" && /\d+\s*分钟/.test(m.text));
        const text = cs.map((m) => m.text).join("；");
        const nums = [...text.matchAll(/(\d+)\s*分钟/g)].map((x) => +x[1]);
        const near = (word) => +(new RegExp(`(\\d+)\\s*分钟[^，,；;。]{0,6}${word}|${word}[^，,；;。\\d]{0,6}(\\d+)\\s*分钟`).exec(text)?.slice(1).find(Boolean) || 0);
        const short = nums.filter((n) => n < 60), sum = short.reduce((a, b) => a + b, 0);
        const dict = near("默写"), recap = near("回顾");
        T.settings = { ...defaultSettings(), dictation: dict || (recap ? 0 : sum), recap: recap || 0 };
        const long = nums.find((n) => n >= 60);
        if (long) T.settings.minutes = long;
        for (const k of ["minutes", "dictation", "recap"]) T.settings[k] = validSetting(k, T.settings[k]) ?? SETTINGS[k].def;
        for (const m of cs) { T.mems.splice(T.mems.indexOf(m), 1); (S.forgotten ||= []).push({ ...m, who: "teacher", forgotten: m.updated || "", note: "已转成课堂设置" }); }
    }
    T.settings = { ...defaultSettings(), ...T.settings, bias: { ...(T.settings.bias || {}) } };
    if (T.settings.lessonType === "小班") T.settings.lessonType = "一对多";
    S.groups ||= [];
    T.events ||= []; T.settingsLog ||= []; T.templates ||= [];
    for (const st of S.students) {
        if (!ATTENTION.includes(st.attention)) st.attention = "一般";
        for (const m of st.mems) if (m.kp) m.kp = alignKp(m.qtype, m.kp, kpByType);
        for (const l of st.logs) for (const e of l.errors || []) if (e.kp) e.kp = alignKp(e.qtype, e.kp, kpByType);
    }
    return S;
}

// 用过的题（MAT-487）：写完教案时记下这节课课上和作业用的题，以后给这个学生检索不再出（课次记录里存着教案的也算）；
// 当天的不算，同一节课重排大纲照样能用。st.used：[[题目 id, 日期]]，最多 300 道
export function markUsed(sts, items, date) {
    const ids = new Set(items.map((x) => x.id));
    for (const st of sts) st.used = [...(st.used || []).filter(([id]) => !ids.has(id)), ...[...ids].map((id) => [id, date])].slice(-300);
}
export const usedIds = (sts, date) => [...new Set(sts.flatMap((st) => [...(st.used || []).filter(([, d]) => d < date).map(([id]) => id),
    ...(st.logs || []).filter((l) => l.date < date).flatMap((l) => (l.plan?.items || []).map((x) => x.id))]))].slice(-400);
