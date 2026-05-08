import { StarRating } from '@/components/recipe/StarRating';

export function RatingDistribution({
  avg,
  count,
  distribution,
}: {
  avg: number | null;
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}) {
  if (!count || avg == null) {
    return (
      <div className="rounded-lg border border-line bg-cream-deep p-6 text-center">
        <p className="text-sm text-ink-soft">Brak ocen — bądź pierwszy!</p>
      </div>
    );
  }

  const value = avg / 10;
  const max = Math.max(1, ...Object.values(distribution));

  return (
    <div className="grid gap-6 rounded-lg border border-line bg-surface p-6 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-10">
      <div className="text-center sm:border-r sm:border-line sm:pr-10">
        <div className="font-display text-5xl font-bold tabular-nums">{value.toFixed(1)}</div>
        <div className="mt-1 flex justify-center">
          <StarRating value={value} size={16} />
        </div>
        <div className="mt-2 text-xs text-ink-muted">{count} {count === 1 ? 'ocena' : count < 5 ? 'oceny' : 'ocen'}</div>
      </div>

      <div className="space-y-1.5">
        {([5, 4, 3, 2, 1] as const).map((stars) => {
          const cnt = distribution[stars];
          const pct = count > 0 ? (cnt / count) * 100 : 0;
          const widthPct = max > 0 ? (cnt / max) * 100 : 0;
          return (
            <div key={stars} className="flex items-center gap-3 text-sm">
              <span className="w-8 tabular-nums text-ink-muted">{stars} ★</span>
              <div className="relative flex-1 h-2 rounded-full bg-cream-deep">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gold transition-all"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              <span className="w-12 text-right tabular-nums text-ink-muted">{Math.round(pct)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
