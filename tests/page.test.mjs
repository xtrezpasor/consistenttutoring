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
