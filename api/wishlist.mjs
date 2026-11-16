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
    id: "ad0000000001",
    title: "AI 记录母块四视图切换（大纲 / 表格 / 卡片 / 时间线）（v1.10.0）",
    desc: "AI 自动记录母块尾部是视图切换入口，支持大纲、表格、卡片、时间线四种展示并记住每个块的偏好，不改写底层 Markdown。",
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
    title: "Grok Bot（Sand）会话追踪与 Pi 支持",
    desc: "Grok Bot（Sand）会话追踪已上线；Pi 支持仍在规划中。",
    area: "Agent Deck",
    author: "马自立",
    status: "planned",
    authorNote: "",
    images: [],
    createdAt: "2026-11-15T09:40:00.000Z",
    updatedAt: "2026-11-15T09:40:00.000Z",
  },
  {
    id: "ad0000000003",
    title: "Windows 端完整适配",
    desc: "补齐 Windows 环境下的会话日志路径探测、CLI 执行兼容与桌面端窗口联动。",
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
    desc: "结合每日螺旋轨迹、DOING 用时记录与中断快照，统计专注分布与延期规律并给出复盘反馈。",
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
    desc: "基于 Cursor 桌面端 Hooks 与增量扫描只读追踪对话轮次、工具活动与状态回写。",
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
    desc: "自动记录标题统一为「项目名 -> 标题」；最近的会话支持 7/30/120 天窗口、按 Agent 默认叠放和视口锚定。",
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
    desc: "普通结论默认约 350 字，超过 500 字的后台回答沉淀到 Agent Deck/Answers/；设置页收拢为 5 页。",
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
    desc: "后台暂停循环动画并取消 DOING 旋转，降低空闲功耗；Chrome 书签改手动同步，补充前台 App 专注计数与中断快照。",
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
    desc: "任务与结论摘要里的长网址与文件路径改为可点击 [🔗](完整地址)；补全并协调与螺旋日程的 token 显示口径。",
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
    desc: "上线 GitHub 风格每日 token 热力图与项目投入排行，支持 7/30/90 天及自定义区间汇总、回溯来源日记块与原会话。",
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
    desc: "打通 OpenCode 与 Qoder 桌面追踪及后台委派；完整原文归档到 Conversations，总结模型提炼“结论、改动、未完成”。",
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
    desc: "支持读取 Antigravity 与 DSH 会话日志；2.4.0 移除冗余专注弹窗与全局预设快捷键，把常用快捷键优先让给 Agent Deck。",
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
    desc: "父块原地切换看板，支持按状态/子组列、Zoom 面包屑、镜像卡、跨列拖拽与列内排序、pin、多选批量状态/置顶/删除、列高收敛、Markdown 卡面与右键菜单；项目工作台提供小队预设、Copilot 拆解、并发派发与 Steward 波次收口。",
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
    desc: "拖拽框选、跨层选区与多光标都能一次改任务状态；⌥⌘↓ 把选中记录合并成组，⌥⌘↑ 跳到母块；整批单步撤销，AI 条目人工锁定照常。",
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
    desc: "自动会话记录默认开启、扫描间隔 30 秒；当天日记不存在时按模板创建；首次接入某个会话只补最近 10 轮；任务关键词配色与图标支持 TODOseq 让位。",
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
    if (changed) writeDev(db);
    return null;
  }
  if (seedChecked) return null;
  const [claimed, cleanClaim, existing] = await redis([
    ["SET", "wish:seeded:v1", "1", "NX"],
    ["SET", "wish:seeded:v2", "1", "NX"],
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
  if (cmds.length) {
    cmds.push(["LRANGE", "wish:ids", 0, MAX_ITEMS - 1]);
    const res = await redis(cmds);
    seedChecked = true;
    return res[res.length - 1] || [];
  }
  seedChecked = true;
  return existing || [];
}

async function listItems(voterId) {
  const prefetchedIds = await ensureSeeded();
  if (!HAS_REDIS) {
    const db = readDev();
    return db.ids
      .map((id) => {
        const it = db.items[id];
        if (!it) return null;
        const set = db.votes[id] || [];
        return { ...it, votes: set.length, voted: voterId ? set.includes(voterId) : false };
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
  }
  const res = await redis(cmds, 1);
  const step = voterId ? 3 : 2;
  const items = [];
  for (let i = 0; i < ids.length; i++) {
    const raw = res[i * step];
    if (!raw) continue;
    try {
      const it = JSON.parse(raw);
      const votes = Number(res[i * step + 1] || 0);
      const voted = voterId ? res[i * step + 2] === 1 : false;
      items.push({ ...it, votes, voted });
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
    status: "pending",
    authorNote: "",
    images: imgIds,
    createdAt: now,
    updatedAt: now,
  };

  if (!HAS_REDIS) {
    const db = readDev();
    db.ids.unshift(id);
    db.items[id] = item;
    db.votes[id] = voterId ? [voterId] : [];
    writeDev(db);
  } else {
    const cmds = [
      ["SET", `wish:item:${id}`, JSON.stringify(item)],
      ["LPUSH", "wish:ids", id],
      ["LTRIM", "wish:ids", 0, MAX_ITEMS - 1],
    ];
    if (voterId) cmds.push(["SADD", `wish:votes:${id}`, voterId]);
    await redis(cmds);
  }
  return Response.json({ item: { ...item, votes: voterId ? 1 : 0, voted: Boolean(voterId) } }, { status: 201 });
}

async function toggleVote(body, voterId, ip) {
  const id = String(body.id || "").trim();
  if (!/^[a-f0-9]{12}$/.test(id) || !voterId) {
    return Response.json({ error: "参数无效" }, { status: 400 });
  }
  if (!(await checkLimit("vote", ip, MAX_VOTE_PER_IP))) {
    return Response.json({ error: "操作太频繁，请稍后再试" }, { status: 429 });
  }
  if (!HAS_REDIS) {
    const db = readDev();
    if (!db.items[id]) return Response.json({ error: "条目不存在" }, { status: 404 });
    const set = (db.votes[id] ||= []);
    const idx = set.indexOf(voterId);
    const voted = idx === -1;
    if (voted) set.push(voterId);
    else set.splice(idx, 1);
    writeDev(db);
    return Response.json({ id, votes: set.length, voted });
  }
  const [exists, already] = await redis([
    ["EXISTS", `wish:item:${id}`],
    ["SISMEMBER", `wish:votes:${id}`, voterId],
  ]);
  if (!exists) return Response.json({ error: "条目不存在" }, { status: 404 });
  const voted = already !== 1;
  const [, votes] = await redis([
    [voted ? "SADD" : "SREM", `wish:votes:${id}`, voterId],
    ["SCARD", `wish:votes:${id}`],
  ]);
  return Response.json({ id, votes: Number(votes || 0), voted });
}

function checkAdmin(req) {
  if (!ADMIN_TOKEN) return Response.json({ error: "服务端未配置 WISHLIST_ADMIN_TOKEN" }, { status: 503 });
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token || token.length !== ADMIN_TOKEN.length) return Response.json({ error: "管理口令不对" }, { status: 401 });
  const ok = crypto.timingSafeEqual(Buffer.from(token), Buffer.from(ADMIN_TOKEN));
  return ok ? null : Response.json({ error: "管理口令不对" }, { status: 401 });
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
    const items = await listItems(voterId);
    return Response.json({ items }, { headers: { "Cache-Control": "no-store" } });
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
      db.ids = db.ids.filter((x) => x !== id);
      writeDev(db);
      return Response.json({ ok: true });
    }
    const [raw] = await redis([["GET", `wish:item:${id}`]]);
    if (!raw) return Response.json({ error: "条目不存在" }, { status: 404 });
    const it = JSON.parse(raw);
    const cmds = [
      ["LREM", "wish:ids", 0, id],
      ["DEL", `wish:item:${id}`, `wish:votes:${id}`],
    ];
    for (const imgId of it.images || []) cmds.push(["DEL", `wish:img:${imgId}`]);
    await redis(cmds);
    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "删除失败" }, { status: 500 });
  }
}
