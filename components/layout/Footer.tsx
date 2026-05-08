import Link from 'next/link';

const COL_KATEGORIE = [
  { href: '/kategoria/ciasta', label: 'Ciasta' },
  { href: '/kategoria/desery', label: 'Desery' },
  { href: '/kategoria/obiady', label: 'Obiady' },
  { href: '/kategoria/zupy', label: 'Zupy' },
  { href: '/kategoria/sniadania', label: 'Śniadania' },
  { href: '/kategoria/przekaski', label: 'Przekąski' },
];

const COL_DIETY = [
  { href: '/dieta/vegan', label: 'Wegańskie' },
  { href: '/dieta/vegetarian', label: 'Wegetariańskie' },
  { href: '/dieta/gluten-free', label: 'Bezglutenowe' },
  { href: '/dieta/keto', label: 'Keto' },
  { href: '/dieta/high-protein', label: 'Wysokobiałkowe' },
];

const COL_PORTAL = [
  { href: '/o-nas', label: 'O nas' },
  { href: '/polityka-redakcyjna', label: 'Polityka redakcyjna' },
  { href: '/kontakt', label: 'Kontakt' },
  { href: '/prywatnosc', label: 'Polityka prywatności' },
  { href: '/cookies', label: 'Cookies' },
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-line bg-cream-deep">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="font-display text-xl font-bold tracking-tight">
              przepisy<span className="text-terracotta">.</span>ciastoeli
            </Link>
            <p className="mt-3 max-w-xs text-sm text-ink-soft">
              Domowe wypieki, smak premium. Sprawdzone polskie przepisy z dokładnymi wskazówkami i wartościami
              odżywczymi.
            </p>
          </div>

          <FooterColumn title="Kategorie" items={COL_KATEGORIE} />
          <FooterColumn title="Diety" items={COL_DIETY} />
          <FooterColumn title="Portal" items={COL_PORTAL} />
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-line pt-6 text-sm text-ink-muted sm:flex-row">
          <span>© {year} przepisy.ciastoeli.pl. Wszystkie prawa zastrzeżone.</span>
          <span>
            Treści edytorialne — sprawdź naszą{' '}
            <Link href="/polityka-redakcyjna" className="underline hover:text-terracotta">
              politykę redakcyjną
            </Link>
            .
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, items }: { title: string; items: Array<{ href: string; label: string }> }) {
  return (
    <div>
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink-muted">{title}</h3>
      <ul className="space-y-2.5">
        {items.map((it) => (
          <li key={it.href}>
            <Link href={it.href} className="text-sm text-ink-soft transition-colors hover:text-terracotta">
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
