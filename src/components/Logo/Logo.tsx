import { Droplet } from "lucide-react";
import styles from "./Logo.module.css";

interface LogoProps {
  /** Tamanho do ícone da gota em px. */
  size?: number;
  /** Oculta o nome (só a marca). */
  markOnly?: boolean;
}

/** Marca Aquarela Kids: gota em gradiente + wordmark. */
export function Logo({ size = 38, markOnly = false }: LogoProps) {
  return (
    <span className={styles.logo}>
      <span
        className={styles.mark}
        style={{ width: size, height: size }}
        aria-hidden
      >
        <Droplet size={size * 0.55} fill="#fff" strokeWidth={0} />
      </span>
      {!markOnly && <span className={styles.word}>Aquarela Kids</span>}
    </span>
  );
}
