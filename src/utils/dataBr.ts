/** Aplica máscara dd/mm/aaaa progressivamente enquanto o usuário digita. */
export function maskDataBr(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const dd = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);
  if (digits.length <= 2) return dd;
  if (digits.length <= 4) return `${dd}/${mm}`;
  return `${dd}/${mm}/${yyyy}`;
}

/** Converte dd/mm/aaaa para yyyy-mm-dd (ISO), validando data real (bissexto incluído). Retorna "" se inválida/incompleta. */
export function dataBrParaIso(br: string): string {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br ?? "");
  if (!m) return "";
  const [, ddStr, mmStr, yyyyStr] = m;
  const dia = Number(ddStr);
  const mes = Number(mmStr);
  const ano = Number(yyyyStr);
  const d = new Date(ano, mes - 1, dia);
  if (
    d.getFullYear() !== ano ||
    d.getMonth() !== mes - 1 ||
    d.getDate() !== dia
  ) {
    return "";
  }
  return `${yyyyStr}-${mmStr}-${ddStr}`;
}

/** Converte yyyy-mm-dd (ISO, com ou sem horário) para dd/mm/aaaa. Retorna "" se vazio/inválido. */
export function isoParaDataBr(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "");
  if (!m) return "";
  const [, yyyy, mm, dd] = m;
  return `${dd}/${mm}/${yyyy}`;
}
