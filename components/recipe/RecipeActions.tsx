'use client';

import { useEffect, useState } from 'react';
import { Bookmark, Printer, Share2 } from 'lucide-react';

const FAVORITES_KEY = 'ce_favorites_v1';

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

function writeFavorites(ids: number[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
}

export function RecipeActions({ recipeId, slug, title }: { recipeId: number; slug: string; title: string }) {
  const [saved, setSaved] = useState(false);
  const [shareSupported, setShareSupported] = useState(false);

  useEffect(() => {
    setSaved(readFavorites().includes(recipeId));
    setShareSupported(typeof navigator !== 'undefined' && 'share' in navigator);
  }, [recipeId]);

  const toggleSave = () => {
    const current = readFavorites();
    const next = saved ? current.filter((x) => x !== recipeId) : [...current, recipeId];
    writeFavorites(next);
    setSaved(!saved);
  };

  const print = () => window.print();

  const share = async () => {
    if (!shareSupported) return;
    try {
      await navigator.share({
        title,
        url: `${window.location.origin}/przepisy/${slug}`,
      });
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      <ActionButton onClick={toggleSave} icon={<Bookmark size={16} fill={saved ? 'currentColor' : 'none'} strokeWidth={1.75} />} active={saved}>
        {saved ? 'Zapisany' : 'Zapisz'}
      </ActionButton>
      <ActionButton onClick={print} icon={<Printer size={16} strokeWidth={1.75} />}>
        Drukuj
      </ActionButton>
      {shareSupported && (
        <ActionButton onClick={share} icon={<Share2 size={16} strokeWidth={1.75} />}>
          Udostępnij
        </ActionButton>
      )}
    </div>
  );
}

function ActionButton({
  onClick,
  icon,
  active = false,
  children,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'inline-flex items-center gap-2 rounded-full border border-terracotta bg-terracotta/10 px-4 py-1.5 text-sm font-semibold text-terracotta transition-colors'
          : 'inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5 text-sm font-semibold text-ink-soft transition-colors hover:border-terracotta hover:text-terracotta'
      }
    >
      {icon}
      {children}
    </button>
  );
}
