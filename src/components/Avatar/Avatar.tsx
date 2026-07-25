"use client";

import { useState } from "react";
import { iniciaisNome } from "@/types/crianca";
import styles from "./Avatar.module.css";

interface AvatarProps {
  nome: string;
  fotoUrl?: string | null;
  bg?: string;
  size?: number;
  radius?: number | string;
  className?: string;
}

export function Avatar({
  nome,
  fotoUrl,
  bg,
  size = 46,
  radius = 14,
  className,
}: AvatarProps) {
  const [falhou, setFalhou] = useState<string | null>(null);

  const mostrarFoto = !!fotoUrl && falhou !== fotoUrl;
  const style = {
    width: size,
    height: size,
    borderRadius: typeof radius === "number" ? `${radius}px` : radius,
    background: mostrarFoto ? undefined : bg,
    fontSize: Math.max(11, Math.round(size * 0.36)),
  };

  return (
    <span
      className={[styles.avatar, className].filter(Boolean).join(" ")}
      style={style}
    >
      {mostrarFoto ? (
        <img
          key={fotoUrl}
          src={fotoUrl}
          alt={`Foto de ${nome}`}
          className={styles.img}
          onError={() => setFalhou(fotoUrl ?? null)}
        />
      ) : (
        iniciaisNome(nome)
      )}
    </span>
  );
}
