"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, MessageCircle, ShieldAlert } from "lucide-react";
import { Skeleton } from "@/components";
import { useFetch } from "@/hooks/useFetch";
import { AgendaService } from "@/services/agendaService";
import { CriancasService } from "@/services/criancas";
import { MensagensService } from "@/services/mensagens";
import { linhaCuidados, temCuidados } from "@/types/crianca";
import { AgendaStory } from "./AgendaStory";
import styles from "./responsavel.module.css";

export function AgendaScreen({ criancaId }: { criancaId: string }) {
  const router = useRouter();
  const crianca = useFetch(() => CriancasService.getById(criancaId));
  const agenda = useFetch(() => AgendaService.getDia(criancaId));
  const naoLidas = useFetch(() => MensagensService.naoLidas());

  const c = crianca.data;
  const dia = agenda.data;
  const naoLidasDoFilho =
    naoLidas.data?.find((item) => item.criancaId === criancaId)?.naoLidas ?? 0;

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
        <Link
          href={`/recados/${criancaId}`}
          className={styles.pushAction}
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <MessageCircle size={14} />
          Recados
          {naoLidasDoFilho > 0 && (
            <span className={styles.pushActionBadge}>
              {naoLidasDoFilho > 9 ? "9+" : naoLidasDoFilho}
            </span>
          )}
        </Link>
        <Link
          href={`/historico/${criancaId}`}
          className={styles.pushAction}
          style={{ marginLeft: 0 }}
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
          />
          {dia.entries.length > 0 && (
            <div className={styles.signedBy}>
              Registrado no fim do dia · Aquarela Kids
            </div>
          )}
        </>
      )}
    </div>
  );
}
