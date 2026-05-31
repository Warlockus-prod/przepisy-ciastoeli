'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

type Suggestion = {
  slug: string;
  title: string;
  category_slug: string;
  hero_image_url: string;
  total_time: number | null;
};

export function SearchModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Open on Cmd/Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Listen for external open trigger (header button)
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener('ce:open-search', onOpen);
    return () => window.removeEventListener('ce:open-search', onOpen);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      document.body.style.overflow = '';
      setQ('');
      setResults([]);
      setActive(0);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Debounced fetch
  useEffect(() => {
    if (!open) return;
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      try {
        const res = await fetch(`/api/public/suggest?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        const json = await res.json();
        setResults(json.results ?? []);
        setActive(0);
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [q, open]);

  const go = useCallback(
    (slug?: string) => {
      setOpen(false);
      if (slug) router.push(`/przepisy/${slug}`);
      else if (q.trim()) router.push(`/wyszukaj?q=${encodeURIComponent(q.trim())}`);
    },
    [router, q],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(results[active]?.slug);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[10vh]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden />
      <div className="relative w-full max-w-xl overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--shadow-hero)]">
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <Search size={18} className="shrink-0 text-ink-muted" strokeWidth={1.75} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Szukaj przepisów... (np. szarlotka, zupa, wegańskie)"
            className="flex-1 bg-transparent py-1 text-base outline-none placeholder:text-ink-muted"
          />
          <button onClick={() => setOpen(false)} aria-label="Zamknij" className="grid h-7 w-7 place-items-center rounded text-ink-muted hover:text-terracotta">
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto">
          {q.trim().length < 2 ? (
            <p className="px-4 py-6 text-center text-sm text-ink-muted">Wpisz min. 2 znaki</p>
          ) : loading && results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink-muted">Szukam...</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink-muted">Brak wyników</p>
          ) : (
            <ul>
              {results.map((r, i) => (
                <li key={r.slug}>
                  <Link
                    href={`/przepisy/${r.slug}`}
                    onClick={() => setOpen(false)}
                    onMouseEnter={() => setActive(i)}
                    className={`flex items-center gap-3 px-4 py-2.5 ${i === active ? 'bg-cream-deep' : ''}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.hero_image_url} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{r.title}</p>
                      <p className="text-xs text-ink-muted">{r.category_slug}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {q.trim() && (
          <button
            onClick={() => go()}
            className="w-full border-t border-line px-4 py-2.5 text-left text-sm text-terracotta hover:bg-cream-deep"
          >
            Zobacz wszystkie wyniki dla „{q.trim()}&rdquo; →
          </button>
        )}
      </div>
    </div>
  );
}
