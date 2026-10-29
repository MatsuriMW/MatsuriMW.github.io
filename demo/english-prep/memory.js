// 记忆：老师档案（T）和学生档案（S）。模型只提议增删改（/api/english action=memory），怎么落到档案上由这里决定：
// 每条改动都留「改之前」的样子，可以单条撤销；删掉的进「已忘记」，也能恢复。薄弱点强度按半衰期衰减。纯函数，页面和评测脚本共用。
import { daysBetween } from "./model.js";

export const STUDENT_CATS = ["薄弱点", "已掌握", "学习习惯", "状态", "目标"];
export const TEACHER_CATS = ["讲题习惯", "课堂结构", "偏好"];
export const ATTENTION = ["集中", "一般", "容易分心"];

// 学生画像的维度（用户 10-29）：core 的三项建档就显示，其余老师点「+」挑着加。
// 每项是一条 0–100 的光谱，左端 lo、右端 hi，中间一段算「一般」，存在 st.dims 里。
// 学习进度例外：按这一册的单元算，存在 st.progress / st.unit（页面上画）；注意力的三段正好是 ATTENTION，st.attention 跟着变
export const DIMS = [
    { key: "progress", label: "学习进度", core: true },
    { key: "habit", label: "学习习惯", lo: "拖拉马虎", hi: "自觉认真", core: true },
    { key: "attention", label: "注意力集中度", lo: "容易分心", hi: "集中", core: true },
    { key: "vocab", label: "词汇量", lo: "偏少", hi: "扎实", group: "英语能力" },
    { key: "grammar", label: "语法基础", lo: "薄弱", hi: "扎实", group: "英语能力" },
    { key: "reading", label: "阅读速度", lo: "慢", hi: "快", group: "英语能力" },
    { key: "listening", label: "听力", lo: "听不懂", hi: "听得清", group: "英语能力" },
    { key: "speaking", label: "口语表达", lo: "不敢开口", hi: "流利", group: "英语能力" },
    { key: "writing", label: "书面表达", lo: "写不出", hi: "写得好", group: "英语能力" },
    { key: "handwriting", label: "书写卷面", lo: "潦草", hi: "工整", group: "英语能力" },
    { key: "initiative", label: "学习主动性", lo: "要人催", hi: "主动", group: "学习状态" },
    { key: "confidence", label: "自信心", lo: "容易紧张", hi: "自信", group: "学习状态" },
    { key: "participation", label: "课堂互动", lo: "不爱发言", hi: "积极发言", group: "学习状态" },
    { key: "parent", label: "家长配合", lo: "很少过问", hi: "配合紧密", group: "家庭" },
];
export const DIM = Object.fromEntries(DIMS.map((d) => [d.key, d]));
export const dimZone = (d, v) => (v < 34 ? d.lo : v > 66 ? d.hi : "一般");
const ATT_MID = { 容易分心: 17, 一般: 50, 集中: 83 };
// 光谱上的值。注意力以 st.attention 为准（agent 记一笔也会改它），两边对不上就取那一段的中间；没填过的算 50
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
    lessonType: { label: "课型", options: ["一对一", "小班"], def: "一对一" },
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
    T.events ||= []; T.settingsLog ||= []; T.templates ||= [];
    for (const st of S.students) {
        if (!ATTENTION.includes(st.attention)) st.attention = "一般";
        for (const m of st.mems) if (m.kp) m.kp = alignKp(m.qtype, m.kp, kpByType);
        for (const l of st.logs) for (const e of l.errors || []) if (e.kp) e.kp = alignKp(e.qtype, e.kp, kpByType);
    }
    return S;
}
