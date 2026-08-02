"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText, Lock, Receipt } from "lucide-react";
import { Badge, Button, Select, Tooltip } from "@/components";
import { useFetch } from "@/hooks/useFetch";
import { FinanceiroAdminService } from "@/services/financeiroAdminService";
import { formatBRL } from "@/types/financeiro";
import type { RelatorioAnualCrianca } from "@/types/financeiroAdmin";
import { exportToXlsx } from "@/utils/exportXlsx";
import { exportToPdfTable } from "@/utils/exportPdfTable";
import { EmptyState, ErrorState, TableSkeleton } from "../ListState";
import styles from "../admin.module.css";
import relatorios from "./relatoriosTab.module.css";

const MESES_CURTO = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

const valorDoMes = (crianca: RelatorioAnualCrianca, mes: number): number =>
  crianca.meses.find((m) => m.mes === mes)?.valor ?? 0;

/**
 * Relatório anual de pagamentos por criança × mês. Ano já fechado pelo cron
 * `limparDadosAnoAnterior` vem do snapshot consolidado (`origem`), porque os
 * pagamentos crus daquele ano foram expurgados do banco.
 */
export function RelatoriosTab() {
  const [ano, setAno] = useState(new Date().getFullYear());
  const { data, loading, error, reload } = useFetch(
    () => FinanceiroAdminService.getRelatorioAnual(ano),
    [ano],
  );

  const criancas = data?.criancas ?? [];
  const anos = data?.anosDisponiveis?.length
    ? data.anosDisponiveis
    : [new Date().getFullYear()];

  const totalDoMes = (mes: number): number =>
    criancas.reduce((soma, crianca) => soma + valorDoMes(crianca, mes), 0);

  function exportarExcel() {
    exportToXlsx(
      criancas.map((crianca) => ({
        Criança: crianca.nome,
        Turma: crianca.turmaNome ?? "—",
        ...Object.fromEntries(
          MESES_CURTO.map((label, indice) => [
            label,
            valorDoMes(crianca, indice + 1),
          ]),
        ),
        Total: crianca.total,
      })),
      `relatorio-pagamentos-${ano}.xlsx`,
      String(ano),
    );
  }

  function exportarPdf() {
    exportToPdfTable(
      `Pagamentos por criança — ${ano}`,
      ["Criança", ...MESES_CURTO, "Total"],
      criancas.map((crianca) => [
        crianca.nome,
        ...MESES_CURTO.map((_, indice) => {
          const valor = valorDoMes(crianca, indice + 1);
          return valor ? valor.toFixed(0) : "—";
        }),
        crianca.total.toFixed(0),
      ]),
      `relatorio-pagamentos-${ano}.pdf`,
    );
  }

  return (
    <>
      <div className={relatorios.toolbar}>
        <div className={relatorios.anoField}>
          <Select
            aria-label="Ano do relatório"
            options={anos.map((item) => ({
              value: String(item),
              label: String(item),
            }))}
            value={String(ano)}
            onChange={(event) => setAno(Number(event.target.value))}
          />
        </div>

        {data?.origem === "consolidado" && (
          <Tooltip label="Ano fechado: os pagamentos foram expurgados e este relatório é o histórico consolidado.">
            <span className={relatorios.selo}>
              <Badge tone="neutral">
                <Lock size={12} /> Ano fechado
              </Badge>
            </span>
          </Tooltip>
        )}

        <div className={relatorios.acoes}>
          <Button
            variant="secondary"
            size="sm"
            onClick={exportarPdf}
            disabled={criancas.length === 0}
          >
            <FileText size={16} /> PDF
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={exportarExcel}
            disabled={criancas.length === 0}
          >
            <FileSpreadsheet size={16} /> Excel
          </Button>
        </div>
      </div>

      {data && criancas.length > 0 && (
        <div className={relatorios.kpis}>
          <Kpi label="Recebido no ano" valor={formatBRL(data.totais.pagamentos)} />
          <Kpi label="Despesas no ano" valor={formatBRL(data.totais.despesas)} />
          <Kpi
            label="Saldo"
            valor={formatBRL(data.totais.saldo)}
            tone={data.totais.saldo < 0 ? "danger" : "positivo"}
          />
          <Kpi
            label="Crianças com pagamento"
            valor={String(data.totais.criancasComPagamento)}
          />
          <Kpi label="Ticket médio" valor={formatBRL(data.totais.ticketMedio)} />
        </div>
      )}

      <div className={styles.card}>
        {loading ? (
          <TableSkeleton columns={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : criancas.length === 0 ? (
          <EmptyState
            icon={<Receipt size={24} />}
            title={`Nenhum pagamento em ${ano}`}
            text="Assim que houver pagamentos registrados no ano, eles aparecem aqui."
          />
        ) : (
          <div className={styles.tableWrap}>
            <table className={`${styles.table} ${relatorios.grade}`}>
              <thead>
                <tr>
                  <th className={relatorios.colunaFixa}>Criança</th>
                  {MESES_CURTO.map((label) => (
                    <th key={label} className={relatorios.colunaMes}>
                      {label}
                    </th>
                  ))}
                  <th className={relatorios.colunaMes}>Total</th>
                </tr>
              </thead>
              <tbody>
                {criancas.map((crianca) => (
                  <tr key={crianca.criancaId}>
                    <td className={relatorios.colunaFixa}>
                      <div className={styles.cellName}>{crianca.nome}</div>
                      <div className={styles.cellSub}>
                        {crianca.turmaNome ?? "—"}
                      </div>
                    </td>
                    {MESES_CURTO.map((label, indice) => {
                      const valor = valorDoMes(crianca, indice + 1);
                      return (
                        <td
                          key={label}
                          className={`${relatorios.colunaMes} ${
                            valor ? "" : relatorios.vazio
                          }`}
                        >
                          {valor ? formatBRL(valor) : "—"}
                        </td>
                      );
                    })}
                    <td className={relatorios.total}>
                      {formatBRL(crianca.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className={relatorios.colunaFixa}>Total do mês</td>
                  {MESES_CURTO.map((label, indice) => (
                    <td key={label} className={relatorios.colunaMes}>
                      {formatBRL(totalDoMes(indice + 1))}
                    </td>
                  ))}
                  <td className={relatorios.total}>
                    {formatBRL(data?.totais.pagamentos ?? 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function Kpi({
  label,
  valor,
  tone,
}: {
  label: string;
  valor: string;
  tone?: "positivo" | "danger";
}) {
  return (
    <div className={relatorios.kpi}>
      <span className={relatorios.kpiLabel}>{label}</span>
      <strong
        className={`${relatorios.kpiValor} ${
          tone ? relatorios[tone] : ""
        }`.trim()}
      >
        {valor}
      </strong>
    </div>
  );
}
