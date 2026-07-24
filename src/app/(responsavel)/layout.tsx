import { RoleGuard } from "@/components";
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
        <ResponsavelShell>{children}</ResponsavelShell>
      </ResponsavelProvider>
    </RoleGuard>
  );
}
