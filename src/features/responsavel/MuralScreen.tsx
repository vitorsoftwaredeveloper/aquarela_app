"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Images,
} from "lucide-react";
import { BackButton, Skeleton } from "@/components";
import {
  useHideTopbar,
  usePageTitle,
  useWideContent,
} from "@/contexts/PageTitleContext";
import { useResponsavel } from "@/contexts/ResponsavelContext";
import { useFetch } from "@/hooks/useFetch";
import { EventosService } from "@/services/eventos";
import type { Evento } from "@/types/evento";
import shell from "./responsavel.module.css";
import styles from "./mural.module.css";

function formatData(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
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

  function fecharSeForaDaFoto(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className={styles.lightbox}
      role="dialog"
      aria-modal="true"
      aria-label={`Foto de ${evento.titulo}`}
      onClick={fecharSeForaDaFoto}
    >
      <div className={styles.lightboxTopBar}>
        <BackButton onClick={onClose} label="Fechar" />
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

      <div className={styles.lightboxImgWrap} onClick={fecharSeForaDaFoto}>
        {foto.url && (
          <img
            src={foto.url}
            alt={foto.legenda ?? ""}
            className={styles.lightboxImg}
          />
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
        {foto.legenda && (
          <div className={styles.lightboxCaption}>{foto.legenda}</div>
        )}
        <div>
          {evento.titulo} · {index + 1}/{evento.fotos.length}
        </div>
      </div>
    </div>
  );
}

function EventCard({
  evento,
  onAbrir,
}: {
  evento: Evento;
  onAbrir: () => void;
}) {
  const capa = evento.fotos[0];
  return (
    <button type="button" className={styles.eventCard} onClick={onAbrir}>
      {capa?.url && (
        <img src={capa.url} alt="" className={styles.eventCardImg} />
      )}
      <span className={styles.eventCardOverlay} aria-hidden />
      <span className={styles.eventCardBody}>
        <span className={styles.eventCardTitle}>{evento.titulo}</span>
        <span className={styles.eventCardMeta}>
          <span className={styles.eventCardMetaItem}>
            <Images size={14} /> {evento.fotos.length} fotos
          </span>
          <span className={styles.eventCardMetaItem}>
            <Calendar size={14} /> {formatData(evento.data)}
          </span>
        </span>
      </span>
    </button>
  );
}

function AlbumView({
  evento,
  onVoltar,
  onAbrirFoto,
}: {
  evento: Evento;
  onVoltar: () => void;
  onAbrirFoto: (index: number) => void;
}) {
  useHideTopbar();
  useWideContent();

  return (
    <div>
      <div className={shell.pushHeader}>
        <BackButton onClick={onVoltar} />
        <div style={{ flex: 1 }}>
          <div className={shell.pushTitle}>Álbum</div>
        </div>
      </div>
      <div className={styles.albumBody}>
        <div className={styles.albumHead}>
          <span className={styles.grupoTitulo}>{evento.titulo}</span>
          <span className={styles.albumMeta}>
            <span className={styles.eventCardMetaItem}>
              <Images size={13} /> {evento.fotos.length} fotos
            </span>
            <span className={styles.eventCardMetaItem}>
              <Calendar size={13} /> {formatData(evento.data)}
            </span>
          </span>
        </div>
        {evento.descricao && (
          <p className={styles.albumDesc}>{evento.descricao}</p>
        )}
        <div className={styles.grid}>
          {evento.fotos.map((foto, i) => (
            <button
              key={foto.key}
              className={styles.thumb}
              onClick={() => onAbrirFoto(i)}
              aria-label={`Ver foto ${i + 1} de ${evento.titulo}`}
            >
              {foto.url && (
                <img src={foto.url} alt="" className={styles.thumbImg} />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MuralScreen() {
  const { active } = useResponsavel();
  const turmaAtiva = active?.turmaId;
  const eventos = useFetch(
    () => EventosService.list({ apenasPublicados: true }),
    [active?._id],
  );
  const [albumId, setAlbumId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  // O backend manda os eventos de todas as turmas dos filhos; aqui fica só o
  // filho ativo (evento sem `turmaId` é da escola inteira e vale pra todos).
  // Sem turma conhecida não dá pra filtrar — mostra tudo em vez de esvaziar.
  const grupos = useMemo(() => {
    return [...(eventos.data ?? [])]
      .filter((e) => e.fotos.length > 0)
      .filter((e) => !turmaAtiva || !e.turmaId || e.turmaId === turmaAtiva)
      .sort((a, b) => b.data.localeCompare(a.data));
  }, [eventos.data, turmaAtiva]);

  const album = useMemo(
    () => grupos.find((e) => e._id === albumId) ?? null,
    [grupos, albumId],
  );

  usePageTitle(
    "Mural de fotos",
    active
      ? `Fotos da turma de ${active.nome}`
      : "Fotos publicadas pela escola",
  );

  if (album) {
    return (
      <>
        <AlbumView
          evento={album}
          onVoltar={() => setAlbumId(null)}
          onAbrirFoto={(index) => setLightbox({ evento: album, index })}
        />
        {lightbox && (
          <Lightbox
            estado={lightbox}
            onClose={() => setLightbox(null)}
            onNavegar={(index) =>
              setLightbox((atual) => (atual ? { ...atual, index } : atual))
            }
          />
        )}
      </>
    );
  }

  return (
    <div>
      {eventos.loading ? (
        <div className={styles.lista} role="status" aria-label="Carregando…">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={190} radius={20} />
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
          <p>
            {active
              ? `Nenhuma foto publicada para a turma de ${active.nome} ainda.`
              : "Nenhuma foto publicada ainda."}
          </p>
        </div>
      ) : (
        <div className={styles.lista}>
          {grupos.map((evento) => (
            <EventCard
              key={evento._id}
              evento={evento}
              onAbrir={() => setAlbumId(evento._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
