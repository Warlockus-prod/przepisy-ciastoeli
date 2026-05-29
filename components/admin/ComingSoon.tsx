import Link from 'next/link';
import { Construction } from 'lucide-react';

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
      </header>
      <div className="flex flex-col items-center justify-center rounded-lg border border-line bg-surface p-12 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-cream-deep text-terracotta">
          <Construction size={28} strokeWidth={1.5} />
        </span>
        <h2 className="mt-4 font-display text-xl font-semibold">Wkrótce</h2>
        <p className="mt-2 max-w-md text-sm text-ink-soft">{description}</p>
        <Link
          href="/admin"
          className="mt-6 rounded-full border border-line bg-cream-deep px-5 py-2 text-sm font-semibold text-ink-soft hover:border-terracotta hover:text-terracotta"
        >
          ← Pulpit
        </Link>
      </div>
    </div>
  );
}
