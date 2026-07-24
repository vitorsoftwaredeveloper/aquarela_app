"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  confirmSignIn,
  fetchAuthSession,
  signIn,
  signOut,
} from "aws-amplify/auth";
import { IS_AUTH_CONFIGURED, IS_DEV_DATA } from "@/config/env";
import { api } from "@/services/api";
import { storage } from "@/storage/localStorage";
import type { AppUser, Role } from "@/types/user";

/** Resultado normalizado de um passo de autenticação. */
export type AuthStep =
  | { done: true }
  | { done: false; challenge: "NEW_PASSWORD" | "UNSUPPORTED" };

interface AuthContextData {
  user: AppUser | null;
  role: Role | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthStep>;
  /** Conclui o challenge de primeira senha (usuário criado pelo admin). */
  confirmNewPassword: (newPassword: string) => Promise<AuthStep>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  /**
   * Modo de desenvolvimento: `true` só enquanto o Cognito NÃO está configurado.
   * Permite prever telas autenticadas antes do INF-02 (login "demo").
   */
  isDevMode: boolean;
  devLogin: (role: Role) => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const VALID_ROLES: Role[] = ["admin", "professor", "responsavel"];

const DEV_SESSION_KEY = "devSession";

/** Usuário fictício para preview local por papel (só em isDevMode). */
function devUser(role: Role): AppUser {
  return {
    id: `dev-${role}`,
    email: `${role}@aquarela.dev`,
    name: `Demo ${role[0].toUpperCase()}${role.slice(1)}`,
    role,
  };
}

/** Extrai o papel a partir do claim `cognito:groups` do idToken. */
function roleFromSession(groups: unknown): Role | null {
  if (!Array.isArray(groups)) return null;
  return (groups.find((g) => VALID_ROLES.includes(g as Role)) as Role) ?? null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  // Inicia carregando até restaurar a sessão (Cognito ou demo) no mount —
  // senão o RoleGuard redireciona para /login antes de ler a sessão.
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (IS_DEV_DATA) {
      // Modo preview: restaura eventual sessão demo do localStorage.
      setUser(storage.get<AppUser>(DEV_SESSION_KEY));
      setLoading(false);
      return;
    }
    if (!IS_AUTH_CONFIGURED) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken;
      if (!idToken) {
        setUser(null);
        return;
      }
      const claims = idToken.payload;
      // Base a partir do token do Cognito (papel via grupo, se houver).
      const base: AppUser = {
        id: String(claims.sub ?? ""),
        email: String(claims.email ?? ""),
        name: (claims.name as string | undefined) ?? undefined,
        role: roleFromSession(claims["cognito:groups"]),
      };
      if (process.env.NODE_ENV !== "production") {
        // Diagnóstico: mostra o que veio no token (sem expor o token em si).
        console.info("[auth] sessão:", {
          email: base.email,
          "cognito:groups": claims["cognito:groups"],
          papelResolvido: base.role,
        });
      }

      // Fonte da verdade do perfil/papel é o backend (usuarios.papel via /me).
      // Se a rota existir, complementa/sobrescreve; se não (404), usa o token.
      try {
        const { data } = await api.get("/me");
        const me = data?.data ?? data;
        setUser({
          ...base,
          name: me?.nome ?? me?.name ?? base.name,
          role: (me?.papel as Role) ?? base.role,
        });
      } catch {
        setUser(base);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Restaura a sessão ao montar: Cognito (se configurado) ou a sessão demo.
    // O setState real ocorre após await (Cognito) ou de forma controlada (demo).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthStep> => {
      const attempt = async (): Promise<AuthStep> => {
        const { isSignedIn, nextStep } = await signIn({
          username: email,
          password,
        });
        if (isSignedIn) {
          await refresh();
          return { done: true };
        }
        if (
          nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED"
        ) {
          return { done: false, challenge: "NEW_PASSWORD" };
        }
        // MFA e outros passos ficam fora do escopo do INF-08.
        return { done: false, challenge: "UNSUPPORTED" };
      };

      try {
        return await attempt();
      } catch (err) {
        // Sessão anterior presa (comum após tentativas): encerra e tenta 1x.
        const name =
          err && typeof err === "object" && "name" in err
            ? String((err as { name: unknown }).name)
            : "";
        if (name === "UserAlreadyAuthenticatedException") {
          try {
            await signOut();
          } catch {
            /* ignora */
          }
          return await attempt();
        }
        throw err;
      }
    },
    [refresh],
  );

  const confirmNewPassword = useCallback(
    async (newPassword: string): Promise<AuthStep> => {
      const { isSignedIn } = await confirmSignIn({
        challengeResponse: newPassword,
      });
      if (isSignedIn) {
        await refresh();
        return { done: true };
      }
      return { done: false, challenge: "UNSUPPORTED" };
    },
    [refresh],
  );

  const devLogin = useCallback((role: Role) => {
    if (!IS_DEV_DATA) return;
    const mock = devUser(role);
    storage.set(DEV_SESSION_KEY, mock);
    setUser(mock);
  }, []);

  const logout = useCallback(async () => {
    if (IS_DEV_DATA) {
      storage.remove(DEV_SESSION_KEY);
    } else if (IS_AUTH_CONFIGURED) {
      await signOut();
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? null,
        loading,
        isAuthenticated: !!user,
        login,
        confirmNewPassword,
        logout,
        refresh,
        isDevMode: IS_DEV_DATA,
        devLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
