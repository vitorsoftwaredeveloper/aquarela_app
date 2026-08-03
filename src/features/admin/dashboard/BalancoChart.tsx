"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components";
import { useFetch } from "@/hooks/useFetch";
import { FinanceiroAdminService } from "@/services/financeiroAdminService";
import { ErrorState } from "../ListState";
import styles from "./dashboard.module.css";

/**
 * Entradas × despesas nos 12 meses — barras agrupadas, eixo único.
 *
 * Paleta validada (checks de CVD/contraste em claro e escuro):
 * entradas #6D45C4 · despesas #C7522B.
 */
const COR_ENTRADAS = "#6D45C4";
const COR_DESPESAS = "#C7522B";

function formatCompacto(v: number): string {
  if (v >= 1000) return `${Math.round(v / 1000)}k`;
  return String(v);
}

function formatBRL(v: number): string {
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

/** Arredonda o topo do eixo para um número limpo. */
function escalaMaxima(valores: number[]): number {
  const max = Math.max(...valores, 0);
  if (max <= 0) return 1000;
  // Passo escala com a ordem de grandeza do maior valor — um passo fixo de
  // 10000 deixava barras de meses com valores pequenos (ex.: 1) invisíveis
  // (altura de 0,01%), mesmo que o mês tivesse entrada/despesa real.
  const passo = 10 ** Math.floor(Math.log10(max));
  return Math.ceil(max / passo) * passo;
}

const ANO_MINIMO = 2020;

export function BalancoChart() {
  const [ativo, setAtivo] = useState<number | null>(null);
  const [ano, setAno] = useState(() => new Date().getFullYear());
  const anoAtual = new Date().getFullYear();

  const {
    data: meses,
    loading,
    error,
    reload,
  } = useFetch(
    () => FinanceiroAdminService.getBalanco(String(ano)).then((b) => b.meses),
    [ano],
  );

  const max = escalaMaxima(
    (meses ?? []).flatMap((m) => [m.entradas, m.despesas]),
  );
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));

  return (
    <figure className={styles.chartFigure}>
      <figcaption className={styles.chartHead}>
        <div>
          <h2 className={styles.chartTitle}>Entradas × despesas</h2>
          <p className={styles.chartSub}>
            Balanço mensal do ano · entradas em regime de caixa (data do
            pagamento)
          </p>
        </div>

        <div className={styles.chartHeadRight}>
          <div className={styles.anoSwitcher}>
            <button
              type="button"
              className={styles.anoBtn}
              onClick={() => setAno((a) => Math.max(ANO_MINIMO, a - 1))}
              disabled={ano <= ANO_MINIMO}
              aria-label="Ano anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <span className={styles.anoLabel}>{ano}</span>
            <button
              type="button"
              className={styles.anoBtn}
              onClick={() => setAno((a) => Math.min(anoAtual, a + 1))}
              disabled={ano >= anoAtual}
              aria-label="Próximo ano"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          {/* Legenda sempre presente para 2+ séries (identidade nunca só por cor). */}
          <ul className={styles.legend}>
            <li className={styles.legendItem}>
              <span
                className={styles.legendSwatch}
                style={{ background: COR_ENTRADAS }}
                aria-hidden
              />
              Entradas
            </li>
            <li className={styles.legendItem}>
              <span
                className={styles.legendSwatch}
                style={{ background: COR_DESPESAS }}
                aria-hidden
              />
              Despesas
            </li>
          </ul>
        </div>
      </figcaption>

      {loading ? (
        <Skeleton width="100%" height={220} radius="var(--radius-md)" />
      ) : error || !meses ? (
        <ErrorState message={error ?? "Sem dados."} onRetry={reload} />
      ) : (
        <div className={styles.chartScroll}>
          <div className={styles.plot}>
            {/* Eixo Y + gridlines hairline recessivas */}
            <div className={styles.yAxis}>
              {[...ticks].reverse().map((t, i) => (
                <span key={i} className={styles.yTick}>
                  {formatCompacto(t)}
                </span>
              ))}
            </div>
            <div className={styles.grid}>
              {[...ticks].reverse().map((t, i) => (
                <span key={i} className={styles.gridline} aria-hidden />
              ))}

              <div className={styles.groups}>
                {meses.map((m, i) => {
                  const saldo = m.entradas - m.despesas;
                  return (
                    <div
                      key={m.mes}
                      className={styles.group}
                      onMouseEnter={() => setAtivo(i)}
                      onMouseLeave={() => setAtivo(null)}
                      onFocus={() => setAtivo(i)}
                      onBlur={() => setAtivo(null)}
                      tabIndex={0}
                      aria-label={`${m.mesLabel}: entradas ${formatBRL(m.entradas)}, despesas ${formatBRL(m.despesas)}`}
                    >
                      {ativo === i && (
                        <div className={styles.tooltip} role="tooltip">
                          <div className={styles.tooltipTitle}>
                            {m.mesLabel}
                          </div>
                          <div className={styles.tooltipRow}>
                            <span
                              className={styles.legendSwatch}
                              style={{ background: COR_ENTRADAS }}
                              aria-hidden
                            />
                            Entradas
                            <b>{formatBRL(m.entradas)}</b>
                          </div>
                          <div className={styles.tooltipRow}>
                            <span
                              className={styles.legendSwatch}
                              style={{ background: COR_DESPESAS }}
                              aria-hidden
                            />
                            Despesas
                            <b>{formatBRL(m.despesas)}</b>
                          </div>
                          <div className={styles.tooltipSaldo}>
                            Saldo <b>{formatBRL(saldo)}</b>
                          </div>
                        </div>
                      )}
                      <div className={styles.groupBars}>
                        <span
                          className={styles.bar}
                          style={{
                            height: `${(m.entradas / max) * 100}%`,
                            background: COR_ENTRADAS,
                          }}
                        />
                        <span
                          className={styles.bar}
                          style={{
                            height: `${(m.despesas / max) * 100}%`,
                            background: COR_DESPESAS,
                          }}
                        />
                      </div>
                      <span className={styles.xTick}>{m.mesLabel}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </figure>
  );
}
