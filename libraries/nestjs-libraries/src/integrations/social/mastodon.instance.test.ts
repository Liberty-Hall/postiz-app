// Run with: node --test libraries/nestjs-libraries/src/integrations/social/mastodon.instance.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseInstanceInput,
  resolveInstanceUrl,
  type FetchJson,
} from './mastodon.instance.ts';

// A FetchJson that answers only the given urls, and records every call.
function fake(routes: Record<string, unknown>) {
  const calls: string[] = [];
  const fetchJson: FetchJson = async (url) => {
    calls.push(url);
    if (url in routes) return routes[url];
    throw new Error(`404 ${url}`);
  };
  return { fetchJson, calls };
}

const nodeinfoTo = (href: string) => ({
  links: [{ rel: 'http://nodeinfo.diaspora.software/ns/schema/2.1', href }],
});
const selfLink = (href: string) => ({
  links: [{ rel: 'self', type: 'application/activity+json', href }],
});

test('normalises host input', () => {
  for (const input of [
    'social.libertyh.com',
    '  HTTPS://Social.LibertyH.com/ ',
    'https://social.libertyh.com/@tv',
  ]) {
    assert.deepEqual(parseInstanceInput(input), {
      kind: 'host',
      host: 'social.libertyh.com',
    });
  }
});

test('parses handles', () => {
  for (const input of ['@tv@terminalvalues.org', 'tv@terminalvalues.org']) {
    assert.deepEqual(parseInstanceInput(input), {
      kind: 'handle',
      user: 'tv',
      domain: 'terminalvalues.org',
    });
  }
});

test('rejects http, ports and ips', () => {
  for (const input of [
    'http://social.libertyh.com',
    'social.libertyh.com:8443',
    '45.88.228.75',
    '[::1]',
    'localhost',
    '',
    'ftp://x.org',
  ]) {
    assert.throws(() => parseInstanceInput(input), Error, input);
  }
});

test('resolves a direct-domain handle through nodeinfo', async () => {
  const { fetchJson } = fake({
    'https://terminalvalues.org/.well-known/webfinger?resource=acct%3Atv%40terminalvalues.org':
      selfLink('https://terminalvalues.org/users/tv'),
    'https://terminalvalues.org/.well-known/nodeinfo': nodeinfoTo(
      'https://social.libertyh.com/nodeinfo/2.1'
    ),
  });
  assert.equal(
    await resolveInstanceUrl('@tv@terminalvalues.org', fetchJson),
    'https://social.libertyh.com'
  );
});

test('resolves a delegated handle', async () => {
  const { fetchJson } = fake({
    'https://almnck.com/.well-known/webfinger?resource=acct%3Aa%40almnck.com':
      selfLink('https://social.almnck.com/users/a'),
    'https://social.almnck.com/.well-known/nodeinfo': nodeinfoTo(
      'https://social.libertyh.com/nodeinfo/2.1'
    ),
  });
  assert.equal(
    await resolveInstanceUrl('a@almnck.com', fetchJson),
    'https://social.libertyh.com'
  );
});

test('resolves a bare host through nodeinfo', async () => {
  const { fetchJson } = fake({
    'https://terminalvalues.org/.well-known/nodeinfo': nodeinfoTo(
      'https://social.libertyh.com/nodeinfo/2.1'
    ),
  });
  assert.equal(
    await resolveInstanceUrl('terminalvalues.org', fetchJson),
    'https://social.libertyh.com'
  );
});

test('falls back without nodeinfo', async () => {
  const none = fake({});
  assert.equal(
    await resolveInstanceUrl('hachyderm.io', none.fetchJson),
    'https://hachyderm.io'
  );
  const insecure = fake({
    'https://hachyderm.io/.well-known/nodeinfo': {
      links: [{ href: 'http://evil.example/x' }],
    },
  });
  assert.equal(
    await resolveInstanceUrl('hachyderm.io', insecure.fetchJson),
    'https://hachyderm.io'
  );
  const empty = fake({ 'https://hachyderm.io/.well-known/nodeinfo': {} });
  assert.equal(
    await resolveInstanceUrl('hachyderm.io', empty.fetchJson),
    'https://hachyderm.io'
  );
});

test('rejects a handle without webfinger', async () => {
  const { fetchJson, calls } = fake({});
  await assert.rejects(
    resolveInstanceUrl('x@nowhere.example', fetchJson),
    /nowhere\.example/
  );
  assert.deepEqual(calls, [
    'https://nowhere.example/.well-known/webfinger?resource=acct%3Ax%40nowhere.example',
  ]);
});
