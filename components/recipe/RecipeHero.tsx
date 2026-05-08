import Link from 'next/link';
import { Clock, ChefHat, Users, Star } from 'lucide-react';

import { OptimizedImage } from '@/components/OptimizedImage';
import { DietBadges } from '@/components/recipe/DietBadges';
import { CATEGORY_LABELS_SHORT, CUISINE_LABELS } from '@/lib/labels';
import { formatDuration, formatRating, formatServings, plPolishDate } from '@/lib/format';
import type { RecipeWithAuthor } from '@/lib/db/queries/recipes';

export function RecipeHero({ recipe }: { recipe: RecipeWithAuthor }) {
  const rating = formatRating(recipe.rating_avg, recipe.rating_count);
  const categoryLabel = CATEGORY_LABELS_SHORT[recipe.category_slug] ?? recipe.category_slug;
  const cuisineLabel = recipe.cuisine_slug ? CUISINE_LABELS[recipe.cuisine_slug] ?? recipe.cuisine_slug : null;

  return (
    <section className="bg-cream-deep">
      <div className="relative aspect-[16/10] w-full overflow-hidden md:aspect-[21/9]">
        <OptimizedImage
          src={recipe.hero_image_url}
          alt={recipe.hero_image_alt}
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-cream-deep" />
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <div className="mb-3 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-terracotta">
          <Link href={`/kategoria/${recipe.category_slug}`} className="transition-colors hover:underline">
            {categoryLabel}
          </Link>
          {cuisineLabel && (
            <>
              <span className="text-line-strong">·</span>
              <Link href={`/kuchnia/${recipe.cuisine_slug}`} className="text-ink-soft transition-colors hover:underline">
                {cuisineLabel}
              </Link>
            </>
          )}
        </div>

        <h1 className="font-display text-4xl font-bold leading-tight text-ink sm:text-5xl md:text-[3.5rem]">
          {recipe.title}
        </h1>

        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">{recipe.description}</p>

        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-soft">
          <Link href={`/autor/${recipe.author.slug}`} className="font-medium text-ink transition-colors hover:text-terracotta">
            {recipe.author.name}
          </Link>
          {recipe.published_at && (
            <>
              <span className="text-line-strong">·</span>
              <time dateTime={recipe.published_at.toISOString()}>{plPolishDate(recipe.published_at)}</time>
            </>
          )}
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
          <MetaPill icon={<Clock size={16} strokeWidth={1.75} />} label={formatDuration(recipe.total_time ?? recipe.prep_time)} />
          <MetaPill icon={<Users size={16} strokeWidth={1.75} />} label={formatServings(recipe.servings)} />
          {recipe.difficulty && <MetaPill icon={<ChefHat size={16} strokeWidth={1.75} />} label={recipe.difficulty} />}
          {rating && (
            <MetaPill
              icon={<Star size={16} fill="currentColor" className="text-gold" />}
              label={rating}
            />
          )}
        </div>

        {recipe.diet_tags.length > 0 && (
          <div className="mt-6">
            <DietBadges tags={recipe.diet_tags} />
          </div>
        )}
      </div>
    </section>
  );
}

function MetaPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-ink-soft">
      <span className="text-ink-muted">{icon}</span>
      <span className="font-medium">{label}</span>
    </span>
  );
}
