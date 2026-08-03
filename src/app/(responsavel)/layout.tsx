import { RoleGuard } from "@/components";
import { PageTitleProvider } from "@/contexts/PageTitleContext";
import { ResponsavelProvider } from "@/contexts/ResponsavelContext";
import { ResponsavelShell } from "@/features/responsavel/ResponsavelShell";

export default function ResponsavelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard role="responsavel">
      <ResponsavelProvider>
        <PageTitleProvider>
          <ResponsavelShell>{children}</ResponsavelShell>
        </PageTitleProvider>
      </ResponsavelProvider>
    </RoleGuard>
  );
}
