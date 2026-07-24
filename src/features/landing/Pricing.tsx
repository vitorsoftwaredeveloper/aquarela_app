import { ArrowRight, Check } from "lucide-react";
import { Button, Container } from "@/components";
import styles from "./landing.module.css";
import { plans } from "./landing.data";

export function Pricing() {
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
        {plans.map((p) => (
          <div
            key={p.name}
            className={`${styles.planCard} ${p.featured ? styles.planFeatured : ""}`}
          >
            {p.badge && <div className={styles.planBadge}>{p.badge}</div>}
            <div className={styles.planName}>{p.name}</div>
            <div className={styles.planTagline}>{p.tagline}</div>
            <div className={styles.planPrice}>
              <span className={styles.planPriceValue}>{p.price}</span>
              <span className={styles.planPer}>/ mês</span>
            </div>
            <div className={styles.planItems}>
              {p.items.map((it) => (
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
                variant={p.featured ? "onBrand" : "primary"}
                style={{ width: "100%" }}
              >
                Agende uma visita
              </Button>
            </div>
          </div>
        ))}
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
