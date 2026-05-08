import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';

import { RecipeEditForm } from '@/components/admin/RecipeEditForm';
import { db } from '@/lib/db/client';
import { authors, recipes } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export default async function AdminRecipeEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipeId = parseInt(id, 10);
  if (Number.isNaN(recipeId)) notFound();

  const [recipe] = await db.select().from(recipes).where(eq(recipes.id, recipeId)).limit(1);
  if (!recipe) notFound();

  const allAuthors = await db.select().from(authors);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs text-ink-muted">
          <Link href="/admin/recipes" className="hover:text-terracotta">
            ← Przepisy
          </Link>
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">{recipe.title}</h1>
        <p className="mt-1 text-sm text-ink-soft">
          ID #{recipe.id} · /{recipe.slug} ·{' '}
          <Link href={`/przepisy/${recipe.slug}`} target="_blank" className="text-terracotta hover:underline">
            zobacz na froncie ↗
          </Link>
        </p>
      </header>

      <RecipeEditForm recipe={recipe} authors={allAuthors} />
    </div>
  );
}
