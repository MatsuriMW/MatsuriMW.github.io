// 线上入口（Vercel 函数，挂在博客 matsuri.site 下）：/api/policy/<接口> 由博客 vercel.json 改写成 /api/policy?route=<接口>。
// 每位访客一份演示数据：没有 pol_vid cookie 就发一个，记录存 Upstash Redis，7 天不来就过期（见 store.mjs）
import crypto from "node:crypto";
import { route } from "./_policy/api/_lib/router.mjs";
import { withStore } from "./_policy/api/_lib/store.mjs";

export default async function handler(req, res) {
    const u = new URL(req.url, "http://localhost");
    const r = u.searchParams.get("route") ?? u.pathname.replace(/^\/api\/policy\/?/, "");
    let vid = /(?:^|;\s*)pol_vid=([a-f0-9]{16})/.exec(req.headers.cookie || "")?.[1];
    if (!vid) {
        vid = crypto.randomBytes(8).toString("hex");
        res.setHeader("Set-Cookie", `pol_vid=${vid}; Path=/; Max-Age=${7 * 86400}; HttpOnly; Secure; SameSite=Lax`);
    }
    try {
        await withStore(vid, () => route(req, res, `/api/${r}`));
    } catch (e) {
        console.error(e);
        if (!res.headersSent) { res.statusCode = 500; res.setHeader("Content-Type", "application/json; charset=utf-8"); res.end(JSON.stringify({ error: String(e.message || e).slice(0, 300) })); }
        else res.end();
    }
}
