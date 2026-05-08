import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { AuthorByline } from '@/components/recipe/AuthorByline';
import { Breadcrumbs } from '@/components/recipe/Breadcrumbs';
import { IngredientList } from '@/components/recipe/IngredientList';
import { InstructionSteps } from '@/components/recipe/InstructionSteps';
import { JumpToRecipe } from '@/components/recipe/JumpToRecipe';
import { RatingsSection } from '@/components/recipe/RatingsSection';
import { RecipeActions } from '@/components/recipe/RecipeActions';
import { RecipeHero } from '@/components/recipe/RecipeHero';
import { RecipeStructuredData } from '@/components/recipe/RecipeStructuredData';
import { RelatedRecipes } from '@/components/recipe/RelatedRecipes';
import { ServingsCalculator } from '@/components/recipe/ServingsCalculator';
import { getRecipeBySlug } from '@/lib/db/queries/recipes';
import type { FaqItem, Ingredient, Instruction } from '@/lib/db/schema';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://przepisy.ciastoeli.pl';

const CATEGORY_LABELS: Record<string, string> = {
  ciasta: 'Ciasta',
  desery: 'Desery',
  obiady: 'Obiady',
  zupy: 'Zupy',
  salatki: 'Sałatki',
  sniadania: 'Śniadania',
  przekaski: 'Przekąski',
  napoje: 'Napoje',
  przetwory: 'Przetwory',
  'dla-dzieci': 'Dla dzieci',
};

export const revalidate = 600;
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);
  if (!recipe) return {};

  const url = `${SITE_URL}/przepisy/${recipe.slug}`;
  return {
    title: recipe.meta_title ?? recipe.title,
    description: recipe.meta_description ?? recipe.description.slice(0, 180),
    alternates: { canonical: url },
    robots: { index: true, follow: true, 'max-image-preview': 'large' },
    openGraph: {
      type: 'article',
      url,
      title: recipe.title,
      description: recipe.meta_description ?? recipe.description.slice(0, 200),
      images: [
        {
          url: recipe.og_image_url ?? recipe.hero_image_url,
          width: 1200,
          height: 630,
          alt: recipe.hero_image_alt,
        },
      ],
      publishedTime: recipe.published_at?.toISOString(),
      modifiedTime: recipe.updated_at.toISOString(),
      authors: [`${SITE_URL}/autor/${recipe.author.slug}`],
      tags: recipe.tags,
    },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function RecipePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);
  if (!recipe) notFound();

  const ingredients = recipe.ingredients as Ingredient[];
  const instructions = recipe.instructions as Instruction[];
  const faq = recipe.faq as FaqItem[] | null;

  const breadcrumbs = [
    { name: 'Strona główna', url: '/' },
    { name: 'Przepisy', url: '/przepisy' },
    {
      name: CATEGORY_LABELS[recipe.category_slug] ?? recipe.category_slug,
      url: `/kategoria/${recipe.category_slug}`,
    },
    { name: recipe.title, url: `/przepisy/${recipe.slug}` },
  ];

  return (
    <>
      <RecipeStructuredData
        recipe={recipe}
        breadcrumbs={breadcrumbs.map((b) => ({ name: b.name, url: b.url }))}
      />

      <RecipeHero recipe={recipe} />

      <article className="mx-auto max-w-4xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Breadcrumbs items={breadcrumbs} />
          <div className="flex flex-wrap gap-2">
            <JumpToRecipe />
            <RecipeActions recipeId={recipe.id} slug={recipe.slug} title={recipe.title} />
          </div>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div className="space-y-3 lg:sticky lg:top-24 lg:self-start">
            <ServingsCalculator baseServings={recipe.servings} ingredients={ingredients} />
            <IngredientList ingredients={ingredients} servings={recipe.servings} />
          </div>

          <div className="space-y-10">
            <InstructionSteps steps={instructions} />

            {recipe.notes && (
              <section className="rounded-lg border border-line bg-cream-deep p-6">
                <h2 className="font-display text-2xl font-semibold">Wskazówki</h2>
                <p className="prose-recipe mt-3 whitespace-pre-line">{recipe.notes}</p>
              </section>
            )}

            {Array.isArray(recipe.variants) && (recipe.variants as string[]).length > 0 && (
              <section>
                <h2 className="font-display text-2xl font-semibold">Warianty</h2>
                <ul className="mt-3 space-y-2">
                  {(recipe.variants as string[]).map((v, i) => (
                    <li key={i} className="rounded-md border-l-2 border-terracotta bg-surface px-4 py-2.5 text-ink-soft">
                      {v}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {faq && faq.length > 0 && (
              <section>
                <h2 className="font-display text-2xl font-semibold">Często zadawane pytania</h2>
                <dl className="mt-4 space-y-4">
                  {faq.map((item, i) => (
                    <div key={i} className="rounded-lg border border-line bg-surface p-5">
                      <dt className="font-semibold text-ink">{item.q}</dt>
                      <dd className="mt-1.5 text-ink-soft">{item.a}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            <AuthorByline author={recipe.author} />

            <RatingsSection
              recipeId={recipe.id}
              ratingAvg={recipe.rating_avg}
              ratingCount={recipe.rating_count}
            />
          </div>
        </div>
      </article>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <RelatedRecipes recipe={recipe} />
      </div>
    </>
  );
}
