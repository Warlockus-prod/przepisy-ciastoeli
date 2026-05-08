/**
 * Wrapper for DB queries during static generation.
 *
 * Build-time runs in a stage where Postgres isn't reachable. Without this,
 * any page with `revalidate` (ISR) fails to pre-render on `next build`.
 *
 * On runtime, errors propagate normally so we see real failures.
 * On build (NEXT_PHASE=phase-production-build), we swallow ECONNREFUSED.
 */
const BUILD_PHASE_OK_ERRORS = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET', 'connect', 'getaddrinfo', 'DATABASE_URL'];

export async function safeBuildQuery<T>(promise: Promise<T>, fallback: T): Promise<T> {
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
  if (!isBuild) {
    return promise;
  }
  try {
    return await promise;
  } catch (err) {
    const e = err as { message?: string; code?: string; cause?: { code?: string; message?: string } };
    const msg = `${e.message ?? ''} ${e.code ?? ''} ${e.cause?.code ?? ''} ${e.cause?.message ?? ''}`;
    if (BUILD_PHASE_OK_ERRORS.some((sig) => msg.includes(sig))) {
      console.warn(`[build] DB unreachable, using fallback. ${msg.slice(0, 160)}`);
      return fallback;
    }
    throw err;
  }
}
