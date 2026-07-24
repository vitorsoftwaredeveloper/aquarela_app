import { ArrowRight, Check } from "lucide-react";
import { Button, Container } from "@/components";
import { ConfigPrecosService } from "@/services/configPrecosService";
import {
  SUBTITULO_TIPO,
  formatBRLCompacto,
  inferirModo,
} from "@/features/simulador/precos";
import styles from "./landing.module.css";
import { FEATURE_ITEMS } from "./landing.data";

export async function Pricing() {
  const planosConfig = await ConfigPrecosService.listPlanos();

  return (
    <Container as="section" id="planos" className={styles.section}>
      <div className={styles.sectionHead}>
        <div className={styles.eyebrow}>Planos</div>
        <h2 className={styles.sectionTitle}>Escolha o ritmo da sua família</h2>
        <p className={styles.sectionLead}>
          Valores de referência. A proposta final é definida na visita, sem
          compromisso.
        </p>
      </div>

      <div className={styles.planGrid}>
        {planosConfig.map((p) => {
          // O nome do plano já diz se é mensal ou por diária (mesma regra do
          // simulador) — decide a unidade de preço mostrada aqui também.
          const modo = inferirModo(p.nome);
          const valor =
            modo === "dias"
              ? (p.valorDiario ?? Math.round(p.valorMensal / 30))
              : p.valorMensal;
          // "Mais escolhido" é copy fixa, marcada no plano integral mensal —
          // não vem da API (não há dado de popularidade).
          const featured = p.tipo === "integral" && modo === "meses";
          return (
            <div
              key={p.nome}
              className={`${styles.planCard} ${featured ? styles.planFeatured : ""}`}
            >
              {featured && (
                <div className={styles.planBadge}>Mais escolhido</div>
              )}
              <div className={styles.planName}>{p.nome}</div>
              <div className={styles.planTagline}>
                {SUBTITULO_TIPO[p.tipo]}
              </div>
              <div className={styles.planPrice}>
                <span className={styles.planPriceValue}>
                  {formatBRLCompacto(valor)}
                </span>
                <span className={styles.planPer}>
                  / {modo === "dias" ? "dia" : "mês"}
                </span>
              </div>
              <div className={styles.planItems}>
                {FEATURE_ITEMS[p.tipo].map((it) => (
                  <div key={it} className={styles.planItem}>
                    <span className={styles.planTick}>
                      <Check size={18} />
                    </span>
                    {it}
                  </div>
                ))}
              </div>
              <div className={styles.planCtaWrap}>
                <Button
                  href="#"
                  variant={featured ? "onBrand" : "primary"}
                  style={{ width: "100%" }}
                >
                  Agende uma visita
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.simCta}>
        <span className={styles.simCtaText}>
          Quer simular com dias avulsos ou meses específicos?
        </span>
        <Button href="/simulador" size="sm">
          Abrir simulador <ArrowRight size={16} />
        </Button>
      </div>
    </Container>
  );
}
