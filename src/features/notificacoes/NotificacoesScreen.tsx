"use client";

import { useRouter } from "next/navigation";
import { AlertCircle, Bell, BellOff, ChevronLeft } from "lucide-react";
import { Badge } from "@/components";
import { useNotifications } from "@/contexts/NotificationsContext";
import { instrucaoReativarNotificacoes } from "@/utils/device";
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
  const router = useRouter();
  const { permission, active, enabling, error, requestPermission, disable } =
    useNotifications();

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
      <div className={styles.pushHeader}>
        <button
          className={styles.backBtn}
          onClick={() => router.back()}
          aria-label="Voltar"
        >
          <ChevronLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div className={styles.pushTitle}>Notificações</div>
          <div className={styles.pushSub}>
            Avisos quando a agenda do dia estiver pronta
          </div>
        </div>
      </div>

      <div className={styles.form}>
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

          {permission !== "unsupported" && permission !== "denied" && (
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
