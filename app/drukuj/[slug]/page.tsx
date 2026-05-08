import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getRecipeBySlug } from '@/lib/db/queries/recipes';
import type { Ingredient, Instruction } from '@/lib/db/schema';
import { formatDuration, formatServings, plPolishDate } from '@/lib/format';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://przepisy.ciastoeli.pl';

export const revalidate = 600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);
  if (!recipe) return {};
  return {
    title: `${recipe.title} — wersja do druku`,
    robots: { index: false, follow: false },
    alternates: { canonical: `${SITE_URL}/przepisy/${recipe.slug}` },
  };
}

export default async function PrintRecipePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);
  if (!recipe) notFound();

  const ingredients = recipe.ingredients as Ingredient[];
  const instructions = recipe.instructions as Instruction[];

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 print:p-0 print:max-w-none">
      <header className="mb-6 border-b border-ink/30 pb-4 print:border-ink">
        <h1 className="font-display text-3xl font-bold leading-tight">{recipe.title}</h1>
        <p className="mt-2 text-sm text-ink-soft">{recipe.description}</p>

        <dl className="mt-4 grid grid-cols-3 gap-4 text-sm sm:grid-cols-4 print:grid-cols-4">
          <div>
            <dt className="text-xs uppercase tracking-wider text-ink-muted">Czas</dt>
            <dd className="font-medium">{formatDuration(recipe.total_time ?? recipe.prep_time)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-ink-muted">Porcje</dt>
            <dd className="font-medium">{formatServings(recipe.servings)}</dd>
          </div>
          {recipe.difficulty && (
            <div>
              <dt className="text-xs uppercase tracking-wider text-ink-muted">Trudność</dt>
              <dd className="font-medium">{recipe.difficulty}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs uppercase tracking-wider text-ink-muted">Autor</dt>
            <dd className="font-medium">{recipe.author.name}</dd>
          </div>
        </dl>
      </header>

      <section className="mb-6">
        <h2 className="font-display text-xl font-semibold mb-3">Składniki</h2>
        <ul className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2 print:grid-cols-2 print:text-sm">
          {ingredients.map((ing, i) => (
            <li key={i} className="flex items-start gap-2 break-inside-avoid">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-ink/50 print:bg-black" />
              <span>
                {ing.amount != null && (
                  <span className="font-semibold tabular-nums">
                    {Number.isInteger(ing.amount) ? ing.amount : ing.amount.toFixed(2).replace(/\.?0+$/, '')}{' '}
                  </span>
                )}
                {ing.unit && <span>{ing.unit} </span>}
                <span>{ing.name}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="font-display text-xl font-semibold mb-3">Przygotowanie</h2>
        <ol className="space-y-3">
          {instructions.map((s) => (
            <li key={s.step} className="flex gap-3 break-inside-avoid print:text-sm">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink/10 text-xs font-bold print:bg-transparent print:border print:border-ink">
                {s.step}
              </span>
              <span className="leading-relaxed">{s.text}</span>
            </li>
          ))}
        </ol>
      </section>

      {recipe.notes && (
        <section className="mb-6 break-inside-avoid">
          <h2 className="font-display text-lg font-semibold mb-2">Wskazówki</h2>
          <p className="text-sm whitespace-pre-line">{recipe.notes}</p>
        </section>
      )}

      <footer className="mt-12 border-t border-ink/30 pt-4 text-xs text-ink-muted print:border-ink">
        <p>
          Źródło: <strong>{SITE_URL}/przepisy/{recipe.slug}</strong>
          {recipe.published_at && <> · Opublikowano: {plPolishDate(recipe.published_at)}</>}
        </p>
      </footer>
    </div>
  );
}
