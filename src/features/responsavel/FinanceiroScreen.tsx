"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  CheckCircle2,
  Clock,
  Download,
  AlertTriangle,
  Droplet,
} from "lucide-react";
import { Button, Modal, Skeleton } from "@/components";
import { useResponsavel } from "@/contexts/ResponsavelContext";
import { useFetch } from "@/hooks/useFetch";
import { FinanceiroService } from "@/services/financeiroService";
import { getApiErrorCode, getApiErrorMessage } from "@/services/apiError";
import { IS_DEV_DATA } from "@/config/env";
import { baixarReciboPdf } from "@/utils/exportRecibo";
import {
  formatBRL,
  type Mensalidade,
  type Pagamento,
  type StatusMensalidade,
} from "@/types/financeiro";
import styles from "./responsavel.module.css";

const STATUS_VISUAL: Record<
  StatusMensalidade,
  { badgeBg: string; badgeFg: string; label: string; fg: string }
> = {
  pago: {
    badgeBg: "var(--color-secondary-soft)",
    badgeFg: "var(--color-secondary-strong)",
    label: "Pago",
    fg: "var(--color-secondary-strong)",
  },
  aberto: {
    badgeBg: "var(--color-primary-soft)",
    badgeFg: "var(--color-primary-link)",
    label: "Em aberto",
    fg: "var(--color-primary-link)",
  },
  atrasado: {
    badgeBg: "var(--color-danger-soft)",
    badgeFg: "var(--color-danger-strong)",
    label: "Atrasado",
    fg: "var(--color-danger-strong)",
  },
};

export function FinanceiroScreen() {
  const { active, loading: ctxLoading } = useResponsavel();
  const [paying, setPaying] = useState<Mensalidade | null>(null);
  const [recibo, setRecibo] = useState<Mensalidade | null>(null);

  const { data, loading, error, reload } = useFetch(
    () =>
      active
        ? FinanceiroService.listMensalidades(active._id)
        : Promise.resolve([]),
    [active?._id],
  );
  const meses = data ?? [];
  const emAberto = meses
    .filter((m) => m.status !== "pago")
    .reduce((sum, m) => sum + m.valor, 0);

  // Só o carregamento inicial (sem dados) bloqueia a tela. Um reload em
  // background (ex.: `onPaid` após confirmar o PIX) NÃO pode desmontar a lista
  // e o Modal: se desmontar, o PixContent remonta, perde o estado `paid` e
  // recria a cobrança — 409 → paid → reload → loop infinito reabrindo o modal.
  if (ctxLoading || (loading && !data)) {
    return (
      <div role="status" aria-label="Carregando…">
        <div className={`${styles.gradHeader} ${styles.finHeaderPad}`}>
          <Skeleton
            width={110}
            height={21}
            style={{ background: "rgba(255,255,255,0.3)", marginBottom: 6 }}
          />
          <Skeleton
            width={70}
            height={13}
            style={{ background: "rgba(255,255,255,0.25)" }}
          />
          <div className={styles.finCards}>
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className={styles.finCard}>
                <Skeleton
                  width="60%"
                  height={11}
                  style={{
                    background: "rgba(255,255,255,0.3)",
                    marginBottom: 6,
                  }}
                />
                <Skeleton
                  width="45%"
                  height={18}
                  style={{ background: "rgba(255,255,255,0.3)" }}
                />
              </div>
            ))}
          </div>
        </div>
        <div className={styles.monthList}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.monthRow}>
              <Skeleton width={42} height={42} radius={12} />
              <span style={{ flex: 1 }}>
                <Skeleton
                  width="40%"
                  height={14}
                  style={{ marginBottom: 6 }}
                />
                <Skeleton width="55%" height={12} />
              </span>
              <Skeleton width={70} height={30} radius={12} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!active) {
    return (
      <div className={styles.state}>
        <span className={styles.emptyBadge}>Sem filhos vinculados</span>
        <p>Nenhuma criança vinculada a esta conta.</p>
      </div>
    );
  }

  return (
    <div>
      <div className={`${styles.gradHeader} ${styles.finHeaderPad}`}>
        <div className={styles.finTitle}>Financeiro</div>
        <div className={styles.finSub}>{active.sub}</div>
        <div className={styles.finCards}>
          <div className={styles.finCard}>
            <div className={styles.finCardLabel}>Em aberto</div>
            <div className={styles.finCardValue}>{formatBRL(emAberto)}</div>
          </div>
          <div className={styles.finCard}>
            <div className={styles.finCardLabel}>Ano</div>
            <div className={styles.finCardValue}>2026</div>
          </div>
        </div>
      </div>

      {error ? (
        <div className={styles.state}>
          <span className={styles.emptyBadge}>Erro</span>
          <p>{error}</p>
        </div>
      ) : meses.length === 0 ? (
        <div className={styles.state}>
          <span className={styles.emptyBadge}>Sem mensalidades</span>
          <p>Ainda não há mensalidades geradas para {active.nome} este ano.</p>
        </div>
      ) : (
        <div className={styles.monthList}>
          {meses.map((m) => {
            const v = STATUS_VISUAL[m.status];
            const StatusIcon =
              m.status === "pago"
                ? CheckCircle2
                : m.status === "atrasado"
                  ? AlertTriangle
                  : Clock;
            return (
              <div key={m._id} className={styles.monthRow}>
                <span
                  className={styles.monthBadge}
                  style={{ background: v.badgeBg, color: v.badgeFg }}
                >
                  {m.mesShort}
                </span>
                <div style={{ flex: 1 }}>
                  <div className={styles.monthName}>{m.mesLabel}</div>
                  <div className={styles.monthStatus} style={{ color: v.fg }}>
                    <StatusIcon size={14} />
                    {m.status === "pago"
                      ? "Pago"
                      : `${v.label} · ${formatBRL(m.valor)}`}
                  </div>
                </div>
                {m.status === "pago" ? (
                  <button
                    className={styles.receiptBtn}
                    onClick={() => setRecibo(m)}
                  >
                    <Download size={14} /> Recibo
                  </button>
                ) : (
                  <button
                    className={styles.payBtn}
                    onClick={() => setPaying(m)}
                  >
                    Pagar
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={!!paying}
        onClose={() => setPaying(null)}
        title="Pagamento via PIX"
      >
        {paying && (
          <PixContent
            mensalidade={paying}
            onPaid={reload}
            onClose={() => setPaying(null)}
          />
        )}
      </Modal>

      <Modal open={!!recibo} onClose={() => setRecibo(null)} title="Comprovante">
        {recibo && active && (
          <ReciboContent mensalidade={recibo} crianca={active} />
        )}
      </Modal>
    </div>
  );
}

function formatDataPagamento(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

function ReciboContent({
  mensalidade,
  crianca,
}: {
  mensalidade: Mensalidade;
  crianca: { nome: string; cpf?: string };
}) {
  const [gerando, setGerando] = useState(false);
  const linhas: [string, string][] = [
    ["Aluno(a)", crianca.nome],
    ...(crianca.cpf ? ([["CPF do aluno(a)", crianca.cpf]] as [string, string][]) : []),
    ["Competência", `${mensalidade.mesLabel}/${mensalidade.ano}`],
    ["Forma de pagamento", "PIX"],
    ["Data do pagamento", formatDataPagamento(mensalidade.updatedAt)],
    ["ID da transação", mensalidade._id],
    ["Beneficiário", "Aquarela Kids LTDA"],
  ];

  return (
    <div className={styles.recibo}>
      <div className={`${styles.gradHeader} ${styles.reciboHeader}`}>
        <span className={styles.reciboMark} aria-hidden>
          <Droplet size={20} fill="#fff" strokeWidth={0} />
        </span>
        <div className={styles.reciboTitle}>Comprovante de pagamento</div>
        <div className={styles.reciboSub}>Aquarela Kids · Berçário</div>
      </div>

      <div className={styles.reciboValueLabel}>Valor pago</div>
      <div className={styles.reciboValue}>{formatBRL(mensalidade.valor)}</div>
      <span className={styles.reciboPaidBadge}>
        <CheckCircle2 size={13} /> Pago
      </span>

      <div className={styles.reciboRows}>
        {linhas.map(([label, valor]) => (
          <div key={label} className={styles.reciboRow}>
            <span className={styles.reciboRowLabel}>{label}</span>
            <span className={styles.reciboRowValue}>{valor}</span>
          </div>
        ))}
      </div>

      <Button
        style={{ width: "100%" }}
        disabled={gerando}
        onClick={() => {
          setGerando(true);
          setTimeout(() => {
            baixarReciboPdf(
              { valor: formatBRL(mensalidade.valor), linhas },
              `recibo-${mensalidade.mesLabel.toLowerCase()}-${mensalidade.ano}.pdf`,
            );
            setGerando(false);
          }, 400);
        }}
      >
        {gerando ? (
          <>
            <span className={styles.reciboSpinner} aria-hidden /> Gerando PDF…
          </>
        ) : (
          <>
            <Download size={16} /> Baixar PDF
          </>
        )}
      </Button>
    </div>
  );
}

function PixContent({
  mensalidade,
  onPaid,
  onClose,
}: {
  mensalidade: Mensalidade;
  onPaid: () => void;
  onClose: () => void;
}) {
  const [pagamento, setPagamento] = useState<Pagamento | null>(null);
  const [paid, setPaid] = useState(false);
  const [copied, setCopied] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let cancelado = false;
    // Reset controlado antes de gerar a cobrança (sincroniza a UI com a busca).
    /* eslint-disable react-hooks/set-state-in-effect */
    setErro(null);
    setPagamento(null);
    /* eslint-enable react-hooks/set-state-in-effect */
    FinanceiroService.criarPagamento(mensalidade._id)
      .then((p) => {
        if (!cancelado) setPagamento(p);
      })
      .catch((err) => {
        if (cancelado) return;
        // A mensalidade já foi paga (cobrança anterior, outra aba ou efeito
        // duplicado do StrictMode). Isso não é erro — é confirmação: mostra o
        // estado "pago" em vez do vermelho "Tentar de novo".
        if (getApiErrorCode(err) === "MENSALIDADE_PAGA") {
          setPaid(true);
          onPaid();
          return;
        }
        // Sem isto o modal ficava preso em "Gerando cobrança…" para sempre.
        setErro(getApiErrorMessage(err));
      });
    return () => {
      cancelado = true;
    };
    // `onPaid` (reload do useFetch) é estável — não refaz a cobrança por render.
  }, [mensalidade._id, tentativa, onPaid]);

  // Em produção: polling do status até "pago".
  useEffect(() => {
    if (IS_DEV_DATA || !pagamento || paid) return;
    const id = setInterval(async () => {
      try {
        const p = await FinanceiroService.getPagamento(pagamento.txid);
        if (p.status === "pago") {
          setPaid(true);
          onPaid();
          clearInterval(id);
        } else if (p.status === "expirado") {
          setErro("A cobrança expirou. Gere um novo PIX para pagar.");
          clearInterval(id);
        }
      } catch {
        /* falha transitória de rede: mantém aguardando */
      }
    }, 4000);
    return () => clearInterval(id);
  }, [pagamento, paid, onPaid]);

  function copy() {
    if (!pagamento) return;
    navigator.clipboard?.writeText(pagamento.pixCopiaECola);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (paid) {
    return (
      <div className={styles.pixPaid}>
        <span className={styles.pixCheck}>
          <CheckCircle2 size={44} />
        </span>
        <div>
          <div className={styles.pixPaidTitle}>Pagamento confirmado</div>
          <div className={styles.pixPaidSub}>
            {mensalidade.mesLabel} · {formatBRL(mensalidade.valor)}
          </div>
        </div>
        <button
          className={styles.payBtn}
          style={{ width: "100%", padding: 13 }}
          onClick={onClose}
        >
          Voltar ao financeiro
        </button>
      </div>
    );
  }

  if (erro) {
    return (
      <div className={styles.pix}>
        <div className={styles.pixMonth}>
          {mensalidade.mesLabel} · mensalidade
        </div>
        <div className={styles.pixValue}>{formatBRL(mensalidade.valor)}</div>
        <div
          className={styles.pixWaiting}
          style={{
            background: "var(--color-danger-soft)",
            borderColor: "var(--color-danger)",
          }}
          role="alert"
        >
          <AlertTriangle size={16} color="var(--color-danger-strong)" />
          <span
            className={styles.pixWaitingText}
            style={{ color: "var(--color-danger-strong)" }}
          >
            {erro}
          </span>
        </div>
        <div style={{ display: "flex", gap: 10, width: "100%", marginTop: 14 }}>
          <Button variant="secondary" onClick={onClose} style={{ flex: 1 }}>
            Fechar
          </Button>
          <Button
            onClick={() => setTentativa((t) => t + 1)}
            style={{ flex: 1 }}
          >
            Tentar de novo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pix}>
      <div className={styles.pixMonth}>
        {mensalidade.mesLabel} · mensalidade
      </div>
      <div className={styles.pixValue}>{formatBRL(mensalidade.valor)}</div>
      <div className={styles.pixQr}>
        {pagamento ? (
          <QRCodeSVG value={pagamento.pixCopiaECola} size={188} level="M" />
        ) : (
          <div style={{ width: 188, height: 188 }} />
        )}
      </div>
      <div className={styles.pixHint}>
        Escaneie o QR ou copie o código abaixo
      </div>
      <div className={styles.pixCodeRow}>
        <span className={styles.pixCode}>
          {pagamento?.pixCopiaECola ?? "Gerando cobrança…"}
        </span>
        <button className={styles.copyBtn} onClick={copy} disabled={!pagamento}>
          {copied ? "Copiado!" : "Copiar"}
        </button>
      </div>
      <div className={styles.pixWaiting}>
        <span className={styles.pixSpinner} aria-hidden />
        <span className={styles.pixWaitingText}>Aguardando pagamento…</span>
      </div>
      {IS_DEV_DATA && (
        <button
          className={styles.payBtn}
          style={{ width: "100%", padding: 13, marginTop: 14 }}
          onClick={() => {
            setPaid(true);
            onPaid();
          }}
        >
          Simular confirmação do PIX
        </button>
      )}
    </div>
  );
}
