// 占比模型：下一场考试 → 结构模板 → 混入学校 / 区的卷子和中考趋势 → 乘上学生薄弱点、老师侧重 → 各题型占比，
// 每个题型的份额拆成「年级 / 学校 / 学生 / 老师」四个来源，桑基图就画这个。纯函数，页面和评测脚本共用。
export const SOURCES = ["年级", "学校", "学生", "老师"];
const CN = { 7: "七", 8: "八", 9: "九" };
const DAY = 864e5;
export const parseDay = (s) => new Date(s + "T00:00:00+08:00");
export const daysBetween = (a, b) => Math.round((parseDay(b) - parseDay(a)) / DAY);

// 学年和届：2026-10 的九年级是 2027 届
export function schoolYearEnd(today) { const [y, m] = today.split("-").map(Number); return m >= 8 ? y + 1 : y; }
export const cohortOf = (grade, today) => schoolYearEnd(today) + (9 - grade);
export function termAt(date) { const m = +date.slice(5, 7); return m >= 8 || m === 1 ? "上" : "下"; }
export const gtOf = (grade, date) => CN[grade] + termAt(date);

// gt 给了就只看这个年级学期里的考试（老师建档时选了学期）
export function nextExam(grade, today, rules, gt) {
    const ev = rules.examCalendar.events.filter((e) => e.grades.includes(grade) && e.date >= today && (!gt || gtOf(grade, e.date) === gt)).sort((a, b) => a.date.localeCompare(b.date))[0];
    return ev ? { kind: ev.kind, date: ev.date, label: ev.label || "", gt: gtOf(grade, ev.date), days: daysBetween(today, ev.date) } : null;
}
export const examKinds = (gt) => (gt === "九下" ? ["单元", "月考/阶段", "中考模拟", "中考"] : ["单元", "月考/阶段", "期中", "期末"]);
export function examDate(grade, gt, kind, today, rules) {
    const ev = rules.examCalendar.events.filter((e) => e.grades.includes(grade) && e.kind === kind && gtOf(grade, e.date) === gt && e.date >= today)[0];
    return ev?.date || null;
}

// ---------- 结构模板 ----------
const NEAR_KIND = { 期中: ["期末", "月考/阶段"], 期末: ["期中", "月考/阶段"], "月考/阶段": ["单元", "期中"], 单元: ["月考/阶段", "期中"], 中考模拟: ["中考"], 中考: ["中考模拟"] };
const DEFAULT_PTS = 10;
const tplPoints = (row) => Object.fromEntries(row.types.map((t) => [t.type, t.share * (t.points || DEFAULT_PTS)]));

// 找模板：同年级学期同类考试（新教材优先）→ 同年级另一学期的同类考试 → 同年级学期相近的考试。找不到的格子说清借的是哪一格
export function pickTemplate(data, gt, kind, cohort) {
    const T = data.templates;
    const other = gt[0] + (gt[1] === "上" ? "下" : "上");
    const tries = [];
    for (const tb of ["新", "旧"]) tries.push([gt, kind, tb]);
    for (const tb of ["新", "旧"]) tries.push([other, kind, tb]);
    for (const k of NEAR_KIND[kind] || []) for (const tb of ["新", "旧"]) tries.push([gt, k, tb]);
    let row = null;
    for (const [g, k, tb] of tries) { row = T.find((t) => t.gt === g && t.kind === k && t.textbook === tb); if (row) break; }
    if (!row) row = T.find((t) => t.gt[0] === gt[0]) || T[0];
    const pts = tplPoints(row);
    const notes = [];
    if (row.gt !== gt || row.kind !== kind) notes.push(`库里还没有${gt}${kind}的卷子，借用${row.gt}${row.kind}`);
    const adj = data.rules.newTextbookAdjust;
    if (gt[0] === "九" && cohort >= adj.cohortFrom && row.textbook === "旧") {
        for (const t of adj.drop) delete pts[t];
        Object.assign(pts, adj.add);
        notes.push(`${cohort} 届：去掉${adj.drop.join("、")}，补${Object.keys(adj.add).join("、")}（推测）`);
    }
    return { pts, row, label: `${row.gt}${row.kind}（${row.textbook}教材，${row.n} 份）`, fullMarks: row.full_marks, listening: row.listening, notes };
}

// 一组卷子的平均配分
function avgPoints(papers) {
    const acc = {};
    for (const p of papers) for (const s of p.sections) if (s.type !== "听力" && s.type !== "其他") acc[s.type] = (acc[s.type] || 0) + (s.points || DEFAULT_PTS);
    for (const t in acc) acc[t] /= papers.length;
    return acc;
}
const norm = (o) => { const s = Object.values(o).reduce((a, b) => a + b, 0) || 1; return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v / s])); };

// 学校 / 区的卷子：老师选「统考」看本区统考卷，「不统考」看本校卷，「不知道」两边都看一半
export function schoolPools(data, student, gt, kind, level) {
    const P = data.papers;
    const mine = P.filter((p) => p.school === student.school && p.kind === kind);
    const school = mine.filter((p) => p.gt === gt).length ? mine.filter((p) => p.gt === gt) : mine.filter((p) => p.grade === +{ 七: 7, 八: 8, 九: 9 }[gt[0]]);
    const district = student.district ? P.filter((p) => p.district === student.district && p.level === "区统考" && p.gt === gt && p.kind === kind) : [];
    const { lambdaSchool, lambdaDistrict } = data.rules.params;
    const sameGt = school.length && school[0].gt === gt;
    let ls = level === "统考" ? 0 : school.length ? (sameGt ? lambdaSchool : lambdaSchool * 0.6) : 0;
    let ld = level === "不统考" ? 0 : district.length ? lambdaDistrict : 0;
    if (level === "不知道") { ls /= 2; ld /= 2; }
    return { school, district, ls, ld };
}

export function suggestLevel(data, student, gt, kind) {
    const rules = data.rules.levelDefaults;
    const grade = +{ 七: 7, 八: 8, 九: 9 }[gt[0]];
    const evidence = [];
    const hist = data.papers.filter((p) => p.school === student.school && p.gt === gt && p.kind === kind).sort((a, b) => b.year - a.year);
    for (const p of hist.slice(0, 3)) evidence.push(`${p.name || p.school} ${p.year} ${p.gt}${p.kind}：${p.level}`);
    const dist = data.papers.filter((p) => student.district && p.district === student.district && p.level === "区统考" && p.gt === gt && p.kind === kind);
    if (dist.length) evidence.push(`${student.district}有 ${dist.length} 份${gt}${kind}区统考卷（${[...new Set(dist.map((p) => p.year))].join("、")}）`);
    const rule = rules.find((r) => (!r.ownership || r.ownership === student.ownership) && (!r.kind || r.kind.includes(kind)) && (!r.gt || r.gt.includes(gt)) && (!r.grade || r.grade.includes(grade)));
    if (hist.length && student.ownership !== "私立") {
        const last = hist[0].level === "校考" ? "不统考" : "统考";
        return { suggest: last, why: `这所学校 ${hist[0].year} 年的${gt}${kind}用的是${hist[0].level}卷（库里最近的一次）`, evidence };
    }
    return { suggest: rule.suggest, why: rule.why, evidence };
}

// ---------- 占比 ----------
// weak: { 题型: 0–1 }，emph: { 题型: 0–1 }
export function computeMix({ data, tpl, pools, cohort, gt, today, weak, emph }) {
    const { alpha, gamma, betaMax, minShare } = data.rules.params;
    const g = norm(Object.fromEntries(Object.entries(tpl.pts).filter(([t]) => t !== "听力")));
    const s = Object.keys(pools.school.length ? avgPoints(pools.school) : {}).length ? norm(avgPoints(pools.school)) : {};
    const d = pools.district.length ? norm(avgPoints(pools.district)) : {};
    const ls = Object.keys(s).length ? pools.ls : 0, ld = Object.keys(d).length ? pools.ld : 0;
    let beta = 0, zk = {};
    if (gt[0] === "九") {
        const z = data.rules.zhongkao[cohort] || data.rules.zhongkao[Math.max(...Object.keys(data.rules.zhongkao).filter(Number).map(Number))];
        zk = norm(z.types);
        const months = daysBetween(today, data.rules.zhongkao.date) / 30.4;
        beta = betaMax * Math.max(0, Math.min(1, 1 - months / 10));
    }
    const types = [...new Set([...Object.keys(g), ...Object.keys(s), ...Object.keys(d), ...Object.keys(zk)])];
    const rows = types.map((t) => {
        const gradePart = (1 - beta) * (1 - ls - ld) * (g[t] || 0) + beta * (zk[t] || 0);
        const schoolPart = (1 - beta) * (ls * (s[t] || 0) + ld * (d[t] || 0));
        const base = gradePart + schoolPart;
        const stu = base * alpha * (weak[t] || 0);
        const tea = (base + stu) * gamma * (emph[t] || 0);
        return { type: t, c: { 年级: gradePart, 学校: schoolPart, 学生: stu, 老师: tea } };
    });
    const tot = rows.reduce((a, r) => a + SOURCES.reduce((x, k) => x + r.c[k], 0), 0) || 1;
    for (const r of rows) { for (const k of SOURCES) r.c[k] /= tot; r.share = SOURCES.reduce((x, k) => x + r.c[k], 0); }
    // 太小的这次不讲，剩下的重新归一
    const kept = rows.filter((r) => r.share >= minShare);
    const kt = kept.reduce((a, r) => a + r.share, 0) || 1;
    for (const r of rows) {
        const keep = r.share >= minShare;
        for (const k of SOURCES) r.c[k] = keep ? r.c[k] / kt : 0;
        r.suggested = keep ? r.share / kt : 0;
        r.share = r.suggested;
    }
    return { rows: rows.sort((a, b) => b.suggested - a.suggested), beta, ls, ld, zkNote: gt[0] === "九" ? (data.rules.zhongkao[cohort]?.note || "") : "" };
}

// 老师设置「一节课主攻几个题型」（MAT-498）：只留建议占比最大的 n 个，重新归一；n 为 0 不限
export function keepTop(rows, n) {
    if (!n) return rows;
    const keep = new Set(rows.filter((r) => r.suggested > 0).sort((a, b) => b.suggested - a.suggested).slice(0, n).map((r) => r.type));
    const tot = rows.reduce((a, r) => a + (keep.has(r.type) ? r.suggested : 0), 0) || 1;
    for (const r of rows) {
        const k = keep.has(r.type);
        for (const s of SOURCES) r.c[s] = k ? r.c[s] / tot : 0;
        r.suggested = k ? r.suggested / tot : 0;
        r.share = r.suggested;
    }
    return rows;
}

// 一次定好几个题型的占比，其他题型按原比例分剩下的（画像里设成默认的几个偏好一起加，不会互相稀释）
// 定下来的几个加起来超过 1 时按比例缩到 1；其他题型都是 0（全被定死）时也缩放到 1，合计总是 100%
export function setShares(rows, fixed) {
    const used = rows.reduce((a, r) => a + (r.type in fixed ? fixed[r.type] : 0), 0);
    const rest = rows.reduce((a, r) => a + (r.type in fixed ? 0 : r.share), 0);
    const k = rest ? Math.max(1, used) : used || 1;
    for (const r of rows) r.share = r.type in fixed ? fixed[r.type] / k : rest ? r.share / rest * Math.max(0, 1 - used) : 0;
}

// 老师拖一个滑块：这个题型定为 v，其他题型按原比例分剩下的
export function setShare(rows, type, v) {
    v = Math.max(0, Math.min(0.9, v));
    const others = rows.filter((r) => r.type !== type && r.share > 0);
    const rest = others.reduce((a, r) => a + r.share, 0);
    for (const r of rows) {
        if (r.type === type) r.share = v;
        else if (r.share > 0) r.share = rest ? r.share / rest * (1 - v) : (1 - v) / others.length;
    }
    if (!others.length) for (const r of rows) if (r.type !== type) r.share = 0;
}

// 桑基图的流：老师调高的部分算「老师」，调低的按比例缩各来源
export function flows(rows) {
    return rows.filter((r) => r.share > 0.001).map((r) => {
        const c = { ...r.c };
        const comp = SOURCES.reduce((a, k) => a + c[k], 0);
        if (r.share >= comp) c.老师 += r.share - comp;
        else for (const k of SOURCES) c[k] *= comp ? r.share / comp : 0;
        if (!comp) c.老师 = r.share;
        return { type: r.type, share: r.share, c };
    });
}

// 「这次课的要求」里提到的题型（长词先匹配，「阅读表达」不会被算成「阅读」）
export function typesInText(text, rules) {
    let s = String(text || "");
    const hit = {};
    const pairs = Object.entries(rules.typeKeywords).flatMap(([t, ks]) => ks.map((k) => [t, k])).sort((a, b) => b[1].length - a[1].length);
    for (const [t, k] of pairs) if (s.includes(k)) { hit[t] = 1; s = s.split(k).join("　"); }
    return hit;
}

export function reviewShare(days) { return days == null ? 0.4 : days <= 14 ? 0.7 : days <= 30 ? 0.5 : 0.3; }

// ---------- 学校名对名录（MAT-508；建档时模型给的学校名 → web/schools.json） ----------
// 用户口径（10-29）：只说学校名，默认指总校（侨谊中学 = 侨谊实验中学，天一中学 = 天一中学）；说分校会在总校名后面接上分校名（侨谊古运河、天一宛山湖）。
// 所以从严到宽一层层对，哪层对上就停：名字本身 → 去掉「中学 / 学校」这类通用字（保留「实验」）→ 连「实验」也去掉（这一层就是默认总校）
// → 总校名 + 分校名（先认出总校名，再拿后半截去找，天一宛山湖的正式名里没有「天一」）→ 去掉校区的校名 → 包含关系。
// 还是对上几所的：说了区就只留那个区的；剩下的都有建校年份（schools.json 的 founded）就取最老的，用户口径「哪个建得老，哪个就是总校」；年份不全就让老师选
// 名录里的正式名看不出来的俗称：金桥两个老校区平时叫城中金桥（学前街）、新城金桥（太湖新城）
const SCHOOL_ALIAS = { 锡外: "无锡外国语学校", 省锡中: "江苏省锡山高级中学实验学校", 一女中: "无锡市第一女子中学", 城中金桥: "无锡市梁溪区金桥双语实验学校", 新城金桥: "无锡金桥双语实验学校" };
const sCore = (s) => s.replace(/^(江苏省|无锡市|无锡)/, "").replace(/[（）()\s]/g, "");
const sBase = (s) => s.replace(/（[^）]*校区）$/, "");
const sKeys = (name) => {
    // 括号里只是备注的不算名字；市区的区名去掉（梁溪区金桥双语平时就叫金桥双语），江阴、宜兴的学校平时带市名，留着
    const k0 = sCore(name.replace(/（(暂定名|待更名|少年部)）$/, "")).replace(/^(梁溪区|锡山区|惠山区|滨湖区|新吴区|经开区|高新区)/, "");
    return { k0, k2: k0.replace(/(初级中学|中学|学校|分校|校区|初中部|初中)/g, ""), k1: k0.replace(/(初级中学|实验中学|实验学校|中学|学校|分校|校区|初中部|初中|实验)/g, "") };
};
export function matchSchool(raw, district, schools, districts = []) {
    let q = String(raw || "").trim(); if (!q) return [];
    for (const [a, full] of Object.entries(SCHOOL_ALIAS)) if (q.includes(a) && !q.includes(full)) q = q.replace(a, full);
    const qc = sCore(q), qk = sKeys(q), K = schools.map((s) => ({ s, ...sKeys(s.name) }));
    const by = (f) => K.filter(f).map((x) => x.s);
    const branch = () => {   // 总校名 + 分校名：取能对上的最长总校名，剩下的两个字以上拿去找
        const n = Math.max(0, ...K.filter((x) => x.k1.length >= 2 && x.k1 !== qk.k1 && qk.k1.startsWith(x.k1)).map((x) => x.k1.length));
        const rest = qk.k1.slice(n);
        return n && rest.length >= 2 ? by((x) => x.k1.includes(rest)) : [];
    };
    const tiers = [
        () => schools.filter((s) => s.name === q || sCore(s.name) === qc),
        () => by((x) => x.k0 === qk.k0), () => by((x) => x.k2 && x.k2 === qk.k2), () => by((x) => x.k1 && x.k1 === qk.k1),
        branch,
        () => schools.filter((s) => sCore(sBase(s.name)) === sCore(sBase(q))),
        () => schools.filter((s) => sCore(s.name).includes(qc)),
    ];
    let hits = [], tier = null;
    for (const t of tiers) if ((hits = (tier = t)()).length) break;
    if (hits.length > 1 && districts.includes(district)) { const h = hits.filter((s) => s.district === district); if (h.length) hits = h; }
    // 取最老的只对「光说校名」：总校名 + 分校名那一层还对上几所，说明后半截没认出来（新城金桥会被拆成新城中学 + 金桥），让老师选
    if (hits.length > 1 && tier !== branch && hits.every((s) => s.founded)) { const y = Math.min(...hits.map((s) => s.founded)), h = hits.filter((s) => s.founded === y); if (h.length === 1) hits = h; }
    return hits;
}

// 首页组卷（MAT-545）：题组里的原题号换成新卷子的连续题号。只换题号所在的位置：行首的「6.」（也认「29,」「( ) 30.」）、横线里的「__15__」、括号里的「(15)」，
// 解析里的「【15题详解】」；别的数字不动。hit 是换上了几个题号，比小题数少的，页面另标「第 a–b 题」
export function renumber(it, start) {
    const map = new Map(it.q.map((n, i) => [+n, start + i])), seen = new Set();
    const swap = (m, a, n, b) => { const v = map.get(+n); if (v == null) return m; seen.add(+n); return `${a}${v}${b}`; };
    const text = it.text
        .replace(/^(\s*(?:[(（]\s*[)）]\s*)?)(\d{1,3})(\s*[.．、,，](?!\d))/gm, swap)
        .replace(/(_{2,}\s*)(\d{1,3})(\s*_{2,})/g, swap)
        .replace(/([(（]\s*)(\d{1,3})(\s*[)）])/g, swap);
    const explain = String(it.explain || "").replace(/【答案】[^\n]*\n?/, "").replace(/(【)(\d{1,3})(题详解】)/g, (m, a, n, b) => (map.has(+n) ? `${a}${map.get(+n)}${b}` : m));
    return { text, explain, nums: it.q.map((_, i) => start + i), hit: seen.size };
}
