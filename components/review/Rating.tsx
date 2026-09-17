"use client";

/**
 * A good/not-so-good choice, not a 5-star picker.
 *
 * Google's own review page asks for the star count, so asking again here was
 * pure repetition. This step only needs to route the customer: a good
 * experience gets the review assistant, anything else gets the private
 * feedback form. The actual number sent to the API is a fixed stand-in for
 * each side of that split (5 for good, 2 for not good) — the customer never
 * sees or picks it, and it never reaches Google.
 */

export const GOOD_EXPERIENCE_RATING = 5;
export const NOT_GOOD_EXPERIENCE_RATING = 2;

interface RatingProps {
  value: number | null;
  onChange: (value: number) => void;
}

export function Rating({ value, onChange }: RatingProps) {
  const isGood = value !== null && value >= 4;
  const isNotGood = value !== null && value < 4;

  return (
    <fieldset className="text-center">
      <legend className="mb-4 w-full text-[15px] font-medium text-ink-soft">
        How was your experience with us?
      </legend>

      <div className="flex items-center justify-center gap-3">
        <label
          className="cursor-pointer"
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <input
            type="radio"
            name="experience"
            checked={isGood}
            onChange={() => onChange(GOOD_EXPERIENCE_RATING)}
            className="peer sr-only"
          />
          <span
            className={`flex min-h-14 w-32 flex-col items-center justify-center gap-0.5 rounded-xl border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-teal peer-focus-visible:ring-offset-2 ${
              isGood
                ? "border-teal bg-teal/10 text-ink"
                : "border-rim bg-card text-ink-soft"
            }`}
          >
            <span aria-hidden="true" className="text-[22px] leading-none">
              🙂
            </span>
            <span className="text-[13.5px] font-medium">Good</span>
          </span>
        </label>

        <label
          className="cursor-pointer"
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <input
            type="radio"
            name="experience"
            checked={isNotGood}
            onChange={() => onChange(NOT_GOOD_EXPERIENCE_RATING)}
            className="peer sr-only"
          />
          <span
            className={`flex min-h-14 w-32 flex-col items-center justify-center gap-0.5 rounded-xl border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-teal peer-focus-visible:ring-offset-2 ${
              isNotGood
                ? "border-clay bg-clay-wash text-ink"
                : "border-rim bg-card text-ink-soft"
            }`}
          >
            <span aria-hidden="true" className="text-[22px] leading-none">
              😕
            </span>
            <span className="text-[13.5px] font-medium">Not great</span>
          </span>
        </label>
      </div>
    </fieldset>
  );
}
