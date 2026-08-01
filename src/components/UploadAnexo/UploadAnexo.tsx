"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { FileText, Loader2, Paperclip, RotateCcw, X } from "lucide-react";
import {
  ANEXO_TAMANHO_MAXIMO_BYTES,
  ANEXO_TIPOS_PERMITIDOS,
  AnexosService,
} from "@/services/anexos";
import { getApiErrorMessage } from "@/services/apiError";
import { prepararImagemAnexo } from "@/utils/imagem";
import type { AnexoReferencia, EscopoAnexo } from "@/types/anexo";
import styles from "./UploadAnexo.module.css";

interface ItemAnexo {
  id: string;
  nome: string;
  contentType: string;
  tamanho: number;
  previewUrl?: string;
  progresso: number;
  status: "enviando" | "erro" | "concluido";
  erro?: string;
  key?: string;
  blob: Blob;
}

interface UploadAnexoProps {
  escopo: EscopoAnexo;
  anexos: AnexoReferencia[];
  onChange: (anexos: AnexoReferencia[]) => void;
  max?: number;
  disabled?: boolean;
}

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadAnexo({
  escopo,
  anexos,
  onChange,
  max = 5,
  disabled,
}: UploadAnexoProps) {
  const [itens, setItens] = useState<ItemAnexo[]>(() =>
    anexos.map((anexo) => ({
      id: crypto.randomUUID(),
      nome: anexo.nome,
      contentType: anexo.contentType,
      tamanho: anexo.tamanho,
      key: anexo.key,
      status: "concluido",
      progresso: 100,
      blob: new Blob(),
    })),
  );
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const itensRef = useRef(itens);
  itensRef.current = itens;

  const ocupado = !!disabled;
  const espaco = max - itens.length;

  function emitir(lista: ItemAnexo[]) {
    onChange(
      lista
        .filter((item) => item.status === "concluido" && item.key)
        .map((item) => ({
          key: item.key as string,
          nome: item.nome,
          contentType: item.contentType,
          tamanho: item.tamanho,
        })),
    );
  }

  function atualizarItem(id: string, patch: Partial<ItemAnexo>) {
    setItens((atual) =>
      atual.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  async function enviar(item: ItemAnexo) {
    atualizarItem(item.id, {
      status: "enviando",
      erro: undefined,
      progresso: 0,
    });

    try {
      const uploadUrl = await AnexosService.criarUploadUrl(
        escopo,
        item.nome,
        item.contentType,
        item.tamanho,
      );

      await AnexosService.subirParaS3(
        uploadUrl.uploadUrl,
        item.blob,
        item.contentType,
        (percentual) => atualizarItem(item.id, { progresso: percentual }),
      );

      const proximo = itensRef.current.map((i) =>
        i.id === item.id
          ? {
              ...i,
              status: "concluido" as const,
              key: uploadUrl.key,
              progresso: 100,
            }
          : i,
      );
      setItens(proximo);
      emitir(proximo);
    } catch (err) {
      atualizarItem(item.id, {
        status: "erro",
        erro: getApiErrorMessage(err, "Falha no envio. Tente novamente."),
      });
    }
  }

  function tentarNovamente(id: string) {
    const item = itens.find((i) => i.id === id);
    if (item) enviar(item);
  }

  function remover(id: string) {
    const proximo = itensRef.current.filter((item) => item.id !== id);
    setItens(proximo);
    emitir(proximo);
  }

  async function selecionarArquivos(event: ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (arquivos.length === 0) return;

    setErroGeral(null);

    if (espaco <= 0) {
      setErroGeral(`Máximo de ${max} anexos.`);
      return;
    }

    const selecionados = arquivos.slice(0, espaco);
    if (arquivos.length > selecionados.length) {
      setErroGeral(`Só cabem mais ${espaco} anexo(s) (máx. ${max}).`);
    }

    for (const arquivo of selecionados) {
      if (!ANEXO_TIPOS_PERMITIDOS.includes(arquivo.type)) {
        setErroGeral(
          `Tipo não suportado: ${arquivo.name}. Use JPEG, PNG, WEBP ou PDF.`,
        );
        continue;
      }

      let blob: Blob = arquivo;
      let previewUrl: string | undefined;
      let contentType = arquivo.type;

      if (arquivo.type.startsWith("image/")) {
        try {
          const preparada = await prepararImagemAnexo(arquivo);
          blob = preparada.blob;
          previewUrl = preparada.previewUrl;
          contentType = "image/jpeg";
        } catch (err) {
          setErroGeral(
            err instanceof Error
              ? err.message
              : "Não foi possível processar a imagem.",
          );
          continue;
        }
      }

      if (blob.size > ANEXO_TAMANHO_MAXIMO_BYTES) {
        setErroGeral(`Arquivo muito grande: ${arquivo.name} (máx. 10MB).`);
        continue;
      }

      const item: ItemAnexo = {
        id: crypto.randomUUID(),
        nome: arquivo.name,
        contentType,
        tamanho: blob.size,
        previewUrl,
        progresso: 0,
        status: "enviando",
        blob,
      };

      setItens((atual) => [...atual, item]);
      enviar(item);
    }
  }

  return (
    <div className={styles.campo}>
      {itens.length > 0 && (
        <ul className={styles.lista}>
          {itens.map((item) => (
            <li key={item.id} className={styles.item}>
              <span className={styles.icone}>
                {item.previewUrl ? (
                  <img
                    src={item.previewUrl}
                    alt=""
                    className={styles.miniatura}
                  />
                ) : (
                  <FileText size={18} />
                )}
              </span>

              <div className={styles.detalhe}>
                <span className={styles.nome} title={item.nome}>
                  {item.nome}
                </span>
                <span className={styles.meta}>
                  {formatarTamanho(item.tamanho)}
                  {item.status === "erro" && (
                    <span className={styles.erroMeta}> · {item.erro}</span>
                  )}
                </span>
                {item.status === "enviando" && (
                  <div className={styles.barra}>
                    <div
                      className={styles.barraPreenchida}
                      style={{ width: `${item.progresso}%` }}
                    />
                  </div>
                )}
              </div>

              <div className={styles.acoesItem}>
                {item.status === "enviando" && (
                  <Loader2 size={16} className={styles.girando} />
                )}
                {item.status === "erro" && (
                  <button
                    type="button"
                    className={styles.botaoIcone}
                    onClick={() => tentarNovamente(item.id)}
                    aria-label={`Tentar enviar ${item.nome} de novo`}
                  >
                    <RotateCcw size={16} />
                  </button>
                )}
                <button
                  type="button"
                  className={styles.botaoIcone}
                  onClick={() => remover(item.id)}
                  disabled={ocupado}
                  aria-label={`Remover ${item.nome}`}
                >
                  <X size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <label
        className={`${styles.botaoAnexar} ${espaco <= 0 || ocupado ? styles.botaoDesabilitado : ""}`}
      >
        <Paperclip size={14} />
        Anexar arquivo
        <input
          type="file"
          accept={ANEXO_TIPOS_PERMITIDOS.join(",")}
          multiple
          className={styles.input}
          onChange={selecionarArquivos}
          disabled={espaco <= 0 || ocupado}
          tabIndex={-1}
        />
      </label>

      <span className={styles.hint}>
        Imagem ou PDF, até 10MB, máx. {max} anexos.
      </span>

      {erroGeral && (
        <span className={styles.erro} role="alert">
          {erroGeral}
        </span>
      )}
    </div>
  );
}
