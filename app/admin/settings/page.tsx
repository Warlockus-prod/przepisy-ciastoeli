import { ComingSoon } from '@/components/admin/ComingSoon';

export const dynamic = 'force-dynamic';

export default function AdminSettingsPage() {
  return (
    <ComingSoon
      title="Ustawienia"
      description="Konfiguracja bota Telegram, prompty AI, miejsca reklamowe. Wartości obecnie przez zmienne środowiskowe (.env.production)."
    />
  );
}
