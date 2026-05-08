import type { Metadata } from 'next';
import Link from 'next/link';

import { Breadcrumbs } from '@/components/recipe/Breadcrumbs';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Polityka redakcyjna',
  description: 'Standardy edytorskie, weryfikacja faktów i zasady publikacji przepisów na przepisy.ciastoeli.pl.',
  alternates: { canonical: '/polityka-redakcyjna' },
};

export default function EditorialPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { name: 'Strona główna', url: '/' },
          { name: 'Polityka redakcyjna', url: '/polityka-redakcyjna' },
        ]}
      />

      <header className="mt-6">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Polityka redakcyjna</h1>
        <p className="mt-3 text-lg text-ink-soft">
          Jak tworzymy, weryfikujemy i publikujemy przepisy na przepisy.ciastoeli.pl.
        </p>
      </header>

      <div className="prose-recipe mt-10 space-y-8">
        <section>
          <h2 className="font-display text-2xl font-semibold">1. Misja</h2>
          <p>
            Naszą misją jest dostarczanie <strong>sprawdzonych, dokładnie opisanych przepisów</strong> — od klasyki
            polskiej kuchni po nowoczesne wariacje światowych dań. Każdy przepis ma być powtarzalny i działający w
            domowej kuchni, z dokładnymi ilościami i czasami.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold">2. Standardy weryfikacji</h2>
          <p>Każdy przepis przed publikacją:</p>
          <ul>
            <li>Jest <strong>osobiście testowany</strong> przez autora lub członka zespołu</li>
            <li>Ma podane składniki w gramach lub mililitrach (nie tylko "szklanka")</li>
            <li>Zawiera precyzyjny czas przygotowania i pieczenia</li>
            <li>Ma zdjęcie hero (1200×800 px lub większe)</li>
            <li>Jest zatwierdzany przez redakcję pod kątem klarowności kroków</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold">3. Korekta błędów</h2>
          <p>
            Jeśli zauważysz błąd w przepisie — niepoprawną ilość, brakujący składnik, niejasny krok — napisz do nas
            przez <Link href="/kontakt">stronę kontaktową</Link>. Korygujemy błąd w ciągu 48 godzin i publikujemy
            informację o zmianie z datą `dateModified` w polu schema.org.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold">4. Wartości odżywcze</h2>
          <p>
            Wartości odżywcze (kcal, białko, węglowodany, tłuszcze) podajemy <strong>orientacyjnie</strong> — są
            szacowane na podstawie typowych wartości składników (USDA, IZŻ). Mogą się różnić w zależności od marki
            produktu. Dla diet medycznych zalecamy konsultację z dietetykiem.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold">5. Wykorzystanie AI</h2>
          <p>
            W procesie redakcyjnym wykorzystujemy narzędzia AI do:
          </p>
          <ul>
            <li>Rewritingu źródłowych receptur w jednolitym stylu</li>
            <li>Tłumaczenia z innych języków</li>
            <li>Wstępnego szacowania wartości odżywczych</li>
            <li>Sugerowania wariantów dla diet specjalnych</li>
          </ul>
          <p>
            <strong>AI nigdy nie publikuje samodzielnie.</strong> Każdy artykuł przed publikacją jest sprawdzany i
            zatwierdzany przez człowieka.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold">6. Niezależność redakcyjna</h2>
          <p>
            Treści edytorskie są niezależne od reklamodawców. Reklamy (AdSense, VOX SSP) wyświetlamy tylko na pozycjach
            wyraźnie oznaczonych jako reklama. Nigdy nie publikujemy treści sponsorowanej bez oznaczenia.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold">7. Prawa autorskie</h2>
          <p>
            Wszystkie teksty na portalu są oryginalne. Zdjęcia są albo własne, albo z licencjonowanych źródeł
            (Unsplash, własne fotografie). Cytaty zewnętrzne (np. źródłowe receptury) zawsze zawierają link do
            oryginału.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold">8. Kontakt redakcyjny</h2>
          <p>
            Wszelkie zapytania, sugestie, korekty: <Link href="/kontakt">strona kontaktowa</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
