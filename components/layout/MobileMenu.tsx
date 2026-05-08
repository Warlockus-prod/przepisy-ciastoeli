'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, X, Search } from 'lucide-react';

const NAV_GROUPS = [
  {
    label: 'Kategorie',
    items: [
      { href: '/kategoria/ciasta', label: 'Ciasta i wypieki' },
      { href: '/kategoria/desery', label: 'Desery' },
      { href: '/kategoria/obiady', label: 'Obiady' },
      { href: '/kategoria/zupy', label: 'Zupy' },
      { href: '/kategoria/salatki', label: 'Sałatki' },
      { href: '/kategoria/sniadania', label: 'Śniadania' },
      { href: '/kategoria/przekaski', label: 'Przekąski' },
      { href: '/kategoria/napoje', label: 'Napoje' },
      { href: '/kategoria/przetwory', label: 'Przetwory' },
    ],
  },
  {
    label: 'Diety',
    items: [
      { href: '/dieta/vegan', label: 'Wegańskie' },
      { href: '/dieta/vegetarian', label: 'Wegetariańskie' },
      { href: '/dieta/gluten-free', label: 'Bezglutenowe' },
      { href: '/dieta/keto', label: 'Keto' },
      { href: '/dieta/high-protein', label: 'Wysokobiałkowe' },
    ],
  },
  {
    label: 'Portal',
    items: [
      { href: '/przepisy', label: 'Wszystkie przepisy' },
      { href: '/wyszukaj', label: 'Wyszukaj' },
      { href: '/ulubione', label: 'Ulubione' },
      { href: '/lista-zakupow', label: 'Lista zakupów' },
      { href: '/o-nas', label: 'O nas' },
    ],
  },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    if (open) document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Otwórz menu"
        className="grid h-10 w-10 place-items-center rounded-full text-ink-soft transition-colors hover:bg-cream-deep md:hidden"
      >
        <Menu size={20} strokeWidth={1.75} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-0 h-full w-[88vw] max-w-sm overflow-y-auto bg-cream shadow-[var(--shadow-hero)]">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <Link href="/" onClick={() => setOpen(false)} className="font-display text-lg font-bold tracking-tight">
                przepisy<span className="text-terracotta">.</span>ciastoeli
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Zamknij menu"
                className="grid h-10 w-10 place-items-center rounded-full text-ink-soft hover:bg-cream-deep"
              >
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>

            <Link
              href="/wyszukaj"
              onClick={() => setOpen(false)}
              className="mx-5 mt-5 flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink-soft hover:border-terracotta"
            >
              <Search size={16} strokeWidth={1.75} />
              Wyszukaj przepisy...
            </Link>

            <nav className="px-5 py-6 space-y-7">
              {NAV_GROUPS.map((g) => (
                <div key={g.label}>
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                    {g.label}
                  </h3>
                  <ul className="space-y-0.5">
                    {g.items.map((it) => (
                      <li key={it.href}>
                        <Link
                          href={it.href}
                          onClick={() => setOpen(false)}
                          className="block rounded-md px-3 py-2 -mx-3 text-base font-medium text-ink hover:bg-cream-deep hover:text-terracotta"
                        >
                          {it.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
