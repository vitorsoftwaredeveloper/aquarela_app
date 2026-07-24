"use client";

import { Logo, SignOutButton } from "@/components";
import { useAuth } from "@/contexts/AuthContext";

const ROLE_LABEL: Record<string, string> = {
  admin: "Administração",
  professor: "Professor(a)",
  responsavel: "Responsável",
};

/** Cabeçalho das áreas autenticadas: marca, quem está logado e sair. */
export function AuthedHeader() {
  const { user, role } = useAuth();

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "16px 26px",
        borderBottom: "1px solid var(--border-08)",
        background: "var(--surface)",
      }}
    >
      <Logo size={34} />
      <div style={{ marginLeft: "auto", textAlign: "right" }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>
          {user?.name ?? user?.email ?? "—"}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
          {role ? ROLE_LABEL[role] : ""}
        </div>
      </div>
      <SignOutButton />
    </header>
  );
}
