'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { RecipeCard } from '@/components/recipe/RecipeCard';
import type { RecipeListItem } from '@/lib/db/queries/recipes';

const FAVORITES_KEY = 'ce_favorites_v1';

export function FavoritesList() {
  const [recipes, setRecipes] = useState<RecipeListItem[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const ids = readFavorites();
    if (ids.length === 0) {
      setRecipes([]);
      return;
    }
    fetch(`/api/public/recipes?ids=${ids.join(',')}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const json = await r.json();
        setRecipes(json.recipes ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Błąd'));
  }, []);

  if (error) return <p className="rounded-lg border border-line bg-cream-deep p-6 text-center text-terracotta">{error}</p>;
  if (recipes === null) return <p className="text-ink-muted">Ładowanie...</p>;

  if (recipes.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-cream-deep p-8 text-center">
        <p className="text-ink-soft">Nie masz jeszcze zapisanych przepisów.</p>
        <Link
          href="/przepisy"
          className="mt-4 inline-block rounded-full bg-terracotta px-5 py-2 text-sm font-semibold text-cream hover:bg-terracotta-hover"
        >
          Przeglądaj przepisy
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {recipes.map((r) => (
        <RecipeCard key={r.id} recipe={r} />
      ))}
    </div>
  );
}

function readFavorites(): number[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'number') : [];
  } catch {
    return [];
  }
}
