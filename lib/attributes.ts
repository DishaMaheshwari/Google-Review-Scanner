/**
 * The only things a customer can say they liked.
 *
 * This list is the allowlist the API validates against — the client cannot
 * invent new attributes, so no arbitrary text from the browser reaches the
 * model through this field.
 */
export const LIKED_ATTRIBUTES = [
  "Water quality",
  "Cleanliness",
  "Timely delivery",
  "Reliable service",
  "Easy ordering",
  "Availability",
  "Service for our function/event",
  "Overall experience",
] as const;

export type LikedAttribute = (typeof LIKED_ATTRIBUTES)[number];

const LIKED_SET = new Set<string>(LIKED_ATTRIBUTES);

export function isLikedAttribute(value: unknown): value is LikedAttribute {
  return typeof value === "string" && LIKED_SET.has(value);
}

/** Maximum length of the customer's optional free-text note. */
export const MAX_NOTE_LENGTH = 300;

/** Maximum length of the low-rating feedback message. */
export const MAX_FEEDBACK_LENGTH = 1000;

/** How many earlier drafts we send back so a regeneration can avoid them. */
export const MAX_PREVIOUS_REVIEWS = 3;

/** Rating at or above which we offer the review assistant. */
export const POSITIVE_RATING_THRESHOLD = 4;
