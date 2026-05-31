'use client';

import { Search } from 'lucide-react';

export function SearchTrigger() {
  return (
    <button
      type="button"
      aria-label="Szukaj"
      onClick={() => window.dispatchEvent(new CustomEvent('ce:open-search'))}
      className="grid h-10 w-10 place-items-center rounded-full text-ink-soft transition-colors hover:bg-cream-deep hover:text-ink"
    >
      <Search size={20} strokeWidth={1.75} />
    </button>
  );
}
