"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  ChevronRight,
  History,
  TriangleAlert,
} from "lucide-react";
import { Skeleton } from "@/components";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { useResponsavel } from "@/contexts/ResponsavelContext";
import { useFetch } from "@/hooks/useFetch";
import { AgendaService } from "@/services/agendaService";
import { formatBRL } from "@/types/financeiro";
import { NotificationOnboarding } from "@/features/notificacoes/NotificationOnboarding";
import { AGENDA_VISUAL } from "./agendaVisual";
import styles from "./responsavel.module.css";

const AVISO_TONE = { bg: "#F1ECFB", fg: "#6D45C4" };

export function InicioScreen() {
  const { user } = useAuth();
  const { active, loading, inadimplencia } = useResponsavel();
  const firstName = (user?.name ?? "").split(" ")[0] || "responsável";

  usePageTitle(
    `Olá, ${firstName}`,
    active ? `Acompanhando ${active.nome}` : undefined,
  );

  if (loading) {
    return (
      <div role="status" aria-label="Carregando…">
        <div className={styles.block}>
          <div className={styles.sectionCard}>
            <Skeleton width={110} height={15} style={{ marginBottom: 14 }} />
            <div className={styles.todayCard}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={styles.todayRow}>
                  <Skeleton width={34} height={34} radius={10} />
                  <span style={{ flex: 1 }}>
                    <Skeleton
                      width="40%"
                      height={11}
                      style={{ marginBottom: 6 }}
                    />
                    <Skeleton width="70%" height={13} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!active) {
    return (
      <div className={styles.state}>
        <span className={styles.emptyBadge}>Sem filhos vinculados</span>
        <p>Nenhuma criança vinculada a esta conta ainda.</p>
      </div>
    );
  }

  return (
    <div>
      <NotificationOnboarding />
      {inadimplencia.inadimplente && (
        <Link href="/financeiro" className={styles.inadimplenteAlert}>
          <span className={styles.inadimplenteIcon}>
            <TriangleAlert size={18} />
          </span>
          <div>
            <div className={styles.inadimplenteTitle}>
              Mensalidade inadimplente
            </div>
            <div className={styles.inadimplenteText}>
              {inadimplencia.desde &&
                `Desde ${new Date(inadimplencia.desde).toLocaleDateString("pt-BR")} · `}
              Total: {formatBRL(inadimplencia.valorTotal)}
            </div>
          </div>
        </Link>
      )}
      <div className={styles.homeGrid}>
        <Avisos />
        <AgendaHoje criancaId={active._id} />
      </div>
    </div>
  );
}

function Avisos() {
  const { data, loading } = useFetch(() => AgendaService.getAvisos());
  const avisos = data ?? [];

  if (loading) {
    return (
      <div className={styles.block} role="status" aria-label="Carregando…">
        <div className={styles.sectionCard}>
          <div className={styles.blockHead}>
            <Skeleton width={70} height={15} />
          </div>
          <div className={styles.stack}>
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className={styles.aviso}>
                <Skeleton width={38} height={38} radius={11} />
                <span style={{ flex: 1 }}>
                  <Skeleton
                    width="45%"
                    height={13}
                    style={{ marginBottom: 6 }}
                  />
                  <Skeleton width="90%" height={12} />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (avisos.length === 0) return null;

  return (
    <div className={styles.block}>
      <div className={styles.sectionCard}>
        <div className={styles.blockHead}>
          <span className={styles.blockTitle}>Avisos</span>
          <span className={styles.blockCount}>{avisos.length}</span>
        </div>
        <div className={styles.stack}>
          {avisos.map((a) => (
            <div key={a.id} className={styles.aviso}>
              <span
                className={styles.avisoIcon}
                style={{ background: AVISO_TONE.bg, color: AVISO_TONE.fg }}
              >
                <Bell size={17} />
              </span>
              <div style={{ flex: 1 }}>
                <div className={styles.avisoHead}>
                  <span className={styles.avisoTitle}>{a.titulo}</span>
                  <span className={styles.avisoDate}>{a.dataLabel}</span>
                </div>
                <div className={styles.avisoText}>{a.corpo}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AgendaHoje({ criancaId }: { criancaId: string }) {
  const { data, loading } = useFetch(
    () => AgendaService.getDia(criancaId),
    [criancaId],
  );
  const allEntries = data?.entries ?? [];
  const entries = allEntries.slice(0, 3);
  const intercorrencias = allEntries.filter((e) => e.tipo === "intercorrencia");
  const semRegistro = !loading && allEntries.length === 0;

  if (loading) {
    return (
      <div className={styles.block} role="status" aria-label="Carregando…">
        <div className={styles.sectionCard}>
          <div className={styles.blockHead}>
            <Skeleton width={110} height={15} />
          </div>
          <div className={styles.todayCard}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={styles.todayRow}>
                <Skeleton width={34} height={34} radius={10} />
                <span style={{ flex: 1 }}>
                  <Skeleton
                    width="35%"
                    height={11}
                    style={{ marginBottom: 6 }}
                  />
                  <Skeleton width="65%" height={13} />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.block}>
      <div className={styles.sectionCard}>
        <div className={styles.blockHead}>
          <span className={styles.blockTitle}>Agenda de hoje</span>
        </div>
        {semRegistro ? (
          <div className={styles.agendaVazia}>
            <span className={styles.agendaVaziaIcon} aria-hidden>
              <CalendarDays size={34} strokeWidth={1.5} />
            </span>
            <p className={styles.agendaVaziaText}>
              A agenda de hoje ainda não foi preenchida pela professora.
            </p>
            <Link
              href={`/historico/${criancaId}`}
              className={styles.agendaVaziaLink}
            >
              <History size={15} /> Ver histórico
            </Link>
          </div>
        ) : (
          <>
            {intercorrencias.length > 0 && (
              <div className={styles.intercorrenciaAlert} role="alert">
                <span className={styles.intercorrenciaIcon}>
                  <AlertTriangle size={18} />
                </span>
                <div style={{ flex: 1 }}>
                  <div className={styles.intercorrenciaTitle}>
                    {intercorrencias.length === 1
                      ? "Intercorrência registrada hoje"
                      : `${intercorrencias.length} intercorrências registradas hoje`}
                  </div>
                  <div className={styles.intercorrenciaText}>
                    {intercorrencias.map((i) => i.title).join(" · ")}
                  </div>
                </div>
              </div>
            )}
            <div className={styles.todayCard}>
              {entries.map((e, i) => {
                const v = AGENDA_VISUAL[e.tipo];
                const Icon = v.icon;
                return (
                  <div key={i} className={styles.todayRow}>
                    <span
                      className={styles.miniIcon}
                      style={{ background: v.bg, color: v.fg }}
                    >
                      <Icon size={17} />
                    </span>
                    <div style={{ flex: 1 }}>
                      <div className={styles.todayLabel}>{e.title}</div>
                      <div className={styles.todayBrief}>{e.text}</div>
                    </div>
                  </div>
                );
              })}
              <Link href={`/agenda/${criancaId}`} className={styles.seeAll}>
                Ver agenda completa <ChevronRight size={16} />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
