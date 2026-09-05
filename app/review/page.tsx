import { ReviewFlow } from "@/components/review/ReviewFlow";
import { getGoogleReviewUrl } from "@/lib/business";

/**
 * The page customers land on from the printed QR code.
 *
 * The Google URL is resolved and validated here, on the server, so the client
 * receives either a usable URL or null — never something half-configured.
 */
export default function ReviewPage() {
  return <ReviewFlow googleReviewUrl={getGoogleReviewUrl()} />;
}
