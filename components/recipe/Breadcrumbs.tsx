import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export type BreadcrumbItem = { name: string; url?: string };

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Okruszki" className="text-xs text-ink-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.name}-${i}`} className="flex items-center gap-1.5">
              {item.url && !isLast ? (
                <Link href={item.url} className="transition-colors hover:text-terracotta">
                  {item.name}
                </Link>
              ) : (
                <span className={isLast ? 'text-ink-soft' : ''}>{item.name}</span>
              )}
              {!isLast && <ChevronRight size={12} aria-hidden className="text-line-strong" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
