// 把每次提问的链路发到 LangSmith（不装 SDK，直接调 REST）。没配 LANGSMITH_API_KEY、回放模式、评测（dry）都不发。
// 一次提问 = 一棵 run 树：根节点是这次提问，下面挂脱敏、人工闸、规则闸、查表、检索、重排、生成（llm，带 token）、校验。
// 员工的 Good / OK / Bad 同步成根节点上的 feedback。
// 环境变量：LANGSMITH_API_KEY；Service Key 写入时要带工作区 LANGSMITH_WORKSPACE_ID（X-Tenant-Id），不带会 403
// 发出去的问题是脱敏后的文字。自己做的看板照旧：人工介入率、自然通过率这类业务指标 LangSmith 给不了。
// 线上函数响应结束就会被冻结，所以路由在写回响应前 await settle()，把这次请求攒下的上报发完。
import crypto from "node:crypto";
import { REPLAY } from "./models.mjs";

const ENDPOINT = () => (process.env.LANGSMITH_ENDPOINT || "https://api.smith.langchain.com").replace(/\/$/, "");
export const LS_PROJECT = () => process.env.LANGSMITH_PROJECT || "employee-policy-demo";
export const lsOn = () => !!process.env.LANGSMITH_API_KEY && !REPLAY;

// traceId（10 位 hex）→ 固定的 UUID，同一个 trace 的 feedback 才能挂回同一个根节点
export function runId(traceId, name = "root") {
    const h = crypto.createHash("sha1").update(`${traceId}/${name}`).digest("hex");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${((parseInt(h[16], 16) & 3) | 8).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
// LangSmith 的 dotted_order：20261110T130417123000Z + run id，子节点接在父节点后面用点隔开
const stamp = (ms) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.(\d{3})Z$/, "$1000Z");
const iso = (ms) => new Date(ms).toISOString();
const GATE = { redact: "脱敏", human: "人工闸", rule: "规则闸", lookup: "查表", rag: "RAG 分档", check: "引用和数字校验" };

// 由 trace（ask.mjs 里攒的）拼出 run 列表。x 是只在内存里的细节：t0、检索 / 生成的起止时间、提示词
export function buildRuns(trace, x) {
    const t0 = x.t0, end = t0 + (trace.ms ?? 0);
    const rootId = runId(trace.traceId), rootDot = stamp(t0) + rootId;
    const runs = [{
        id: rootId, trace_id: rootId, dotted_order: rootDot, name: "员工问政策", run_type: "chain", session_name: LS_PROJECT(),
        start_time: iso(t0), end_time: iso(end),
        inputs: { question: trace.q, subject: trace.subject, role: trace.role, asOf: trace.asOf },
        outputs: { route: trace.route, final: trace.final, answer: trace.answer, reason: trace.reason, ticketId: trace.ticketId || null },
        tags: [trace.final, trace.route, trace.role].filter(Boolean),
        extra: { metadata: { traceId: trace.traceId, promptVersion: trace.promptVersion, tier: trace.scores?.tier, company: trace.emp?.company, ms: trace.ms } },
        error: trace.error || undefined,
    }];
    const child = (name, run_type, s, e, rest) => {
        const id = runId(trace.traceId, `${name}/${runs.length}`);
        runs.push({ id, trace_id: rootId, parent_run_id: rootId, dotted_order: `${rootDot}.${stamp(t0 + s)}${id}`, name, run_type, session_name: LS_PROJECT(), start_time: iso(t0 + s), end_time: iso(t0 + Math.max(s, e)), ...rest });
    };
    for (const st of trace.trail) {
        if (st.gate === "rag") continue;   // RAG 的细节由下面检索、重排、生成几个节点表示
        child(GATE[st.gate] || st.gate, "tool", st.at ?? 0, st.at ?? 0, { inputs: { question: trace.q }, outputs: { status: st.status, detail: st.detail } });
    }
    if (x.ret) {
        const r = x.ret, e1 = r.start + (r.ms.embed || 0) + (r.ms.search || 0);
        child("检索", "retriever", r.start, e1, {
            inputs: { query: trace.q, role: trace.role, asOf: trace.asOf },
            outputs: { documents: (trace.hits || []).map((h) => ({ page_content: h.clause, type: "Document", metadata: { cid: h.cid, cos: h.cos } })), topCos: trace.scores?.topCos, deniedByRole: trace.acl?.denied?.length || 0 },
        });
        if (r.ms.rerank != null) child("重排", "tool", e1, e1 + r.ms.rerank, { inputs: { query: trace.q }, outputs: { topRR: trace.scores?.topRR, tier: trace.scores?.tier } });
    }
    if (x.gen) {
        const u = trace.usage || {};
        child("生成", "llm", x.gen.start, x.gen.end, {
            inputs: { messages: x.messages }, outputs: { content: trace.rawAnswer, usage_metadata: { input_tokens: u.prompt_tokens, output_tokens: u.completion_tokens, total_tokens: u.total_tokens } },
            extra: { metadata: { ls_provider: "deepseek", ls_model_name: trace.model, ls_model_type: "chat" } },
        });
    }
    return runs;
}

const pending = [];
async function post(p, body) {
    try {
        const r = await fetch(ENDPOINT() + p, { method: "POST", headers: { "x-api-key": process.env.LANGSMITH_API_KEY, ...(process.env.LANGSMITH_WORKSPACE_ID ? { "X-Tenant-Id": process.env.LANGSMITH_WORKSPACE_ID } : {}), "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(4000) });
        if (!r.ok) console.warn(`LangSmith ${p} ${r.status} ${(await r.text()).slice(0, 200)}`);
    } catch (e) { console.warn(`LangSmith ${p} 没发出去：${e.message}`); }
}
export function sendTrace(trace, x) { if (lsOn()) pending.push(post("/runs/batch", { post: buildRuns(trace, x) })); }
const SCORE = { good: 1, ok: 0.5, bad: 0 };
export function sendFeedback(f) {
    if (!lsOn() || !f.traceId) return;
    pending.push(post("/feedback", {
        run_id: runId(f.traceId), key: f.targetType === "human" ? "hr_reply_rating" : "user_rating", score: SCORE[f.rating], value: f.rating,
        comment: [f.reasons?.join("、"), f.note, f.wantHuman ? "要真人" : ""].filter(Boolean).join("；") || undefined,
    }));
}
export async function settle() { await Promise.allSettled(pending.splice(0)); }
