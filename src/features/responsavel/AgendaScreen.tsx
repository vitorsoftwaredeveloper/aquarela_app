"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ShieldAlert } from "lucide-react";
import { Skeleton } from "@/components";
import { useFetch } from "@/hooks/useFetch";
import { AgendaService } from "@/services/agendaService";
import { CriancasService } from "@/services/criancas";
import { linhaCuidados, temCuidados } from "@/types/crianca";
import { AGENDA_VISUAL } from "./agendaVisual";
import styles from "./responsavel.module.css";

export function AgendaScreen({ criancaId }: { criancaId: string }) {
  const router = useRouter();
  const crianca = useFetch(() => CriancasService.getById(criancaId));
  const agenda = useFetch(() => AgendaService.getDia(criancaId));

  const c = crianca.data;
  const dia = agenda.data;

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
          <div className={styles.pushTitle}>{c?.nome ?? "Agenda"}</div>
          <div className={styles.pushSub}>{dia?.dataLabel ?? "Hoje"}</div>
        </div>
        <Link href={`/historico/${criancaId}`} className={styles.pushAction}>
          Histórico
        </Link>
      </div>

      {c && temCuidados(c) && (
        <div className={styles.careBand}>
          <span className={styles.careIcon}>
            <ShieldAlert size={18} />
          </span>
          <div className={styles.careText}>
            <b>Cuidados de hoje.</b> {linhaCuidados(c)}
          </div>
        </div>
      )}

      {agenda.loading ? (
        <div className={styles.entries} role="status" aria-label="Carregando…">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.entry}>
              <Skeleton width={40} height={40} radius={12} />
              <span style={{ flex: 1 }}>
                <Skeleton
                  width="40%"
                  height={13}
                  style={{ marginBottom: 6 }}
                />
                <Skeleton width="80%" height={13} />
              </span>
            </div>
          ))}
        </div>
      ) : agenda.error || !dia ? (
        <div className={styles.state}>
          <span className={styles.emptyBadge}>Sem registro hoje</span>
          <p>Ainda não há anotações para este dia.</p>
        </div>
      ) : (
        <div className={styles.entries}>
          {dia.entries.map((e, i) => {
            const v = AGENDA_VISUAL[e.tipo];
            const Icon = v.icon;
            return (
              <div
                key={i}
                className={`${styles.entry} ${e.destaque ? styles.entryDestaque : ""}`}
              >
                <span
                  className={styles.entryIcon}
                  style={{ background: v.bg, color: v.fg }}
                >
                  <Icon size={19} />
                </span>
                <div style={{ flex: 1 }}>
                  <div
                    className={styles.entryTitle}
                    style={e.destaque ? { color: "#9A2F1B" } : undefined}
                  >
                    {e.title}
                  </div>
                  <div className={styles.entryText}>{e.text}</div>
                </div>
              </div>
            );
          })}
          {dia.registradoPor && (
            <div className={styles.signedBy}>
              registrado por <b>{dia.registradoPor}</b>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
