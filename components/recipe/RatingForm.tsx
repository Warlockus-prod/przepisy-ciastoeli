'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

export function RatingForm({ recipeId }: { recipeId: number }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !name.trim()) return;
    setSubmitting(true);
    setStatus('idle');
    try {
      const res = await fetch('/api/public/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipe_id: recipeId,
          rating,
          author_name: name.trim(),
          author_email: email.trim() || null,
          comment: comment.trim() || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setStatus('success');
      setRating(0);
      setName('');
      setEmail('');
      setComment('');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Wystąpił błąd.');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'success') {
    return (
      <div className="rounded-lg border border-sage/40 bg-sage/[0.06] p-6">
        <p className="font-semibold text-sage">Dziękujemy za ocenę!</p>
        <p className="mt-1 text-sm text-ink-soft">
          Twoja ocena trafi do publikacji po weryfikacji przez naszą redakcję.
          {email && ' Sprawdź pocztę i potwierdź swój adres email.'}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-line bg-surface p-6">
      <h3 className="font-display text-xl font-semibold">Oceń ten przepis</h3>

      <div>
        <label className="mb-2 block text-sm font-medium text-ink-soft">Twoja ocena</label>
        <div className="inline-flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => {
            const active = (hover || rating) >= n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                className="cursor-pointer p-1 text-gold transition-transform hover:scale-110"
                aria-label={`${n} z 5`}
              >
                <Star size={28} strokeWidth={1.5} fill={active ? 'currentColor' : 'none'} className={active ? 'text-gold' : 'text-gold/40'} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-soft">Imię *</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
            className="w-full rounded-md border border-line bg-cream/50 px-3 py-2 outline-none focus:border-terracotta"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-soft">Email (opcjonalny)</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={255}
            placeholder="dla potwierdzenia oceny"
            className="w-full rounded-md border border-line bg-cream/50 px-3 py-2 outline-none focus:border-terracotta"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink-soft">Komentarz (opcjonalny)</span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="Co Ci się podobało? Co byś zmienił?"
          className="w-full rounded-md border border-line bg-cream/50 px-3 py-2 outline-none focus:border-terracotta"
        />
      </label>

      {status === 'error' && (
        <p className="rounded-md bg-terracotta/10 px-3 py-2 text-sm text-terracotta">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={submitting || rating === 0 || !name.trim()}
        className="rounded-full bg-terracotta px-6 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-terracotta-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? 'Wysyłanie...' : 'Wyślij ocenę'}
      </button>

      <p className="text-xs text-ink-muted">
        Twoja ocena trafia do moderacji. Komentarze obraźliwe lub spam będą odrzucane.
      </p>
    </form>
  );
}
