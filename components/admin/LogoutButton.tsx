'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const onLogout = async () => {
    setSubmitting(true);
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={submitting}
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink-soft transition-colors hover:border-terracotta hover:text-terracotta"
    >
      <LogOut size={12} strokeWidth={2} />
      Wyloguj
    </button>
  );
}
