"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { configureAmplify } from "@/config/amplify";
import { InstallPrompt, SessionSplash } from "@/components";

// Configura o Amplify no load do módulo (client), ANTES de qualquer efeito de
// componente. Se ficasse em useEffect, o efeito do AuthProvider (filho) rodaria
// primeiro e chamaria fetchAuthSession() com o Amplify ainda não configurado —
// a sessão restaurada falhava no reload e o usuário era deslogado.
configureAmplify();

/** Providers globais do cliente. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationsProvider>{children}</NotificationsProvider>
        {/* Splash da marca enquanto a sessão é restaurada (overlay, não portão:
            os filhos seguem montados por baixo). */}
        <SessionSplash />
      </AuthProvider>
      <InstallPrompt />
    </ThemeProvider>
  );
}
