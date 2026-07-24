import { Container } from "@/components";
import styles from "./landing.module.css";
import { stats } from "./landing.data";

export function Stats() {
  return (
    <Container as="section" className={styles.stats}>
      <div className={styles.statsInner}>
        {stats.map((s) => (
          <div key={s.label} className={styles.stat}>
            <div className={styles.statNum}>{s.num}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>
    </Container>
  );
}
