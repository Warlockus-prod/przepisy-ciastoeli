'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

import type { Ingredient, Instruction, Recipe } from '@/lib/db/schema';

const UNITS = ['', 'g', 'kg', 'ml', 'l', 'szt', 'łyżka', 'łyżeczka', 'szklanka', 'opakowanie', 'szczypta', 'garść'];

export function RecipeContentEditor({ recipe }: { recipe: Recipe }) {
  const router = useRouter();
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    (recipe.ingredients as Ingredient[]) ?? [],
  );
  const [instructions, setInstructions] = useState<Instruction[]>(
    (recipe.instructions as Instruction[]) ?? [],
  );
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  // --- ingredients ---
  const addIngredient = () =>
    setIngredients((arr) => [...arr, { raw: '', amount: null, unit: null, name: '' }]);
  const updateIngredient = (i: number, patch: Partial<Ingredient>) =>
    setIngredients((arr) => arr.map((ing, idx) => (idx === i ? syncRaw({ ...ing, ...patch }) : ing)));
  const removeIngredient = (i: number) => setIngredients((arr) => arr.filter((_, idx) => idx !== i));
  const moveIngredient = (i: number, dir: -1 | 1) =>
    setIngredients((arr) => swap(arr, i, i + dir));

  // --- instructions ---
  const addStep = () =>
    setInstructions((arr) => [...arr, { step: arr.length + 1, text: '' }]);
  const updateStep = (i: number, patch: Partial<Instruction>) =>
    setInstructions((arr) => arr.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const removeStep = (i: number) =>
    setInstructions((arr) => renumber(arr.filter((_, idx) => idx !== i)));
  const moveStep = (i: number, dir: -1 | 1) =>
    setInstructions((arr) => renumber(swap(arr, i, i + dir)));

  const onSave = async () => {
    setSubmitting(true);
    setMessage(null);
    const cleanIngredients = ingredients
      .map((ing) => syncRaw(ing))
      .filter((ing) => ing.name.trim() || ing.raw.trim());
    const cleanInstructions = renumber(instructions.filter((s) => s.text.trim()));

    if (cleanIngredients.length === 0 || cleanInstructions.length === 0) {
      setMessage({ type: 'error', text: 'Min. 1 składnik i 1 krok wymagane.' });
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`/api/admin/recipes/${recipe.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: cleanIngredients, instructions: cleanInstructions }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setMessage({ type: 'ok', text: 'Treść zapisana.' });
      router.refresh();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Błąd zapisu.' });
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = 'rounded-md border border-line bg-cream/50 px-2 py-1.5 text-sm outline-none focus:border-terracotta';

  return (
    <div className="space-y-6">
      {/* Ingredients */}
      <section className="space-y-3 rounded-lg border border-line bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Składniki ({ingredients.length})</h2>
          <button type="button" onClick={addIngredient} className="inline-flex items-center gap-1 text-sm text-terracotta hover:underline">
            <Plus size={14} /> Dodaj
          </button>
        </div>
        <div className="space-y-2">
          {ingredients.map((ing, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="number"
                step="any"
                value={ing.amount ?? ''}
                onChange={(e) => updateIngredient(i, { amount: e.target.value === '' ? null : Number(e.target.value) })}
                placeholder="ilość"
                className={`${inputCls} w-20 tabular-nums`}
              />
              <select
                value={ing.unit ?? ''}
                onChange={(e) => updateIngredient(i, { unit: e.target.value || null })}
                className={`${inputCls} w-28`}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u || '—'}</option>
                ))}
              </select>
              <input
                type="text"
                value={ing.name}
                onChange={(e) => updateIngredient(i, { name: e.target.value })}
                placeholder="nazwa składnika"
                className={`${inputCls} flex-1`}
              />
              <label className="flex items-center gap-1 text-xs text-ink-muted">
                <input
                  type="checkbox"
                  checked={ing.optional ?? false}
                  onChange={(e) => updateIngredient(i, { optional: e.target.checked })}
                  className="h-3.5 w-3.5 accent-terracotta"
                />
                opc.
              </label>
              <RowButtons
                onUp={i > 0 ? () => moveIngredient(i, -1) : undefined}
                onDown={i < ingredients.length - 1 ? () => moveIngredient(i, 1) : undefined}
                onRemove={() => removeIngredient(i)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Instructions */}
      <section className="space-y-3 rounded-lg border border-line bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Kroki ({instructions.length})</h2>
          <button type="button" onClick={addStep} className="inline-flex items-center gap-1 text-sm text-terracotta hover:underline">
            <Plus size={14} /> Dodaj
          </button>
        </div>
        <div className="space-y-3">
          {instructions.map((s, i) => (
            <div key={i} className="flex gap-2">
              <span className="mt-2 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-cream-deep text-sm font-bold text-terracotta">
                {s.step}
              </span>
              <div className="flex-1 space-y-1.5">
                <textarea
                  value={s.text}
                  onChange={(e) => updateStep(i, { text: e.target.value })}
                  rows={2}
                  placeholder="Opis kroku..."
                  className={`${inputCls} w-full`}
                />
                <div className="flex flex-wrap gap-2">
                  <input
                    type="number"
                    value={s.duration_minutes ?? ''}
                    onChange={(e) => updateStep(i, { duration_minutes: e.target.value === '' ? undefined : Number(e.target.value) })}
                    placeholder="min"
                    className={`${inputCls} w-20`}
                  />
                  <input
                    type="number"
                    value={s.temperature_c ?? ''}
                    onChange={(e) => updateStep(i, { temperature_c: e.target.value === '' ? undefined : Number(e.target.value) })}
                    placeholder="°C"
                    className={`${inputCls} w-20`}
                  />
                  <input
                    type="text"
                    value={s.tip ?? ''}
                    onChange={(e) => updateStep(i, { tip: e.target.value || undefined })}
                    placeholder="wskazówka (opc.)"
                    className={`${inputCls} flex-1`}
                  />
                </div>
              </div>
              <RowButtons
                onUp={i > 0 ? () => moveStep(i, -1) : undefined}
                onDown={i < instructions.length - 1 ? () => moveStep(i, 1) : undefined}
                onRemove={() => removeStep(i)}
              />
            </div>
          ))}
        </div>
      </section>

      {message && (
        <div className={message.type === 'ok' ? 'rounded-md bg-sage/10 p-3 text-sm text-sage' : 'rounded-md bg-terracotta/10 p-3 text-sm text-terracotta'}>
          {message.text}
        </div>
      )}

      <button
        type="button"
        onClick={onSave}
        disabled={submitting}
        className="rounded-full bg-terracotta px-6 py-2.5 text-sm font-semibold text-cream hover:bg-terracotta-hover disabled:opacity-50"
      >
        {submitting ? 'Zapisywanie...' : 'Zapisz składniki i kroki'}
      </button>
    </div>
  );
}

function RowButtons({ onUp, onDown, onRemove }: { onUp?: () => void; onDown?: () => void; onRemove: () => void }) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <button type="button" onClick={onUp} disabled={!onUp} className="grid h-7 w-7 place-items-center rounded text-ink-muted hover:text-terracotta disabled:opacity-30" aria-label="W górę">
        <ArrowUp size={13} />
      </button>
      <button type="button" onClick={onDown} disabled={!onDown} className="grid h-7 w-7 place-items-center rounded text-ink-muted hover:text-terracotta disabled:opacity-30" aria-label="W dół">
        <ArrowDown size={13} />
      </button>
      <button type="button" onClick={onRemove} className="grid h-7 w-7 place-items-center rounded text-ink-muted hover:text-terracotta" aria-label="Usuń">
        <Trash2 size={13} />
      </button>
    </div>
  );
}

function syncRaw(ing: Ingredient): Ingredient {
  const parts = [
    ing.amount != null ? (Number.isInteger(ing.amount) ? String(ing.amount) : String(ing.amount)) : '',
    ing.unit ?? '',
    ing.name ?? '',
  ].filter(Boolean);
  return { ...ing, raw: parts.join(' ').trim() };
}

function renumber(arr: Instruction[]): Instruction[] {
  return arr.map((s, idx) => ({ ...s, step: idx + 1 }));
}

function swap<T>(arr: T[], i: number, j: number): T[] {
  if (j < 0 || j >= arr.length) return arr;
  const copy = [...arr];
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}
