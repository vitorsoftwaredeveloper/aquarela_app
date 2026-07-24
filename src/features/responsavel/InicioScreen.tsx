"use client";

import Link from "next/link";
import { Bell, ChevronRight, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useResponsavel } from "@/contexts/ResponsavelContext";
import { useFetch } from "@/hooks/useFetch";
import { AgendaService } from "@/services/agendaService";
import { AGENDA_VISUAL } from "./agendaVisual";
import styles from "./responsavel.module.css";

const AVISO_TONE = { bg: "#EAF3FC", fg: "#2F7FCB" };

export function InicioScreen() {
  const { user } = useAuth();
  const { criancas, active, activeId, setActive, loading } = useResponsavel();
  const firstName = (user?.name ?? "").split(" ")[0] || "responsável";

  function trocarFilho() {
    if (criancas.length < 2 || !activeId) return;
    const i = criancas.findIndex((c) => c._id === activeId);
    setActive(criancas[(i + 1) % criancas.length]._id);
  }

  if (loading) {
    return (
      <div className={styles.state}>
        <span className={styles.spinner} aria-hidden />
        <span>Carregando…</span>
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
          <button className={styles.headerIconBtn} aria-label="Notificações">
            <Bell size={18} />
          </button>
        </div>
        <button className={styles.childCard} onClick={trocarFilho}>
          <span
            className={styles.childAvatar}
            style={{ background: active.avatarBg }}
          >
            {active.iniciais}
          </span>
          <span style={{ flex: 1 }}>
            <span className={styles.childName} style={{ display: "block" }}>
              {active.nome}
            </span>
            <span className={styles.childSub} style={{ display: "block" }}>
              {active.sub}
            </span>
          </span>
          {criancas.length > 1 && <RefreshCw size={18} style={{ opacity: 0.9 }} />}
        </button>
        <div className={styles.childHint}>
          {criancas.length > 1
            ? `Acompanhando ${active.nome} · toque para trocar de filho`
            : `Acompanhando ${active.nome}`}
        </div>
      </div>

      <Avisos />
      <AgendaHoje criancaId={active._id} />
    </div>
  );
}

function Avisos() {
  const { data } = useFetch(() => AgendaService.getAvisos());
  const avisos = data ?? [];
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
  const { data } = useFetch(() => AgendaService.getDia(criancaId), [criancaId]);
  const entries = (data?.entries ?? []).slice(0, 3);

  return (
    <div className={styles.block}>
      <div className={styles.blockHead}>
        <span className={styles.blockTitle}>Agenda de hoje</span>
      </div>
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
    </div>
  );
}
