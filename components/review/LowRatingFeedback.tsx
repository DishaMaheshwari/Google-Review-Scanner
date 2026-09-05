"use client";

import { useState } from "react";

import { MAX_FEEDBACK_LENGTH } from "@/lib/attributes";
import { track } from "@/lib/analytics";

interface LowRatingFeedbackProps {
  rating: number;
}

type Status = "idle" | "sending" | "sent" | "failed";

/**
 * A low rating never becomes a review. It becomes a private message to the
 * owner instead, so the customer is heard and Google is left out of it.
 */
export function LowRatingFeedback({ rating }: LowRatingFeedbackProps) {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const canSend = message.trim().length > 0 && status !== "sending";

  async function handleSend() {
    if (!canSend) return;
    setStatus("sending");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, message: message.trim() }),
      });

      if (!response.ok) throw new Error(`Status ${response.status}`);

      track("low_rating_feedback_sent", { rating });
      setStatus("sent");
    } catch {
      setStatus("failed");
    }
  }

  if (status === "sent") {
    return (
      <section
        className="animate-rise rounded-2xl border border-rim bg-card p-6 text-center"
        aria-live="polite"
      >
        <h2 className="text-[18px] font-semibold text-ink">
          Thanks for letting us know.
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
          Your feedback goes straight to the owner. We&rsquo;ll use it to put
          things right.
        </p>
      </section>
    );
  }

  return (
    <section className="animate-rise rounded-2xl border border-rim bg-card p-5">
      <h2 className="text-[17px] font-semibold text-ink">
        Sorry we didn&rsquo;t get it right.
      </h2>
      <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">
        We&rsquo;d still like to hear what went wrong. This goes to us
        privately, not to Google.
      </p>

      <label htmlFor="feedback" className="sr-only">
        What went wrong?
      </label>
      <textarea
        id="feedback"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        maxLength={MAX_FEEDBACK_LENGTH}
        rows={4}
        placeholder="Tell us what happened&hellip;"
        className="mt-4 w-full resize-y rounded-xl border border-rim bg-wash px-3.5 py-3 text-[15px] leading-relaxed text-ink placeholder:text-ink-faint focus:border-clay focus:bg-card"
      />

      <button
        type="button"
        onClick={handleSend}
        disabled={!canSend}
        className="mt-3 min-h-13 w-full rounded-xl bg-clay px-5 text-[16px] font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
      >
        {status === "sending" ? "Sending\u2026" : "Send Feedback"}
      </button>

      {status === "failed" && (
        <p className="mt-3 text-center text-[13px] text-clay" role="alert">
          That didn&rsquo;t send. Please try again.
        </p>
      )}
    </section>
  );
}
