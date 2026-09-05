import type { Metadata, Viewport } from "next";

import { business } from "@/lib/business";
import "./globals.css";

export const metadata: Metadata = {
  title: `Leave a review · ${business.name}`,
  description: `Share your experience with ${business.name} on Google. It takes a few seconds.`,
  // The page is reached by QR code, not by search. Keep it out of the index.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#08333a",
  width: "device-width",
  initialScale: 1,
  // Never block pinch-zoom; some customers need it.
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        {/*
          Loaded via <link> rather than next/font so the production build has no
          build-time network dependency. To self-host instead (one fewer request,
          no FOUT), see the "Typography" note in the README.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
