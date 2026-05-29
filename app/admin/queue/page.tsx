import { ComingSoon } from '@/components/admin/ComingSoon';

export const dynamic = 'force-dynamic';

export default function AdminQueuePage() {
  return (
    <ComingSoon
      title="Kolejka zadań"
      description="Podgląd kolejki jobs (parse-url, vision, nutrition). Aktywuje się wraz z pipeline'em AI w Day 5–7."
    />
  );
}
