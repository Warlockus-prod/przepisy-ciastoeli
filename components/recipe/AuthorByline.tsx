import Link from 'next/link';

import type { Author } from '@/lib/db/schema';

export function AuthorByline({ author }: { author: Author }) {
  return (
    <section className="flex items-start gap-4 rounded-lg border border-line bg-cream-deep p-6">
      <div
        aria-hidden
        className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-terracotta text-xl font-bold text-cream"
      >
        {author.name.charAt(0)}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Autor</p>
        <Link
          href={`/autor/${author.slug}`}
          className="font-display text-xl font-semibold text-ink transition-colors hover:text-terracotta"
        >
          {author.name}
        </Link>
        <p className="mt-1 text-sm text-ink-soft">{author.bio_short}</p>
      </div>
    </section>
  );
}
