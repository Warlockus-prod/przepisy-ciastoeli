import { ComingSoon } from '@/components/admin/ComingSoon';

export const dynamic = 'force-dynamic';

export default function AdminUsersPage() {
  return (
    <ComingSoon
      title="Użytkownicy (RBAC)"
      description="Zarządzanie dostępem zespołu — zaproszenia, role (owner/admin/editor/viewer). Obecnie owner-zy konfigurowani przez ADMIN_OWNER_EMAILS."
    />
  );
}
