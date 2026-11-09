// Turns what someone types to connect a Mastodon-compatible account (a
// server address, a URL, or a handle) into the origin of the server's API.
//
// A handle's domain isn't always where the API lives: an account can be
// @you@example.org while its server is social.example.org. So a handle goes
// through WebFinger to find the account's host, and that host's nodeinfo
// says where the server itself is. No framework imports here, so it runs
// under `node --test`.

export const MASTODON_CUSTOM_CALLBACK_PATH =
  '/integrations/social/mastodon-custom';

export type InstanceInput =
  | { kind: 'host'; host: string }
  | { kind: 'handle'; user: string; domain: string };

// Resolves to the parsed JSON body; rejects on a failed request, a non-2xx
// status or a body that isn't JSON.
export type FetchJson = (url: string) => Promise<unknown>;

const HOST = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;
const IPV4 = /^\d+(\.\d+){3}$/;

function checkHost(host: string, input: string): string {
  if (!HOST.test(host) || IPV4.test(host)) {
    throw new Error(
      `"${input}" isn't a server address or a handle like @you@example.org`
    );
  }
  return host;
}

export function parseInstanceInput(input: string): InstanceInput {
  const text = input.trim().replace(/^@/, '');
  const handle = /^([^@\s/:]+)@([^@\s/:]+)$/.exec(text);
  if (handle) {
    return {
      kind: 'handle',
      user: handle[1],
      domain: checkHost(handle[2].toLowerCase(), input),
    };
  }
  const scheme = /^([a-z][a-z0-9+.-]*):\/\//i.exec(text);
  if (scheme && scheme[1].toLowerCase() !== 'https') {
    throw new Error(`Only https:// servers can be connected, not "${input}"`);
  }
  const host = text
    .replace(/^https:\/\//i, '')
    .split(/[/?#]/)[0]
    .toLowerCase();
  return { kind: 'host', host: checkHost(host, input) };
}

function hostOf(href: unknown): string | undefined {
  if (typeof href !== 'string') return undefined;
  try {
    const url = new URL(href);
    if (url.protocol !== 'https:' || url.port) return undefined;
    const parsed = parseInstanceInput(url.hostname);
    return parsed.kind === 'host' ? parsed.host : undefined;
  } catch {
    return undefined;
  }
}

function linksOf(body: unknown): Array<{ rel?: unknown; href?: unknown }> {
  const links = (body as { links?: unknown } | null)?.links;
  return Array.isArray(links) ? links : [];
}

export async function resolveInstanceUrl(
  input: string,
  fetchJson: FetchJson
): Promise<string> {
  const parsed = parseInstanceInput(input);
  let host: string;
  if (parsed.kind === 'handle') {
    const { user, domain } = parsed;
    const resource = encodeURIComponent(`acct:${user}@${domain}`);
    let found: string | undefined;
    try {
      const body = await fetchJson(
        `https://${domain}/.well-known/webfinger?resource=${resource}`
      );
      found = hostOf(linksOf(body).find((l) => l.rel === 'self')?.href);
    } catch {
      found = undefined;
    }
    if (!found) {
      throw new Error(
        `Couldn't find ${user}@${domain} by WebFinger on ${domain}`
      );
    }
    host = found;
  } else {
    host = parsed.host;
  }

  try {
    const body = await fetchJson(`https://${host}/.well-known/nodeinfo`);
    const server = hostOf(linksOf(body)[0]?.href);
    if (server) return `https://${server}`;
  } catch {
    // No nodeinfo: the host is the server.
  }
  return `https://${host}`;
}
