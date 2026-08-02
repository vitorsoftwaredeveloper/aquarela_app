"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Check,
  CheckCheck,
  ChevronLeft,
  Clock,
  Images,
  MessageCircle,
  ShieldAlert,
} from "lucide-react";
import { Avatar, Skeleton } from "@/components";
import { useFetch } from "@/hooks/useFetch";
import { useRecadosNaoLidos } from "@/hooks/useRecadosNaoLidos";
import { ProfessorService } from "@/services/professorService";
import { sortearCoresAvatar, temCuidados } from "@/types/crianca";
import styles from "./professor.module.css";

export function AlunosScreen({ turmaId }: { turmaId: string }) {
  const router = useRouter();
  const { data, loading, error } = useFetch(
    () => ProfessorService.listAlunos(turmaId),
    [turmaId],
  );
  const naoLidos = useRecadosNaoLidos();
  const alunos = data ?? [];
  const registradas = alunos.filter((a) => a.agendaRegistrada).length;
  const avatarColors = useMemo(
    () => sortearCoresAvatar(alunos.map((a) => a._id)),
    [alunos],
  );

  return (
    <div>
      <div className={styles.pushHeader}>
        <button
          className={styles.backBtn}
          onClick={() => router.push("/professor/turmas")}
          aria-label="Voltar"
        >
          <ChevronLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div className={styles.pushTitle}>Alunos da turma</div>
          <div className={styles.pushSub}>
            {loading
              ? "Carregando…"
              : `${registradas} de ${alunos.length} agendas registradas hoje`}
          </div>
        </div>
        <button
          className={styles.backBtn}
          onClick={() => router.push(`/professor/turmas/${turmaId}/mural`)}
          aria-label="Mural de fotos"
          title="Mural de fotos"
        >
          <Images size={19} />
        </button>
        <button
          className={styles.backBtn}
          onClick={() =>
            router.push(`/professor/turmas/${turmaId}/planos-aula`)
          }
          aria-label="Planos de aula"
          title="Planos de aula"
        >
          <BookOpen size={19} />
        </button>
      </div>

      {loading ? (
        <div
          className={styles.alunoList}
          role="status"
          aria-label="Carregando…"
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={styles.alunoCard}>
              <Skeleton width={46} height={46} radius={14} />
              <span style={{ flex: 1 }}>
                <Skeleton width="50%" height={14} style={{ marginBottom: 8 }} />
                <Skeleton width="30%" height={11} />
              </span>
              <Skeleton width={86} height={24} radius={20} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className={styles.state}>
          <span className={styles.emptyBadge}>Erro</span>
          <p>{error}</p>
        </div>
      ) : alunos.length === 0 ? (
        <div className={styles.state}>
          <span className={styles.emptyBadge}>Turma vazia</span>
          <p>Nenhuma criança vinculada a esta turma.</p>
        </div>
      ) : (
        <div className={styles.alunoList}>
          {alunos.map((a) => {
            const alerta = temCuidados(a);
            const temNaoLido = naoLidos.has(a._id);
            return (
              <div key={a._id} className={styles.alunoCardWrap}>
                <button
                  className={styles.alunoCard}
                  onClick={() => router.push(`/professor/agenda/${a._id}`)}
                >
                  <span className={styles.alunoAvatarWrap}>
                    <Avatar
                      nome={a.nome}
                      fotoUrl={a.fotoUrl}
                      bg={avatarColors[a._id]}
                      className={styles.alunoAvatar}
                    />
                    {alerta && (
                      <span
                        className={styles.allergyDot}
                        title="Tem alergia/medicação"
                      >
                        <ShieldAlert size={12} />
                      </span>
                    )}
                  </span>
                  <span style={{ flex: 1 }}>
                    <span
                      className={styles.alunoName}
                      style={{ display: "block" }}
                    >
                      {a.nome}
                    </span>
                    <span
                      className={styles.alunoSub}
                      style={{ display: "block" }}
                    >
                      {a.idadeLabel ?? a.sub}
                    </span>
                  </span>
                  <span
                    className={styles.status}
                    title={
                      a.agendaEnviada
                        ? "Registrada e enviada aos pais"
                        : undefined
                    }
                    style={
                      a.agendaEnviada
                        ? {
                            color: "var(--color-secondary-strong)",
                            background: "var(--color-secondary-soft)",
                          }
                        : a.agendaRegistrada
                          ? {
                              color: "var(--color-primary-link)",
                              background: "var(--color-primary-soft)",
                            }
                          : {
                              color: "#C7522B",
                              background: "var(--color-accent-soft)",
                            }
                    }
                  >
                    {a.agendaEnviada ? (
                      <CheckCheck size={13} />
                    ) : a.agendaRegistrada ? (
                      <Check size={13} />
                    ) : (
                      <Clock size={13} />
                    )}
                    {a.agendaEnviada
                      ? "Enviada"
                      : a.agendaRegistrada
                        ? "Registrada"
                        : "Pendente"}
                  </span>
                </button>
                <button
                  type="button"
                  className={styles.recadosBtn}
                  onClick={() => router.push(`/professor/recados/${a._id}`)}
                  aria-label={
                    temNaoLido
                      ? `Recados não lidos de ${a.nome}`
                      : `Recados de ${a.nome}`
                  }
                >
                  <MessageCircle size={16} />
                  {temNaoLido && <span className={styles.recadosBadge} />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
