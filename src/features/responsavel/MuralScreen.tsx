"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Images, X } from "lucide-react";
import { Skeleton } from "@/components";
import { useFetch } from "@/hooks/useFetch";
import { EventosService } from "@/services/eventos";
import type { Evento } from "@/types/evento";
import shell from "./responsavel.module.css";
import styles from "./mural.module.css";

function formatData(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

interface LightboxState {
  evento: Evento;
  index: number;
}

function Lightbox({
  estado,
  onClose,
  onNavegar,
}: {
  estado: LightboxState;
  onClose: () => void;
  onNavegar: (proximoIndex: number) => void;
}) {
  const { evento, index } = estado;
  const foto = evento.fotos[index];

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && index > 0) onNavegar(index - 1);
      if (e.key === "ArrowRight" && index < evento.fotos.length - 1)
        onNavegar(index + 1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [index, evento.fotos.length, onClose, onNavegar]);

  if (!foto) return null;

  return (
    <div
      className={styles.lightbox}
      role="dialog"
      aria-modal="true"
      aria-label={`Foto de ${evento.titulo}`}
    >
      <div className={styles.lightboxTopBar}>
        <button
          className={styles.lightboxIconBtn}
          onClick={onClose}
          aria-label="Fechar"
        >
          <X size={20} />
        </button>
        <a
          className={styles.lightboxIconBtn}
          href={foto.url}
          download={foto.nome}
          target="_blank"
          rel="noreferrer"
          aria-label="Baixar foto original"
        >
          <Download size={18} />
        </a>
      </div>

      <button
        className={`${styles.lightboxNavBtn} ${styles.lightboxPrev}`}
        onClick={() => onNavegar(index - 1)}
        disabled={index === 0}
        aria-label="Foto anterior"
      >
        <ChevronLeft size={22} />
      </button>

      <div className={styles.lightboxImgWrap}>
        {foto.url && (
          <img src={foto.url} alt={foto.legenda ?? ""} className={styles.lightboxImg} />
        )}
      </div>

      <button
        className={`${styles.lightboxNavBtn} ${styles.lightboxNext}`}
        onClick={() => onNavegar(index + 1)}
        disabled={index === evento.fotos.length - 1}
        aria-label="Próxima foto"
      >
        <ChevronRight size={22} />
      </button>

      <div className={styles.lightboxFooter}>
        {foto.legenda && <div className={styles.lightboxCaption}>{foto.legenda}</div>}
        <div>
          {evento.titulo} · {index + 1}/{evento.fotos.length}
        </div>
      </div>
    </div>
  );
}

export function MuralScreen() {
  const eventos = useFetch(() => EventosService.list({ apenasPublicados: true }));
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  const grupos = useMemo(() => {
    return [...(eventos.data ?? [])]
      .filter((e) => e.fotos.length > 0)
      .sort((a, b) => b.data.localeCompare(a.data));
  }, [eventos.data]);

  return (
    <div>
      <div className={`${shell.gradHeader} ${shell.finHeaderPad}`}>
        <div className={shell.finTitle}>Mural de fotos</div>
        <div className={shell.finSub}>Fotos publicadas pela escola</div>
      </div>

      {eventos.loading ? (
        <div className={styles.lista} role="status" aria-label="Carregando…">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className={styles.grupo}>
              <Skeleton width="45%" height={15} />
              <div className={styles.grid}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <Skeleton key={j} width="100%" height={0} radius={12} style={{ aspectRatio: "1", height: "auto" }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : eventos.error ? (
        <div className={shell.state}>
          <span className={shell.emptyBadge}>Erro</span>
          <p>{eventos.error}</p>
        </div>
      ) : grupos.length === 0 ? (
        <div className={shell.state}>
          <Images size={26} />
          <p>Nenhuma foto publicada ainda.</p>
        </div>
      ) : (
        <div className={styles.lista}>
          {grupos.map((evento) => (
            <div key={evento._id} className={styles.grupo}>
              <div className={styles.grupoHead}>
                <span className={styles.grupoTitulo}>{evento.titulo}</span>
                <span className={styles.grupoData}>{formatData(evento.data)}</span>
              </div>
              {evento.descricao && (
                <p className={styles.grupoDesc}>{evento.descricao}</p>
              )}
              <div className={styles.grid}>
                {evento.fotos.map((foto, i) => (
                  <button
                    key={foto.key}
                    className={styles.thumb}
                    onClick={() => setLightbox({ evento, index: i })}
                    aria-label={`Ver foto ${i + 1} de ${evento.titulo}`}
                  >
                    {foto.url && (
                      <img src={foto.url} alt="" className={styles.thumbImg} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <Lightbox
          estado={lightbox}
          onClose={() => setLightbox(null)}
          onNavegar={(index) => setLightbox((atual) => (atual ? { ...atual, index } : atual))}
        />
      )}
    </div>
  );
}
