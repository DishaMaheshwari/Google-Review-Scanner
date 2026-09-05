import { NextResponse } from "next/server";

import {
  ConfigurationError,
  EmptyGenerationError,
  generateReview,
} from "@/lib/openai";
import { getClientKey, rateLimit } from "@/lib/rate-limit";
import { parseGenerateReviewRequest } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Enough for a first draft plus a healthy number of regenerations. */
const LIMIT = 15;
const WINDOW_MS = 10 * 60 * 1000;

/**
 * The single message customers see for every server-side failure. Technical
 * detail stays in the server log — never in the response body.
 */
const GENERIC_ERROR =
  "Something went wrong while creating your review. Please try again.";

export async function POST(request: Request) {
  const limited = rateLimit({
    key: getClientKey(request.headers),
    scope: "generate-review",
    limit: LIMIT,
    windowMs: WINDOW_MS,
  });

  if (!limited.allowed) {
    return NextResponse.json(
      {
        error: "rate_limited",
        message: "That's a lot of reviews. Please wait a moment and try again.",
      },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_request", message: GENERIC_ERROR },
      { status: 400 },
    );
  }

  const parsed = parseGenerateReviewRequest(body);
  if (!parsed.ok) {
    console.warn("[generate-review] Rejected request:", parsed.error);
    return NextResponse.json(
      { error: "invalid_request", message: GENERIC_ERROR },
      { status: 400 },
    );
  }

  // A low rating must never be turned into a positive review. The UI does not
  // offer this path, so reaching it means the request did not come from the UI.
  if (parsed.data.rating < 4) {
    return NextResponse.json(
      {
        error: "rating_too_low",
        message:
          "We only help write reviews for good experiences. Tell us what went wrong instead.",
      },
      { status: 400 },
    );
  }

  try {
    const review = await generateReview(parsed.data);
    return NextResponse.json({ review });
  } catch (error) {
    if (error instanceof ConfigurationError) {
      // Loud in development so the owner can fix it; opaque in production.
      console.error("[generate-review] Configuration error:", error.message);
      return NextResponse.json(
        {
          error: "not_configured",
          message:
            process.env.NODE_ENV === "development"
              ? error.message
              : GENERIC_ERROR,
        },
        { status: 503 },
      );
    }

    if (error instanceof EmptyGenerationError) {
      console.error("[generate-review] Model returned an empty review.");
      return NextResponse.json(
        { error: "generation_failed", message: GENERIC_ERROR },
        { status: 502 },
      );
    }

    console.error("[generate-review] Generation failed:", error);
    return NextResponse.json(
      { error: "generation_failed", message: GENERIC_ERROR },
      { status: 502 },
    );
  }
}
