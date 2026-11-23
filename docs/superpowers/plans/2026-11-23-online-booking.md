# Online Booking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "email me + Zelle" flow on `public/index.html` with a "Book in three steps" section that embeds Cal.com (calendar + Stripe payment), plus the page fixes from the earlier review.

**Architecture:** Still one static page served by a Cloudflare Worker (`wrangler.jsonc`, assets in `public/`). No backend. Cal.com's official inline embed script renders the calendar for whichever service card is selected. A dependency-free Node test (`node --test`) asserts the page's structure; a browser pass checks the look.

**Tech Stack:** HTML/CSS/vanilla JS, Cal.com embed (`https://app.cal.com/embed/embed.js`), Node 26 built-in test runner, Wrangler 4 (via `npx wrangler`).

**Spec:** `docs/superpowers/specs/2026-11-23-online-booking-design.md`

## Global Constraints

- Cal.com links: `elizabeth-nolan-audvfc/one-on-one` and `elizabeth-nolan-audvfc/essayreview`.
- Prices: One-on-One **$100 / hour**; Essay Review **$150 / essay** (30-minute call).
- No hard-coded turnaround number anywhere on the site.
- No Zelle anywhere on the page.
- Contact email stays `Liz@consistentholding.com`; phone `(631) 412-8329`.
- Keep the existing design tokens (`--paper`, `--pen`, `--gold`, …), fonts, and "chapter" headings; new UI reuses existing classes (`.prog`, `.tag`, `.price`, `.meta`) where possible.
- Embed brand color: light `#2f5d50`, dark `#8cc1ab` (the `--pen` values).
- Must work at 360px wide with no horizontal scroll, and in dark mode.
- No new dependencies, no build step. Tests use only Node built-ins.

## Review Focus

- **Embed script blocked/offline** (ad blocker, school network): parent still sees a working link to each Cal.com page. → Task 3 test `fallback links exist for both services`.
- **Switching services repeatedly**: each card shows only its own calendar; no duplicate calendars stack up. → Task 3 test `each service has its own embed container` + browser check in Task 5.
- **Dark mode**: every text block in the contact and booking sections is readable. → Task 1 test `contact paragraphs get ink color in dark mode`; browser check in Task 5.
- **Keyboard users**: service cards are real buttons with `aria-pressed`, focus-visible outline. → Task 2 test `service choices are buttons with aria-pressed`.
- **Anchor jumps under sticky nav**: headings land visible. → Task 1 test `sections have scroll-margin-top`.

---

### Task 1: Test harness + page hygiene fixes

**Files:**
- Create: `tests/page.test.mjs`
- Create: `package.json` (only `{"private":true,"type":"module","scripts":{"test":"node --test tests/"}}`)
- Modify: `public/index.html` (head, CSS lines ~52–200, nav lines ~211–221, FAQ head ~319, footer ~349)

**Interfaces:**
- Produces: `tests/page.test.mjs` exports nothing; it reads `public/index.html` once into `const html` and defines helper `count(re)` → number of matches. Later tasks append tests to this file using `html` and `count`.

- [ ] **Step 1: Write the failing tests** in `tests/page.test.mjs` using `node:test` + `node:assert/strict`:

```js
test('nav links are plain hash anchors', () => assert.equal(count(/href="index\.html#/g), 0));
test('meta description and og tags', () => {
  assert.match(html, /<meta name="description" content="[^"]{50,}"/);
  for (const p of ['og:title','og:description','og:image']) assert.match(html, new RegExp(`property="${p}"`));
});
test('sections have scroll-margin-top', () => assert.match(html, /scroll-margin-top:\s*\d+px/));
test('contact paragraphs get ink color in dark mode', () =>
  assert.match(html, /\.contact p\s*\{[^}]*color:\s*var\(--ink\)/));
test('no empty paragraphs', () => assert.equal(count(/<p><\/p>/g), 0));
test('dead CSS removed', () => {
  for (const sel of ['.strike','.caret','.timeline','.early','.addon','.now-grid','.cred ','.book-grid','.hand ']) assert.ok(!html.includes(sel), sel);
});
test('footer does not advertise AP Lit coaching', () => assert.doesNotMatch(html, /AP Literature Coaching/));
```

- [ ] **Step 2: Run** `npm test` — Expected: FAIL on all seven.

- [ ] **Step 3: Implement in `public/index.html`:**
  - Nav/hero/CTA `href="index.html#x"` → `href="#x"`.
  - Add `<meta name="description">` (≈150 chars: one-on-one college essay help on Zoom, 20-year English teacher, book and pay online), `og:title`, `og:description`, `og:image` = `https://test.consistenttutoring.com/photo.jpg`, `og:type` website.
  - `section, [id] { scroll-margin-top: 72px; }`
  - Inside both dark-mode contact rules (the `:root[data-theme="dark"]` one and the `prefers-color-scheme` one) add `.contact p { color: var(--ink); }`.
  - Delete unused rules: `.hand`, `.strike*`, `.caret*`, `.hero h1`, `.cred*`, `.now*`, `.programs`, `.addon`, `.steps*`, `.timeline`, `.tl*`, `.book-grid`, `.book-steps*`, `.num`, `.early*`, `.policies` (will be re-added in Task 2 only if used) and their entries in the 860px media query.
  - FAQ `section-head`: replace `<p></p>` with `<p>Don't see yours? Email or text me.</p>`.
  - Footer: `© 2026 Consistent Tutoring · College Essay Coaching · Sessions on Zoom`.
  - Hero `<h2>` inline style → a `.hero-title` class in CSS (same values).

- [ ] **Step 4: Run** `npm test` — Expected: 7 passing.

- [ ] **Step 5: Commit** `git add -A && git commit -m "Page hygiene: anchors, meta tags, dark-mode contact, dead CSS"`

---

### Task 2: "Book in three steps" section (markup + styles)

**Files:**
- Modify: `public/index.html` — replace the whole `<section id="how" class="plan">…</section>` (lines ~295–315); add CSS block `/* Booking */`; nav "How it works" + "Book" items.
- Modify: `tests/page.test.mjs`

**Interfaces:**
- Produces (used by Task 3):
  - `<section id="book" class="plan">`
  - Two buttons: `<button class="svc-choice" type="button" data-service="one-on-one" aria-pressed="true">` and `data-service="essayreview" aria-pressed="false"`.
  - Two containers: `<div class="cal-embed" id="cal-one-on-one" data-cal-link="elizabeth-nolan-audvfc/one-on-one">` and `id="cal-essayreview"` with `data-cal-link="elizabeth-nolan-audvfc/essayreview" hidden`.
  - Fallback links: `<a class="cal-fallback" href="https://cal.com/elizabeth-nolan-audvfc/<slug>" target="_blank" rel="noopener">` — one inside each container's wrapper.

- [ ] **Step 1: Append failing tests:**

```js
test('book section replaces how/zelle', () => {
  assert.match(html, /<section id="book"/);
  assert.doesNotMatch(html, /id="how"/);
  assert.doesNotMatch(html, /zelle/i);
});
test('service choices are buttons with aria-pressed', () => {
  assert.equal(count(/<button[^>]*class="svc-choice"[^>]*aria-pressed="(true|false)"/g), 2);
  assert.match(html, /data-service="one-on-one"[^>]*aria-pressed="true"/);
});
test('each service has its own embed container', () => {
  assert.match(html, /id="cal-one-on-one"[^>]*data-cal-link="elizabeth-nolan-audvfc\/one-on-one"/);
  assert.match(html, /id="cal-essayreview"[^>]*data-cal-link="elizabeth-nolan-audvfc\/essayreview"[^>]*hidden/);
});
test('fallback links exist for both services', () => {
  assert.match(html, /class="cal-fallback"[^>]*href="https:\/\/cal\.com\/elizabeth-nolan-audvfc\/one-on-one"|href="https:\/\/cal\.com\/elizabeth-nolan-audvfc\/one-on-one"[^>]*class="cal-fallback"/);
  assert.match(html, /href="https:\/\/cal\.com\/elizabeth-nolan-audvfc\/essayreview"/);
});
test('all booking CTAs point to #book', () => {
  assert.equal(count(/href="#contact"[^>]*>(Book|Book a session)</g), 0);
  assert.ok(count(/href="#book"/g) >= 2);
});
test('no hard-coded turnaround', () => assert.doesNotMatch(html, /within \d+ days/i));
```

- [ ] **Step 2: Run** `npm test` — Expected: the six new tests FAIL.

- [ ] **Step 3: Build the section.** Heading `<h2>Book in three steps</h2>` (gets "Chapter II" from the existing counter) with lead `<p>Choose your help, pick a time that works, and pay securely. You'll get a confirmation and Zoom link right away.</p>`. Then an `<ol class="book-flow">` with three `<li>`s using the gold Roman-numeral style already used by `.how li::before`:
  - **I. Choose your help** — the two `.svc-choice` buttons styled like small `.prog` cards: name, price (`$100 / hour`, `$150 / essay`), one-line description ("Work through drafts together on Zoom" / "Written notes on your essay, plus a 30-minute call"). Pressed state: `border: 2px solid var(--pen)` + check mark; focus-visible outline as existing `a:focus-visible`.
  - **II. Pick a time & pay** — the two `.cal-embed` containers (min-height 560px desktop, 640px ≤860px) + under each a small line: `Calendar not loading? <a class="cal-fallback" …>Open the booking page</a>`. Under the essay container: `<p class="book-note">You'll add a link to your Google Doc (shared with comment access) or paste your essay when you book. Your call is scheduled for after your written notes are ready.</p>` (hidden together with its container).
  - **III. You're set** — `<b>Check your email</b><span>Your confirmation has the Zoom link and a calendar invite. Need to change something? Reschedule or cancel from that email with at least 24 hours' notice; later cancellations count as a used session.</span>` plus `<span>I don't tutor students from the school where I teach.</span>`.
  - Replace the old `.how` CSS with `.book-flow` rules; on ≤860px everything stacks single column and the two choices sit side by side down to 420px, then stack.
  - Nav: replace "How it works" (`#how`) with "Book online" (`#book`); change "Book" (`#contact`) to "Contact" (`#contact`). Hero primary CTA → `#book`.
  - Essay help section copy: "Returned within 3 days, sooner when deadlines are close" → "Notes back before your call — book early near deadlines".

- [ ] **Step 4: Run** `npm test` — Expected: all passing.

- [ ] **Step 5: Commit** `git commit -am "Add Book in three steps section"`

---

### Task 3: Cal.com embed + service switching

**Files:**
- Modify: `public/index.html` — the `<script>` at the end of `<body>`.
- Modify: `tests/page.test.mjs`

**Interfaces:**
- Consumes: Task 2's `.svc-choice[data-service]`, `#cal-<service>[data-cal-link]`.
- Produces: `window.Cal` namespaces named exactly `one-on-one` and `essayreview`.

- [ ] **Step 1: Append failing tests:**

```js
test('cal.com embed loader present', () => {
  assert.match(html, /https:\/\/app\.cal\.com\/embed\/embed\.js/);
  assert.match(html, /Cal\("init",\s*service/);
});
test('embed themed with site green', () => {
  assert.match(html, /"cal-brand":\s*"#2f5d50"/);
  assert.match(html, /"cal-brand":\s*"#8cc1ab"/);
});
```

- [ ] **Step 2: Run** `npm test` — Expected: two FAIL.

- [ ] **Step 3: Implement.** Paste Cal.com's standard embed loader IIFE (from the Cal.com dashboard → link → Embed → Inline; it defines `window.Cal` and loads `embed.js`). Then:
  - `function mount(service)` — if `#cal-<service>` has `data-mounted`, return. Otherwise `Cal("init", service, {origin: "https://app.cal.com"})`, then `Cal.ns[service]("inline", {elementOrSelector: "#cal-" + service, calLink: el.dataset.calLink, config: {layout: "month_view"}})`, then `Cal.ns[service]("ui", {cssVarsPerTheme: {light: {"cal-brand": "#2f5d50"}, dark: {"cal-brand": "#8cc1ab"}}, hideEventTypeDetails: false, layout: "month_view"})`, set `data-mounted`.
  - `function select(service)` — set `aria-pressed` on both buttons, toggle `hidden` on both containers' wrappers (container + fallback line + note), call `mount(service)`.
  - Click handler on each `.svc-choice` → `select(btn.dataset.service)`.
  - On load: `mount("one-on-one")` only (Essay Review mounts lazily on first select — no stacked duplicates because of `data-mounted`).
  - Keep the existing copy-email handler.
  - If the embed origin in Cal.com's dashboard snippet differs from `https://app.cal.com`, use the dashboard's value and update the test.

- [ ] **Step 4: Run** `npm test` — Expected: all passing.

- [ ] **Step 5: Commit** `git commit -am "Embed Cal.com booking with service switching"`

---

### Task 4: Copy updates (FAQ + contact)

**Files:**
- Modify: `public/index.html` — FAQ (~lines 317–328), contact section (~330–345).
- Modify: `tests/page.test.mjs`

- [ ] **Step 1: Append failing tests:**

```js
test('FAQ covers payment and review timing', () => {
  assert.match(html, /<summary>How do I pay\?<\/summary>/);
  assert.match(html, /<summary>How fast is an essay review\?<\/summary>/);
});
test('contact is for questions, not booking', () => {
  assert.match(html, /<section id="contact"[\s\S]*<h2>Questions\? Get in touch<\/h2>/);
  assert.match(html, /href="mailto:Liz@consistentholding\.com"/);
  assert.match(html, /href="sms:\+16314128329"/);
});
```

- [ ] **Step 2: Run** `npm test` — Expected: two FAIL.

- [ ] **Step 3: Implement:**
  - FAQ add — **How do I pay?** "By card when you book. Payment is handled securely by Stripe, and you'll get a receipt by email." **How fast is an essay review?** "The calendar only offers call times after your written notes will be ready, so pick any open time. Near deadlines, book early: spots fill quickly the week before January 1."
  - Contact: h2 "Questions? Get in touch"; paragraph "Not sure which option fits, or need a time you don't see? Email or text me and I'll reply within one business day."; keep the junior/summer line. Email value becomes a `mailto:` link (keep Copy button). Phone: keep `tel:` link and add `<a href="sms:+16314128329">Text</a>`.

- [ ] **Step 4: Run** `npm test` — Expected: all passing.

- [ ] **Step 5: Commit** `git commit -am "Update FAQ and contact copy for online booking"`

---

### Task 5: Browser verification + deploy to test domain

**Files:** none unless fixes are found.

- [ ] **Step 1:** Serve locally: `npx wrangler dev` (serves `public/` at `http://localhost:8787`).
- [ ] **Step 2:** In a browser at 1280px and 375px, light and dark: One-on-One calendar renders in step II; clicking Essay Review shows its calendar and note, hides the other; switching back and forth 3× leaves exactly one visible calendar; no horizontal scroll at 375px; contact text readable in dark mode; nav anchors land with headings visible. Screenshot each state.
- [ ] **Step 3:** Block `app.cal.com` (or offline) and confirm the "Open the booking page" links still work.
- [ ] **Step 4:** Fix anything found, re-run `npm test`, commit.
- [ ] **Step 5:** Ask the owner before deploying, then `npx wrangler deploy` and load `https://test.consistenttutoring.com`. `git push`.
