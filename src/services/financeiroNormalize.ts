import type { Balanco, Inadimplente } from "@/types/financeiroAdmin";

const MESES_CURTO = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Normaliza a resposta do balanço para um `Balanco` sempre válido.
 *
 * O contrato do backend ainda está se firmando: aceita `{ resumo, meses }`,
 * campos no nível raiz e nomes alternativos. Sem isto, um payload em formato
 * diferente derrubava a tela inteira (`data.resumo` undefined).
 */
export function normalizarBalanco(bruto: unknown): Balanco {
  const raiz = (bruto ?? {}) as Record<string, unknown>;
  const corpoBruto = (raiz.data ?? raiz) as unknown;
  // A API pode devolver o array de meses direto em `data`, sem envelope
  // `{ resumo, meses }` — nesse caso não existe objeto `resumo` nenhum.
  const arrayDireto = Array.isArray(corpoBruto) ? corpoBruto : undefined;
  const corpo = (arrayDireto ? {} : corpoBruto) as Record<string, unknown>;
  const resumoBruto = (corpo.resumo ?? corpo) as Record<string, unknown>;

  const mesesBrutos = (arrayDireto ??
    corpo.meses ??
    corpo.balanco ??
    corpo.mensal ??
    []) as unknown[];

  const meses = (Array.isArray(mesesBrutos) ? mesesBrutos : []).map((m, i) => {
    const item = (m ?? {}) as Record<string, unknown>;
    const mes = num(item.mes) || i + 1;
    return {
      ano: num(item.ano) || new Date().getFullYear(),
      mes,
      mesLabel:
        (item.mesLabel as string) ?? MESES_CURTO[(mes - 1) % 12] ?? String(mes),
      entradas: num(item.entradas ?? item.receitas ?? item.total),
      despesas: num(item.despesas ?? item.saidas),
    };
  });

  const hoje = new Date();
  const mesAtual = meses.find(
    (m) => m.ano === hoje.getFullYear() && m.mes === hoje.getMonth() + 1,
  );

  return {
    resumo: {
      entradasMes:
        num(resumoBruto.entradasMes ?? resumoBruto.entradas) ||
        (mesAtual?.entradas ?? 0),
      despesasMes:
        num(resumoBruto.despesasMes ?? resumoBruto.despesas) ||
        (mesAtual?.despesas ?? 0),
      inadimplentes: num(resumoBruto.inadimplentes),
      criancasAtivas: num(resumoBruto.criancasAtivas),
      turmas: num(resumoBruto.turmas),
    },
    meses,
  };
}

/**
 * Normaliza a resposta de `/financeiro/inadimplentes` para `Inadimplente[]`.
 *
 * O backend devolve **uma linha por mensalidade atrasada** — formato
 * `{ mensalidade: { valor, mes, ano, ... }, crianca: { nome, responsaveis } }`
 * — não uma lista já agregada por criança com `valorTotal`/`mesesEmAtraso`
 * como a tela espera. Sem agrupar aqui, cada mês em atraso vira uma linha
 * duplicada e `i.valorTotal` fica `undefined` (a API nunca manda esse campo),
 * quebrando a tela com `Cannot read properties of undefined (reading
 * 'toLocaleString')`.
 */
export function normalizarInadimplentes(bruto: unknown): Inadimplente[] {
  const raiz = (bruto ?? {}) as Record<string, unknown>;
  const corpo = (Array.isArray(raiz) ? raiz : (raiz.data ?? raiz)) as unknown;
  const linhas = Array.isArray(corpo) ? corpo : [];

  const porCrianca = new Map<string, Inadimplente>();

  for (const linha of linhas) {
    const item = (linha ?? {}) as Record<string, unknown>;
    const mensalidade = (item.mensalidade ?? item) as Record<string, unknown>;
    const crianca = (item.crianca ?? {}) as Record<string, unknown>;
    const criancaId = String(crianca._id ?? mensalidade.criancaId ?? "");
    if (!criancaId) continue;

    const responsaveis = Array.isArray(crianca.responsaveis)
      ? (crianca.responsaveis as Record<string, unknown>[])
      : [];
    const responsavel = responsaveis[0] ?? {};
    const valor = num(mensalidade.valor);
    const inadimplenteDesde = mensalidade.inadimplenteDesde as
      | string
      | undefined;

    const atual = porCrianca.get(criancaId);
    if (atual) {
      atual.mesesEmAtraso += 1;
      atual.valorTotal += valor;
      if (
        inadimplenteDesde &&
        (!atual.inadimplenteDesde || inadimplenteDesde < atual.inadimplenteDesde)
      ) {
        atual.inadimplenteDesde = inadimplenteDesde;
      }
    } else {
      porCrianca.set(criancaId, {
        criancaId,
        criancaNome: (crianca.nome as string) || "—",
        responsavelNome: (responsavel.nome as string) || "—",
        responsavelContato: (responsavel.telefone as string) || undefined,
        mesesEmAtraso: 1,
        valorTotal: valor,
        inadimplenteDesde,
      });
    }
  }

  return Array.from(porCrianca.values()).sort(
    (a, b) => b.mesesEmAtraso - a.mesesEmAtraso,
  );
}
