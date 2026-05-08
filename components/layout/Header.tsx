import Link from 'next/link';
import { Search } from 'lucide-react';

import { MobileMenu } from '@/components/layout/MobileMenu';

const NAV_ITEMS = [
  { href: '/przepisy', label: 'Wszystkie' },
  { href: '/kategoria/ciasta', label: 'Ciasta' },
  { href: '/kategoria/desery', label: 'Desery' },
  { href: '/kategoria/obiady', label: 'Obiady' },
  { href: '/kategoria/sniadania', label: 'Śniadania' },
  { href: '/dieta/vegan', label: 'Wegańskie' },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/85 backdrop-blur supports-[backdrop-filter]:bg-cream/70">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-baseline gap-1.5" aria-label="Strona główna">
          <span className="font-display text-2xl font-bold tracking-tight">
            przepisy<span className="text-terracotta">.</span>ciastoeli
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-7" aria-label="Główna nawigacja">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-ink-soft transition-colors hover:text-terracotta"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Link
            href="/wyszukaj"
            aria-label="Szukaj"
            className="grid h-10 w-10 place-items-center rounded-full text-ink-soft transition-colors hover:bg-cream-deep hover:text-ink"
          >
            <Search size={20} strokeWidth={1.75} />
          </Link>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
