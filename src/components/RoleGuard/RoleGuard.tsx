"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { HOME_BY_ROLE, type Role } from "@/types/user";
import styles from "./RoleGuard.module.css";

/**
 * Guarda de rota por papel (UX apenas — a autorização real é do backend).
 * Redireciona para /login se deslogado, ou para a home do papel correto se o
 * usuário não pertence ao grupo desta rota.
 */
export function RoleGuard({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (user?.role && user.role !== role) {
      router.replace(HOME_BY_ROLE[user.role]);
    }
  }, [loading, isAuthenticated, user?.role, role, router]);

  if (loading || !isAuthenticated || user?.role !== role) {
    return (
      <div className={styles.gate} role="status" aria-live="polite">
        <span className={styles.spinner} aria-hidden />
        <span className={styles.label}>Carregando…</span>
      </div>
    );
  }

  return <>{children}</>;
}
