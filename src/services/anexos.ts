import axios from "axios";
import { api } from "./api";
import { unwrapItem } from "./unwrap";
import type { AnexoUploadUrl, EscopoAnexo } from "@/types/anexo";

export const ANEXO_TIPOS_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export const ANEXO_TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024;

export const AnexosService = {
  async criarUploadUrl(
    escopo: EscopoAnexo,
    nome: string,
    contentType: string,
    tamanho: number,
  ): Promise<AnexoUploadUrl> {
    const { data } = await api.post("/anexos/upload-url", {
      escopo,
      nome,
      contentType,
      tamanho,
    });
    const resultado = unwrapItem<AnexoUploadUrl>(data);
    if (!resultado) {
      throw new Error("Resposta inválida ao pedir a URL de upload.");
    }
    return resultado;
  },

  async subirParaS3(
    uploadUrl: string,
    corpo: Blob,
    contentType: string,
    onProgress?: (percentual: number) => void,
  ): Promise<void> {
    await axios.put(uploadUrl, corpo, {
      headers: { "Content-Type": contentType },
      onUploadProgress: (evento) => {
        if (!onProgress || !evento.total) return;
        onProgress(Math.round((evento.loaded / evento.total) * 100));
      },
    });
  },
};
