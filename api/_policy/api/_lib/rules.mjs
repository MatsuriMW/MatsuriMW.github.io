// 规则闸和人工闸：纯关键词和查表，不调任何模型。
// 规则写在 rules/rules.json，代码只做匹配、填条件、查表；同时命中多条时不猜，交给 RAG。
import fs from "node:fs";

const read = (f) => JSON.parse(fs.readFileSync(new URL(`../../rules/${f}`, import.meta.url), "utf8"));
let RULES = null, HANDOFF = null;
export function loadRules({ fresh = false } = {}) {
    if (!RULES || fresh) { RULES = read("rules.json"); HANDOFF = read("handoff.json"); }
    return { rules: RULES, handoff: HANDOFF };
}

const has = (q, words) => words.find((w) => q.includes(w)) || null;

// ---------- 人工闸 ----------
// 返回 null 或 { type: explicit | sensitive | personal, label, hit }
export function handoffGate(q) {
    const { handoff: H } = loadRules();
    const s = q.replace(/\s+/g, "");
    // 明说要人工：排除「不用转人工」这类否定
    for (const w of H.explicit.words) {
        let i = s.indexOf(w);
        while (i >= 0) {
            const before = s.slice(Math.max(0, i - 4), i);
            if (!H.explicit.negations.some((n) => before.includes(n))) return { type: "explicit", label: H.explicit.label, hit: w };
            i = s.indexOf(w, i + 1);
        }
    }
    const sen = has(s, H.sensitive.words);
    if (sen) return { type: "sensitive", label: H.sensitive.label, hit: sen };
    const P = H.personal;
    const who = has(s, P.who), data = has(s, P.data), sig = has(s, P.signal);
    if (who && data && sig) return { type: "personal", label: P.label, hit: `${who} + ${data} + ${sig}` };
    return null;
}

// ---------- 规则闸 ----------
export function matchRules(q, subject) {
    const { rules } = loadRules();
    const s = q.replace(/\s+/g, "");
    const out = [];
    for (const r of rules) {
        if (r.subject !== subject) continue;
        const a = has(s, r.any), b = a && has(s, r.all), n = has(s, r.not);
        out.push({ id: r.id, name: r.name, any: a, all: b, not: n, hit: !!(a && b && !n) });
    }
    return out;
}

const CNUM = { 零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
function toNum(t) {
    if (/^\d+(\.\d+)?$/.test(t)) return +t;
    if (t === "半") return 0.5;
    if (t.includes("十")) { const [a, b] = t.split("十"); return (a ? CNUM[a] : 1) * 10 + (b ? CNUM[b] : 0); }
    return CNUM[t];
}
const N = "(\\d+(?:\\.\\d+)?|[一二两三四五六七八九十]{1,3}|半)";

// 从问题里认条件。返回 { value, text, needConfirm }，认不出返回 null
export function fillSlot(rule, q) {
    const s = q.replace(/\s+/g, "");
    if (rule.slot.kind === "years") {
        // 「工龄 6 年」「工作了 6 年」直接用；「在公司干了 3 年」「入职 3 年」是司龄，要追问确认口径
        const total = s.match(new RegExp(`(?:累计工龄|工龄|累计工作|工作了|工作年限|参加工作)(?:是|有|已经|已)?${N}年`));
        if (total) return { value: toNum(total[1]), text: `${total[1]} 年` };
        const tenure = s.match(new RegExp(`(?:入职|司龄|在(?:本|这家|我们)?公司(?:干|做|待|工作)了?|来公司)(?:了|已经|有)?${N}年`));
        if (tenure) return { value: toNum(tenure[1]), text: `${tenure[1]} 年`, needConfirm: true };
        return null;
    }
    // choice：按别名认
    for (const row of rule.table) {
        if ([row.when, ...(row.alias || [])].some((a) => a && s.includes(a.replace(/\s+/g, "")))) return { value: row.when, text: row.when };
    }
    return null;
}

// 按钮点回来的值（「6 年」「不满 1 年」「兄弟姐妹」）
export function parseSlotAnswer(rule, v) {
    v = String(v).trim();
    if (rule.slot.kind === "years") {
        if (/不满\s*1\s*年/.test(v)) return { value: 0.5, text: "不满 1 年" };
        const m = v.match(new RegExp(N));
        return m ? { value: toNum(m[1]), text: `${m[1]} 年` } : null;
    }
    const row = rule.table.find((r) => r.when === v);
    return row ? { value: row.when, text: row.when } : null;
}

export function lookup(rule, slot) {
    if (rule.slot.kind === "years") return rule.table.find((r) => (r.gte === undefined || slot.value >= r.gte) && (r.lt === undefined || slot.value < r.lt)) || null;
    return rule.table.find((r) => r.when === slot.value) || null;
}

export const ruleById = (id) => loadRules().rules.find((r) => r.id === id);
