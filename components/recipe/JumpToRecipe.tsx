'use client';

import { ChevronDown } from 'lucide-react';

export function JumpToRecipe() {
  const onClick = () => {
    document.getElementById('ingredients-heading')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className="no-print inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-1.5 text-sm font-semibold text-ink-soft transition-colors hover:border-terracotta hover:text-terracotta"
    >
      Skocz do przepisu
      <ChevronDown size={14} strokeWidth={2.5} />
    </button>
  );
}
