"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Pencil,
  Plus,
  Receipt,
  Send,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import {
  Badge,
  Button,
  DateBRInput,
  Input,
  Modal,
  Select,
  Tooltip,
} from "@/components";
import { useFetch } from "@/hooks/useFetch";
import { FinanceiroAdminService } from "@/services/financeiroAdminService";
import { getApiErrorMessage } from "@/services/apiError";
import { despesaSchema, type DespesaFormData } from "@/schemas/despesa";
import {
  CATEGORIAS_DESPESA,
  type Despesa,
  type ResultadoDisparoCobrancas,
} from "@/types/financeiroAdmin";
import { formatBRL } from "@/types/financeiro";
import { exportToXlsx, hojeSufixo } from "@/utils/exportXlsx";
import { dataBrParaIso, isoParaDataBr } from "@/utils/dataBr";
import { exportToPdfTable } from "@/utils/exportPdfTable";
import { EmptyState, ErrorState, TableSkeleton } from "../ListState";
import styles from "../admin.module.css";

type Aba = "despesas" | "inadimplentes";

function formatData(iso: string): string {
  const dataPart = iso.split("T")[0];
  const d = new Date(`${dataPart}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("pt-BR");
}

export function FinanceiroAdminScreen() {
  const [aba, setAba] = useState<Aba>("despesas");

  return (
    <div className={styles.page}>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Financeiro</h1>
          <p className={styles.pageSub}>
            Lançamento de despesas e acompanhamento de inadimplência.
          </p>
        </div>
      </div>

      <div
        role="tablist"
        style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}
      >
        <Button
          variant={aba === "despesas" ? "primary" : "secondary"}
          size="sm"
          role="tab"
          aria-selected={aba === "despesas"}
          onClick={() => setAba("despesas")}
        >
          Despesas
        </Button>
        <Button
          variant={aba === "inadimplentes" ? "primary" : "secondary"}
          size="sm"
          role="tab"
          aria-selected={aba === "inadimplentes"}
          onClick={() => setAba("inadimplentes")}
        >
          Inadimplentes
        </Button>
      </div>

      {aba === "despesas" ? <Despesas /> : <Inadimplentes />}
    </div>
  );
}

/** Par de botões PDF/Excel para telas de exportação em tabela. */
function ExportButtons({
  onPdf,
  onExcel,
  disabled,
}: {
  onPdf: () => void;
  onExcel: () => void;
  disabled?: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <Button variant="secondary" size="sm" onClick={onPdf} disabled={disabled}>
        <FileText size={16} /> PDF
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={onExcel}
        disabled={disabled}
      >
        <FileSpreadsheet size={16} /> Excel
      </Button>
    </div>
  );
}

/* ===================== Despesas (FIN-09/FIN-10) ===================== */

function Despesas() {
  const { data, loading, error, reload } = useFetch(() =>
    FinanceiroAdminService.listDespesas(),
  );
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Despesa | null>(null);
  const [deleting, setDeleting] = useState<Despesa | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const despesas = data ?? [];
  const total = despesas.reduce((s, d) => s + d.valor, 0);

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    setActionError(null);
    try {
      await FinanceiroAdminService.removeDespesa(deleting._id);
      setDeleting(null);
      reload();
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function exportarExcel() {
    exportToXlsx(
      despesas.map((d) => ({
        Data: formatData(d.data),
        Descrição: d.descricao,
        Categoria: d.categoria,
        Valor: d.valor,
      })),
      `despesas-${hojeSufixo()}.xlsx`,
      "Despesas",
    );
  }

  function exportarPdf() {
    exportToPdfTable(
      "Despesas",
      ["Data", "Descrição", "Categoria", "Valor"],
      despesas.map((d) => [
        formatData(d.data),
        d.descricao,
        d.categoria,
        formatBRL(d.valor),
      ]),
      `despesas-${hojeSufixo()}.pdf`,
    );
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 14, color: "var(--text-dim)" }}>
          Total lançado:{" "}
          <b style={{ color: "var(--text)" }}>{formatBRL(total)}</b>
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <ExportButtons
            onPdf={exportarPdf}
            onExcel={exportarExcel}
            disabled={despesas.length === 0}
          />
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus size={16} />
            Adicionar
          </Button>
        </div>
      </div>

      <div className={styles.card}>
        {loading ? (
          <TableSkeleton columns={5} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : despesas.length === 0 ? (
          <EmptyState
            icon={<Receipt size={24} />}
            title="Nenhuma despesa lançada"
            text="Registre as despesas para acompanhar o balanço do mês."
            action={
              <Button size="sm" onClick={() => setFormOpen(true)}>
                <Plus size={16} />
                Adicionar
              </Button>
            }
          />
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Valor</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {despesas.map((d) => (
                  <tr key={d._id}>
                    <td>{formatData(d.data)}</td>
                    <td className={styles.cellName}>{d.descricao}</td>
                    <td>
                      <Badge tone="neutral">{d.categoria}</Badge>
                    </td>
                    <td>{formatBRL(d.valor)}</td>
                    <td>
                      <div className={styles.rowActions}>
                        <Tooltip label="Editar">
                          <button
                            className={styles.iconBtn}
                            onClick={() => setEditing(d)}
                            aria-label={`Editar ${d.descricao}`}
                          >
                            <Pencil size={16} />
                          </button>
                        </Tooltip>
                        <Tooltip label="Remover">
                          <button
                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                            onClick={() => {
                              setActionError(null);
                              setDeleting(d);
                            }}
                            aria-label={`Remover ${d.descricao}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Nova despesa"
      >
        <DespesaForm
          onCancel={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            reload();
          }}
        />
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Editar despesa"
      >
        {editing && (
          <DespesaForm
            despesa={editing}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              reload();
            }}
          />
        )}
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Remover"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmDelete} disabled={busy}>
              {busy ? "Removendo…" : "Remover"}
            </Button>
          </>
        }
      >
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-soft)" }}>
          Remover <b>{deleting?.descricao}</b> (
          {formatBRL(deleting?.valor ?? 0)})?
        </p>
        {actionError && (
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 14,
              color: "var(--color-danger-strong)",
              fontSize: 13,
            }}
          >
            <AlertCircle size={17} /> <span>{actionError}</span>
          </div>
        )}
      </Modal>
    </>
  );
}

function DespesaForm({
  despesa,
  onCancel,
  onSaved,
}: {
  despesa?: Despesa;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DespesaFormData>({
    resolver: yupResolver(despesaSchema),
    defaultValues: despesa
      ? {
          descricao: despesa.descricao,
          categoria: despesa.categoria,
          valor: despesa.valor,
          data: isoParaDataBr(despesa.data),
        }
      : { descricao: "", categoria: "", data: "" },
  });

  async function onSubmit(values: DespesaFormData) {
    setSubmitError(null);
    const payload = { ...values, data: dataBrParaIso(values.data) };
    try {
      if (despesa) {
        await FinanceiroAdminService.updateDespesa(despesa._id, payload);
      } else {
        await FinanceiroAdminService.createDespesa(payload);
      }
      onSaved();
    } catch (err) {
      setSubmitError(getApiErrorMessage(err));
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      {submitError && (
        <div
          style={{
            display: "flex",
            gap: 8,
            color: "var(--color-danger-strong)",
            fontSize: 13,
          }}
          role="alert"
        >
          <AlertCircle size={17} /> <span>{submitError}</span>
        </div>
      )}
      <Input
        label="Descrição"
        placeholder="Ex.: Compra de alimentos"
        error={errors.descricao?.message}
        {...register("descricao")}
      />
      <Select
        label="Categoria"
        placeholder="Selecione a categoria"
        options={CATEGORIAS_DESPESA.map((c) => ({ value: c, label: c }))}
        error={errors.categoria?.message}
        {...register("categoria")}
      />
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 140px", minWidth: 0 }}>
          <Input
            label="Valor (R$)"
            type="number"
            step="0.01"
            min={0}
            placeholder="0,00"
            error={errors.valor?.message}
            {...register("valor", { valueAsNumber: true })}
          />
        </div>
        <div style={{ flex: "1 1 140px", minWidth: 0 }}>
          <DateBRInput
            label="Data"
            error={errors.data?.message}
            {...register("data")}
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          marginTop: 6,
        }}
      >
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Salvando…"
            : despesa
              ? "Salvar"
              : "Lançar"}
        </Button>
      </div>
    </form>
  );
}

/* ===================== Inadimplentes (FIN-12) ===================== */

function Inadimplentes() {
  const { data, loading, error, reload } = useFetch(() =>
    FinanceiroAdminService.getInadimplentes(),
  );
  const lista = data ?? [];
  const total = lista.reduce((s, i) => s + i.valorTotal, 0);

  const [disparoOpen, setDisparoOpen] = useState(false);
  const [disparoBusy, setDisparoBusy] = useState(false);
  const [disparoError, setDisparoError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ResultadoDisparoCobrancas | null>(
    null,
  );
  const [resultado, setResultado] = useState<ResultadoDisparoCobrancas | null>(
    null,
  );

  async function abrirDisparo() {
    setDisparoOpen(true);
    setDisparoBusy(true);
    setDisparoError(null);
    setPreview(null);
    setResultado(null);
    try {
      setPreview(await FinanceiroAdminService.dispararCobrancas(true));
    } catch (err) {
      setDisparoError(getApiErrorMessage(err));
    } finally {
      setDisparoBusy(false);
    }
  }

  async function confirmarDisparo() {
    setDisparoBusy(true);
    setDisparoError(null);
    try {
      setResultado(await FinanceiroAdminService.dispararCobrancas(false));
    } catch (err) {
      setDisparoError(getApiErrorMessage(err));
    } finally {
      setDisparoBusy(false);
    }
  }

  function exportarExcel() {
    exportToXlsx(
      lista.map((i) => ({
        Criança: i.criancaNome,
        Turma: i.turmaNome ?? "—",
        Responsável: i.responsavelNome,
        Contato: i.responsavelContato ?? "—",
        "Meses em atraso": i.mesesEmAtraso,
        "Valor total": i.valorTotal,
      })),
      `inadimplentes-${hojeSufixo()}.xlsx`,
      "Inadimplentes",
    );
  }

  function exportarPdf() {
    exportToPdfTable(
      "Inadimplentes",
      ["Criança", "Responsável", "Atraso", "Valor total"],
      lista.map((i) => [
        i.criancaNome,
        i.responsavelNome,
        `${i.mesesEmAtraso} ${i.mesesEmAtraso === 1 ? "mês" : "meses"}`,
        formatBRL(i.valorTotal),
      ]),
      `inadimplentes-${hojeSufixo()}.pdf`,
    );
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 14, color: "var(--text-dim)" }}>
          Em aberto:{" "}
          <b style={{ color: "var(--color-danger-strong)" }}>
            {formatBRL(total)}
          </b>{" "}
          · {lista.length} famílias
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <ExportButtons
            onPdf={exportarPdf}
            onExcel={exportarExcel}
            disabled={lista.length === 0}
          />
          <Button size="sm" onClick={abrirDisparo}>
            <Send size={16} />
            Disparar cobranças agora
          </Button>
        </div>
      </div>

      <div className={styles.card}>
        {loading ? (
          <TableSkeleton columns={4} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : lista.length === 0 ? (
          <EmptyState
            icon={<TriangleAlert size={24} />}
            title="Nenhum inadimplente"
            text="Todas as mensalidades estão em dia. 🎉"
          />
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Criança</th>
                  <th>Responsável</th>
                  <th>Atraso</th>
                  <th>Valor total</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((i) => (
                  <tr key={i.criancaId}>
                    <td>
                      <div className={styles.cellName}>{i.criancaNome}</div>
                      <div className={styles.cellSub}>{i.turmaNome ?? "—"}</div>
                    </td>
                    <td>
                      <div>{i.responsavelNome}</div>
                      {i.responsavelContato && (
                        <div className={styles.cellSub}>
                          {i.responsavelContato}
                        </div>
                      )}
                    </td>
                    <td>
                      <Badge tone={i.mesesEmAtraso >= 3 ? "danger" : "warning"}>
                        {i.mesesEmAtraso}{" "}
                        {i.mesesEmAtraso === 1 ? "mês" : "meses"}
                      </Badge>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {formatBRL(i.valorTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={disparoOpen}
        onClose={() => setDisparoOpen(false)}
        title="Disparar cobranças"
        footer={
          resultado ? (
            <Button onClick={() => setDisparoOpen(false)}>Fechar</Button>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={() => setDisparoOpen(false)}
                disabled={disparoBusy}
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmarDisparo}
                disabled={disparoBusy || !preview}
              >
                {disparoBusy ? "Disparando…" : "Confirmar disparo"}
              </Button>
            </>
          )
        }
      >
        {disparoBusy && !preview && !resultado && (
          <p style={{ fontSize: 14, color: "var(--text-soft)" }}>
            Calculando quem seria notificado…
          </p>
        )}

        {preview && !resultado && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-soft)" }}>
              Mensalidades em aberto até o fim do mês, agrupadas por
              responsável (1 push por pessoa).
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "var(--color-primary-link)",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              <Send size={16} />
              {preview.responsaveisNotificados}{" "}
              {preview.responsaveisNotificados === 1
                ? "responsável seria notificado"
                : "responsáveis seriam notificados"}
            </div>
            {preview.responsaveisSemToken > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "var(--color-danger-strong)",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                <AlertCircle size={16} />
                {preview.responsaveisSemToken}{" "}
                {preview.responsaveisSemToken === 1
                  ? "responsável sem token válido"
                  : "responsáveis sem token válido"}{" "}
                (não recebem push)
              </div>
            )}
          </div>
        )}

        {resultado && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              color: "var(--color-secondary-strong)",
              fontSize: 14,
            }}
          >
            <CheckCircle2 size={18} />
            <span>
              {resultado.responsaveisNotificados}{" "}
              {resultado.responsaveisNotificados === 1
                ? "responsável notificado"
                : "responsáveis notificados"}
              {resultado.responsaveisSemToken > 0 &&
                ` · ${resultado.responsaveisSemToken} sem token válido`}
              . {resultado.mensalidadesAtualizadas}{" "}
              {resultado.mensalidadesAtualizadas === 1
                ? "mensalidade marcada"
                : "mensalidades marcadas"}
              .
            </span>
          </div>
        )}

        {disparoError && (
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 14,
              color: "var(--color-danger-strong)",
              fontSize: 13,
            }}
          >
            <AlertCircle size={17} /> <span>{disparoError}</span>
          </div>
        )}
      </Modal>
    </>
  );
}
