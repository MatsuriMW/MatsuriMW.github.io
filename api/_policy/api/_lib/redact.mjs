// 个人信息脱敏：所有处理之前先遮盖。发给模型的请求、trace、工单、反馈都只存遮盖后的文字。
// 顺序有讲究：身份证（18 位）先于银行卡（16–19 位），银行卡先于手机号（11 位），免得长号被短规则切开。
const RULES = [
    { kind: "身份证号", re: /(?<!\d)\d{17}[\dXx](?![\dXx])/g },
    { kind: "银行卡号", re: /(?<!\d)\d{16,19}(?!\d)/g },
    { kind: "手机号", re: /(?<!\d)1[3-9]\d(?:[ -]?\d{4}){2}(?!\d)/g },
];

// 返回 { text, found: ["手机号", …] }
export function redact(s) {
    let text = String(s ?? "");
    const found = [];
    for (const { kind, re } of RULES) {
        text = text.replace(re, () => { found.push(kind); return `［${kind}已遮盖］`; });
    }
    return { text, found: [...new Set(found)] };
}
