// 上线后要看的四个产品指标（PRD 第 6 节）：备课用时、大纲改动率、换题率、反馈直接发出率。两端共用的纯函数（网页端、微信端都 import）。
// 记在工作区 S.metrics（跟账号数据走），一条一个事件，最多留 300 条：
//   { k: "prep", d, via, sid, secs（从开始备这个学生到第一次导出 Word）；sec、secChanged：大纲环节数、老师改过的环节数；items、swapped：大纲推荐的例题数、被换掉的数 }
//   { k: "ac", d, via, edited }：一段课后反馈发出去了（网页端点「复制」、微信端回「发完了」），edited = 发之前改过
//   { k: "voice", d, at, fixes, corrected }：微信端一条语音指令（MAT-532）；fixes 是按名单、词表纠了几处，corrected = 老师 5 分钟内回了「不对」「撤销」这类。只记条数，不存原话
const usedItems = (o) => new Set((o?.sections || []).flatMap((x) => x.items || []));

// 大纲：模型给的原样（outline0）对比老师定下的（outline），按环节编号比；删掉的、加的、改过名字 / 分钟 / 用题 / 要点的都算改过
export function outlineDelta(o0, o1) {
    const key = (x) => JSON.stringify([x.name, x.minutes, x.type || "", [...(x.items || [])].sort(), x.points || [], x.extras || []]);
    const A = new Map((o0?.sections || []).map((x) => [x.id, key(x)])), B = new Map((o1?.sections || []).map((x) => [x.id, key(x)]));
    const ids = new Set([...A.keys(), ...B.keys()]);
    const changed = [...ids].filter((id) => A.get(id) !== B.get(id)).length;
    const rec = usedItems(o0), now = usedItems(o1);
    return { sec: ids.size, secChanged: changed, items: rec.size, swapped: [...rec].filter((c) => !now.has(c)).length };
}

// 第一次导出这份教案的 Word 时记一条（同一份 W 只记一次，W.metric 打标）
export function notePrep(S, W, { via, t0, now = Date.now(), date }) {
    if (!W?.outline || W.metric) return null;
    W.metric = true;
    const secs = t0 ? Math.round((now - t0) / 1000) : null;
    return push(S, { k: "prep", d: date, via, sid: W.sid, secs: secs > 0 ? secs : null, ...outlineDelta(W.outline0, W.outline) });
}
export const noteAc = (S, { via, edited, date }) => push(S, { k: "ac", d: date, via, edited: !!edited });
export const noteVoice = (S, { date, fixes, at = Date.now() }) => push(S, { k: "voice", d: date, at, fixes, corrected: false });
// 老师这句话是在纠正上一条语音吗：5 分钟内、以「不对」「撤销」「我说的是」开头
export function markCorrection(S, text, now = Date.now()) {
    const v = (S.metrics || []).findLast((e) => e.k === "voice");
    if (v && !v.corrected && now - v.at < 5 * 60e3 && /^(不对|错了|不是|撤销|我说的是|我是说|重来)/.test(String(text).trim())) v.corrected = true;
}
function push(S, ev) {
    (S.metrics ||= []).push(ev);
    if (S.metrics.length > 300) S.metrics = S.metrics.slice(-300);
    return ev;
}

const median = (xs) => { const a = [...xs].sort((x, y) => x - y); return a.length ? (a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2) : null; };
// 汇总：events 可以是几位老师的合在一起。since：只看这一天以后的（YYYY-MM-DD）。
// 备课用时取中位数，超过 3 小时的不算（备到一半放下、隔天接着备的，用时没有意义）
export function summary(events = [], since = "") {
    const xs = events.filter((e) => !since || (e.d || "") >= since), P = xs.filter((e) => e.k === "prep"), A = xs.filter((e) => e.k === "ac"), V = xs.filter((e) => e.k === "voice");
    const secs = P.map((e) => e.secs).filter((s) => s > 0 && s <= 3 * 3600);
    const sum = (k) => P.reduce((a, e) => a + (e[k] || 0), 0);
    return {
        preps: P.length, medianMin: secs.length ? Math.round(median(secs) / 6) / 10 : null, timed: secs.length,
        outlineChange: sum("sec") ? sum("secChanged") / sum("sec") : null, swapRate: sum("items") ? sum("swapped") / sum("items") : null,
        acSent: A.length, acDirect: A.length ? A.filter((e) => !e.edited).length / A.length : null,
        voice: V.length, voiceFixed: V.filter((e) => e.fixes > 0).length, voiceCorrected: V.length ? V.filter((e) => e.corrected).length / V.length : null,
    };
}
const pct = (v) => (v == null ? "—" : `${Math.round(v * 100)}%`);
export function summaryText(m) {
    return [`备课 ${m.preps} 次，从开始备到拿到 Word 的用时中位数 ${m.medianMin == null ? "—" : m.medianMin + " 分钟"}${m.timed < m.preps ? `（${m.preps - m.timed} 次中途放下过，不算）` : ""}`,
        `大纲改动率 ${pct(m.outlineChange)}（改过的环节 / 全部环节）`, `换题率 ${pct(m.swapRate)}（推荐的例题被换掉的比例）`,
        `课后反馈发出 ${m.acSent} 段，不改就发的 ${pct(m.acDirect)}`,
        m.voice ? `语音指令 ${m.voice} 条，按名单 / 词表纠过字的 ${m.voiceFixed} 条，被你纠正（回「不对」「撤销」）的 ${pct(m.voiceCorrected)}` : ""].filter(Boolean).join("\n");
}
