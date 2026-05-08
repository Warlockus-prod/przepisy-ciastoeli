import Link from 'next/link';
import { ChefHat, Image as ImageIcon, Link2, Upload } from 'lucide-react';

export default function NewRecipePage() {
  return (
    <div className="max-w-4xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Nowy przepis</h1>
        <p className="mt-1 text-sm text-ink-soft">Wybierz tryb dodawania.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <ModeCard
          href="/admin/recipes/new/manual"
          icon={<ChefHat size={24} strokeWidth={1.75} />}
          title="Ręcznie"
          description="Wypełnij wszystkie pola samodzielnie. Pełna kontrola."
        />
        <ModeCard
          href="/admin/recipes/new/url"
          icon={<Link2 size={24} strokeWidth={1.75} />}
          title="Z URL"
          description="Podaj link do innego przepisu — AI przepisze go w unikatowy artykuł SEO."
          badge="AI"
          disabled
        />
        <ModeCard
          href="/admin/recipes/new/photo"
          icon={<ImageIcon size={24} strokeWidth={1.75} />}
          title="Z foto + składniki"
          description="Wgraj zdjęcie potrawy i listę składników — AI vision rozpozna i opracuje przepis."
          badge="AI"
          disabled
        />
        <ModeCard
          href="/admin/recipes/new/batch"
          icon={<Upload size={24} strokeWidth={1.75} />}
          title="Import zbiorczy"
          description="Wgraj plik JSON/CSV z wieloma przepisami naraz."
          disabled
        />
      </div>

      <div className="rounded-lg border border-line bg-cream-deep p-4 text-sm text-ink-soft">
        <strong className="text-ink">Tryby AI:</strong> będą uruchomione w Day 5–6 (URL parsing + GPT-4o vision). Na
        razie używaj trybu ręcznego.
      </div>

      <p>
        <Link href="/admin/recipes" className="text-sm text-terracotta hover:underline">
          ← Wróć do listy
        </Link>
      </p>
    </div>
  );
}

function ModeCard({
  href,
  icon,
  title,
  description,
  badge,
  disabled,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  disabled?: boolean;
}) {
  const inner = (
    <div
      className={`flex flex-col gap-3 rounded-lg border border-line bg-surface p-5 transition-all ${
        disabled ? 'opacity-50' : 'hover:border-terracotta hover:shadow-[var(--shadow-card-hover)]'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-cream-deep text-terracotta">{icon}</span>
        {badge && (
          <span className="rounded-full bg-terracotta/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-terracotta">
            {badge}
          </span>
        )}
      </div>
      <div>
        <h2 className="font-display text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-ink-soft">{description}</p>
      </div>
      {disabled && <p className="text-xs text-ink-muted">Wkrótce</p>}
    </div>
  );
  if (disabled) return inner;
  return <Link href={href}>{inner}</Link>;
}
