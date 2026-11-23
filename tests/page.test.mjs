import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const count = (re) => (html.match(re) || []).length;

// Task 1: page hygiene
test('nav links are plain hash anchors', () => assert.equal(count(/href="index\.html#/g), 0));
test('meta description and og tags', () => {
  assert.match(html, /<meta name="description" content="[^"]{50,}"/);
  for (const p of ['og:title', 'og:description', 'og:image']) assert.match(html, new RegExp(`property="${p}"`));
});
test('sections have scroll-margin-top', () => assert.match(html, /scroll-margin-top:\s*\d+px/));
test('contact paragraphs get ink color in dark mode', () =>
  assert.match(html, /\.contact p\s*\{[^}]*color:\s*var\(--ink\)/));
test('no empty paragraphs', () => assert.equal(count(/<p><\/p>/g), 0));
test('dead CSS removed', () => {
  for (const sel of ['.strike', '.caret', '.timeline', '.early', '.addon', '.now-grid', '.cred ', '.book-grid', '.hand ']) assert.ok(!html.includes(sel), sel);
});
test('footer does not advertise AP Lit coaching', () => assert.doesNotMatch(html, /AP Literature Coaching/));

// Task 2: Book in three steps
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
  assert.match(html, /id="cal-essayreview"[^>]*data-cal-link="elizabeth-nolan-audvfc\/essayreview"/);
  assert.match(html, /data-pane="essayreview"[^>]*hidden/);
});
test('fallback links exist for both services', () => {
  assert.match(html, /class="cal-fallback"[^>]*href="https:\/\/cal\.com\/elizabeth-nolan-audvfc\/one-on-one"/);
  assert.match(html, /class="cal-fallback"[^>]*href="https:\/\/cal\.com\/elizabeth-nolan-audvfc\/essayreview"/);
});
test('all booking CTAs point to #book', () => {
  assert.equal(count(/href="#contact"[^>]*>(Book|Book a session)</g), 0);
  assert.ok(count(/href="#book"/g) >= 2);
});
test('no hard-coded turnaround', () => assert.doesNotMatch(html, /within \d+ days/i));

// Task 3: Cal.com embed
test('cal.com embed loader present', () => {
  assert.match(html, /https:\/\/app\.cal\.com\/embed\/embed\.js/);
  assert.match(html, /Cal\("init",\s*service/);
});
test('embed themed with site green', () => {
  assert.match(html, /"cal-brand":\s*"#2f5d50"/);
  assert.match(html, /"cal-brand":\s*"#8cc1ab"/);
});

// Task 4: copy
test('FAQ covers payment and review timing', () => {
  assert.match(html, /<summary>How do I pay\?<\/summary>/);
  assert.match(html, /<summary>How fast is an essay review\?<\/summary>/);
});
test('contact is for questions, not booking', () => {
  assert.match(html, /<section id="contact"[\s\S]*<h2>Questions\? Get in touch<\/h2>/);
  assert.match(html, /href="mailto:Liz@consistentholding\.com"/);
  assert.match(html, /href="sms:\+16314128329"/);
});

// Task 5: found in browser check
test('step titles are not overridden by the muted step text rule', () => {
  assert.doesNotMatch(html, /\.step-body > span\s*\{/);
});

// Final review fixes
test('fallback help line appears above each calendar box', () => {
  for (const svc of ['one-on-one', 'essayreview']) {
    const pane = html.match(new RegExp(`data-pane="${svc}"[\\s\\S]*?</div>\\s*</div>|data-pane="${svc}"[\\s\\S]*?class="cal-embed"`))[0];
    assert.ok(pane.indexOf('cal-help') !== -1 && pane.indexOf('cal-help') < pane.indexOf('class="cal-embed"'), svc);
  }
});
test('empty calendar box collapses until the embed loads', () =>
  assert.match(html, /\.cal-embed:empty\s*\{[^}]*min-height:\s*0/));
test('service cards reserve room for the check badge', () => {
  assert.match(html, /\.svc-choice \{[^}]*padding: 18px 48px 18px 20px/);
  assert.match(html, /\.svc-choice\[aria-pressed="true"\] \{[^}]*padding: 17px 47px 17px 19px/);
});
