"use client";

const STARS = [1, 2, 3, 4, 5] as const;

const CAPTIONS: Record<number, string> = {
  1: "Poor",
  2: "Not great",
  3: "Okay",
  4: "Good",
  5: "Excellent",
};

interface RatingProps {
  value: number | null;
  onChange: (value: number) => void;
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-8 w-8 transition-colors duration-150 ${
        filled ? "text-gold" : "text-rim-strong"
      }`}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.8}
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.45 6.19 20.5 7.3 14.03 2.6 9.45l6.5-.95L12 2.6Z" />
    </svg>
  );
}

/**
 * Native radios keep arrow-key navigation, screen-reader semantics and form
 * behaviour for free — no ARIA reimplementation needed.
 */
export function Rating({ value, onChange }: RatingProps) {
  return (
    <fieldset className="text-center">
      <legend className="mb-4 w-full text-[15px] font-medium text-ink-soft">
        How would you rate your experience?
      </legend>

      <div className="flex items-center justify-center gap-1">
        {STARS.map((star) => {
          const filled = value !== null && star <= value;
          return (
            <label
              key={star}
              className="cursor-pointer p-0.5"
              // Stops the mobile tap-highlight box from flashing over the star.
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <input
                type="radio"
                name="rating"
                value={star}
                checked={value === star}
                onChange={() => onChange(star)}
                className="peer sr-only"
              />
              <span
                className={`grid h-12 w-12 place-items-center rounded-full transition-transform duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-teal peer-focus-visible:ring-offset-2 ${
                  filled ? "scale-105" : "scale-100"
                }`}
              >
                <Star filled={filled} />
              </span>
              <span className="sr-only">
                {star} star{star === 1 ? "" : "s"} — {CAPTIONS[star]}
              </span>
            </label>
          );
        })}
      </div>

      {/* Reserved height so choosing a rating does not shift the layout. */}
      <p
        className="mt-2 h-5 text-[13px] font-medium text-ink-soft"
        aria-live="polite"
      >
        {value !== null ? CAPTIONS[value] : ""}
      </p>
    </fieldset>
  );
}
