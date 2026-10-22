import { NextResponse } from "next/server";

const SUBSTACK_FREE_URL = "https://shadmanrahman.substack.com/api/v1/free";
const SOURCE_URL = "https://ceremonies.dev";

/**
 * POST /api/subscribe
 * Adds an email to the Product Field Notes free list on Substack.
 * first_url records ceremonies.dev as the signup source.
 */
export async function POST(req: Request) {
  try {
    const { email } = (await req.json()) as { email?: unknown };

    if (typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email required" },
        { status: 400 },
      );
    }

    const res = await fetch(SUBSTACK_FREE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        first_url: SOURCE_URL,
        first_referrer: SOURCE_URL,
        current_url: SOURCE_URL,
        current_referrer: SOURCE_URL,
      }),
    });

    if (res.ok) {
      return NextResponse.json({ success: true });
    }

    const upstreamBody = await res.text().catch(() => "");
    console.error("subscribe: substack non-ok", {
      status: res.status,
      body: upstreamBody.slice(0, 500),
    });
    return NextResponse.json(
      { error: "Subscription service returned an error" },
      { status: 502 },
    );
  } catch (error: unknown) {
    console.error("subscribe: exception", error);
    return NextResponse.json({ error: "Subscription failed" }, { status: 500 });
  }
}
