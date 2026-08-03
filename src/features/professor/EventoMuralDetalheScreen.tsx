"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ImagePlus,
  Send,
  Trash2,
} from "lucide-react";
import { Skeleton, UploadAnexo } from "@/components";
import { useFetch } from "@/hooks/useFetch";
import { EventosService } from "@/services/eventos";
import { getApiErrorMessage } from "@/services/apiError";
import type { AnexoReferencia } from "@/types/anexo";
import type { FotoEvento } from "@/types/evento";
import styles from "./professor.module.css";

function formatData(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function EventoMuralDetalheScreen({
  turmaId,
  eventoId,
}: {
  turmaId: string;
  eventoId: string;
}) {
  const router = useRouter();
  const evento = useFetch(
    () => EventosService.getById(eventoId, turmaId),
    [eventoId, turmaId],
  );

  const [fotos, setFotos] = useState<FotoEvento[]>([]);
  const [ordemErro, setOrdemErro] = useState<string | null>(null);

  const [novasFotos, setNovasFotos] = useState<AnexoReferencia[]>([]);
  const [uploaderKey, setUploaderKey] = useState(0);
  const [commitBusy, setCommitBusy] = useState(false);
  const [commitErro, setCommitErro] = useState<string | null>(null);

  const [publicando, setPublicando] = useState(false);
  const [publicarErro, setPublicarErro] = useState<string | null>(null);
  const [notificouAgora, setNotificouAgora] = useState(false);

  useEffect(() => {
    if (!evento.data) return;
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setFotos(evento.data.fotos);
  }, [evento.data]);

  function voltar() {
    router.push(`/professor/turmas/${turmaId}/mural`);
  }

  async function persistirOrdem(proxima: FotoEvento[]) {
    setFotos(proxima);
    setOrdemErro(null);
    try {
      await EventosService.atualizarFotos(
        eventoId,
        proxima.map((f) => ({
          key: f.key,
          legenda: f.legenda,
          ordem: f.ordem,
        })),
      );
    } catch (err) {
      setOrdemErro(getApiErrorMessage(err));
      evento.reload();
    }
  }

  function mover(index: number, direcao: -1 | 1) {
    const alvo = index + direcao;
    if (alvo < 0 || alvo >= fotos.length) return;
    const proxima = [...fotos];
    [proxima[index], proxima[alvo]] = [proxima[alvo], proxima[index]];
    persistirOrdem(proxima.map((f, i) => ({ ...f, ordem: i })));
  }

  function editarLegendaLocal(key: string, legenda: string) {
    setFotos((atual) =>
      atual.map((f) => (f.key === key ? { ...f, legenda } : f)),
    );
  }

  function salvarLegenda() {
    persistirOrdem(fotos);
  }

  async function excluirFoto(key: string) {
    const anterior = fotos;
    setFotos((atual) => atual.filter((f) => f.key !== key));
    try {
      await EventosService.removerFoto(eventoId, key);
    } catch (err) {
      setFotos(anterior);
      setOrdemErro(getApiErrorMessage(err));
    }
  }

  async function commitarFotos() {
    if (novasFotos.length === 0) return;
    setCommitBusy(true);
    setCommitErro(null);
    try {
      await EventosService.adicionarFotos(eventoId, novasFotos);
      setNovasFotos([]);
      setUploaderKey((k) => k + 1);
      evento.reload();
    } catch (err) {
      setCommitErro(getApiErrorMessage(err));
    } finally {
      setCommitBusy(false);
    }
  }

  async function publicar() {
    setPublicando(true);
    setPublicarErro(null);
    try {
      const resultado = await EventosService.publicar(eventoId);
      setNotificouAgora(resultado.notificado);
      evento.reload();
    } catch (err) {
      setPublicarErro(getApiErrorMessage(err));
    } finally {
      setPublicando(false);
    }
  }

  if (evento.loading) {
    return (
      <div role="status" aria-label="Carregando…">
        <div className={styles.pushHeader}>
          <Skeleton width={38} height={38} radius={12} />
          <Skeleton width={150} height={16} />
        </div>
        <div className={styles.form}>
          <Skeleton width="100%" height={120} radius="var(--radius-md)" />
        </div>
      </div>
    );
  }

  if (evento.error || !evento.data) {
    return (
      <div>
        <div className={styles.pushHeader}>
          <button
            className={styles.backBtn}
            onClick={voltar}
            aria-label="Voltar"
          >
            <ChevronLeft size={20} />
          </button>
          <div className={styles.pushTitle}>Evento</div>
        </div>
        <div className={styles.state}>
          <span className={styles.emptyBadge}>Erro</span>
          <p>{evento.error ?? "Evento não encontrado."}</p>
        </div>
      </div>
    );
  }

  const e = evento.data;
  const espacoDisponivel = Math.max(0, 50 - fotos.length);

  return (
    <div className={styles.tela}>
      <div className={styles.pushHeader}>
        <button className={styles.backBtn} onClick={voltar} aria-label="Voltar">
          <ChevronLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div className={styles.pushTitle}>{e.titulo}</div>
          <div className={styles.pushSub}>
            {formatData(e.data)} · {fotos.length} foto
            {fotos.length === 1 ? "" : "s"}
          </div>
        </div>
        <span
          className={e.publicado ? styles.badgePublished : styles.badgeDraft}
        >
          {e.publicado ? "Publicado" : "Rascunho"}
        </span>
      </div>

      <div className={styles.form}>
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <ImagePlus size={16} />
            Adicionar fotos
          </div>
          <UploadAnexo
            key={uploaderKey}
            escopo="mural"
            anexos={novasFotos}
            onChange={setNovasFotos}
            max={espacoDisponivel}
          />
          {commitErro && (
            <div className={styles.saveError} role="alert">
              {commitErro}
            </div>
          )}
          <button
            type="button"
            className={styles.saveBtn}
            style={{ marginTop: 10 }}
            onClick={commitarFotos}
            disabled={novasFotos.length === 0 || commitBusy}
          >
            {commitBusy
              ? "Adicionando…"
              : `Adicionar${novasFotos.length ? ` (${novasFotos.length})` : ""} à galeria`}
          </button>
        </div>

        {ordemErro && (
          <div className={styles.saveError} role="alert">
            {ordemErro}
          </div>
        )}

        {fotos.length === 0 ? (
          <div className={styles.state}>
            <ImagePlus size={24} />
            <p>Nenhuma foto adicionada ainda.</p>
          </div>
        ) : (
          <div className={styles.fotoGrid}>
            {fotos.map((foto, i) => (
              <div key={foto.key} className={styles.fotoCard}>
                <div className={styles.fotoImgWrap}>
                  {foto.url && (
                    <img src={foto.url} alt="" className={styles.fotoImg} />
                  )}
                  <div className={styles.fotoOrdemAcoes}>
                    <button
                      type="button"
                      className={styles.fotoOrdemBtn}
                      onClick={() => mover(i, -1)}
                      disabled={i === 0}
                      aria-label="Mover para cima"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      className={styles.fotoOrdemBtn}
                      onClick={() => mover(i, 1)}
                      disabled={i === fotos.length - 1}
                      aria-label="Mover para baixo"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                </div>
                <div className={styles.fotoCardFoot}>
                  <input
                    className={styles.fotoLegendaInput}
                    placeholder="Legenda (opcional)"
                    value={foto.legenda ?? ""}
                    onChange={(ev) =>
                      editarLegendaLocal(foto.key, ev.target.value)
                    }
                    onBlur={salvarLegenda}
                  />
                  <button
                    type="button"
                    className={styles.fotoDeleteBtn}
                    onClick={() => excluirFoto(foto.key)}
                    aria-label="Remover foto"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.publicarBar}>
        <span className={styles.publicarStatus}>
          {e.publicado
            ? `Publicado em ${e.publicadoEm ? formatData(e.publicadoEm) : ""}`
            : notificouAgora
              ? "Publicado agora — responsáveis notificados."
              : "Os responsáveis só veem depois de publicar."}
        </span>
        {!e.publicado && (
          <button
            type="button"
            className={styles.editBtn}
            onClick={publicar}
            disabled={publicando || fotos.length === 0}
          >
            <Send size={14} />
            {publicando ? "Publicando…" : "Publicar mural"}
          </button>
        )}
      </div>
      {publicarErro && (
        <div
          className={styles.saveError}
          role="alert"
          style={{ margin: "0 16px 16px" }}
        >
          {publicarErro}
        </div>
      )}
    </div>
  );
}
