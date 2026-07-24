import * as XLSX from "xlsx";

/**
 * Exporta linhas para `.xlsx` (FIN-14). As chaves do objeto viram o cabeçalho,
 * então passe os rótulos já em português.
 */
export function exportToXlsx(
  rows: Record<string, string | number>[],
  filename: string,
  sheetName = "Dados",
): void {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}

/** Sufixo de data para o nome do arquivo: 2026-07-19. */
export function hojeSufixo(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
