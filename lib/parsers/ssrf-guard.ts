import { lookup } from 'node:dns/promises';

const BLOCKED_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '::', 'metadata.google.internal']);
const BLOCKED_RANGES = [
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./, // link-local
  /^127\./, // loopback
  /^0\./,
  /^fc[0-9a-f]{2}:/i, // unique-local v6
  /^fe80:/i, // link-local v6
  /^::1/,
];

/**
 * SSRF-safe fetch — refuses requests to internal/loopback IPs.
 * Always uses redirect: 'manual' so we can re-validate after redirect.
 */
export async function safeFetch(input: string, init: RequestInit = {}): Promise<Response> {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error(`Invalid URL: ${input}`);
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`Blocked protocol: ${url.protocol}`);
  }
  const host = url.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host)) {
    throw new Error(`Blocked host: ${host}`);
  }

  // Resolve DNS to verify IP isn't private. If hostname is already an IP, lookup returns it as-is.
  try {
    const { address } = await lookup(host, { verbatim: true });
    if (BLOCKED_RANGES.some((r) => r.test(address))) {
      throw new Error(`Blocked IP range: ${address}`);
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Blocked')) throw err;
    // DNS lookup failed — let fetch try and fail naturally
  }

  const res = await fetch(url, {
    ...init,
    redirect: 'manual',
    signal: init.signal ?? AbortSignal.timeout(20_000),
  });

  // Manual redirect: if 3xx with Location, recurse with safeFetch
  if (res.status >= 300 && res.status < 400) {
    const loc = res.headers.get('location');
    if (loc && (init.redirect ?? 'follow') !== 'manual') {
      const next = new URL(loc, url).toString();
      return safeFetch(next, init);
    }
  }
  return res;
}

export function isBlockedHost(input: string): boolean {
  try {
    const u = new URL(input);
    return BLOCKED_HOSTS.has(u.hostname.toLowerCase());
  } catch {
    return true;
  }
}
