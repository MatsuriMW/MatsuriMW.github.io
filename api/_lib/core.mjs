// 第二大脑在线版的检索核心：构建脚本、线上函数、评测脚本共用这一份。
// 打分口径照搬 Obsidian 插件「第二大脑」的 BlockIndex.scoreAll / search（~/claude/rag-eval 评测过的那套）：
// BM25 和余弦各自做 z-score 再加权相加，空壳块减分；先按问题里的时间 / 文件夹圈范围，再在范围里排。
// 和插件不同的两处：向量模型换成 bge-m3（门槛要重新标定），候选再交给 bge-reranker-v2-m3 精排。

export const CJK = /[㐀-鿿豈-﫿]/;
const STOP_EN = new Set("the and for are but not you with this that from have was were will would can could what when where which who how all any your our their its his her they them then than there here into onto about just also very more most some such only other of to in on at by is it be as or an if so do does did no yes we he she i me my".split(" "));

// 中文按两字切（单字词保留），英文按词，去停用词
export function tokenize(text) {
    const out = [];
    const s = String(text).toLowerCase().replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, " $2 ").replace(/https?:\/\/\S+/g, " ");
    for (const m of s.matchAll(/[a-z][a-z0-9+#.-]{1,}|[㐀-鿿豈-﫿]+/g)) {
        const w = m[0];
        if (CJK.test(w[0])) {
            if (w.length === 1) out.push(w);
            for (let i = 0; i + 1 < w.length; i++) out.push(w.slice(i, i + 2));
        } else if (!STOP_EN.has(w)) out.push(w.replace(/[.-]+$/, ""));
    }
    return out;
}

// 去掉格式和标点后剩几个字：认空壳块（只有标题的列表项、只有页名的标题块）
export function contentLen(text) {
    return String(text).replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, "$2").replace(/\^[\w-]+/g, "").replace(/#card\b/g, "")
        .replace(/^\s*(?:[-*+]|\d+[.)])\s+(?:\[.\]\s+)?/gm, "").replace(/[\s\p{P}\p{S}]/gu, "").length;
}

// 显示用：去掉列表前缀、块 ID、双链和强调语法
export function plain(s) {
    return String(s)
        .replace(/^\s*(?:[-*+]|\d+[.)])\s+/gm, "")
        .replace(/\s\^[\w-]+\s*$/gm, "")
        .replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, "$2")
        .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/==|\*\*|__/g, "")
        .replace(/#card\b/g, "")
        .replace(/[ \t]+/g, " ")
        .trim();
}

// ---------- 日期：只用整数 YYYYMMDD，不依赖时区库 ----------
const ymd = (y, m, d) => y * 10000 + m * 100 + d;
const daysIn = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
function addDays(n, k) {
    const d = new Date(Date.UTC(Math.floor(n / 10000), Math.floor(n / 100) % 100 - 1, n % 100) + k * 864e5);
    return ymd(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}
function addMonths(n, k) {
    let y = Math.floor(n / 10000), m = Math.floor(n / 100) % 100 + k;
    while (m < 1) { m += 12; y--; } while (m > 12) { m -= 12; y++; }
    return ymd(y, m, Math.min(n % 100, daysIn(y, m)));
}
export const fmtDay = (n) => `${Math.floor(n / 10000)}-${String(Math.floor(n / 100) % 100).padStart(2, "0")}-${String(n % 100).padStart(2, "0")}`;
// 北京时间的今天
export function todayCN(now = Date.now()) {
    const d = new Date(now + 8 * 3600e3);
    return ymd(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

// 从问题里认出时间和文件夹（纯规则，不调模型）。照搬插件的 parseQueryFilters
export function parseQueryFilters(query, { today = todayCN(), folders = [] } = {}) {
    let q = String(query);
    const res = { query: q };
    const CN = { 零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
    const num = (s) => {
        if (/^\d+$/.test(s)) return +s;
        if (s === "半") return 0.5;
        if (s.includes("十")) { const [a, b] = s.split("十"); return (a ? CN[a] : 1) * 10 + (b ? CN[b] : 0); }
        return CN[s];
    };
    const N = "(\\d{1,2}|[一二两三四五六七八九十]{1,3}|半)";
    const Y = Math.floor(today / 10000), Mo = Math.floor(today / 100) % 100;
    const yearsAgo = (w) => ({ 今年: 0, 去年: 1, 前年: 2 })[w];
    const valid = (y, m, d) => m >= 1 && m <= 12 && d >= 1 && d <= daysIn(y, m);
    const month = (y, m) => valid(y, m, 1) && [ymd(y, m, 1), ymd(y, m, daysIn(y, m))];
    const rules = [
        [/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*[日号]?|(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?!\d)/, (m) => { const y = +(m[1] || m[4]), mo = +(m[2] || m[5]), d = +(m[3] || m[6]); return valid(y, mo, d) && [ymd(y, mo, d), ymd(y, mo, d)]; }],
        [/(\d{4})\s*年\s*(\d{1,2})\s*月份?|(\d{4})[-/.](\d{1,2})(?![\d./-])/, (m) => month(+(m[1] || m[3]), +(m[2] || m[4]))],
        [/(今年|去年|前年)\s*(\d{1,2}|[一二三四五六七八九十]{1,2})\s*月份?/, (m) => month(Y - yearsAgo(m[1]), num(m[2]))],
        [/(\d{4}\s*年|今年|去年|前年)\s*(上|下)半年/, (m) => { const y = /\d/.test(m[1]) ? +m[1].match(/\d{4}/)[0] : Y - yearsAgo(m[1]); return m[2] === "上" ? [ymd(y, 1, 1), ymd(y, 6, 30)] : [ymd(y, 7, 1), ymd(y, 12, 31)]; }],
        [/(\d{4})\s*年(?!代)|(今年|去年|前年)/, (m) => { const y = m[1] ? +m[1] : Y - yearsAgo(m[2]); return [ymd(y, 1, 1), ymd(y, 12, 31)]; }],
        [/上个?月|这个月|本月/, (m) => { const s = addMonths(ymd(Y, Mo, 1), m[0].startsWith("上") ? -1 : 0); return month(Math.floor(s / 10000), Math.floor(s / 100) % 100); }],
        [/上个?(?:周|星期|礼拜)|(?:这|本)个?(?:周|星期|礼拜)/, (m) => {
            const wd = (new Date(Date.UTC(Y, Mo - 1, today % 100)).getUTCDay() + 6) % 7;   // 周一 = 0
            const mon = addDays(today, -wd - (m[0].startsWith("上") ? 7 : 0));
            return [mon, addDays(mon, 6)];
        }],
        [new RegExp(`(?:最近|过去|近)\\s*${N}\\s*(天|日|周|个?星期|个?礼拜|个?月|年)`), (m) => {
            const n = num(m[1]); if (!n) return null;
            const from = /天|日/.test(m[2]) ? addDays(today, -n) : /周|星期|礼拜/.test(m[2]) ? addDays(today, -7 * n) : /月/.test(m[2]) ? addMonths(today, -Math.round(n)) : addMonths(today, -12 * n);
            return [addDays(from, 1), today];
        }],
        [/今天|昨天|前天/, (m) => { const d = addDays(today, -{ 今天: 0, 昨天: 1, 前天: 2 }[m[0]]); return [d, d]; }],
    ];
    let hit = null;
    for (const [re, fn] of rules) {
        const m = q.match(re);
        const r = m && fn(m);
        if (!r) continue;
        [res.dateFrom, res.dateTo] = r; hit = m[0];
        q = q.replace(hit, " ");
        break;
    }
    const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    for (const f of [...folders].sort((a, b) => b.length - a.length)) {
        if (f.length < 2) continue;
        const fm = q.match(new RegExp(`(?:在\\s*)?「?${reEsc(f)}」?\\s*(?:(?:文件夹|目录)\\s*)?(?:里面|里|中|下面|下)的?|(?:在\\s*)?「?${reEsc(f)}」?\\s*(?:文件夹|目录)`));
        if (!fm) continue;
        res.folder = f;
        q = q.replace(fm[0], " ");
        break;
    }
    if (hit || res.folder) {
        const rest = q.replace(/\s+/g, " ").replace(/^[\s,，。、的在]+|[\s,，。、]+$/g, "").trim();
        res.query = rest.length >= 2 ? rest : String(query);
        res.label = [hit ? (res.dateFrom === res.dateTo ? fmtDay(res.dateFrom) : `${fmtDay(res.dateFrom)} ~ ${fmtDay(res.dateTo)}`) : "", res.folder ? `${res.folder}/` : ""].filter(Boolean).join(" · ");
    }
    return res;
}

// ---------- 向量：int8 量化存储，每块一个缩放系数 ----------
export function quantize(vec) {
    let mx = 1e-9; for (const x of vec) mx = Math.max(mx, Math.abs(x));
    const s = mx / 127, q = new Int8Array(vec.length);
    for (let i = 0; i < vec.length; i++) q[i] = Math.round(vec[i] / s);
    return { q, s };
}

// ---------- 块索引 ----------
// blocks: [{ id, path, folder, title, text, et(带上下文的检索文本，可选), day(日记日期 YYYYMMDD，别的为 0), url? }]
// vectors: Int8Array(n*dims)，scales: Float32Array(n)，均已 L2 归一化后再量化
export class BlockIndex {
    constructor(blocks, { vectors = null, scales = null, dims = 1024 } = {}) {
        this.blocks = blocks;
        this.vectors = vectors; this.scales = scales; this.dims = dims;
        this.post = new Map();
        this.totalLen = 0;
        blocks.forEach((b, idx) => {
            const toks = tokenize(b.et || b.text);
            b.len = toks.length; b.clen = contentLen(b.text);
            this.totalLen += toks.length;
            const tf = new Map();
            for (const t of toks) tf.set(t, (tf.get(t) || 0) + 1);
            for (const [t, n] of tf) { let p = this.post.get(t); if (!p) this.post.set(t, (p = [])); p.push(idx, n); }
        });
        this.folders = [...new Set(blocks.map((b) => b.folder).filter(Boolean))];
    }
    // 每块的 BM25（bm）、余弦（cos）、混合分（f）。opts: hybridWeight, shellPenalty, shellMinChars
    scoreAll(query, qvec, { hybridWeight = 0.15, shellPenalty = 3, shellMinChars = 12 } = {}) {
        const N = this.blocks.length;
        const qtf = new Map();
        for (const t of tokenize(query)) qtf.set(t, (qtf.get(t) || 0) + 1);
        const avg = this.totalLen / N || 1;
        const terms = [...qtf.keys()].map((t) => { const p = this.post.get(t); const df = p ? p.length / 2 : 0; return { t, df, idf: df ? Math.log(1 + (N - df + 0.5) / (df + 0.5)) : 0 }; })
            .filter((x) => x.df && x.df < N * 0.2).sort((a, b) => b.idf - a.idf).slice(0, 48);
        const bm = new Float64Array(N);
        const k1 = 1.2, bb = 0.75;
        for (const { t, idf } of terms) {
            const p = this.post.get(t), qw = Math.min(3, qtf.get(t));
            for (let i = 0; i < p.length; i += 2) {
                const tf = p[i + 1], b = this.blocks[p[i]];
                bm[p[i]] += idf * (tf * (k1 + 1)) / (tf + k1 * (1 - bb + bb * b.len / avg)) * qw;
            }
        }
        const cos = new Float32Array(N), f = new Float64Array(N);
        if (!qvec || !this.vectors) { for (let i = 0; i < N; i++) f[i] = bm[i]; return { bm, cos: null, f, terms: terms.map((x) => x.t) }; }
        const d = this.dims, V = this.vectors;
        let sum = 0, sum2 = 0;
        for (let i = 0; i < N; i++) {
            let s = 0; const o = i * d;
            for (let k = 0; k < d; k++) s += qvec[k] * V[o + k];
            s *= this.scales[i];
            cos[i] = s; sum += s; sum2 += s * s;
        }
        const mu = sum / N, sd = Math.sqrt(Math.max(1e-9, sum2 / N - mu * mu));
        let bs = 0, bs2 = 0;
        for (let i = 0; i < N; i++) { bs += bm[i]; bs2 += bm[i] * bm[i]; }
        const bmu = bs / N, bsd = Math.sqrt(Math.max(1e-9, bs2 / N - bmu * bmu));
        for (let i = 0; i < N; i++) {
            const shell = shellPenalty && this.blocks[i].clen < shellMinChars;
            f[i] = (cos[i] - mu) / sd + hybridWeight * ((bm[i] - bmu) / bsd) - (shell ? shellPenalty : 0);
        }
        return { bm, cos, f, mu, sd, terms: terms.map((x) => x.t) };
    }
    // 圈范围 → 混合分 > minZ → 去重、每篇最多 perFile 块 → 前 limit 块。返回每块的分数明细，给页面上的「检索过程」用
    search(query, qvec, { limit = 30, perFile = 2, minZ = 1.5, dateFrom = null, dateTo = null, folder = null, ...opts } = {}) {
        const S = this.scoreAll(query, qvec, opts);
        const fold = folder ? folder + "/" : null;
        const inScope = (b) => (!fold || (b.folder + "/").startsWith(fold)) && (!(dateFrom || dateTo) || (b.day && (!dateFrom || b.day >= dateFrom) && (!dateTo || b.day <= dateTo)));
        const scoped = !!(fold || dateFrom || dateTo);
        const order = [];
        for (let i = 0; i < S.f.length; i++) if ((S.cos ? S.f[i] > minZ : S.bm[i] > 0) && (!scoped || inScope(this.blocks[i]))) order.push(i);
        order.sort((a, b) => S.f[b] - S.f[a]);
        // 全库名次（不圈范围、不设门槛）：页面上用来展示「圈范围前排第几」
        const out = [], perCount = new Map(), seen = new Set();
        for (const i of order) {
            const b = this.blocks[i];
            const key = b.text.replace(/\s+/g, "").slice(0, 80);
            if (seen.has(key)) continue;
            seen.add(key);
            const c = perCount.get(b.path) || 0;
            if (c >= perFile) continue;
            perCount.set(b.path, c + 1);
            out.push({ i, f: S.f[i], cos: S.cos ? S.cos[i] : null, bm: S.bm[i] });
            if (out.length >= limit) break;
        }
        return { hits: out, terms: S.terms, mu: S.mu, sd: S.sd, passed: order.length };
    }
}
