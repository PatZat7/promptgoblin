import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

const SITE_HOST = "promptgoblin.io";
const KEY_LOCATION = `https://${SITE_HOST}/indexnow.txt`;
const MAX_URLS = 100;

/** Key lives in public/indexnow.txt (served at /indexnow.txt — the protocol
 *  requires it to be publicly fetchable, so it is not a secret). Env wins if set. */
async function getKey(): Promise<string | null> {
  const envKey = process.env.BING_INDEXNOW_KEY?.trim();
  if (envKey && /^[a-fA-F0-9-]{8,128}$/.test(envKey)) return envKey;
  try {
    const file = path.join(process.cwd(), "public", "indexnow.txt");
    const fileKey = (await readFile(file, "utf-8")).trim();
    return /^[a-fA-F0-9-]{8,128}$/.test(fileKey) ? fileKey : null;
  } catch {
    return null;
  }
}

/** Only same-site https URLs may be submitted — prevents this endpoint being
 *  abused to spam IndexNow (and burn our key's reputation) with foreign URLs. */
function ownSiteUrls(urlList: unknown[]): string[] {
  const seen = new Set<string>();
  for (const raw of urlList) {
    if (typeof raw !== "string") continue;
    try {
      const u = new URL(raw);
      const host = u.hostname.replace(/^www\./, "");
      if (u.protocol === "https:" && host === SITE_HOST) seen.add(u.href);
    } catch {
      /* skip invalid URL */
    }
    if (seen.size >= MAX_URLS) break;
  }
  return [...seen];
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || !Array.isArray(body.urlList) || !body.urlList.length) {
      return NextResponse.json({ error: "Missing urlList" }, { status: 400 });
    }

    const urlList = ownSiteUrls(body.urlList);
    if (!urlList.length) {
      return NextResponse.json(
        { error: `urlList must contain https://${SITE_HOST}/... URLs only` },
        { status: 400 },
      );
    }

    const key = await getKey();
    if (!key) {
      return NextResponse.json(
        { error: "IndexNow key not configured" },
        { status: 500 },
      );
    }

    const response = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: SITE_HOST,
        key,
        keyLocation: KEY_LOCATION,
        urlList,
      }),
    });

    const text = await response.text();
    return NextResponse.json(
      { status: response.status, submitted: urlList.length, upstream: text || null },
      { status: response.ok ? 200 : response.status, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "IndexNow submission failed" },
      { status: 500 },
    );
  }
}
