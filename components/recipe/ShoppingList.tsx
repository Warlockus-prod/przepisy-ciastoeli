'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';

const KEY = 'ce_shopping_list_v1';

type Item = {
  id: string;          // unique id (generated)
  raw: string;         // display text
  source_recipe?: string; // slug
  checked: boolean;
};

function read(): Item[] {
  try {
    const r = localStorage.getItem(KEY);
    return r ? JSON.parse(r) : [];
  } catch { return []; }
}

function write(items: Item[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function ShoppingList() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [draft, setDraft] = useState('');

  useEffect(() => { setItems(read()); }, []);

  const update = (next: Item[]) => {
    setItems(next);
    write(next);
  };

  if (items === null) return <p className="text-ink-muted">Ładowanie...</p>;

  const onAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    update([...items, { id: crypto.randomUUID(), raw: text, checked: false }]);
    setDraft('');
  };

  const onToggle = (id: string) => {
    update(items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));
  };

  const onRemove = (id: string) => {
    update(items.filter((i) => i.id !== id));
  };

  const onClearChecked = () => {
    if (!items.some((i) => i.checked)) return;
    update(items.filter((i) => !i.checked));
  };

  const onClearAll = () => {
    if (!confirm('Wyczyścić całą listę?')) return;
    update([]);
  };

  return (
    <div>
      <form onSubmit={onAdd} className="mb-6 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Dodaj produkt..."
          className="flex-1 rounded-md border border-line bg-surface px-3 py-2 outline-none focus:border-terracotta"
        />
        <button
          type="submit"
          className="rounded-md bg-terracotta px-5 py-2 text-sm font-semibold text-cream hover:bg-terracotta-hover"
        >
          Dodaj
        </button>
      </form>

      {items.length === 0 ? (
        <div className="rounded-lg border border-line bg-cream-deep p-8 text-center text-ink-soft">
          <p>Lista jest pusta.</p>
          <Link
            href="/przepisy"
            className="mt-4 inline-block rounded-full bg-terracotta px-5 py-2 text-sm font-semibold text-cream hover:bg-terracotta-hover"
          >
            Wybierz przepis
          </Link>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
            {items.map((it) => (
              <li
                key={it.id}
                className={`flex items-center gap-3 px-4 py-3 ${it.checked ? 'opacity-50' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={it.checked}
                  onChange={() => onToggle(it.id)}
                  className="h-4 w-4 accent-terracotta"
                />
                <span className={`flex-1 ${it.checked ? 'line-through' : ''}`}>{it.raw}</span>
                {it.source_recipe && (
                  <Link
                    href={`/przepisy/${it.source_recipe}`}
                    className="text-xs text-terracotta hover:underline"
                  >
                    {it.source_recipe}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => onRemove(it.id)}
                  className="text-ink-muted hover:text-terracotta"
                  aria-label="Usuń"
                >
                  <Trash2 size={14} strokeWidth={1.75} />
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-ink-muted">
              {items.filter((i) => !i.checked).length} z {items.length} pozostało
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClearChecked}
                className="rounded-full border border-line bg-surface px-4 py-1.5 text-xs font-medium text-ink-soft hover:border-terracotta hover:text-terracotta"
              >
                Usuń zaznaczone
              </button>
              <button
                type="button"
                onClick={onClearAll}
                className="rounded-full border border-line bg-surface px-4 py-1.5 text-xs font-medium text-ink-soft hover:border-terracotta hover:text-terracotta"
              >
                Wyczyść wszystko
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
