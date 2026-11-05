// Run with: node --test libraries/nestjs-libraries/src/emails/email.template.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emailTemplate } from './email.template.ts';

const page = emailTemplate({
  subject: 'Activate your account',
  html: 'Click <a href="https://post.example.com/auth/activate/x">here</a>',
  fromName: 'Example Org',
  frontendUrl: 'https://post.example.com',
});

test('includes the subject, the body, the sender and the settings link', () => {
  assert.match(page, /Activate your account/);
  assert.match(page, /auth\/activate\/x/);
  assert.match(page, /Example Org/);
  assert.match(page, /https:\/\/post\.example\.com\/settings/);
});

// Mail clients in dark mode recolour text and solid background colours, but
// not gradients or translucent colours, which left white text on light blue.
test('uses only solid background colours', () => {
  assert.doesNotMatch(page, /gradient/);
  assert.doesNotMatch(page, /rgba\(/);
  assert.doesNotMatch(page, /backdrop-filter/);
});

test('sets each background as both bgcolor and background-color', () => {
  const bgcolors = [...page.matchAll(/bgcolor="(#[0-9a-f]{6})"/g)].map((m) => m[1]);
  assert.ok(bgcolors.length >= 2, 'page and card backgrounds');
  for (const c of bgcolors) {
    assert.match(page, new RegExp(`background-color: ?${c}`));
  }
});

test('uses tables, not flexbox, for layout', () => {
  assert.doesNotMatch(page, /display: ?flex/);
  assert.match(page, /<table/);
});

test('declares a light colour scheme', () => {
  assert.match(page, /<meta name="color-scheme" content="light">/);
  assert.match(page, /<meta name="supported-color-schemes" content="light">/);
});

test('gives links an explicit colour', () => {
  assert.match(page, /a \{[^}]*color: ?#[0-9a-f]{6}/);
});
