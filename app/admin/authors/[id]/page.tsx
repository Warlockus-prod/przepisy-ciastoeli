import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';

import { AuthorForm } from '@/components/admin/AuthorForm';
import { db } from '@/lib/db/client';
import { authors } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export default async function EditAuthorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authorId = parseInt(id, 10);
  if (Number.isNaN(authorId)) notFound();

  const [author] = await db.select().from(authors).where(eq(authors.id, authorId)).limit(1);
  if (!author) notFound();

  return (
    <div className="max-w-4xl space-y-6">
      <header>
        <p className="text-xs text-ink-muted">
          <Link href="/admin/authors" className="hover:text-terracotta">
            ← Autorzy
          </Link>
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">{author.name}</h1>
        <p className="mt-1 text-sm text-ink-soft">
          /{author.slug} ·{' '}
          <Link href={`/autor/${author.slug}`} target="_blank" className="text-terracotta hover:underline">
            zobacz profil ↗
          </Link>
        </p>
      </header>
      <AuthorForm author={author} />
    </div>
  );
}
