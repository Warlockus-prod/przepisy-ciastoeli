export function formatDuration(minutes: number | null): string {
  if (minutes == null || minutes <= 0) return '—';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function formatServings(n: number): string {
  if (n === 1) return '1 porcja';
  if (n >= 2 && n <= 4) return `${n} porcje`;
  return `${n} porcji`;
}

export function formatRating(avg: number | null, count: number): string | null {
  if (!count || avg == null) return null;
  return `${(avg / 10).toFixed(1)} (${count})`;
}

export function plPolishDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}
