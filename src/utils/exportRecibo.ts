import { jsPDF } from "jspdf";
import logoArt from "@/components/Logo/aquarela-logo.png";

interface ReciboPdfData {
  valor: string;
  linhas: [string, string][];
}

const PAGE_W = 595;
const MARGIN_X = 48;

/** Baixa e reamostra o logo para o tamanho de impressão — evita embutir o PNG original (940x611) e inflar o PDF. */
async function loadLogoDataUrl(targetHeightPx: number): Promise<string> {
  const res = await fetch(logoArt.src);
  const blob = await res.blob();
  const bitmap = await createImageBitmap(blob);
  const scale = targetHeightPx / bitmap.height;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = targetHeightPx;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D indisponível");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

function drawCheckBadge(
  doc: jsPDF,
  centerX: number,
  y: number,
  label: string,
): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  const textW = doc.getTextWidth(label);
  const iconD = 12;
  const gap = 6;
  const padX = 14;
  const contentW = iconD + gap + textW;
  const badgeW = contentW + padX * 2;
  const badgeH = 22;

  doc.setFillColor("#e7f7f1");
  doc.roundedRect(
    centerX - badgeW / 2,
    y,
    badgeW,
    badgeH,
    badgeH / 2,
    badgeH / 2,
    "F",
  );

  const iconCx = centerX - contentW / 2 + iconD / 2;
  const iconCy = y + badgeH / 2;
  doc.setFillColor("#2e9e7b");
  doc.circle(iconCx, iconCy, iconD / 2, "F");
  doc.setDrawColor("#ffffff");
  doc.setLineWidth(1.2);
  doc.lines(
    [
      [iconD * 0.18, iconD * 0.18],
      [iconD * 0.32, -iconD * 0.36],
    ],
    iconCx - iconD * 0.28,
    iconCy - iconD * 0.02,
    [1, 1],
    "S",
    false,
  );

  doc.setTextColor("#2e9e7b");
  doc.text(label, centerX - contentW / 2 + iconD + gap, y + badgeH / 2 + 4);

  return badgeH;
}

/** Gera e baixa o comprovante de pagamento em PDF, no mesmo layout do preview (recibo do responsável). */
export async function baixarReciboPdf(
  data: ReciboPdfData,
  filename: string,
): Promise<void> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const centerX = PAGE_W / 2;

  const logoH = 68;
  const logoW = (logoArt.width / logoArt.height) * logoH;
  const logoDataUrl = await loadLogoDataUrl(Math.round(logoH * 4));

  let y = 56;
  doc.addImage(logoDataUrl, "PNG", centerX - logoW / 2, y, logoW, logoH);

  y += logoH + 22;
  doc.setTextColor("#1f2933");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("Comprovante de pagamento", centerX, y, { align: "center" });

  y += 18;
  doc.setTextColor("#6b7280");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Aquarela Kids · Berçário", centerX, y, { align: "center" });

  y += 40;
  doc.setTextColor("#6b7280");
  doc.setFontSize(12);
  doc.text("Valor pago", centerX, y, { align: "center" });

  y += 32;
  doc.setTextColor("#1f2933");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text(data.valor, centerX, y, { align: "center" });

  y += 24;
  const pagoBadgeH = drawCheckBadge(doc, centerX, y, "Pago");

  y += pagoBadgeH + 26;
  doc.setDrawColor("#e2e8ef");
  doc.line(MARGIN_X, y, PAGE_W - MARGIN_X, y);

  doc.setFontSize(11);
  for (const [label, valor] of data.linhas) {
    y += 30;
    doc.setFont("helvetica", "normal");
    doc.setTextColor("#6b7280");
    doc.text(label, MARGIN_X, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#1f2933");
    doc.text(valor, PAGE_W - MARGIN_X, y, { align: "right" });
    doc.setDrawColor("#f0f3f6");
    doc.line(MARGIN_X, y + 12, PAGE_W - MARGIN_X, y + 12);
  }

  doc.save(filename);
}
