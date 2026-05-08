import Link from 'next/link';

const DIET_LABELS: Record<string, { label: string; icon?: string }> = {
  vegan: { label: 'Wegańskie', icon: '🌱' },
  vegetarian: { label: 'Wegetariańskie', icon: '🥗' },
  'gluten-free': { label: 'Bezglutenowe', icon: '🌾' },
  'dairy-free': { label: 'Bez nabiału', icon: '🥛' },
  keto: { label: 'Keto', icon: '🥑' },
  'low-carb': { label: 'Niskowęglowodanowe', icon: '🥦' },
  'sugar-free': { label: 'Bez cukru' },
  'high-protein': { label: 'Wysokobiałkowe', icon: '💪' },
  'low-calorie': { label: 'Niskokaloryczne' },
  paleo: { label: 'Paleo' },
  raw: { label: 'Surowe' },
};

export function DietBadges({ tags, linked = true, size = 'md' }: { tags: string[]; linked?: boolean; size?: 'sm' | 'md' }) {
  if (!tags?.length) return null;
  return (
    <ul className="flex flex-wrap gap-2">
      {tags.map((slug) => {
        const meta = DIET_LABELS[slug] ?? { label: slug };
        const cls =
          size === 'sm'
            ? 'inline-flex items-center gap-1 rounded-full border border-sage/40 bg-sage/[0.08] px-2.5 py-0.5 text-xs font-medium text-sage'
            : 'inline-flex items-center gap-1.5 rounded-full border border-sage/40 bg-sage/[0.08] px-3 py-1 text-sm font-medium text-sage';
        return (
          <li key={slug}>
            {linked ? (
              <Link href={`/dieta/${slug}`} className={`${cls} transition-colors hover:border-sage hover:bg-sage/15`}>
                {meta.icon && <span aria-hidden>{meta.icon}</span>}
                {meta.label}
              </Link>
            ) : (
              <span className={cls}>
                {meta.icon && <span aria-hidden>{meta.icon}</span>}
                {meta.label}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
