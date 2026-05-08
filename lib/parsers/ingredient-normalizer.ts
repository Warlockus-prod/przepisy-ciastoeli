import type { Ingredient } from '@/lib/db/schema';

const UNIT_PATTERN = /^(g|kg|ml|l|szt(?:uka)?|łyżk[ai]|łyżecz[kal][aki]?|szklan[kal][aki]?|opakowa[nm][ieaa]?|szczypt[aa]?|garść|gram(?:ów)?|mililitr(?:ów)?|cm)\b\.?/i;

const NUMERIC_PATTERN = /^([\d]+([.,]\d+)?(\s*[\/\-]\s*[\d]+([.,]\d+)?)?)\s*/;

export function parseIngredientLine(raw: string): Ingredient {
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  if (!trimmed) return { raw, amount: null, unit: null, name: '' };

  const optional = /\(opcjonal|opcjonalnie|do smaku\)/i.test(trimmed);

  let rest = trimmed;
  let amount: number | null = null;
  const amountMatch = rest.match(NUMERIC_PATTERN);
  if (amountMatch) {
    amount = parseAmount(amountMatch[1]);
    rest = rest.slice(amountMatch[0].length);
  }

  let unit: string | null = null;
  const unitMatch = rest.match(UNIT_PATTERN);
  if (unitMatch) {
    unit = normalizeUnit(unitMatch[1]);
    rest = rest.slice(unitMatch[0].length).trim();
  }

  const name = rest.trim() || trimmed;

  return {
    raw: trimmed,
    amount,
    unit,
    name,
    ...(optional ? { optional: true } : {}),
  };
}

function parseAmount(s: string): number | null {
  s = s.replace(/\s+/g, '').replace(',', '.');
  if (s.includes('/')) {
    const [a, b] = s.split('/').map(Number);
    if (Number.isFinite(a) && Number.isFinite(b) && b !== 0) return a / b;
  }
  if (s.includes('-')) {
    const [a, b] = s.split('-').map(Number);
    if (Number.isFinite(a) && Number.isFinite(b)) return (a + b) / 2;
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function normalizeUnit(raw: string): string {
  const lower = raw.toLowerCase().replace(/\.$/, '');
  if (lower.startsWith('g') && lower !== 'gram' && lower.length <= 3) return 'g';
  if (lower.startsWith('kg')) return 'kg';
  if (lower.startsWith('ml')) return 'ml';
  if (lower === 'l') return 'l';
  if (lower.startsWith('łyżecz')) return 'łyżeczka';
  if (lower.startsWith('łyżk')) return 'łyżka';
  if (lower.startsWith('szklan')) return 'szklanka';
  if (lower.startsWith('opakowa')) return 'opakowanie';
  if (lower.startsWith('szczypt')) return 'szczypta';
  if (lower === 'garść') return 'garść';
  if (lower.startsWith('szt')) return 'szt';
  if (lower === 'cm') return 'cm';
  return raw;
}

export function buildInstructions(steps: string[]): Array<{ step: number; text: string }> {
  return steps
    .map((s, i) => ({ step: i + 1, text: s.replace(/^\d+[.)]\s*/, '').trim() }))
    .filter((s) => s.text.length > 0);
}
