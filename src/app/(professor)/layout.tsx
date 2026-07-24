import { RoleGuard } from "@/components";
import { ProfessorShell } from "@/features/professor/ProfessorShell";

export default function ProfessorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard role="professor">
      <ProfessorShell>{children}</ProfessorShell>
    </RoleGuard>
  );
}
