"use client";

import {
  MAX_NOTE_LENGTH,
  POSITIVE_RATING_THRESHOLD,
  type LikedAttribute,
} from "@/lib/attributes";

import { FeedbackChips } from "./FeedbackChips";
import { LowRatingFeedback } from "./LowRatingFeedback";
import { Rating } from "./Rating";

interface ReviewFormProps {
  rating: number | null;
  liked: LikedAttribute[];
  note: string;
  isSubmitting: boolean;
  error: string | null;
  onRatingChange: (rating: number) => void;
  onToggleLiked: (attribute: LikedAttribute) => void;
  onNoteChange: (note: string) => void;
  onSubmit: () => void;
}

export function ReviewForm({
  rating,
  liked,
  note,
  isSubmitting,
  error,
  onRatingChange,
  onToggleLiked,
  onNoteChange,
  onSubmit,
}: ReviewFormProps) {
  const isPositive = rating !== null && rating >= POSITIVE_RATING_THRESHOLD;
  const isNegative = rating !== null && rating < POSITIVE_RATING_THRESHOLD;
  const noteRemaining = MAX_NOTE_LENGTH - note.length;

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-[27px] leading-[1.2] font-semibold tracking-[-0.02em] text-ink">
          Had a good experience with us?
        </h1>
        <p className="mx-auto mt-2.5 max-w-[19rem] text-[15px] leading-relaxed text-ink-soft">
          Share your experience on Google. It only takes a few seconds.
        </p>
      </div>

      <section className="rounded-2xl border border-rim bg-card px-5 py-6">
        <Rating value={rating} onChange={onRatingChange} />
      </section>

      {isNegative && <LowRatingFeedback rating={rating} />}

      {isPositive && (
        <div className="animate-rise flex flex-col gap-6">
          <FeedbackChips selected={liked} onToggle={onToggleLiked} />

          <div>
            <label
              htmlFor="note"
              className="text-[15px] font-medium text-ink"
            >
              Anything else you&rsquo;d like to mention?
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(event) =>
                onNoteChange(event.target.value.slice(0, MAX_NOTE_LENGTH))
              }
              maxLength={MAX_NOTE_LENGTH}
              rows={3}
              placeholder="Optional — write a few words&hellip;"
              className="mt-2.5 w-full resize-y rounded-xl border border-rim bg-card px-3.5 py-3 text-[15px] leading-relaxed text-ink placeholder:text-ink-faint focus:border-teal"
            />
            {noteRemaining <= 60 && (
              <p className="mt-1.5 text-right text-[12px] text-ink-faint">
                {noteRemaining} characters left
              </p>
            )}
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-clay/30 bg-clay-wash px-4 py-3 text-[14px] leading-relaxed text-clay"
            >
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="min-h-14 w-full rounded-xl bg-ink px-5 text-[16px] font-semibold text-card transition-opacity active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span aria-hidden="true">✨ </span>
            {error ? "Try Again" : "Create My Review"}
          </button>

          <p className="-mt-2 text-center text-[12.5px] leading-relaxed text-ink-faint">
            We&rsquo;ll suggest some wording. You can edit it, and you post it
            yourself on Google.
          </p>
        </div>
      )}
    </div>
  );
}
