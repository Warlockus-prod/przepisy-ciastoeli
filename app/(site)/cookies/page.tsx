import type { Metadata } from 'next';

import { Breadcrumbs } from '@/components/recipe/Breadcrumbs';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Cookies',
  alternates: { canonical: '/cookies' },
};

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ name: 'Strona główna', url: '/' }, { name: 'Cookies', url: '/cookies' }]} />

      <header className="mt-6">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Polityka cookies</h1>
      </header>

      <div className="prose-recipe mt-8 space-y-6">
        <section>
          <h2>Jakie cookies używamy</h2>
          <table className="w-full text-sm">
            <thead className="bg-cream-deep">
              <tr>
                <th className="p-3 text-left">Cookie</th>
                <th className="p-3 text-left">Cel</th>
                <th className="p-3 text-left">Czas</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-line">
                <td className="p-3 font-mono">ce_admin_session</td>
                <td className="p-3">Sesja administratora</td>
                <td className="p-3">8 godzin</td>
              </tr>
              <tr className="border-t border-line">
                <td className="p-3 font-mono">_ga, _gid</td>
                <td className="p-3">Google Analytics (po zgodzie)</td>
                <td className="p-3">2 lata</td>
              </tr>
              <tr className="border-t border-line">
                <td className="p-3 font-mono">cc_consent_v1</td>
                <td className="p-3">Twoje preferencje cookies</td>
                <td className="p-3">365 dni</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Zarządzanie</h2>
          <p>
            Możesz zarządzać preferencjami w dowolnym momencie poprzez panel cookies w stopce, lub wyczyścić cookies w
            ustawieniach przeglądarki.
          </p>
        </section>

        <section>
          <h2>Reklama (Google AdSense, VOX SSP)</h2>
          <p>
            Po Twojej zgodzie reklamodawcy mogą używać cookies do personalizacji reklam. Możesz wyłączyć
            personalizację na <a href="https://adssettings.google.com/" target="_blank" rel="noopener">adssettings.google.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
