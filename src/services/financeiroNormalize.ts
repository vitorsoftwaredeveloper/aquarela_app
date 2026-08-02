import type {
  Balanco,
  Inadimplente,
  RelatorioAnual,
  RelatorioAnualCrianca,
  RelatorioAnualMes,
} from "@/types/financeiroAdmin";

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

/**
 * Normaliza `/financeiro/relatorio-anual` para um `RelatorioAnual` sempre
 * renderizável. Garante os 12 meses mesmo quando a API devolve só os meses com
 * movimento — a tabela é uma grade fixa de janeiro a dezembro.
 */
export function normalizarRelatorioAnual(
  bruto: unknown,
  anoFallback: number,
): RelatorioAnual {
  const raiz = (bruto ?? {}) as Record<string, unknown>;
  const corpo = (raiz.data ?? raiz) as Record<string, unknown>;
  const totaisBrutos = (corpo.totais ?? {}) as Record<string, unknown>;

  const mesesBrutos = Array.isArray(corpo.meses) ? corpo.meses : [];
  const mesesPorNumero = new Map<number, Record<string, unknown>>(
    mesesBrutos.map((m) => {
      const item = (m ?? {}) as Record<string, unknown>;
      return [num(item.mes), item];
    }),
  );

  const meses: RelatorioAnualMes[] = MESES_CURTO.map((_, indice) => {
    const item = mesesPorNumero.get(indice + 1) ?? {};
    const pagamentos = num(item.pagamentos);
    const despesas = num(item.despesas);
    return {
      mes: indice + 1,
      pagamentos,
      despesas,
      saldo: item.saldo === undefined ? pagamentos - despesas : num(item.saldo),
      quantidadePagamentos: num(item.quantidadePagamentos),
    };
  });

  const criancasBrutas = Array.isArray(corpo.criancas) ? corpo.criancas : [];
  const criancas: RelatorioAnualCrianca[] = criancasBrutas.map((c) => {
    const item = (c ?? {}) as Record<string, unknown>;
    const mesesCrianca = Array.isArray(item.meses) ? item.meses : [];
    return {
      criancaId: String(item.criancaId ?? item._id ?? ""),
      nome: (item.nome as string) || "—",
      turmaNome: (item.turmaNome as string) ?? null,
      total: num(item.total),
      meses: mesesCrianca.map((m) => {
        const mesItem = (m ?? {}) as Record<string, unknown>;
        return {
          mes: num(mesItem.mes),
          valor: num(mesItem.valor),
          quantidadePagamentos: num(mesItem.quantidadePagamentos),
        };
      }),
    };
  });

  const anosDisponiveis = Array.isArray(corpo.anosDisponiveis)
    ? corpo.anosDisponiveis.map(num).filter(Boolean)
    : [];
  const ano = num(corpo.ano) || anoFallback;

  return {
    ano,
    consolidadoEm: (corpo.consolidadoEm as string) ?? "",
    origem: corpo.origem === "consolidado" ? "consolidado" : "calculado",
    anosDisponiveis: anosDisponiveis.length ? anosDisponiveis : [ano],
    totais: {
      pagamentos: num(totaisBrutos.pagamentos),
      despesas: num(totaisBrutos.despesas),
      saldo: num(totaisBrutos.saldo),
      quantidadePagamentos: num(totaisBrutos.quantidadePagamentos),
      criancasComPagamento:
        num(totaisBrutos.criancasComPagamento) || criancas.length,
      ticketMedio: num(totaisBrutos.ticketMedio),
    },
    meses,
    criancas,
  };
}
