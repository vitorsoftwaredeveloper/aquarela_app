import { RoleGuard } from "@/components";
import { PageTitleProvider } from "@/contexts/PageTitleContext";
import { ProfessorShell } from "@/features/professor/ProfessorShell";

export default function ProfessorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard role="professor">
      <PageTitleProvider>
        <ProfessorShell>{children}</ProfessorShell>
      </PageTitleProvider>
    </RoleGuard>
  );
}
