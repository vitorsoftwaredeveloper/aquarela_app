import { jsPDF } from "jspdf";

interface ReciboPdfData {
  valor: string;
  linhas: [string, string][];
}

/** Gera e baixa o comprovante de pagamento em PDF (recibo do responsável). */
export function baixarReciboPdf(data: ReciboPdfData, filename: string): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 48;
  let y = 64;

  doc.setFillColor("#7c5ae6");
  doc.rect(0, 0, 595, 90, "F");
  doc.setTextColor("#ffffff");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Comprovante de pagamento", marginX, 44);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Aquarela Kids · Berçário", marginX, 64);

  y = 132;
  doc.setTextColor("#5b6b78");
  doc.setFontSize(11);
  doc.text("Valor pago", marginX, y);
  y += 30;
  doc.setTextColor("#1f2933");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text(data.valor, marginX, y);

  y += 40;
  doc.setDrawColor("#e2e8ef");
  doc.line(marginX, y, 595 - marginX, y);

  doc.setFontSize(11);
  for (const [label, valor] of data.linhas) {
    y += 34;
    doc.setFont("helvetica", "normal");
    doc.setTextColor("#5b6b78");
    doc.text(label, marginX, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#1f2933");
    doc.text(valor, 595 - marginX, y, { align: "right" });
    doc.setDrawColor("#f0f3f6");
    doc.line(marginX, y + 12, 595 - marginX, y + 12);
  }

  doc.save(filename);
}
