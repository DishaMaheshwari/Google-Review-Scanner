"use client";

import { LIKED_ATTRIBUTES, type LikedAttribute } from "@/lib/attributes";

interface FeedbackChipsProps {
  selected: LikedAttribute[];
  onToggle: (attribute: LikedAttribute) => void;
}

export function FeedbackChips({ selected, onToggle }: FeedbackChipsProps) {
  return (
    <fieldset>
      <legend className="text-[15px] font-medium text-ink">
        What&rsquo;s one thing you liked?
      </legend>
      <p className="mt-1 text-[13px] text-ink-faint">
        Pick as many as you want, or none.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {LIKED_ATTRIBUTES.map((attribute) => {
          const isSelected = selected.includes(attribute);
          return (
            <button
              key={attribute}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onToggle(attribute)}
              className={`min-h-11 rounded-full border px-4 text-[14px] transition-colors duration-150 ${
                isSelected
                  ? "border-teal bg-teal-wash font-medium text-ink"
                  : "border-rim bg-card text-ink-soft hover:border-rim-strong"
              }`}
            >
              {attribute}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
