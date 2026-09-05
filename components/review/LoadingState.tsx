"use client";

import { WaterCanMark } from "./WaterCanMark";

export function LoadingState() {
  return (
    <div
      className="flex flex-col items-center gap-5 py-16"
      role="status"
      aria-live="polite"
    >
      <WaterCanMark className="h-20 w-20 text-teal" animated />
      <p className="text-[15px] font-medium text-ink-soft">
        Creating your review&hellip;
      </p>
    </div>
  );
}
