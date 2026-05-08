import type { Metadata } from 'next';
import Link from 'next/link';

import { Breadcrumbs } from '@/components/recipe/Breadcrumbs';
import { safeBuildQuery } from '@/lib/db/safe';
import { listAuthors } from '@/lib/db/queries/authors';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'O nas',
  description: 'Poznaj zespół przepisy.ciastoeli.pl — autorów, kucharzy i dietetyków stojących za każdym przepisem.',
  alternates: { canonical: '/o-nas' },
};

export default async function AboutPage() {
  const authors = await safeBuildQuery(listAuthors(), []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ name: 'Strona główna', url: '/' }, { name: 'O nas', url: '/o-nas' }]} />

      <header className="mt-6">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">O nas</h1>
        <p className="mt-3 text-lg text-ink-soft">Domowe wypieki, smak premium.</p>
      </header>

      <div className="prose-recipe mt-8 space-y-4">
        <p>
          <strong>przepisy.ciastoeli.pl</strong> to projekt założony przez <strong>Ela</strong> — pasjonatkę domowych
          wypieków, ciast i klasycznej polskiej kuchni. Od lat dzielimy się sprawdzonymi recepturami, które rozgrzewały
          rodzinne stoły i robiły furorę na świątecznych spotkaniach.
        </p>
        <p>
          Każdy przepis jest <em>osobiście testowany</em> przed publikacją. Składniki podajemy w gramach (nie szklankach),
          czas odmierzamy precyzyjnie, a kroki opisujemy tak, żeby można je było odtworzyć nawet bez doświadczenia w kuchni.
        </p>
        <p>
          Wokół Eli zebrał się zespół autorów-specjalistów — szefów kuchni, cukierników i dietetyków klinicznych. Każdy
          artykuł przed publikacją przechodzi przez redakcję: weryfikujemy fakty, ilości i czas. Przeczytaj naszą{' '}
          <Link href="/polityka-redakcyjna" className="text-terracotta underline">politykę redakcyjną</Link> aby
          dowiedzieć się więcej.
        </p>
      </div>

      {authors.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-3xl font-bold tracking-tight">Zespół</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {authors.map((a) => (
              <Link
                key={a.id}
                href={`/autor/${a.slug}`}
                className="group flex items-start gap-4 rounded-lg border border-line bg-surface p-5 transition-colors hover:border-terracotta"
              >
                <div
                  aria-hidden
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-terracotta text-lg font-bold text-cream"
                >
                  {a.name.charAt(0)}
                </div>
                <div>
                  <p className="font-display text-lg font-semibold group-hover:text-terracotta">{a.name}</p>
                  <p className="text-sm text-ink-soft">{a.role}</p>
                  <p className="mt-1 text-sm text-ink-muted">{a.bio_short}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-14 rounded-lg border border-line bg-cream-deep p-6">
        <h2 className="font-display text-xl font-semibold">Transparentność</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Część artykułów opracowywana jest z udziałem narzędzi AI (rewriting, oszacowanie wartości odżywczych,
          generowanie wstępnych szkiców). <strong>Każdy</strong> przepis przed publikacją jest sprawdzany przez
          człowieka. Jeśli zauważysz błąd lub masz uwagi —{' '}
          <Link href="/kontakt" className="text-terracotta underline">napisz do nas</Link>.
        </p>
      </section>
    </div>
  );
}
