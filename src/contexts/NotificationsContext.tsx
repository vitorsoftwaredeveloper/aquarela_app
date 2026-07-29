"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { IS_PUSH_CONFIGURED } from "@/config/env";
import { getFcmToken, onForegroundMessage } from "@/lib/firebaseMessaging";
import { DispositivosService } from "@/services/dispositivos";
import { storage } from "@/storage/localStorage";
import { detectPlataforma, isIOS, isStandalonePwa } from "@/utils/device";
import { ToastStack, type ToastItem } from "@/components";
import { useAuth } from "./AuthContext";

export type PushPermission = "default" | "granted" | "denied" | "unsupported";

interface NotificationsContextData {
  permission: PushPermission;
  /** Dispositivo registrado no backend (token FCM válido) — o que a tela de preferências mostra como "ativo". */
  active: boolean;
  enabling: boolean;
  error: string | null;
  /** Pede a permissão do browser e, se concedida, registra o dispositivo. */
  requestPermission: () => Promise<void>;
  /** Remove o dispositivo do backend (não dá pra revogar a permissão do browser via JS). */
  disable: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextData>(
  {} as NotificationsContextData,
);

const TOKEN_KEY = "fcmToken";
const DISABLED_KEY = "fcmDesativadoManualmente";

function pushBloqueadoNestaAba(): boolean {
  return isIOS() && !isStandalonePwa();
}

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const [permission, setPermission] = useState<PushPermission>("default");
  const [active, setActive] = useState(false);
  const [enabling, setEnabling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const wasAuthenticated = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Lê `Notification`/`localStorage` (indisponíveis no SSR) só após montar.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!IS_PUSH_CONFIGURED || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as PushPermission);
    setActive(
      Notification.permission === "granted" && !!storage.get<string>(TOKEN_KEY),
    );
    /* eslint-enable react-hooks/set-state-in-effect */

    if (pushBloqueadoNestaAba()) {
      const token = storage.get<string>(TOKEN_KEY);
      if (token) {
        DispositivosService.remover(token).catch(() => {});
        storage.remove(TOKEN_KEY);
        setActive(false);
      }
    }
  }, []);

  const syncToken = useCallback(async () => {
    if (pushBloqueadoNestaAba() || storage.get<boolean>(DISABLED_KEY)) return;
    try {
      const token = await getFcmToken();
      if (!token) return;
      storage.set(TOKEN_KEY, token);
      await DispositivosService.registrar(token, detectPlataforma());
      setActive(true);
    } catch {
      // Falha silenciosa no sync automático — o usuário pode tentar de novo
      // explicitamente em /perfil/notificacoes.
    }
  }, []);

  // Reenvia o token no login (equivalente ao antigo `onTokenRefresh`, removido
  // do SDK modular) — idempotente no back, então repetir é seguro.
  useEffect(() => {
    if (isAuthenticated && !wasAuthenticated.current && permission === "granted") {
      syncToken();
    }
    if (!isAuthenticated && wasAuthenticated.current) {
      const token = storage.get<string>(TOKEN_KEY);
      if (token) {
        DispositivosService.remover(token).catch(() => {});
        storage.remove(TOKEN_KEY);
      }
      setActive(false);
    }
    wasAuthenticated.current = isAuthenticated;
  }, [isAuthenticated, permission, syncToken]);

  useEffect(() => {
    if (!IS_PUSH_CONFIGURED) return;
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    onForegroundMessage((payload) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [
        ...prev,
        {
          id,
          title: payload.notification?.title ?? "Aquarela Kids",
          message: payload.notification?.body ?? "",
          url: payload.data?.url,
        },
      ]);
    }).then((unsub) => {
      if (cancelled) unsub();
      else unsubscribe = unsub;
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleToastClick = useCallback(
    (toast: ToastItem) => {
      dismissToast(toast.id);
      if (toast.url) router.push(toast.url);
    },
    [dismissToast, router],
  );

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (pushBloqueadoNestaAba()) {
      setError(
        "No iPhone as notificações só funcionam pelo app instalado. Toque em Compartilhar > Adicionar à Tela de Início.",
      );
      return;
    }
    setEnabling(true);
    setError(null);
    storage.remove(DISABLED_KEY);
    try {
      const result = await Notification.requestPermission();
      setPermission(result as PushPermission);
      if (result === "granted") {
        await syncToken();
      }
    } catch {
      setError("Não foi possível ativar as notificações. Tente novamente.");
    } finally {
      setEnabling(false);
    }
  }, [syncToken]);

  const disable = useCallback(async () => {
    const token = storage.get<string>(TOKEN_KEY);
    if (token) {
      await DispositivosService.remover(token).catch(() => {});
      storage.remove(TOKEN_KEY);
    }
    storage.set(DISABLED_KEY, true);
    setActive(false);
  }, []);

  return (
    <NotificationsContext.Provider
      value={{ permission, active, enabling, error, requestPermission, disable }}
    >
      {children}
      <ToastStack
        toasts={toasts}
        onDismiss={dismissToast}
        onClick={handleToastClick}
      />
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
