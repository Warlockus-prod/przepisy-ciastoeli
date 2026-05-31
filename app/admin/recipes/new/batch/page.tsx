import Link from 'next/link';

import { BatchImportPanel } from '@/components/admin/BatchImportPanel';
import { db } from '@/lib/db/client';
import { authors } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export default async function BatchImportPage() {
  const allAuthors = await db.select().from(authors);

  return (
    <div className="max-w-4xl space-y-6">
      <header>
        <p className="text-xs text-ink-muted">
          <Link href="/admin/recipes/new" className="hover:text-terracotta">
            ← Wybór trybu
          </Link>
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Import zbiorczy</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Wgraj plik JSON lub CSV z wieloma przepisami. Składniki są automatycznie parsowane na ilość/jednostkę/nazwę.
          Duplikaty (po slug) są pomijane.
        </p>
      </header>

      <BatchImportPanel authors={allAuthors} />
    </div>
  );
}
