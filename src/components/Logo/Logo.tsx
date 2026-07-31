import Image from "next/image";
import logoArt from "./aquarela-logo.png";
import styles from "./Logo.module.css";

interface LogoProps {
  /** Altura da arte em px. */
  size?: number;
}

/** Marca Aquarela Kids: arte oficial (splash + wordmark), sem fundo. */
export function Logo({ size = 38 }: LogoProps) {
  return (
    <Image
      src={logoArt}
      alt="Aquarela Kids"
      className={styles.mark}
      style={{ height: size, width: "auto" }}
      priority
    />
  );
}
