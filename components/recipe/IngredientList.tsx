import type { Ingredient } from '@/lib/db/schema';

export function IngredientList({ ingredients, servings }: { ingredients: Ingredient[]; servings: number }) {
  // Group by `group` field if any items have it
  const groups = new Map<string, Ingredient[]>();
  for (const ing of ingredients) {
    const key = ing.group ?? '';
    const arr = groups.get(key) ?? [];
    arr.push(ing);
    groups.set(key, arr);
  }
  const hasGroups = groups.size > 1 || (groups.size === 1 && !groups.has(''));

  return (
    <section aria-labelledby="ingredients-heading" className="rounded-lg border border-line bg-surface p-6 sm:p-8">
      <div className="mb-5 flex items-baseline justify-between">
        <h2 id="ingredients-heading" className="font-display text-2xl font-semibold">
          Składniki
        </h2>
        <span className="text-sm text-ink-muted">na {servings} {servings === 1 ? 'porcję' : servings < 5 ? 'porcje' : 'porcji'}</span>
      </div>

      {hasGroups ? (
        <div className="space-y-6">
          {[...groups.entries()].map(([groupName, items]) => (
            <div key={groupName || '_'}>
              {groupName && (
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-terracotta">{groupName}</h3>
              )}
              <ItemList items={items} />
            </div>
          ))}
        </div>
      ) : (
        <ItemList items={ingredients} />
      )}
    </section>
  );
}

function ItemList({ items }: { items: Ingredient[] }) {
  return (
    <ul className="divide-y divide-line">
      {items.map((ing, i) => (
        <li key={`${ing.name}-${i}`} className="flex items-start gap-3 py-2.5">
          <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-terracotta" />
          <span className="flex-1 text-ink">
            {ing.amount != null && (
              <span
                className="mr-1 font-semibold tabular-nums"
                data-ingredient-amount={ing.amount}
              >
                {Number.isInteger(ing.amount) ? ing.amount : ing.amount.toFixed(2).replace(/\.?0+$/, '')}
              </span>
            )}
            {ing.unit && <span className="mr-2 text-ink-soft">{ing.unit}</span>}
            <span>{ing.name}</span>
            {ing.optional && <span className="ml-1.5 text-xs text-ink-muted">(opcjonalnie)</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}
