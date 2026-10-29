// POST /api/naming  { kind, desc, global, formal, serious, length, method, trait, gender, lively, rare, exclude }  →  text/event-stream
// 事件：brief（参数翻译成的要求，页面上折叠展示）→ name（每个候选一次，边生成边发）→ done（用时和 token）；出错发 error
// 参数只在服务端拼成提示词，前端传不进自由的提示词

const KINDS = {
    company: { group: "brand", label: "公司 / 企业" },
    product: { group: "brand", label: "产品" },
    project: { group: "brand", label: "项目 / 计划" },
    team: { group: "brand", label: "团队" },
    baby: { group: "baby", label: "新生儿的中文名" },
    work: { group: "work", label: "在外企用的英文名" },
    social: { group: "social", label: "社交媒体昵称" },
};

// 每条光谱 1–5 档，左端是滑块左边的词
const SCALE = {
    formal: ["非常正式、专业", "偏正式", "正式和俏皮之间", "带一点幽默感", "很幽默、有梗"],
    serious: ["严肃、有分量", "偏严肃", "不严肃也不随意", "偏轻松", "很轻松、带点玩味"],
    gender: ["明显偏男性气质", "略偏男性", "中性", "略偏女性", "明显偏女性气质"],
    lively: ["沉稳传统，甚至有点古板", "偏沉稳", "沉稳和活泼之间", "偏活泼", "很活泼、跳脱"],
    rare: ["常见、大众，不会被念错写错", "偏常见", "常见和少见之间", "偏少见", "少见、有辨识度，但不用生僻字"],
};
const LENGTH = {
    brand: ["极短：1–2 个音节、6 个字母以内，听一遍就会念", "偏短：2 个音节左右，好拼好记", "中等：2–3 个音节", "偏长、有层次：可以是复合词", "复杂、有质感：3 个音节以上或两个词组合，看上去更讲究"],
    baby: ["单名（姓 + 一个字）", "以单名为主", "单名双名都可以", "以双名为主", "双名，用字可以讲究一些"],
    work: ["一个音节的短名（如 Max、Jade）", "偏短，两个音节以内", "长短适中", "偏长、正式的全名（如 Alexander）", "长而讲究的全名，可附常用昵称"],
    social: ["极短：2–4 个字符", "偏短", "中等", "偏长，可以是短语", "复杂、有意境，可以是一句短语"],
};
const METHOD = {
    brand: { en: "从已有英文单词出发，拼接、截取、变形再造出新词（像 Pinterest = pin + interest）", pinyin: "从中文拼音出发，同时让不会中文的人也念得出来", any: "英文再造和拼音都可以，两类大致各占一半" },
    work: { en: "用现成、地道的英文名", pinyin: "从本人中文名的发音出发，找读音相近的英文名或拼音变体", any: "现成英文名和贴近中文名发音的都要" },
    social: { en: "用英文单词拼接再造", pinyin: "用中文拼音", zh: "用中文词语", any: "英文、拼音、中文都可以，混着来" },
};
// 每类名字要盯的风险，模型写 risk 时照着查
const RISK = {
    brand: "在英语和其他主要语言里有没有不好的意思或谐音、读音难点、是否太像已有的知名品牌、是不是普通词（难注册商标）",
    baby: "和姓连读的谐音、重名多不多、有没有生僻字或多音字",
    work: "在英语国家有没有刻板印象（显老、像宠物名、像某类职业的艺名等）、和中文名的反差",
    social: "是不是已经被大量使用、在平台上搜不搜得到、读法会不会让人困惑",
};
const ALT = {
    brand: "可以配的中文名，要像真正的品牌中文名那样音义兼顾（如 Coca-Cola → 可口可乐），不要逐字音译，配不出好的就空字符串",
    baby: "全名的拼音，带声调",
    work: "中文近似读音",
    social: "读法，或者拼音；中文昵称不用写",
};

const clip = (s, n) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);
const level = (v) => Math.min(5, Math.max(1, Math.round(Number(v) || 3)));

// 参数 → 一条条要求（同时用于提示词和页面上的「模型收到的要求」）
export function brief(p) {
    const k = KINDS[p.kind] ? p.kind : "product";
    const { group: g, label } = KINDS[k];
    const lines = [`取名对象：${label}`];
    const desc = clip(p.desc, 300);
    if (desc) lines.push(`介绍：${desc}`);
    if (g === "brand" && p.global) lines.push("要出海：名字给不会中文的海外用户看，好念、好拼、好记，在主要语言里没有坏意思，听上去专业可信");
    lines.push(`风格：${SCALE.formal[level(p.formal) - 1]}；${SCALE.serious[level(p.serious) - 1]}`);
    lines.push(`长度：${LENGTH[g][level(p.length) - 1]}`);
    const m = METHOD[g];
    if (m) lines.push(`创作方式：${m[p.method] || m.any}`);
    if (g !== "brand") {
        lines.push(`性别气质：${SCALE.gender[level(p.gender) - 1]}`);
        lines.push(`性格：${SCALE.lively[level(p.lively) - 1]}`);
        lines.push(`常见程度：${SCALE.rare[level(p.rare) - 1]}`);
    }
    const trait = clip(p.trait, 80);
    if (trait) lines.push(`要体现的特色：${trait}`);
    return { kind: k, group: g, lines };
}

export function buildMessages(p) {
    const B = brief(p);
    const exclude = (Array.isArray(p.exclude) ? p.exclude : []).slice(0, 40).map((x) => clip(x, 30)).filter(Boolean);
    const system = [
        "你是一位资深的命名顾问，给品牌、项目和个人取名。按用户给的要求出 8 个候选名字。",
        "",
        "输出格式：一共 8 行，每行一个 JSON 对象，不要编号、不要 Markdown、不要任何别的文字。字段：",
        '- name：名字本身' + (B.group === "baby" ? "（用户给了姓就写全名）" : ""),
        `- alt：${ALT[B.group]}，没有就空字符串`,
        "- how：怎么造出来的（拆词、词源、出处），一句话。引用古诗文只写你确定原句的，拿不准就说是自组，不要编出处",
        "- meaning：寓意或给人的感觉，一句话",
        "- fit：为什么符合这次的要求，点名对应的维度，一句话",
        `- risk：要注意的地方，重点看${RISK[B.group]}。写清楚具体是什么问题，不写「需要检查」「需注意」这类空话；确实没有就空字符串`,
        "",
        "规则：",
        "- 8 个名字之间要拉开差异，构词方式、音节、气质不要雷同。",
        "- 每一档要求都要落实：长度要求是硬条件，风格和气质按档位拿捏分寸。",
        "- 不要说商标、域名、账号可以注册，你核实不了；觉得可能撞名就写进 risk。",
        "- 说明用简体中文，每个字段不超过 40 个字，具体，不写空话。",
    ].join("\n");
    const user = B.lines.join("\n") + (exclude.length ? `\n已经给过、别再出的名字：${exclude.join("、")}` : "");
    return { brief: B, messages: [{ role: "system", content: system }, { role: "user", content: user }] };
}

// 流式生成：逐段 yield 文字，最后 yield {usage}。走硅基流动（key 和第二大脑共用，Vercel 上已经配了）
// 2026-10-26 比过：Kimi K2.6 品牌名最好、首个候选约 5 秒；Qwen3.6-35B 快但品牌名平庸；DeepSeek-V3.2 慢且一般。NAMING_MODEL 可以临时换
async function* generate(messages, { key = process.env.SILICONFLOW_API_KEY, signal, model = process.env.NAMING_MODEL || "Pro/moonshotai/Kimi-K2.6" } = {}) {
    const r = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
        method: "POST", signal,
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, stream: true, enable_thinking: false, temperature: 1.1, max_tokens: 2500, stream_options: { include_usage: true } }),
    });
    if (!r.ok) throw new Error(`llm ${r.status} ${await r.text()}`);
    const dec = new TextDecoder();
    let buf = "";
    for await (const chunk of r.body) {
        buf += dec.decode(chunk, { stream: true });
        let nl;
        while ((nl = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (data === "[DONE]") return;
            const j = JSON.parse(data);
            const d = j.choices?.[0]?.delta?.content;
            if (d) yield d;
            if (j.usage) yield { usage: j.usage };
        }
    }
}

// 从模型输出里逐个抠出顶层 {...}：不靠换行，模型把几个对象挤在一行、拆成多行或包在代码块里都认得
function objectSplitter(onObject) {
    let cur = "", depth = 0, str = false, esc = false;
    return (text) => {
        for (const ch of text) {
            if (!depth && ch !== "{") continue;
            cur += ch;
            if (str) { if (esc) esc = false; else if (ch === "\\") esc = true; else if (ch === '"') str = false; }
            else if (ch === '"') str = true;
            else if (ch === "{") depth++;
            else if (ch === "}" && !--depth) { onObject(cur); cur = ""; }
        }
    };
}

// 一个 JSON 对象 → 候选；解析不了或没有 name 的丢掉
function parseCandidate(s) {
    try {
        const j = JSON.parse(s);
        const name = clip(j.name, 40);
        return name ? { name, alt: clip(j.alt, 60), how: clip(j.how, 120), meaning: clip(j.meaning, 120), fit: clip(j.fit, 120), risk: clip(j.risk, 120) } : null;
    } catch { return null; }
}

// 限流：每个 IP 每天 PER_IP 次、全站每天 GLOBAL 次，按北京时间零点清零
// 和第二大脑共用同一个 Upstash Redis（env 是 KV_REST_API_URL / KV_REST_API_TOKEN），键名前缀 naming:，额度分开算；没配 Redis 退回函数内存计数
const PER_IP = Number(process.env.NAMING_PER_IP_DAILY ?? 20);
const GLOBAL = Number(process.env.NAMING_GLOBAL_DAILY ?? 500);
const R_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const R_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const mem = new Map();

async function hit(ip) {
    const d = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);
    const k = `naming:${d}:ip:${ip}`, g = `naming:${d}:all`;
    let n, total;
    try {
        if (!R_URL || !R_TOKEN) throw new Error("no redis");
        const r = await fetch(`${R_URL}/pipeline`, {
            method: "POST",
            headers: { Authorization: `Bearer ${R_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify([["INCR", k], ["EXPIRE", k, 172800], ["INCR", g], ["EXPIRE", g, 172800]]),
            signal: AbortSignal.timeout(3000),
        });
        if (!r.ok) throw new Error(`redis ${r.status}`);
        [n, , total] = (await r.json()).map((x) => x.result);
    } catch {
        if (mem.size > 5000) mem.clear();
        n = (mem.get(k) || 0) + 1; mem.set(k, n);
        total = (mem.get(g) || 0) + 1; mem.set(g, total);
    }
    return { ok: n <= PER_IP && total <= GLOBAL, left: Math.max(0, PER_IP - n), global: total > GLOBAL };
}

export async function POST(request) {
    let p = {};
    try { p = await request.json(); } catch {}
    if (!p || typeof p !== "object") p = {};
    const h = request.headers;
    const ip = h.get("x-real-ip") || (h.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
    const lim = await hit(ip);
    const left = { "X-RateLimit-Limit": String(PER_IP), "X-RateLimit-Remaining": String(lim.left) };
    if (!lim.ok) return Response.json({ error: lim.global ? "今天全站的额度用完了，明天再来" : `今天的次数用完了（每人每天 ${PER_IP} 次），明天再来` }, { status: 429, headers: left });
    const { brief: B, messages } = buildMessages(p);

    const enc = new TextEncoder();
    const stream = new ReadableStream({
        async start(ctl) {
            const send = (event, data) => ctl.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
            try {
                const t0 = Date.now();
                send("brief", { lines: B.lines, left: lim.left });
                let usage = null, n = 0;
                const feed = objectSplitter((s) => { const c = parseCandidate(s); if (c) { n++; send("name", c); } });
                for await (const x of generate(messages, { signal: request.signal })) {
                    if (typeof x === "string") feed(x); else usage = x.usage;
                }
                if (!n) throw new Error("模型这次没按格式输出，再试一次");
                send("done", { ms: Date.now() - t0, usage });
            } catch (e) {
                send("error", { message: String(e.message || e).slice(0, 200) });
            }
            ctl.close();
        },
    });
    return new Response(stream, { headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no", ...left } });
}
