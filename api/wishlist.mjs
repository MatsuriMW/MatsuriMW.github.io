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

async function redis(cmds) {
  const r = await fetch(`${RURL}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${RTOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmds),
    signal: AbortSignal.timeout(5000),
  });
  if (!r.ok) throw new Error(`redis ${r.status}`);
  return (await r.json()).map((x) => {
    if (x.error) throw new Error(`redis ${x.error}`);
    return x.result;
  });
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

async function listItems(voterId) {
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
  const [ids] = await redis([["LRANGE", "wish:ids", 0, MAX_ITEMS - 1]]);
  if (!ids || !ids.length) return [];
  const cmds = [];
  for (const id of ids) {
    cmds.push(["GET", `wish:item:${id}`]);
    cmds.push(["SCARD", `wish:votes:${id}`]);
    if (voterId) cmds.push(["SISMEMBER", `wish:votes:${id}`, voterId]);
  }
  const res = await redis(cmds);
  const step = voterId ? 3 : 2;
  const items = [];
  for (let i = 0; i < ids.length; i++) {
    const raw = res[i * step];
    if (!raw) continue;
    const it = JSON.parse(raw);
    const votes = Number(res[i * step + 1] || 0);
    const voted = voterId ? res[i * step + 2] === 1 : false;
    items.push({ ...it, votes, voted });
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
