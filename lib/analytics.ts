/**
 * Anonymous event tracking with no dependency and no vendor.
 *
 * If you later add Vercel Analytics or Plausible, their script defines the
 * global this file looks for and events start flowing with no code change.
 * Until then every call is a no-op (a console line in development).
 *
 * Nothing here records names, phone numbers, email addresses, review text or
 * anything else that identifies a person.
 */

export type AnalyticsEvent =
  | "page_view"
  | "review_started"
  | "review_generated"
  | "review_regenerated"
  | "google_button_clicked"
  | "low_rating_feedback_sent";

type Props = Record<string, string | number | boolean>;

interface AnalyticsGlobals {
  va?: (event: "event", payload: { name: string } & Props) => void;
  plausible?: (event: string, options?: { props: Props }) => void;
}

export function track(event: AnalyticsEvent, props: Props = {}): void {
  if (typeof window === "undefined") return;

  const globals = window as unknown as AnalyticsGlobals;

  try {
    if (typeof globals.va === "function") {
      globals.va("event", { name: event, ...props });
      return;
    }
    if (typeof globals.plausible === "function") {
      globals.plausible(event, { props });
      return;
    }
    if (process.env.NODE_ENV === "development") {
      console.debug("[analytics]", event, props);
    }
  } catch {
    // Analytics must never break the review flow.
  }
}
