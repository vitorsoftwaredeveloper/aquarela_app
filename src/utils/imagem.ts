export const FOTO_LADO_MAX = 800;
export const FOTO_MAX_BYTES = 2 * 1024 * 1024;

export const ANEXO_IMAGEM_LADO_MAX = 1600;
export const ANEXO_IMAGEM_MAX_BYTES = 10 * 1024 * 1024;

const QUALIDADES = [0.8, 0.65, 0.5, 0.35];

export interface FotoUpload {
  contentType: string;
  base64: string;
}

export interface FotoPreparada {
  foto: FotoUpload;
  previewUrl: string;
}

export interface ImagemAnexoPreparada {
  blob: Blob;
  previewUrl: string;
}

export function tamanhoBase64(base64: string): number {
  const limpo = base64.replace(/=+$/, "");
  return Math.floor((limpo.length * 3) / 4);
}

export function dimensionarPara(
  largura: number,
  altura: number,
  ladoMax: number,
): { largura: number; altura: number } {
  const maior = Math.max(largura, altura);
  if (maior <= ladoMax) return { largura, altura };
  const escala = ladoMax / maior;
  return {
    largura: Math.max(1, Math.round(largura * escala)),
    altura: Math.max(1, Math.round(altura * escala)),
  };
}

async function decodificar(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(
      "Não foi possível ler esta imagem. Use um arquivo JPEG, PNG ou WEBP.",
    );
  }
}

async function redimensionarParaCanvas(
  file: File,
  ladoMax: number,
): Promise<HTMLCanvasElement> {
  const bitmap = await decodificar(file);
  const { largura, altura } = dimensionarPara(
    bitmap.width,
    bitmap.height,
    ladoMax,
  );

  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Este navegador não conseguiu processar a imagem.");
  }
  ctx.drawImage(bitmap, 0, 0, largura, altura);
  bitmap.close();

  return canvas;
}

function canvasParaBlob(
  canvas: HTMLCanvasElement,
  qualidade: number,
): Promise<Blob | null> {
  return new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", qualidade),
  );
}

export async function prepararFoto(file: File): Promise<FotoPreparada> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Selecione um arquivo de imagem (JPEG, PNG ou WEBP).");
  }

  const canvas = await redimensionarParaCanvas(file, FOTO_LADO_MAX);

  for (const qualidade of QUALIDADES) {
    const previewUrl = canvas.toDataURL("image/jpeg", qualidade);
    const base64 = previewUrl.split(",")[1] ?? "";
    if (base64 && tamanhoBase64(base64) <= FOTO_MAX_BYTES) {
      return { foto: { contentType: "image/jpeg", base64 }, previewUrl };
    }
  }

  throw new Error("Imagem muito pesada. Escolha outra foto.");
}

export async function prepararImagemAnexo(
  file: File,
): Promise<ImagemAnexoPreparada> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Selecione um arquivo de imagem (JPEG, PNG ou WEBP).");
  }

  const canvas = await redimensionarParaCanvas(file, ANEXO_IMAGEM_LADO_MAX);

  for (const qualidade of QUALIDADES) {
    const blob = await canvasParaBlob(canvas, qualidade);
    if (blob && blob.size <= ANEXO_IMAGEM_MAX_BYTES) {
      return { blob, previewUrl: canvas.toDataURL("image/jpeg", qualidade) };
    }
  }

  throw new Error("Imagem muito pesada. Escolha outra imagem.");
}
