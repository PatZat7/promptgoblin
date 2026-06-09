import { NextResponse } from 'next/server';
import { SITE } from '@/lib/site';

export const runtime = 'nodejs';

function bad(e: unknown) {
  return { ok: false as const, error: e instanceof Error ? e.message : 'unknown' };
}

async function readKey() {
  const fs = await import('fs/promises');
  const path = await import('path');
  const file = path.join(process.cwd(), 'public', 'indexnow.txt');
  return fs.readFile(file, 'utf-8').catch(() => '');
}

export async function POST() {
  try {
    const key =
      process.env.BING_INDEXNOW_KEY || process.env.NEXT_PUBLIC_BING_INDEXNOW_KEY;

    if (!key) {
      return NextResponse.json(
        { ok: false as const, error: 'missing key' },
        { status: 400 }
      );
    }

    const host = new URL(SITE.url).host;
    const keyLocation = `${SITE.url}/indexnow.txt`;
    const ts = Date.now();
    const version = '1';
    const eventId = `${host}/${ts}`;
    const tag = `promptgoblin-deploy-${ts}`;
    const body = {
      host,
      key,
      keyLocation,
      urlList: [SITE.url, `${SITE.url}/sitemap.xml`, `${SITE.url}/robots.txt`],
      ...(version.trim().length > 0 ? { version } : {}),
      ...(eventId.trim().length > 0 ? { eventId } : {}),
      ...(tag.trim().length > 0 ? { tag } : {}),
    };

    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let parsed: { error?: { code?: string; message?: string } } = {};
    try {
      parsed = JSON.parse(text) as typeof parsed;
    } catch {
      // not JSON; return raw
    }

    if (!res.ok || (parsed.error && parsed.error.code !== '200')) {
      return NextResponse.json(
        { ok: false as const, status: res.status, bing: parsed },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true as const, bing: parsed });
  } catch (err) {
    return NextResponse.json(bad(err), { status: 500 });
  }
}

export async function GET() {
  const key = await readKey();
  return new NextResponse(key, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
