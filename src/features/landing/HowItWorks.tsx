import { Check } from "lucide-react";
import { Container } from "@/components";
import styles from "./landing.module.css";
import { steps } from "./landing.data";

export function HowItWorks() {
  return (
    <section id="como" className={styles.how}>
      <Container className={styles.howInner}>
        <div>
          <div className={styles.eyebrow}>Como funciona</div>
          <h2 className={styles.sectionTitle} style={{ textAlign: "left" }}>
            Simples para a escola, tranquilo para a família
          </h2>
          <div className={styles.steps}>
            {steps.map((st) => (
              <div key={st.n} className={styles.step}>
                <div className={styles.stepNum}>{st.n}</div>
                <div>
                  <div className={styles.stepTitle}>{st.title}</div>
                  <div className={styles.stepDesc}>{st.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.howMedia}>
          <span className={styles.howArt} aria-hidden>
            🎨
          </span>
          <div className={styles.howBadge}>
            <span className={styles.howBadgeIcon} aria-hidden>
              <Check size={22} />
            </span>
            <div>
              <div className={styles.howBadgeTitle}>
                Registro enviado às 11:20
              </div>
              <div className={styles.howBadgeSub}>
                &ldquo;Almoçou muito bem hoje 🍲&rdquo;
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
