"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, ChevronRight, History, RefreshCw, X } from "lucide-react";
import { Avatar, Skeleton } from "@/components";
import { useAuth } from "@/contexts/AuthContext";
import { useResponsavel } from "@/contexts/ResponsavelContext";
import { useFetch } from "@/hooks/useFetch";
import { AgendaService } from "@/services/agendaService";
import { type Crianca } from "@/types/crianca";
import { NotificationOnboarding } from "@/features/notificacoes/NotificationOnboarding";
import { AGENDA_VISUAL } from "./agendaVisual";
import styles from "./responsavel.module.css";

const AVISO_TONE = { bg: "#F1ECFB", fg: "#6D45C4" };

export function InicioScreen() {
  const { user } = useAuth();
  const { criancas, active, activeId, setActive, loading, avatarColors } =
    useResponsavel();
  const firstName = (user?.name ?? "").split(" ")[0] || "responsável";
  const [switcherOpen, setSwitcherOpen] = useState(false);

  function abrirTrocaFilho() {
    if (criancas.length < 2) return;
    setSwitcherOpen(true);
  }

  if (loading) {
    return (
      <div role="status" aria-label="Carregando…">
        <div className={styles.gradHeader}>
          <div className={styles.homeTop}>
            <Skeleton
              width={110}
              height={12}
              style={{ background: "rgba(255,255,255,0.3)" }}
            />
            <Skeleton
              width={34}
              height={34}
              radius={10}
              style={{ background: "rgba(255,255,255,0.3)" }}
            />
          </div>
          <div className={styles.childCard}>
            <Skeleton
              width={48}
              height={48}
              radius={14}
              style={{ background: "rgba(255,255,255,0.3)" }}
            />
            <span style={{ flex: 1 }}>
              <Skeleton
                width="50%"
                height={17}
                style={{
                  marginBottom: 6,
                  background: "rgba(255,255,255,0.3)",
                }}
              />
              <Skeleton
                width="35%"
                height={12}
                style={{ background: "rgba(255,255,255,0.25)" }}
              />
            </span>
          </div>
          <div style={{ height: 20 }} />
        </div>

        <div className={styles.block}>
          <Skeleton width={90} height={15} style={{ marginBottom: 11 }} />
          <div className={styles.todayCard} style={{ padding: "13px 14px" }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={styles.todayRow}
                style={{ padding: "10px 0" }}
              >
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
      <div className={styles.gradHeader}>
        <div className={styles.homeTop}>
          <span className={styles.greeting}>Olá, {firstName}</span>
        </div>
        <button className={styles.childCard} onClick={abrirTrocaFilho}>
          <Avatar
            nome={active.nome}
            fotoUrl={active.fotoUrl}
            bg={avatarColors[active._id]}
            size={48}
          />
          <span style={{ flex: 1 }}>
            <span className={styles.childName} style={{ display: "block" }}>
              {active.nome}
            </span>
            <span className={styles.childSub} style={{ display: "block" }}>
              {active.sub}
            </span>
          </span>
          {criancas.length > 1 && (
            <RefreshCw size={18} style={{ opacity: 0.9 }} />
          )}
        </button>
        <div className={styles.childHint}>
          {criancas.length > 1
            ? `Acompanhando ${active.nome} · toque para trocar de filho`
            : `Acompanhando ${active.nome}`}
        </div>
      </div>

      <NotificationOnboarding />
      <Avisos />
      <AgendaHoje criancaId={active._id} />
      <ChildSwitcherSheet
        open={switcherOpen}
        onClose={() => setSwitcherOpen(false)}
        criancas={criancas}
        activeId={activeId}
        avatarColors={avatarColors}
        onSelect={(id) => {
          setActive(id);
          setSwitcherOpen(false);
        }}
      />
    </div>
  );
}

function ChildSwitcherSheet({
  open,
  onClose,
  criancas,
  activeId,
  avatarColors,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  criancas: Crianca[];
  activeId: string | null;
  avatarColors: Record<string, string>;
  onSelect: (criancaId: string) => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={styles.sheetOverlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label="Trocar de filho"
      >
        <span className={styles.sheetHandle} aria-hidden />
        <div className={styles.sheetHead}>
          <span className={styles.sheetTitle}>Trocar de filho</span>
          <button
            type="button"
            className={styles.sheetClose}
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>
        <div className={styles.sheetBody}>
          {criancas.map((c) => {
            const isActive = c._id === activeId;
            return (
              <button
                key={c._id}
                className={`${styles.profChild} ${isActive ? styles.profChildActive : ""}`}
                onClick={() => onSelect(c._id)}
              >
                <Avatar
                  nome={c.nome}
                  fotoUrl={c.fotoUrl}
                  bg={avatarColors[c._id]}
                  size={46}
                />
                <span style={{ flex: 1 }}>
                  <span
                    className={styles.childName}
                    style={{
                      display: "block",
                      color: "var(--text)",
                      fontSize: 14.5,
                    }}
                  >
                    {c.nome}
                  </span>
                  <span
                    style={{
                      display: "block",
                      fontSize: 12,
                      color: "var(--text-dim)",
                    }}
                  >
                    {c.sub}
                  </span>
                </span>
                {isActive && <span className={styles.emptyBadge}>Ativo</span>}
              </button>
            );
          })}
        </div>
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
        <div className={styles.blockHead}>
          <Skeleton width={70} height={15} />
        </div>
        <div className={styles.stack}>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className={styles.aviso}>
              <Skeleton width={38} height={38} radius={11} />
              <span style={{ flex: 1 }}>
                <Skeleton width="45%" height={13} style={{ marginBottom: 6 }} />
                <Skeleton width="90%" height={12} />
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (avisos.length === 0) return null;

  return (
    <div className={styles.block}>
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
  );
}

function AgendaHoje({ criancaId }: { criancaId: string }) {
  const { data, loading } = useFetch(
    () => AgendaService.getDia(criancaId),
    [criancaId],
  );
  const entries = (data?.entries ?? []).slice(0, 3);
  const semRegistro = !loading && entries.length === 0;

  if (loading) {
    return (
      <div className={styles.block} role="status" aria-label="Carregando…">
        <div className={styles.blockHead}>
          <Skeleton width={110} height={15} />
        </div>
        <div className={styles.todayCard}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={styles.todayRow}>
              <Skeleton width={34} height={34} radius={10} />
              <span style={{ flex: 1 }}>
                <Skeleton width="35%" height={11} style={{ marginBottom: 6 }} />
                <Skeleton width="65%" height={13} />
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.block}>
      <div className={styles.blockHead}>
        <span className={styles.blockTitle}>Agenda de hoje</span>
      </div>
      {semRegistro ? (
        <div className={styles.agendaPendente}>
          <span className={styles.agendaPendenteText}>
            A agenda de hoje ainda não foi preenchida pela professora.
          </span>
          <Link
            href={`/historico/${criancaId}`}
            className={styles.agendaPendenteLink}
          >
            <History size={15} /> Ver histórico
          </Link>
        </div>
      ) : (
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
      )}
    </div>
  );
}
