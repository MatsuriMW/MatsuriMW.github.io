// Vercel Serverless Function: aggregate Outline Journal installer download counts from GitHub Releases

const GH_RELEASES_URL = "https://api.github.com/repos/MatsuriMW/MatsuriMW.github.io/releases?per_page=100";
const CACHE_KEY = "oj:dl:cache";
const RURL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const RTOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

function classifyAsset(name) {
  const lower = String(name || "").toLowerCase();
  if (lower.endsWith(".dmg") || lower.endsWith("-mac.zip")) return "mac";
  if (lower.endsWith(".exe") || lower.endsWith(".msi")) return "win";
  return null;
}

async function redis(cmds) {
  if (!RURL || !RTOKEN) return null;
  const r = await fetch(`${RURL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RTOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cmds),
    signal: AbortSignal.timeout(4000),
  });
  if (!r.ok) return null;
  return r.json();
}

async function fetchGitHubCounts() {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "matsuri-site-downloads",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const res = await fetch(GH_RELEASES_URL, {
    headers,
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}`);
  }
  const releases = await res.json();
  let total = 0;
  let mac = 0;
  let win = 0;
  const byFile = {};

  for (const rel of releases) {
    if (!rel || typeof rel.tag_name !== "string" || !rel.tag_name.startsWith("outline-journal-")) {
      continue;
    }
    for (const asset of rel.assets || []) {
      const platform = classifyAsset(asset?.name);
      if (!platform) continue;
      const count = Number(asset.download_count) || 0;
      total += count;
      if (platform === "mac") mac += count;
      else win += count;
      byFile[asset.name] = (byFile[asset.name] || 0) + count;
    }
  }

  return {
    total,
    mac,
    win,
    byFile,
    updatedAt: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    const payload = await fetchGitHubCounts();
    redis([["SET", CACHE_KEY, JSON.stringify(payload), "EX", "86400"]]).catch(() => {});
    return Response.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" },
    });
  } catch {
    try {
      const cachedRes = await redis([["GET", CACHE_KEY]]);
      const raw = cachedRes?.[0]?.result;
      if (raw) {
        const cached = JSON.parse(raw);
        return Response.json(
          { ...cached, stale: true },
          { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } },
        );
      }
    } catch {
      // Fall through to empty degraded payload
    }
    return Response.json(
      { total: 0, mac: 0, win: 0, byFile: {}, updatedAt: new Date().toISOString(), stale: true },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
