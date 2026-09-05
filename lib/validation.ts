import {
  MAX_FEEDBACK_LENGTH,
  MAX_NOTE_LENGTH,
  MAX_PREVIOUS_REVIEWS,
  isLikedAttribute,
  type LikedAttribute,
} from "./attributes";

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export interface GenerateReviewInput {
  rating: number;
  liked: LikedAttribute[];
  note: string;
  /** Earlier drafts, so a regeneration can be made to differ from them. */
  previousReviews: string[];
}

export interface FeedbackInput {
  rating: number;
  message: string;
}

/** Longest earlier draft we will accept back from the client. */
const MAX_PREVIOUS_REVIEW_LENGTH = 600;

/**
 * Strips control characters and collapses all whitespace (including newlines)
 * into single spaces.
 *
 * Collapsing newlines matters for anything that ends up in the prompt: it stops
 * a customer's note from being formatted to look like a new instruction block.
 */
export function sanitizeText(value: string): string {
  return value
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseRating(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  if (value < 1 || value > 5) return null;
  return value;
}

export function parseGenerateReviewRequest(
  body: unknown,
): ValidationResult<GenerateReviewInput> {
  if (!isPlainObject(body)) {
    return { ok: false, error: "Request body must be an object." };
  }

  const rating = parseRating(body.rating);
  if (rating === null) {
    return { ok: false, error: "rating must be a whole number from 1 to 5." };
  }

  if (!Array.isArray(body.liked)) {
    return { ok: false, error: "liked must be an array." };
  }

  // Keep only recognised attributes, and de-duplicate. Unknown values are a
  // malformed request rather than something to silently ignore.
  const liked: LikedAttribute[] = [];
  for (const item of body.liked) {
    if (!isLikedAttribute(item)) {
      return { ok: false, error: "liked contains an unrecognised value." };
    }
    if (!liked.includes(item)) liked.push(item);
  }

  let note = "";
  if (body.note !== undefined && body.note !== null) {
    if (typeof body.note !== "string") {
      return { ok: false, error: "note must be text." };
    }
    if (body.note.length > MAX_NOTE_LENGTH * 2) {
      return { ok: false, error: "note is too long." };
    }
    note = sanitizeText(body.note).slice(0, MAX_NOTE_LENGTH);
  }

  const previousReviews: string[] = [];
  if (body.previousReviews !== undefined && body.previousReviews !== null) {
    if (!Array.isArray(body.previousReviews)) {
      return { ok: false, error: "previousReviews must be an array." };
    }
    for (const item of body.previousReviews.slice(-MAX_PREVIOUS_REVIEWS)) {
      if (typeof item !== "string") {
        return { ok: false, error: "previousReviews must contain text." };
      }
      const cleaned = sanitizeText(item).slice(0, MAX_PREVIOUS_REVIEW_LENGTH);
      if (cleaned) previousReviews.push(cleaned);
    }
  }

  return { ok: true, data: { rating, liked, note, previousReviews } };
}

export function parseFeedbackRequest(
  body: unknown,
): ValidationResult<FeedbackInput> {
  if (!isPlainObject(body)) {
    return { ok: false, error: "Request body must be an object." };
  }

  const rating = parseRating(body.rating);
  if (rating === null) {
    return { ok: false, error: "rating must be a whole number from 1 to 5." };
  }

  if (typeof body.message !== "string") {
    return { ok: false, error: "message must be text." };
  }
  if (body.message.length > MAX_FEEDBACK_LENGTH * 2) {
    return { ok: false, error: "message is too long." };
  }

  const message = sanitizeText(body.message).slice(0, MAX_FEEDBACK_LENGTH);
  if (!message) {
    return { ok: false, error: "message must not be empty." };
  }

  return { ok: true, data: { rating, message } };
}
