import { Container } from "@/components";
import styles from "./landing.module.css";
import { testimonials } from "./landing.data";

export function Testimonials() {
  return (
    <Container as="section" id="depoimentos" className={styles.section}>
      <div className={styles.sectionHead}>
        <div className={styles.eyebrow}>Depoimentos</div>
        <h2 className={styles.sectionTitle}>Famílias mais perto do dia a dia</h2>
      </div>
      <div className={styles.grid3}>
        {testimonials.map((t) => (
          <figure key={t.name} className={styles.tCard}>
            <div
              className={styles.tStars}
              aria-label={`${t.stars} de 5 estrelas`}
            >
              {"★".repeat(t.stars)}
            </div>
            <blockquote className={styles.tQuote}>
              &ldquo;{t.quote}&rdquo;
            </blockquote>
            <figcaption className={styles.tAuthor}>
              <span className={styles.tAvatar} style={{ background: t.bg }}>
                {t.initials}
              </span>
              <div>
                <div className={styles.tName}>{t.name}</div>
                <div className={styles.tRole}>{t.role}</div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </Container>
  );
}
