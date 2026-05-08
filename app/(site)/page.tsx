import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { OptimizedImage } from '@/components/OptimizedImage';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { WebsiteStructuredData } from '@/components/StructuredData';
import { listCategoriesWithCounts, listFeaturedRecipes, listLatestRecipes } from '@/lib/db/queries/recipes';

export const revalidate = 300;
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [featured, latest, categories] = await Promise.all([
    listFeaturedRecipes(5),
    listLatestRecipes(8),
    listCategoriesWithCounts(),
  ]);

  const hero = featured[0];
  const featuredRest = featured.slice(1, 5);

  return (
    <>
      <WebsiteStructuredData />

      {hero && (
        <section className="border-b border-line">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-20">
            <div className="order-2 flex flex-col justify-center lg:order-1">
              <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-terracotta">
                Wybór redakcji
              </span>
              <h1 className="mt-3 font-display text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
                {hero.title}
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">{hero.description}</p>
              <div className="mt-8">
                <Link
                  href={`/przepisy/${hero.slug}`}
                  className="inline-flex items-center gap-2 rounded-full bg-terracotta px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-terracotta-hover"
                >
                  Zobacz przepis
                  <ArrowRight size={16} strokeWidth={2.5} />
                </Link>
              </div>
            </div>

            <Link href={`/przepisy/${hero.slug}`} className="order-1 lg:order-2">
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg shadow-[var(--shadow-hero)]">
                <OptimizedImage
                  src={hero.hero_image_url}
                  alt={hero.hero_image_alt}
                  fill
                  sizes="(min-width: 1024px) 600px, 100vw"
                  priority
                  className="object-cover"
                />
              </div>
            </Link>
          </div>
        </section>
      )}

      {featuredRest.length > 0 && (
        <Section
          eyebrow="Polecane"
          heading="Sprawdzone przepisy"
          link={{ href: '/przepisy', label: 'Wszystkie przepisy' }}
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredRest.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        </Section>
      )}

      <Section eyebrow="Kategorie" heading="Czego dziś szukasz?">
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {categories
            .filter((c) => Number(c.count) > 0)
            .slice(0, 10)
            .map((cat) => (
              <Link
                key={cat.slug}
                href={`/kategoria/${cat.slug}`}
                className="group flex items-center justify-between rounded-lg border border-line bg-surface px-4 py-3.5 transition-colors hover:border-terracotta"
              >
                <span className="font-display text-base font-semibold text-ink group-hover:text-terracotta">
                  {cat.name_pl}
                </span>
                <span className="text-xs tabular-nums text-ink-muted">{cat.count}</span>
              </Link>
            ))}
        </div>
      </Section>

      <Section eyebrow="Najnowsze" heading="Świeżo z piekarnika" link={{ href: '/przepisy', label: 'Zobacz więcej' }}>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {latest.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      </Section>
    </>
  );
}

function Section({
  eyebrow,
  heading,
  link,
  children,
}: {
  eyebrow: string;
  heading: string;
  link?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-terracotta">{eyebrow}</span>
          <h2 className="mt-1.5 font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
            {heading}
          </h2>
        </div>
        {link && (
          <Link
            href={link.href}
            className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-terracotta transition-colors hover:text-terracotta-hover sm:inline-flex"
          >
            {link.label}
            <ArrowRight size={14} strokeWidth={2.5} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
