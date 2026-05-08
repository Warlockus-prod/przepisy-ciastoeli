'use client';

import { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';

import type { Ingredient } from '@/lib/db/schema';

const STORAGE_KEY = 'ce_servings_factor';

export function ServingsCalculator({
  baseServings,
  ingredients,
}: {
  baseServings: number;
  ingredients: Ingredient[];
}) {
  const [servings, setServings] = useState(baseServings);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 50) setServings(parsed);
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, String(servings));
    document
      .querySelectorAll<HTMLElement>('[data-ingredient-amount]')
      .forEach((el) => {
        const base = parseFloat(el.dataset.ingredientAmount ?? '0');
        if (!Number.isFinite(base)) return;
        const scaled = (base * servings) / baseServings;
        el.textContent = formatAmount(scaled);
      });
  }, [servings, baseServings]);

  // Avoid unused-var warning while keeping API
  void ingredients;

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-line bg-cream-deep px-4 py-3">
      <span className="text-sm font-medium text-ink-soft">Porcje</span>
      <div className="inline-flex items-center gap-2">
        <button
          type="button"
          onClick={() => setServings((s) => Math.max(1, s - 1))}
          disabled={servings <= 1}
          className="grid h-8 w-8 place-items-center rounded-full border border-line bg-surface text-ink-soft transition-colors hover:border-terracotta hover:text-terracotta disabled:opacity-40"
          aria-label="Mniej porcji"
        >
          <Minus size={14} strokeWidth={2.5} />
        </button>
        <span className="min-w-[2ch] text-center text-lg font-semibold tabular-nums">{servings}</span>
        <button
          type="button"
          onClick={() => setServings((s) => Math.min(50, s + 1))}
          disabled={servings >= 50}
          className="grid h-8 w-8 place-items-center rounded-full border border-line bg-surface text-ink-soft transition-colors hover:border-terracotta hover:text-terracotta disabled:opacity-40"
          aria-label="Więcej porcji"
        >
          <Plus size={14} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

function formatAmount(n: number): string {
  if (n === 0) return '0';
  if (n < 0.1) return n.toFixed(2);
  if (Number.isInteger(n)) return String(n);
  if (n < 10) return n.toFixed(1).replace(/\.0$/, '');
  return Math.round(n).toString();
}
