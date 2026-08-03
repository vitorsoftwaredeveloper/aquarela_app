import { RoleGuard } from "@/components";
import { PageTitleProvider } from "@/contexts/PageTitleContext";
import { AdminShell } from "@/features/admin/AdminShell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard role="admin">
      <PageTitleProvider>
        <AdminShell>{children}</AdminShell>
      </PageTitleProvider>
    </RoleGuard>
  );
}
