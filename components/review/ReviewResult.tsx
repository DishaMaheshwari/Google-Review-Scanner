"use client";

import { useEffect, useRef, useState } from "react";

interface ReviewResultProps {
  review: string;
  googleReviewUrl: string | null;
  isRegenerating: boolean;
  error: string | null;
  onReviewChange: (review: string) => void;
  onRegenerate: () => void;
  onBack: () => void;
  onPost: () => void;
}

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function ReviewResult({
  review,
  googleReviewUrl,
  isRegenerating,
  error,
  onReviewChange,
  onRegenerate,
  onBack,
  onPost,
}: ReviewResultProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Grow the box to fit the review so nothing is hidden behind a scrollbar.
  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, [review]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const trimmed = review.trim();
  const isEmpty = trimmed.length === 0;

  async function copyReview(): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(trimmed);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Fires on the same click that follows the link. Copying first means the
   * review is on the clipboard ready to paste into Google's review box.
   */
  function handlePostClick() {
    onPost();
    void copyReview().then((copied) => {
      if (copied) setToast("Review copied — paste it on Google");
    });
  }

  async function handleCopyOnly() {
    setToast(
      (await copyReview())
        ? "Review copied"
        : "Couldn't copy — select the text and copy it manually",
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <h1 className="text-[24px] leading-tight font-semibold tracking-[-0.02em] text-ink">
          Your review is ready <span aria-hidden="true">✨</span>
        </h1>
        <p className="mt-2 text-[14px] text-ink-soft">
          Edit anything that doesn&rsquo;t sound like you.
        </p>
      </div>

      <div className="rounded-2xl border border-rim bg-card p-2 shadow-[0_1px_3px_rgba(8,51,58,0.05)]">
        <label htmlFor="review" className="sr-only">
          Your review
        </label>
        <textarea
          ref={textareaRef}
          id="review"
          value={review}
          onChange={(event) => onReviewChange(event.target.value)}
          maxLength={1500}
          rows={5}
          spellCheck
          className="w-full resize-none rounded-xl bg-transparent px-3.5 py-3 text-[16px] leading-[1.65] text-ink focus:outline-none"
        />
        <div className="flex items-center justify-between px-3.5 pt-1 pb-2">
          <span className="text-[12px] text-ink-faint">
            {countWords(review)} words
          </span>
          <button
            type="button"
            onClick={handleCopyOnly}
            disabled={isEmpty}
            className="text-[12.5px] font-medium text-teal underline underline-offset-2 disabled:opacity-40"
          >
            Copy text
          </button>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-clay/30 bg-clay-wash px-4 py-3 text-[14px] leading-relaxed text-clay"
        >
          {error}
        </p>
      )}

      {googleReviewUrl ? (
        isEmpty ? (
          <button
            type="button"
            disabled
            className="min-h-14 w-full cursor-not-allowed rounded-xl bg-ink px-5 text-[16px] font-semibold text-card opacity-40"
          >
            <span aria-hidden="true">⭐ </span>Post on Google
          </button>
        ) : (
          <a
            href={googleReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handlePostClick}
            className="grid min-h-14 w-full place-items-center rounded-xl bg-ink px-5 text-[16px] font-semibold text-card transition-opacity active:opacity-90"
          >
            <span>
              <span aria-hidden="true">⭐ </span>Post on Google
            </span>
          </a>
        )
      ) : (
        <div className="rounded-xl border border-rim bg-card px-4 py-4 text-center">
          <p className="text-[14px] leading-relaxed text-ink-soft">
            The Google review link hasn&rsquo;t been configured yet.
          </p>
          <button
            type="button"
            onClick={handleCopyOnly}
            disabled={isEmpty}
            className="mt-3 min-h-12 w-full rounded-xl border border-ink bg-transparent px-5 text-[15px] font-semibold text-ink disabled:opacity-40"
          >
            Copy review instead
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={onRegenerate}
        disabled={isRegenerating}
        className="min-h-13 w-full rounded-xl border border-rim-strong bg-card px-5 text-[15px] font-medium text-ink transition-colors active:bg-wash disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span aria-hidden="true">↻ </span>
        {isRegenerating ? "Writing another\u2026" : "Generate Another"}
      </button>

      <button
        type="button"
        onClick={onBack}
        className="mx-auto text-[13.5px] text-ink-soft underline underline-offset-2"
      >
        Change what you picked
      </button>

      <p className="text-center text-[12.5px] leading-relaxed text-ink-faint">
        Google opens in a new tab. You review it there and post it yourself.
      </p>

      {/* Live region is always mounted so screen readers announce updates. */}
      <div aria-live="polite" className="sr-only">
        {toast}
      </div>

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <p className="animate-rise rounded-full bg-ink px-4 py-2.5 text-[13.5px] font-medium text-card shadow-lg">
            {toast}
          </p>
        </div>
      )}
    </div>
  );
}
