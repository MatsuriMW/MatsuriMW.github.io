// 英语备课 demo 的服务端核心：题库（解密）、检索、模型调用、提示词（大纲、教案、聊天、记忆、复盘）。
// 题库来自 72 份无锡真卷（scripts/split.py 拆题 → demo/build.mjs 加密），只在函数里解密，页面只拿到检索出的单题 / 单篇和出处。
// 检索：按题型、出卷来源（统考 / 校考）、年级学期和考试类型过滤（不够就逐级放宽）→ BM25 + bge-m3 余弦 + 加分项 → bge-reranker 重排。
import fs from "node:fs";
import crypto from "node:crypto";
import zlib from "node:zlib";

const SF = process.env.SF_BASE || "https://api.siliconflow.cn/v1";
const DIMS = 1024;
export const TYPES = ["音标/语音", "单项选择", "完形填空", "阅读理解", "七选五/信息还原", "阅读表达", "阅读填空", "任务型阅读",
    "词汇运用", "动词填空", "综合填空", "语法填空", "完成句子", "句型转换", "补全对话", "书面表达"];
const PASSAGE = new Set(["完形填空", "阅读理解", "七选五/信息还原", "阅读表达", "阅读填空", "任务型阅读", "综合填空", "语法填空", "补全对话", "书面表达"]);
const TEXTBOOK_BOUND = new Set(["词汇运用", "完成句子", "动词填空", "句型转换"]);   // 跟课本单元绑定的题，新教材学生优先用新教材的卷子
const UNIFIED = new Set(["区统考", "市统考", "中考"]);

// ---------- 分词（同第二大脑：中文两字一切，英文按词去停用词） ----------
const CJK = /[㐀-鿿豈-﫿]/;
const STOP = new Set("the and for are but not you with this that from have was were will would can could what when where which who how all any your our their its his her they them then than there here into about just also very more most some such only other of to in on at by is it be as or an if so do does did no yes we he she i me my".split(" "));
function tokenize(text) {
    const out = [];
    for (const m of String(text).toLowerCase().matchAll(/[a-z][a-z'-]{1,}|[㐀-鿿豈-﫿]+/g)) {
        const w = m[0];
        if (CJK.test(w[0])) { if (w.length === 1) out.push(w); for (let i = 0; i + 1 < w.length; i++) out.push(w.slice(i, i + 2)); }
        else if (!STOP.has(w)) out.push(w);
    }
    return out;
}
// 题面里的 ⟦图n⟧：检索和给模型看的时候换成图的描述和图中文字（转写来自 scripts/images.py）
export const withImageText = (u) => u.text.replace(/⟦图(\d+)⟧/g, (_, n) => { const i = (u.imgs || []).find((x) => x.n === +n); return i ? `［图：${i.desc}${i.text ? "；图中文字：" + i.text : ""}］` : ""; });
const searchText = (u) => `${u.type}｜${u.kp.join("、")}｜${u.topic}\n${withImageText(u).slice(0, 1200)}`;

// 题库密钥从服务器上的 DeepSeek key 派生（HKDF），不用另配密钥；换了 DeepSeek key 要重跑 demo/build.mjs 再发布
export function dataKey(secret = process.env.DEEPSEEK_API_KEY) {
    if (!secret) throw new Error("服务器上没有 DeepSeek key，题库解不开");
    return Buffer.from(crypto.hkdfSync("sha256", secret, "wuxi-english-prep", "bank-v1", 32));
}

const rd = (f) => fs.readFileSync(new URL(`../_data/english/${f}`, import.meta.url));
// 取一张图（解密），返回 data URI；只给检索选中的题用
export function imageURI(hash) {
    const raw = rd(`img/${hash.replace(/[^0-9a-f]/g, "")}.enc`);
    const dec = crypto.createDecipheriv("aes-256-gcm", dataKey(), raw.subarray(0, 12));
    dec.setAuthTag(raw.subarray(12, 28));
    return "data:image/jpeg;base64," + Buffer.concat([dec.update(raw.subarray(28)), dec.final()]).toString("base64");
}

// ---------- 题库 ----------
let DB = null;
export function loadDB() {
    if (DB) return DB;
    const raw = rd("units.enc");
    const dec = crypto.createDecipheriv("aes-256-gcm", dataKey(), raw.subarray(0, 12));
    dec.setAuthTag(raw.subarray(12, 28));
    const units = JSON.parse(zlib.gunzipSync(Buffer.concat([dec.update(raw.subarray(28)), dec.final()])));
    const vb = rd("vec.bin"), sb = rd("scales.bin");
    const vec = new Int8Array(vb.buffer, vb.byteOffset, vb.length);
    const scales = new Float32Array(sb.buffer.slice(sb.byteOffset, sb.byteOffset + sb.length));
    // BM25 倒排
    const tf = [], df = new Map();
    let total = 0;
    for (const u of units) {
        const m = new Map();
        for (const t of tokenize(searchText(u))) m.set(t, (m.get(t) || 0) + 1);
        tf.push(m); total += [...m.values()].reduce((a, b) => a + b, 0);
        for (const t of m.keys()) df.set(t, (df.get(t) || 0) + 1);
    }
    const len = tf.map((m) => [...m.values()].reduce((a, b) => a + b, 0));
    DB = { units, byId: new Map(units.map((u, i) => [u.id, i])), vec, scales, tf, df, len, avg: total / units.length, meta: JSON.parse(rd("meta.json")) };
    return DB;
}

function bm25(db, qt, i) {
    let s = 0;
    const m = db.tf[i], N = db.units.length;
    for (const t of qt) {
        const f = m.get(t); if (!f) continue;
        const idf = Math.log(1 + (N - db.df.get(t) + 0.5) / (db.df.get(t) + 0.5));
        s += idf * (f * 2.2) / (f + 1.2 * (0.25 + 0.75 * db.len[i] / db.avg));
    }
    return s;
}
function cosine(db, q, i) {
    let s = 0;
    const o = i * DIMS;
    for (let k = 0; k < DIMS; k++) s += q[k] * db.vec[o + k];
    return s * db.scales[i];
}
const z = (xs) => { const m = xs.reduce((a, b) => a + b, 0) / (xs.length || 1); const sd = Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length || 1)) || 1; return xs.map((x) => (x - m) / sd); };

// 外部接口：函数热着的时候偶尔会复用一条已经被对方关掉的长连接，fetch 直接报「fetch failed」（POST 不会自动重试）。
// 网络层失败就重试一次；HTTP 报错、老师取消（abort）不重试
async function fetchRetry(url, opts) {
    try { return await fetch(url, opts); }
    catch (e) { if (e.name === "AbortError" || opts.signal?.aborted) throw e; return fetch(url, opts); }
}

export async function embed(texts, { signal } = {}) {
    const r = await fetchRetry(`${SF}/embeddings`, {
        method: "POST", signal, headers: { Authorization: `Bearer ${process.env.SILICONFLOW_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "BAAI/bge-m3", input: texts, encoding_format: "float" }),
    });
    if (!r.ok) throw new Error(`embeddings ${r.status} ${(await r.text()).slice(0, 200)}`);
    return (await r.json()).data.sort((a, b) => a.index - b.index).map((d) => {
        let n = 0; for (const x of d.embedding) n += x * x; n = Math.sqrt(n) || 1;
        return Float32Array.from(d.embedding, (x) => x / n);
    });
}
export async function rerank(query, docs, { signal } = {}) {
    const r = await fetchRetry(`${SF}/rerank`, {
        method: "POST", signal, headers: { Authorization: `Bearer ${process.env.SILICONFLOW_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "BAAI/bge-reranker-v2-m3", query, documents: docs, return_documents: false }),
    });
    if (!r.ok) throw new Error(`rerank ${r.status} ${(await r.text()).slice(0, 200)}`);
    return (await r.json()).results.map((x) => ({ index: x.index, score: x.relevance_score }));
}

// 课后作业用题（MAT-487，实测作业全是课上刚讲完答案的题）：按这节课的薄弱考点另找同考点的新题。
// 老师设置「只练薄弱点」（默认）看有薄弱考点的题型，没有就看占比最大的；「全面练」看占比最大的两个。短文类一篇、一句一题的三道
export function homeworkSlots(mix, settings) {
    const weak = mix.filter((m) => m.kps?.length), pool = settings?.homeworkScope !== "全面练" && weak.length ? weak : mix;
    return [...pool].sort((a, b) => b.share - a.share).slice(0, 2).map((m) => ({ type: m.type, share: 0.1, kps: m.kps || [], n: PASSAGE.has(m.type) ? 1 : 3 }));
}
// 每个题型要几道：短文类按篇（1–2 篇），一句一题的按题（3–6 道）
export function slotSize(type, share) {
    if (PASSAGE.has(type)) return share >= 0.22 ? 2 : 1;
    return Math.max(3, Math.min(6, Math.round(share * 30)));
}

// 考点的上下位说法：拆题时模型给的标签不统一（非谓语动词的单选常标成「动名词」「动词不定式」）
const KP_ALIAS = {
    非谓语动词: ["动名词", "不定式", "分词", "非谓语"], 时态: ["一般现在时", "一般过去时", "一般将来时", "现在完成时", "现在进行时", "过去进行时", "过去将来时", "时态"],
    词形变化: ["词形", "名词复数", "比较级", "最高级", "序数词", "副词", "形容词"], 从句: ["宾语从句", "定语从句", "状语从句", "从句"],
    上下文逻辑: ["上下文", "语境", "逻辑"], 推理判断: ["推理"], 主旨大意: ["主旨", "标题", "大意"], 细节理解: ["细节"],
    情景交际: ["情景", "交际", "日常用语"], 被动语态: ["被动"], 代词: ["代词"], 固定搭配: ["搭配", "短语"],
};
const kpTerms = (k) => [k, ...(KP_ALIAS[k] || [])];
// 题目标签包含要找的说法才算；反过来只认三个字以上的标签（「名词」不能算进「动名词」）
export const kpHit = (u, kps) => kps.filter((k) => u.kp.some((x) => kpTerms(k).some((t) => x.includes(t)) || (x.length >= 3 && k.includes(x))));
const GRADE_OF = { 七: 7, 八: 8, 九: 9 };
// 自定义查询里的中文两字词（去掉题型名本身），用来认话题：「环保话题的完形」→ 环保、话题……
const queryTerms = (q, type) => [...new Set(tokenize(q).filter((t) => CJK.test(t) && t.length === 2 && !type.includes(t) && !"题型考点一篇一道找题话题".includes(t)))];
const topicHit = (u, terms) => terms.some((t) => (u.topic + u.kp.join("")).includes(t));

// 学期远近（MAT-483）：年级对口比统考 / 校考对口、比同校都要紧（用户 10-28：八上学生拿到一堆九下中考模拟题）
const SEM = { 七上: 1, 七下: 2, 八上: 3, 八下: 4, 九上: 5, 九下: 6 };
const semGap = (gt, ref) => (SEM[gt] && SEM[ref] ? SEM[gt] - SEM[ref] : 0);
// 检索打分里的扣分：同学期不扣，同年级另一学期小扣，相邻学期跨年级（八上用七下）大扣，再远的更多
const gapCost = (u, ref) => { const d = Math.abs(semGap(u.gt, ref)); return !d ? 0 : d === 1 && u.gt[0] === ref[0] ? 0.15 : [0, 0.3, 0.6][d] ?? 1; };
// 借了别的学期的题：例题卡和教案里写明（「借自九下中考模拟，高 3 个学期，可能偏难」）
export const borrowNote = (u, ref) => { const d = semGap(u.gt, ref); return d ? `借自${u.gt}${u.kind}，${d > 0 ? `高 ${d} 个学期，可能偏难` : `低 ${-d} 个学期`}` : ""; };
// 一个题型的候选池：年级学期 / 考试类型逐级放宽，每一级先按出卷来源（统考 / 校考）找、不够再不管出卷来源（先放宽出卷来源，再放宽年级）。
// 最远只到相邻学期再隔一个（八上最远用到七上、九上）；老师说要拔高、或者例题选「偏难」才放开到全库。返回 { ids, relax }
function pool(db, slot, ctx) {
    const lv = ctx.level === "统考" ? (u) => UNIFIED.has(u.level) : ctx.level === "不统考" ? (u) => u.level === "校考" : () => true;
    const gap = (u) => Math.abs(semGap(u.gt, ctx.gt));
    const stretch = ctx.difficulty === "偏难" || /拔高|难一点|中考真?题/.test(ctx.guidance || "");
    const tiers = [
        ["同年级学期、同类考试", (u) => u.gt === ctx.gt && u.kind === ctx.kind],
        ["同年级学期", (u) => u.gt === ctx.gt],
        ["相邻学期", (u) => gap(u) <= 1],
        ["隔一个学期以内", (u) => gap(u) <= 2],
        ...(stretch ? [["全库", () => true]] : []),
    ];
    const need = Math.max(slot.n * 3, 6);
    const learned = (u) => !ctx.maxUnit || semGap(u.gt, ctx.gt) < 0 || (u.gt === ctx.gt && unitEnd(u, ctx.scope) <= ctx.maxUnit);   // 首页组卷按学生进度（MAT-545）
    const base = db.units.map((u, i) => i).filter((i) => db.units[i].type === slot.type && !ctx.exclude?.has(db.units[i].id) && learned(db.units[i]));
    for (const [ti, [label, f]] of tiers.entries()) {
        for (const levelOk of [true, false]) {
            const ids = base.filter((i) => f(db.units[i]) && (!levelOk || lv(db.units[i])));
            const last = ti === tiers.length - 1 && !levelOk;
            if (!(ids.length >= need || (last && ids.length))) continue;
            // 范围里对得上考点的题不够：只把对得上的从更宽的范围补进来，最远到相邻学期
            let extra = 0;
            if (slot.kps.length) {
                for (const [, g] of tiers.slice(ti + 1, 3)) {
                    if (ids.filter((i) => kpHit(db.units[i], slot.kps).length).length >= slot.n) break;
                    for (const i of base) if (!ids.includes(i) && g(db.units[i]) && (!levelOk || lv(db.units[i])) && kpHit(db.units[i], slot.kps).length) { ids.push(i); extra++; }
                }
            }
            // 自定义找题时提到了话题（「环保」）而范围里没有对得上的：话题对得上的从相邻学期、其他出卷来源补进来（以前放到相邻年级，七上会拿到八下的题）
            if (slot.terms?.length && ids.filter((i) => topicHit(db.units[i], slot.terms)).length < slot.n) {
                for (const i of base) if (!ids.includes(i) && (stretch || gap(db.units[i]) <= 1) && topicHit(db.units[i], slot.terms)) { ids.push(i); extra++; }
            }
            return { ids, relax: label, extra, levelRelaxed: !levelOk && ctx.level !== "不知道" };
        }
    }
    return { ids: [], relax: "无", extra: 0, levelRelaxed: false };
}

// 一份卷子考到第几单元：标题里写了 Unit 几按标题（「Unit+1单元练习」「Unit3-4测试卷」），没写按考试类型的默认范围（页面传来 rules.json 的 examCalendar.scope）；全册、初中全部算 99
export function unitEnd(u, scope) {
    const m = [...String(u.title).matchAll(/Unit\s*\+?\s*(\d)(?:\s*[-–~～至到]\s*(?:Unit\s*)?(\d))?/gi)].pop();
    if (m) return +(m[2] || m[1]);
    const r = String(scope?.[u.gt[1]]?.[u.kind] || "").match(/(\d)\s*[–-]\s*(\d)/);
    return r ? +r[2] : 99;
}
// slots: [{ type, share, kps: [薄弱考点], query?（自定义查询）, n?（要几道）}]
// ctx: { gt, kind, level, school, district, textbook, guidance, difficulty?（偏易 / 适中 / 偏难）, exclude?（不要的题目 id，Set）, maxUnit?、scope?（组卷按学生进度）}
// 难度：题目的难度档（demo/build.mjs 算好）和目标对上的加分，差两档的减分
export const TIER = { 偏易: 0, 适中: 1, 偏难: 2 };
const DIFF_BONUS = 0.35;
// 难度按学生所在的册算（demo/build.mjs 给阅读、完形、语法填空每篇存了六册各自的分和档）：1 = 七上 … 6 = 九下
const BOOK = { 七上: 1, 七下: 2, 八上: 3, 八下: 4, 九上: 5, 九下: 6 };
const BOOK_CN = ["", ...Object.keys(BOOK), "初中不学"];
// 给页面和模型看的：这个学生的难度档、分，和他还没学的生词（哪一册学、词性、在题目还是文章里）
export function diffView(u, gt) {
    const k = BOOK[gt];
    if (!u.diff || !k) return null;
    return { tier: u.diff.tier[k - 1], score: u.diff.score[k - 1],
        words: u.diff.words.filter(([, b]) => b > k).map(([w, b, pos, loc]) => ({ w, book: BOOK_CN[b], pos, loc })) };
}
const diffBonus = (u, ctx) => { const t = u.diff?.tier?.[BOOK[ctx.gt] - 1]; return ctx.difficulty in TIER && t in TIER ? DIFF_BONUS * (1 - Math.abs(TIER[t] - TIER[ctx.difficulty])) : 0; };
export async function retrieve(slots, ctx, { signal, onStage } = {}) {
    const db = loadDB();
    const t0 = Date.now();
    slots = slots.filter((s) => TYPES.includes(s.type)).map((s) => ({ ...s, n: s.n ?? slotSize(s.type, s.share), terms: s.query ? queryTerms(s.query, s.type) : [] }));
    const queries = slots.map((s) => s.query || `${s.type}${s.kps.length ? "：" + s.kps.join("、") : ""}${ctx.guidance ? "。" + ctx.guidance : ""}`);
    const qv = await embed(queries, { signal });
    onStage?.("embed", { ms: Date.now() - t0, n: queries.length });
    const out = await Promise.all(slots.map(async (s, si) => {
        const P = pool(db, s, ctx);
        if (!P.ids.length) return { type: s.type, n: s.n, relax: P.relax, items: [] };
        const qt = tokenize(queries[si]);
        const cos = P.ids.map((i) => cosine(db, qv[si], i)), bm = P.ids.map((i) => bm25(db, qt, i));
        const zc = z(cos), zb = z(bm);
        const cand = P.ids.map((i, k) => {
            const u = db.units[i];
            const hit = kpHit(u, s.kps), topic = topicHit(u, s.terms);
            const sameSchool = ctx.school && u.school === ctx.school, sameDistrict = ctx.district && u.district === ctx.district;
            const f = zc[k] + 0.3 * zb[k] + (hit.length ? 0.8 : 0) + (topic ? 1 : 0) + (sameSchool ? 0.5 : 0) + (sameDistrict ? 0.25 : 0)
                + (ctx.textbook === "新" && TEXTBOOK_BOUND.has(s.type) && u.textbook === "新" ? 0.4 : 0) + (u.year >= 2025 ? 0.15 : 0) + 2 * diffBonus(u, ctx) - gapCost(u, ctx.gt);
            return { i, f, cos: cos[k], bm: bm[k], hit, topic, sameSchool, sameDistrict };
        }).sort((a, b) => b.f - a.f).slice(0, Math.max(12, s.n * 4));
        // 重排：题型 + 考点 + 老师要求 对题面打分
        const rr = await rerank(queries[si], cand.map((c) => { const u = db.units[c.i]; return `${u.kp.join("、")}｜${u.text.slice(0, 700)}`; }), { signal });
        for (const r of rr) cand[r.index].rr = r.score;
        for (const c of cand) c.final = c.rr + (c.hit.length ? 0.5 : 0) + (c.topic ? 0.5 : 0) + (c.sameSchool ? 0.12 : 0) + (c.sameDistrict ? 0.06 : 0) + diffBonus(db.units[c.i], ctx) - gapCost(db.units[c.i], ctx.gt) / 2;
        cand.sort((a, b) => b.final - a.final);
        // 挑题：同一份卷子短文类最多 1 篇、单题最多 2 道（组卷时用 s.cap 放宽）；「不知道统不统考」两边轮流挑。
        // 组卷时给了 s.q 就按小题数凑满（一个题组可能有几道小题），短文类可以多出 2 道，凑不上的第一组照样要
        const perPaper = {}, pick = [], cap = s.cap ?? (PASSAGE.has(s.type) ? 1 : 2), slack = PASSAGE.has(s.type) ? 2 : 0;
        let got = 0;
        const full = () => (s.q ? got >= s.q : pick.length >= s.n), fits = (c) => !s.q || !pick.length || got + db.units[c.i].q.length <= s.q + slack;
        const lanes = ctx.level === "不知道" ? [cand.filter((c) => UNIFIED.has(db.units[c.i].level)), cand.filter((c) => !UNIFIED.has(db.units[c.i].level))] : [cand];
        for (let round = 0; !full() && round < cand.length; round++) {
            for (const lane of lanes) {
                const c = lane.find((c) => !pick.includes(c) && (perPaper[db.units[c.i].paper] || 0) < cap && fits(c));
                if (c && !full()) { pick.push(c); got += db.units[c.i].q.length; perPaper[db.units[c.i].paper] = (perPaper[db.units[c.i].paper] || 0) + 1; }
            }
        }
        // 备选：老师在页面上「换一题」时用，同样守每份卷子的上限
        const alts = [];
        for (const c of cand) {
            if (alts.length >= 2) break;
            if (pick.includes(c) || (perPaper[db.units[c.i].paper] || 0) >= (PASSAGE.has(s.type) ? 1 : 2)) continue;
            alts.push(c); perPaper[db.units[c.i].paper] = (perPaper[db.units[c.i].paper] || 0) + 1;
        }
        const show = (c) => {
            const u = db.units[c.i];
            const why = [];
            if (c.hit.length) why.push(`考点对上：${c.hit.join("、")}`);
            if (c.topic) why.push(`话题对上：${u.topic}`);
            if (c.sameSchool) why.push("同校的卷子");
            else if (c.sameDistrict) why.push("同区的卷子");
            why.push(u.level);
            if (u.gt !== ctx.gt) why.push(borrowNote(u, ctx.gt));
            else if (u.kind !== ctx.kind) why.push(`来自${u.gt}${u.kind}`);
            return { ...itemView(u, ctx.gt), why, score: { rr: +c.rr.toFixed(3), cos: +c.cos.toFixed(3) } };
        };
        return {
            type: s.type, n: s.n, query: queries[si], relax: P.relax, extra: P.extra, levelRelaxed: P.levelRelaxed, pool: P.ids.length,
            candidates: cand.length, kpCovered: s.kps.length ? pick.filter((c) => c.hit.length).length : null,
            items: pick.map(show), alts: alts.map(show),
        };
    }));
    onStage?.("search", { ms: Date.now() - t0 });
    return out;
}

// 给页面的一道题：题面、答案、解析、图（图走加密图片的地址）。检索结果和「按 id 取回题面」用同一份
function itemView(u, gt) {
    return {
        id: u.id, type: u.type, gt: u.gt, kind: u.kind, year: u.year, level: u.level, school: u.name || u.district || u.school, title: u.title,
        q: u.q, ans: u.ans, ans_src: u.ans_src, kp: u.kp, topic: u.topic, text: u.text, explain: u.explain,   // 给全文：学生版直接印、老师版带完整解析
        imgs: (u.imgs || []).map((i) => ({ n: i.n, w: i.w, h: i.h, kind: i.kind, desc: i.desc, text: i.text, src: imageURI(i.hash) })),
        diff: diffView(u, gt),
    };
}
// 换了设备登录同一个账号，本机没缓存过的题面按 id 取回（MAT-510）。只认题库里的 id；调用方要登录、按 IP 限量
export function itemBodies(ids, gt) {
    const db = loadDB();
    return (Array.isArray(ids) ? ids : []).slice(0, 40).map((id) => db.byId.get(String(id))).filter((i) => i != null).map((i) => itemView(db.units[i], gt));
}

// 页面传回来的只有 [{code, id}]，题面一律从题库取，页面塞不进别的内容
export function itemsByIds(list, gt) {
    const db = loadDB();
    return (Array.isArray(list) ? list : []).slice(0, 30).map((x) => {
        const i = db.byId.get(String(x?.id || "")); if (i == null) return null;
        const u = db.units[i];
        return { code: String(x.code || "").replace(/[^E0-9]/g, "").slice(0, 4), hw: !!x.hw, type: u.type, gt: u.gt, kind: u.kind, year: u.year, level: u.level,
            school: u.name || u.district || u.school, kp: u.kp, topic: u.topic, ans: u.ans, text: u.text, imgs: u.imgs || [], explain: u.explain, diff: diffView(u, gt), borrow: borrowNote(u, gt) };
    }).filter(Boolean);
}

// ---------- 模型 ----------
// 默认用站长在硅基流动的额度（用户 10-28 定，模型和 DeepSeek 官方是同一个）；EN_LLM_PROVIDER=deepseek 可以切回 DeepSeek 官方。
// 页面上可以填自己的 key（只存在浏览器里，经这里转发）。只认这两个地址，免得函数被拿去请求任意网址
const PROVIDERS = {
    deepseek: { base: "https://api.deepseek.com", model: "deepseek-chat" },
    siliconflow: { base: "https://api.siliconflow.cn/v1", model: "deepseek-ai/DeepSeek-V4.1-Flash", extra: { enable_thinking: false } },
};
export function llmConfig(byok) {
    const P = byok && PROVIDERS[byok.provider];
    if (P && typeof byok.key === "string" && /^[\x21-\x7e]{16,200}$/.test(byok.key)) {
        const model = typeof byok.model === "string" && /^[\w./:-]{2,80}$/.test(byok.model) ? byok.model : P.model;
        return { ...P, key: byok.key, model, own: true };
    }
    const sf = process.env.EN_LLM_PROVIDER !== "deepseek" && process.env.SILICONFLOW_API_KEY;   // 硅基流动的 key 没配就退回 DeepSeek
    return sf ? { ...PROVIDERS.siliconflow, key: process.env.SILICONFLOW_API_KEY, own: false } : { ...PROVIDERS.deepseek, key: process.env.DEEPSEEK_API_KEY, own: false };
}
const DEFAULT_LLM = () => llmConfig(null);
async function llmError(r, cfg) {
    const t = (await r.text()).slice(0, 160);
    if (cfg.own && [401, 402, 403].includes(r.status)) return `你填的 key 用不了（不对、没余额，或者没开通这个模型）：${r.status} ${t}`;
    return `模型接口 ${r.status} ${t}`;
}
export async function* stream(messages, { signal, max_tokens = 3000, temperature = 0.4, cfg = DEFAULT_LLM() } = {}) {
    const r = await fetchRetry(`${cfg.base}/chat/completions`, {
        method: "POST", signal, headers: { Authorization: `Bearer ${cfg.key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: cfg.model, messages, stream: true, temperature, max_tokens, stream_options: { include_usage: true }, ...cfg.extra }),
    });
    if (!r.ok) throw new Error(await llmError(r, cfg));
    const dec = new TextDecoder();
    let buf = "";
    for await (const chunk of r.body) {
        buf += dec.decode(chunk, { stream: true });
        let nl;
        while ((nl = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
            if (!line.startsWith("data:") || line === "data: [DONE]") continue;
            const d = JSON.parse(line.slice(5));
            const t = d.choices?.[0]?.delta?.content;
            if (t) yield t;
            if (d.usage) yield { usage: d.usage };
        }
    }
}
export async function json(messages, { signal, max_tokens = 2000, cfg = DEFAULT_LLM() } = {}) {
    const r = await fetchRetry(`${cfg.base}/chat/completions`, {
        method: "POST", signal, headers: { Authorization: `Bearer ${cfg.key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: cfg.model, messages, temperature: 0.2, max_tokens, response_format: { type: "json_object" }, ...cfg.extra }),
    });
    if (!r.ok) throw new Error(await llmError(r, cfg));
    const d = await r.json();
    const t = d.choices[0].message.content || "";
    let data;
    try { data = JSON.parse(t); } catch { data = JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1)); }   // 有的模型会包一层 ```json
    return { data, usage: d.usage };
}

// ---------- 提示词 ----------
const clip = (s, n) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);
const memLine = (m) => `${m.id}［${m.cat}${m.qtype ? "·" + m.qtype : ""}${m.kp ? "·" + m.kp : ""}${m.strength != null ? `·强度${(+m.strength).toFixed(2)}` : ""}］${clip(m.text, 60)}${m.evidence ? `（依据：${clip(m.evidence, 50)}）` : ""}`;
export const cleanMems = (xs) => (Array.isArray(xs) ? xs : []).slice(0, 80).map((m) => ({
    id: clip(m.id, 8), cat: clip(m.cat, 8), text: clip(m.text, 80), qtype: TYPES.includes(m.qtype) ? m.qtype : "", kp: clip(m.kp, 12),
    strength: m.strength == null || m.strength === "" ? null : Math.max(0, Math.min(1, +m.strength || 0)), evidence: clip(m.evidence, 60),
}));

// 老师设置（MAT-498，字段同 web/memory.js 的 SETTINGS）→ 给模型看的一行
const num = (v, lo, hi, d) => (Number.isFinite(+v) && v !== "" && v != null ? Math.max(lo, Math.min(hi, Math.round(+v))) : d);
const pick = (v, opts, d) => (opts.includes(v) ? v : d);
// lesson：这次课的分钟数（老师可以在第 2 步临时改），和平时不一样时两个都写，免得模型看到两个课时
export function settingsLine(st, lesson) {
    if (!st || typeof st !== "object") return "（没填）";
    const usual = num(st.minutes, 40, 240, 120);
    const lt = pick(st.lessonType === "小班" ? "一对多" : st.lessonType, ["一对一", "一对多"], "一对一"), dic = num(st.dictation, 0, 30, 0), rec = num(st.recap, 0, 30, 0), focus = num(st.focusTypes, 0, 6, 0), ext = extrasMinutes(st);
    return [
        `课型${lt}，一次课平时 ${usual} 分钟${lesson && lesson !== usual ? `（这次课 ${lesson} 分钟，以这次为准）` : ""}，每周 ${num(st.perWeek, 1, 7, 2)} 次`,
        dic || rec || ext ? `固定环节：${[dic && `开头单词默写 ${dic} 分钟`, ext && `${EXTRAS_NAME} ${ext} 分钟（内容系统已经挑好，环节名就叫「${EXTRAS_NAME}」，不练题型）`, rec && `结尾错题回顾 ${rec} 分钟`].filter(Boolean).join("、")}` : "没有固定环节",
        focus ? `一节课最多主攻 ${focus} 个题型` : "",
        `考前最后一节${pick(st.fullPaper, ["做", "不做"], "不做") === "做" ? "做整卷" : "不做整卷"}`,
        `作业不超过 ${num(st.homeworkMinutes, 0, 120, 30)} 分钟，${pick(st.homeworkScope, ["只练薄弱点", "全面练"], "只练薄弱点")}`,
    ].filter(Boolean).join("；");
}
// ---------- 课外知识补充（用户 10-29）----------
// 现成条目在 demo/extras.json（建库时拷到 api/_data/english/），每节课按用到的例题原文挑 2–3 条拼进大纲和教案，不调模型
const EXTRAS_NAME = "课外知识补充";
export const extrasMinutes = (st) => num(st?.extrasMinutes, 0, 20, 8);   // 老师设置，0 是不加
let EXTRAS = null;
function loadExtras() {
    if (EXTRAS) return EXTRAS;
    const d = JSON.parse(rd("extras.json"));
    for (const e of d.entries) {
        if (e.match) e.re = new RegExp(e.match);
        e.wre = (e.words || []).map((w) => [w, new RegExp(`(?<![a-z])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![a-z])`)]);
    }
    return (EXTRAS = d);
}
const OPT_LINE = /(^|\s)[A-D]\s*[.．、]\s*[A-Za-z]/;
// 一条在这节课的题里对上了什么：词根词缀看这个学生没学过的生词能不能拆；易混词看同一道题的选项里有没有两组以上；其余看原文里有没有这个词、话题对不对
function scoreExtra(e, docs) {
    const hits = [];
    let topic = null;
    for (const d of docs) {
        if (e.groups) {
            for (const o of d.opts) { const m = e.groups.map((g) => g.find((w) => o.has(w))).filter(Boolean); if (m.length >= 2) { hits.push({ code: d.code, w: m.join(" / ") }); break; } }
            continue;
        }
        const fw = e.re ? [...d.fresh].filter((t) => e.re.test(t)) : (e.words || []).filter((w) => d.fresh.has(w));   // 这个学生的生词（原形）
        const ws = e.re ? [...d.words].filter((t) => e.re.test(t)) : e.wre.filter(([, re]) => re.test(d.text)).map(([w]) => w);
        for (const w of [...fw, ...ws]) if (!hits.some((h) => h.w === w)) hits.push({ code: d.code, w, fresh: d.fresh.has(w) });
        if (!topic && e.topics && topicHit(d.it, e.topics)) topic = d.code;
    }
    const fresh = hits.filter((h) => h.fresh).length;
    let s = ["词根词缀", "构词法"].includes(e.cat) ? 2 * fresh + 0.25 * Math.min(4, hits.length - fresh)
        : e.groups ? (hits.length ? 2 : 0) : 1.5 * Math.min(2, hits.length) + 0.5 * fresh;
    if (topic) s += 1.5;
    return { s, hits: hits.sort((a, b) => !!b.fresh - !!a.fresh).slice(0, 4), topic };
}
export function pickExtras(items, gt) {
    const { how, entries } = loadExtras();
    const grade = GRADE_OF[String(gt)[0]] || 9, ok = entries.filter((e) => e.level <= grade);
    const docs = items.map((it) => {
        const text = it.text.toLowerCase().replace(/[’‘]/g, "'");
        return { it, code: it.code, text, words: new Set(text.match(/[a-z][a-z'-]*[a-z]/g)),
            opts: it.text.split("\n").filter((l) => OPT_LINE.test(l)).map((l) => new Set(l.toLowerCase().match(/[a-z]+/g))), fresh: new Set((it.diff?.words || []).map((x) => x.w)) };
    });
    const ranked = ok.map((e) => ({ e, ...scoreExtra(e, docs) })).filter((x) => x.s >= 1)
        .sort((a, b) => b.s - a.s || (b.e.freq || 0) - (a.e.freq || 0));
    const picked = [];
    for (const x of ranked) if (picked.length < 3 && !picked.some((y) => y.e.cat === x.e.cat)) picked.push(x);
    // 文章里对上的不到两条：从最常考的交际俗语里按天轮换补一条，免得每次课都是同一句
    if (picked.length < 2 && !picked.some((y) => y.e.cat === "谚语俗语")) {
        const pool = ok.filter((e) => e.kind === "交际").sort((a, b) => b.freq - a.freq).slice(0, 12);
        if (pool.length) picked.push({ e: pool[Math.floor(Date.now() / 864e5) % pool.length], hits: [], topic: null });
    }
    const show = ({ e, hits, topic }) => {
        const byCode = new Map();
        for (const h of hits) byCode.set(h.code, [...(byCode.get(h.code) || []), h.w]);
        const by = [...byCode].map(([c, ws]) => `${c} 的 ${ws.join("、")}`).join("；");
        const where = by ? "这节课 " + by : topic ? `和 ${topic} 的话题对得上` : "";
        const { re, wre, words, match, groups, topics, ...rest } = e;
        return { ...rest, how: how[e.cat], where, point: clip(`${e.cat}：${e.key}（${e.mean}）${where ? "｜" + where : e.src ? "｜真题：" + e.src : ""}`, 160) };
    };
    return { picked: picked.map(show), candidates: ranked.filter((x) => !picked.includes(x)).slice(0, 12).map(show) };
}
// 大纲里的「课外知识补充」：模型照老师设置排了就用它排的位置，没排就放在结尾那个不练题型的环节（错题回顾）前面；要点、分钟、条目以这里为准。
// 只有读模型输出时按名字找（只在不练题型的环节里找）；之后页面、写教案都按 extras 字段认，老师改了环节名也不受影响
export function withExtras(o, picked, minutes) {
    const mine = (x) => !x.type && x.name.includes("课外知识"), at = o.sections.findIndex(mine);
    o.sections = o.sections.filter((x) => !mine(x));
    if (picked.length) {
        const last = o.sections.at(-1);
        o.sections.splice(at >= 0 ? at : last && !last.type ? o.sections.length - 1 : o.sections.length, 0,
            { id: "", name: EXTRAS_NAME, minutes, type: "", items: [], points: picked.map((x) => x.point), extras: picked.map((x) => x.id) });
    }
    o.sections.forEach((x, i) => (x.id = `s${i + 1}`));
    return o;
}

export const ATTN = ["集中", "一般", "容易分心"];
const attnLine = (a) => (a === "容易分心" ? "注意力容易分散：环节要短、讲和练交替、多给看得见的引导" : ATTN.includes(a) ? `注意力${a}` : "");

// 课次记录：日期、当时教案的占比、讲了什么、错在哪
// 课次记录最多收 60 次（MAT-527 第 2 步：老的、和这节课相关的也要能挑出来）；err、covered 留给 pickLogs 打分
export const cleanLogs = (xs) => (Array.isArray(xs) ? xs : []).slice(-60).map((l) => {
    const es = (Array.isArray(l.errors) ? l.errors : []).slice(0, 6);
    return {
        date: clip(l.date, 10), summary: clip(l.summary, 80),
        mix: (Array.isArray(l.plan?.mix) ? l.plan.mix : []).slice(0, 10).map(([t, v]) => [clip(t, 10), Math.round(+v * 100) || 0]),
        errors: es.map((e) => `${clip(e.qtype, 10)}${e.kp ? "·" + clip(e.kp, 10) : ""}${e.note ? "：" + clip(e.note, 30) : ""}`),
        err: es.map((e) => [clip(e?.qtype, 10), clip(e?.kp, 12)]), covered: (Array.isArray(l.covered) ? l.covered : []).slice(0, 8).map((c) => clip(c, 12)),
    };
});
// 语义记忆按需注入（MAT-527 第 3 步）：档案超过 max 条时，排大纲、写教案、聊天只带和这节课相关的：
// 不分题型的（目标、状态、学习习惯、编排习惯、课堂结构……）全带；分题型的只带这节课要练的题型（薄弱点按强度排在前面）；其余照旧留在档案里。
// 记忆增删改（action=memory）照旧看全量，不然没法按编号改
export function pickMems(mems, mix = [], max = 30) {
    if (mems.length <= max) return mems;
    const types = new Set(mix.map((m) => m.type));
    const general = mems.filter((m) => !m.qtype), typed = mems.filter((m) => m.qtype && types.has(m.qtype)).sort((a, b) => (b.strength ?? 0) - (a.strength ?? 0));
    return [...general, ...typed].slice(0, max);
}
// 情景记忆按需取（MAT-527 第 2 步）：最近 2 次 + 和这节课的题型、薄弱考点最相关的 3 次（错在这个题型 2 分、考点也对上再 2 分、讲过这个题型 1 分；60 天减半），按日期排
export function pickLogs(logs, mix = [], today = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10)) {
    if (logs.length <= 5) return logs;
    const types = new Set(mix.map((m) => m.type)), kps = new Set(mix.flatMap((m) => m.kps || []));
    const score = (l) => {
        let s = 0;
        for (const [q, k] of l.err || []) { if (types.has(q)) s += 2; if (k && [...kps].some((x) => x.includes(k) || k.includes(x))) s += 2; }
        for (const c of l.covered || []) if ([...types].some((t) => c.includes(t) || t.includes(c))) s += 1;
        return s * Math.pow(0.5, Math.max(0, (Date.parse(today) - Date.parse(l.date)) / 864e5) / 60);
    };
    const top = logs.slice(0, -2).map((l) => ({ l, s: score(l) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 3).map((x) => ({ ...x.l, rel: true }));
    return [...top, ...logs.slice(-2)].sort((a, b) => a.date.localeCompare(b.date));
}
const logLines = (logs) => (logs || []).map((l) => `${l.date}${l.rel ? "（和这节课相关的旧课）" : ""}｜${l.summary}${l.mix.length ? `｜当时教案：${l.mix.map(([t, v]) => `${t}${v}%`).join("、")}` : ""}${l.errors.length ? `｜错在：${l.errors.join("；")}` : ""}`);

// 课后反馈（用户 10-29）：上完课发给家长的那段话。按档案（画像、进度、历史得分、记忆）、最近几次课、下一场考试、这节课的教案和老师写的情况来写，字数老师定。
// 一对多（用户 10-29）：一次给组里每个学生各写一段，共同的部分大体一样，各人的表现、薄弱点按各自的档案写，措辞也要有些变化
// 老师不打字（用户 10-29）：讲了哪些题型、作业、每人的表现都是点选的；反馈里各部分写多少（mix）、表扬和指问题各占多少（praise）由老师调
export const AFTER_PARTS = [["lesson", "这节课讲了什么"], ["perf", "课堂表现"], ["weak", "薄弱点和接下来怎么跟进"], ["hw", "课后作业和家长能配合的事"], ["exam", "离下一场考试还有多久、怎么准备"]];
const toneLine = (v) => (v >= 100 ? "只说做得好的地方，不提问题" : v <= 0 ? "直接说问题和怎么改，不写客套的表扬"
    : `表扬和指出问题的篇幅大约 ${v / 10}:${(100 - v) / 10}${v < 50 ? "，问题说具体、说清楚怎么改" : ""}`);
export function afterclassMessages(p) {
    const many = p.students.length > 1;
    // 一对多的格式按实际学生把每一项都列出来：只给一个元素的示例，模型多半照着只写第一个学生（2026-10-29 实测 6 次漏 5 次）
    const sys = `你是一位初中英语家教老师，上完课要给学生家长发课后反馈，在微信里直接发。按下面的资料写，只输出一个 JSON 对象：${many
        ? `{"items": [${p.students.map((x) => `{"name": "${x.name}", "text": "给${x.name}家长的反馈全文"}`).join(", ")}]}，${p.students.length} 个学生每人一段，一个都不能少`
        : `{"text": "反馈全文"}`}

要求：
1. ${many ? "每段" : "全文"}长度约 ${p.words} 字（不算空格换行），最多不超过 ${Math.round(p.words * 1.15)} 字，宁短勿长；字数少就少写几项，不要每项都塞。
2. 老师对家长的口吻：客气、具体、实在，不夸大、不制造焦虑；不用 Markdown、不加标题和表情，分 2–4 段。开头写「（学生的名字，两个字以上的名字去掉姓）家长您好」，正文提到学生用名字或「孩子」；性别不知道，不要用「他」「她」。
3. 各部分写多少按老师定的比例（按字数大约分，按这个顺序）：${p.mix.filter(([, v]) => v > 0).map(([n, v]) => `${n} ${v}%`).join("、")}。${p.mix.some(([, v]) => !v) ? `不写：${p.mix.filter(([, v]) => !v).map(([n]) => n).join("、")}。` : ""}哪部分资料里没有（比如老师没选表现、没选作业），那部分就不写，字数让给别的部分，不要编。
4. 语气：${toneLine(p.praise)}。
5. 只写资料里有的。这节课讲了什么、作业，只能来自【这节课】；这节课表现怎么样，只能来自${many ? "各人的" : ""}【这节课的表现】（老师点选的），老师没选的项不提，「有进步」「要加强」只说老师选的那几项，可以结合档案说具体一点。学生画像和记忆是平时的情况，要提就写成「平时……」，不能写成这节课的表现。分数、日期照资料写，不要自己算排名或提分预期。${many ? `
6. 这是一对多的课，${p.students.length} 个学生一起上：这节课讲的内容、作业、考试安排这些共同的部分大体一样；称呼、表现、薄弱点、跟进建议按各人的资料写，几段的措辞和句式要有些变化，不要只换个名字。一段里只写这一个学生，不提别的学生。` : ""}`;
    const one = (x, i) => [
        `【学生${many ? ` ${i + 1}` : ""}】${x.name}，${x.gradeLabel}，${x.schoolLabel}`,
        x.profile && `【平时的情况（学生画像，不是这节课的表现）】${x.profile}`,
        x.mems.length && `【档案里的记忆】\n${x.mems.map(memLine).join("\n")}`,
        x.logs.length && `【最近几次课】\n${x.logs.map((l) => `${l.date}：${l.summary}${l.errors.length ? `；错在 ${l.errors.join("、")}` : ""}`).join("\n")}`,
        `【这节课的表现${many ? "" : "（老师点选的）"}】${[...x.perf.items.map(([a, b]) => `${a}：${b}`), x.perf.good.length && `有进步：${x.perf.good.join("、")}`, x.perf.weak.length && `要加强：${x.perf.weak.join("、")}`].filter(Boolean).join("；")
            || "老师没选：不要写这节课表现怎么样。"}`,
    ].filter(Boolean).join("\n");
    const user = [
        ...p.students.map(one),
        p.exam && `【下一场考试】${p.exam}`,
        // 这节课的情况说清楚缺什么：只在规则里说「不要编」，模型照样会按进度编出一节课来
        `【这节课${many ? "（全组）" : ""}】${p.lesson.topics.length ? `讲了：${p.lesson.topics.join("、")}` : p.plan ? "" : "老师没选这节课讲了什么，也没有这节课的教案：不要写这节课的内容，从近况（进度、最近几次课、薄弱点）和接下来的安排写起。"}`
            + `${p.plan ? `${p.lesson.topics.length ? "\n" : ""}教案大纲：${p.plan}` : ""}`
            + `\n${p.lesson.hw.includes("没留作业") ? "这节课没留作业。" : p.lesson.hw.length ? `作业：${p.lesson.hw.join("、")}` : "老师没选作业：不要写作业内容。"}`,
    ].filter(Boolean).join("\n\n");
    return [{ role: "system", content: sys }, { role: "user", content: user }];
}

// 模型常写超：超了两成就让它压一次（目标定低一成，它数字数总是偏多）
export const hanCount = (t) => String(t).replace(/\s/g, "").length;
// 性别不知道：提示里说了不用他 / 她，模型偶尔还是会用，兜底换成「孩子」（其他、他们、她们这类不动）
export const noPronoun = (t) => String(t).replace(/(?<![其吉])[他她](?![们人])/g, "孩子");
export const shortenMessages = (text, words) => [{ role: "system", content: `下面这段给家长的课后反馈有 ${hanCount(text)} 字，太长了，要删到 ${Math.round(words * 0.9)} 字以内（不算空格换行）：删掉次要的句子、重复的意思和客套话，保留这节课讲了什么、表现、薄弱点、作业、考试安排里最要紧的，口吻和分段不变，不加新内容。只输出一个 JSON 对象：{"text": "删好的全文"}` }, { role: "user", content: text }];

export function reviewMessages(p) {
    const sys = `你是一位英语家教老师的 personal agent。根据这个学生最近几次课的记录（每次课的教案占比、讲了什么、错在哪）和档案，给下一次课的教案提改进建议。只输出一个 JSON 对象：

{"suggestions": [{"title": "一句话建议，20 字以内", "detail": "具体怎么改，60 字以内", "evidence": "依据哪次课的什么数据，50 字以内，写日期",
  "kind": "占比|讲法|作业|节奏|题源", "type": "相关题型或空字符串", "delta": 这个题型的占比调整（-0.15 到 0.15，不调占比就给 0）}],
 "gaps": "还缺什么数据才能判断得更准，40 字以内"}

规则：
- 只根据给出的记录说话，每条都要指回具体某次课的数据；记录不够就少给，宁缺毋滥，最多 4 条。
- 重点看：同一个薄弱点讲了几次还在错（该换讲法，不是只加时间）；花了时间但已经稳了的（可以减）；下一场考试要考、最近几次课却没覆盖的题型；老师反复手动调整的方向（可以变成默认）。
- type 只能从这些里选：${TYPES.join("、")}，或空字符串。`;
    const lines = [
        `【学生】${clip(p.student?.name, 10)}，${clip(p.student?.gradeLabel, 30)}，${clip(p.student?.schoolLabel, 40)}`,
        `【下一场考试】${clip(p.examLabel, 80)}`,
        `【系统建议的占比】${(Array.isArray(p.mix) ? p.mix : []).slice(0, 12).map((m) => `${clip(m.type, 10)} ${Math.round(+m.share * 100)}%`).join("、")}`,
        `【学生档案】\n${p.studentMems.map(memLine).join("\n") || "（空）"}`,
        `【老师档案】\n${p.teacherMems.map(memLine).join("\n") || "（空）"}`,
        `【老师设置】${settingsLine(p.settings)}`,
        p.weakKps ? `【薄弱知识点（按课次记录累计）】${clip(p.weakKps, 300)}` : "",
        `【最近的调整】${(Array.isArray(p.observations) ? p.observations : []).slice(-6).map((o) => clip(o, 80)).join("；") || "（无）"}`,
        `【课次记录】\n${logLines(p.logs).join("\n") || "（没有记录）"}`,
    ].filter(Boolean);
    return [{ role: "system", content: sys }, { role: "user", content: lines.join("\n") }];
}

// ---------- 大纲 → 教案 ----------
const FOUR = `四个依据都要用上，并且看得出来：
1. 年级：下一场考试的结构（考哪些题型、各多少分），九年级还要看中考趋势。
2. 学校：这场考试用谁的卷子（统考 / 校考）、本校本区的出题习惯。
3. 学生：学生档案里的薄弱点、学习习惯、状态。
4. 老师：老师档案里的讲题习惯、课堂结构、编排习惯、偏好，以及这次课的要求。
优先级：这次课的要求 > 老师档案 > 学生档案 > 考试结构。几条依据冲突时按优先级取舍，并说一句怎么取舍的。`;
const CITE = `- 关键设计后面用方括号标出依据：记忆编号如 [S2]、[T1]，考试结构标 [考]，学校标 [校]。只引用材料里有的编号，不编造学生情况。
- 学校这一维只说材料里写了的事实（出卷来源、库里有哪些卷子），不要推测学校的出题偏好；材料里没有本校卷子就直说。
- 不要把老师或学生带来的份额说成考试结构给的（【本次占比】里写了每个题型的份额来自哪一维）。
- 例题只用材料里给的题，按编号引用，例如「E3（东林中学 2024 九上期末）」。不要自己出题，不要抄题目原文。
- 标着「借自别的学期」的题，用到时说一句（「E5 借自八下，生词多一点，先扫词再做」）。`;
const diffText = (d) => (d ? `｜难度：${d.tier}${d.words.length ? `（这个学生没学过的词 ${d.words.length} 个：${d.words.slice(0, 5).map((x) => x.w).join("、")}）` : ""}` : "");
const itemLine = (it, n) => `${it.code}${it.hw ? "（作业用题）" : ""}［${it.type}］${it.school} ${it.year} ${it.gt}${it.kind}（${it.level}）${it.borrow ? `｜${it.borrow}` : ""}｜考点：${it.kp.join("、")}${it.topic ? "｜话题：" + it.topic : ""}${diffText(it.diff)}｜答案：${it.ans.filter(Boolean).join(" ")}\n题面：${clip(withImageText(it), n)}`;
function materials(p) {
    const st = p.student, at = attnLine(st.attention);
    return [
        `【学生】${clip(st.name, 10)}，${clip(st.gradeLabel, 30)}，${clip(st.schoolLabel, 40)}${at ? "；" + at : ""}`,
        st.group?.length ? `【一对多】这节课 ${st.group.length} 个学生一起上：${st.group.join("、")}。【学生档案】【薄弱知识点】是他们合起来的，记忆前面写着是谁的` : "",
        st.profile ? `【学生画像（老师拖光谱填的，0–100）】${clip(st.profile, 1500)}` : "",
        `【学生档案】\n${p.studentMems.map(memLine).join("\n") || "（空）"}`,
        p.weakKps ? `【薄弱知识点（按课次记录累计）】${clip(p.weakKps, 300)}` : "",
        `【老师档案】\n${p.teacherMems.map(memLine).join("\n") || "（空）"}`,
        `【老师设置】${settingsLine(p.settings, p.minutes)}`,
        `【前几次课】\n${logLines(p.logs).join("\n") || "（没有记录）"}`,
        `【这次课的要求】${clip(p.guidance, 300) || "（没有特别要求）"}`,
        `【下一场考试】${clip(p.exam.label, 80)}；出卷：${clip(p.exam.levelLabel, 120)}`,
        `【考试结构】${clip(p.exam.structure, 400)}`,
        `【学校】${clip(p.exam.school, 300)}`,
        `【本次占比】课时 ${p.minutes} 分钟。${p.mix.map((m) => `${m.type} ${Math.round(m.share * 100)}%（约 ${m.minutes} 分钟；来源：${clip(m.from, 60)}）`).join("；")}`,
        `【单元安排】${clip(p.unitPlan, 120)}`,
        p.lib?.length ? `【老师自己的教案（教案库里检索到的，和这节课相关）】\n${p.lib.map((c) => `《${c.doc}》「${c.title}」：${clip(c.text, 900)}`).join("\n")}` : "",
    ].filter(Boolean);
}
// 教案库检索到的块（MAT-542）：老师的讲法优先，但里面的练习不是这次的例题
const LIB_RULE = `- 【老师自己的教案】是这位老师以前写的、和这节课相关的几节：讲法、步骤、提问、口诀、板书照它来（老师自己的讲法优先于你想的），用到的地方写一句「照你《教案名》里的讲法」；里面的练习不是这次的例题，例题照样只用 E 编号的题。`;

// 第一步：排大纲（JSON），老师在页面上改完再写成教案
export function outlineMessages(p, items) {
    const sys = `你是无锡初中英语老师的备课助手。先给一次课（${p.student?.group?.length ? "一对多" : "一对一"}）排教案大纲，老师确认、修改以后再写成完整教案。

${FOUR}

只输出一个 JSON 对象：
{"title": "学生名 · 这次课的主题",
 "basis": {"年级": "一两句", "学校": "一两句", "学生": "一两句", "老师": "一两句"},
 "adjust": ["根据前几次课的调整，引用日期和数据，1–3 条；没有课次记录就给空数组"],
 "goals": ["教学目标，2–4 条"],
 "sections": [{"name": "环节名", "minutes": 分钟数, "type": "这个环节练的题型，默写、回顾这类环节写空字符串", "items": ["用到的例题编号"], "points": ["讲什么、怎么讲，2–4 条，每条一句"]}],
 "homework": ["课后作业，写题号"],
 "watch": ["下次课观察点，1–3 条"]}

规则：
- sections 按上课顺序排，分钟数加起来等于课时；各题型的分钟数大致按【本次占比】；【老师设置】里的固定环节（开头默写、课外知识补充、结尾回顾）按设置的分钟数排进去。
- 老师档案里的「编排习惯」（环节先后、常加的环节、哪部分多给时间、先练后讲还是先讲后练）是老师反复改出来的，排大纲照着排；和【这次课的要求】冲突时按这次的要求。
- 课后作业照【老师设置】的时长上限和范围留。${p.student?.attention === "容易分心" ? `
- 这个学生注意力容易分散：每个环节不超过 ${p.attentionMax} 分钟；讲和练交替，讲 5–8 分钟就让学生动手；每两个讲解环节之间插一个 3–5 分钟的动手小环节（圈线索词、画时间轴、抢答、配对），points 里写清楚怎么做。` : ""}
${p.student?.group?.length ? `- 这是一对多的课：几个人共同的薄弱点放进全组一起讲的环节；只有个别人有的问题，放进练习环节分层安排，points 里点名写清楚谁做哪道、先讲给谁；注意力按最需要照顾的那个学生安排；title 用组名。
` : ""}- 每道例题至少用在一个环节里；items 只能填材料里的 E 编号。标着「作业用题」的是课后作业用的同考点新题：不放进环节，课后作业写清楚做哪几道（「E12–E14 动词填空，每题画时间轴」）；作业里不要让学生重做课上讲过答案的题（作文按课上提纲重写可以）。
- points 要具体：这几道题考什么、这个学生容易错在哪（对照薄弱点）、照老师的讲题习惯怎么讲。
${p.lib?.length ? LIB_RULE + "\n" : ""}${CITE}
- type 只能从这些里选：${TYPES.join("、")}，或空字符串。
- 简体中文，不写空话。`;
    const lines = [...materials(p), `【例题和练习】`, ...items.map((it) => itemLine(it, 500))];
    return [{ role: "system", content: sys }, { role: "user", content: lines.join("\n") }];
}

// 模型给的大纲清洗一遍：编号、分钟、题型、题号都只认合法的
// infer：模型刚排的大纲才从要点里补用题；页面传回来的（老师改过的）不补，免得把老师删掉的题加回去
export function cleanOutline(o, codes, infer = false) {
    const arr = (x, n, m) => (Array.isArray(x) ? x : []).slice(0, n).map((v) => clip(v, m)).filter(Boolean);
    const ok = new Set(codes);
    // 模型给的用题常写成「E2（东林 2024）」「E3–E5」，只认里面的 E 编号；一个都没给就从要点里提到的编号补（MAT-484）。
    // 范围只认「E3–E5」「E3–5」「E3～E5」「E3-E5」：短横后面要跟 E，免得「E3 - 10 分钟」「E2-2024」被当成范围；倒序照样展开
    const eCodes = (v) => [...String(v).matchAll(/E(\d+)\s*(?:[–—~～]\s*E?|-\s*E)(\d+)|E(\d+)/g)].flatMap((m) => {
        if (m[3]) return [`E${m[3]}`];
        const [a, b] = [+m[1], +m[2]].sort((x, y) => x - y);
        return b - a > 10 ? [`E${m[1]}`] : Array.from({ length: b - a + 1 }, (_, k) => `E${a + k}`);
    });
    const pickCodes = (xs) => [...new Set(xs.flatMap(eCodes))].filter((c) => ok.has(c));
    const basis = o?.basis && typeof o.basis === "object" ? o.basis : {};
    return {
        title: clip(o?.title, 60),
        basis: Object.fromEntries(["年级", "学校", "学生", "老师"].map((k) => [k, clip(basis[k], 200)])),
        adjust: arr(o?.adjust, 4, 160), goals: arr(o?.goals, 5, 120), homework: arr(o?.homework, 6, 120), watch: arr(o?.watch, 4, 120),
        ...(Array.isArray(o?.changes) ? { changes: arr(o.changes, 6, 120).map((c) => c.replace(/[。；;，,]+$/, "")) } : {}),   // 改写、融合：和原教案比改了什么（MAT-542），页面用「；」连起来
        sections: (Array.isArray(o?.sections) ? o.sections : []).slice(0, 14).map((x, i) => {
            const points = arr(x?.points, 6, 160), items = pickCodes(Array.isArray(x?.items) ? x.items : []);
            return { id: `s${i + 1}`, name: clip(x?.name, 30) || `环节 ${i + 1}`, minutes: Math.max(0, Math.min(240, Math.round(+x?.minutes || 0))),
                type: TYPES.includes(x?.type) ? x.type : "", items: items.length || !infer ? items : pickCodes(points), points,
                ...(Array.isArray(x?.extras) ? { extras: arr(x.extras, 6, 40) } : {}), ...(x?.from ? { from: clip(x.from, 12) } : {}) };   // from：来自哪份原教案
        }),
    };
}
// 注意力容易分散的学生：超过 max 分钟的环节拆成几段（「环节名（续）」），用题和要点按顺序分过去，总分钟数不变
// 分钟均分（前几段多 1 分钟），每段都不超过 max；默写、回顾这类不练题型的环节是老师设置的，不拆
export function splitLong(o, max) {
    const out = [];
    for (const x of o.sections) {
        const k = Math.ceil(x.minutes / max);
        if (k <= 1 || !x.type) { out.push(x); continue; }
        const per = (arr, i) => arr.filter((_, j) => Math.floor(j * k / arr.length) === i);
        const base = Math.floor(x.minutes / k), extra = x.minutes - base * k;
        for (let i = 0; i < k; i++) {
            const pts = per(x.points, i);
            out.push({ ...x, name: i ? `${x.name}（续）`.slice(0, 30) : x.name, minutes: base + (i < extra ? 1 : 0), items: per(x.items, i),
                points: pts.length ? pts : ["接着上一段的题，学生自己做，老师看着纠错"] });
        }
    }
    o.sections = out.map((x, i) => ({ ...x, id: `s${i + 1}` }));
    return o;
}
// 模型排的分钟数加起来常常不等于课时：差额按比例分到练题的环节上（默写、回顾这类固定环节不动）
export function fitMinutes(o, minutes) {
    const typed = o.sections.filter((x) => x.type && x.minutes > 0);
    const tot = o.sections.reduce((a, x) => a + x.minutes, 0), base = typed.reduce((a, x) => a + x.minutes, 0);
    if (!base || tot === minutes) return o;
    let left = minutes - tot;
    const share = left;
    for (const x of typed) { const d = Math.round(share * x.minutes / base); x.minutes = Math.max(1, x.minutes + d); left -= d; }
    typed.sort((a, b) => b.minutes - a.minutes)[0].minutes += left;   // 取整剩下的给最长的环节
    return o;
}
export function outlineText(o) {
    return [
        `标题：${o.title}`,
        `依据：${Object.entries(o.basis || {}).map(([k, v]) => `${k}：${v}`).join("；")}`,
        `根据前几次课的调整：${(o.adjust || []).join("；") || "（无）"}`,
        `教学目标：${(o.goals || []).join("；")}`,
        o.changes?.length ? `和原教案比：${o.changes.join("；")}` : "",
        `环节：`,
        ...(o.sections || []).map((x, i) => `${i + 1}. [${x.id}] ${x.name}（${x.minutes} 分钟${x.type ? "，" + x.type : ""}${x.items.length ? "；用题 " + x.items.join("、") : ""}${x.from ? "；来自原教案 " + x.from : ""}）${x.points.map((t) => "\n   - " + t).join("")}`),
        `课后作业：${(o.homework || []).join("；")}`,
        `下次课观察点：${(o.watch || []).join("；")}`,
    ].filter((l) => l !== "").join("\n");
}

// 教案模板（MAT-502）：一组有顺序的小节。kind：basis 四维依据 / flow 课堂流程（简要的环节顺序）/ types 分题型讲解（每个带题型的环节一个 ### 小节）/ text 普通
// 内置模板在 demo/rules.json 的 planTemplates，老师自建的存在浏览器里；页面把整个模板传过来，这里只认合法的字段
const KINDS = ["basis", "flow", "types", "text"];
export function cleanTemplate(t) {
    const used = new Set();   // 四维依据、流程表、分题型讲解各只能有一节，多出来的当普通小节
    const secs = (Array.isArray(t?.sections) ? t.sections : []).slice(0, 10).map((x) => ({ title: clip(x?.title, 16).replace(/[#\n]/g, ""), kind: KINDS.includes(x?.kind) ? x.kind : "text", hint: clip(x?.hint, 80) }))
        .filter((x) => x.title).map((x) => { if (x.kind !== "text" && used.has(x.kind)) x.kind = "text"; used.add(x.kind); return x; });
    if (!t || typeof t !== "object") return null;
    const free = !!t.free || !secs.length;   // 一节都没定的模板就是自由结构（复制「自由结构」后取消「不定小节」也一样）
    return { name: clip(t.name, 16), sections: secs, length: t.length === "short" ? "short" : "normal", visual: !!t.visual, free };
}
const KIND_RULE = {
    basis: "四行，分别以「**年级**」「**学校**」「**学生**」「**老师**」开头，照大纲的依据写",
    // 用户 10-29：课堂流程只起大致的框架提醒作用，不决定课堂走向（真正决定的是教案的内容编排）；不要框死、写细，篇幅不用多
    flow: "只是大致的框架提醒，不决定课堂怎么走：用一行把环节按顺序连起来，写成「开头默写（约 10 分钟）→ 完形填空（约 15 分钟）→ ……」，只写环节名和大约分钟，不写做什么、不写题号、不写时间区间；下面另起一行写一句：课上怎么走以后面各节的内容编排为准，按学生状态随时调整。整节不超过 3 行",
    types: "大纲里每个带题型的环节一个 ### 小节，标题写「环节名（N 分钟）」",
};
const DEFAULT_TEMPLATE = { sections: [
    { title: "设计依据", kind: "basis", hint: "" }, { title: "根据前几次课的调整", kind: "text", hint: "照大纲；没有就写「第一次课，没有记录」" },
    { title: "教学目标", kind: "text", hint: "" }, { title: "课堂流程", kind: "flow", hint: "" }, { title: "分题型讲解", kind: "types", hint: "" },
    { title: "课后作业", kind: "text", hint: "" }, { title: "下次课观察点", kind: "text", hint: "" }], length: "normal", visual: false };
const templateLines = (t) => t.sections.map((x) => { const r = [KIND_RULE[x.kind], x.hint].filter(Boolean).join("；"); return `## ${x.title}${r ? `（${r}）` : ""}`; }).join("\n");
// 彩色视觉版（注意力容易分散的学生，或者老师选了彩色模板）：页面和 Word 会把 ==词== 画成高亮，题型按颜色区分
export const VISUAL_RULES = `- 这是彩色视觉版，给注意力容易分散的学生用：线索词、关键词、易错点用 ==词== 标出来（每节 3–6 处，只标英文单词或短语、中文关键词，别标整句）；
  每个讲解环节开头单独一行「🎯 这 N 分钟：……」写一个看得见的小目标；解题步骤写成 ①②③；时态题加一行时间轴（用 → 连起几个时间点）。`;

// 第二步：按老师确认过的大纲写完整教案（Markdown，流式）。用户 10-29：教案的内容怎么编排是绝对的核心，课堂流程只是框架提醒
export function planMessages(p, items) {
    const tpl = p.template || DEFAULT_TEMPLATE, extrasSec = p.outline.sections.find((x) => x.extras?.length);
    const sys = `你是无锡初中英语老师的备课助手，按老师确认、修改过的大纲把一次课的教案写完整。

${FOUR}

规则：
- 严格按大纲：环节、顺序、分钟数、用题都不改；大纲里每条要点都要写到，展开成具体的讲法。大纲是老师改过的，和档案不一致时以大纲为准。
- 大纲里的依据、目标是排大纲时写的，老师之后可能改过环节和分钟：说到分钟数、占比，一律以大纲环节里的分钟数为准，不要照抄依据里的旧数字。
${tpl.sections.some((x) => x.kind === "basis") ? `- 「${tpl.sections.find((x) => x.kind === "basis").title}」写每一维怎么影响了这节课，不要解释占比是怎么算出来的，也不要写来源百分比。几条依据真有冲突时才加一句怎么取舍的，没有冲突就不写。
` : ""}- 教案是给老师上课用的：不要在里面复述这些写作规则（比如「不照抄」「不推测」「以大纲为准」）。
${extrasSec ? `- 大纲里「${extrasSec.name}」这一环节的讲解由系统直接拼进教案：课堂流程里照常列这一行，但不要为它写讲解小节，也不要在别处展开这些条目。
` : ""}${p.sources?.length ? SOURCE_RULE(p.sources.length) + "\n" : ""}${p.lib?.length ? LIB_RULE + "\n" : ""}${CITE}
- 教案的核心是讲解各节的内容编排：每一节写清楚内容怎么排：先讲什么、例题按什么顺序用、为什么这样排、哪里让学生先做、哪里停下来讲、怎么接到下一节；再写这几道题考什么、这个学生容易错在哪、照老师的讲题习惯怎么讲。老师档案里的编排习惯和关于课堂结构、讲题顺序的记忆，优先照着排。${p.student?.group?.length ? "\n- 这是一对多的课：写清楚哪些是全组一起讲的、哪些分给谁单独练，学生容易错在哪按人点名写。" : ""}
${tpl.sections.length && !tpl.free ? `- 用 Markdown，照老师选的教案模板${tpl.name ? `「${tpl.name}」` : ""}，二级标题就用下面这些、按这个顺序，不多不少：
# 标题（用大纲的标题）
${templateLines(tpl)}` : `- 用 Markdown，结构不限：按大纲和这节课的需要自己组织，第一行 # 标题（用大纲的标题），每一部分用 ## 二级标题分开${tpl.sections.length ? `；可以参考这些小节，但不必照搬：${tpl.sections.map((x) => x.title).join("、")}` : ""}。`}
${p.planNote ? `- 老师对这份教案的要求（优先照这个来，和上面冲突时以这里为准）：${p.planNote}\n` : ""}${p.visual ? VISUAL_RULES + "\n" : ""}- 简体中文，具体，不写空话套话，全文 ${tpl.length === "short" ? "500–900" : "1000–1800"} 字。`;
    const lines = [...materials(p), `【大纲（老师确认过）】\n${outlineText(p.outline)}`, ...sourceLines(p.sources || []), `【例题和练习】`,
        ...items.map((it) => `${itemLine(it, 900)}\n解析要点：${clip(it.explain.replace(/【[^】]*】/g, " "), 200)}`)];
    return [{ role: "system", content: sys }, { role: "user", content: lines.join("\n") }];
}

// ---------- 聊天：老师在右下角和 agent 商量，agent 回话并给出修改 ----------
const CHAT_OPS = {
    setup: `- {"op":"set_share","type":"题型","share":0 到 0.6} 调这个题型的占比，其他题型按比例让出；老师说「某题型专题」「这节只练某题型」就把它调到 0.6
- {"op":"set_guidance","text":"这次课的要求"} 改写「这次课的要求」（整段替换）
- {"op":"set_level","level":"统考|不统考|不知道"} 这场考试用谁的卷子
- {"op":"set_kind","kind":"单元|月考/阶段|期中|期末|中考模拟|中考"} 下一场考试的类型`,
    outline: `- {"op":"set_minutes","sec":"环节编号，如 s2","minutes":分钟}
- {"op":"edit_section","sec":"环节编号","name":"新名字（可省）","type":"题型（可省）","points":["新的要点，整组替换（可省）"]}
- {"op":"add_section","after":"插在哪个环节后面，放最前面就写空字符串","name":"","minutes":0,"type":"","items":[],"points":[]}
- {"op":"remove_section","sec":"环节编号"}
- {"op":"move_section","sec":"环节编号","after":"移到哪个环节后面，放最前面就写空字符串"}
- {"op":"set_items","sec":"环节编号","items":["E1","E3"]} 这个环节用哪几道题，整组替换
- {"op":"find_items","sec":"环节编号","type":"题型","query":"要找什么样的题，比如「环保话题的阅读，考推理判断」","n":1 到 3} 从题库再找题，找到的自动加进这个环节
- {"op":"edit_meta","field":"title|goals|homework|watch|adjust","value":"title 给字符串，其他给字符串数组（整组替换）"}`,
    plan: `- {"op":"replace_section","title":"要替换的那一节的标题行原文，比如「### 阅读理解（30 分钟）」「## 课后作业」","md":"整节新内容，第一行就是标题行"}
- {"op":"find_items","type":"题型","query":"要找什么样的题","n":1 到 3} 从题库再找题；找到以后系统会把新题号告诉你，你再用 replace_section 写进去`,
};
export const CHAT_OP_NAMES = {
    setup: ["set_share", "set_guidance", "set_level", "set_kind"],
    outline: ["set_minutes", "edit_section", "add_section", "remove_section", "move_section", "set_items", "find_items", "edit_meta"],
    plan: ["replace_section", "find_items"],
};
export function chatMessages(p) {
    const what = { setup: "这节课的设置（下一场考试、出卷来源、各题型占比、这次课的要求）", outline: "教案大纲", plan: "教案" }[p.stage];
    const sys = `你是英语家教老师的备课 agent，正在和老师一起改${what}。根据老师的话回复；要改的，同时给出修改。只输出一个 JSON 对象：
{"reply": "给老师的回复，口语、简短（150 字以内），说清改了什么、为什么，或者直接回答问题",
 "ops": [修改，没有就给空数组],
 "memory": [要写进长期记忆的，没有就给空数组]}

能用的修改：
${CHAT_OPS[p.stage]}

memory 的格式：{"op":"add|update|delete","who":"teacher|student","id":"update / delete 时填已有编号","cat":"分类","text":"30 字以内","qtype":"","kp":"","strength":null,"evidence":"依据，40 字以内","why":"30 字以内"}。分类：学生用 薄弱点 / 已掌握 / 学习习惯 / 状态 / 目标；老师用 讲题习惯 / 课堂结构 / 编排习惯（一节课怎么排：环节先后、先练后讲还是先讲后练、常加什么环节）/ 偏好。只有老师说了以后还用得上的话（「以后都…」「我习惯…」「这个学生其实…」）才写 memory，一次性的要求不写。
${SET_OPS}

规则：
- 老师只是提问就只回答，ops 给空数组；要改才给 ops，改动要和 reply 里说的一致，没做的事不要说做了。reply 里说环节名，不说 s2 这种编号。
- 用 find_items 找新题时，这一轮还不知道新题号，reply 里说「先去题库找」就行；找到以后系统会再告诉你新题号，那时再换掉旧题。
- 改分钟数时，各环节加起来要等于课时；需要的话同时调别的环节，并在 reply 里说。
- 例题只能用材料里已有的 E 编号；要新题就用 find_items，不要编题。
- 写教案正文的规则照旧：关键设计标依据 [S2]、[T1]、[考]、[校]，例题按编号引用，不抄题目原文。${p.visual ? "\n" + VISUAL_RULES : ""}
- 题型只能从这些里选：${TYPES.join("、")}。`;
    const st = p.student, at = attnLine(st.attention);
    const lines = [
        `【学生】${clip(st.name, 10)}，${clip(st.gradeLabel, 30)}，${clip(st.schoolLabel, 40)}`,
        st.profile ? `【学生画像（老师拖光谱填的，0–100）】${clip(st.profile, 1500)}` : "",
        `【学生档案】\n${p.studentMems.map(memLine).join("\n") || "（空）"}`,
        `【老师档案】\n${p.teacherMems.map(memLine).join("\n") || "（空）"}`,
        `【老师设置】${settingsLine(p.settings, p.minutes)}${at ? "\n【学生特点】" + at : ""}`,
        `【下一场考试】${clip(p.examLabel, 80)}；课时 ${p.minutes} 分钟`,
        `【当前占比】${(Array.isArray(p.mix) ? p.mix : []).slice(0, 14).map((m) => `${clip(m.type, 10)} ${Math.round(+m.share * 100)}%`).join("、") || "（无）"}`,
        `【这次课的要求】${clip(p.guidance, 300) || "（没有）"}`,
        p.stage === "outline" ? `【当前大纲】\n${outlineText(p.outline)}` : "",
        p.stage === "plan" ? `【当前教案】\n${String(p.plan || "").slice(0, 6000)}` : "",
        p.items.length ? `【例题和练习】\n${p.items.map((it) => itemLine(it, 220)).join("\n")}` : "",
        `【最近的对话】\n${(Array.isArray(p.history) ? p.history : []).slice(-8).map((m) => `${m.role === "user" ? "老师" : "你"}：${clip(m.content, 400)}`).join("\n") || "（刚开始）"}`,
        `【老师刚说】${clip(p.message, 600)}`,
    ].filter(Boolean);
    return [{ role: "system", content: sys }, { role: "user", content: lines.join("\n") }];
}

// 改教案里的一节：老师写一句要求（或换了例题），只重写这一节
export function sectionMessages(p) {
    const sys = `你在帮老师改一份英语教案里的一节。只输出改好的这一节 Markdown：第一行原样保留这一节的标题行，后面是新的内容；不要输出别的节，不要加说明。
规则和写整份教案时一样：关键设计后面用方括号标依据（[S2]、[T1]、[考]、[校]），只引用材料里有的编号；例题只用材料里给的 E 编号，不自己出题、不抄题目原文；简体中文，具体，不写空话。
老师这次的修改要求优先；没有提到的地方尽量保持原样，篇幅和原来差不多。${p.planNote ? `\n老师对整份教案的要求：${p.planNote}` : ""}${p.visual ? "\n" + VISUAL_RULES : ""}`;
    const lines = [
        `【学生】${clip(p.student?.name, 10)}，${clip(p.student?.gradeLabel, 30)}`,
        `【学生档案】\n${p.studentMems.map(memLine).join("\n") || "（空）"}`,
        `【老师档案】\n${p.teacherMems.map(memLine).join("\n") || "（空）"}`,
        `【整份教案（供参照，别改别的节）】\n${clip(p.plan, 3500)}`,
        `【例题和练习】`,
        ...p.items.map((it) => itemLine(it, p.focus.includes(it.code) ? 900 : 160)),
        `【要改的这一节】\n${String(p.section || "").slice(0, 3000)}`,
        `【老师的修改要求】${clip(p.instruction, 200)}`,
    ];
    return [{ role: "system", content: sys }, { role: "user", content: lines.join("\n") }];
}

// 改老师设置、学生注意力的 op（记忆和聊天共用）
const SET_OPS = `另外两种改法：老师说到课堂设置的长期变化（「以后一次课 90 分钟」「默写改成 15 分钟」「作业别超过 20 分钟」），用 {"op":"set","who":"teacher","field":"字段","value":值,"why":"30 字以内"} 改【老师设置】，不要再写成一条老师记忆。字段：lessonType（一对一 / 一对多）、minutes（一次课分钟）、perWeek（每周几次）、dictation（开头默写分钟）、recap（结尾回顾分钟）、extrasMinutes（课外知识补充分钟，0 是不加）、focusTypes（一节课主攻几个题型，0 / 2 / 3 / 4，0 是不限）、fullPaper（考前最后一节做 / 不做整卷）、homeworkMinutes（作业分钟上限）、homeworkScope（只练薄弱点 / 全面练）、difficulty（不限 / 偏易 / 适中 / 偏难）。
说到学生走神、坐不住、注意力不集中，用 {"op":"set","who":"student","field":"attention","value":"容易分心","why":""}；说到现在能坐住了、很专注，改成「一般」或「集中」。`;

// 心跳整理（MAT-527 第 4 步）：定期把档案理一遍，只做三件事：合并重复、以新的为准解决矛盾、把老师反复说的编排要求提炼成「编排习惯」。
// 输出和 memoryMessages 同一种 ops，页面 / 微信端用 applyOps 落地，每条都能撤销
export function tidyMessages(p) {
    const sys = `你在给一位英语家教老师整理长期记忆：老师档案（编号 T 开头）${p.studentMems.length ? "和一个学生的档案（编号 S 开头）" : ""}。只做这三件事，只输出一个 JSON 对象：
{"ops": [{"op": "update|delete|add", "who": "teacher|student", "id": "update / delete 时填已有编号", "cat": "分类", "text": "30 字以内", "qtype": "", "kp": "", "strength": null, "evidence": "40 字以内", "why": "30 字以内"}], "note": "一句话说这次整理了什么，没整理就写「没有要整理的」"}

1. 意思重复的几条合并：update 留下的那条（措辞合并、依据合并），delete 其余的；why 写「和 Tx 重复，合并」
2. 前后矛盾的以新的为准（看依据里的日期、【老师最近的调整】）：update 或 delete 旧的，why 写清楚
3. 【老师在大纲 / 教案阶段说过的编排要求】里同一类意思出现 3 次以上（不同日子），又不在老师档案里的：add 一条老师「编排习惯」（一节课怎么排：环节先后、先练后讲还是先讲后练、常加什么环节），evidence 写哪几天说过
不要改写本来就好好的记忆，不要新增没有依据的内容；薄弱点的强度不要动。没有要整理的，ops 给空数组。`;
    const lines = [
        `【今天】${clip(p.date, 10)}`,
        p.studentMems.length ? `【学生】${clip(p.student?.name, 10)}\n【学生档案】\n${p.studentMems.map(memLine).join("\n")}` : "",
        `【老师档案】\n${p.teacherMems.map(memLine).join("\n") || "（空）"}`,
        `【老师最近的调整】${(p.observations || []).join("；") || "（没有）"}`,
        `【老师在大纲 / 教案阶段说过的编排要求】\n${(p.says || []).join("\n") || "（没有）"}`,
    ].filter(Boolean);
    return [{ role: "system", content: sys }, { role: "user", content: lines.join("\n") }];
}
export function memoryMessages(p, kpByType) {
    const sys = `你是一位英语家教老师的 personal agent，替老师维护两份长期记忆：老师档案（编号 T 开头）和当前学生的档案（编号 S 开头）。
老师刚交给你一条记录（课后记录、随口交代、对教案的反馈）。把它变成对记忆的增删改，只输出一个 JSON 对象：

{"ops": [{"op": "add|update|delete", "who": "student|teacher", "id": "update / delete 时填已有编号，add 不填",
  "cat": "分类", "text": "这条记忆本身，一句话，30 字以内", "qtype": "题型或空字符串", "kp": "考点或空字符串",
  "strength": 0 到 1 的数或 null, "evidence": "从记录里摘的依据，40 字以内", "why": "为什么这样改，30 字以内"}],
 "log": {"summary": "这条记录一句话总结", "covered": ["讲了什么"], "errors": [{"qtype": "", "kp": "", "note": ""}]}}

分类：学生用 薄弱点 / 已掌握 / 学习习惯 / 状态 / 目标；老师用 讲题习惯 / 课堂结构 / 编排习惯（一节课怎么排：环节先后、先练后讲还是先讲后练、常加什么环节）/ 偏好。

规则：
1. 只把以后还用得上的写进记忆：学生稳定的弱项、习惯、目标；老师明确说「以后都…」「我习惯…」「别再…」的做法，或者【最近的调整】里反复出现的同一方向。一次性的事只写进 log。
2. 先对照已有记忆：同一件事用 update（合并措辞、调 strength），不要重复 add；新信息和旧记忆矛盾时 update 或 delete 旧的，why 里说清楚。
3. 薄弱点的 strength 表示有多薄弱：第一次出现给 0.5；这次又错了在原值上加 0.15–0.25；这次做对了、有进步就往下调 0.2–0.3，但只做好一次不要删。老师说已经掌握，或者这条薄弱点的依据里已经记过一次做好、这次又做好了，才 delete 它，并 add 一条「已掌握」。其他分类 strength 给 null。
4. qtype 只能从这些里选：${TYPES.join("、")}，或空字符串。kp（ops 和 log.errors 里都一样）必须从这个题型的考点表里选，表里都不合适才写新的：${Object.entries(kpByType).map(([t, ks]) => `${t}：${ks.join("、")}`).join("；")}。
5. 对这一份教案的一次性意见（比如「这次阅读太多了」）只进 log；但如果和【最近的调整】方向一致、已经出现两次以上，就当作老师的偏好写进老师档案。
6. 记录里没提到的不要编；没有要改的，ops 给空数组。
7. ${SET_OPS}`;
    const lines = [
        `【今天】${clip(p.date, 10)}`,
        `【学生】${clip(p.student?.name, 10)}，${clip(p.student?.gradeLabel, 30)}${ATTN.includes(p.student?.attention) ? `；注意力：${p.student.attention}` : ""}`,
        `【学生档案】\n${p.studentMems.map(memLine).join("\n") || "（空）"}`,
        `【老师档案】\n${p.teacherMems.map(memLine).join("\n") || "（空）"}`,
        `【老师设置】${settingsLine(p.settings)}`,
        `【最近的调整】${(Array.isArray(p.observations) ? p.observations : []).slice(-6).map((o) => clip(o, 80)).join("；") || "（无）"}`,
        `【这条记录】${clip(p.text, 1000)}`,
    ];
    return [{ role: "system", content: sys }, { role: "user", content: lines.join("\n") }];
}

// 老师上传一份自己写的 Word 教案（页面用 mammoth 抽出文字），抽出小节结构做成模板
export function templateMessages(text) {
    const sys = `老师上传了一份自己以前写的英语教案，把它的小节结构抽出来，做成以后生成教案用的模板。只输出一个 JSON 对象：
{"name": "模板名，8 字以内，比如「机构格式」", "sections": [{"title": "小节标题，原文的说法，12 字以内", "kind": "basis|flow|types|text", "hint": "这一节写什么，从原教案里看出来的写法要求，40 字以内"}]}
kind：教学过程、课堂流程这类按时间排环节的表格写 flow；按题型 / 环节逐个展开讲解的写 types；「设计依据」「学情分析」这类说明为什么这样设计的写 basis（最多一节）；教学目标、重难点、板书、作业、反思等其他小节一律写 text。flow、types、basis 各最多一节。
按原教案的顺序，最多 10 节；只要结构，不要抄原教案的具体内容。教案标题本身不算一节。`;
    return [{ role: "system", content: sys }, { role: "user", content: String(text).slice(0, 4000) }];   // 不用 clip：要留着换行，模型才看得出标题和表格行
}

// ---------- 教案库（MAT-542，用户 10-30「相当于是一个动态的知识库了，用户上传的教案之后能融入到原有的基础的rag知识库里」）----------
// 老师上传的教案（Word / 文本，页面和微信端先抽成文字）按小节切块，模型给每块标题型、考点，bge-m3 算向量（int8，同题库），整份交回去存进老师自己的工作区（S.library）。
// 之后排大纲时页面把教案库的块带上来，和题库一起检索（libRetrieve），挑中的几节进大纲和教案的提示词；改写、融合（adapt）也从这里取原教案。
// 教案库只在老师自己的账号里，不进公共题库（别人的教案有版权，也常带学生的名字）
const HEADS = [/^【.{1,30}】$/, /^#{1,4}\s+\S/, /^[一二三四五六七八九十]{1,3}\s*[、.．]\s*\S/, /^[（(][一二三四五六七八九十]{1,3}[)）]\s*\S/, /^(step|part)\s*\d+/i, /^第[一二三四五六七八九十\d]{1,3}(部分|环节|步|课时|阶段)/,
    /^(教学目标|教学重点|教学难点|教学重难点|重难点|学情分析|教材分析|教学准备|教学过程|课堂流程|教学流程|课后作业|作业布置|板书设计|教学反思|课堂小结|导入|热身|新授|巩固练习|拓展延伸|warm[- ]?up|lead[- ]?in|presentation|practice|production|homework|summary)[：:]?$/i];
const isHead = (l) => l.length <= 32 && HEADS.some((re) => re.test(l));
// 保留换行的清洗（clip 会把换行压掉，原教案要留着段落和表格行）
export const cleanText = (t, n) => String(t ?? "").replace(/\r/g, "").replace(/[ \t　]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, n);
// 按小节标题切块：只有标题的块并进下一块（「教学过程」+「Step 1」→「教学过程 · Step 1」）；超过 1400 字的按行切开（「（续）」）；一份最多 24 块
export function splitPlan(text) {
    const secs = [];
    let cur = { title: "", text: "" };
    const push = () => { if (cur.title || cur.text.trim()) secs.push({ title: cur.title, text: cur.text.trim() }); };
    for (const l of cleanText(text, 20000).split("\n").flatMap((l) => l.match(/[^]{1,1000}/g) || [""])) {
        const t = l.trim();
        if (isHead(t)) { push(); cur = { title: t.replace(/^#+\s*|^【|】$/g, "").replace(/[：:]$/, "").slice(0, 30), text: "" }; }
        else cur.text += l + "\n";
    }
    push();
    const merged = [];
    for (const s of secs) {
        const p = merged.at(-1);
        if (p && !p.text) Object.assign(p, { title: [p.title, s.title].filter(Boolean).join(" · ").slice(0, 30), text: s.text });
        else merged.push({ ...s });
    }
    const out = [];
    for (const s of merged) {
        if (s.text.length <= 1400) { out.push(s); continue; }
        let part = "", k = 0;
        const title = () => (s.title && k++ ? `${s.title}（续）` : s.title);   // 没标题的整段长文：留空，下面按「第 N 段」编
        for (const l of s.text.split("\n")) {
            if (part && part.length + l.length > 1000) { out.push({ title: title(), text: part.trim() }); part = ""; }
            part += l + "\n";
        }
        if (part.trim()) out.push({ title: title(), text: part.trim() });
    }
    while (out.length > 24) {   // 块太多：相邻两块加起来最短的合并
        let i = 0;
        for (let k = 1; k < out.length - 1; k++) if (out[k].text.length + out[k + 1].text.length < out[i].text.length + out[i + 1].text.length) i = k;
        out.splice(i, 2, { title: out[i].title, text: `${out[i].text}\n${out[i + 1].title}\n${out[i + 1].text}` });
    }
    return out.filter((s) => s.text).map((s, i) => ({ title: s.title || (i ? `第 ${i + 1} 段` : "开头"), text: s.text }));
}
export function ingestMessages(name, chunks) {
    const sys = `老师把自己的一份英语教案存进教案库，以后备课时按题型、考点检索出来参照。读下面切好的各块（编号、标题、开头一段），只输出一个 JSON 对象：
{"name": "这份教案的简称，12 字以内（有文件名就参照文件名）", "gt": "七上|七下|八上|八下|九上|九下，看不出就给空字符串", "summary": "一句话：这份教案讲什么、给什么样的学生、多长时间，40 字以内", "topics": ["讲的话题或语法点，最多 5 个"], "chunks": [{"i": 编号, "types": ["这一块讲或练的题型"], "kps": ["考点，最多 3 个，比如「现在完成时」「推理判断」"]}]}
types 只能从这些里选：${TYPES.join("、")}；导入、目标、作业、反思这类不讲题型的块给空数组。老师说「阅读」就是阅读理解，「完形」是完形填空，「作文」是书面表达，「时态」多半是动词填空。`;
    const user = [`【文件名】${clip(name, 40) || "（没给）"}`, "【各块】", ...chunks.map((c, i) => `#${i} 「${c.title}」${clip(c.text, 400)}`)].join("\n");
    return [{ role: "system", content: sys }, { role: "user", content: user }];
}
const GTS = ["七上", "七下", "八上", "八下", "九上", "九下"];
// int8 量化（同 demo/build.mjs）：存 base64 和一个缩放系数，一块 1.4 KB
const quant = (v) => { let mx = 1e-9; for (const x of v) mx = Math.max(mx, Math.abs(x)); const s = mx / 127; return { v: Buffer.from(Int8Array.from(v, (x) => Math.round(x / s)).buffer).toString("base64"), s }; };
const unquant = (c) => { const b = Buffer.from(String(c.v || ""), "base64"); return b.length === DIMS && Number.isFinite(+c.s) ? new Int8Array(b.buffer, b.byteOffset, DIMS) : null; };
// 每块带上整份的简介：「Step 3 讲解三步法」里没有「完形」两个字，光看这一块认不出是讲完形的
const chunkText = (c, sum) => `${sum}｜${c.title}｜${c.types.join("、")}｜${c.kps.join("、")}\n${c.text.slice(0, 1200)}`;
export async function ingest(name, text, { signal, cfg } = {}) {
    const chunks = splitPlan(text);
    if (!chunks.length) return { doc: null };
    const { data, usage } = await json(ingestMessages(name, chunks), { signal, cfg, max_tokens: 1800 });
    const tag = new Map((Array.isArray(data?.chunks) ? data.chunks : []).map((c) => [+c?.i, c]));
    const strs = (x, n, m) => (Array.isArray(x) ? x : []).slice(0, n).map((v) => clip(v, m)).filter(Boolean);
    chunks.forEach((c, i) => { const t = tag.get(i) || {}; c.types = strs(t.types, 4, 10).filter((x) => TYPES.includes(x)); c.kps = strs(t.kps, 3, 12); });
    const doc = { name: clip(name.replace(/\.(docx|txt|md)$/i, ""), 40) || clip(data?.name, 16) || "我的教案", gt: GTS.includes(data?.gt) ? data.gt : "", summary: clip(data?.summary, 60), topics: strs(data?.topics, 5, 12),
        types: [...new Set(chunks.flatMap((c) => c.types))], chunks };
    const vs = await embed(chunks.map((c) => chunkText(c, `《${doc.name}》${doc.summary}`)), { signal });
    chunks.forEach((c, i) => Object.assign(c, quant(vs[i])));
    return { doc, usage };
}
// 页面带上来的教案库块：只认合法的字段，向量对不上维度的不要
export const cleanLib = (xs) => (Array.isArray(xs) ? xs : []).slice(0, 80).map((c) => ({ id: clip(c?.id, 40), doc: clip(c?.doc, 40), sum: clip(c?.sum, 60), title: clip(c?.title, 30), text: cleanText(c?.text, 1600),
    types: (Array.isArray(c?.types) ? c.types : []).filter((t) => TYPES.includes(t)), kps: (Array.isArray(c?.kps) ? c.kps : []).slice(0, 3).map((k) => clip(k, 12)), v: String(c?.v || ""), s: +c?.s })).filter((c) => c.text && unquant(c));
// 检索到的块（写教案时页面再传回来，只要文字）
export const cleanLibPicked = (xs) => (Array.isArray(xs) ? xs : []).slice(0, 4).map((c) => ({ doc: clip(c?.doc, 40), title: clip(c?.title, 30), text: cleanText(c?.text, 1500) })).filter((c) => c.text);
const LIB_MIN = 0.3;   // 重排分低于这个的不要（宁缺毋滥：不相关的讲法塞进提示词只会带偏）。10-30 三份样例教案：对口的 0.52–0.96，不对口的不超过 0.12
// 只要讲法：目标、重难点、学情、默写、作业、反思这类块不拿来参照（开头多是标题和课时）
const NOT_METHOD = /^(开头|.*(教学目标|重难点|重点|难点|学情|教材分析|教学准备|默写|作业|反思))/;
// 和这节课相关的几块：每个题型一个查询（同 retrieve），余弦取最高的、题型对上加一点 → 前 8 块重排 → 最多 3 块、同一份最多 2 块
export async function libRetrieve(lib, mix, guidance, { signal, n = 3, min = LIB_MIN } = {}) {
    const cs = lib.filter((c) => !NOT_METHOD.test(c.title)).map((c) => ({ ...c, vec: unquant(c) })).filter((c) => c.vec);
    if (!cs.length || !mix.length) return [];
    const queries = mix.map((m) => `${m.type}${m.kps?.length ? "：" + m.kps.join("、") : ""}${guidance ? "。" + guidance : ""}`);
    const qv = await embed(queries, { signal });
    for (const c of cs) c.f = Math.max(...qv.map((q, k) => { let d = 0; for (let j = 0; j < DIMS; j++) d += q[j] * c.vec[j]; return d * c.s + (c.types.includes(mix[k].type) ? 0.1 : 0); }));
    const top = cs.sort((a, b) => b.f - a.f).slice(0, 8);
    // 重排的查询只写一遍老师的要求、占比最大的三个题型（每个题型都带一遍要求，要求一长就把题型冲淡了）
    const focus = [...mix].sort((a, b) => b.share - a.share).slice(0, 3).map((m) => `${m.type}${m.kps?.length ? "（" + m.kps.join("、") + "）" : ""}`).join("、");
    const rr = await rerank(`这节课要讲：${focus}${guidance ? "。老师的要求：" + guidance : ""}`, top.map((c) => `${c.sum ? c.sum + "｜" : ""}${c.title}｜${c.types.join("、")}\n${c.text.slice(0, 700)}`), { signal });
    for (const r of rr) top[r.index].rr = r.score;
    const pick = [], per = {};
    for (const c of top.sort((a, b) => b.rr - a.rr)) {
        if (pick.length >= n || c.rr < min) break;
        if ((per[c.doc] || 0) >= 2) continue;
        per[c.doc] = (per[c.doc] || 0) + 1; pick.push(c);
    }
    return pick.map(({ id, doc, title, text, types, rr }) => ({ id, doc, title, text, types, rr: +rr.toFixed(3) }));
}

// ---------- 改写、融合（MAT-542）：原教案（教案库里的、存下来的、正在备的，最多 4 份）→ 这个学生这节课的大纲（格式同 outlineMessages），每个环节标来自哪一份 ----------
// 原教案自带的练习能用的留着（老师自己的材料）；要补题的环节报 need / query，函数按题型从题库检索后挂上 E 编号。
// 存下来的教案带着当时用的题库例题（items：[{code, id}]）：几份之间编号会撞，这里统一重编成 E1、E2……，原文里的编号跟着换
export function cleanSources(xs) {
    const arr = (Array.isArray(xs) ? xs : []).filter((s) => cleanText(s?.text, 100).length >= 20).slice(0, 4);
    const per = Math.min(8000, Math.floor(16000 / (arr.length || 1)));
    const items = [], seen = new Map();
    const sources = arr.map((s, k) => {
        let text = cleanText(s.text, per);
        const map = new Map();
        for (const it of (Array.isArray(s.items) ? s.items : []).slice(0, 30)) {
            const id = String(it?.id || "").slice(0, 60), code = String(it?.code || "");
            if (!id || !/^E\d{1,3}$/.test(code)) continue;
            if (!seen.has(id)) { seen.set(id, `E${seen.size + 1}`); items.push({ code: seen.get(id), id }); }
            map.set(code, seen.get(id));
        }
        if (map.size) text = text.replace(/(?<![A-Za-z0-9])E\d{1,3}(?![0-9])/g, (m) => map.get(m) || m);
        return { label: "ABCD"[k], name: clip(s.name, 40) || `教案 ${"ABCD"[k]}`, text };
    });
    return { sources, items };
}
const SOURCE_RULE = (n) => `- 这份教案是在老师给的原教案上${n > 1 ? "融合" : "改写"}的，大纲每个环节标了来自哪份原教案：写这一节时照那份原教案里对应部分的讲法、例子、提问、板书来写，能用的原样用，按这个学生和大纲调整；原教案自带的练习是老师自己的材料，可以照搬进教案（不受「不要抄题目原文」的限制）；原教案里别的学生的名字和情况不要出现，也不要写「原教案说」这类话。`;
const sourceLines = (sources) => sources.map((s) => `【原教案 ${s.label || ""}】《${s.name}》\n${s.text}`);
export function adaptMessages(p, sources, items) {
    const many = sources.length > 1;
    const sys = `你是无锡初中英语老师的备课助手。老师给了 ${sources.length} 份原教案，要${many ? "把它们融合成" : "在它的基础上改写成"}给这个学生这节课用的教案。先排大纲，老师确认、修改以后再写成完整教案。

依据的优先级：【这次的改写要求】> 原教案 > 老师档案（讲题习惯、编排习惯、设置）> 学生档案 > 考试结构。原教案定这节课讲什么、怎么排；学生档案和考试结构只用来调原教案里的讲法和难度（例题降难度、讲解时点名这个学生容易错在哪），不用来加环节、换题型。

只输出一个 JSON 对象：
{"title": "学生名 · 这次课的主题",
 "minutes": 这节课一共多少分钟（【这次的改写要求】里说了就照它，没说就是 ${p.minutes}）,
 "basis": {"年级": "一两句", "学校": "一两句", "学生": "一两句", "老师": "一两句"},
 "changes": ["和原教案比改了什么，2–5 条，每条一句，比如「课时 120 → 90 分钟，砍掉了 B 的书面表达」「完形的讲法照 A，改成练这个学生弱的上下文逻辑」"],
 "adjust": ["根据前几次课的调整，引用日期和数据，0–3 条"],
 "goals": ["教学目标，2–4 条"],
 "sections": [{"name": "环节名", "minutes": 分钟数, "type": "这个环节练的题型，默写、回顾这类写空字符串", "from": "来自哪份原教案：${many ? "A / B / A、B（几份合并的）" : "A"} / 新加（固定环节以外，整节课最多一个新加的讲题环节）", "items": [], "points": ["讲什么、怎么讲，2–4 条，每条一句；照原教案讲法的写清楚原教案怎么讲"], "need": 0, "query": ""}],
 "homework": ["课后作业"],
 "watch": ["下次课观察点，1–3 条"]}

规则：
${many ? `- 融合：把几份合成一节课，各取所长：同一个题型的环节合成一个（讲法取讲得更清楚的那份，或把几份的步骤合在一起），不同题型的按上课顺序排；每个环节 from 写来自哪一份，合并的写「A、B」；课时装不下就按这个学生的薄弱点和下一场考试取舍，changes 里写砍了什么、为什么。每份原教案至少有一个环节用上；固定环节以外的时间都给原教案的环节。`
        : `- 改写：以原教案为底，环节顺序、讲法、例子、提问、板书思路尽量保留，points 里写清楚照原教案怎么讲；只改需要改的：课时、这个学生的水平（太难的降一点）、下一场考试、老师设置和【这次的改写要求】。固定环节以外的时间，原教案的环节至少占八成。`}
- 新加的讲题环节最多一个、不超过 10 分钟（这个学生最弱、原教案又没覆盖的题型），【这次的改写要求】里点名要加的不算在内。时间不够时宁可多给原教案的环节，也不要再加。
- 原教案里的练习是老师自己的材料：能用的照用，points 里写明用的是哪份的哪道（「用 A 的第 2 篇阅读」），need 填 0。原教案只写了「做一篇阅读」没给题、或者题和这个学生对不上（年级不对、太难太易），need 填要从题库补几道（1–3），query 写要找什么样的题（话题、考点），系统检索好以后挂上编号。${items.length ? "原教案里用的题库例题已经换成这次的 E 编号（见【原教案用到的题库例题】），合适的继续用，填进 items；不合适的不填，按需要 need 补。" : "items 给空数组。"}
- 原教案是给别的学生、别的课时写的：学生名字、年级、考试、课时、薄弱点一律换成这个学生的，原教案里别的学生的名字不要出现。
- sections 按上课顺序排，分钟数加起来等于 minutes。【老师设置】里的固定环节（开头默写、课外知识补充、结尾回顾）原教案没有的按设置加上，from 写「新加」。
- 【这次的改写要求】优先级最高，和上面冲突时照它来。
- 关键设计后面用方括号标出依据：记忆编号如 [S2]、[T1]，考试结构标 [考]，学校标 [校]；只引用材料里有的编号，不编造学生情况。
${p.lib?.length ? LIB_RULE + "\n" : ""}- type 只能从这些里选：${TYPES.join("、")}，或空字符串。
- 简体中文，不写空话；不要在大纲里复述这些规则。`;
    const lines = [...materials({ ...p, mix: [] }), `【这次的改写要求】${clip(p.instruction, 300) || "（没有特别要求）"}`,
        ...(items.length ? ["【原教案用到的题库例题】", ...items.map((it) => itemLine(it, 300))] : []), ...sourceLines(sources)];
    return [{ role: "system", content: sys }, { role: "user", content: lines.join("\n") }];
}

// 建档（MAT-508）：老师贴一大段话（家长的话、聊天记录、自己的印象），抽成档案字段、画像维度和几条初始记忆，老师核对后再建档。
// 维度定义由页面传来（web/memory.js 的 DIMS），这里只认传来的 key；学校名原样返回，页面去全市学校表里对
export function intakeMessages(text, dims) {
    const sys = `老师要给一个初中学生建英语家教档案，贴了一段关于这个学生的话（家长的话、聊天记录、老师自己的印象都可能）。把能确定的字段抽出来，只输出一个 JSON 对象：
{"name": "学生的称呼，原文没有就空字符串", "grade": 7 或 8 或 9 或 null（初一 = 七年级 = 7）, "term": "上" 或 "下" 或 null,
 "school": "学校名，尽量写全称并带上原文提到的校区（锡外 → 无锡外国语学校，省锡中 → 江苏省锡山高级中学实验学校）；原文说的是分校就把分校名带上（侨谊古运河、天一宛山湖），只说校名的照原文写，别自己换成别的学校；没提就空字符串",
 "district": "所在区：梁溪区 / 锡山区 / 惠山区 / 滨湖区 / 新吴区 / 经开区 / 江阴市 / 宜兴市，没提就空字符串",
 "progress": {"unit": 学到第几单元（整数）, "stage": "刚开始|学到一半|快学完|学完"} 或 null（「刚学完第四单元」是 unit 4、学完）,
 "dims": [{"key": "维度 key", "value": 0 到 100 的整数, "quote": "原文依据，30 字以内"}],
 "notes": [{"cat": "薄弱点|已掌握|学习习惯|状态|目标", "text": "一句话，30 字以内", "qtype": "题型或空字符串", "quote": "原文依据，40 字以内"}],
 "scores": [{"name": "哪次考试，用原文的说法，12 字以内（上学期期末、九月月考、Unit 3 单元测……）", "score": 得分（数字）, "full": 满分（数字，原文没说就 null）, "quote": "原文依据，30 字以内"}],
 "missing": "原文没提、建档最好补上的信息，30 字以内（写了学校就不算缺所在区，区会按学校自动带出）"}

维度（0 是左端，100 是右端，50 是一般）：
${dims.map((d) => `- ${d.key}：${d.label}（0 ${d.lo} ↔ 100 ${d.hi}）`).join("\n")}

规则：
1. 只抽原文说到的：没依据的字段留空或 null，没依据的维度不给，不要猜。每个维度、每条 notes 都要有原文依据。
2. 维度值按原文的程度给：「特别」「完全」靠两端（10 或 90 左右），「有点」「比较」给 30 或 70 左右，「还行」给 50。
3. notes 放维度表达不了的具体信息：哪类题常错、哪类已经稳了、目标分数、性格和状态。最多 8 条；维度里已经有的不要再写一遍。
4. qtype 只能从这些里选：${TYPES.join("、")}，或空字符串。
5. scores 只放已经考过的英语成绩，按时间先后排（早的在前），最多 6 次；目标分数不是成绩，放 notes 的「目标」。满分原文没说就写 null，不要猜。`;
    return [{ role: "system", content: sys }, { role: "user", content: String(text).slice(0, 3000) }];
}
// 建档传图（用户 10-29）：聊天截图、成绩单、家长发来的照片，先把图里的字原样转写出来，页面接在那段话后面再走 intake。
// 看图用 DeepSeek 官方的 deepseek-flash（建库转写卷子图片也是它，scripts/images.py）；老师自带的 key 不一定能看图，所以一律用站长的 key
const OCR_PROMPT = `这些图是老师为了给一个初中学生建英语家教档案上传的：聊天截图、成绩单、家长发来的话、作业或试卷照片都有可能。把图里和这个学生有关的文字原样转写出来：
- 聊天记录一行一条，写成「谁：说了什么」，认不出是谁就只写内容；
- 成绩单、试卷照片只写考试名称、科目、得分、满分、排名和老师的批注，不要转写题目；
- 和学生无关的（状态栏、广告、表情、按钮文字）不要；认不出的字用 □。
几张图之间空一行。只输出转写出来的文字，不要解释，不要加标题。`;
export const okImages = (xs) => (Array.isArray(xs) ? xs : []).slice(0, 3).filter((u) => typeof u === "string" && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(u) && u.length < 2.5e6);
export async function ocr(images, { signal } = {}) {
    const r = await fetchRetry("https://api.deepseek.com/chat/completions", {
        method: "POST", signal, headers: { Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "deepseek-flash", max_tokens: 2000, temperature: 0.1, thinking: { type: "disabled" },
            messages: [{ role: "user", content: [{ type: "text", text: OCR_PROMPT }, ...images.map((url) => ({ type: "image_url", image_url: { url } }))] }] }),
    });
    if (!r.ok) throw new Error(`看图接口 ${r.status} ${(await r.text()).slice(0, 160)}`);
    const d = await r.json();
    return { text: String(d.choices?.[0]?.message?.content || "").trim().slice(0, 2500), usage: d.usage };
}
const INTAKE_CATS = ["薄弱点", "已掌握", "学习习惯", "状态", "目标"];
export function cleanIntake(d, keys) {
    if (!d || typeof d !== "object") return null;
    const int = (v, lo, hi) => (v == null || v === "" || !Number.isFinite(+v) ? null : Math.max(lo, Math.min(hi, Math.round(+v))));
    const seen = new Set(), unit = int(d.progress?.unit, 1, 8);
    return {
        name: clip(d.name, 10), grade: [7, 8, 9].includes(+d.grade) ? +d.grade : null, term: ["上", "下"].includes(d.term) ? d.term : null,
        school: clip(d.school, 30), district: clip(d.district, 6),
        progress: unit ? { unit, stage: ["刚开始", "学到一半", "快学完", "学完"].includes(d.progress.stage) ? d.progress.stage : "学到一半" } : null,
        dims: (Array.isArray(d.dims) ? d.dims : []).filter((x) => keys.includes(x?.key) && int(x.value, 0, 100) != null && !seen.has(x.key) && seen.add(x.key))
            .map((x) => ({ key: x.key, value: int(x.value, 0, 100), quote: clip(x.quote, 40) })),
        notes: (Array.isArray(d.notes) ? d.notes : []).filter((x) => INTAKE_CATS.includes(x?.cat) && clip(x.text, 60)).slice(0, 8)
            .map((x) => ({ cat: x.cat, text: clip(x.text, 60), qtype: TYPES.includes(x.qtype) ? x.qtype : "", quote: clip(x.quote, 60) })),
        // 历史得分（用户 10-29）：得分按半分取整；满分 1–200，比得分还小说明抽错了，留空让老师填
        scores: (Array.isArray(d.scores) ? d.scores : []).filter((x) => x && x.score !== "" && x.score != null && Number.isFinite(+x.score) && +x.score >= 0).slice(0, 6)
            .map((x) => { const score = Math.round(+x.score * 2) / 2, full = int(x.full, 1, 200); return { name: clip(x.name, 16), score, full: full != null && full >= score ? full : null, quote: clip(x.quote, 40) }; }),
        missing: clip(d.missing, 40),
    };
}

// ---------- 首页搜索框（MAT-545）：一句话 → 问答 / 组卷 / 出教案 ----------
// 问答：按问题里的年级、考试、学校筛卷子和题，编好号交给模型，回答每句标出处（同第二大脑 demo）。
// 组卷：挑一份同类真卷当参照（同校 > 同区统考 > 别的，新教材、近年的优先），照它的大题顺序、题组数和分值，每道大题从题库检索同题型的题拼成一张卷子。
// 出教案：这里只分拣、抽参数，页面接着排大纲、写教案（和微信端 /出教案 一样，MAT-543）
export const EXAM_KINDS = ["单元", "月考/阶段", "期中", "期末", "中考模拟", "中考"];
const DISTRICTS = ["梁溪区", "新吴区", "锡山区", "惠山区", "滨湖区", "经开区", "江阴市", "宜兴市"];
const NEAR_KIND = { 期中: ["期末", "月考/阶段"], 期末: ["期中", "月考/阶段"], "月考/阶段": ["单元", "期中"], 单元: ["月考/阶段", "期中"], 中考模拟: ["中考"], 中考: ["中考模拟"] };

// 每份卷子的大题：按原卷顺序，题型、几个题组、几道小题、分值。题组 id 是「卷子-第几道大题-第几组」
let PIDX = null;
export function paperIndex() {
    if (PIDX) return PIDX;
    const by = new Map();
    for (const u of loadDB().units) {
        if (!by.has(u.paper)) by.set(u.paper, { id: u.paper, title: u.title, school: u.school, name: u.name, district: u.district, level: u.level, gt: u.gt, kind: u.kind, year: u.year, textbook: u.textbook, secs: new Map() });
        const p = by.get(u.paper), at = +u.id.split("-")[1], k = `${at}|${u.type}`;
        if (!p.secs.has(k)) p.secs.set(k, { type: u.type, n: 0, q: 0, points: u.sp ?? null, at });
        const s = p.secs.get(k); s.n++; s.q += u.q.length;
    }
    PIDX = [...by.values()].map(({ secs, ...p }) => {
        const xs = [...secs.values()].sort((a, b) => a.at - b.at);
        for (const s of xs) if (xs.filter((x) => x.at === s.at).length > 1) s.points = null;   // 一道大题拆出了两种题型，分值分不开
        return { ...p, place: p.name || p.district || p.school, sections: xs.map(({ at, ...s }) => s) };
    });
    return PIDX;
}
const paperLabel = (p) => `${p.place} ${p.year} ${p.gt}${p.kind}（${p.level}）`;
const structLine = (p) => p.sections.map((s) => `${s.type} ${s.q} 题${s.points ? ` ${s.points} 分` : ""}`).join("、");
// 学校的说法对上卷子 / 题组：「侨谊」「江南中学」「无锡外国语学校」都认；区级卷没有校名，不算
const core = (s) => String(s || "").replace(/^(江苏省?)?(无锡市?)?/, "").replace(/(实验)?(中学|学校|初级中学|初中|教育集团|集团)$/, "");
export function schoolHit(p, school) {
    const c = core(school);
    if (c.length < 2) return false;
    if (["东林", "侨谊", "外国语", "省锡中"].includes(c)) return p.school === c;   // 归过档的四所学校按档名认（「外国语」别认成金桥外国语）
    return !!p.name && [p.name, p.school !== "其他学校" ? p.school : ""].some((x) => x && (x.includes(c) || (core(x).length >= 2 && c.includes(core(x)))));
}
let AVGQ = null;   // 每种题型一个题组平均几道小题：老师说「来 10 道阅读」时换算成几篇
function avgQ(type) {
    if (!AVGQ) {
        const n = {}; AVGQ = {};
        for (const u of loadDB().units) { n[u.type] = (n[u.type] || 0) + 1; AVGQ[u.type] = (AVGQ[u.type] || 0) + u.q.length; }
        for (const t in AVGQ) AVGQ[t] /= n[t];
    }
    return AVGQ[type] || 1;
}

export function askMessages({ q, history, students, current }) {
    const places = [...new Set(paperIndex().filter((p) => p.name).map((p) => (p.school !== "其他学校" ? p.school : p.name)))];
    const sys = `你在无锡初中英语备课助手的首页搜索框后面：把老师说的一句话分拣成要做的事，抽出参数。只输出一个 JSON 对象，字段见下。
intent 三选一：
- paper：要一份题拿去做、打印：组卷、出一份卷子 / 模拟卷 / 练习卷 / 专项练习、来几道某题型的题（「组一份八上期中卷」「出 10 道现在完成时的动词填空」「完形和阅读各来两篇，偏难」）
- plan：要备课、出教案 / 讲义（「给林小满出一份现在完成时专题教案，90 分钟」「下节课给予安练完形，带答案解析」）
- qa：问题库里有什么、考试怎么考（「侨谊八上期中考哪些题型、各多少分」「近两年九上期末的完形都是什么话题」「题库里有天一的卷子吗」），以及别的闲聊
字段：
- student：说到的学生，只从【学生名单】里选、写全名；说「这个学生」「他」「她」用【正在备】；没说留空
- generic：老师说「通用」「不针对学生」「不用按学生」时 true，别的 false
- gt：年级学期，${GTS.join(" / ")}；「初二上」「八年级上」= 八上；只说年级没说学期按【今天】算（8 月到次年 1 月是上学期）；没说留空
- kind：考试类型，${EXAM_KINDS.join(" / ")}；「一模」「二模」= 中考模拟，「月考」「阶段测试」「10 月考」= 月考/阶段，「单元卷」「周测」= 单元；没说留空
- school：说到的学校，对得上【库里的学校】就写那个名字（「锡外」「无锡外国语」= 外国语，「锡山高级中学实验学校」= 省锡中）；没说留空
- district：说到的区，只能是 ${DISTRICTS.join("、")}；「梁溪区统考卷」district = 梁溪区、level = 统考
- level：统考 / 不统考 / 不知道。「统考」「区统考」「联考」= 统考，「学校自己出的」「校考」= 不统考，没说 = 不知道
- types：说到的题型 [{"type":"题型","n":小题数或 null}]，题型只能用：${TYPES.join("、")}。「阅读」= 阅读理解，「完形」= 完形填空，「作文」= 书面表达，「首字母填空」「单词拼写」= 词汇运用，「7 选 5」= 七选五/信息还原，「单选」= 单项选择。要整套卷子、没点题型的留空数组
- kps：说到的考点（现在完成时、宾语从句、推理判断、词义辨析……），没说留空数组
- topic：说到的话题（环保、人物故事……），没说留空
- difficulty：偏易 / 适中 / 偏难，没说留空
- date：说到的时间节点换成日期 YYYY-MM-DD，按【今天】算（「下周三」「11 月 10 号」「期中前一周」按考试大概在 11 月中旬算）；没说留空
- minutes：一节课多少分钟（plan 用），没说 null
- answers：带 / 不带（要不要答案解析），没说留空
- instruction：plan、paper 时老师的要求原话（去掉学生名字），没有留空
- query：qa 时去掉学校、年级、考试这些筛选词后剩下的问题核心，用来检索题库（「完形 话题」「推理判断题 怎么考」）；别的留空
接着【上一问】追问的（「那东林呢」「换成期末」「再来一份」），没说到的字段照上一问填。
输出格式（intent 一定要有）：{"intent":"paper","student":"","generic":false,"date":"","gt":"","kind":"","school":"","district":"","level":"不知道","types":[],"kps":[],"topic":"","difficulty":"","minutes":null,"answers":"","instruction":"","query":""}`;
    const user = [
        `【今天】${today()}`,
        `【学生名单】${students.map((s) => `${s.name}（${s.gt}，${s.schoolName || s.school || "学校没填"}）`).join("；") || "（空）"}`,
        `【正在备】${current?.name || "（没有）"}`,
        `【库里的学校】${places.join("、")}；区统考卷：${DISTRICTS.join("、")}`,
        ...history.map((h) => `【上一问】${h.q}${h.said ? `（理解成：${h.said}）` : ""}`),
        `【老师说】${q}`,
    ].join("\n");
    return [{ role: "system", content: sys }, { role: "user", content: user }];
}
export function cleanAsk(d) {
    const s = (v, n) => clip(v, n);
    const types = (Array.isArray(d?.types) ? d.types : []).map((t) => (typeof t === "string" ? { type: t } : t)).filter((t) => TYPES.includes(t?.type)).slice(0, 6)
        .map((t) => ({ type: t.type, n: Number.isFinite(+t.n) && +t.n > 0 ? Math.min(30, Math.round(+t.n)) : null }));
    return {
        intent: ["qa", "paper", "plan"].includes(d?.intent) ? d.intent : "qa",
        student: s(d?.student, 10), generic: d?.generic === true, date: /^20\d\d-\d\d-\d\d$/.test(d?.date || "") ? d.date : "", gt: GTS.includes(d?.gt) ? d.gt : "", kind: EXAM_KINDS.includes(d?.kind) ? d.kind : "",
        school: s(d?.school, 20), district: DISTRICTS.includes(d?.district) ? d.district : "", level: ["统考", "不统考", "不知道"].includes(d?.level) ? d.level : "不知道",
        types: [...new Map(types.map((t) => [t.type, t])).values()], kps: (Array.isArray(d?.kps) ? d.kps : []).map((k) => s(k, 12)).filter(Boolean).slice(0, 4),
        topic: s(d?.topic, 12), difficulty: Object.hasOwn(TIER, d?.difficulty ?? "") ? d.difficulty : "",
        minutes: Number.isFinite(+d?.minutes) && +d.minutes >= 30 ? Math.min(240, Math.round(+d.minutes)) : null,
        answers: ["带", "不带"].includes(d?.answers) ? d.answers : "", instruction: s(d?.instruction, 200), query: s(d?.query, 80),
    };
}

// 问答的材料：对得上的卷子（带结构）+ 检索出的题。筛不出东西就逐级放宽，放宽了什么写进 relax
const RELAX = [["", (f) => f], ["考试类型", (f) => ({ ...f, kind: "" })], ["学校和区", (f) => ({ ...f, kind: "", school: "", district: "" })], ["年级", (f) => ({ ...f, gt: "", kind: "", school: "", district: "" })]];
const placeOk = (f) => (x) => (!f.gt || x.gt === f.gt) && (!f.kind || x.kind === f.kind) && (!f.school || schoolHit(x, f.school)) && (!f.district || x.district === f.district);
export async function askSources(spec, query, { signal, k = 6 } = {}) {
    const db = loadDB(), types = spec.types.map((t) => t.type);
    const first = (xs, ok) => { for (const [label, g] of RELAX) { const got = xs.filter(ok(g(spec))); if (got.length) return [got, label]; } return [[], ""]; };
    const [ps, pRelax] = first(paperIndex(), placeOk);
    const papers = ps.sort((a, b) => b.year - a.year || b.sections.length - a.sections.length).slice(0, k);
    const [us, uRelax] = first(db.units.map((u, i) => ({ u, i })).filter(({ u }) => !types.length || types.includes(u.type)), (f) => ({ u }) => placeOk(f)(u));
    let items = [];
    if (us.length) {
        const [qv] = await embed([query], { signal }), qt = tokenize(query);
        const zc = z(us.map(({ i }) => cosine(db, qv, i))), zb = z(us.map(({ i }) => bm25(db, qt, i)));
        const cand = us.map(({ u, i }, j) => ({ u, f: zc[j] + 0.3 * zb[j] + (kpHit(u, spec.kps).length ? 0.5 : 0) + (spec.topic && u.topic.includes(spec.topic) ? 0.5 : 0) }))
            .sort((a, b) => b.f - a.f).slice(0, 30);
        const rr = await rerank(query, cand.map(({ u }) => `${u.type}｜${u.gt}${u.kind}｜${u.kp.join("、")}｜${u.topic}\n${u.text.slice(0, 600)}`), { signal });
        for (const r of rr) cand[r.index].rr = r.score;
        const per = {};   // 同一份卷子最多 2 个题组，免得一问全是一张卷子
        items = cand.sort((a, b) => b.rr - a.rr).filter(({ u }) => (per[u.paper] = (per[u.paper] || 0) + 1) <= 2).slice(0, k).map(({ u, rr }) => ({ ...itemView(u, spec.gt || u.gt), rr: +rr.toFixed(3) }));
    }
    return { papers: papers.map((p) => ({ id: p.id, label: paperLabel(p), title: p.title, struct: structLine(p), sections: p.sections })), items, relax: { papers: pRelax, items: uRelax } };
}
export function qaMessages(q, spec, src) {
    const db = loadDB(), P = paperIndex();
    const sys = `你是无锡初中英语备课助手，回答老师在首页搜索框里问的、关于题库和考试的问题。题库是 ${P.length} 份 2022–2026 年无锡初中英语真卷（学校卷、区统考卷、中考真题）拆成的 ${db.units.length} 个题组，不含听力。
- 只根据下面【卷子】【题目】里的材料回答；材料里没有的就直说库里没有，不要编数字、学校和题目。
- 每句话后面用 [n] 标出处（n 是材料编号，可以连写 [1][3]）：说卷子结构引用卷子，说题目内容引用题目。
- 先给结论，再分点；简体中文，80–250 字；英文原文最多引一句。
- 卷子的年份说「2024 年的卷子」，不要说「2024 届」（届是学生毕业那年，和卷子年份不是一回事）。
- 材料开头写了放宽过筛选的，要说清楚这是放宽以后的结果。
- 老师其实是想要一份卷子或教案的，最后一句提示可以直接在搜索框里说「组一份……」或「给某某出一份……教案」。`;
    const f = [spec.gt && `年级 ${spec.gt}`, spec.kind && `考试 ${spec.kind}`, spec.school && `学校 ${spec.school}`, spec.district && `区 ${spec.district}`, spec.types.length && `题型 ${spec.types.map((t) => t.type).join("、")}`].filter(Boolean).join("，");
    let n = 0;
    const lines = [
        `【老师问】${q}`,
        `【筛选】${f || "没有"}${src.relax.papers ? `；卷子放宽了${src.relax.papers}` : ""}${src.relax.items ? `；题目放宽了${src.relax.items}` : ""}`,
        `【卷子】${src.papers.length ? "" : "没有对得上的"}`, ...src.papers.map((p) => `[${++n}] ${p.label}｜${p.title}｜大题：${p.struct}`),
        `【题目】${src.items.length ? "" : "没有对得上的"}`, ...src.items.map((it) => `[${++n}] ${it.type}｜${it.school} ${it.year} ${it.gt}${it.kind}（${it.level}）｜考点：${it.kp.join("、")}${it.topic ? "｜话题：" + it.topic : ""}｜答案：${it.ans.filter(Boolean).join(" ")}\n${clip(withImageText(it), 500)}`),
    ];
    return [{ role: "system", content: sys }, { role: "user", content: lines.join("\n") }];
}

// 组卷第一步：挑参照卷、定每道大题要几个题组。spec: { gt, kind, level, school, district, textbook, types: [{type, n}] }
export function paperPlan(spec) {
    const ps = paperIndex().filter((p) => p.sections.length), near = NEAR_KIND[spec.kind] || [];
    const tiers = [
        [(p) => p.gt === spec.gt && p.kind === spec.kind, ""],
        [(p) => p.gt === spec.gt && near.includes(p.kind), `库里没有${spec.gt}${spec.kind}的卷子，参照${spec.gt}相近的考试`],
        [(p) => p.gt[0] === spec.gt[0] && p.kind === spec.kind, `库里没有${spec.gt}${spec.kind}的卷子，参照同年级另一学期的${spec.kind}`],
        [(p) => p.gt === spec.gt, `库里没有${spec.gt}${spec.kind}这类的卷子，参照${spec.gt}别的考试`],
    ];
    const score = (p) => (schoolHit(p, spec.school) ? 8 : 0) + (spec.district && p.district === spec.district ? (UNIFIED.has(p.level) ? 4 : 2) : 0)
        + (spec.level === "统考" ? (UNIFIED.has(p.level) ? 3 : 0) : spec.level === "不统考" ? (p.level === "校考" ? 3 : 0) : 0)
        + (spec.textbook !== "旧" && p.textbook === "新" ? 2 : 0) + (p.year - 2022) * 0.5 + Math.min(p.sections.length, 7) * 0.4;
    let ref = null, note = "没找到能参照的卷子";
    for (const [f, n] of tiers) { const xs = ps.filter(f); if (xs.length) { ref = xs.sort((a, b) => score(b) - score(a))[0]; note = n; break; } }
    const want = spec.school || spec.district;
    if (ref && want && !(spec.school ? schoolHit(ref, spec.school) : ref.district === spec.district))
        note = [note, `库里没有${want}${spec.gt}${spec.kind}的卷子，结构参照的是别处的同类卷`].filter(Boolean).join("；");
    let secs = ref ? ref.sections.map((s) => ({ ...s })) : [];
    // 点了题型的只组这几道大题；参照卷里没有的题型，短文类两篇、一句一题的十道
    if (spec.types.length) secs = spec.types.map(({ type, n }) => {
        const s = secs.find((x) => x.type === type) || { type, n: PASSAGE.has(type) ? 2 : 10, q: 0, points: null };
        if (!n) return s;
        const per = s.q && s.n ? s.q / s.n : avgQ(type);
        return { ...s, n: Math.max(1, Math.min(PASSAGE.has(type) ? 6 : 20, Math.round(n / per))), q: n, points: s.points && s.q ? (s.points / s.q) * n : null };
    });
    return { ref: ref && { id: ref.id, label: paperLabel(ref), title: ref.title, struct: structLine(ref) }, note, secs: secs.filter((s) => TYPES.includes(s.type) && s.n > 0) };
}
// 组卷第二步：每道大题按题型检索（年级学期、出卷来源、同校同区、难度、考点照排大纲时的检索），拼成卷子。
// 认了学生的（页面算好传来）：weak 每个题型的薄弱考点、exclude 这个学生用过的题、maxUnit + scope 只挑学到的单元、extra 卷子后面附的薄弱点加练
export async function fillPaper(spec, plan, { signal } = {}) {
    const db = loadDB();
    // 检索的「同校」加分只认归过档的学校（东林 / 侨谊 / 外国语 / 省锡中），「其他学校」是一个档，加了等于没加
    const key = paperIndex().find((p) => p.name && p.school !== "其他学校" && schoolHit(p, spec.school))?.school || "";
    // 考点只给这个题型里真有的（「现在完成时」不往完形的查询里塞）
    const kpsFor = (type) => [...new Set([...spec.kps, ...(spec.weak?.[type] || [])])].filter((k) => db.units.some((u) => u.type === type && kpHit(u, [k]).length)).slice(0, 4);
    const ctx = { gt: spec.gt, kind: spec.kind, level: spec.level, school: key, district: spec.district, textbook: spec.textbook, guidance: spec.instruction, difficulty: spec.difficulty,
        exclude: new Set(spec.exclude || []), maxUnit: spec.maxUnit || 0, scope: spec.scope };
    // 按参照卷的小题数凑；一道大题十几道单题时每份卷子多给几道，同类卷子少的格子才凑得满
    const R = await retrieve(plan.secs.map((s) => ({ type: s.type, share: 0.1, n: s.n, q: s.q || undefined, cap: Math.max(PASSAGE.has(s.type) ? 1 : 2, Math.ceil(s.n / 3)), kps: kpsFor(s.type), query: spec.topic ? `${s.type}：${spec.topic}${spec.instruction ? "。" + spec.instruction : ""}` : undefined })), ctx, { signal });
    const sections = plan.secs.map((s, i) => {
        const items = R[i]?.items || [], q = items.reduce((a, it) => a + it.q.length, 0), per = s.points && s.q ? s.points / s.q : null;
        return { type: s.type, items, q, points: per ? Math.round(per * q * 2) / 2 : null, relax: R[i]?.relax || "", levelRelaxed: !!R[i]?.levelRelaxed };
    }).filter((s) => s.items.length);
    // 加练：卷子里用过的题不再出
    const used = new Set([...ctx.exclude, ...R.flatMap((r) => r.items.map((it) => it.id))]), xs = spec.extra || [];
    const X = xs.length ? await retrieve(xs.map((x) => ({ type: x.type, share: 0.1, n: x.n, kps: kpsFor(x.type).length ? kpsFor(x.type) : x.kps })), { ...ctx, exclude: used }, { signal }) : [];
    // 加练只留考点真对得上的题（学到的范围里对得上的被正卷用完了，就少出或者不出这一节，不拿别的考点凑）
    const extra = xs.map((x, i) => { const items = (X[i]?.items || []).filter((it) => !x.kps.length || kpHit(it, x.kps).length); return { type: x.type, kps: x.kps, items, q: items.reduce((a, it) => a + it.q.length, 0), points: null, relax: X[i]?.relax || "" }; }).filter((x) => x.items.length);
    const types = spec.types.map((t) => t.type), where = spec.school || (spec.district ? spec.district + (spec.level === "统考" ? "统考" : "") : "");
    const title = types.length ? `${spec.gt} ${types.join("、")}专项练习` : `${where ? where + " · " : ""}${spec.gt}${spec.kind}模拟卷`;
    const all = sections.flatMap((s) => s.items);
    return { title, ref: plan.ref, note: plan.note, sections, extra,
        stats: { groups: all.length, q: all.reduce((a, it) => a + it.q.length, 0), points: sections.every((s) => s.points != null) ? sections.reduce((a, s) => a + s.points, 0) : null, papers: new Set(all.map((it) => it.title)).size } };
}

// ---------- 限流（同第二大脑：Upstash Redis 计数，没配就用函数内存） ----------
const RURL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const RTOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const today = () => new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);
const mem = { day: "", m: new Map() };
export async function hit(ip, action, perIp) {
    const d = today(), k = `en:${d}:${action}:${ip}`, g = `en:${d}:all`;
    let n, total;
    try {
        if (!RURL) throw 0;
        const r = await fetch(`${RURL}/pipeline`, {   // 计数请求不重试（会多记一次），失败了下面退回内存计数
            method: "POST", headers: { Authorization: `Bearer ${RTOKEN}`, "Content-Type": "application/json" }, signal: AbortSignal.timeout(3000),
            body: JSON.stringify([["INCR", k], ["EXPIRE", k, 172800], ["INCR", g], ["EXPIRE", g, 172800]]),
        });
        [n, , total] = (await r.json()).map((x) => x.result);
    } catch {
        if (mem.day !== d) { mem.day = d; mem.m.clear(); }
        mem.m.set(k, (n = (mem.m.get(k) || 0) + 1)); mem.m.set(g, (total = (mem.m.get(g) || 0) + 1));
    }
    const GLOBAL = Number(process.env.EN_GLOBAL_DAILY ?? 400);
    return { ok: n <= perIp && total <= GLOBAL, left: Math.max(0, perIp - n), global: total > GLOBAL };
}

// ---------- 首页反馈（MAT-509）：存进同一个 Upstash Redis 的列表，不记 IP；没配 Redis 就直说存不了，不退回函数内存（会丢） ----------
const FB_KEY = "en:feedback";
// 本地预览（没配 Upstash、也不在 Vercel 上）用函数内存顶上，账号能点通；只认账号用到的几个命令。线上没配就直说存不了
const devKV = new Map();
const devRedis = (cmds) => cmds.map(([op, k, ...a]) => {
    if (op === "GET") return devKV.get(k) ?? null;
    if (op === "SET") return devKV.set(k, a[0]) && "OK";
    if (op === "DEL") return +devKV.delete(k);
    if (op === "INCR" || op === "INCRBY") { const n = (+devKV.get(k) || 0) + (op === "INCR" ? 1 : +a[0]); devKV.set(k, String(n)); return n; }
    if (op === "EXPIRE") return 1;
    if (op === "KEYS") return [...devKV.keys()].filter((x) => x.startsWith(k.replace(/\*$/, "")));
    throw new Error(`本地预览不支持 ${op}`);
});
async function redis(cmds) {
    if (!RURL) { if (process.env.VERCEL) throw new Error("没配存储"); return devRedis(cmds); }
    const r = await fetch(`${RURL}/pipeline`, { method: "POST", headers: { Authorization: `Bearer ${RTOKEN}`, "Content-Type": "application/json" }, signal: AbortSignal.timeout(5000), body: JSON.stringify(cmds) });
    if (!r.ok) throw new Error(`存储 ${r.status}`);
    return (await r.json()).map((x) => x.result);
}
export const feedbackPush = (entry) => redis([["LPUSH", FB_KEY, JSON.stringify(entry)], ["LTRIM", FB_KEY, 0, 999]]);
export const feedbackList = async (n = 200) => (await redis([["LRANGE", FB_KEY, 0, n - 1]]))[0].map((s) => JSON.parse(s));
// 读反馈的口令：从服务器上的 DeepSeek key 派生（同 dataKey），不用另配；本地 demo/feedback.mjs 用 .env 里同一个 key 算出来
export const feedbackToken = (secret = process.env.DEEPSEEK_API_KEY) => crypto.createHmac("sha256", String(secret || "")).update("en-feedback-read").digest("hex").slice(0, 32);

// ---------- 账号（MAT-510）：用户名 + 密码登录，整个工作区存进账号，换设备接着用 ----------
// 账号 en:acct:<用户名> = { name, salt, hash, at }，由站长用 demo/account.mjs 建（不开放注册，防公开 demo 被刷）
// 工作区 en:data:<uid> = { at, gz }：页面的整个状态 JSON，gzip 后 base64；演示账号的存 7 天
// 令牌 = uid.过期时间.签名（HMAC），签名密钥和站长口令都从服务器上的 DeepSeek key 派生（同 dataKey），不另配环境变量
const derive = (label, secret = process.env.DEEPSEEK_API_KEY) => crypto.createHmac("sha256", String(secret || "")).update(label).digest();
export const adminToken = (secret) => derive("en-admin", secret).toString("hex").slice(0, 32);
const sig = (body) => crypto.createHmac("sha256", derive("en-auth-v1")).update(body).digest("base64url");
export function signToken(uid, days) {
    const body = `${Buffer.from(uid).toString("base64url")}.${Date.now() + days * 864e5}`;
    return `${body}.${sig(body)}`;
}
export function verifyToken(t) {
    const [u, exp, s] = String(t || "").split(".");
    if (!s || !(+exp > Date.now())) return null;
    const want = sig(`${u}.${exp}`);
    return s.length === want.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(want)) ? Buffer.from(u, "base64url").toString() : null;
}
const USER_RE = /^[a-z0-9_.-]{2,24}$/;
const pbkdf2 = (pw, salt) => new Promise((ok, no) => crypto.pbkdf2(String(pw), salt, 210000, 32, "sha256", (e, k) => (e ? no(e) : ok(k))));
export async function acctLogin(user, pw, ip) {
    user = String(user || "").trim().toLowerCase();
    const fk = `en:${today()}:loginfail:${ip}`;
    const [fails, raw] = await redis([["GET", fk], ["GET", `en:acct:${user}`]]);
    if (+fails >= 20) return { error: "今天登录失败太多次了，明天再试", status: 429 };
    const a = raw && JSON.parse(raw);
    if (!a || !crypto.timingSafeEqual(await pbkdf2(pw, a.salt), Buffer.from(a.hash, "hex"))) {
        await redis([["INCR", fk], ["EXPIRE", fk, 86400]]);
        return { error: "用户名或密码不对", status: 401 };
    }
    return { token: signToken(`u:${user}`, 30), user: { name: a.name || user, demo: false } };
}
// 演示账号：一键登录，每个访客一份独立的数据（第一次同步时把页面上的示例数据存进去），存 7 天，互相不覆盖
export async function acctDemo(ip) {
    const k = `en:${today()}:demo:${ip}`;
    const [n] = await redis([["INCR", k], ["EXPIRE", k, 86400]]);
    if (n > 20) return { error: "今天这台机器开的演示账号太多了，明天再试", status: 429 };
    return { token: signToken(`demo:${crypto.randomBytes(6).toString("hex")}`, 7), user: { name: "演示老师", demo: true } };
}
const unpack = (raw) => { const x = JSON.parse(raw); return { at: x.at, data: JSON.parse(zlib.gunzipSync(Buffer.from(x.gz, "base64")).toString()) }; };
export async function dataLoad(uid) {
    const [raw] = await redis([["GET", `en:data:${uid}`]]);
    return raw ? unpack(raw) : { at: null, data: null };
}
// base：页面上次同步到的版本时间。账号里的版本比它新（别的设备改过）就不覆盖，把账号里的版本回给页面
export async function dataSave(uid, data, base) {
    if (!data || typeof data !== "object" || data.version !== 1) return { error: "数据格式不对", status: 400 };
    const [raw] = await redis([["GET", `en:data:${uid}`]]);
    if (raw && JSON.parse(raw).at !== base) return { conflict: true, ...unpack(raw) };
    const gz = zlib.gzipSync(JSON.stringify(data)).toString("base64");
    if (gz.length > 900_000) return { error: "账号里的数据太大了（压缩后超过 900 KB），先删掉一些旧的课次记录", status: 413 };
    const at = new Date().toISOString();
    await redis([["SET", `en:data:${uid}`, JSON.stringify({ at, gz }), ...(uid.startsWith("demo:") ? ["EX", 7 * 86400] : [])]]);
    return { at };
}
// 本机没缓存的题面按 IP 每天限量取回，和排大纲、找题能拿到的量相当，免得题库被按 id 扒走
export async function itemsQuota(ip, n) {
    const k = `en:${today()}:items:${ip}`;
    const [used] = await redis([["INCRBY", k, n], ["EXPIRE", k, 86400]]);
    return used <= Number(process.env.EN_ITEMS_DAILY ?? 400);
}
// 站长管理账号（demo/account.mjs 调）：add / passwd / del / list；metrics：各账号工作区里记的产品指标事件（demo/metrics.mjs 汇总，PRD 第 6 节）
export async function acctAdmin({ op, user, pw, name }) {
    if (op === "list") {
        const keys = await redis([["KEYS", "en:acct:*"]]);
        return { users: keys[0].map((k) => k.slice(8)).sort() };
    }
    if (op === "metrics") {
        const keys = (await redis([["KEYS", "en:data:*"]]))[0].slice(0, 300);
        const raws = keys.length ? await redis(keys.map((k) => ["GET", k])) : [];
        return { accounts: keys.map((k, i) => ({ uid: k.slice(8), metrics: (raws[i] ? unpack(raws[i]).data?.metrics : null) || [] })).filter((x) => x.metrics.length) };
    }
    user = String(user || "").trim().toLowerCase();
    if (!USER_RE.test(user)) return { error: "用户名只能用小写字母、数字和 _ . -，2–24 个字", status: 400 };
    const key = `en:acct:${user}`, [raw] = await redis([["GET", key]]);
    if (op === "del") { await redis([["DEL", key], ["DEL", `en:data:u:${user}`]]); return { ok: !!raw }; }
    if (op !== "add" && op !== "passwd") return { error: "不认识的操作", status: 400 };
    if (op === "add" && raw) return { error: "这个用户名已经有了", status: 409 };
    if (op === "passwd" && !raw) return { error: "没有这个用户", status: 404 };
    if (String(pw || "").length < 8) return { error: "密码至少 8 位", status: 400 };
    const salt = crypto.randomBytes(16).toString("hex"), prev = raw ? JSON.parse(raw) : {};
    await redis([["SET", key, JSON.stringify({ name: String(name || prev.name || user).slice(0, 12), salt, hash: (await pbkdf2(pw, salt)).toString("hex"), at: prev.at || new Date().toISOString() })]]);
    return { ok: true };
}
