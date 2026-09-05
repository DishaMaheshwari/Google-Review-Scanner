"use client";

import { business } from "@/lib/business";
import { WaterCanMark } from "./WaterCanMark";

/**
 * Text-and-mark lockup standing in for a logo.
 *
 * To use a real logo instead, drop the file in /public and replace the tile
 * below with an <Image src="/logo.svg" .../>. Nothing else needs to change.
 */
export function BrandHeader() {
  return (
    <header className="flex flex-col items-center gap-3 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-ink text-card shadow-[0_2px_10px_rgba(8,51,58,0.18)]">
        <WaterCanMark className="h-8 w-8" />
      </span>

      <div>
        <p className="text-[17px] font-semibold tracking-[-0.01em] text-ink">
          {business.name}
        </p>
        <p className="mt-0.5 text-[13px] text-ink-faint">{business.tagline}</p>
      </div>
    </header>
  );
}
