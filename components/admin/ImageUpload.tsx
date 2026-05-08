'use client';

import { useRef, useState } from 'react';
import { Image as ImageIcon, Upload, X } from 'lucide-react';

type Props = {
  value: string;
  onChange: (url: string) => void;
  onAltChange?: (alt: string) => void;
  alt?: string;
  recipeId?: number;
  label?: string;
};

export function ImageUpload({ value, onChange, onAltChange, alt = '', recipeId, label = 'Zdjęcie hero' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);

    const fd = new FormData();
    fd.append('file', file);
    if (alt) fd.append('alt', alt);
    if (recipeId) fd.append('recipe_id', String(recipeId));

    try {
      const res = await fetch('/api/admin/upload-image', { method: 'POST', body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
      onChange(j.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink-soft">{label}</span>
        <div className="flex flex-col gap-3 rounded-lg border border-line bg-cream/50 p-4">
          {value ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt={alt || 'preview'}
                className="aspect-[16/10] w-full rounded-md object-cover"
              />
              <button
                type="button"
                onClick={() => onChange('')}
                className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-ink/80 text-cream hover:bg-ink"
                aria-label="Usuń"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="grid aspect-[16/10] w-full place-items-center rounded-md border-2 border-dashed border-line text-ink-muted">
              <div className="text-center">
                <ImageIcon size={36} strokeWidth={1.25} className="mx-auto" />
                <p className="mt-1 text-sm">Brak zdjęcia</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onFileChange}
              className="hidden"
              id="image-upload-input"
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-1.5 text-sm font-medium text-ink-soft hover:border-terracotta hover:text-terracotta disabled:opacity-50"
            >
              <Upload size={14} strokeWidth={1.75} />
              {uploading ? 'Wgrywanie...' : 'Wgraj z dysku'}
            </button>
            <span className="text-ink-muted">lub</span>
            <input
              type="url"
              value={value.startsWith('/uploads/') ? '' : value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="URL zewnętrzny https://..."
              className="flex-1 min-w-[200px] rounded-md border border-line bg-surface px-3 py-1.5 text-sm outline-none focus:border-terracotta"
            />
          </div>

          {onAltChange && (
            <input
              type="text"
              value={alt}
              onChange={(e) => onAltChange(e.target.value)}
              placeholder="ALT tekst (frazy kluczowe)..."
              className="w-full rounded-md border border-line bg-surface px-3 py-1.5 text-sm outline-none focus:border-terracotta"
              maxLength={200}
            />
          )}

          {error && <p className="text-sm text-terracotta">{error}</p>}
          <p className="text-xs text-ink-muted">JPG / PNG / WebP, max 10 MB. Magic-byte check.</p>
        </div>
      </label>
    </div>
  );
}
