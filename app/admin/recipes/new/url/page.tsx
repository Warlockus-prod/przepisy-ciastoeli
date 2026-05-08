import Link from 'next/link';

import { UrlParserPanel } from '@/components/admin/UrlParserPanel';
import { db } from '@/lib/db/client';
import { authors, categories, cuisines } from '@/lib/db/schema';
import { isOpenAIAvailable } from '@/lib/ai/client';

export const dynamic = 'force-dynamic';

export default async function UrlParserPage() {
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
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Importuj przepis z URL</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Wklej link do innego portalu kulinarnego. System wyciągnie schema.org Recipe lub strukturę HTML, a (jeśli
          OPENAI_API_KEY jest ustawiony) GPT-4o przepisze na unikatowy artykuł SEO.
        </p>
      </header>

      <div className={`rounded-md p-3 text-sm ${isOpenAIAvailable() ? 'bg-sage/10 text-sage' : 'bg-gold/10 text-ink-soft'}`}>
        {isOpenAIAvailable() ? (
          <>✓ OPENAI_API_KEY skonfigurowany — AI rewrite dostępny.</>
        ) : (
          <>
            ⚠ OPENAI_API_KEY nie ustawiony — działa tylko ekstrakcja JSON-LD/HTML. Dodaj do <code>.env.production</code> aby uruchomić AI rewrite.
          </>
        )}
      </div>

      <UrlParserPanel authors={allAuthors} categories={allCategories} cuisines={allCuisines} />
    </div>
  );
}
