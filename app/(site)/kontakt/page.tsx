import type { Metadata } from 'next';
import { Mail, MessageCircle } from 'lucide-react';

import { Breadcrumbs } from '@/components/recipe/Breadcrumbs';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Kontakt',
  description: 'Skontaktuj się z redakcją przepisy.ciastoeli.pl — sugestie, korekty, współpraca.',
  alternates: { canonical: '/kontakt' },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ name: 'Strona główna', url: '/' }, { name: 'Kontakt', url: '/kontakt' }]} />

      <header className="mt-6">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Kontakt</h1>
        <p className="mt-3 text-lg text-ink-soft">
          Sugestie, korekty, propozycje współpracy — chętnie usłyszymy.
        </p>
      </header>

      <div className="mt-10 space-y-4">
        <a
          href="mailto:redakcja@ciastoeli.pl"
          className="flex items-start gap-4 rounded-lg border border-line bg-surface p-6 transition-colors hover:border-terracotta"
        >
          <Mail className="mt-1 shrink-0 text-terracotta" size={24} strokeWidth={1.75} />
          <div>
            <p className="font-display text-lg font-semibold">Email</p>
            <p className="text-ink-soft">redakcja@ciastoeli.pl</p>
            <p className="mt-1 text-xs text-ink-muted">
              Odpowiadamy w ciągu 48 godzin (poza weekendami i świętami).
            </p>
          </div>
        </a>

        <div className="rounded-lg border border-line bg-cream-deep p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <MessageCircle size={20} strokeWidth={1.75} />
            Co napisać?
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            <li>
              <strong>Korekta przepisu</strong> — wskaż konkretny przepis (link), opis błędu i sugerowaną poprawkę.
            </li>
            <li>
              <strong>Sugestia tematu</strong> — czego chcesz się nauczyć? Co byś chciał zobaczyć w przepisach?
            </li>
            <li>
              <strong>Współpraca</strong> — autorzy, współautorstwo, partnerstwa.
            </li>
            <li>
              <strong>Reklama</strong> — kontakt do działu sprzedaży reklamowej.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
