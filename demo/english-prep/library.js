// 老师的教案库（MAT-542，用户 10-30「相当于是一个动态的知识库了，用户上传的教案之后能融入到原有的基础的rag知识库里」）。
// 老师上传的教案经 action=ingest 切块、标题型、算向量，整份存在老师自己的工作区 S.library（只在这个账号里，不进公共题库）；
// 排大纲时把块带给 action=outline，和题库一起检索；改写、融合（action=adapt）从这里和存下来的教案里取原教案。纯函数，网页端和微信端共用
export const LIB_DOCS = 30;   // 一份约 15 KB（向量占大头），30 份不到 0.5 MB，整个工作区还放得进浏览器和 Redis

// 存进教案库：同名的换成新的（改过再传一次）。doc 是 action=ingest 给的 { name, gt, summary, topics, types, chunks }
export function libAdd(S, doc, date) {
    const lib = (S.library ||= []);
    const d = { id: "L" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), at: date, ...doc };
    const old = lib.findIndex((x) => x.name === d.name);
    if (old >= 0) lib.splice(old, 1);
    lib.unshift(d);
    S.library = lib.slice(0, LIB_DOCS);
    return d;
}
export function libRemove(S, id) {
    const i = (S.library || []).findIndex((d) => d.id === id);
    return i >= 0 ? S.library.splice(i, 1)[0] : null;
}
// 删了又撤销：放回原来的位置
export function libRestore(S, d, at = 0) { (S.library ||= []).splice(Math.min(at, S.library.length), 0, d); }
// 整份的文字（改写、融合、抽模板用）
export const docText = (d) => d.chunks.map((c) => (c.title === "开头" ? c.text : `${c.title}\n${c.text}`)).join("\n\n");
export const libLine = (d) => [d.name, d.gt, d.types.join("、")].filter(Boolean).join(" · ");
// 排大纲时带给函数的块：这节课要练的题型对得上的先带，其余按新到旧补，最多 60 块
export function libChunks(S, types = []) {
    const want = new Set(types);
    const all = (S.library || []).flatMap((d) => d.chunks.map((c, i) => ({ id: `${d.id}:${i}`, doc: d.name, sum: `《${d.name}》${d.summary || ""}`, title: c.title, text: c.text, types: c.types, kps: c.kps, v: c.v, s: c.s,
        hit: [...c.types, ...d.types].some((t) => want.has(t)) })));
    return [...all.filter((c) => c.hit), ...all.filter((c) => !c.hit)].slice(0, 60).map(({ hit, ...c }) => c);
}
// 改写、融合的原教案：教案库里的一份，或者存下来的 / 正在备的教案（带着当时用的题库例题，函数统一重编号）
export const libSource = (d) => ({ name: d.name, text: docText(d) });
export const planSource = (name, W) => ({ name, text: W.md, items: (W.items || []).map(({ code, id }) => ({ code, id })) });
