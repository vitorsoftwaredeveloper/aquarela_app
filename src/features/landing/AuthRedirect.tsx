"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Splash } from "@/components";
import { HOME_BY_ROLE } from "@/types/user";

/**
 * Sessão ativa na landing: manda para a home do papel. Enquanto a navegação não
 * termina, cobre a página com o splash — antes a landing ficava visível e o
 * usuário era "puxado" para o dashboard um instante depois.
 */
export function AuthRedirect() {
  const { isAuthenticated, role } = useAuth();
  const router = useRouter();
  const redirecting = isAuthenticated && !!role;

  useEffect(() => {
    if (isAuthenticated && role) {
      router.replace(HOME_BY_ROLE[role]);
    }
  }, [isAuthenticated, role, router]);

  if (!redirecting) return null;
  return <Splash label="Entrando…" />;
}
