"use client";

import { useState } from "react";
import { AlertCircle, Banknote } from "lucide-react";
import { Badge, Button, Input, Modal } from "@/components";
import { useFetch } from "@/hooks/useFetch";
import { FinanceiroAdminService } from "@/services/financeiroAdminService";
import { getApiErrorCode, getApiErrorMessage } from "@/services/apiError";
import { formatBRL, type Mensalidade } from "@/types/financeiro";
import { ErrorState, TableSkeleton } from "../ListState";

const STATUS_TONE: Record<
  Mensalidade["status"],
  "success" | "info" | "danger"
> = {
  pago: "success",
  aberto: "info",
  atrasado: "danger",
};

const STATUS_LABEL: Record<Mensalidade["status"], string> = {
  pago: "Pago",
  aberto: "Em aberto",
  atrasado: "Atrasado",
};

/** FIN-16 · admin registra pagamento em dinheiro físico no mês em aberto/atrasado. */
export function FinanceiroCriancaModal({
  crianca,
  onClose,
}: {
  crianca: { _id: string; nome: string } | null;
  onClose: () => void;
}) {
  const [pagando, setPagando] = useState<Mensalidade | null>(null);

  const { data, loading, error, reload } = useFetch(
    () =>
      crianca
        ? FinanceiroAdminService.listMensalidades(crianca._id)
        : Promise.resolve([]),
    [crianca?._id],
  );
  const meses = data ?? [];

  function fechar() {
    setPagando(null);
    onClose();
  }

  return (
    <Modal
      open={!!crianca}
      onClose={fechar}
      title={crianca ? `Financeiro de ${crianca.nome}` : "Financeiro"}
    >
      {pagando ? (
        <RegistrarPagamento
          mensalidade={pagando}
          onCancel={() => setPagando(null)}
          onSaved={() => {
            setPagando(null);
            reload();
          }}
        />
      ) : loading ? (
        <TableSkeleton columns={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : meses.length === 0 ? (
        <p style={{ fontSize: 14, color: "var(--text-soft)" }}>
          Ainda não há mensalidades geradas para {crianca?.nome} este ano.
        </p>
      ) : (
        <div style={{ display: "grid", gap: 4 }}>
          {meses.map((m) => (
            <div
              key={m._id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 2px",
                borderBottom: "1px solid var(--border-10)",
              }}
            >
              <span style={{ width: 84, fontSize: 14, fontWeight: 600 }}>
                {m.mesLabel}
              </span>
              <Badge tone={STATUS_TONE[m.status]}>
                {STATUS_LABEL[m.status]}
              </Badge>
              <span style={{ marginLeft: "auto", fontSize: 14 }}>
                {formatBRL(m.valor)}
              </span>
              {m.status !== "pago" && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setPagando(m)}
                >
                  <Banknote size={14} /> Registrar
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

function RegistrarPagamento({
  mensalidade,
  onCancel,
  onSaved,
}: {
  mensalidade: Mensalidade;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [valor, setValor] = useState(String(mensalidade.valor));
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function confirmar() {
    const numero = Number(valor.replace(",", "."));
    if (!Number.isFinite(numero) || numero <= 0) {
      setErro("Informe um valor válido.");
      return;
    }
    setBusy(true);
    setErro(null);
    try {
      await FinanceiroAdminService.registrarPagamentoManual(
        mensalidade._id,
        numero,
      );
      onSaved();
    } catch (err) {
      // Mensalidade já baixada (ex.: PIX confirmado enquanto o modal estava
      // aberto) — não é erro do ponto de vista do admin, só reflete a lista.
      if (getApiErrorCode(err) === "MENSALIDADE_PAGA") {
        onSaved();
        return;
      }
      setErro(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-soft)" }}>
        Dinheiro recebido pela secretaria referente a{" "}
        <b>{mensalidade.mesLabel}</b>. A mensalidade é baixada como paga e fica
        registrado que foi você quem recebeu.
      </p>
      <Input
        label="Valor recebido (R$)"
        type="number"
        step="0.01"
        min={0}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
      />
      {erro && (
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
            color: "var(--color-danger-strong)",
            fontSize: 13,
          }}
          role="alert"
        >
          <AlertCircle size={16} /> <span>{erro}</span>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={busy}
        >
          Cancelar
        </Button>
        <Button type="button" onClick={confirmar} disabled={busy}>
          {busy ? "Registrando…" : "Confirmar"}
        </Button>
      </div>
    </div>
  );
}
