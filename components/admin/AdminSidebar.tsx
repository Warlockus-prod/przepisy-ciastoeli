import Link from 'next/link';
import { Activity, ChefHat, ClipboardList, Cookie, FileText, Image as ImageIcon, LayoutDashboard, Settings, Users } from 'lucide-react';

import { meetsRole, type Role } from '@/lib/auth/rbac';

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  minRole: Role;
};

const ITEMS: NavItem[] = [
  { href: '/admin', label: 'Pulpit', icon: <LayoutDashboard size={16} />, minRole: 'viewer' },
  { href: '/admin/recipes', label: 'Przepisy', icon: <FileText size={16} />, minRole: 'viewer' },
  { href: '/admin/recipes/new', label: 'Nowy przepis', icon: <ChefHat size={16} />, minRole: 'editor' },
  { href: '/admin/queue', label: 'Kolejka', icon: <ClipboardList size={16} />, minRole: 'editor' },
  { href: '/admin/images', label: 'Obrazy', icon: <ImageIcon size={16} />, minRole: 'editor' },
  { href: '/admin/authors', label: 'Autorzy', icon: <Cookie size={16} />, minRole: 'admin' },
  { href: '/admin/users', label: 'Użytkownicy', icon: <Users size={16} />, minRole: 'admin' },
  { href: '/admin/activity', label: 'Aktywność', icon: <Activity size={16} />, minRole: 'admin' },
  { href: '/admin/settings', label: 'Ustawienia', icon: <Settings size={16} />, minRole: 'owner' },
];

export function AdminSidebar({ role }: { role: Role }) {
  const visible = ITEMS.filter((it) => meetsRole(role, it.minRole));

  return (
    <aside className="hidden w-60 shrink-0 border-r border-line bg-cream lg:block">
      <div className="sticky top-0 px-4 py-5">
        <Link href="/" className="flex items-baseline gap-1.5 px-2">
          <span className="font-display text-lg font-bold tracking-tight">
            przepisy<span className="text-terracotta">.</span>ciastoeli
          </span>
        </Link>
        <p className="mt-1 px-2 text-[11px] uppercase tracking-wider text-ink-muted">Panel administracyjny</p>

        <nav className="mt-6 space-y-0.5" aria-label="Admin">
          {visible.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-cream-deep hover:text-ink"
            >
              <span className="text-ink-muted">{it.icon}</span>
              {it.label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
