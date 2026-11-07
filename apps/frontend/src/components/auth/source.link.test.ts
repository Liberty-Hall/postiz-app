// Run with: node --test apps/frontend/src/components/auth/source.link.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sourceLink } from './source.link.ts';

const repo = 'https://github.com/Liberty-Hall/postiz-app';

// The AGPL asks for the source of the version that is running, so a build
// made from a commit after a tag links to that commit.
test('links to the commit in a git-describe version', () => {
  assert.deepEqual(sourceLink('v2.25.3-4-g7ad1574'), {
    url: `${repo}/tree/7ad1574`,
    label: 'commit 7ad1574',
  });
});

test('links to the tag when the build is exactly a release', () => {
  assert.deepEqual(sourceLink('v2.25.3'), {
    url: `${repo}/tree/v2.25.3`,
    label: 'v2.25.3',
  });
});

test('falls back to the deploy branch without a version', () => {
  const fallback = { url: `${repo}/tree/deploy`, label: 'deploy branch' };
  assert.deepEqual(sourceLink(undefined), fallback);
  assert.deepEqual(sourceLink(''), fallback);
  assert.deepEqual(sourceLink('not a version'), fallback);
});
