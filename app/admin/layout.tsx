import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { LogoutButton } from '@/components/admin/LogoutButton';
import { getCurrentSession } from '@/lib/auth/admin-auth';

export const metadata: Metadata = {
  title: 'Panel administracyjny',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();
  // Login page handles its own redirect via middleware
  // Other admin pages: middleware redirects to /admin/login if no cookie
  // But session might be expired or invalid — handle here
  // Actually — middleware can't verify HMAC, only check cookie presence.
  // So extra check here for non-login routes.

  // Get the pathname to know if we're on /admin/login
  // Layout wraps both, so we can't redirect /admin/login users
  // This is handled by middleware. Here we just provide chrome IF session valid.

  if (!session) {
    // No valid session — show only the chrome-less wrapper (login page is wrapped here too)
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-cream-deep">
      <AdminSidebar role={session.role} />
      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-cream-deep/85 px-6 py-3 backdrop-blur">
          <span className="text-sm text-ink-soft">
            Zalogowany jako <strong className="text-ink">{session.email}</strong> ·{' '}
            <span className="rounded-full bg-terracotta/10 px-2 py-0.5 text-xs font-semibold text-terracotta">
              {session.role}
            </span>
          </span>
          <LogoutButton />
        </header>
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
