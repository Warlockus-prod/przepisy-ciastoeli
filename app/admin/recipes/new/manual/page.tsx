import Link from 'next/link';

import { ManualRecipeForm } from '@/components/admin/ManualRecipeForm';
import { db } from '@/lib/db/client';
import { authors, categories, cuisines } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export default async function NewRecipeManualPage() {
  const [allAuthors, allCategories, allCuisines] = await Promise.all([
    db.select().from(authors),
    db.select().from(categories),
    db.select().from(cuisines),
  ]);

  return (
    <div className="max-w-4xl space-y-6">
      <header>
        <p className="text-xs text-ink-muted">
          <Link href="/admin/recipes/new" className="hover:text-terracotta">
            ← Wybór trybu
          </Link>
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Nowy przepis (ręcznie)</h1>
      </header>
      <ManualRecipeForm authors={allAuthors} categories={allCategories} cuisines={allCuisines} />
    </div>
  );
}
