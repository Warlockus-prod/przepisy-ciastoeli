import { Breadcrumbs, type BreadcrumbItem } from '@/components/recipe/Breadcrumbs';

export function ListingHeader({
  eyebrow,
  title,
  description,
  count,
  breadcrumbs,
}: {
  eyebrow: string;
  title: string;
  description?: string | null;
  count?: number;
  breadcrumbs: BreadcrumbItem[];
}) {
  return (
    <header className="mb-10">
      <Breadcrumbs items={breadcrumbs} />
      <div className="mt-4 flex items-baseline gap-3">
        <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-terracotta">{eyebrow}</span>
        {count != null && <span className="text-sm tabular-nums text-ink-muted">· {count} przepisów</span>}
      </div>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
      {description && <p className="mt-3 max-w-2xl text-lg text-ink-soft">{description}</p>}
    </header>
  );
}
