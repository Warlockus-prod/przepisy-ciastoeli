/**
 * Wrapper for DB queries during static generation.
 *
 * Build-time runs in a stage where Postgres isn't reachable. Without this,
 * any page with `revalidate` (ISR) fails to pre-render on `next build`.
 *
 * On runtime, errors propagate normally so we see real failures.
 * On build (NEXT_PHASE=phase-production-build), we swallow ECONNREFUSED.
 */
export async function safeBuildQuery<T>(promise: Promise<T>, fallback: T): Promise<T> {
  const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
  if (!isBuild) {
    return promise;
  }
  try {
    return await promise;
  } catch (err) {
    const msg = (err as Error).message ?? '';
    if (msg.includes('ECONNREFUSED') || msg.includes('connect') || msg.includes('DATABASE_URL')) {
      console.warn(`[build] DB unreachable, using fallback. ${msg.slice(0, 120)}`);
      return fallback;
    }
    throw err;
  }
}
