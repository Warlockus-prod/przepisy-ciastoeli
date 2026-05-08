import type { Metadata } from 'next';
import { Suspense } from 'react';

import { LoginForm } from '@/components/admin/LoginForm';

export const metadata: Metadata = {
  title: 'Logowanie',
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight">Panel administracyjny</h1>
          <p className="mt-2 text-sm text-ink-soft">przepisy.ciastoeli.pl</p>
        </div>
        <Suspense fallback={<div className="rounded-lg border border-line bg-surface p-6">Ładowanie...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
