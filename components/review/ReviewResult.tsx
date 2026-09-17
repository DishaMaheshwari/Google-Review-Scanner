"use client";

import { useEffect, useRef, useState } from "react";

interface ReviewResultProps {
  /** "own" means the customer is writing from scratch, not editing a draft. */
  mode: "generated" | "own";
  review: string;
  /** Shown back to the customer so they pick the same rating on Google. */
  rating: number | null;
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
  mode,
  review,
  rating,
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
  const isOwn = mode === "own";

  /**
   * Copies synchronously, inside the click that triggered it.
   *
   * This matters on the Post button: that click also navigates to Google, and
   * the new tab takes focus immediately. navigator.clipboard.writeText is a
   * promise, so it can settle *after* focus has moved — and browsers reject a
   * clipboard write from an unfocused document. execCommand is deprecated but
   * runs to completion before the handler returns, which is exactly the
   * property needed here.
   */
  function copyReviewSync(): boolean {
    if (!trimmed) return false;

    const scratch = document.createElement("textarea");
    scratch.value = trimmed;
    // Off-screen but still focusable and selectable — iOS Safari will not copy
    // from a hidden or display:none element.
    scratch.setAttribute("readonly", "");
    scratch.style.position = "fixed";
    scratch.style.top = "0";
    scratch.style.left = "0";
    scratch.style.opacity = "0";
    scratch.style.pointerEvents = "none";
    document.body.appendChild(scratch);

    try {
      const selection = document.getSelection();
      const previous =
        selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

      scratch.focus();
      scratch.setSelectionRange(0, trimmed.length);
      const copied = document.execCommand("copy");

      // Put the customer's own selection back so the page is left as it was.
      if (previous && selection) {
        selection.removeAllRanges();
        selection.addRange(previous);
      }

      return copied;
    } catch {
      return false;
    } finally {
      scratch.remove();
    }
  }

  /** Modern path, used where nothing is competing for focus. */
  async function copyReviewAsync(): Promise<boolean> {
    if (!trimmed) return false;
    try {
      await navigator.clipboard.writeText(trimmed);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Fires on the same click that follows the link, so the copy must be done
   * before this function returns — see copyReviewSync.
   */
  function handlePostClick() {
    onPost();
    const copied = copyReviewSync();
    setToast(
      copied
        ? "Review copied — paste it into Google's review box"
        : "Couldn't copy automatically — come back and tap Copy text",
    );
  }

  async function handleCopyOnly() {
    // No navigation here, so the modern API is safe; fall back if it refuses.
    const copied = (await copyReviewAsync()) || copyReviewSync();
    setToast(
      copied
        ? "Review copied"
        : "Couldn't copy — select the text and copy it manually",
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <h1 className="text-[24px] leading-tight font-semibold tracking-[-0.02em] text-ink">
          {isOwn ? (
            "Write your review"
          ) : (
            <>
              Your review is ready <span aria-hidden="true">✨</span>
            </>
          )}
        </h1>
        <p className="mt-2 text-[14px] text-ink-soft">
          {isOwn
            ? "In your own words — then post it on Google."
            : "Edit anything that doesn’t sound like you."}
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
          placeholder={isOwn ? "Type your review here…" : undefined}
          spellCheck
          className="w-full resize-none rounded-xl bg-transparent px-3.5 py-3 text-[16px] leading-[1.65] text-ink placeholder:text-ink-faint focus:outline-none"
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
            <span aria-hidden="true">⭐ </span>Copy Review and Paste on Google
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
              <span aria-hidden="true">⭐ </span>Copy Review and Paste on Google
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
        <span aria-hidden="true">{isOwn ? "✨ " : "↻ "}</span>
        {isRegenerating
          ? "Writing\u2026"
          : isOwn
            ? "Write one for me instead"
            : "Generate Another"}
      </button>

      <button
        type="button"
        onClick={onBack}
        className="mx-auto text-[13.5px] text-ink-soft underline underline-offset-2"
      >
        {isOwn ? "Back" : "Change what you picked"}
      </button>

      {/*
        Google's review box cannot be filled in from a link — not the text and
        not the stars. So the two manual steps are spelled out here rather than
        left as a surprise on a page the customer has never seen.
      */}
      <div className="rounded-xl border border-rim bg-card px-4 py-3.5">
        <p className="text-[12.5px] font-medium text-ink-soft">
          On the Google page:
        </p>
        <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-[12.5px] leading-relaxed text-ink-faint">
          <li>
            Tap{" "}
            {rating !== null ? (
              <span className="font-medium text-ink-soft">
                {rating} star{rating === 1 ? "" : "s"}
              </span>
            ) : (
              "your star rating"
            )}
            .
          </li>
          <li>Long-press the review box and choose Paste.</li>
          <li>Tap Post.</li>
        </ol>
      </div>

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
