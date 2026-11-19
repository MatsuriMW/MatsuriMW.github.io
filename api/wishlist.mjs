// Agent Deck / 日志工作流 功能心愿单与投票接口（Vercel Function）
// 数据存 Upstash Redis（复用现有 KV_REST_API_URL / KV_REST_API_TOKEN）；配了 BLOB_READ_WRITE_TOKEN 时截图存 Vercel Blob 并经本接口代理读取，未配时存 Redis（限压缩后 <= 600KB/张）。
// 本机无 Redis 环境变量时自动退回系统临时目录 JSON 文件，方便本地联调。
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const RURL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const RTOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || "";
const ADMIN_TOKEN = process.env.WISHLIST_ADMIN_TOKEN || "";
const HAS_REDIS = Boolean(RURL && RTOKEN);

const AREAS = new Set(["Agent Deck", "螺旋日程", "双插件联动", "macOS 菜单栏"]);
const STATUSES = new Set(["pending", "planned", "in_progress", "done"]);
const MIME_EXT = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };
const MAX_ITEMS = 200;
const MAX_IMG_BYTES = 600 * 1024;
const MAX_POST_PER_IP = 10;
const MAX_VOTE_PER_IP = 80;

const devFile = () => path.join(os.tmpdir(), "matsuri-wishlist-dev.json");
function readDev() {
  try {
    return JSON.parse(fs.readFileSync(devFile(), "utf8"));
  } catch {
    return { ids: [], items: {}, votes: {}, imgs: {}, limits: {} };
  }
}
function writeDev(db) {
  fs.writeFileSync(devFile(), JSON.stringify(db));
}

async function redis(cmds, retries = 0) {
  for (let i = 0; ; i++) {
    try {
      const r = await fetch(`${RURL}/pipeline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${RTOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify(cmds),
        signal: AbortSignal.timeout(7000),
      });
      if (!r.ok) throw new Error(`redis ${r.status}`);
      return (await r.json()).map((x) => {
        if (x.error) throw new Error(`redis ${x.error}`);
        return x.result;
      });
    } catch (e) {
      if (i >= retries) throw e;
      await new Promise((res) => setTimeout(res, 220 * (i + 1)));
    }
  }
}

const clientIp = (req) =>
  req.headers.get("x-real-ip") || (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";

const ipHash = (ip) =>
  ip && ip !== "local" ? crypto.createHash("sha256").update(String(ip)).digest("hex").slice(0, 16) : "";

const todayCN = () => new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);

async function checkLimit(kind, ip, max) {
  const day = todayCN();
  if (!HAS_REDIS) {
    const db = readDev();
    const k = `${kind}:${day}:${ip}`;
    const n = (db.limits[k] || 0) + 1;
    db.limits[k] = n;
    writeDev(db);
    return n <= max;
  }
  const k = `wish:lim:${kind}:${day}:${ip}`;
  const [n] = await redis([["INCR", k], ["EXPIRE", k, 2 * 86400]]);
  return n <= max;
}

const cleanVoter = (v) => (/^[a-zA-Z0-9_-]{8,64}$/.test(String(v || "")) ? String(v) : "");
const newId = () => crypto.randomBytes(6).toString("hex");

function parseDataUrl(dataUrl) {
  const m = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ""));
  if (!m) return null;
  const buf = Buffer.from(m[2], "base64");
  if (!buf.length || buf.length > MAX_IMG_BYTES) return null;
  return { mime: m[1], buf };
}

async function saveImage(parsed) {
  const id = newId();
  let meta;
  if (BLOB_TOKEN) {
    const ext = MIME_EXT[parsed.mime] || "webp";
    const r = await fetch(`https://blob.vercel-storage.com/wishlist/${id}.${ext}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${BLOB_TOKEN}`,
        "x-content-type": parsed.mime,
        "x-add-random-suffix": "0",
        "x-api-version": "7",
      },
      body: parsed.buf,
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) throw new Error(`blob ${r.status}`);
    const data = await r.json();
    meta = { kind: "blob", mime: parsed.mime, url: data.url };
  } else {
    meta = { kind: "inline", mime: parsed.mime, b64: parsed.buf.toString("base64") };
  }

  if (!HAS_REDIS) {
    const db = readDev();
    db.imgs[id] = meta;
    writeDev(db);
  } else {
    await redis([["SET", `wish:img:${id}`, JSON.stringify(meta)]]);
  }
  return id;
}

async function loadImage(id) {
  if (!/^[a-f0-9]{12}$/.test(String(id || ""))) return null;
  let meta = null;
  if (!HAS_REDIS) {
    meta = readDev().imgs[id] || null;
  } else {
    const [raw] = await redis([["GET", `wish:img:${id}`]]);
    if (raw) meta = JSON.parse(raw);
  }
  if (!meta) return null;
  if (meta.kind === "inline") {
    return { mime: meta.mime, body: Buffer.from(meta.b64, "base64") };
  }
  if (meta.kind === "blob" && meta.url) {
    const r = await fetch(meta.url, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    return { mime: meta.mime, body: new Uint8Array(await r.arrayBuffer()) };
  }
  return null;
}

const SEED_ITEMS = [
  {
    id: "ad0000000101",
    title: "M1.1 上下文内核收口、隐私闸门与零静默丢失",
    titleEn: "M1.1 Unified Context Kernel, Privacy Gate & Zero Silent Loss",
    desc: "将祖先链、双链解析、记忆挑选、技能卡路径与问答回灌收口为单一 ContextBundle 管道；第 4 篇起双链显式列出绝对路径指针而非静默截断，坏 #^blockId / #标题 显式告警，优先读取未落盘编辑器缓冲，并加入 private: true / 排除目录隐私闸门与单关键词检索补盲。",
    descEn: "Consolidate ancestor chains, wikilinks, memory selection, skill paths, and Q&A threads into a single ContextBundle pipeline; list file-path pointers for 4th+ linked notes instead of silently truncating, warn on broken anchors, read unsaved editor buffers first, and enforce private: true / excluded-folder gates.",
    area: "Agent Deck",
    author: "马自立",
    status: "in_progress",
    authorNote: "",
    images: [],
    createdAt: "2026-11-18T11:30:00.000Z",
    updatedAt: "2026-11-18T11:30:00.000Z",
  },
  {
    id: "ad0000000102",
    title: "M1.2 结构保真、锚点漂移校验与派发前透明预览",
    titleEn: "M1.2 Structural Metadata, Anchor Hash Verification & Pre-Dispatch Preview",
    desc: "提取笔记核心属性摘要（type / def / domain / father / status），为引用块建立软/硬锚点 sha256 漂移校验，提供带 why 信号的一跳结构邻居，并在委派确认框内提供可展开勾选的轻量上下文预览清单。",
    descEn: "Extract key note metadata (type / def / domain / father / status), verify soft/hard anchor hashes against drift, surface 1-hop structural neighbors with human-readable why signals, and add a collapsible context preview & per-item toggle list inside the delegation confirmation modal.",
    area: "Agent Deck",
    author: "马自立",
    status: "planned",
    authorNote: "",
    images: [],
    createdAt: "2026-11-18T11:20:00.000Z",
    updatedAt: "2026-11-18T11:20:00.000Z",
  },
  {
    id: "ad0000000103",
    title: "M1.3 对外供给引擎：纯 Node CLI + stdio Vault Context MCP Server",
    titleEn: "M1.3 External Context Engine: Pure Node CLI + stdio Vault Context MCP",
    desc: "剥离 Obsidian API 的纯 Node 内核，除 memory_search / read / recent 外新增 vault_outline / vault_read / vault_related / vault_find 库级只读工具集，供 Claude Code、Codex、DSH、OpenCode 等任意客户端按需调用。",
    descEn: "Decouple the context kernel from Obsidian APIs to expose vault_outline, vault_read, vault_related, and vault_find alongside memory_search / read / recent over stdio MCP and CLI for any external agent.",
    area: "Agent Deck",
    author: "马自立",
    status: "planned",
    authorNote: "",
    images: [],
    createdAt: "2026-11-18T11:10:00.000Z",
    updatedAt: "2026-11-18T11:10:00.000Z",
  },
  {
    id: "ad0000000104",
    title: "M0 记忆库（一文一条）、派发草稿、回复信箱与按项目目录派发（v1.11.0–v1.12.2）",
    titleEn: "M0 Memory Store, Dispatch Drafts, Reply Inbox & Project-Folder Dispatch (v1.11.0–v1.12.2)",
    desc: "上线一文一条记忆库（Base 表格 / 三列看板 / 逐条审阅 / 来源重锚定）与 memory-query.mjs CLI；支持派发草稿与载荷快照、❓/✍️ 回复协议与非模态回复信箱、按项目目录派发（Codex 自动归组项目）及侧栏「现在」按状态视图。",
    descEn: "Per-note Markdown memory store (Base table / 3-column board / review modal / source re-anchoring) and memory-query.mjs CLI; dispatch drafts & payload snapshots, Q&A reply protocol & non-modal Reply Inbox, project-folder dispatch (with Codex project grouping), and By-status view in Now.",
    area: "Agent Deck",
    author: "马自立",
    status: "done",
    authorNote: "",
    images: [],
    createdAt: "2026-11-18T10:50:00.000Z",
    updatedAt: "2026-11-18T10:50:00.000Z",
  },
  {
    id: "ad0000000001",
    title: "AI 记录母块四视图切换（大纲 / 表格 / 卡片 / 时间线）（v1.10.0）",
    titleEn: "4-View Switcher for AI Record Blocks (Outline / Table / Cards / Timeline) (v1.10.0)",
    desc: "AI 自动记录母块尾部是视图切换入口，支持大纲、表格、卡片、时间线四种展示并记住每个块的偏好，不改写底层 Markdown。",
    descEn: "Switch any AI record parent block between Outline, Table, Cards, and Timeline views inline with per-block persistence, without altering underlying Markdown.",
    area: "Agent Deck",
    author: "马自立",
    status: "done",
    authorNote: "",
    images: [],
    createdAt: "2026-11-15T09:50:00.000Z",
    updatedAt: "2026-11-15T09:50:00.000Z",
  },
  {
    id: "ad0000000002",
    title: "更多 Agent 与终端生态扩展（Hermes / 千问 / Kimi / MiniMax / Muse / Pi）",
    titleEn: "Expanded Agent & Terminal Matrix (Hermes / Qwen / Kimi / MiniMax / Muse / Pi)",
    desc: "Grok Bot（Sand）追踪已上线；持续接入 Hermes Agent、千问、Kimi Code、ZCode、MiniMax Code、Muse、Pi 与更多终端（Ghostty / WezTerm / Kitty / Alacritty / cmux）。",
    descEn: "Grok Bot (Sand) tracking is live; expanding support to Hermes Agent, Qwen, Kimi Code, ZCode, MiniMax Code, Muse, Pi, and more terminals (Ghostty / WezTerm / Kitty / Alacritty / cmux).",
    area: "Agent Deck",
    author: "马自立",
    status: "planned",
    authorNote: "",
    images: [],
    createdAt: "2026-11-15T09:40:00.000Z",
    updatedAt: "2026-11-18T11:00:00.000Z",
  },
  {
    id: "ad0000000003",
    title: "Windows 端完整适配",
    titleEn: "Full Windows Compatibility & Verification",
    desc: "补齐 Windows 环境下的会话日志路径探测、CLI 执行兼容、跨平台脚本路径转义与桌面端窗口联动。",
    descEn: "Complete session log discovery, CLI execution compatibility, cross-platform script path escaping, and desktop app window handoff on Windows.",
    area: "Agent Deck",
    author: "马自立",
    status: "planned",
    authorNote: "",
    images: [],
    createdAt: "2026-11-15T09:30:00.000Z",
    updatedAt: "2026-11-15T09:30:00.000Z",
  },
  {
    id: "ad0000000005",
    title: "行为数据分析与反馈闭环",
    titleEn: "Behavioral Analytics & Review Feedback Loop",
    desc: "结合每日螺旋轨迹、DOING 用时记录与中断快照，统计专注分布与延期规律并给出复盘反馈。",
    descEn: "Combine daily spiral trajectories, DOING active durations, and interruption snapshots to analyze focus patterns and postponement habits.",
    area: "螺旋日程",
    author: "马自立",
    status: "planned",
    authorNote: "",
    images: [],
    createdAt: "2026-11-15T09:10:00.000Z",
    updatedAt: "2026-11-15T09:10:00.000Z",
  },
  {
    id: "ad0000000006",
    title: "Cursor 桌面端（3.30.14+）会话追踪（v1.9.8）",
    titleEn: "Cursor Desktop (3.30.14+) Session Tracking (v1.9.8)",
    desc: "基于 Cursor 桌面端 Hooks 与增量扫描只读追踪对话轮次、工具活动与状态回写。",
    descEn: "Read-only tracking of Cursor Desktop conversation turns, tool activity, and status write-backs via Hooks and incremental scanning.",
    area: "Agent Deck",
    author: "马自立",
    status: "done",
    authorNote: "",
    images: [],
    createdAt: "2026-11-15T11:40:00.000Z",
    updatedAt: "2026-11-15T11:40:00.000Z",
  },
  {
    id: "ad0000000007",
    title: "AI 记录项目名前缀与「最近的会话」折叠改版（v1.9.8）",
    titleEn: "Project Prefix for AI Records & Collapsible Recent Sessions (v1.9.8)",
    desc: "自动记录标题统一为「项目名 -> 标题」；最近的会话支持 7/30/120 天窗口、按 Agent 默认叠放和视口锚定。",
    descEn: "Auto-logged titles use 'Project -> Title'; Recent Sessions supports 7/30/120-day windows, per-agent stacking, and viewport anchoring.",
    area: "Agent Deck",
    author: "马自立",
    status: "done",
    authorNote: "",
    images: [],
    createdAt: "2026-11-15T11:30:00.000Z",
    updatedAt: "2026-11-15T11:30:00.000Z",
  },
  {
    id: "ad0000000008",
    title: "后台长回答 500 字自动分流与设置页精简（v1.9.8）",
    titleEn: "Auto-Routing Background Answers >500 Chars & Streamlined 5-Tab Settings (v1.9.8)",
    desc: "普通结论默认约 350 字，超过 500 字的后台回答沉淀到 Agent Deck/Answers/；设置页收拢为 5 页。",
    descEn: "Background answers under 500 chars write inline while longer replies save full notes to Agent Deck/Answers/; settings consolidated into 5 tabs.",
    area: "Agent Deck",
    author: "马自立",
    status: "done",
    authorNote: "",
    images: [],
    createdAt: "2026-11-15T11:20:00.000Z",
    updatedAt: "2026-11-15T11:20:00.000Z",
  },
  {
    id: "ad0000000009",
    title: "Obsidian 空闲性能优化与专注计数",
    titleEn: "Obsidian Idle CPU Optimization & Focus Counter",
    desc: "后台暂停循环动画并取消 DOING 旋转，降低空闲功耗；Chrome 书签改手动同步，补充前台 App 专注计数与中断快照。",
    descEn: "Pause background loop animations to reduce idle power usage; switch Chrome bookmarks to manual sync and add foreground app focus counters.",
    area: "螺旋日程",
    author: "马自立",
    status: "in_progress",
    authorNote: "",
    images: [],
    createdAt: "2026-11-15T11:10:00.000Z",
    updatedAt: "2026-11-15T11:10:00.000Z",
  },
  {
    id: "ad000000000a",
    title: "摘要链接可点击与 token 显示兼容（v1.9.7）",
    titleEn: "Clickable Short Links in Summaries & Unified Token Display (v1.9.7)",
    desc: "任务与结论摘要里的长网址与文件路径改为可点击 [🔗](完整地址)；补全并协调与螺旋日程的 token 显示口径。",
    descEn: "Fold long URLs and file paths in summaries into clickable [🔗](url) links and unify token accounting with Nautilus Spiral.",
    area: "Agent Deck",
    author: "马自立",
    status: "done",
    authorNote: "",
    images: [],
    createdAt: "2026-11-15T10:40:00.000Z",
    updatedAt: "2026-11-15T10:40:00.000Z",
  },
  {
    id: "ad000000000b",
    title: "AI 协作回顾 Dashboard（v1.9.6）",
    titleEn: "AI Collaboration Review Dashboard (v1.9.6)",
    desc: "上线 GitHub 风格每日 token 热力图与项目投入排行，支持 7/30/90 天及自定义区间汇总、回溯来源日记块与原会话。",
    descEn: "GitHub-style daily token heatmap, 24-hour concurrency rhythm, model breakdown, and project leaderboard with source block jump.",
    area: "Agent Deck",
    author: "马自立",
    status: "done",
    authorNote: "",
    images: [],
    createdAt: "2026-11-15T10:30:00.000Z",
    updatedAt: "2026-11-15T10:30:00.000Z",
  },
  {
    id: "ad000000000c",
    title: "OpenCode / Qoder 委派归档与三段式总结（v1.9.3–v1.9.6）",
    titleEn: "OpenCode / Qoder Delegation, Archiving & Structured Summaries (v1.9.3–v1.9.6)",
    desc: "打通 OpenCode 与 Qoder 桌面追踪及后台委派；完整原文归档到 Conversations，总结模型提炼“结论、改动、未完成”。",
    descEn: "Desktop tracking and background delegation for OpenCode and Qoder, archiving full transcripts to Conversations with structured summaries.",
    area: "Agent Deck",
    author: "马自立",
    status: "done",
    authorNote: "",
    images: [],
    createdAt: "2026-11-14T18:00:00.000Z",
    updatedAt: "2026-11-14T18:00:00.000Z",
  },
  {
    id: "ad000000000d",
    title: "精简执行入口与 Antigravity / DSH 日志（v2.3.0–v2.4.0）",
    titleEn: "Streamlined Execution & Antigravity / DSH Log Support (v2.3.0–v2.4.0)",
    desc: "支持读取 Antigravity 与 DSH 会话日志；2.4.0 移除冗余专注弹窗与全局预设快捷键，把常用快捷键优先让给 Agent Deck。",
    descEn: "Read Antigravity and DSH session logs; remove redundant focus dialogs and default global hotkeys in 2.4.0 in favor of Agent Deck.",
    area: "螺旋日程",
    author: "马自立",
    status: "done",
    authorNote: "",
    images: [],
    createdAt: "2026-11-14T16:00:00.000Z",
    updatedAt: "2026-11-14T16:00:00.000Z",
  },
  {
    id: "afbb50626f33",
    title: "原地分形看板与多 Agent 协作工作台（v1.10.0–v1.10.5）",
    titleEn: "In-Place Fractal Boards & Multi-Agent Project Workbench (v1.10.0–v1.10.5)",
    desc: "父块原地切换看板，支持按状态/子组列、Zoom 面包屑、镜像卡、跨列拖拽与列内排序、pin、多选批量状态/置顶/删除、列高收敛、Markdown 卡面与右键菜单；项目工作台提供小队预设、Copilot 拆解、并发派发与 Steward 波次收口。",
    descEn: "Toggle any parent task into a 2D board with By-status / By-group columns, recursive Zoom breadcrumbs, mirror cards, drag-and-drop, pinning, bulk actions, and Markdown card rendering; Project Workbench adds team presets, Copilot task decomposition, concurrent dispatch, and Steward wave wrap-up.",
    area: "Agent Deck",
    author: "马自立",
    status: "done",
    authorNote: "",
    images: [],
    createdAt: "2026-11-16T15:45:00.000Z",
    updatedAt: "2026-11-16T15:45:00.000Z",
  },
  {
    id: "d0e3b04d1404",
    title: "大纲多选、合并成组与批量改状态（v1.10.3）",
    titleEn: "Outline Multi-Select, Group Rows & Bulk Status Switch (v1.10.3)",
    desc: "拖拽框选、跨层选区与多光标都能一次改任务状态；⌥⌘↓ 把选中记录合并成组，⌥⌘↑ 跳到母块；整批单步撤销，AI 条目人工锁定照常。",
    descEn: "Bulk-change task statuses across drag selections or multi-cursors in a single undo step; ⌥⌘↓ groups selected AI records under a new parent block, ⌥⌘↑ jumps to parent.",
    area: "Agent Deck",
    author: "马自立",
    status: "done",
    authorNote: "",
    images: [],
    createdAt: "2026-11-16T15:30:00.000Z",
    updatedAt: "2026-11-16T15:30:00.000Z",
  },
  {
    id: "6806931cd2c1",
    title: "自动记录默认开启、缺日记自动创建与首次只补 10 轮（v1.10.4）",
    titleEn: "Auto-Journaling On by Default, Daily Note Creation & 10-Round Initial Window (v1.10.4)",
    desc: "自动会话记录默认开启、扫描间隔 30 秒；当天日记不存在时按模板创建；首次接入某个会话只补最近 10 轮；任务关键词配色与图标支持 TODOseq 让位。",
    descEn: "Auto-journaling enabled by default with 30s polling; auto-creates missing daily notes from templates; caps first-time session backfill to 10 rounds; Logseq-style keyword colors & icons.",
    area: "Agent Deck",
    author: "马自立",
    status: "done",
    authorNote: "",
    images: [],
    createdAt: "2026-11-16T15:15:00.000Z",
    updatedAt: "2026-11-16T15:15:00.000Z",
  }
];

const REMOVED_SEED_IDS = ["ad0000000004"];
let seedChecked = false;

async function ensureSeeded() {
  if (!HAS_REDIS) {
    const db = readDev();
    let changed = false;
    if (!db.seededV1) {
      for (const it of SEED_ITEMS) {
        if (!db.items[it.id]) {
          db.ids.push(it.id);
          db.items[it.id] = { ...it };
          db.votes[it.id] = [];
        }
      }
      db.seededV1 = true;
      changed = true;
    }
    if (!db.seededV2) {
      for (const id of REMOVED_SEED_IDS) {
        delete db.items[id];
        delete db.votes[id];
        db.ids = db.ids.filter((x) => x !== id);
      }
      db.seededV2 = true;
      changed = true;
    }
    if (!db.seededV3) {
      for (const it of SEED_ITEMS) {
        if (!db.items[it.id]) {
          db.ids.unshift(it.id);
          db.items[it.id] = { ...it };
          db.votes[it.id] = [];
        } else {
          db.items[it.id].title = it.title;
          db.items[it.id].desc = it.desc;
          db.items[it.id].titleEn = it.titleEn;
          db.items[it.id].descEn = it.descEn;
        }
      }
      db.seededV3 = true;
      changed = true;
    }
    if (changed) writeDev(db);
    return null;
  }
  if (seedChecked) return null;
  const [claimed, cleanClaim, claimV3, existing] = await redis([
    ["SET", "wish:seeded:v1", "1", "NX"],
    ["SET", "wish:seeded:v2", "1", "NX"],
    ["SET", "wish:seeded:v3", "1", "NX"],
    ["LRANGE", "wish:ids", 0, MAX_ITEMS - 1],
  ], 1);
  const cmds = [];
  if (claimed === "OK") {
    const have = new Set(existing || []);
    for (const it of SEED_ITEMS) {
      if (have.has(it.id)) continue;
      cmds.push(["SETNX", `wish:item:${it.id}`, JSON.stringify(it)]);
      cmds.push(["RPUSH", "wish:ids", it.id]);
    }
  }
  if (cleanClaim === "OK") {
    for (const id of REMOVED_SEED_IDS) {
      cmds.push(["LREM", "wish:ids", 0, id]);
      cmds.push(["DEL", `wish:item:${id}`, `wish:votes:${id}`]);
    }
  }
  if (claimV3 === "OK") {
    const have = new Set(existing || []);
    for (const it of [...SEED_ITEMS].reverse()) {
      cmds.push(["SET", `wish:item:${it.id}`, JSON.stringify(it)]);
      if (!have.has(it.id)) {
        cmds.push(["LPUSH", "wish:ids", it.id]);
      }
    }
  }
  if (cmds.length) {
    cmds.push(["LRANGE", "wish:ids", 0, MAX_ITEMS - 1]);
    const res = await redis(cmds);
    seedChecked = true;
    return res[res.length - 1] || [];
  }
  seedChecked = true;
  return existing || [];
}

async function listItems(voterId, includePrivate = false, ip = "") {
  const prefetchedIds = await ensureSeeded();
  const ik = ipHash(ip);
  const expose = (it) => {
    if (includePrivate) return it;
    const { contact: _contact, ...pub } = it;
    return pub;
  };
  if (!HAS_REDIS) {
    const db = readDev();
    const voteIps = db.voteIps || {};
    return db.ids
      .map((id) => {
        const it = db.items[id];
        if (!it) return null;
        const set = db.votes[id] || [];
        const ipSet = voteIps[id] || [];
        const voted = Boolean((voterId && set.includes(voterId)) || (ik && ipSet.includes(ik)));
        return { ...expose(it), votes: set.length, voted };
      })
      .filter(Boolean);
  }
  const ids = prefetchedIds ?? (await redis([["LRANGE", "wish:ids", 0, MAX_ITEMS - 1]], 1))[0];
  if (!ids || !ids.length) return [];
  const cmds = [];
  for (const id of ids) {
    cmds.push(["GET", `wish:item:${id}`]);
    cmds.push(["SCARD", `wish:votes:${id}`]);
    if (voterId) cmds.push(["SISMEMBER", `wish:votes:${id}`, voterId]);
    if (ik) cmds.push(["SISMEMBER", `wish:voteips:${id}`, ik]);
  }
  const res = await redis(cmds, 1);
  const step = 2 + (voterId ? 1 : 0) + (ik ? 1 : 0);
  const items = [];
  for (let i = 0; i < ids.length; i++) {
    const base = i * step;
    const raw = res[base];
    if (!raw) continue;
    try {
      const it = JSON.parse(raw);
      const votes = Number(res[base + 1] || 0);
      let idx = base + 2;
      const byVoter = voterId ? res[idx++] === 1 : false;
      const byIp = ik ? res[idx++] === 1 : false;
      items.push({ ...expose(it), votes, voted: byVoter || byIp });
    } catch {}
  }
  return items;
}

async function createItem(body, voterId, ip) {
  if (String(body.website || "").trim()) {
    return Response.json({ ok: true, ignored: true }, { status: 201 });
  }
  if (!(await checkLimit("post", ip, MAX_POST_PER_IP))) {
    return Response.json({ error: "今天提交的次数有点多，明天再来吧" }, { status: 429 });
  }
  const title = String(body.title || "").trim();
  const desc = String(body.desc || "").trim();
  const area = AREAS.has(body.area) ? body.area : "Agent Deck";
  const author = String(body.author || "").trim().slice(0, 24) || "匿名用户";
  const contact = String(body.contact || "").trim().slice(0, 80);
  if (title.length < 2 || title.length > 80) {
    return Response.json({ error: "标题请控制在 2–80 个字之间" }, { status: 400 });
  }
  if (desc.length > 1200) {
    return Response.json({ error: "描述最多 1200 个字" }, { status: 400 });
  }

  const rawImgs = Array.isArray(body.images) ? body.images.slice(0, 2) : [];
  const imgIds = [];
  for (const item of rawImgs) {
    const parsed = parseDataUrl(item?.dataUrl ?? item);
    if (!parsed) {
      return Response.json({ error: "截图格式不支持或单张超过 600KB" }, { status: 400 });
    }
    imgIds.push(await saveImage(parsed));
  }

  const id = newId();
  const now = new Date().toISOString();
  const item = {
    id,
    title,
    desc,
    area,
    author,
    contact,
    status: "pending",
    authorNote: "",
    images: imgIds,
    createdAt: now,
    updatedAt: now,
  };

  const ik = ipHash(ip);
  if (!HAS_REDIS) {
    const db = readDev();
    db.ids.unshift(id);
    db.items[id] = item;
    db.votes[id] = voterId ? [voterId] : [];
    db.voteIps ||= {};
    db.voteIps[id] = voterId && ik ? [ik] : [];
    writeDev(db);
  } else {
    const cmds = [
      ["SET", `wish:item:${id}`, JSON.stringify(item)],
      ["LPUSH", "wish:ids", id],
      ["LTRIM", "wish:ids", 0, MAX_ITEMS - 1],
    ];
    if (voterId) {
      cmds.push(["SADD", `wish:votes:${id}`, voterId]);
      if (ik) cmds.push(["SADD", `wish:voteips:${id}`, ik]);
    }
    await redis(cmds);
  }
  const { contact: _contact, ...pubItem } = item;
  return Response.json({ item: { ...pubItem, votes: voterId ? 1 : 0, voted: Boolean(voterId) } }, { status: 201 });
}

async function toggleVote(body, voterId, ip) {
  const id = String(body.id || "").trim();
  if (!/^[a-f0-9]{12}$/.test(id) || !voterId) {
    return Response.json({ error: "参数无效" }, { status: 400 });
  }
  if (!(await checkLimit("vote", ip, MAX_VOTE_PER_IP))) {
    return Response.json({ error: "操作太频繁，请稍后再试" }, { status: 429 });
  }
  const ik = ipHash(ip);
  if (!HAS_REDIS) {
    const db = readDev();
    if (!db.items[id]) return Response.json({ error: "条目不存在" }, { status: 404 });
    const set = (db.votes[id] ||= []);
    db.voteIps ||= {};
    const ipSet = (db.voteIps[id] ||= []);
    if (set.includes(voterId) || (ik && ipSet.includes(ik))) {
      return Response.json({ id, votes: set.length, voted: true, alreadyVoted: true });
    }
    set.push(voterId);
    if (ik) ipSet.push(ik);
    writeDev(db);
    return Response.json({ id, votes: set.length, voted: true, alreadyVoted: false });
  }
  const checkCmds = [
    ["EXISTS", `wish:item:${id}`],
    ["SISMEMBER", `wish:votes:${id}`, voterId],
  ];
  if (ik) checkCmds.push(["SISMEMBER", `wish:voteips:${id}`, ik]);
  const checkRes = await redis(checkCmds);
  const exists = checkRes[0];
  const already = checkRes[1] === 1 || (ik && checkRes[2] === 1);
  if (!exists) return Response.json({ error: "条目不存在" }, { status: 404 });
  if (already) {
    const [votes] = await redis([["SCARD", `wish:votes:${id}`]]);
    return Response.json({ id, votes: Number(votes || 0), voted: true, alreadyVoted: true });
  }
  const addCmds = [["SADD", `wish:votes:${id}`, voterId]];
  if (ik) addCmds.push(["SADD", `wish:voteips:${id}`, ik]);
  addCmds.push(["SCARD", `wish:votes:${id}`]);
  const addRes = await redis(addCmds);
  const votes = addRes[addRes.length - 1];
  return Response.json({ id, votes: Number(votes || 0), voted: true, alreadyVoted: false });
}

function isAdmin(req) {
  if (!ADMIN_TOKEN) return false;
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token || token.length !== ADMIN_TOKEN.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(ADMIN_TOKEN));
}

function checkAdmin(req) {
  if (!ADMIN_TOKEN) return Response.json({ error: "服务端未配置 WISHLIST_ADMIN_TOKEN" }, { status: 503 });
  return isAdmin(req) ? null : Response.json({ error: "管理口令不对" }, { status: 401 });
}

export async function GET(request) {
  try {
    const u = new URL(request.url);
    const imgId = u.searchParams.get("img");
    if (imgId) {
      const img = await loadImage(imgId);
      if (!img) return new Response("Not found", { status: 404 });
      return new Response(img.body, {
        headers: {
          "Content-Type": img.mime,
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
    const voterId = cleanVoter(u.searchParams.get("voterId") || request.headers.get("x-voter-id"));
    const admin = isAdmin(request);
    const items = await listItems(voterId, admin, clientIp(request));
    return Response.json({ items, isAdmin: admin }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "读取心愿单失败" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return Response.json({ error: "请求体格式错误" }, { status: 400 });
    }
    const voterId = cleanVoter(body.voterId || request.headers.get("x-voter-id"));
    const ip = clientIp(request);
    if (body.action === "vote") return await toggleVote(body, voterId, ip);
    return await createItem(body, voterId, ip);
  } catch (e) {
    console.error(e);
    return Response.json({ error: String(e.message || "提交失败").slice(0, 160) }, { status: 500 });
  }
}

export async function PATCH(request) {
  const denied = checkAdmin(request);
  if (denied) return denied;
  try {
    const body = await request.json().catch(() => null);
    const id = String(body?.id || "").trim();
    if (!/^[a-f0-9]{12}$/.test(id)) return Response.json({ error: "参数无效" }, { status: 400 });

    const update = (it) => {
      if (body.status && STATUSES.has(body.status)) it.status = body.status;
      if (typeof body.authorNote === "string") it.authorNote = body.authorNote.trim().slice(0, 300);
      it.updatedAt = new Date().toISOString();
      return it;
    };

    if (!HAS_REDIS) {
      const db = readDev();
      if (!db.items[id]) return Response.json({ error: "条目不存在" }, { status: 404 });
      const it = update(db.items[id]);
      writeDev(db);
      return Response.json({ item: it });
    }
    const [raw] = await redis([["GET", `wish:item:${id}`]]);
    if (!raw) return Response.json({ error: "条目不存在" }, { status: 404 });
    const it = update(JSON.parse(raw));
    await redis([["SET", `wish:item:${id}`, JSON.stringify(it)]]);
    return Response.json({ item: it });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(request) {
  const denied = checkAdmin(request);
  if (denied) return denied;
  try {
    const u = new URL(request.url);
    const id = String(u.searchParams.get("id") || "").trim();
    if (!/^[a-f0-9]{12}$/.test(id)) return Response.json({ error: "参数无效" }, { status: 400 });

    if (!HAS_REDIS) {
      const db = readDev();
      const it = db.items[id];
      if (!it) return Response.json({ error: "条目不存在" }, { status: 404 });
      for (const imgId of it.images || []) delete db.imgs[imgId];
      delete db.items[id];
      delete db.votes[id];
      if (db.voteIps) delete db.voteIps[id];
      db.ids = db.ids.filter((x) => x !== id);
      writeDev(db);
      return Response.json({ ok: true });
    }
    const [raw] = await redis([["GET", `wish:item:${id}`]]);
    if (!raw) return Response.json({ error: "条目不存在" }, { status: 404 });
    const it = JSON.parse(raw);
    const cmds = [
      ["LREM", "wish:ids", 0, id],
      ["DEL", `wish:item:${id}`, `wish:votes:${id}`, `wish:voteips:${id}`],
    ];
    for (const imgId of it.images || []) cmds.push(["DEL", `wish:img:${imgId}`]);
    await redis(cmds);
    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "删除失败" }, { status: 500 });
  }
}
