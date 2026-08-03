"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Bell, BellOff, Share } from "lucide-react";
import { BackButton, Badge } from "@/components";
import { useHideTopbar } from "@/contexts/PageTitleContext";
import { useNotifications } from "@/contexts/NotificationsContext";
import {
  instrucaoReativarNotificacoes,
  isIOS,
  isStandalonePwa,
} from "@/utils/device";
import styles from "./notificacoes.module.css";

const STATUS: Record<
  string,
  { label: string; tone: "success" | "warning" | "danger" | "neutral" }
> = {
  ativo: { label: "Ativadas", tone: "success" },
  inativo: { label: "Desativadas", tone: "neutral" },
  bloqueado: { label: "Bloqueadas pelo navegador", tone: "danger" },
  indisponivel: { label: "Não suportado neste navegador", tone: "neutral" },
};

/** Tela de preferências de notificação (NOT-16) — reutilizada por responsável e professor. */
export function NotificacoesScreen() {
  useHideTopbar();
  const router = useRouter();
  const { permission, active, enabling, error, requestPermission, disable } =
    useNotifications();
  const [bloqueadoNestaAba, setBloqueadoNestaAba] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBloqueadoNestaAba(isIOS() && !isStandalonePwa());
  }, []);

  const situacao =
    permission === "unsupported"
      ? "indisponivel"
      : permission === "denied"
        ? "bloqueado"
        : active
          ? "ativo"
          : "inativo";
  const status = STATUS[situacao];

  return (
    <div>
      <div className={styles.topRow}>
        <BackButton onClick={() => router.back()} />
        <span className={styles.pushTitle}>Notificações</span>
      </div>

      <div className={styles.form}>
        <p className={styles.intro}>
          As notificações avisam na hora sobre recados novos, agenda do dia
          e outras novidades da turma — assim você fica por dentro sem
          precisar abrir o app o tempo todo pra conferir.
        </p>

        <section className={styles.card}>
          <div
            className={styles.cardHead}
            style={{ justifyContent: "space-between" }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {active ? (
                <Bell size={17} color="#6D45C4" />
              ) : (
                <BellOff size={17} color="var(--text-dim)" />
              )}
              Status
            </span>
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>

          {permission === "denied" && (
            <div className={styles.saveError} role="alert" style={{ marginTop: 4 }}>
              <AlertCircle size={16} />
              <span>
                Você bloqueou as notificações no navegador. Pra reverter,{" "}
                {instrucaoReativarNotificacoes()}
              </span>
            </div>
          )}

          {permission !== "denied" && bloqueadoNestaAba && (
            <div className={styles.saveError} role="alert" style={{ marginTop: 4 }}>
              <Share size={16} />
              <span>
                No iPhone as notificações só funcionam pelo app instalado.
                Toque em Compartilhar e depois em &ldquo;Adicionar à Tela de
                Início&rdquo;.
              </span>
            </div>
          )}

          {permission !== "unsupported" &&
            permission !== "denied" &&
            !bloqueadoNestaAba && (
            <button
              type="button"
              className={styles.saveBtn}
              style={
                active
                  ? {
                      background: "none",
                      color: "var(--color-danger-strong)",
                      boxShadow: "none",
                      border:
                        "1px solid color-mix(in srgb, var(--color-danger) 35%, transparent)",
                    }
                  : undefined
              }
              onClick={active ? disable : requestPermission}
              disabled={enabling}
            >
              {enabling
                ? "Ativando…"
                : active
                  ? "Desativar notificações"
                  : "Ativar notificações"}
            </button>
          )}

          {error && (
            <div className={styles.saveError} role="alert">
              <AlertCircle size={16} /> <span>{error}</span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
