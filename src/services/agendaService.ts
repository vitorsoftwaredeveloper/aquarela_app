import { api } from "./api";
import { IS_DEV_DATA } from "@/config/env";
import {
  devAgendaByChild,
  devAvisos,
  devFrequenciaByChild,
  devHistoricoByChild,
} from "./devData";
import { unwrapItem, unwrapList } from "./unwrap";
import { getApiErrorStatus } from "./apiError";
import { diasAtrasISO, hojeISO } from "@/utils/date";
import {
  ACEITACAO_OPTS,
  HUMORES,
  INTERCORRENCIA_TIPO,
  PRESENCAS,
  REFEICAO_CODIGO,
  TAREFAS_CASA,
} from "@/types/professorAgenda";
import type {
  AgendaDia,
  AgendaEntry,
  AnexoAgenda,
  Aviso,
  FrequenciaResumo,
  HistoricoDia,
} from "@/types/agenda";

/** Documento cru devolvido por GET /agenda e GET /agenda/historico (docs §6) — mesma forma do POST. */
interface AgendaRaw {
  data: string;
  alimentacao?: { refeicao: string; aceitacao: string; obs?: string }[];
  sono?: { inicio: string; fim: string }[];
  atividades?: string[];
  humor?: string;
  higiene?: { fraldas?: number; obs?: string };
  medicacoesAdministradas?: {
    nome: string;
    dose: string;
    hora: string;
    aplicadaPor: string;
  }[];
  intercorrencias?: { tipo: string; descricao: string; hora: string }[];
  observacoes?: string;
  tarefaCasa?: { status: string; observacao?: string };
  presenca?: { status: string; horaChegada?: string; justificativa?: string };
  anexos?: AnexoAgenda[];
  professor?: { _id: string; nome: string; fotoUrl?: string };
}

// Mapas do professor (rótulo pt-BR → código) invertidos, para exibir de volta.
const REFEICAO_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(REFEICAO_CODIGO).map(([label, code]) => [code, label]),
);

const ACEITACAO_LABEL: Record<string, string> = Object.fromEntries(
  ACEITACAO_OPTS.map((o) => [o.value, o.label]),
);

const HUMOR_LABEL: Record<string, string> = Object.fromEntries(
  HUMORES.map((h) => [h.value, h.label]),
);

const INTERCORRENCIA_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(INTERCORRENCIA_TIPO).map(([label, code]) => [code, label]),
);

const TAREFA_CASA_LABEL: Record<string, string> = Object.fromEntries(
  TAREFAS_CASA.map((t) => [t.value, t.label]),
);

const PRESENCA_LABEL: Record<string, string> = Object.fromEntries(
  PRESENCAS.map((p) => [p.value, p.label]),
);

/** "Hoje" para a data corrente; senão DD/MM. `iso` pode vir com hora (Date serializado). */
function formatDataLabel(iso: string): string {
  const dataOnly = iso.slice(0, 10);
  if (dataOnly === hojeISO()) return "Hoje";
  const [, mes, dia] = dataOnly.split("-");
  return `${dia}/${mes}`;
}

/** Documento cru devolvido por GET /agenda/frequencia (docs §6, AG2-09). */
interface FrequenciaRaw {
  criancaId: string;
  de: string;
  ate: string;
  presente: number;
  falta: number;
  atrasado: number;
  total: number;
}

/** Documento cru devolvido por GET/POST/PUT /avisos (docs §5 "Avisos"). */
export interface AvisoRaw {
  _id: string;
  titulo: string;
  corpo: string;
  turmaId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function toAviso(raw: AvisoRaw): Aviso {
  return {
    id: raw._id,
    titulo: raw.titulo,
    corpo: raw.corpo,
    turmaId: raw.turmaId,
    dataLabel: raw.createdAt ? formatDataLabel(raw.createdAt) : "—",
  };
}

/** Converte o documento cru da API nos itens prontos para exibir (título/texto). */
function toEntries(raw: AgendaRaw): AgendaEntry[] {
  const entries: AgendaEntry[] = [];

  for (const item of raw.alimentacao ?? []) {
    entries.push({
      tipo: "alimentacao",
      title: REFEICAO_LABEL[item.refeicao] ?? item.refeicao,
      text: [ACEITACAO_LABEL[item.aceitacao] ?? item.aceitacao, item.obs]
        .filter(Boolean)
        .join(" — "),
    });
  }

  for (const item of raw.sono ?? []) {
    entries.push({
      tipo: "sono",
      title: "Soneca",
      text: `${item.inicio} às ${item.fim}`,
    });
  }

  if (raw.atividades && raw.atividades.length > 0) {
    entries.push({
      tipo: "atividade",
      title: "Atividades",
      text: raw.atividades.join(", "),
    });
  }

  if (raw.humor) {
    entries.push({
      tipo: "humor",
      title: "Humor",
      text: HUMOR_LABEL[raw.humor] ?? raw.humor,
      value: raw.humor,
    });
  }

  if (raw.tarefaCasa) {
    entries.push({
      tipo: "tarefaCasa",
      title: "Tarefa de casa",
      text: [
        TAREFA_CASA_LABEL[raw.tarefaCasa.status] ?? raw.tarefaCasa.status,
        raw.tarefaCasa.observacao,
      ]
        .filter(Boolean)
        .join(" — "),
      value: raw.tarefaCasa.status,
      destaque: raw.tarefaCasa.status === "nao_feito",
    });
  }

  if (raw.presenca) {
    const detalhe =
      raw.presenca.status === "atrasado"
        ? `chegou às ${raw.presenca.horaChegada}`
        : raw.presenca.justificativa;
    entries.push({
      tipo: "presenca",
      title: "Presença",
      text: [PRESENCA_LABEL[raw.presenca.status] ?? raw.presenca.status, detalhe]
        .filter(Boolean)
        .join(" — "),
      value: raw.presenca.status,
      destaque: raw.presenca.status !== "presente",
    });
  }

  const fraldas = raw.higiene?.fraldas ?? 0;
  if (fraldas > 0) {
    entries.push({
      tipo: "higiene",
      title: "Higiene",
      text: [
        `${fraldas} troca${fraldas === 1 ? "" : "s"} de fralda`,
        raw.higiene?.obs,
      ]
        .filter(Boolean)
        .join(" — "),
    });
  }

  for (const med of raw.medicacoesAdministradas ?? []) {
    entries.push({
      tipo: "medicacao",
      title: med.nome,
      text: `${med.dose} · ${med.hora}`,
      destaque: true,
    });
  }

  for (const inc of raw.intercorrencias ?? []) {
    entries.push({
      tipo: "intercorrencia",
      title:
        inc.descricao || INTERCORRENCIA_LABEL[inc.tipo] || "Intercorrência",
      text: "Percebido durante o período no berçário",
      destaque: true,
    });
  }

  if (raw.observacoes) {
    entries.push({
      tipo: "observacao",
      title: "Observações",
      text: raw.observacoes,
    });
  }

  return entries;
}

/** Resumo compacto de um dia para a tela de histórico. */
function toHistoricoDia(raw: AgendaRaw): HistoricoDia {
  const chips: string[] = [];
  for (const item of raw.alimentacao ?? []) {
    chips.push(
      `${REFEICAO_LABEL[item.refeicao] ?? item.refeicao}: ${
        ACEITACAO_LABEL[item.aceitacao] ?? item.aceitacao
      }`,
    );
  }
  for (const item of raw.sono ?? []) {
    chips.push(`Soneca ${item.inicio}–${item.fim}`);
  }
  for (const a of raw.atividades ?? []) chips.push(a);
  const fraldas = raw.higiene?.fraldas ?? 0;
  if (fraldas > 0) chips.push(`${fraldas} fralda${fraldas === 1 ? "" : "s"}`);
  if (raw.presenca && raw.presenca.status !== "presente") {
    chips.push(PRESENCA_LABEL[raw.presenca.status] ?? raw.presenca.status);
  }
  if (raw.tarefaCasa && raw.tarefaCasa.status !== "feito") {
    chips.push(
      `Tarefa: ${TAREFA_CASA_LABEL[raw.tarefaCasa.status] ?? raw.tarefaCasa.status}`,
    );
  }

  const alerta =
    (raw.intercorrencias ?? []).map((i) => i.descricao).join(", ") || undefined;

  return {
    data: raw.data.slice(0, 10),
    dataLabel: formatDataLabel(raw.data),
    humorLabel: raw.humor ? (HUMOR_LABEL[raw.humor] ?? raw.humor) : "—",
    humorValue: raw.humor,
    chips,
    alerta,
    observacoes: raw.observacoes,
    anexos: raw.anexos,
  };
}

/** Agenda diária + avisos (leitura do responsável). Contrato: §5, §6. */
export const AgendaService = {
  /**
   * `data` é obrigatório na API (`GET /agenda`, 400 sem ela) — default: hoje.
   * O backend devolve o documento cru (mesma forma do `POST /agenda`), não um
   * formato pronto para exibir — a tradução para `entries[]` é feita aqui.
   * Sem registro no dia a API responde `404` (comum, não é erro de verdade):
   * devolve agenda vazia em vez de propagar.
   */
  async getDia(
    criancaId: string,
    data: string = hojeISO(),
  ): Promise<AgendaDia> {
    if (IS_DEV_DATA) {
      const dia = devAgendaByChild[criancaId];
      if (dia) return dia;
    }
    try {
      const { data: res } = await api.get("/agenda", {
        params: { criancaId, data },
      });
      const raw = unwrapItem<AgendaRaw>(res);
      return {
        criancaId,
        data: raw?.data?.slice(0, 10) ?? data,
        dataLabel: formatDataLabel(raw?.data ?? data),
        entries: raw ? toEntries(raw) : [],
        professor: raw?.professor
          ? { nome: raw.professor.nome, fotoUrl: raw.professor.fotoUrl }
          : undefined,
        anexos: raw?.anexos,
      };
    } catch (err) {
      if (getApiErrorStatus(err) === 404) {
        return {
          criancaId,
          data,
          dataLabel: formatDataLabel(data),
          entries: [],
        };
      }
      throw err;
    }
  },

  async getHistorico(criancaId: string): Promise<HistoricoDia[]> {
    if (IS_DEV_DATA) return devHistoricoByChild[criancaId] ?? [];
    const { data } = await api.get("/agenda/historico", {
      params: { criancaId },
    });
    return unwrapList<AgendaRaw>(data).map(toHistoricoDia);
  },

  /**
   * Contagem de presença (presente/falta/atrasado) num período — AG2-09.
   * `de`/`ate` são obrigatórios na API; default de 30 dias para casar com o
   * "últimas semanas" já mostrado no cabeçalho do Histórico.
   */
  async getFrequencia(
    criancaId: string,
    de: string = diasAtrasISO(30),
    ate: string = hojeISO(),
  ): Promise<FrequenciaResumo> {
    if (IS_DEV_DATA) {
      return (
        devFrequenciaByChild[criancaId] ?? {
          presente: 0,
          falta: 0,
          atrasado: 0,
          total: 0,
        }
      );
    }
    const { data } = await api.get("/agenda/frequencia", {
      params: { criancaId, de, ate },
    });
    const raw = unwrapItem<FrequenciaRaw>(data);
    return {
      presente: raw?.presente ?? 0,
      falta: raw?.falta ?? 0,
      atrasado: raw?.atrasado ?? 0,
      total: raw?.total ?? 0,
    };
  },

  /**
   * Avisos visíveis ao responsável: o backend já filtra por turma da(s)
   * criança(s) vinculada(s) + avisos globais (docs/03-Backend.md
   * §"Avisos (mural)") — o front só exibe o que vier.
   */
  async getAvisos(): Promise<Aviso[]> {
    if (IS_DEV_DATA) return devAvisos;
    const { data } = await api.get("/avisos");
    return unwrapList<AvisoRaw>(data).map(toAviso);
  },
};
