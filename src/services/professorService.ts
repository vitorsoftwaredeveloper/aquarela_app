import { api } from "./api";
import { IS_DEV_DATA } from "@/config/env";
import { devCriancas } from "./devData";
import { unwrapList } from "./unwrap";
import type {
  AgendaRegistroPayload,
  AlunoTurma,
  TurmaProfessor,
} from "@/types/professorAgenda";

/** Turmas/alunos do professor logado + registro da agenda diária. */
export const ProfessorService = {
  /** O backend filtra pelas turmas do professor autenticado. */
  async listMinhasTurmas(): Promise<TurmaProfessor[]> {
    if (IS_DEV_DATA) {
      return [
        {
          _id: "t-girassol",
          nome: "Girassol",
          periodo: "Integral",
          totalCriancas: 2,
          agendasPendentes: 1,
        },
        {
          _id: "t-sol",
          nome: "Sol",
          periodo: "Meio período",
          totalCriancas: 1,
          agendasPendentes: 0,
        },
      ];
    }
    const { data } = await api.get("/turmas");
    return unwrapList<TurmaProfessor>(data);
  },

  async listAlunos(turmaId: string): Promise<AlunoTurma[]> {
    if (IS_DEV_DATA) {
      return devCriancas.map((c, i) => ({ ...c, agendaRegistrada: i > 0 }));
    }
    const { data } = await api.get(`/turmas/${turmaId}/criancas`);
    return unwrapList<AlunoTurma>(data);
  },

  /** Cria/atualiza o registro do dia (salvamento otimista na tela). */
  async salvarAgenda(payload: AgendaRegistroPayload): Promise<void> {
    if (IS_DEV_DATA) return;
    await api.post("/agenda", payload);
  },
};
