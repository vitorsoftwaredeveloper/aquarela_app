/** Criança acompanhada (visão do responsável/professor). */
export interface Crianca {
  _id: string;
  nome: string;
  /** Iniciais para o avatar (fallback quando não há foto). */
  iniciais: string;
  avatarBg: string;
  turmaNome?: string;
  idadeLabel?: string;
  /** "Turma Girassol · 3 anos" — linha de apoio. */
  sub?: string;
  /** Cuidados contínuos exibidos em destaque na agenda. */
  cuidados?: {
    alergias?: string[];
    medicacoes?: string[];
  };
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
