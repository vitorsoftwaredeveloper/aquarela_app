"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Bell, Share, SquarePlus, X } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationsContext";
import { storage } from "@/storage/localStorage";
import {
  instrucaoReativarNotificacoes,
  isIOS,
  isInAppWebview,
  isStandalonePwa,
} from "@/utils/device";
import styles from "@/features/responsavel/responsavel.module.css";

const DISMISSED_KEY = "notifOnboardingDispensado";

interface DeviceFlags {
  webview: boolean;
  ios: boolean;
  standalone: boolean;
}

/**
 * Card dispensável que guia o responsável a habilitar push — cobre os três
 * cenários do NOT-11: webview de app (sem PushManager, confirmado no spike
 * NOT-00), iPhone sem o PWA instalado, e o caso normal (Android/desktop).
 */
export function NotificationOnboarding() {
  const { permission, enabling, requestPermission } = useNotifications();
  const [flags, setFlags] = useState<DeviceFlags | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // Lê `navigator`/`window` (indisponíveis no SSR) só depois de montar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFlags({
      webview: isInAppWebview(),
      ios: isIOS(),
      standalone: isStandalonePwa(),
    });
    setDismissed(storage.get<boolean>(DISMISSED_KEY) ?? false);
  }, []);

  function dispensar() {
    storage.set(DISMISSED_KEY, true);
    setDismissed(true);
  }

  if (!flags || dismissed) return null;
  if (permission === "unsupported" || permission === "granted") return null;

  if (permission === "denied") {
    return (
      <div className={styles.block}>
        <div className={styles.aviso}>
          <span
            className={styles.avisoIcon}
            style={{ background: "#FBEAEA", color: "#C0392B" }}
          >
            <AlertCircle size={17} />
          </span>
          <span style={{ flex: 1 }}>
            <div className={styles.avisoHead}>
              <span className={styles.avisoTitle}>
                Notificações bloqueadas
              </span>
              <button
                type="button"
                onClick={dispensar}
                aria-label="Dispensar"
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={15} color="var(--text-mute)" />
              </button>
            </div>
            <p className={styles.avisoText}>
              Você não vai receber avisos da agenda. Pra reativar,{" "}
              {instrucaoReativarNotificacoes()}
            </p>
          </span>
        </div>
      </div>
    );
  }

  if (flags.webview) {
    return (
      <div className={styles.block}>
        <div className={styles.aviso}>
          <span
            className={styles.avisoIcon}
            style={{ background: "#F1ECFB", color: "#6D45C4" }}
          >
            <Bell size={17} />
          </span>
          <span style={{ flex: 1 }}>
            <div className={styles.avisoHead}>
              <span className={styles.avisoTitle}>Abra no navegador</span>
              <button
                type="button"
                onClick={dispensar}
                aria-label="Dispensar"
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={15} color="var(--text-mute)" />
              </button>
            </div>
            <p className={styles.avisoText}>
              Pra receber avisos da agenda, abra este link no Safari ou
              Chrome (o app de mensagens onde você está não permite
              notificações).
            </p>
          </span>
        </div>
      </div>
    );
  }

  if (flags.ios && !flags.standalone) {
    return (
      <div className={styles.block}>
        <div className={styles.aviso}>
          <span
            className={styles.avisoIcon}
            style={{ background: "#F1ECFB", color: "#6D45C4" }}
          >
            <SquarePlus size={17} />
          </span>
          <span style={{ flex: 1 }}>
            <div className={styles.avisoHead}>
              <span className={styles.avisoTitle}>
                Instale pra receber avisos
              </span>
              <button
                type="button"
                onClick={dispensar}
                aria-label="Dispensar"
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={15} color="var(--text-mute)" />
              </button>
            </div>
            <p className={styles.avisoText}>
              No iPhone, toque em <Share size={12} style={{ verticalAlign: "-1px" }} />{" "}
              (Compartilhar) e depois em &ldquo;Adicionar à Tela de
              Início&rdquo; — assim você recebe um aviso quando a agenda do
              dia estiver pronta.
            </p>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.block}>
      <div className={styles.aviso}>
        <span
          className={styles.avisoIcon}
          style={{ background: "#F1ECFB", color: "#6D45C4" }}
        >
          <Bell size={17} />
        </span>
        <span style={{ flex: 1 }}>
          <div className={styles.avisoHead}>
            <span className={styles.avisoTitle}>Ativar notificações</span>
            <button
              type="button"
              onClick={dispensar}
              aria-label="Dispensar"
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              <X size={15} color="var(--text-mute)" />
            </button>
          </div>
          <p className={styles.avisoText}>
            Saiba na hora quando a agenda do dia estiver pronta.
          </p>
          <button
            type="button"
            onClick={requestPermission}
            disabled={enabling}
            style={{
              marginTop: 9,
              border: "none",
              borderRadius: 10,
              padding: "8px 14px",
              fontSize: 12.5,
              fontWeight: 600,
              color: "#fff",
              background: "var(--grad-brand)",
              cursor: "pointer",
            }}
          >
            {enabling ? "Ativando…" : "Ativar notificações"}
          </button>
        </span>
      </div>
    </div>
  );
}
