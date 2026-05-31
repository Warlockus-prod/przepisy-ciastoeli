import Link from 'next/link';

import { AuthorForm } from '@/components/admin/AuthorForm';

export const dynamic = 'force-dynamic';

export default function NewAuthorPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <header>
        <p className="text-xs text-ink-muted">
          <Link href="/admin/authors" className="hover:text-terracotta">
            ← Autorzy
          </Link>
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Nowy autor</h1>
      </header>
      <AuthorForm />
    </div>
  );
}
