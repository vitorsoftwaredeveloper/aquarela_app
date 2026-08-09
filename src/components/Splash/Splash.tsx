import { LogoFull } from "../Logo/LogoFull";
import styles from "./Splash.module.css";

interface SplashProps {
  /** Texto abaixo do spinner (lido por leitores de tela). */
  label?: string;
  /** Aplica a saída suave (opacidade 0) antes de desmontar. */
  fadingOut?: boolean;
  /**
   * Splash de boot (restauração da sessão). Só ele obedece ao `data-session`
   * do SessionScript — os demais usos (redirecionamento, guarda de papel)
   * acontecem depois do load e devem aparecer mesmo para quem entrou sem sessão.
   */
  boot?: boolean;
}

/**
 * Tela de carregamento da marca: logo Aquarela + spinner, cobrindo a viewport.
 * Usada enquanto a sessão do usuário é restaurada e enquanto o redirecionamento
 * por papel acontece — evita mostrar landing/login e "puxar" a tela do usuário
 * logado um instante depois.
 */
export function Splash({
  label = "Carregando…",
  fadingOut = false,
  boot = false,
}: SplashProps) {
  const className = [
    styles.overlay,
    boot && styles.boot,
    fadingOut && styles.out,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={className}
      role="status"
      aria-live="polite"
      aria-busy={!fadingOut}
    >
      <div className={styles.mark}>
        <LogoFull maxWidth={230} />
      </div>
      <div className={styles.status}>
        <span className={styles.spinner} aria-hidden />
        <span className={styles.label}>{label}</span>
      </div>
    </div>
  );
}
