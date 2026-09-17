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
 * No database, per the brief — Vercel's serverless functions have no
 * persistent disk to write to anyway, so there is nowhere local a spreadsheet
 * file could even live between requests. Feedback is written to the server
 * log, which on Vercel means it shows up under Project → Logs. Two separate,
 * optional webhooks can forward it elsewhere:
 *
 * - FEEDBACK_WEBHOOK_URL: a chat notification (Slack/Google Chat incoming
 *   webhook), posted as {"text": "..."}.
 * - FEEDBACK_SHEET_URL: a Google Apps Script Web App URL that appends a row
 *   to a Google Sheet, so feedback accumulates in one place you can read,
 *   sort or open in Excel. See README "Recording feedback in a spreadsheet".
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

  const at = new Date().toISOString();

  const webhook = process.env.FEEDBACK_WEBHOOK_URL?.trim();
  const sheetWebhook = process.env.FEEDBACK_SHEET_URL?.trim();

  // Independent destinations: one failing must never stop the other, and
  // neither should block the response the customer is waiting on for long.
  await Promise.all([
    webhook
      ? fetch(webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: `New ${rating}-star feedback: ${message}`,
          }),
          signal: AbortSignal.timeout(5000),
        }).catch((error) => {
          // The customer has done their part; a webhook failure is ours to fix.
          console.error("[customer-feedback] Chat webhook delivery failed:", error);
        })
      : Promise.resolve(),

    sheetWebhook
      ? fetch(sheetWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating, message, at }),
          signal: AbortSignal.timeout(5000),
        }).catch((error) => {
          console.error("[customer-feedback] Sheet webhook delivery failed:", error);
        })
      : Promise.resolve(),
  ]);

  return NextResponse.json({ ok: true });
}
