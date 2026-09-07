"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { track } from "@/lib/analytics";
import {
  MAX_PREVIOUS_REVIEWS,
  POSITIVE_RATING_THRESHOLD,
  isLikedAttribute,
  type LikedAttribute,
} from "@/lib/attributes";

import { BrandHeader } from "./BrandHeader";
import { LoadingState } from "./LoadingState";
import { ReviewForm } from "./ReviewForm";
import { ReviewResult } from "./ReviewResult";

type Phase = "form" | "generating" | "result";

/**
 * Where the text in the editor came from. In "own" mode the customer is
 * writing from scratch, so there is no draft history to steer away from and
 * nothing on screen that the model produced.
 */
type Mode = "generated" | "own";

/** Per-tab key for the in-progress draft. Cleared when the tab closes. */
const DRAFT_KEY = "review-draft";

interface SavedDraft {
  review: string;
  mode: Mode;
  rating: number | null;
  liked: LikedAttribute[];
  note: string;
}

const GENERIC_ERROR =
  "Something went wrong while creating your review. Please try again.";

interface ReviewFlowProps {
  /** Resolved on the server so the client never has to validate the URL. */
  googleReviewUrl: string | null;
}

export function ReviewFlow({ googleReviewUrl }: ReviewFlowProps) {
  const [phase, setPhase] = useState<Phase>("form");
  const [mode, setMode] = useState<Mode>("generated");
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

  /**
   * True once the restore attempt below has run. Until then we must not save,
   * or the empty initial state would overwrite what we are about to restore.
   */
  const hasRestored = useRef(false);

  useEffect(() => {
    track("page_view");
  }, []);

  /**
   * Coming back from Google must not lose the customer's words.
   *
   * The Post button opens a new tab, but a browser is free to reuse the
   * current one — and on the way back the app remounts with empty state. So
   * the draft is kept in sessionStorage: it survives a round trip, and it is
   * gone when the tab closes. Nothing is sent anywhere, and it is per-tab, so
   * a shared phone does not hand the next customer the last one's review.
   */
  useEffect(() => {
    hasRestored.current = true;
    /*
      set-state-in-effect is disabled deliberately here. sessionStorage cannot
      be read during render — it does not exist on the server, and reading it
      in a lazy initialiser would make the client's first render disagree with
      the server's HTML. Reading it after hydration and setting state once is
      the correct shape for syncing a browser-only store.
    */
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY);
      if (!saved) return;

      const parsed: unknown = JSON.parse(saved);
      if (typeof parsed !== "object" || parsed === null) return;

      const draft = parsed as Partial<SavedDraft>;
      if (typeof draft.review !== "string" || !draft.review.trim()) return;

      setReview(draft.review);
      setMode(draft.mode === "own" ? "own" : "generated");
      if (typeof draft.rating === "number") setRating(draft.rating);
      if (typeof draft.note === "string") setNote(draft.note);
      if (Array.isArray(draft.liked)) {
        setLiked(draft.liked.filter(isLikedAttribute));
      }
      setPhase("result");
    } catch {
      // A malformed or unavailable store is not worth failing the page over.
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!hasRestored.current) return;
    try {
      if (phase === "result" && review.trim()) {
        const draft: SavedDraft = { review, mode, rating, liked, note };
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } else {
        sessionStorage.removeItem(DRAFT_KEY);
      }
    } catch {
      // Private-mode browsers can throw on write. The flow still works.
    }
  }, [liked, mode, note, phase, rating, review]);

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
      // move away from, so it belongs in the history we send — unless the
      // customer wrote it themselves, in which case it is not ours to avoid.
      const history =
        mode === "own"
          ? []
          : (review.trim()
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
        setMode("generated");
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
    [liked, mode, note, previousReviews, rating, review],
  );

  const handleBack = useCallback(() => {
    setPhase("form");
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  /**
   * Skips the model entirely: the customer gets the same editor, the same
   * copy-to-clipboard and the same Post on Google button, starting from a
   * blank box. Nothing is sent to the server on this path.
   */
  const handleWriteOwn = useCallback(() => {
    setMode("own");
    setReview("");
    setPreviousReviews([]);
    setError(null);
    setPhase("result");
    track("own_review_started", { rating: rating ?? 0 });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [rating]);

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
          mode={mode}
          review={review}
          googleReviewUrl={googleReviewUrl}
          isRegenerating={isBusy}
          error={error}
          onReviewChange={setReview}
          onRegenerate={() => void generate(mode !== "own")}
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
          onWriteOwn={handleWriteOwn}
        />
      )}
    </main>
  );
}
