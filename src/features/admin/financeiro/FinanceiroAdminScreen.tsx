"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  AlertCircle,
  Download,
  Plus,
  Receipt,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { Badge, Button, Input, Modal, Select } from "@/components";
import { useFetch } from "@/hooks/useFetch";
import { FinanceiroAdminService } from "@/services/financeiroAdminService";
import { getApiErrorMessage } from "@/services/apiError";
import { despesaSchema, type DespesaFormData } from "@/schemas/despesa";
import { CATEGORIAS_DESPESA, type Despesa } from "@/types/financeiroAdmin";
import { formatBRL } from "@/types/financeiro";
import { exportToXlsx, hojeSufixo } from "@/utils/exportXlsx";
import { EmptyState, ErrorState, TableSkeleton } from "../ListState";
import styles from "../admin.module.css";

type Aba = "despesas" | "inadimplentes";

function formatData(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
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
          <Receipt size={16} /> Despesas
        </Button>
        <Button
          variant={aba === "inadimplentes" ? "primary" : "secondary"}
          size="sm"
          role="tab"
          aria-selected={aba === "inadimplentes"}
          onClick={() => setAba("inadimplentes")}
        >
          <TriangleAlert size={16} /> Inadimplentes
        </Button>
      </div>

      {aba === "despesas" ? <Despesas /> : <Inadimplentes />}
    </div>
  );
}

/* ===================== Despesas (FIN-09/FIN-10) ===================== */

function Despesas() {
  const { data, loading, error, reload } = useFetch(() =>
    FinanceiroAdminService.listDespesas(),
  );
  const [formOpen, setFormOpen] = useState(false);
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

  function exportar() {
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
          <Button
            variant="secondary"
            size="sm"
            onClick={exportar}
            disabled={despesas.length === 0}
          >
            <Download size={16} /> Exportar Excel
          </Button>
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus size={16} /> Nova despesa
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
                <Plus size={16} /> Nova despesa
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
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Remover despesa"
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
  onCancel,
  onSaved,
}: {
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
    defaultValues: { descricao: "", categoria: "", data: "" },
  });

  async function onSubmit(values: DespesaFormData) {
    setSubmitError(null);
    try {
      await FinanceiroAdminService.createDespesa(values);
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
      <div style={{ display: "flex", gap: 12 }}>
        <Input
          label="Valor (R$)"
          type="number"
          step="0.01"
          min={0}
          placeholder="0,00"
          error={errors.valor?.message}
          {...register("valor", { valueAsNumber: true })}
        />
        <Input
          label="Data"
          type="date"
          error={errors.data?.message}
          {...register("data")}
        />
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
          {isSubmitting ? "Salvando…" : "Lançar despesa"}
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

  function exportar() {
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
        <div style={{ marginLeft: "auto" }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={exportar}
            disabled={lista.length === 0}
          >
            <Download size={16} /> Exportar Excel
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
    </>
  );
}
