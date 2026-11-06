// 生成后的确定性校验：引用校验和数字校验。不过关的回答不展示，直接转人工。
// 人事问答最贵的错误是编数字，所以回答里的天数、金额、比例必须能在所引片段里找到（中文数字先归一）。

export const FALLBACK = "手册里没有写到这个。";

const CN = { 零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
function cnToNum(s) {
    if (s.includes("百")) { const [a, b] = s.split("百"); return (CN[a] ?? 1) * 100 + (b ? cnToNum(b.replace(/^零/, "")) : 0); }
    if (s.includes("十")) { const [a, b] = s.split("十"); return (a ? CN[a] : 1) * 10 + (b ? CN[b] : 0); }
    return CN[s];
}
// 只换后面跟着量词的中文数字（「一周」「十五天」），「一律」「一次性」这类不动
const UNIT = "(?=\\s*(?:个|天|日|年|月|周|星期|次|小时|岁|倍|份|元|块|名|级|胎|工作日|%|％))";
export function normalizeNumbers(s) {
    return String(s).replace(new RegExp(`[零〇一二两三四五六七八九十百]+${UNIT}`, "g"), (m) => { const n = cnToNum(m); return n === undefined ? m : String(n); });
}

// 片段里的数字：完整数字，加上条款号拆开的每一段（5.16.4 → 5、16、4、5.16、5.16.4）
function sourceNumbers(text) {
    const set = new Set();
    for (const m of normalizeNumbers(text).matchAll(/\d+(?:\.\d+)*/g)) {
        const parts = m[0].split(".");
        parts.forEach((p, i) => { set.add(String(+p)); set.add(parts.slice(0, i + 1).join(".")); });
    }
    return set;
}

// 回答里要核对的数字：去掉引用编号 [1] 和条款号（x.y.z、第 N 条）
function answerNumbers(text) {
    const s = normalizeNumbers(String(text).replace(/\[\d+\]/g, " ").replace(/\d{1,2}\.\d{1,2}\.\d{1,2}(?:\.\d+)?/g, " ").replace(/第[一二三四五六七八九十百\d]+[条章]/g, " "));
    return [...new Set((s.match(/\d+(?:\.\d+)?/g) || []).map((x) => (x.includes(".") ? String(+x) : String(+x))))];
}

// sources: [{text}]，按引用编号顺序
export function checkAnswer(answer, sources) {
    const a = String(answer).trim();
    if (a.replace(/[\s。.]/g, "").startsWith(FALLBACK.replace("。", "")) && a.length < 30) {
        return { ok: false, kind: "fallback", reason: "生成兜底：模型回答「手册里没有写到这个」" };
    }
    const cited = [...a.matchAll(/\[(\d+)\]/g)].map((m) => +m[1]);
    const bad = cited.filter((n) => n < 1 || n > sources.length);
    if (!cited.length) return { ok: false, kind: "citation", reason: "引用校验没过：回答没有标出处" };
    if (bad.length) return { ok: false, kind: "citation", reason: `引用校验没过：引用了不存在的片段 [${[...new Set(bad)].join("][")}]` };
    const used = [...new Set(cited)].map((n) => sources[n - 1].text).join("\n");
    const have = sourceNumbers(used);
    const missing = answerNumbers(a).filter((n) => !have.has(n));
    if (missing.length) return { ok: false, kind: "number", reason: `数字校验没过：回答里的 ${missing.join("、")} 在所引片段里找不到`, missing };
    return { ok: true, cited: [...new Set(cited)], numbers: answerNumbers(a) };
}

// 演示用：把回答里第一个数字改错，现场展示数字校验会拦下
export function tamper(answer) {
    let done = false;
    return String(answer).replace(/(?<![\[\d.])(\d+)(?![\]\d.])/, (m) => { done = true; return String(+m + 7); }) + (done ? "" : "，一般为 15 天");
}
