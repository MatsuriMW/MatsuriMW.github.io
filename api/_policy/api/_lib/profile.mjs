// 按档案匹配（登录后才有）：在人工闸之后、规则闸之前，用员工档案 + 所属公司制度 + 属地政策直接查表，不调模型。
// 数据在 rules/companies.json（公司制度）、rules/local.json（属地政策）、rules/demo-account.json（演示账户）。
// 没配置的情况（比如集团本部没配病假工资）不硬答，交回后面的规则闸和 RAG。
import fs from "node:fs";

const read = (f) => JSON.parse(fs.readFileSync(new URL(`../../rules/${f}`, import.meta.url), "utf8"));
let DATA = null;
export function loadProfileData({ fresh = false } = {}) {
    if (!DATA || fresh) DATA = { companies: read("companies.json"), local: read("local.json"), demo: read("demo-account.json") };
    return DATA;
}
export const companyOf = (p) => loadProfileData().companies.find((c) => c.id === p.company) || null;

// 档案字段：页面上能改的，改的时候按这里校验
export function cleanProfile(old, body) {
    const { companies, local } = loadProfileData();
    const p = { ...old };
    if (companies.some((c) => c.id === body.company)) p.company = body.company;
    if (local.cities[body.workCity]) p.workCity = body.workCity;
    if (local.cities[body.insuredCity]) p.insuredCity = body.insuredCity;
    const num = (v, lo, hi) => { const n = Number(v); return Number.isFinite(n) && n >= lo && n <= hi ? n : null; };
    if (num(body.totalYears, 0, 50) != null) p.totalYears = num(body.totalYears, 0, 50);
    if (/^\d{4}-\d{2}-\d{2}$/.test(body.hireDate || "") && !isNaN(Date.parse(body.hireDate))) p.hireDate = body.hireDate;
    for (const k of ["baseSalary", "contractSalary"]) if (num(body[k], 0, 1e6) != null) p[k] = Math.round(num(body[k], 0, 1e6));
    return p;
}
// 写进 trace 和工单的档案快照：HR 看工单时知道是谁、在哪
export function snapshot(p) {
    const c = companyOf(p);
    return { name: p.name, empNo: p.empNo, company: c?.name, type: c?.type, workCity: p.workCity, insuredCity: p.insuredCity, totalYears: p.totalYears, hireDate: p.hireDate };
}

const has = (s, words) => words.find((w) => s.includes(w)) || null;
const QTY = ["几天", "多少天", "天数", "多久", "多长", "有多少", "能休", "可以休", "能请", "可以请"];
const LEAVE_NOT = ["怎么请", "怎么申请", "申请", "提前", "材料", "证明", "流程", "工资", "津贴", "难产", "双胞胎", "多胞胎", "龙凤胎", "剖腹产", "流产", "哺乳"];
// 每个话题：any 命中其一、all 命中其一（没有 all 就不要求）、not 全不命中
const TOPICS = [
    { id: "婚假", any: ["婚假"], all: QTY, not: LEAVE_NOT },
    { id: "陪产假", any: ["陪产假", "护理假", "陪护假", "陪产"], all: QTY, not: LEAVE_NOT },
    { id: "产假", any: ["产假", "生育假"], all: QTY, not: [...LEAVE_NOT, "陪产"] },
    { id: "育儿假", any: ["育儿假"], all: QTY, not: LEAVE_NOT },
    { id: "生育津贴", any: ["生育津贴", "生育金", "产假工资", "产假期间工资"], not: [] },
    { id: "年假", any: ["年假", "年休假", "带薪假"], all: QTY, not: ["延期", "没休完", "未休", "没用完", "剩", "工资", "折算", "怎么请", "怎么申请", "流程", "次年", "明年", "过期", "作废", "清零", "结转", "提前"] },
    { id: "病假工资", any: ["病假"], all: ["工资", "钱", "扣", "怎么发", "怎么算", "发多少"], not: ["材料", "证明", "流程", "怎么请", "怎么申请"] },
    { id: "加班费", any: ["加班费", "加班工资", "加班"], all: ["怎么算", "多少", "几倍", "怎么给", "计算", "标准", "基数", "怎么发"], not: ["调休"] },
    { id: "工资结算", any: ["发工资", "发薪", "工资发放", "几号发", "结算周期", "考勤周期", "计薪", "日工资", "工资怎么算", "工资结算", "工资周期"], not: [] },
];
export function matchTopic(q) {
    const s = q.replace(/\s+/g, "");
    for (const t of TOPICS) {
        const a = has(s, t.any);
        if (a && (!t.all || has(s, t.all)) && !has(s, t.not)) return { id: t.id, hit: a };
    }
    return null;
}

const money = (n) => `${(Math.round(n * 100) / 100).toLocaleString("zh-CN", { maximumFractionDigits: 2 })} 元`;
const tenureYears = (hireDate, now = new Date()) => {
    const h = new Date(hireDate);
    let y = now.getFullYear() - h.getFullYear();
    if (now.getMonth() < h.getMonth() || (now.getMonth() === h.getMonth() && now.getDate() < h.getDate())) y--;
    return Math.max(0, y);
};
const statutory = (y) => (y < 1 ? 0 : y < 10 ? 5 : y < 20 ? 10 : 15);   // 《职工带薪年休假条例》第三条

// 返回 null（交给后面）或 { topic, text, basis[], refs[], calc[], notice, clause?, handbookSubject? }
//  basis：用了档案里哪几项；refs：依据（法规、公司配置）；clause：顺带引用的手册条款
export function answerByProfile(q, p, { now = new Date() } = {}) {
    const t = matchTopic(q);
    if (!t) return null;
    const { local } = loadProfileData();
    const c = companyOf(p);
    if (!c) return null;
    const work = local.cities[p.workCity], ins = local.cities[p.insuredCity];
    const split = p.workCity !== p.insuredCity;
    const comp = { k: "所属公司", v: `${c.name} · ${c.type}` };

    if (["婚假", "产假", "陪产假", "育儿假"].includes(t.id)) {
        const it = work?.items[t.id];
        if (!it) return null;
        const name = it.name || t.id;
        const clause = { fosun: { 婚假: "5.11.2", 产假: "5.12.2" }, fairhr: { 婚假: "第二十九条", 产假: "第三十条" } }[c.subject]?.[t.id] || null;
        return {
            topic: t.id, hit: t.hit, clause,
            text: `你的用工地是**${work.region}**，${name}按当地规定是 **${it.value}**（${it.parts}）。`,
            basis: [comp, { k: "用工地", v: p.workCity }],
            refs: [{ label: it.law, text: `${name}：${it.parts}` }, { label: "核对日期", text: `${local.asOf} 联网核对，以官方现行文本为准` }],
            notice: split ? `你的用工地（${p.workCity}）和参保地（${p.insuredCity}）不一致。假期天数按用工地，生育津贴按参保地；异地参保的情况，建议找 HR 确认。` : null,
        };
    }
    if (t.id === "生育津贴") {
        return {
            topic: t.id, hit: t.hit,
            text: `你的参保地是**${ins.region}**，生育津贴由${ins.region}的生育保险基金支付，向当地医保部门申领，按用人单位上年度职工月平均工资计发；具体材料和计发天数以${ins.region}的规定为准。`,
            basis: [comp, { k: "参保地", v: p.insuredCity }],
            refs: [{ label: "《社会保险法》第五十六条", text: "生育津贴按照职工所在用人单位上年度职工月平均工资计发" }],
            notice: split ? `你的用工地（${p.workCity}）和参保地（${p.insuredCity}）不一致：产假天数按用工地 ${p.workCity}，生育津贴按参保地 ${p.insuredCity}，两边天数可能对不上，建议找 HR 确认。` : null,
        };
    }
    if (t.id === "年假") {
        const A = c.annualLeave;
        if (A.mode !== "statutoryPlusTenure") return { topic: t.id, delegate: A.ruleId };   // 交给规则闸，条件用档案里的累计工龄
        const base = statutory(p.totalYears), ten = tenureYears(p.hireDate, now), add = base ? Math.min(ten * A.perYear, A.max) : 0;
        return {
            topic: t.id, hit: t.hit, clause: "第三十二条",
            text: base
                ? `按${c.name}的规定，你今年的年假是 **${base + add} 天**：法定 ${base} 天（累计工龄 ${p.totalYears} 年）+ 驻场司龄 ${ten} 年加 ${add} 天。`
                : `你的累计工龄不满 1 年，还没有法定年假，${c.name}的司龄加天也从有法定年假起算。`,
            basis: [comp, { k: "累计工龄", v: `${p.totalYears} 年` }, { k: "入职日期", v: `${p.hireDate}（司龄 ${ten} 年）` }],
            refs: [{ label: c.doc, text: A.desc }, { label: "《职工带薪年休假条例》第三条", text: "累计工作满 1 年不满 10 年 5 天，满 10 年不满 20 年 10 天，满 20 年 15 天" }],
            calc: base ? [`法定 ${base} 天 + min(司龄 ${ten} 年 × ${A.perYear}, ${A.max}) = ${base + add} 天`] : [],
        };
    }
    const P = c.payroll;
    const baseVal = p[P.base];
    const daily = baseVal / 21.75, hourly = daily / 8;
    const payRefs = [{ label: c.doc, text: `计薪周期 ${P.cycle}；发薪 ${P.payday}；${P.hours}；加班基数为${P.baseName}${P.otExtra ? `；${P.otExtra}` : ""}` }];
    if (t.id === "工资结算") {
        return {
            topic: t.id, hit: t.hit, clause: c.subject === "fosun" ? "6.4" : "第二十五条",
            text: `按${c.name}的约定：计薪周期是**${P.cycle}**，**${P.payday}**发薪。日工资 = ${P.baseName} ÷ 21.75，按你的档案是 **${money(daily)}**；缺勤按日工资扣减。`,
            basis: [comp, { k: P.baseName, v: money(baseVal) }],
            refs: [...payRefs, { label: "劳社部发〔2008〕3 号", text: "月计薪天数 = (365 天 − 104 天休息日) ÷ 12 = 21.75 天" }],
            calc: [`${money(baseVal)} ÷ 21.75 = ${money(daily)}`],
        };
    }
    if (t.id === "加班费") {
        const comprehensive = P.hours.startsWith("综合");
        return {
            topic: t.id, hit: t.hit,
            text: comprehensive
                ? `${c.name}实行**${P.hours}**：周期内总工时超过标准工时的部分按 **1.5 倍**，法定节假日上班按 **3 倍**。小时工资 = ${P.baseName} ÷ 21.75 ÷ 8，按你的档案是 ${money(hourly)}，即超时每小时 **${money(hourly * 1.5)}**、法定节假日每小时 **${money(hourly * 3)}**。${P.otExtra}。`
                : `${c.name}实行**${P.hours}**，加班基数是${P.baseName}。小时工资 = ${P.baseName} ÷ 21.75 ÷ 8，按你的档案是 ${money(hourly)}：工作日延长 **1.5 倍**（${money(hourly * 1.5)} / 小时），休息日且不能补休 **2 倍**（${money(hourly * 2)} / 小时），法定节假日 **3 倍**（${money(hourly * 3)} / 小时）。`,
            basis: [comp, { k: P.baseName, v: money(baseVal) }],
            refs: [...payRefs, { label: "《劳动法》第四十四条", text: "延长工作时间不低于 150%；休息日安排工作又不能安排补休的不低于 200%；法定休假日不低于 300%" }],
            calc: [`${money(baseVal)} ÷ 21.75 ÷ 8 = ${money(hourly)} / 小时`],
        };
    }
    if (t.id === "病假工资") {
        if (P.sickPay !== "handbook" || c.subject !== "fairhr") return null;   // 没配置的公司不硬答
        const mw = work.minWage.value, perDay = (mw * 0.8) / 21.75;
        return {
            topic: t.id, hit: t.hit, clause: "第三十六条",
            text: `病假期间工资按实际工作地最低工资的 80% 折算：你的用工地是${work.region}，月最低工资 ${mw} 元，每个病假日 **${money(perDay)}**（病假 N 天就是 ${money(perDay)} × N）。`,
            basis: [comp, { k: "用工地", v: p.workCity }],
            refs: [{ label: "泛亚外包员工服务手册 第三十六条", text: "（员工实际工作地的最低工资标准的80%/21.75）*病假天数" }, { label: "最低工资", text: work.minWage.src }],
            calc: [`${mw} × 80% ÷ 21.75 = ${money(perDay)} / 天`],
            notice: split ? `你的参保地（${p.insuredCity}）和用工地（${p.workCity}）不一致；手册写的是按实际工作地算，有疑问找 HR 确认。` : null,
        };
    }
    return null;
}
