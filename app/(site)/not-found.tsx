import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
      <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-terracotta">404</span>
      <h1 className="mt-3 font-display text-5xl font-bold tracking-tight">Nie znaleziono przepisu</h1>
      <p className="mt-4 max-w-md text-lg text-ink-soft">
        Strona nie istnieje lub przepis został przeniesiony. Sprawdź naszą bazę przepisów lub wróć na stronę
        główną.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/"
          className="rounded-full bg-terracotta px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-terracotta-hover"
        >
          Strona główna
        </Link>
        <Link
          href="/przepisy"
          className="rounded-full border border-line bg-surface px-6 py-3 text-sm font-semibold text-ink-soft transition-colors hover:border-terracotta hover:text-terracotta"
        >
          Wszystkie przepisy
        </Link>
      </div>
    </div>
  );
}
