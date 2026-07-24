import type { ReactNode } from "react";
import { Hammer } from "lucide-react";
import styles from "./admin.module.css";

/** Placeholder de tela admin ainda não implementada (nav sem 404). */
export function ComingSoon({
  title,
  epic,
  icon,
}: {
  title: string;
  epic: string;
  icon?: ReactNode;
}) {
  return (
    <div className={styles.page}>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>{title}</h1>
          <p className={styles.pageSub}>{epic}</p>
        </div>
      </div>
      <div className={styles.card}>
        <div className={styles.state}>
          <span className={styles.stateIcon}>
            {icon ?? <Hammer size={24} />}
          </span>
          <div className={styles.stateTitle}>Em construção</div>
          <p className={styles.stateText}>
            Esta área faz parte de um próximo épico do roadmap.
          </p>
        </div>
      </div>
    </div>
  );
}
