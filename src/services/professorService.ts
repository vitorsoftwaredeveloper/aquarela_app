import { api } from "./api";
import { IS_DEV_DATA } from "@/config/env";
import { devCriancas } from "./devData";
import { unwrapItem, unwrapList } from "./unwrap";
import { getApiErrorStatus } from "./apiError";
import { hojeISO } from "@/utils/date";
import type {
  AgendaRegistroPayload,
  AlunoTurma,
  TurmaProfessor,
} from "@/types/professorAgenda";

/** Documento devolvido por `GET /agenda` — mesma forma do POST/PUT + `_id` (docs §"Agenda diária"). */
export interface AgendaDoDia extends AgendaRegistroPayload {
  _id: string;
}

/**
 * Sessão de preview (`IS_DEV_DATA`) apenas: como `devCriancas` é uma fixture
 * estática, sem isto o card volta a "Pendente" ao voltar pra lista mesmo
 * depois de salvar — nada persiste entre chamadas de `listAlunos`.
 */
const devAgendasRegistradasHoje = new Set<string>();
/** Guarda o último payload salvo em dev, para a tela de edição pré-preencher. */
const devAgendaPorCrianca = new Map<string, AgendaRegistroPayload>();

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
      return devCriancas.map((c, i) => ({
        ...c,
        agendaRegistrada: i > 0 || devAgendasRegistradasHoje.has(c._id),
      }));
    }
    const { data } = await api.get(`/turmas/${turmaId}/criancas`);
    // Backend (docs/03-Backend §"Turmas") manda `agendaRegistradaHoje`, não
    // `agendaRegistrada` — sem este remapeamento o card fica preso em
    // "Pendente" mesmo com a agenda salva (campo sempre undefined).
    const raw = unwrapList<AlunoTurma & { agendaRegistradaHoje?: boolean }>(
      data,
    );
    return raw.map(({ agendaRegistradaHoje, ...c }) => ({
      ...c,
      agendaRegistrada: agendaRegistradaHoje ?? false,
    }));
  },

  /**
   * Registro do dia já existente, se houver (para pré-preencher o form de
   * edição). Sem registro no dia a API responde `404` — não é erro de
   * verdade, só significa "ainda não registrada".
   */
  async getAgendaDoDia(
    criancaId: string,
    data: string = hojeISO(),
  ): Promise<AgendaDoDia | null> {
    if (IS_DEV_DATA) {
      const payload = devAgendaPorCrianca.get(criancaId);
      return payload ? { ...payload, _id: `dev-${criancaId}` } : null;
    }
    try {
      const { data: res } = await api.get("/agenda", {
        params: { criancaId, data },
      });
      return unwrapItem<AgendaDoDia>(res);
    } catch (err) {
      if (getApiErrorStatus(err) === 404) return null;
      throw err;
    }
  },

  /** Cria o registro do dia (ainda não existe). */
  async salvarAgenda(payload: AgendaRegistroPayload): Promise<void> {
    if (IS_DEV_DATA) {
      devAgendasRegistradasHoje.add(payload.criancaId);
      devAgendaPorCrianca.set(payload.criancaId, payload);
      return;
    }
    await api.post("/agenda", payload);
  },

  /** Edita o registro do dia já existente. */
  async atualizarAgenda(
    id: string,
    payload: AgendaRegistroPayload,
  ): Promise<void> {
    if (IS_DEV_DATA) {
      devAgendasRegistradasHoje.add(payload.criancaId);
      devAgendaPorCrianca.set(payload.criancaId, payload);
      return;
    }
    // `PUT /agenda/{id}` já identifica criança+data pela URL — o schema do
    // backend rejeita `criancaId`/`data` no corpo com 400 additionalProperties.
    const { criancaId: _criancaId, data: _data, ...campos } = payload;
    await api.put(`/agenda/${id}`, campos);
  },
};
