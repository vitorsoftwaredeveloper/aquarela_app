import type { CSSProperties } from "react";
import styles from "./Skeleton.module.css";

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  className?: string;
  style?: CSSProperties;
}

/** Placeholder de carregamento (shimmer). Componha com width/height/radius para imitar o conteúdo real. */
export function Skeleton({
  width,
  height,
  radius,
  className,
  style,
}: SkeletonProps) {
  return (
    <span
      className={`${styles.skeleton}${className ? ` ${className}` : ""}`}
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden
    />
  );
}
