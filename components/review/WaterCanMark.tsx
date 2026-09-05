"use client";

import { useId } from "react";

interface WaterCanMarkProps {
  className?: string;
  /** Animates the water level rising. Used by the loading state. */
  animated?: boolean;
}

/**
 * A 20-litre water can, drawn rather than a generic droplet — the can is the
 * thing this business actually delivers.
 */
export function WaterCanMark({ className, animated = false }: WaterCanMarkProps) {
  const id = useId();
  const clipId = `can-clip-${id}`;

  return (
    <svg
      viewBox="0 0 40 48"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id={clipId}>
          <path d="M8 18a6 6 0 0 1 6-6h12a6 6 0 0 1 6 6v18a6 6 0 0 1-6 6H14a6 6 0 0 1-6-6V18Z" />
        </clipPath>
      </defs>

      {/* Cap and neck */}
      <rect x="15" y="4" width="10" height="4" rx="1.6" fill="currentColor" />
      <path d="M17 8h6v4h-6z" fill="currentColor" />

      {/* Water inside the body, clipped to the can's shape */}
      <g clipPath={`url(#${clipId})`}>
        <g className={animated ? "animate-fill" : undefined}>
          <g className={animated ? "animate-drift" : undefined}>
            <path
              d="M-24 22c6 0 6 3 12 3s6-3 12-3 6 3 12 3 6-3 12-3 6 3 12 3 6-3 12-3v26h-72Z"
              fill="currentColor"
              opacity="0.9"
            />
          </g>
        </g>
      </g>

      {/* Can outline, drawn last so it sits above the water */}
      <path
        d="M8 18a6 6 0 0 1 6-6h12a6 6 0 0 1 6 6v18a6 6 0 0 1-6 6H14a6 6 0 0 1-6-6V18Z"
        stroke="currentColor"
        strokeWidth="2.4"
      />
    </svg>
  );
}
