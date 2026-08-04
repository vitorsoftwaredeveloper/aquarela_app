"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { BackButton, Skeleton } from "@/components";
import { useHideTopbar, useWideContent } from "@/contexts/PageTitleContext";
import { useFetch } from "@/hooks/useFetch";
import { AgendaService } from "@/services/agendaService";
import { CriancasService } from "@/services/criancas";
import { linhaCuidados, temCuidados } from "@/types/crianca";
import { AgendaStory } from "./AgendaStory";
import styles from "./responsavel.module.css";

export function AgendaScreen({ criancaId }: { criancaId: string }) {
  useHideTopbar();
  useWideContent();
  const router = useRouter();
  const crianca = useFetch(
    () => CriancasService.getById(criancaId),
    [criancaId],
  );
  const agenda = useFetch(() => AgendaService.getDia(criancaId), [criancaId]);

  const c = crianca.data;
  const dia = agenda.data;

  return (
    <div>
      <div className={styles.pushHeader}>
        <BackButton onClick={() => router.back()} />
        <div style={{ flex: 1 }}>
          <div className={styles.pushTitle}>{c?.nome ?? "Agenda"}</div>
          <div className={styles.pushSub}>{dia?.dataLabel ?? "Hoje"}</div>
        </div>
        <Link
          href={`/historico/${criancaId}`}
          className={styles.pushAction}
          style={{ marginLeft: "auto" }}
        >
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
                <Skeleton width="40%" height={13} style={{ marginBottom: 6 }} />
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
        <>
          <AgendaStory
            entries={dia.entries}
            criancaNome={c?.nome}
            professor={dia.professor}
            dataLabel={dia.dataLabel}
            anexos={dia.anexos}
          />
          {(dia.entries.length > 0 || (dia.anexos?.length ?? 0) > 0) && (
            <div className={styles.signedBy}>
              Registrado no fim do dia · Aquarela Kids
            </div>
          )}
        </>
      )}
    </div>
  );
}
