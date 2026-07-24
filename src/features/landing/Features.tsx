import { Container } from "@/components";
import styles from "./landing.module.css";
import { features } from "./landing.data";

export function Features() {
  return (
    <Container as="section" id="recursos" className={styles.section}>
      <div className={styles.sectionHead}>
        <div className={styles.eyebrow}>Tudo em um só app</div>
        <h2 className={styles.sectionTitle}>Menos papel, mais presença</h2>
        <p className={styles.sectionLead}>
          Cada recurso foi pensado para dar tranquilidade às famílias e leveza ao
          dia da escola.
        </p>
      </div>
      <div className={styles.grid3}>
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <article key={f.title} className={styles.featureCard}>
              <div
                className={styles.featureIcon}
                style={{ background: f.bg, color: f.fg }}
              >
                <Icon size={24} />
              </div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </article>
          );
        })}
      </div>
    </Container>
  );
}
