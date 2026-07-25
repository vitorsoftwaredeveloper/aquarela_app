import { jsPDF } from "jspdf";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN_X = 40;
const ROW_HEIGHT = 26;
const HEADER_HEIGHT = 30;

/** Exporta uma lista de linhas para `.pdf` como tabela simples, com paginação. */
export function exportToPdfTable(
  title: string,
  headers: string[],
  rows: (string | number)[][],
  filename: string,
): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const usableWidth = PAGE_WIDTH - MARGIN_X * 2;
  const colWidth = usableWidth / headers.length;

  function drawHeader() {
    doc.setFillColor("#4c9be8");
    doc.rect(0, 0, PAGE_WIDTH, 64, "F");
    doc.setTextColor("#ffffff");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(title, MARGIN_X, 40);
  }

  function drawTableHead(y: number): number {
    doc.setFillColor("#eef4fb");
    doc.rect(MARGIN_X, y, usableWidth, HEADER_HEIGHT, "F");
    doc.setTextColor("#1f2933");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    headers.forEach((h, i) => {
      doc.text(h, MARGIN_X + i * colWidth + 8, y + HEADER_HEIGHT / 2 + 3);
    });
    return y + HEADER_HEIGHT;
  }

  drawHeader();
  let y = drawTableHead(88);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  rows.forEach((row, rowIndex) => {
    if (y + ROW_HEIGHT > PAGE_HEIGHT - 40) {
      doc.addPage();
      drawHeader();
      y = drawTableHead(88);
    }
    if (rowIndex % 2 === 1) {
      doc.setFillColor("#f7f9fc");
      doc.rect(MARGIN_X, y, usableWidth, ROW_HEIGHT, "F");
    }
    doc.setTextColor("#1f2933");
    row.forEach((cell, i) => {
      doc.text(String(cell), MARGIN_X + i * colWidth + 8, y + ROW_HEIGHT / 2 + 3);
    });
    doc.setDrawColor("#e2e8ef");
    doc.line(MARGIN_X, y + ROW_HEIGHT, MARGIN_X + usableWidth, y + ROW_HEIGHT);
    y += ROW_HEIGHT;
  });

  if (rows.length === 0) {
    doc.setTextColor("#5b6b78");
    doc.text("Nenhum registro para exportar.", MARGIN_X, y + 20);
  }

  doc.save(filename);
}
