"use client";

import { useMemo, useState } from "react";
import { Banknote, Baby, Search } from "lucide-react";
import { Button, Input, Tooltip } from "@/components";
import { useFetch } from "@/hooks/useFetch";
import { CriancasAdminService } from "@/services/criancasAdmin";
import type { CriancaCadastro } from "@/types/criancaCadastro";
import { EmptyState, ErrorState, TableSkeleton } from "../ListState";
import { FinanceiroCriancaModal } from "./FinanceiroCriancaModal";
import styles from "../admin.module.css";

/** FIN-16 · admin registra pagamento em dinheiro físico recebido pela secretaria. */
export function PagamentosTab() {
  const { data, loading, error, reload } = useFetch(() =>
    CriancasAdminService.list(),
  );
  const [busca, setBusca] = useState("");
  const [financeiroCrianca, setFinanceiroCrianca] =
    useState<CriancaCadastro | null>(null);

  const criancas = useMemo(() => {
    const list = data ?? [];
    const q = busca.trim().toLowerCase();
    return q ? list.filter((c) => c.nome?.toLowerCase().includes(q)) : list;
  }, [data, busca]);

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
          Registre um pagamento recebido em mãos pela secretaria.
        </span>
        {(data?.length ?? 0) > 0 && (
          <div style={{ marginLeft: "auto", maxWidth: 260, width: "100%" }}>
            <Input
              placeholder="Buscar por nome…"
              leftIcon={<Search size={18} />}
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              aria-label="Buscar criança"
            />
          </div>
        )}
      </div>

      <div className={styles.card}>
        {loading ? (
          <TableSkeleton columns={4} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : criancas.length === 0 ? (
          <EmptyState
            icon={<Baby size={24} />}
            title={busca ? "Nenhum resultado" : "Nenhuma criança cadastrada"}
            text={
              busca
                ? "Tente outro nome."
                : "Cadastre crianças para registrar pagamentos."
            }
          />
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Criança</th>
                  <th>Turma</th>
                  <th>Responsável</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {criancas.map((c) => {
                  const resp = c.responsaveis?.[0];
                  return (
                    <tr key={c._id}>
                      <td className={styles.cellName}>{c.nome}</td>
                      <td>{c.turmaNome ?? "—"}</td>
                      <td>
                        <div>{resp?.nome ?? "—"}</div>
                        {resp?.parentesco && (
                          <div className={styles.cellSub}>
                            {resp.parentesco}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          <Tooltip label="Registrar pagamento">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setFinanceiroCrianca(c)}
                            >
                              <Banknote size={14} /> Registrar
                            </Button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FinanceiroCriancaModal
        crianca={financeiroCrianca}
        onClose={() => setFinanceiroCrianca(null)}
      />
    </>
  );
}
