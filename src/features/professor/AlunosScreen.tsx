"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCheck, Clock, ShieldAlert } from "lucide-react";
import { Avatar, BackButton, Skeleton } from "@/components";
import { useHideTopbar } from "@/contexts/PageTitleContext";
import { useFetch } from "@/hooks/useFetch";
import { ProfessorService } from "@/services/professorService";
import { sortearCoresAvatar, temCuidados } from "@/types/crianca";
import styles from "./professor.module.css";

export function AlunosScreen({ turmaId }: { turmaId: string }) {
  useHideTopbar();
  const router = useRouter();
  const { data, loading, error } = useFetch(
    () => ProfessorService.listAlunos(turmaId),
    [turmaId],
  );
  const alunos = data ?? [];
  const registradas = alunos.filter((a) => a.agendaRegistrada).length;
  const avatarColors = useMemo(
    () => sortearCoresAvatar(alunos.map((a) => a._id)),
    [alunos],
  );

  return (
    <div>
      <div className={styles.topRow}>
        <BackButton onClick={() => router.push("/professor/turmas")} />
        <div className={styles.pushTitleWrap}>
          <span className={styles.pushTitle}>Alunos da turma</span>
          <span className={styles.pushSub}>
            {loading
              ? "Carregando…"
              : `${registradas} de ${alunos.length} agendas registradas hoje`}
          </span>
        </div>
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
            return (
              <button
                key={a._id}
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
            );
          })}
        </div>
      )}
    </div>
  );
}
