import type { Nutrition } from '@/lib/db/schema';

const CONFIDENCE_LABEL: Record<string, string> = {
  low: 'orientacyjne',
  medium: 'szacowane',
  high: 'dokładne',
};

export function NutritionPanel({ nutrition, servings }: { nutrition: Nutrition | null; servings: number }) {
  if (!nutrition) return null;

  const macros = [
    { label: 'Kalorie', value: nutrition.kcal, unit: 'kcal', accent: true },
    { label: 'Białko', value: nutrition.protein_g, unit: 'g' },
    { label: 'Węglowodany', value: nutrition.carbs_g, unit: 'g' },
    { label: 'Tłuszcze', value: nutrition.fat_g, unit: 'g' },
  ];
  const extras = [
    nutrition.fiber_g != null ? { label: 'Błonnik', value: nutrition.fiber_g, unit: 'g' } : null,
    nutrition.sugar_g != null ? { label: 'Cukry', value: nutrition.sugar_g, unit: 'g' } : null,
    nutrition.saturated_fat_g != null ? { label: 'Tł. nasycone', value: nutrition.saturated_fat_g, unit: 'g' } : null,
    nutrition.sodium_mg != null ? { label: 'Sód', value: nutrition.sodium_mg, unit: 'mg' } : null,
  ].filter(Boolean) as Array<{ label: string; value: number; unit: string }>;

  return (
    <section aria-labelledby="nutrition-heading" className="rounded-lg border border-line bg-surface p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id="nutrition-heading" className="font-display text-lg font-semibold">
          Wartości odżywcze
        </h2>
        <span className="text-xs text-ink-muted">na porcję</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {macros.map((m) => (
          <div
            key={m.label}
            className={`rounded-md p-3 ${m.accent ? 'bg-terracotta/[0.08]' : 'bg-cream-deep'}`}
          >
            <div className={`font-display text-xl font-bold tabular-nums ${m.accent ? 'text-terracotta' : 'text-ink'}`}>
              {Math.round(m.value)}
              <span className="ml-0.5 text-xs font-medium text-ink-muted">{m.unit}</span>
            </div>
            <div className="text-xs text-ink-soft">{m.label}</div>
          </div>
        ))}
      </div>

      {extras.length > 0 && (
        <dl className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
          {extras.map((e) => (
            <div key={e.label} className="flex justify-between">
              <dt className="text-ink-soft">{e.label}</dt>
              <dd className="tabular-nums font-medium">
                {Math.round(e.value)} {e.unit}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <p className="mt-3 text-[11px] leading-snug text-ink-muted">
        Wartości {CONFIDENCE_LABEL[nutrition.confidence] ?? 'orientacyjne'}
        {nutrition.source === 'gpt-estimated' ? ' (szacowane automatycznie)' : ''}. Dla {servings}{' '}
        {servings === 1 ? 'porcji' : 'porcji'}.
      </p>
    </section>
  );
}
