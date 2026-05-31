'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ImageUpload } from '@/components/admin/ImageUpload';
import type { Author } from '@/lib/db/schema';

type Props = { author?: Author };

export function AuthorForm({ author }: Props) {
  const router = useRouter();
  const isEdit = Boolean(author);
  const social = (author?.social_links ?? {}) as Record<string, string>;

  const [form, setForm] = useState({
    slug: author?.slug ?? '',
    name: author?.name ?? '',
    role: author?.role ?? '',
    bio_short: author?.bio_short ?? '',
    bio: author?.bio ?? '',
    photo_url: author?.photo_url ?? '',
    specialty: (author?.specialty ?? []).join(', '),
    expertise_years: author?.expertise_years ?? '',
    email: author?.email ?? '',
    instagram: social.instagram ?? '',
    linkedin: social.linkedin ?? '',
    x: social.x ?? '',
    is_active: author?.is_active ?? true,
    is_primary: author?.is_primary ?? false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async () => {
    setSubmitting(true);
    setError('');

    const socialLinks: Record<string, string> = {};
    if (form.instagram) socialLinks.instagram = form.instagram;
    if (form.linkedin) socialLinks.linkedin = form.linkedin;
    if (form.x) socialLinks.x = form.x;

    const payload = {
      ...(isEdit ? {} : { slug: form.slug }),
      name: form.name,
      role: form.role,
      bio: form.bio,
      bio_short: form.bio_short,
      photo_url: form.photo_url || null,
      specialty: form.specialty.split(',').map((s) => s.trim()).filter(Boolean),
      expertise_years: form.expertise_years === '' ? null : Number(form.expertise_years),
      social_links: Object.keys(socialLinks).length ? socialLinks : null,
      email: form.email || null,
      is_active: form.is_active,
      ...(isEdit ? { is_primary: form.is_primary } : {}),
    };

    try {
      const res = await fetch(isEdit ? `/api/admin/authors/${author!.id}` : '/api/admin/authors', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
      router.push('/admin/authors');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd zapisu.');
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!author || !confirm(`Usunąć autora „${author.name}"?`)) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/authors/${author.id}`, { method: 'DELETE' });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? 'Błąd');
      router.push('/admin/authors');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd');
      setSubmitting(false);
    }
  };

  const inputCls = 'w-full rounded-md border border-line bg-cream/50 px-3 py-2 outline-none focus:border-terracotta';

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card title="Podstawy">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Imię i nazwisko" required>
              <input value={form.name} onChange={(e) => update('name', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Slug" required>
              <input
                value={form.slug}
                onChange={(e) => update('slug', e.target.value)}
                disabled={isEdit}
                placeholder="anna-kowalska"
                className={`${inputCls} font-mono text-sm ${isEdit ? 'opacity-50' : ''}`}
              />
            </Field>
          </div>
          <Field label="Rola" required>
            <input value={form.role} onChange={(e) => update('role', e.target.value)} placeholder="Cukiernik" className={inputCls} />
          </Field>
          <Field label="Krótki bio (≤200 znaków)" required>
            <textarea value={form.bio_short} onChange={(e) => update('bio_short', e.target.value)} maxLength={200} rows={2} className={inputCls} />
          </Field>
          <Field label="Pełny bio" required>
            <textarea value={form.bio} onChange={(e) => update('bio', e.target.value)} rows={5} className={inputCls} />
          </Field>
        </Card>

        <Card title="Specjalizacja i social">
          <Field label="Specjalizacje (oddzielone przecinkami)">
            <input value={form.specialty} onChange={(e) => update('specialty', e.target.value)} placeholder="ciasta, desery" className={inputCls} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Instagram URL"><input value={form.instagram} onChange={(e) => update('instagram', e.target.value)} className={inputCls} /></Field>
            <Field label="LinkedIn URL"><input value={form.linkedin} onChange={(e) => update('linkedin', e.target.value)} className={inputCls} /></Field>
            <Field label="X URL"><input value={form.x} onChange={(e) => update('x', e.target.value)} className={inputCls} /></Field>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card title="Zdjęcie">
          <ImageUpload value={form.photo_url} onChange={(url) => update('photo_url', url)} label="Zdjęcie autora" />
        </Card>
        <Card title="Szczegóły">
          <Field label="Lata doświadczenia">
            <input type="number" min={0} value={form.expertise_years} onChange={(e) => update('expertise_years', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Email">
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className={inputCls} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => update('is_active', e.target.checked)} className="h-4 w-4 accent-terracotta" />
            Aktywny
          </label>
          {isEdit && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_primary} onChange={(e) => update('is_primary', e.target.checked)} className="h-4 w-4 accent-terracotta" />
              Główny autor (primary)
            </label>
          )}
        </Card>

        {error && <div className="rounded-md bg-terracotta/10 p-3 text-sm text-terracotta">{error}</div>}

        <div className="space-y-2">
          <button onClick={onSubmit} disabled={submitting} className="w-full rounded-full bg-terracotta px-5 py-2.5 text-sm font-semibold text-cream hover:bg-terracotta-hover disabled:opacity-50">
            {submitting ? 'Zapisywanie...' : isEdit ? 'Zapisz zmiany' : 'Utwórz autora'}
          </button>
          {isEdit && (
            <button onClick={onDelete} disabled={submitting} className="w-full rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink-soft hover:border-terracotta hover:text-terracotta">
              Usuń autora
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-lg border border-line bg-surface p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-soft">
        {label} {required && <span className="text-terracotta">*</span>}
      </span>
      {children}
    </label>
  );
}
