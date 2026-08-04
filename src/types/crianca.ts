/** Criança acompanhada (visão do responsável/professor). */
export interface Crianca {
  _id: string;
  nome: string;
  cpf?: string;
  /** Iniciais para o avatar (fallback quando não há foto). */
  iniciais: string;
  avatarBg: string;
  fotoUrl?: string;
  turmaId?: string;
  turmaNome?: string;
  idadeLabel?: string;
  /** "Turma Girassol · 3 anos" — linha de apoio. */
  sub?: string;
  /** Cuidados contínuos exibidos em destaque na agenda. */
  cuidados?: {
    alergias?: string[];
    medicacoes?: string[];
  };
  /** Separado do consentimento LGPD — controla se a criança pode aparecer no mural de fotos. */
  consentimentoImagem?: { aceito: boolean; aceitoEm: string };
}

/** Iniciais para o avatar: 1ª letra do nome + 1ª do sobrenome, ou 2 primeiras se não houver sobrenome. */
export function iniciaisNome(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

const AVATAR_PALETTE = [
  "#F6D9C0",
  "#CDE7F5",
  "#EAD9F6",
  "#D9F0DA",
  "#F6E0EA",
  "#FBE7B8",
];

/** Sorteia uma cor de fundo por criança (embaralha a paleta a cada chamada — ex.: a cada login). */
export function sortearCoresAvatar(ids: string[]): Record<string, string> {
  const cores = [...AVATAR_PALETTE];
  for (let i = cores.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cores[i], cores[j]] = [cores[j], cores[i]];
  }
  const mapa: Record<string, string> = {};
  ids.forEach((id, i) => {
    mapa[id] = cores[i % cores.length];
  });
  return mapa;
}

/** Há alergias/medicações contínuas a destacar? */
export function temCuidados(c: Crianca): boolean {
  return !!(
    (c.cuidados?.alergias && c.cuidados.alergias.length) ||
    (c.cuidados?.medicacoes && c.cuidados.medicacoes.length)
  );
}

/** Linha única de cuidados ("Alergia: amendoim · 09h Dipirona"). */
export function linhaCuidados(c: Crianca): string {
  const partes: string[] = [];
  if (c.cuidados?.alergias?.length) {
    partes.push(`Alergia: ${c.cuidados.alergias.join(", ")}`);
  }
  if (c.cuidados?.medicacoes?.length) {
    partes.push(c.cuidados.medicacoes.join(" · "));
  }
  return partes.join(" · ");
}
