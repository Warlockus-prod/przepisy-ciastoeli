'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Check, Flag, Trash2 } from 'lucide-react';

export function RatingModerationButtons({ ratingId }: { ratingId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const act = async (action: 'approve' | 'spam' | 'delete') => {
    setBusy(true);
    try {
      const res =
        action === 'delete'
          ? await fetch(`/api/admin/ratings/${ratingId}`, { method: 'DELETE' })
          : await fetch(`/api/admin/ratings/${ratingId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action }),
            });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDone(action === 'approve' ? 'Zatwierdzono' : action === 'spam' ? 'Oznaczono jako spam' : 'Usunięto');
      router.refresh();
    } catch {
      setDone('Błąd');
    } finally {
      setBusy(false);
    }
  };

  if (done) return <span className="text-xs font-semibold text-sage">{done}</span>;

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => act('approve')}
        disabled={busy}
        className="inline-flex items-center gap-1 rounded-full bg-sage px-3 py-1 text-xs font-semibold text-cream hover:bg-sage-hover disabled:opacity-50"
      >
        <Check size={12} /> Zatwierdź
      </button>
      <button
        type="button"
        onClick={() => act('spam')}
        disabled={busy}
        className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink-soft hover:border-terracotta hover:text-terracotta disabled:opacity-50"
      >
        <Flag size={12} /> Spam
      </button>
      <button
        type="button"
        onClick={() => act('delete')}
        disabled={busy}
        className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink-soft hover:border-terracotta hover:text-terracotta disabled:opacity-50"
      >
        <Trash2 size={12} /> Usuń
      </button>
    </div>
  );
}
