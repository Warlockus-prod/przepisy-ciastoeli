import { safeFetch } from './ssrf-guard';

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
];

const MAX_HTML_BYTES = 4 * 1024 * 1024; // 4 MB hard cap

export type FetchResult = {
  url: string;
  finalUrl: string;
  status: number;
  contentType: string;
  html: string;
  bytes: number;
};

/**
 * Fetch HTML with retry, multiple UAs, content-type check, size cap.
 */
export async function fetchHtml(rawUrl: string): Promise<FetchResult> {
  let lastErr: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await safeFetch(rawUrl, {
        redirect: 'follow',
        headers: {
          'User-Agent': USER_AGENTS[attempt % USER_AGENTS.length],
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pl,en;q=0.5',
          'Cache-Control': 'no-cache',
        },
      });

      if (!res.ok) {
        lastErr = new Error(`HTTP ${res.status}`);
        if (res.status >= 400 && res.status < 500 && res.status !== 403 && res.status !== 429) {
          // 4xx (other than 403/429) — don't retry
          break;
        }
        await sleep(500 * (attempt + 1));
        continue;
      }

      const ct = res.headers.get('content-type') ?? '';
      if (!ct.includes('text/html') && !ct.includes('application/xhtml')) {
        throw new Error(`Unexpected content-type: ${ct}`);
      }

      const cl = parseInt(res.headers.get('content-length') ?? '0', 10);
      if (cl && cl > MAX_HTML_BYTES) {
        throw new Error(`HTML too large: ${cl} bytes`);
      }

      const buf = await res.arrayBuffer();
      if (buf.byteLength > MAX_HTML_BYTES) {
        throw new Error(`HTML too large: ${buf.byteLength} bytes`);
      }
      const html = new TextDecoder('utf-8', { fatal: false }).decode(buf);

      return {
        url: rawUrl,
        finalUrl: res.url || rawUrl,
        status: res.status,
        contentType: ct,
        html,
        bytes: buf.byteLength,
      };
    } catch (err) {
      lastErr = err as Error;
      await sleep(500 * (attempt + 1));
    }
  }

  throw lastErr ?? new Error('fetchHtml: unknown error');
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
