"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { track } from "@/lib/analytics";
import {
  MAX_PREVIOUS_REVIEWS,
  POSITIVE_RATING_THRESHOLD,
  type LikedAttribute,
} from "@/lib/attributes";

import { BrandHeader } from "./BrandHeader";
import { LoadingState } from "./LoadingState";
import { ReviewForm } from "./ReviewForm";
import { ReviewResult } from "./ReviewResult";

type Phase = "form" | "generating" | "result";

const GENERIC_ERROR =
  "Something went wrong while creating your review. Please try again.";

interface ReviewFlowProps {
  /** Resolved on the server so the client never has to validate the URL. */
  googleReviewUrl: string | null;
}

export function ReviewFlow({ googleReviewUrl }: ReviewFlowProps) {
  const [phase, setPhase] = useState<Phase>("form");
  const [rating, setRating] = useState<number | null>(null);
  const [liked, setLiked] = useState<LikedAttribute[]>([]);
  const [note, setNote] = useState("");
  const [review, setReview] = useState("");
  const [previousReviews, setPreviousReviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  /**
   * Guards against a double-tap firing two requests. State updates are async,
   * so a ref is the reliable lock here.
   */
  const inFlight = useRef(false);
  const hasStarted = useRef(false);

  useEffect(() => {
    track("page_view");
  }, []);

  const handleRatingChange = useCallback((value: number) => {
    setRating(value);
    setError(null);
    if (!hasStarted.current) {
      hasStarted.current = true;
      track("review_started", { rating: value });
    }
  }, []);

  const handleToggleLiked = useCallback((attribute: LikedAttribute) => {
    setLiked((current) =>
      current.includes(attribute)
        ? current.filter((item) => item !== attribute)
        : [...current, attribute],
    );
  }, []);

  const generate = useCallback(
    async (isRegeneration: boolean) => {
      if (inFlight.current) return;
      if (rating === null || rating < POSITIVE_RATING_THRESHOLD) return;

      inFlight.current = true;
      setIsBusy(true);
      setError(null);
      if (!isRegeneration) setPhase("generating");

      // The draft currently on screen is the one we most need the model to
      // move away from, so it belongs in the history we send.
      const history = (review.trim()
        ? [...previousReviews, review.trim()]
        : previousReviews
      ).slice(-MAX_PREVIOUS_REVIEWS);

      try {
        const response = await fetch("/api/generate-review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating,
            liked,
            note: note.trim(),
            previousReviews: history,
          }),
        });

        const payload: unknown = await response.json().catch(() => null);

        if (!response.ok) {
          // Rate limiting has its own wording; everything else is generic.
          const message =
            response.status === 429 &&
            payload &&
            typeof payload === "object" &&
            "message" in payload &&
            typeof payload.message === "string"
              ? payload.message
              : GENERIC_ERROR;
          throw new Error(message);
        }

        const text =
          payload &&
          typeof payload === "object" &&
          "review" in payload &&
          typeof payload.review === "string"
            ? payload.review.trim()
            : "";

        if (!text) throw new Error(GENERIC_ERROR);

        setPreviousReviews(history);
        setReview(text);
        setPhase("result");
        track(isRegeneration ? "review_regenerated" : "review_generated", {
          rating,
          liked_count: liked.length,
        });

        if (!isRegeneration) window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (caught) {
        const message =
          caught instanceof Error && caught.message ? caught.message : GENERIC_ERROR;
        setError(message);
        // A failed first attempt returns to the form; a failed regeneration
        // keeps the review the customer already has on screen.
        if (!isRegeneration) setPhase("form");
      } finally {
        inFlight.current = false;
        setIsBusy(false);
      }
    },
    [liked, note, previousReviews, rating, review],
  );

  const handleBack = useCallback(() => {
    setPhase("form");
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handlePost = useCallback(() => {
    track("google_button_clicked", { rating: rating ?? 0 });
  }, [rating]);

  return (
    <main className="mx-auto flex w-full max-w-[520px] flex-col gap-8 px-5 pt-10 pb-16">
      <BrandHeader />

      {phase === "generating" ? (
        <LoadingState />
      ) : phase === "result" ? (
        <ReviewResult
          review={review}
          googleReviewUrl={googleReviewUrl}
          isRegenerating={isBusy}
          error={error}
          onReviewChange={setReview}
          onRegenerate={() => void generate(true)}
          onBack={handleBack}
          onPost={handlePost}
        />
      ) : (
        <ReviewForm
          rating={rating}
          liked={liked}
          note={note}
          isSubmitting={isBusy}
          error={error}
          onRatingChange={handleRatingChange}
          onToggleLiked={handleToggleLiked}
          onNoteChange={setNote}
          onSubmit={() => void generate(false)}
        />
      )}
    </main>
  );
}
