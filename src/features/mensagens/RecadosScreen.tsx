"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCheck, Paperclip, Send, Trash2 } from "lucide-react";
import { Avatar, BackButton, Skeleton, UploadAnexo } from "@/components";
import { useAuth } from "@/contexts/AuthContext";
import {
  usePageTitle,
  useHideTopbar,
  useWideContent,
  useFixedHeightContent,
} from "@/contexts/PageTitleContext";
import { useFetch } from "@/hooks/useFetch";
import { CriancasService } from "@/services/criancas";
import { MensagensService } from "@/services/mensagens";
import { getApiErrorMessage } from "@/services/apiError";
import {
  RecadosNaoLidos,
  onNovoRecadoRecebido,
} from "@/services/recadosNaoLidos";
import { sortearCoresAvatar } from "@/types/crianca";
import type { AnexoReferencia } from "@/types/anexo";
import type { Mensagem } from "@/types/mensagem";
import styles from "./mensagens.module.css";

function formatarHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function criarIdLocal(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const ROTULO_PAPEL: Record<Mensagem["autorPapel"], string> = {
  professor: "Professor(a)",
  responsavel: "Responsável",
};

function primeiroNome(nome: string): string {
  const primeiraPalavra = nome
    .replace(/^prof\.?\s*/i, "")
    .trim()
    .split(/\s+/)[0];
  return primeiraPalavra ?? nome;
}

function nomeRemetente(mensagem: Mensagem): string {
  const nome = mensagem.autorNome || ROTULO_PAPEL[mensagem.autorPapel];
  return mensagem.autorPapel === "professor"
    ? `Tia(o) ${primeiroNome(nome)}`
    : nome;
}

export function RecadosScreen({ criancaId }: { criancaId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const crianca = useFetch(
    () => CriancasService.getById(criancaId),
    [criancaId],
  );
  const base = useFetch(() => MensagensService.listar(criancaId), [criancaId]);
  const [enviadas, setEnviadas] = useState<Mensagem[]>([]);
  const [recebidasNovas, setRecebidasNovas] = useState<Mensagem[]>([]);
  const [removidasIds, setRemovidasIds] = useState<Set<string>>(new Set());
  const [corpo, setCorpo] = useState("");
  const [anexos, setAnexos] = useState<AnexoReferencia[]>([]);
  const [mostrarAnexo, setMostrarAnexo] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const ultimoCreatedAtRef = useRef<string | null>(null);
  const listaRef = useRef<HTMLDivElement>(null);
  const avatarBg = useMemo(
    () => sortearCoresAvatar([criancaId])[criancaId],
    [criancaId],
  );

  const mensagens = useMemo(() => {
    const idsVistos = new Set<string>();
    const todas = [...(base.data ?? []), ...recebidasNovas, ...enviadas];
    const unicas = todas.filter((m) => {
      if (removidasIds.has(m.id)) return false;
      if (idsVistos.has(m.id)) return false;
      idsVistos.add(m.id);
      return true;
    });
    return unicas.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [base.data, recebidasNovas, enviadas, removidasIds]);

  useEffect(() => {
    const lista = listaRef.current;
    if (!lista || mensagens.length === 0) return;
    lista.scrollTop = lista.scrollHeight;
  }, [mensagens.length]);

  useEffect(() => {
    if (mensagens.length > 0) {
      ultimoCreatedAtRef.current = mensagens[mensagens.length - 1].createdAt;
    }
  }, [mensagens]);

  useEffect(() => {
    RecadosNaoLidos.marcarLido(criancaId);
  }, [criancaId]);

  useEffect(() => {
    return onNovoRecadoRecebido((idRecebido) => {
      if (idRecebido !== criancaId) return;
      RecadosNaoLidos.marcarLido(criancaId);

      const desde = ultimoCreatedAtRef.current ?? undefined;
      MensagensService.listar(criancaId, undefined, desde)
        .then((novas) => {
          if (novas.length === 0) return;
          setRecebidasNovas((atual) => {
            const idsAtuais = new Set(atual.map((m) => m.id));
            const filtradas = novas.filter((m) => !idsAtuais.has(m.id));
            return filtradas.length > 0 ? [...atual, ...filtradas] : atual;
          });
        })
        .catch(() => {});
    });
  }, [criancaId]);

  async function enviar() {
    const texto = corpo.trim();
    if (!texto) return;

    const tempId = criarIdLocal();
    const anexosDoEnvio = anexos;
    const mensagemOtimista: Mensagem = {
      id: tempId,
      criancaId,
      autorId: user?.id ?? "",
      autorNome: user?.name ?? "Você",
      autorPapel: (user?.role as "professor" | "responsavel") ?? "responsavel",
      corpo: texto,
      anexos: anexosDoEnvio.map((anexo) => ({ ...anexo })),
      createdAt: new Date().toISOString(),
      status: "enviando",
    };

    setEnviadas((atual) => [...atual, mensagemOtimista]);
    setCorpo("");
    setAnexos([]);
    setMostrarAnexo(false);
    setErroEnvio(null);

    try {
      const nova = await MensagensService.enviar(
        criancaId,
        texto,
        anexosDoEnvio,
      );
      setEnviadas((atual) => atual.map((m) => (m.id === tempId ? nova : m)));
    } catch (err) {
      setEnviadas((atual) => atual.filter((m) => m.id !== tempId));
      setErroEnvio(
        getApiErrorMessage(err, "Não foi possível enviar o recado."),
      );
      setCorpo(texto);
      setAnexos(anexosDoEnvio);
    }
  }

  async function remover(id: string) {
    const alvo = mensagens.find((m) => m.id === id);
    if (!alvo || alvo.status === "enviando") return;

    const eraLocal = enviadas.some((m) => m.id === id);

    if (eraLocal) {
      setEnviadas((atual) => atual.filter((m) => m.id !== id));
    } else {
      setRemovidasIds((atual) => new Set(atual).add(id));
    }
    setErroEnvio(null);

    try {
      await MensagensService.remover(id);
    } catch (err) {
      if (eraLocal) {
        setEnviadas((atual) => [...atual, alvo]);
      } else {
        setRemovidasIds((atual) => {
          const proximo = new Set(atual);
          proximo.delete(id);
          return proximo;
        });
      }
      setErroEnvio(
        getApiErrorMessage(err, "Não foi possível remover o recado."),
      );
    }
  }

  const c = crianca.data;
  const carregandoCrianca = crianca.loading
    ? "Carregando…"
    : crianca.error
      ? "Não foi possível carregar"
      : "";

  const ehProfessor = user?.role === "professor";

  usePageTitle(
    ehProfessor ? "" : "Recados",
    ehProfessor
      ? undefined
      : "Converse com o professor(a)" +
          (c?.nome
            ? ` sobre ${c.nome}`
            : carregandoCrianca
              ? ` · ${carregandoCrianca}`
              : ""),
  );
  useHideTopbar(ehProfessor);
  useWideContent(!ehProfessor);
  useFixedHeightContent();

  return (
    <div className={styles.tela}>
      <div className={styles.watermark} aria-hidden />
      {user?.role === "professor" ? (
        <div className={styles.pushHeader}>
          <BackButton onClick={() => router.back()} />
          {c && (
            <Avatar nome={c.nome} fotoUrl={c.fotoUrl} bg={avatarBg} size={34} />
          )}
          <div style={{ flex: 1 }}>
            <div className={styles.pushTitle}>Recados</div>
            <div className={styles.pushSub}>
              {c?.nome ? `Sobre ${c.nome}` : carregandoCrianca}
            </div>
          </div>
        </div>
      ) : null}

      <div className={styles.lista} ref={listaRef}>
        {base.loading ? (
          <div
            className={styles.listaCarregando}
            role="status"
            aria-label="Carregando…"
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={i}
                width={i % 2 ? "58%" : "45%"}
                height={44}
                radius={16}
                style={{ alignSelf: i % 2 ? "flex-end" : "flex-start" }}
              />
            ))}
          </div>
        ) : mensagens.length === 0 ? (
          base.error ? (
            <div className={styles.vazio}>
              <span className={styles.emptyBadge}>Erro</span>
              <p>{base.error}</p>
            </div>
          ) : (
            <div className={styles.vazio}>
              <span className={styles.emptyBadge}>Sem recados ainda</span>
              <p>Mande uma mensagem sobre {c?.nome ?? "a criança"}.</p>
            </div>
          )
        ) : (
          <>
            {base.error && (
              <div className={styles.erroFaixa} role="alert">
                {base.error}
              </div>
            )}
            {mensagens.map((mensagem) => {
              const minha = mensagem.autorPapel === user?.role;
              return (
                <div
                  key={mensagem.id}
                  className={`${styles.bolha} ${minha ? styles.bolhaMinha : styles.bolhaDelas}`}
                >
                  {mensagem.autorPapel === "professor" && (
                    <span className={styles.remetente}>
                      {nomeRemetente(mensagem)}
                    </span>
                  )}
                  <p className={styles.bolhaTexto}>{mensagem.corpo}</p>
                  {mensagem.anexos.length > 0 && (
                    <div className={styles.bolhaAnexos}>
                      {mensagem.anexos.map((anexo) => (
                        <a
                          key={anexo.key}
                          href={anexo.url}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.anexoLink}
                        >
                          <Paperclip size={13} /> {anexo.nome}
                        </a>
                      ))}
                    </div>
                  )}
                  <div className={styles.bolhaRodape}>
                    <span>{formatarHora(mensagem.createdAt)}</span>
                    {minha && (
                      <span className={styles.bolhaAcoes}>
                        {mensagem.status === "enviando" ? (
                          <Check size={12} aria-label="Enviando" />
                        ) : (
                          <CheckCheck size={12} aria-label="Enviado" />
                        )}
                        <button
                          type="button"
                          className={styles.removerBtn}
                          onClick={() => remover(mensagem.id)}
                          disabled={mensagem.status === "enviando"}
                          aria-label="Remover recado"
                        >
                          <Trash2 size={12} />
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {erroEnvio && (
        <div className={styles.erroFaixa} role="alert">
          {erroEnvio}
        </div>
      )}

      <div className={styles.compositor}>
        {mostrarAnexo && (
          <UploadAnexo
            escopo="mensagem"
            anexos={anexos}
            onChange={setAnexos}
            max={5}
          />
        )}
        <div className={styles.compositorLinha}>
          <button
            type="button"
            className={styles.anexarBtn}
            onClick={() => setMostrarAnexo((v) => !v)}
            aria-label="Anexar arquivo"
          >
            <Paperclip size={18} />
          </button>
          <textarea
            className={styles.compositorInput}
            placeholder="Escreva um recado…"
            value={corpo}
            onChange={(e) => setCorpo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviar();
              }
            }}
            maxLength={2000}
            rows={1}
          />
          <button
            type="button"
            className={styles.enviarBtn}
            onClick={enviar}
            disabled={!corpo.trim()}
            aria-label="Enviar recado"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
