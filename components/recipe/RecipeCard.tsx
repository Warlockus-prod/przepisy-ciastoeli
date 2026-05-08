import Link from 'next/link';
import { Clock, Star } from 'lucide-react';

import { OptimizedImage } from '@/components/OptimizedImage';
import { DietBadges } from '@/components/recipe/DietBadges';
import { CATEGORY_LABELS_SHORT } from '@/lib/labels';
import { formatDuration, formatRating } from '@/lib/format';
import type { RecipeListItem } from '@/lib/db/queries/recipes';

export function RecipeCard({ recipe, priority = false }: { recipe: RecipeListItem; priority?: boolean }) {
  const rating = formatRating(recipe.rating_avg, recipe.rating_count);
  const time = formatDuration(recipe.total_time ?? recipe.prep_time);
  const categoryLabel = CATEGORY_LABELS_SHORT[recipe.category_slug] ?? recipe.category_slug;

  return (
    <Link
      href={`/przepisy/${recipe.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-[var(--shadow-card)] transition-all duration-300 hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-cream-deep">
        <OptimizedImage
          src={recipe.hero_image_url}
          alt={recipe.hero_image_alt}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          priority={priority}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-wider text-terracotta">
          <span>{categoryLabel}</span>
          {time !== '—' && (
            <>
              <span className="text-line-strong">·</span>
              <span className="inline-flex items-center gap-1 text-ink-muted">
                <Clock size={12} strokeWidth={2} />
                {time}
              </span>
            </>
          )}
        </div>

        <h3 className="font-display text-xl font-semibold leading-tight text-ink transition-colors group-hover:text-terracotta">
          {recipe.title}
        </h3>

        <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{recipe.description}</p>

        {recipe.diet_tags?.length > 0 && (
          <div className="mt-3">
            <DietBadges tags={recipe.diet_tags.slice(0, 3)} linked={false} size="sm" />
          </div>
        )}

        <div className="mt-auto pt-4 flex items-center justify-between text-xs text-ink-muted">
          <span>{recipe.author_name}</span>
          {rating && (
            <span className="inline-flex items-center gap-1">
              <Star size={12} fill="currentColor" className="text-gold" />
              {rating}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
