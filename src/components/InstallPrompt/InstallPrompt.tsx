"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { isIOS, isStandalonePwa } from "@/utils/device";
import styles from "./InstallPrompt.module.css";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Aviso de "instalar app" — dispensa vale só pra sessão atual (estado em
 * memória, sem localStorage). Toda vez que o app abre de novo (nova carga /
 * novo login) o aviso reaparece, mesmo que o usuário tenha fechado antes.
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (isStandalonePwa()) return;

    if (isIOS()) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setIos(true);
      setVisible(true);
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    }

    function onAppInstalled() {
      setDeferredPrompt(null);
      setVisible(false);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === "accepted") setVisible(false);
  }, [deferredPrompt]);

  if (!visible) return null;

  return (
    <div className={styles.wrap}>
      <div
        className={styles.banner}
        role="region"
        aria-label="Instalar aplicativo"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="" className={styles.icon} />
        <div className={styles.body}>
          <span className={styles.title}>Instalar Aquarela Kids</span>
          <span className={styles.message}>
            {ios
              ? 'Toque em Compartilhar e depois em "Adicionar à Tela de Início".'
              : "Adicione à tela inicial pra abrir mais rápido, sem precisar do navegador."}
          </span>
        </div>
        {ios ? (
          <span className={styles.iosIcon} aria-hidden>
            <Share size={16} />
          </span>
        ) : (
          <button
            type="button"
            className={styles.installBtn}
            onClick={install}
          >
            <Download size={14} />
            Instalar
          </button>
        )}
        <button
          type="button"
          className={styles.close}
          aria-label="Fechar aviso"
          onClick={dismiss}
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
