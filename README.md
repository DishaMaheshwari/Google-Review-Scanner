# Google Review Assistant

A one-page mobile web app that helps a real customer put their own experience
into words, so they can post it on Google in a few taps.

A customer scans a QR code on a can, an invoice or a delivery slip. They tap a
star rating, tap a few things they liked, and get a short suggested review they
can edit. Then they tap through to Google and post it themselves.

**The customer always posts the review.** This app never submits anything to
Google, never touches a Google account, and never writes a review that isn't
grounded in what the customer actually selected.

---

## How it works

```
QR code  →  /review  →  ★ rating
                          ├─ 4–5 stars →  pick what you liked  →  AI drafts a review
                          │                                      →  edit it
                          │                                      →  open Google, post it yourself
                          └─ 1–3 stars →  private feedback to the owner (never to Google)
```

A low rating never becomes a positive review. The API rejects it even if the
request is crafted by hand.

---

## Tech stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | React 19, Tailwind CSS v4 |
| AI | OpenAI API via the official SDK |
| Hosting | Vercel (any Node host works) |
| Storage | None. No database, no accounts, no login. |

---

## Install and run

You need Node.js 20 or newer.

```bash
npm install
```

Copy the environment template and fill it in:

```bash
cp .env.local.example .env.local
```

Then:

```bash
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint    # ESLint
npm run start   # serve the production build
```

Type checking runs as part of `npm run build`. To check types on their own:

```bash
npx tsc --noEmit
```

Visiting `/` redirects to `/review`, which is the only page customers see.

---

## Environment variables

Set these in `.env.local` for local work, and in **Vercel → Project → Settings →
Environment Variables** for production.

### Required

| Variable | What it is |
|---|---|
| `OPENAI_API_KEY` | Your OpenAI key, from <https://platform.openai.com/api-keys>. Server-side only — it is never sent to the browser. |
| `NEXT_PUBLIC_GOOGLE_REVIEW_URL` | Where the "Post on Google" button sends the customer. See below. |

### Optional

| Variable | Default | What it does |
|---|---|---|
| `OPENAI_MODEL` | `gpt-5.4-mini` | Any chat-capable model your account can reach. |
| `OPENAI_REASONING_EFFORT` | unset | `none`, `minimal`, `low`, `medium`, `high`. Only some models accept it; if yours rejects it the app retries without it automatically. |
| `OPENAI_TEMPERATURE` | unset | Leave blank unless your model supports it. Review variety does not depend on it. |
| `FEEDBACK_WEBHOOK_URL` | unset | If set, 1–3 star feedback is POSTed here as `{"text": "..."}`. A Slack or Google Chat incoming webhook works as-is. |

> `NEXT_PUBLIC_` variables are visible in the browser by design. The Google
> review link is public, so that is fine. **Never** put a secret in one.

`.env.local` is gitignored and must never be committed.

---

## Configuring the business

Open **`lib/business.ts`**. Everything customer-facing is in that one file:

```ts
export const business = {
  name: "Aqua Spring Water Supply",
  tagline: "Packaged drinking water · cans for events & offices",
  description: "Drinking water can supply for weddings, functions, ...",
  googleReviewUrl: process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL,
};
```

- `name` and `tagline` appear in the header and the page title.
- `description` is fed to the AI as background. Keep it factual. Do not add
  claims you cannot stand behind, because the model may repeat them.

### Using a real logo

The header currently shows a drawn water-can mark. To use a real logo, drop the
file into `public/` and replace the mark in
`components/review/BrandHeader.tsx` with an `<Image src="/logo.svg" … />`.
Nothing else needs to change.

### Changing the things customers can tap

Edit `LIKED_ATTRIBUTES` in `lib/attributes.ts`. That array is the allowlist the
server validates against, so the chips and the validation stay in sync
automatically.

---

## Getting your Google review URL

1. Open [Google Business Profile](https://business.google.com/) and sign in.
2. Find your business, then choose **Ask for reviews** / **Get more reviews**.
3. Copy the short link. It looks like `https://g.page/r/XXXXXXXXXXXX/review`.
4. Put it in `NEXT_PUBLIC_GOOGLE_REVIEW_URL`.

Alternatively, search your business on Google Maps, choose **Share**, copy the
place link, and append `/review`.

If this is not set, the app does not render a broken button. It tells the
customer the link is not configured yet and offers to copy the review text
instead, so nobody hits a dead end.

---

## The QR code

The app does not generate QR codes, and does not need to. Generate one once
that points at:

```
https://YOUR-DOMAIN.com/review
```

Any QR generator works. Some practical advice:

- Use the highest error-correction level (H) so the code still scans when a
  label is scuffed or wet.
- Print it at 2.5 cm square or larger.
- Test it with a real phone camera before printing hundreds of them.

Put it on water cans, delivery receipts, invoices, event delivery materials,
thank-you cards, and the counter.

---

## Deploying to Vercel

1. Push this repository to GitHub.
2. In Vercel, **Add New → Project**, and import the repository.
3. Add `OPENAI_API_KEY` and `NEXT_PUBLIC_GOOGLE_REVIEW_URL` under Environment
   Variables. Add any optional ones you want.
4. Deploy. The defaults are correct for Next.js — nothing to configure.

After changing a `NEXT_PUBLIC_` variable you must **redeploy**, because those
values are baked into the browser bundle at build time.

Once live, check `https://YOUR-DOMAIN.com/review` on an actual phone before
printing the QR code.

---

## Testing the customer journey

Worth walking through by hand before going live:

| What to do | What should happen |
|---|---|
| Open `/review` | Header, headline and five empty stars. Nothing else yet. |
| Tap 5 stars | Chips, note field and the CTA appear. |
| Tap some chips, tap **Create My Review** | Loading state, then a draft in an editable box. |
| Edit the text | It changes freely; word count updates. |
| Tap **Generate Another** | A different draft, not just different adjectives. |
| Tap **Post on Google** | Google opens in a new tab, review copied to clipboard. |
| Tap 2 stars instead | Private feedback form. No review is generated. |
| Unset the Google URL and redeploy | Configuration notice plus a "copy review" fallback. |
| Break `OPENAI_API_KEY` | Friendly error and a working **Try Again** button. |

---

## Notes on how it is built

### Reviews are grounded, not invented

The system prompt forbids inventing prices, delivery times, quantities, staff
names, dates, locations, certifications and health claims. The model only sees
the rating, the attributes the customer tapped, and their optional note.

The attribute list is validated server-side against an allowlist, so the browser
cannot inject arbitrary "business facts" through it. The note is the only free
text: it is stripped of control characters, collapsed onto one line, capped at
300 characters, and fenced in a block explicitly marked as customer text rather
than instructions.

### Regenerations actually differ

Variety does not come from temperature. The server rotates through eight
structural directives — sentence count, opening, register, length — and sends
the previous drafts back with an instruction to move away from them.

### Errors

Customers only ever see *"Something went wrong while creating your review.
Please try again."* Status codes, model names and OpenAI messages stay in the
server log. A missing API key logs a clear explanation server-side and is only
shown in the response during development.

### Rate limiting

`lib/rate-limit.ts` is an in-memory sliding window: 15 generations and 5
feedback submissions per IP per 10 minutes, in separate buckets.

Be aware of the limitation: serverless instances do not share memory, so this
is a speed bump against one person holding down "Generate another", not a hard
guarantee. If the page ever gets real traffic, swap in Vercel KV or Upstash
Redis — the route only depends on the `rateLimit()` signature.

### Where low-rating feedback goes

There is no database. Feedback is written to the server log, visible under
**Vercel → Project → Logs**, and forwarded to `FEEDBACK_WEBHOOK_URL` if you set
one. Set the webhook if you actually want to hear about complaints; log lines
are easy to miss.

Only the rating and the text the customer typed are recorded. No name, phone
number, email or IP is stored.

### Analytics

`lib/analytics.ts` fires `page_view`, `review_started`, `review_generated`,
`review_regenerated`, `google_button_clicked` and `low_rating_feedback_sent`.
It is a no-op until a provider is present — add Vercel Analytics or Plausible
and events start flowing with no code change. Nothing personal is recorded.

### Typography

Instrument Sans loads from Google Fonts via a `<link>` in `app/layout.tsx`, so
the build has no network dependency. To self-host it instead (one fewer request
and no flash of fallback text), swap in `next/font/google`:

```ts
import { Instrument_Sans } from "next/font/google";
const sans = Instrument_Sans({ subsets: ["latin"] });
```

then drop the `<link>` tags and put `className={sans.className}` on `<html>`.

---

## Project structure

```
app/
  layout.tsx                     fonts, metadata, viewport
  page.tsx                       redirects to /review
  globals.css                    design tokens and base styles
  review/page.tsx                the customer-facing page
  api/generate-review/route.ts   validation, rate limiting, OpenAI call
  api/feedback/route.ts          low-rating feedback

components/review/
  ReviewFlow.tsx                 state machine for the whole journey
  BrandHeader.tsx                logo lockup
  Rating.tsx                     five stars, native radio inputs
  FeedbackChips.tsx              tappable attributes
  ReviewForm.tsx                 first screen
  ReviewResult.tsx               editable draft, post and regenerate
  LowRatingFeedback.tsx          the 1–3 star path
  LoadingState.tsx               rising-water animation
  WaterCanMark.tsx               the SVG mark

lib/
  business.ts                    EDIT THIS to configure the business
  attributes.ts                  allowlist shared by client and server
  validation.ts                  request parsing and sanitising
  openai.ts                      prompt, model call, output cleaning
  rate-limit.ts                  in-memory limiter
  analytics.ts                   vendor-free event shim
```

---

## What this app deliberately does not do

No automated Google submission. No browser automation or scraping. No Google
account access or stored credentials. No fake reviews from customers who never
came. No accounts, admin dashboard, database, CRM, or multi-business support.

The point is not "AI writes reviews for you." It is: tell us what you liked in
a couple of taps, and we will help you put it into words — then you decide what
to post.
