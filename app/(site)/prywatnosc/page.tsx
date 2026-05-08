import type { Metadata } from 'next';

import { Breadcrumbs } from '@/components/recipe/Breadcrumbs';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Polityka prywatności',
  alternates: { canonical: '/prywatnosc' },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ name: 'Strona główna', url: '/' }, { name: 'Polityka prywatności', url: '/prywatnosc' }]} />

      <header className="mt-6">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Polityka prywatności</h1>
      </header>

      <div className="prose-recipe mt-8 space-y-6">
        <p className="text-sm text-ink-muted">Ostatnia aktualizacja: 8 maja 2026</p>

        <section>
          <h2>1. Administrator danych</h2>
          <p>
            Administratorem Twoich danych osobowych jest właściciel portalu przepisy.ciastoeli.pl. Kontakt:{' '}
            <a href="mailto:redakcja@ciastoeli.pl">redakcja@ciastoeli.pl</a>.
          </p>
        </section>

        <section>
          <h2>2. Jakie dane zbieramy</h2>
          <ul>
            <li><strong>Adres IP</strong> — automatycznie, do statystyk i ochrony przed spamem (przechowujemy zhashowany)</li>
            <li><strong>User agent</strong> — przeglądarka, system, do diagnostyki</li>
            <li><strong>Imię i email</strong> — przy ocenie przepisu (opcjonalne)</li>
            <li><strong>Lokalne dane</strong> — zapisane przepisy, lista zakupów (localStorage, nie wysyłane na serwer)</li>
          </ul>
        </section>

        <section>
          <h2>3. Cookies</h2>
          <p>
            Używamy cookies do: (a) działania portalu (sesja admina); (b) statystyk (Google Analytics — tylko po Twojej
            zgodzie); (c) reklamy (Google AdSense, VOX SSP — tylko po zgodzie).
          </p>
          <p>
            Banner cookies pojawia się przy pierwszej wizycie. Możesz zarządzać preferencjami w dowolnym momencie.
          </p>
        </section>

        <section>
          <h2>4. Twoje prawa (RODO)</h2>
          <ul>
            <li>Prawo dostępu do swoich danych</li>
            <li>Prawo sprostowania</li>
            <li>Prawo usunięcia ("prawo do bycia zapomnianym")</li>
            <li>Prawo ograniczenia przetwarzania</li>
            <li>Prawo do przenoszenia danych</li>
            <li>Prawo wniesienia skargi do PUODO</li>
          </ul>
          <p>
            Aby skorzystać — napisz na <a href="mailto:redakcja@ciastoeli.pl">redakcja@ciastoeli.pl</a>.
          </p>
        </section>

        <section>
          <h2>5. Bezpieczeństwo</h2>
          <p>
            Używamy HTTPS na wszystkich stronach. Hasła administratora są hashowane. Adres IP w bazie ocen jest
            zhashowany SHA-256 z solą.
          </p>
        </section>
      </div>
    </div>
  );
}
