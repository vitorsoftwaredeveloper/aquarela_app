import type { ElementType, ReactNode } from "react";
import styles from "./Container.module.css";

interface ContainerProps {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  id?: string;
}

/** Centraliza o conteúdo no max-width do layout (--content-max). */
export function Container({
  as: Tag = "div",
  children,
  className,
  id,
}: ContainerProps) {
  return (
    <Tag
      id={id}
      className={[styles.container, className].filter(Boolean).join(" ")}
    >
      {children}
    </Tag>
  );
}
