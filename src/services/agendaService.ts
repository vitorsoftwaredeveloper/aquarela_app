import { api } from "./api";
import { IS_DEV_DATA } from "@/config/env";
import { devAgendaByChild, devAvisos, devHistoricoByChild } from "./devData";
import { unwrapItem, unwrapList } from "./unwrap";
import { getApiErrorStatus } from "./apiError";
import { hojeISO } from "@/utils/date";
import {
  ACEITACAO_OPTS,
  HUMORES,
  INTERCORRENCIA_TIPO,
  REFEICAO_CODIGO,
} from "@/types/professorAgenda";
import type {
  AgendaDia,
  AgendaEntry,
  Aviso,
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
  professor?: { _id: string; nome: string; fotoUrl?: string };
}

// Mapas do professor (rótulo pt-BR → código) invertidos, para exibir de volta.
const REFEICAO_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(REFEICAO_CODIGO).map(([label, code]) => [code, label]),
);

const ACEITACAO_LABEL: Record<string, string> = Object.fromEntries(
  ACEITACAO_OPTS.map((o) => [o.value, o.label]),
);

const HUMOR_INFO: Record<string, { label: string; emoji: string }> =
  Object.fromEntries(
    HUMORES.map((h) => [h.value, { label: h.label, emoji: h.emoji }]),
  );

const INTERCORRENCIA_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(INTERCORRENCIA_TIPO).map(([label, code]) => [code, label]),
);

/** "Hoje" para a data corrente; senão DD/MM. `iso` pode vir com hora (Date serializado). */
function formatDataLabel(iso: string): string {
  const dataOnly = iso.slice(0, 10);
  if (dataOnly === hojeISO()) return "Hoje";
  const [, mes, dia] = dataOnly.split("-");
  return `${dia}/${mes}`;
}

/** Documento cru devolvido por GET/POST/PUT /avisos (docs §5 "Avisos"). */
export interface AvisoRaw {
  _id: string;
  titulo: string;
  corpo: string;
  turmaId?: string;
  ativo?: boolean;
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
    const info = HUMOR_INFO[raw.humor];
    entries.push({
      tipo: "humor",
      title: "Humor",
      text: info ? `${info.emoji} ${info.label}` : raw.humor,
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

  const humorInfo = raw.humor ? HUMOR_INFO[raw.humor] : undefined;
  const alerta =
    (raw.intercorrencias ?? []).map((i) => i.descricao).join(", ") || undefined;

  return {
    data: raw.data.slice(0, 10),
    dataLabel: formatDataLabel(raw.data),
    humorLabel: humorInfo?.label ?? "—",
    humorEmoji: humorInfo?.emoji ?? "—",
    chips,
    alerta,
    observacoes: raw.observacoes,
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
