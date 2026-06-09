import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || !Array.isArray(body.urlList) || !body.urlList.length) {
      return NextResponse.json(
        { error: "Missing urlList" },
        { status: 400 },
      );
    }

    const host = new URL(request.url).hostname;
    const key = process.env.BING_INDEXNOW_KEY;

    if (!key) {
      return NextResponse.json(
        { error: "IndexNow key not configured" },
        { status: 500 },
      );
    }

    const response = await fetch("https://www.bing.com/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: body.host ?? host,
        key,
        urlList: body.urlList,
      }),
    });

    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "IndexNow submission failed" },
      { status: 500 },
    );
  }
}
