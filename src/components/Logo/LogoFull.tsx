import Image from "next/image";
import logoArt from "./aquarela-logo.png";
import styles from "./Logo.module.css";

interface LogoFullProps {
  /** Largura máxima em px; a arte encolhe junto em telas estreitas. */
  maxWidth?: number;
  className?: string;
}

/** Marca Aquarela Kids em arte completa (splash + wordmark), para telas grandes. */
export function LogoFull({ maxWidth = 240, className }: LogoFullProps) {
  return (
    <Image
      src={logoArt}
      alt="Aquarela Kids"
      sizes={`${maxWidth}px`}
      style={{ width: "100%", maxWidth, height: "auto" }}
      className={className ? `${styles.full} ${className}` : styles.full}
      priority
    />
  );
}
