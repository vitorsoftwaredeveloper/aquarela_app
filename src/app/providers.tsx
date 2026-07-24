"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { configureAmplify } from "@/config/amplify";

// Configura o Amplify no load do módulo (client), ANTES de qualquer efeito de
// componente. Se ficasse em useEffect, o efeito do AuthProvider (filho) rodaria
// primeiro e chamaria fetchAuthSession() com o Amplify ainda não configurado —
// a sessão restaurada falhava no reload e o usuário era deslogado.
configureAmplify();

/** Providers globais do cliente. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
