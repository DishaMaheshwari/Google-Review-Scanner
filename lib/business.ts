/**
 * ─────────────────────────────────────────────────────────────
 *  EDIT THIS FILE TO CONFIGURE THE BUSINESS.
 *  Everything customer-facing about the brand lives here.
 * ─────────────────────────────────────────────────────────────
 */

export const business = {
  /** Shown in the header and page title. */
  name: "Tankaneer",

  /** One line under the name. Keep it under ~45 characters. */
  tagline: "Premium Drinking Water",

  /** Used in the AI prompt as background context. Plain and factual. */
  description:
    "Drinking water can supply for weddings, functions, gatherings, events and offices, with an in-house filtration and purification setup.",

  /**
   * ─── SEO ───────────────────────────────────────────────────────────────
   * Google ranks a business partly on the words real reviews use. These are
   * fed to the model as *permitted* vocabulary — never as facts to assert.
   * The model still may only describe what the customer actually selected.
   */

  /**
   * How the business would be searched for. Keep every phrase literally true
   * of the business; anything here can end up in a customer's review.
   */
  seoKeywords: [
    "packaged drinking water",
    "water can supply",
    "drinking water cans",
    "bulk water supply",
    "water supplier for events",
    "water cans for weddings and functions",
    "office water supply",
  ],

  /**
   * The town/city or area served, e.g. "Indore" or "South Delhi".
   *
   * Leave this as an empty string unless it is accurate. A place name is the
   * single strongest local-SEO signal in a review, but a wrong one is a false
   * statement in a customer's name — so it is only ever used when set here.
   */
  serviceArea: "Kishangarh",

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
