"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Avatar, Skeleton } from "@/components";
import { useAuth } from "@/contexts/AuthContext";
import { useFetch } from "@/hooks/useFetch";
import { MensagensService } from "@/services/mensagens";
import { ProfessorService } from "@/services/professorService";
import { sortearCoresAvatar } from "@/types/crianca";
import type { AlunoTurma } from "@/types/professorAgenda";
import styles from "./professor.module.css";

interface AlunoComTurma extends AlunoTurma {
  turmaNome: string;
}

export function RecadosListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const nome = user?.name ?? user?.email ?? "Professor(a)";
  const turmas = useFetch(() => ProfessorService.listMinhasTurmas());
  const naoLidas = useFetch(() => MensagensService.naoLidas());
  const [alunos, setAlunos] = useState<AlunoComTurma[] | null>(null);

  useEffect(() => {
    if (!turmas.data) return;
    let cancelado = false;
    Promise.all(
      turmas.data.map(async (turma) => {
        const lista = await ProfessorService.listAlunos(turma._id);
        return lista.map((aluno) => ({ ...aluno, turmaNome: turma.nome }));
      }),
    ).then((listas) => {
      if (!cancelado) setAlunos(listas.flat());
    });
    return () => {
      cancelado = true;
    };
  }, [turmas.data]);

  const naoLidasPorCrianca = useMemo(() => {
    const mapa = new Map<string, number>();
    (naoLidas.data ?? []).forEach((item) => mapa.set(item.criancaId, item.naoLidas));
    return mapa;
  }, [naoLidas.data]);

  const avatarColors = useMemo(
    () => sortearCoresAvatar((alunos ?? []).map((a) => a._id)),
    [alunos],
  );

  const ordenados = useMemo(() => {
    if (!alunos) return [];
    return [...alunos].sort((a, b) => {
      const naoLidasA = naoLidasPorCrianca.get(a._id) ?? 0;
      const naoLidasB = naoLidasPorCrianca.get(b._id) ?? 0;
      if (naoLidasA !== naoLidasB) return naoLidasB - naoLidasA;
      return a.nome.localeCompare(b.nome);
    });
  }, [alunos, naoLidasPorCrianca]);

  const carregando = turmas.loading || alunos === null;

  return (
    <div>
      <div className={styles.header}>
        <div>
          <div className={styles.headerWho}>{nome}</div>
          <div className={styles.headerTitle}>Recados</div>
          <div className={styles.pushSub} style={{ color: "rgba(255,255,255,0.85)" }}>
            {carregando ? "Carregando…" : `${ordenados.length} alunos`}
          </div>
        </div>
      </div>

      {carregando ? (
        <div className={styles.alunoList} role="status" aria-label="Carregando…">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={styles.alunoCard}>
              <Skeleton width={46} height={46} radius={14} />
              <span style={{ flex: 1 }}>
                <Skeleton width="50%" height={14} style={{ marginBottom: 8 }} />
                <Skeleton width="30%" height={11} />
              </span>
            </div>
          ))}
        </div>
      ) : ordenados.length === 0 ? (
        <div className={styles.state}>
          <span className={styles.emptyBadge}>Sem alunos</span>
          <p>Nenhuma criança vinculada às suas turmas ainda.</p>
        </div>
      ) : (
        <div className={styles.alunoList}>
          {ordenados.map((aluno) => {
            const naoLidasDoAluno = naoLidasPorCrianca.get(aluno._id) ?? 0;
            return (
              <button
                key={aluno._id}
                className={styles.alunoCard}
                onClick={() => router.push(`/professor/recados/${aluno._id}`)}
              >
                <Avatar
                  nome={aluno.nome}
                  fotoUrl={aluno.fotoUrl}
                  bg={avatarColors[aluno._id]}
                  className={styles.alunoAvatar}
                />
                <span style={{ flex: 1 }}>
                  <span className={styles.alunoName} style={{ display: "block" }}>
                    {aluno.nome}
                  </span>
                  <span className={styles.alunoSub} style={{ display: "block" }}>
                    {aluno.turmaNome}
                  </span>
                </span>
                {naoLidasDoAluno > 0 ? (
                  <span
                    className={styles.status}
                    style={{
                      color: "#fff",
                      background: "var(--color-danger)",
                    }}
                  >
                    {naoLidasDoAluno > 9 ? "9+" : naoLidasDoAluno}
                  </span>
                ) : (
                  <MessageCircle size={18} style={{ color: "var(--text-mute)" }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
