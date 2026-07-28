"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Droplet, List, Minus, Plus } from "lucide-react";
import { ConfigPrecosService } from "@/services/configPrecosService";
import { PLANOS_PADRAO, type PlanoConfig } from "@/types/configPrecos";
import {
  PRESETS,
  SUBTITULO_TIPO,
  calcularSimulacao,
  formatBRLCompacto,
  inferirModo,
  type Modo,
  type ResultadoSimulacao,
} from "./precos";
import styles from "./simulador.module.css";

const LIMITES: Record<Modo, { min: number; max: number }> = {
  meses: { min: 1, max: 24 },
  dias: { min: 1, max: 30 },
};

export function SimuladorScreen() {
  // Planos-base são instantâneos; a lista pública (com valores e descontos
  // reais do admin) chega logo em seguida e substitui.
  const [planos, setPlanos] = useState<PlanoConfig[]>(PLANOS_PADRAO);
  const [planoNome, setPlanoNome] = useState(PLANOS_PADRAO[0].nome);
  const [modo, setModo] = useState<Modo>("meses");
  const [qtd, setQtd] = useState(6);

  useEffect(() => {
    let cancelado = false;
    const nomeInicial = PLANOS_PADRAO[0].nome;
    ConfigPrecosService.listPlanos().then((lista) => {
      if (cancelado || lista.length === 0) return;
      const escolhido = lista.some((p) => p.nome === nomeInicial)
        ? nomeInicial
        : lista[0].nome;
      setPlanos(lista);
      setPlanoNome(escolhido);
      setModo(inferirModo(escolhido));
    });
    return () => {
      cancelado = true;
    };
  }, []);

  const plano = planos.find((p) => p.nome === planoNome) ?? planos[0];
  const resultado = useMemo<ResultadoSimulacao>(
    () => calcularSimulacao(plano, modo, qtd),
    [plano, modo, qtd],
  );

  const unidade = modo === "meses" ? "meses" : "dias";
  const unidadeSing = modo === "meses" ? "mês" : "dia";
  const limites = LIMITES[modo];

  function trocarModo(next: Modo) {
    setModo(next);
    setQtd(next === "meses" ? 6 : 10);
  }

  function selecionarPlano(nome: string) {
    setPlanoNome(nome);
    const modoDoPlano = inferirModo(nome);
    if (modoDoPlano !== modo) trocarModo(modoDoPlano);
  }

  function ajustar(delta: number) {
    setQtd((q) => Math.min(limites.max, Math.max(limites.min, q + delta)));
  }

  const presets = PRESETS[modo];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.back} aria-label="Voltar">
            <ChevronLeft size={20} />
          </Link>
          <span className={styles.headerTitle}>Simulador de mensalidade</span>
        </div>
      </header>

      <div className={styles.body}>
        <div className={styles.intro}>
          <div className={styles.introTitle}>Quanto ficaria?</div>
          <div className={styles.introSub}>Simulação sem compromisso.</div>
        </div>

        {/* Plano */}
        <div className={styles.sectionTitle}>Plano</div>
        <div className={styles.planos}>
          {planos.map((p) => (
            <button
              key={p.nome}
              type="button"
              aria-pressed={planoNome === p.nome}
              className={`${styles.plano} ${planoNome === p.nome ? styles.planoOn : ""}`}
              onClick={() => selecionarPlano(p.nome)}
            >
              <div className={styles.planoLabel}>{p.nome}</div>
              <div className={styles.planoSub}>{SUBTITULO_TIPO[p.tipo]}</div>
            </button>
          ))}
        </div>

        {/* Modo */}
        <div className={styles.sectionTitle}>Como quer calcular?</div>
        <div className={styles.segmented}>
          {(["meses", "dias"] as Modo[]).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={modo === m}
              className={`${styles.segment} ${modo === m ? styles.segmentOn : ""}`}
              onClick={() => trocarModo(m)}
            >
              {m === "meses" ? "Por meses" : "Dias avulsos"}
            </button>
          ))}
        </div>

        {/* Quantidade */}
        <div className={styles.sectionTitle}>Quantidade de {unidade}</div>
        <div className={styles.counterRow}>
          <button
            type="button"
            className={styles.counterBtn}
            onClick={() => ajustar(-1)}
            disabled={qtd <= limites.min}
            aria-label={`Menos um ${unidadeSing}`}
          >
            <Minus size={18} />
          </button>
          <div className={styles.counterBox}>
            <input
              className={styles.counterInput}
              inputMode="numeric"
              value={qtd}
              onChange={(e) => {
                const n = Number(e.target.value.replace(/\D/g, ""));
                setQtd(
                  Number.isNaN(n)
                    ? limites.min
                    : Math.min(
                        limites.max,
                        Math.max(limites.min, n || limites.min),
                      ),
                );
              }}
              aria-label={`Quantidade de ${unidade}`}
            />
            <span className={styles.counterUnit}>{unidade}</span>
          </div>
          <button
            type="button"
            className={styles.counterBtn}
            onClick={() => ajustar(1)}
            disabled={qtd >= limites.max}
            aria-label={`Mais um ${unidadeSing}`}
          >
            <Plus size={18} />
          </button>
        </div>
        <div className={styles.presets}>
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={qtd === p}
              className={`${styles.preset} ${qtd === p ? styles.presetOn : ""}`}
              onClick={() => setQtd(p)}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Resultado */}
        <div className={styles.result}>
          <div className={styles.resultTop}>
            <div>
              <div className={styles.resultLabel}>Por {unidadeSing}</div>
              <div className={styles.resultValue}>
                {formatBRLCompacto(resultado.porUnidade)}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className={styles.resultTotalLabel}>
                Total · {qtd} {qtd === 1 ? unidadeSing : unidade}
              </div>
              <div className={styles.resultTotal}>
                {formatBRLCompacto(resultado.total)}
              </div>
            </div>
          </div>
          {resultado.economia > 0 && (
            <div className={styles.saving}>
              <Droplet size={15} fill="#fff" strokeWidth={0} />
              Economia de {formatBRLCompacto(resultado.economia)}
              {resultado.descontoRotulo
                ? ` no ${resultado.descontoRotulo}`
                : ""}
            </div>
          )}
        </div>

        <Link href="/#planos" className={styles.cta}>
          <List size={18} /> Ver planos
        </Link>
        <p className={styles.disclaimer}>
          Valores de referência para simulação.
          <br />A proposta final é definida na visita.
        </p>
      </div>
    </div>
  );
}
