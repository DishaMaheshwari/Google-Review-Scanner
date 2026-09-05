import { NextResponse } from "next/server";

import { getClientKey, rateLimit } from "@/lib/rate-limit";
import { parseFeedbackRequest } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;

/**
 * Records feedback from a 1–3 star rating.
 *
 * No database, per the brief. Feedback is written to the server log, which on
 * Vercel means it shows up under Project → Logs. Set FEEDBACK_WEBHOOK_URL to
 * also forward it somewhere you actually watch (a Slack or Google Chat incoming
 * webhook is the usual choice).
 *
 * We store no name, phone number or email — only the rating and what the
 * customer chose to type.
 */
export async function POST(request: Request) {
  const limited = rateLimit({
    key: getClientKey(request.headers),
    scope: "feedback",
    limit: LIMIT,
    windowMs: WINDOW_MS,
  });

  if (!limited.allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const parsed = parseFeedbackRequest(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { rating, message } = parsed.data;

  console.info(
    "[customer-feedback]",
    JSON.stringify({ rating, message, at: new Date().toISOString() }),
  );

  const webhook = process.env.FEEDBACK_WEBHOOK_URL?.trim();
  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `New ${rating}-star feedback: ${message}`,
        }),
        signal: AbortSignal.timeout(5000),
      });
    } catch (error) {
      // The customer has done their part; a webhook failure is ours to fix.
      console.error("[customer-feedback] Webhook delivery failed:", error);
    }
  }

  return NextResponse.json({ ok: true });
}
