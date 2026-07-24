import { RoleGuard } from "@/components";
import { AdminShell } from "@/features/admin/AdminShell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard role="admin">
      <AdminShell>{children}</AdminShell>
    </RoleGuard>
  );
}
