/**
 * ─────────────────────────────────────────────────────────────
 *  EDIT THIS FILE TO CONFIGURE THE BUSINESS.
 *  Everything customer-facing about the brand lives here.
 * ─────────────────────────────────────────────────────────────
 */

export const business = {
  /** Shown in the header and page title. */
  name: "Aqua Spring Water Supply",

  /** One line under the name. Keep it under ~45 characters. */
  tagline: "Packaged drinking water · cans for events & offices",

  /** Used in the AI prompt as background context. Plain and factual. */
  description:
    "Drinking water can supply for weddings, functions, gatherings, events and offices, with an in-house filtration and purification setup.",

  /**
   * Where the customer is sent to post their review.
   * Set NEXT_PUBLIC_GOOGLE_REVIEW_URL in your environment — never hardcode it here.
   */
  googleReviewUrl: process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL,
} as const;

/**
 * Returns the Google review URL only if it is present and is a real http(s)
 * URL. Anything else returns null so the UI can show a configuration notice
 * instead of rendering a button that goes nowhere.
 */
export function getGoogleReviewUrl(): string | null {
  const raw = business.googleReviewUrl?.trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null;
  }
}
