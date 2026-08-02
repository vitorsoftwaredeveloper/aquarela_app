/**
 * Fixtures de demonstração — usadas apenas quando IS_DEV_DATA é true
 * (sem Cognito nem API). Permitem navegar as telas antes do backend existir.
 * Nada aqui vai para produção assim que a API for configurada.
 */
import type { Crianca } from "@/types/crianca";
import type { AgendaDia, Aviso, HistoricoDia } from "@/types/agenda";
import type { Mensalidade } from "@/types/financeiro";
import type { Turma } from "@/types/turma";
import type { CriancaCadastro } from "@/types/criancaCadastro";
import type { PlanoAula } from "@/types/planoAula";
import type { Balanco, Despesa, Inadimplente } from "@/types/financeiroAdmin";

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

/** 12 meses de entradas × despesas para o gráfico do dashboard. */
export function devBalanco(): Balanco {
  const entradasBase = [
    38200, 39800, 41100, 40500, 42800, 43600, 42300, 44100, 45200, 44800, 46300,
    47100,
  ];
  const despesasBase = [
    17400, 18100, 17900, 19200, 18600, 19800, 18900, 20100, 19400, 21000, 20300,
    21600,
  ];
  const meses = MESES_CURTO.map((mesLabel, i) => ({
    ano: 2026,
    mes: i + 1,
    mesLabel,
    entradas: entradasBase[i],
    despesas: despesasBase[i],
  }));
  return {
    resumo: {
      entradasMes: 42300,
      despesasMes: 18900,
      inadimplentes: 4,
      criancasAtivas: 58,
      turmas: 6,
    },
    meses,
  };
}

export const devInadimplentes: Inadimplente[] = [
  {
    criancaId: "c-lorena",
    criancaNome: "Lorena Souza",
    turmaNome: "Girassol",
    responsavelNome: "Marina Souza",
    responsavelContato: "(11) 99000-0000",
    mesesEmAtraso: 2,
    valorTotal: 2980,
  },
  {
    criancaId: "c-theo",
    criancaNome: "Theo Souza",
    turmaNome: "Sol",
    responsavelNome: "Rafael Fontes",
    responsavelContato: "(11) 98888-1122",
    mesesEmAtraso: 1,
    valorTotal: 890,
  },
  {
    criancaId: "c-alice",
    criancaNome: "Alice Prado",
    turmaNome: "Girassol",
    responsavelNome: "Juliana Prado",
    responsavelContato: "(11) 97777-3344",
    mesesEmAtraso: 3,
    valorTotal: 4470,
  },
];

export const devDespesas: Despesa[] = [
  {
    _id: "d1",
    descricao: "Compra de alimentos — semana 3",
    categoria: "Alimentação",
    valor: 2340,
    data: "2026-07-15",
  },
  {
    _id: "d2",
    descricao: "Folha de pagamento — julho",
    categoria: "Pessoal",
    valor: 12800,
    data: "2026-07-05",
  },
  {
    _id: "d3",
    descricao: "Tinta e papel para atividades",
    categoria: "Material pedagógico",
    valor: 480,
    data: "2026-07-11",
  },
  {
    _id: "d4",
    descricao: "Conta de energia",
    categoria: "Contas (água/luz/internet)",
    valor: 920,
    data: "2026-07-08",
  },
];

export const devTurmas: Turma[] = [
  {
    _id: "t-girassol",
    nome: "Girassol",
    descricao: "Berçário II — integral",
    faixaEtaria: { min: 2, max: 3 },
    professorId: "p-alice",
    professor: { _id: "p-alice", nome: "Alice Martins", email: "alice@aquarela.com" },
    totalCriancas: 2,
  },
  {
    _id: "t-sol",
    nome: "Sol",
    descricao: "Pré-escola — meio período",
    faixaEtaria: { min: 4, max: 5 },
    professorId: "p-bruno",
    professor: { _id: "p-bruno", nome: "Bruno Aguiar", email: "bruno@aquarela.com" },
    totalCriancas: 1,
  },
];

export const devPlanosAula: PlanoAula[] = [
  {
    _id: "pa-1",
    turmaId: "t-girassol",
    professorId: "p-alice",
    titulo: "Cores primárias",
    descricao:
      "Exploração sensorial com tintas atóxicas nas cores azul, vermelho e amarelo.",
    data: "2026-07-21",
    objetivos: ["Reconhecer cores", "Coordenação motora"],
    materiais: ["Tinta guache", "Papel kraft"],
  },
  {
    _id: "pa-2",
    turmaId: "t-girassol",
    professorId: "p-alice",
    titulo: "Música e movimento",
    descricao: "Roda de música com instrumentos de percussão simples.",
    data: "2026-07-23",
    objetivos: ["Ritmo e coordenação", "Socialização"],
    materiais: ["Chocalhos", "Tambores pequenos"],
  },
  {
    _id: "pa-3",
    turmaId: "t-sol",
    professorId: "p-bruno",
    titulo: "Contação de histórias",
    descricao: "Leitura dramatizada de livro infantil com fantoches.",
    data: "2026-07-22",
    objetivos: ["Linguagem oral", "Atenção e escuta"],
    materiais: ["Livro ilustrado", "Fantoches"],
  },
];

export const devCriancasCadastro: CriancaCadastro[] = [
  {
    _id: "c-lorena",
    nome: "Lorena Souza",
    dataNascimento: "2023-04-12",
    cpf: "39053344705",
    turmaId: "t-girassol",
    turmaNome: "Girassol",
    responsaveis: [
      {
        nome: "Marina Souza",
        cpf: "11144477735",
        parentesco: "Mãe",
        telefone: "11990000000",
        email: "marina.souza@email.com",
        podeRetirar: true,
      },
    ],
    saude: {
      alergias: ["amendoim"],
      restricoesAlimentares: ["sem lactose"],
      medicacoesContinuas: [
        {
          nome: "Dipirona",
          dose: "10 gotas",
          horario: "09:00",
          observacao: "se febre",
        },
      ],
      condicoesAtipicas: [],
      cuidadosEspeciais: "",
      observacoes: "",
    },
    financeiro: { valorMensalidade: 1490, diaVencimento: 5 },
  },
  {
    _id: "c-theo",
    nome: "Theo Souza",
    dataNascimento: "2021-02-08",
    cpf: "52998224725",
    turmaId: "t-sol",
    turmaNome: "Sol",
    responsaveis: [
      {
        nome: "Marina Souza",
        cpf: "11144477735",
        parentesco: "Mãe",
        telefone: "11990000000",
        email: "marina.souza@email.com",
        podeRetirar: true,
      },
    ],
    saude: {
      alergias: [],
      restricoesAlimentares: [],
      medicacoesContinuas: [],
      condicoesAtipicas: [],
      cuidadosEspeciais: "",
      observacoes: "",
    },
    financeiro: { valorMensalidade: 1290, diaVencimento: 5 },
  },
];

export const devCriancas: Crianca[] = [
  {
    _id: "c-lorena",
    nome: "Lorena Souza",
    cpf: "39053344705",
    iniciais: "LS",
    avatarBg: "#F6D9C0",
    turmaNome: "Girassol",
    idadeLabel: "3 anos",
    sub: "Turma Girassol · 3 anos",
    cuidados: {
      alergias: ["amendoim"],
      medicacoes: ["09h Dipirona (se febre)"],
    },
  },
  {
    _id: "c-theo",
    nome: "Theo Souza",
    iniciais: "TS",
    avatarBg: "#CDE7F5",
    turmaNome: "Sol",
    idadeLabel: "5 anos",
    sub: "Turma Sol · 5 anos",
  },
];

export const devAvisos: Aviso[] = [
  {
    id: "a1",
    titulo: "Reunião de pais",
    corpo: "Dia 22/07 às 18h, no pátio principal. Contamos com você!",
    dataLabel: "16 jul",
  },
  {
    id: "a2",
    titulo: "Traga um agasalho",
    corpo: "As manhãs estão frias esta semana.",
    turmaId: "t-sol",
    dataLabel: "15 jul",
  },
  {
    id: "a3",
    titulo: "Festa Julina 🎉",
    corpo: "Confirme presença até sexta-feira.",
    dataLabel: "14 jul",
  },
];

const agendaLorena: AgendaDia = {
  criancaId: "c-lorena",
  data: "2026-07-16",
  dataLabel: "Terça, 16 jul",
  professor: { nome: "Prof. Alice" },
  entries: [
    { tipo: "alimentacao", title: "Almoço", text: "Comeu tudo" },
    { tipo: "alimentacao", title: "Lanche", text: "Recusou" },
    { tipo: "sono", title: "Soneca", text: "12:30 às 14:00" },
    { tipo: "atividade", title: "Atividades", text: "Pintura, Música" },
    { tipo: "humor", title: "Humor", text: "Alegre", value: "feliz" },
    { tipo: "higiene", title: "Higiene", text: "1 troca de fralda" },
    {
      tipo: "tarefaCasa",
      title: "Tarefa de casa",
      text: "Feito",
      value: "feito",
    },
    {
      tipo: "presenca",
      title: "Presença",
      text: "Atrasado — chegou às 09:15",
      value: "atrasado",
      destaque: true,
    },
    {
      tipo: "medicacao",
      title: "Dipirona",
      text: "10 gotas · 10:00",
      destaque: true,
    },
    {
      tipo: "intercorrencia",
      title: "Febre leve (37,8°)",
      text: "Percebido durante o período no berçário",
      destaque: true,
    },
    {
      tipo: "observacao",
      title: "Observações",
      text: "Dia ótimo! Interagiu bastante com os amigos.",
    },
  ],
  anexos: [
    {
      key: "agendas/dev-atestado.pdf",
      nome: "atestado.pdf",
      contentType: "application/pdf",
      tamanho: 102400,
      url: "#",
    },
  ],
};

const agendaTheo: AgendaDia = {
  criancaId: "c-theo",
  data: "2026-07-16",
  dataLabel: "Terça, 16 jul",
  professor: { nome: "Prof. Bruno" },
  entries: [
    {
      tipo: "presenca",
      title: "Presença",
      text: "Falta",
      value: "falta",
      destaque: true,
    },
    { tipo: "alimentacao", title: "Almoço", text: "Comeu tudo" },
    { tipo: "atividade", title: "Atividades", text: "Circuito motor, Leitura" },
    { tipo: "humor", title: "Humor", text: "Alegre", value: "feliz" },
  ],
};

export const devAgendaByChild: Record<string, AgendaDia> = {
  "c-lorena": agendaLorena,
  "c-theo": agendaTheo,
};

export const devHistoricoByChild: Record<string, HistoricoDia[]> = {
  "c-lorena": [
    {
      data: "2026-07-15",
      dataLabel: "Segunda, 15 jul",
      humorLabel: "Tranquila",
      humorValue: "tranquilo",
      chips: ["Comeu bem", "Soneca 1h30", "Pintura"],
    },
    {
      data: "2026-07-12",
      dataLabel: "Sexta, 12 jul",
      humorLabel: "Alegre",
      humorValue: "feliz",
      chips: ["Comeu tudo", "Parquinho", "Música"],
    },
    {
      data: "2026-07-11",
      dataLabel: "Quinta, 11 jul",
      humorLabel: "Cansada",
      humorValue: "neutro",
      chips: ["Soneca longa", "Recusou lanche"],
      alerta: "Chegou espirrando pela manhã.",
    },
    {
      data: "2026-07-10",
      dataLabel: "Quarta, 10 jul",
      humorLabel: "Alegre",
      humorValue: "feliz",
      chips: ["Comeu bem", "Massinha", "Roda de leitura"],
    },
  ],
  "c-theo": [
    {
      data: "2026-07-15",
      dataLabel: "Segunda, 15 jul",
      humorLabel: "Animado",
      humorValue: "feliz",
      chips: ["Repetiu almoço", "Futebol", "Desenho"],
    },
    {
      data: "2026-07-12",
      dataLabel: "Sexta, 12 jul",
      humorLabel: "Tranquilo",
      humorValue: "tranquilo",
      chips: ["Comeu bem", "Blocos", "História"],
    },
  ],
};

const MESES = [
  ["Janeiro", "Jan"],
  ["Fevereiro", "Fev"],
  ["Março", "Mar"],
  ["Abril", "Abr"],
  ["Maio", "Mai"],
  ["Junho", "Jun"],
  ["Julho", "Jul"],
];

export function devMensalidades(criancaId: string): Mensalidade[] {
  const valor = criancaId === "c-lorena" ? 1490 : 890;
  return MESES.map(([mesLabel, mesShort], i) => {
    const mes = i + 1;
    let status: Mensalidade["status"] = "pago";
    if (mes === 6) status = "atrasado";
    if (mes === 7) status = "aberto";
    return {
      _id: `m-${criancaId}-${mes}`,
      criancaId,
      ano: 2026,
      mes,
      mesLabel,
      mesShort,
      valor,
      status,
      updatedAt: status === "pago" ? `2026-0${mes}-05` : undefined,
    };
  });
}
