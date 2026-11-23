# Online booking & payment — design

**Date:** 2026-11-23 · **Site:** `public/index.html` (Cloudflare Worker static assets, `wrangler.jsonc`)

## Intent

Replace "email/text me, then pay by Zelle" with a self-serve flow: a parent picks a
service, sees Liz's real open times, books, and pays by card — without back-and-forth.
Goals in the owner's words: **professional and streamlined**; off-the-shelf is fine if
it's not pricey.

## Goals

- Parents can book and pay for either service from the site in one sitting.
- Open times come from Liz's Google Calendar automatically (no double-booking).
- Essay Review collects the essay at booking time.
- Liz controls the Essay Review turnaround herself, without editing the website.

## Non-goals

- File uploads (Word/PDF). Families share a Google Doc link or paste text.
- A custom booking backend, database, or Stripe code on the Worker.
- Automated refunds. Late-cancellation refunds stay manual in Stripe.
- Junior/summer coaching booking (stays "ask me").

## Anti-goals

- Monthly software fees for features we don't use.
- A booking flow that looks like a different site from the "well-made book" design.
- Liz having to touch HTML to change availability, prices, or turnaround.

## Approaches considered

| | Approach | Cost | Verdict |
|---|---|---|---|
| A | **Cal.com free plan + Stripe app, embedded** | $0/mo + Stripe fees (~2.9% + 30¢) | **Chosen** — does everything needed, free |
| B | Calendly Standard + Stripe | ~$10–12/mo + Stripe fees | Same flow; paying for brand familiarity only |
| C | Custom build on the Worker (Stripe Checkout, Google Calendar API, D1) | $0 hosting, real build + upkeep | Dropped — not "streamlined" when A is free |

Layout options shown in mockups: (A) price cards + popup calendar, (B) always-visible
inline calendar with toggle, (C) guided three-step chapter. **Owner picked C.**

Essay submission options: (1) Google Doc link or pasted text via Cal.com booking
questions, (2) custom file upload on the Worker + R2. **Owner picked 1.**
(Cal.com booking forms support text, long text and URL fields, but not file upload.)

## Design

### Page: new "Book in three steps" chapter (`#book`)

Replaces the current **How it works** section (steps + Zelle "How to pay" box).
Contact section stays for questions (email + phone), trimmed so it no longer says
"book by emailing me."

```
Chapter II — Book in three steps
I.   Choose your help    [ One-on-One · $100/hr ]  [ Essay Review · $150 ]
II.  Pick a time         ← Cal.com inline embed for the selected service:
                            calendar → details (incl. essay link for reviews) → Stripe payment
III. You're set          Confirmation email with Zoom link right away; reminders before.
     (Essay Review: written notes are ready before your call.)
Small print: reschedule/cancel from your confirmation email, 24 hours' notice.
```

- Step I is two selectable cards in the site's own style (reusing `.prog` look).
  Selecting a card loads that service into the inline embed in step II.
  One-on-One is selected by default so a calendar is visible on arrival.
- Step II uses the official Cal.com inline embed (`embed.js`), with
  `elizabeth-nolan-audvfc/one-on-one` and `elizabeth-nolan-audvfc/essayreview`.
  Embed brand color set to the site's `--pen` green; light/dark follows the page.
- Step III is static reassurance copy (what happens after paying).
- All "Book a session" CTAs (hero, nav "Book") point to `#book`.
- If the embed script fails to load, step II shows plain links to both Cal.com
  pages so booking still works.
- The existing **Essay help** pricing section stays as is (it explains the services);
  its copy "Returned within 3 days" changes to wording that doesn't hard-code a number.

### Turnaround (Liz-controlled, in Cal.com)

- Essay Review event → **Limits → Minimum notice** = Liz's turnaround (e.g. 3 days).
  The calendar then only offers call times after her notes will be ready.
- Optional: **Limit booking frequency** (e.g. max N reviews/week) to prevent overload.
- Site copy says "your call is booked for after your written notes are ready" —
  no number on the site, so nothing to keep in sync.

### Cal.com setup checklist (done by Liz/owner in Cal.com dashboard)

1. Connect Google Calendar (availability + conflict checking).
2. Install Stripe app; connect Stripe account.
3. One-on-One: 60 min, $100, location Zoom (or Google Meet).
4. Essay Review: 30 min call, $150, Zoom; minimum notice = turnaround.
5. Essay Review booking questions: **Essay link** (URL, required) with helper text
   "Google Doc shared with comment access"; **Or paste your essay** (long text,
   optional); **Which prompt / college?** (short text, optional).
   Note: make link "required" only if paste isn't used — otherwise both optional
   with helper text asking for one (Cal.com can't require "one of two").
6. Both: booking question for student name/grade + deadline.
7. Cancellation/reschedule policy text (24 hours) in event description.
8. Set Liz's working hours / winter-break availability.

### Also in this change (from the earlier page review)

- Dark mode: `.contact p` text invisible on dark background — fix.
- Sticky nav hides headings on anchor jumps — add `scroll-margin-top`.
- Nav links `index.html#x` → `#x`.
- Remove unused CSS; empty `<p>` in FAQ head; add meta description + OG tags.
- Footer "AP Literature Coaching" and name/grade mismatch — align copy.
- FAQ: add "How do I pay?" (card at booking) and "How fast is an essay review?".
- Email `Liz@consistentholding.com` is kept — confirmed it's the real account domain.

### Repo & deploy

- Git repo `xtrezpasor/consistenttutoring` (was empty): initial commit of the
  current site; `.gitignore` covers `.wrangler/` and `.superpowers/`.
- Deploy stays `wrangler deploy` to `test.consistenttutoring.com` for now.
  Connecting Cloudflare Workers Builds to GitHub (auto-deploy on push) is a
  dashboard step for the owner; switching the main domain is out of scope.

## Left to the builder

- Exact copy for step III and the small print.
- Embed config details (layout `month_view`, hiding Cal.com's event details panel).
- Card selection styling and mobile layout (stack, embed full width).

## Risks / to verify

- Cal.com free-plan Stripe payments: third-party sources say included; confirm no
  platform fee when connecting.
- "Cal.com" mark on the embed remains on the free plan.
