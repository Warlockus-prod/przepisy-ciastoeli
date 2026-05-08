'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') ?? '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd logowania.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-line bg-surface p-6">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink-soft">Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          autoFocus
          className="w-full rounded-md border border-line bg-cream/50 px-3 py-2 outline-none focus:border-terracotta"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink-soft">Hasło</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="w-full rounded-md border border-line bg-cream/50 px-3 py-2 outline-none focus:border-terracotta"
        />
      </label>
      {error && <p className="rounded-md bg-terracotta/10 px-3 py-2 text-sm text-terracotta">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-terracotta px-6 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-terracotta-hover disabled:opacity-50"
      >
        {submitting ? 'Logowanie...' : 'Zaloguj się'}
      </button>
    </form>
  );
}
