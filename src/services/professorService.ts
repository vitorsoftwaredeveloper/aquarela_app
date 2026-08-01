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
import type { EditMeuCadastroProfessor, Professor } from "@/types/professor";

/** Documento devolvido por `GET /agenda` — mesma forma do POST/PUT + `_id` (docs §"Agenda diária"). */
export interface AgendaDoDia extends AgendaRegistroPayload {
  _id: string;
  /** Preenchido por `POST /agenda/{id}/enviar` (docs §"Notificações push"). */
  enviadaEm?: string;
  ultimoEnvioEm?: string;
  enviosCount?: number;
  notificado?: boolean;
  motivo?: "DEBOUNCE";
}

/**
 * Sessão de preview (`IS_DEV_DATA`) apenas: como `devCriancas` é uma fixture
 * estática, sem isto o card volta a "Pendente" ao voltar pra lista mesmo
 * depois de salvar — nada persiste entre chamadas de `listAlunos`.
 */
const devAgendasRegistradasHoje = new Set<string>();
/** Guarda o último payload salvo em dev, para a tela de edição pré-preencher. */
const devAgendaPorCrianca = new Map<string, AgendaRegistroPayload>();
/** Guarda `enviadaEm` por agenda em dev, pra tela de agenda refletir o estado "Enviada". */
const devEnviadaEmPorAgenda = new Map<string, string>();
/** Guarda quais crianças já tiveram a agenda de hoje enviada, pra `listAlunos` refletir. */
const devAgendasEnviadasHoje = new Set<string>();

/** Cadastro do professor demo — mutável em dev pra refletir edições da tela Perfil. */
let devMeuCadastro: Professor = {
  _id: "dev-professor",
  usuarioId: "dev-professor-usuario",
  nome: "Demo Professor",
  email: "professor@aquarela.dev",
  telefone: "11999999999",
  formacao: "Pedagogia",
};

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
        agendaEnviada: devAgendasEnviadasHoje.has(c._id),
      }));
    }
    const { data } = await api.get(`/turmas/${turmaId}/criancas`);
    // Backend (docs/03-Backend §"Turmas") manda `agendaRegistradaHoje`/
    // `agendaEnviadaHoje`, não `agendaRegistrada`/`agendaEnviada` — sem este
    // remapeamento o card fica preso em "Pendente" mesmo com a agenda salva
    // e enviada (campos sempre undefined).
    const raw = unwrapList<
      AlunoTurma & { agendaRegistradaHoje?: boolean; agendaEnviadaHoje?: boolean }
    >(data);
    return raw.map(({ agendaRegistradaHoje, agendaEnviadaHoje, ...c }) => ({
      ...c,
      agendaRegistrada: agendaRegistradaHoje ?? false,
      agendaEnviada: agendaEnviadaHoje ?? false,
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
      const agendaId = `dev-${criancaId}`;
      return payload
        ? {
            ...payload,
            _id: agendaId,
            enviadaEm: devEnviadaEmPorAgenda.get(agendaId),
          }
        : null;
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
  async salvarAgenda(payload: AgendaRegistroPayload): Promise<AgendaDoDia> {
    if (IS_DEV_DATA) {
      devAgendasRegistradasHoje.add(payload.criancaId);
      devAgendaPorCrianca.set(payload.criancaId, payload);
      return { ...payload, _id: `dev-${payload.criancaId}` };
    }
    const { data } = await api.post("/agenda", payload);
    const item = unwrapItem<AgendaDoDia>(data);
    if (!item) throw new Error("Resposta inesperada de POST /agenda");
    return item;
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

  async removerAgenda(id: string, criancaId: string): Promise<void> {
    if (IS_DEV_DATA) {
      devAgendasRegistradasHoje.delete(criancaId);
      devAgendaPorCrianca.delete(criancaId);
      devEnviadaEmPorAgenda.delete(id);
      devAgendasEnviadasHoje.delete(criancaId);
      return;
    }
    await api.delete(`/agenda/${id}`);
  },

  /** Gatilho "Enviar para os pais" — dispara a notificação push (docs §"Notificações push"). */
  async enviarAgenda(id: string): Promise<AgendaDoDia> {
    if (IS_DEV_DATA) {
      const enviadaEm = new Date().toISOString();
      devEnviadaEmPorAgenda.set(id, enviadaEm);
      const criancaId = id.replace(/^dev-/, "");
      devAgendasEnviadasHoje.add(criancaId);
      const payload = devAgendaPorCrianca.get(criancaId);
      return {
        ...(payload as AgendaRegistroPayload),
        _id: id,
        enviadaEm,
        notificado: true,
      };
    }
    const { data } = await api.post(`/agenda/${id}/enviar`);
    const item = unwrapItem<AgendaDoDia>(data);
    if (!item) throw new Error("Resposta inesperada de POST /agenda/{id}/enviar");
    return item;
  },

  /** Próprio cadastro (tela Perfil). `GET /professores/{id}` — professor só lê o próprio. */
  async getMeuCadastro(professorId: string): Promise<Professor> {
    if (IS_DEV_DATA) return { ...devMeuCadastro };
    const { data } = await api.get(`/professores/${professorId}`);
    return data.data;
  },

  /** Edita o próprio cadastro. Nunca manda `email` — backend bloqueia (403) mesmo que igual ao atual. */
  async atualizarMeuCadastro(
    professorId: string,
    payload: EditMeuCadastroProfessor,
  ): Promise<Professor> {
    if (IS_DEV_DATA) {
      const { foto, ...resto } = payload;
      devMeuCadastro = {
        ...devMeuCadastro,
        ...resto,
        fotoUrl: foto
          ? `data:${foto.contentType};base64,${foto.base64}`
          : devMeuCadastro.fotoUrl,
      };
      return { ...devMeuCadastro };
    }
    const { data } = await api.put(`/professores/${professorId}`, payload);
    return data.data;
  },
};
