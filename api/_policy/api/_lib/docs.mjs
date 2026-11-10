// 资料的版本、生效日期和可见角色。构建（build/pack.mjs）、导入（build/ingest.mjs）、检索（pipeline.mjs）共用。
// - 手册修订：docs/revisions/*.md 是修订通知，导入后记在 data/revisions.json。每块带 effectiveFrom / effectiveTo，
//   改过的条款新旧两版都留着，检索、规则引用只取当天有效的那一版。
// - 内部资料：docs/internal/*.md，subject 记成 "*"（两种用工身份都查得到），roles 写谁能看；没有 roles 的块所有人都能看。
export const ROLES = { employee: "员工", manager: "部门经理", hr: "HR" };

// 北京时间的今天 YYYY-MM-DD
export const today = (d = new Date()) => new Date(d.getTime() + 8 * 3600e3).toISOString().slice(0, 10);
export const effectiveAt = (b, day) => (!b.effectiveFrom || b.effectiveFrom <= day) && (!b.effectiveTo || day <= b.effectiveTo);
export const canSee = (role, b) => !b.roles || b.roles.includes(role);
export const inSubject = (b, subject) => b.subject === subject || b.subject === "*";
// 条款号互相覆盖：5.16 覆盖 5.16.4，5.16.4 也算落在 5.16 里
export const covers = (a, b) => a === b || b.startsWith(a + ".") || a.startsWith(b + ".");
const dayBefore = (day) => new Date(Date.parse(day + "T00:00:00Z") - 864e5).toISOString().slice(0, 10);

export function frontMatter(md) {
    const m = md.match(/^---\n([\s\S]*?)\n---\n?/);
    if (!m) throw new Error("开头缺 --- 包起来的字段");
    const meta = {};
    for (const l of m[1].split("\n")) { const i = l.indexOf(":"); if (i > 0) meta[l.slice(0, i).trim()] = l.slice(i + 1).trim(); }
    return { meta, body: md.slice(m[0].length) };
}
// 「## 头」切段，头之前的说明文字不要
const sections = (body) => body.split(/^## /m).slice(1).map((s) => { const nl = s.indexOf("\n"); return { head: s.slice(0, nl < 0 ? s.length : nl).trim(), text: (nl < 0 ? "" : s.slice(nl + 1)).trim() }; });

// 修订通知 → { id, subject, version, effectiveFrom, title, changes: [{ op, clause, title, text }] }
export function parseRevision(md) {
    const { meta, body } = frontMatter(md);
    for (const k of ["id", "subject", "version", "effectiveFrom", "title"]) if (!meta[k]) throw new Error(`修订通知缺字段 ${k}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.effectiveFrom)) throw new Error(`生效日期格式不对：${meta.effectiveFrom}`);
    const changes = sections(body).map(({ head, text }) => {
        const m = head.match(/^(修改|新增|删除)\s+(\S+)\s*(.*)$/);
        if (!m) throw new Error(`看不懂这一段的标题：## ${head}`);
        if (m[1] !== "删除" && !text) throw new Error(`「${head}」没有正文`);
        return { op: m[1], clause: m[2], title: m[3] || "", text };
    });
    if (!changes.length) throw new Error("修订通知里一条改动都没有");
    return { id: meta.id, subject: meta.subject, version: meta.version, effectiveFrom: meta.effectiveFrom, title: meta.title, changes };
}

// 内部资料 → 块
export function parseInternal(md) {
    const { meta, body } = frontMatter(md);
    const roles = (meta.roles || "").split(/[,，\s]+/).filter(Boolean);
    if (!roles.length || roles.some((r) => !ROLES[r])) throw new Error(`${meta.id}：roles 要写 ${Object.keys(ROLES).join(" / ")}`);
    return sections(body).map(({ head, text }) => {
        const [clause, ...t] = head.split(/\s+/);
        return {
            cid: `internal:${meta.id}:${clause}`, path: `internal/${meta.id}/${clause}`, folder: "internal", subject: "*", doc: meta.id,
            title: t.join(" "), clause, ctx: `${meta.name} > ${head}`, page: null, text, day: 0,
            source: meta.name, version: meta.version, date: meta.date, roles,
        };
    });
}

// 条款块里把一个下级条款（5.16.4）整段换掉：从这一行起，到下一个同级编号或块尾
function replaceSub(text, sub, next) {
    const lines = text.split("\n");
    const start = lines.findIndex((l) => l.startsWith(sub + " ") || l.startsWith(sub + "　") || l === sub);
    if (start < 0) return null;
    let end = start + 1;
    while (end < lines.length && !/^\d+\.\d+\.\d+/.test(lines[end])) end++;
    return [...lines.slice(0, start), ...next.split("\n"), ...lines.slice(end)].join("\n");
}

// 把修订按生效日期依次叠到基础块上。返回 { blocks（含新旧所有版本）, log: [{ revision, op, clause, oldCid, newCid }] }
// 修订之间有冲突（改一条不存在的、新增一条已有的）直接抛错，导入任务记成失败
export function applyRevisions(base, revisions) {
    const blocks = base.map((b) => ({ ...b }));
    const log = [];
    const live = (subject, clause) => blocks.find((b) => b.subject === subject && !b.effectiveTo && (b.clause === clause || (clause.startsWith(b.clause + ".") && b.text.split("\n").some((l) => l.startsWith(clause + " ") || l === clause))));
    for (const rev of [...revisions].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom))) {
        const until = dayBefore(rev.effectiveFrom);
        for (const ch of rev.changes) {
            const old = live(rev.subject, ch.clause);
            const stamp = { version: rev.version, date: rev.effectiveFrom, effectiveFrom: rev.effectiveFrom, revision: rev.id, changed: [ch.clause] };
            if (ch.op === "新增") {
                if (old) throw new Error(`${rev.id}：要新增的 ${ch.clause} 已经有了`);
                const sib = blocks.find((b) => b.subject === rev.subject && b.clause.split(".")[0] === ch.clause.split(".")[0]);
                if (!sib) throw new Error(`${rev.id}：找不到 ${ch.clause} 该放在哪一章`);
                const nb = { ...sib, ...stamp, cid: `${rev.subject}:${ch.clause}@${rev.id}`, path: `${rev.subject}/${ch.clause}`, clause: ch.clause, title: ch.title || ch.clause,
                    ctx: `${sib.ctx.split(" > ")[0]} > ${ch.clause} ${ch.title}`.trim(), page: null, text: ch.text, effectiveTo: undefined, prevCid: undefined };
                blocks.push(nb);
                log.push({ revision: rev.id, op: ch.op, clause: ch.clause, oldCid: null, newCid: nb.cid });
                continue;
            }
            if (!old) throw new Error(`${rev.id}：手册里找不到要${ch.op}的条款 ${ch.clause}`);
            old.effectiveTo = until;
            if (ch.op === "删除") { log.push({ revision: rev.id, op: ch.op, clause: ch.clause, oldCid: old.cid, newCid: null }); continue; }
            const text = old.clause === ch.clause ? ch.text : replaceSub(old.text, ch.clause, ch.text);
            if (text == null) throw new Error(`${rev.id}：${old.clause} 里找不到 ${ch.clause} 这一段`);
            const nb = { ...old, ...stamp, cid: `${old.cid.split("@")[0]}@${rev.id}`, text, page: null, effectiveTo: undefined, prevCid: old.cid };   // 修订版不在 PDF 里，没有页码
            blocks.push(nb);
            log.push({ revision: rev.id, op: ch.op, clause: ch.clause, oldCid: old.cid, newCid: nb.cid, inClause: old.clause });
        }
    }
    return { blocks, log };
}

// 引用的这块（按 clause 粒度）在 asOf 之后有没有待生效的修订：返回 { version, effectiveFrom, changed, cid } 或 null
export function upcoming(blocks, b, clause, asOf) {
    let cur = b;
    for (;;) {
        const n = blocks.find((x) => x.prevCid === cur.cid);
        if (!n) return null;
        if (n.effectiveFrom > asOf && n.changed.some((c) => covers(clause, c))) return { version: n.version, effectiveFrom: n.effectiveFrom, changed: n.changed, cid: n.cid, clause: n.clause };
        cur = n;
    }
}
