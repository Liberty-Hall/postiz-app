// Run with: node --test apps/frontend/src/components/auth/liberty-hall.assets.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = join(here, '../../../public');
const panel = readFileSync(join(here, 'liberty-hall.panel.tsx'), 'utf8');
const urls = [...panel.matchAll(/url\((\/[^)]+)\)/g)].map((m) => m[1]);

test('the panel loads its fonts and engravings', () => {
  assert.ok(urls.length >= 5, `found ${urls.length}`);
});

// Postiz's middleware sends logged-out visitors to /auth for every path
// except top-level files (like /logo.svg), so a nested asset would be a
// redirect, not an image, on the login page.
test('every asset is a top-level file in public/', () => {
  for (const url of urls) {
    assert.match(url, /^\/[\w-]+\.\w+$/, url);
    assert.ok(existsSync(join(publicDir, url)), `${url} is missing`);
  }
});
