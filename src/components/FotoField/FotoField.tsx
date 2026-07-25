"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Camera, ImagePlus, Loader2, Trash2, Undo2 } from "lucide-react";
import { Avatar } from "../Avatar/Avatar";
import { prepararFoto, type FotoUpload } from "@/utils/imagem";
import styles from "./FotoField.module.css";

interface FotoFieldProps {
  nome: string;
  fotoUrl?: string | null;
  previewUrl?: string | null;
  bg?: string;
  label?: string;
  hint?: string;
  disabled?: boolean;
  removendo?: boolean;
  onSelect: (foto: FotoUpload | null, previewUrl: string | null) => void;
  onRemove?: () => void;
}

/**
 * Escolha da foto: o preview é controlado pelo pai (`previewUrl`) para que um
 * salvamento bem-sucedido volte a mostrar a imagem já gravada, não o rascunho.
 */
export function FotoField({
  nome,
  fotoUrl,
  previewUrl,
  bg,
  label = "Foto da criança",
  hint = "A imagem é reduzida no aparelho antes do envio.",
  disabled,
  removendo,
  onSelect,
  onRemove,
}: FotoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);

  const preview = previewUrl ?? null;
  const mostrada = preview ?? fotoUrl ?? null;
  const ocupado = processando || !!removendo || !!disabled;

  async function escolher(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setErro(null);
    setProcessando(true);
    try {
      const preparada = await prepararFoto(file);
      onSelect(preparada.foto, preparada.previewUrl);
    } catch (err) {
      setErro(
        err instanceof Error
          ? err.message
          : "Não foi possível usar esta imagem.",
      );
    } finally {
      setProcessando(false);
    }
  }

  function descartar() {
    setErro(null);
    onSelect(null, null);
  }

  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      <div className={styles.row}>
        <button
          type="button"
          className={`${styles.alvo} ${mostrada ? "" : styles.alvoVazio}`}
          onClick={() => inputRef.current?.click()}
          disabled={ocupado}
          aria-label={mostrada ? "Trocar foto" : "Escolher foto"}
        >
          {mostrada ? (
            <Avatar
              nome={nome}
              fotoUrl={mostrada}
              bg={bg}
              size={84}
              radius={20}
            />
          ) : (
            <span className={styles.placeholder}>
              <ImagePlus size={22} />
            </span>
          )}
          <span className={styles.badge} aria-hidden>
            {processando ? (
              <Loader2 size={14} className={styles.girando} />
            ) : (
              <Camera size={14} />
            )}
          </span>
        </button>

        <div className={styles.acoes}>
          <button
            type="button"
            className={styles.botao}
            onClick={() => inputRef.current?.click()}
            disabled={ocupado}
          >
            {processando
              ? "Preparando…"
              : mostrada
                ? "Trocar foto"
                : "Escolher foto"}
          </button>

          {preview ? (
            <button
              type="button"
              className={styles.botaoSutil}
              onClick={descartar}
              disabled={ocupado}
            >
              <Undo2 size={14} /> Descartar
            </button>
          ) : fotoUrl && onRemove ? (
            <button
              type="button"
              className={styles.botaoPerigo}
              onClick={onRemove}
              disabled={ocupado}
            >
              <Trash2 size={14} />
              {removendo ? "Removendo…" : "Remover foto"}
            </button>
          ) : null}

          <span className={styles.hint}>{hint}</span>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className={styles.input}
        onChange={escolher}
        tabIndex={-1}
      />

      {erro && (
        <span className={styles.erro} role="alert">
          {erro}
        </span>
      )}
    </div>
  );
}
