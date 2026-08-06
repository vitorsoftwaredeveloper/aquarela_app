"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { RefreshCw, X } from "lucide-react";
import { Avatar } from "@/components";
import { useResponsavel } from "@/contexts/ResponsavelContext";
import styles from "./responsavel.module.css";

/** Telas cujo conteúdo é o filho da URL — trocar de filho tem que levar a rota
 * junto, senão a tela continua mostrando os dados do filho anterior. */
const ROTA_POR_FILHO = /^\/(recados|agenda|historico)\/[^/]+$/;

/** Filho ativo no topo do shell — presente em toda tela do responsável. A
 * folha vai num portal porque o topbar usa `backdrop-filter`, que vira bloco
 * de contenção e prenderia um overlay `position: fixed` dentro do cabeçalho. */
export function ChildSwitcher() {
  const { criancas, active, activeId, setActive, avatarColors } =
    useResponsavel();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  function selecionar(criancaId: string) {
    setActive(criancaId);
    setOpen(false);
    const secao = pathname.match(ROTA_POR_FILHO)?.[1];
    if (secao) router.replace(`/${secao}/${criancaId}`);
  }

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!active) return null;

  const podeTrocar = criancas.length > 1;
  const chip = (
    <>
      <Avatar
        nome={active.nome}
        fotoUrl={active.fotoUrl}
        bg={avatarColors[active._id]}
        size={34}
      />
      <span className={styles.childChipText}>
        <span className={styles.childChipName}>{active.nome}</span>
        {podeTrocar && (
          <span className={styles.childChipHint}>Trocar de filho</span>
        )}
      </span>
      {podeTrocar && <RefreshCw size={15} className={styles.childChipIcon} />}
    </>
  );

  return (
    <>
      {podeTrocar ? (
        <button
          type="button"
          className={styles.childChip}
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          {chip}
        </button>
      ) : (
        <span className={styles.childStatic}>{chip}</span>
      )}

      {open &&
        createPortal(
          <div
            className={styles.sheetOverlay}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <div
              className={styles.sheet}
              role="dialog"
              aria-modal="true"
              aria-label="Trocar de filho"
            >
              <span className={styles.sheetHandle} aria-hidden />
              <div className={styles.sheetHead}>
                <span className={styles.sheetTitle}>Trocar de filho</span>
                <button
                  type="button"
                  className={styles.sheetClose}
                  onClick={() => setOpen(false)}
                  aria-label="Fechar"
                >
                  <X size={18} />
                </button>
              </div>
              <div className={styles.sheetBody}>
                {criancas.map((c) => {
                  const isActive = c._id === activeId;
                  return (
                    <button
                      key={c._id}
                      className={`${styles.profChild} ${isActive ? styles.profChildActive : ""}`}
                      onClick={() => selecionar(c._id)}
                    >
                      <Avatar
                        nome={c.nome}
                        fotoUrl={c.fotoUrl}
                        bg={avatarColors[c._id]}
                        size={46}
                      />
                      <span className={styles.childRowText}>
                        <span className={styles.childRowName}>{c.nome}</span>
                        <span className={styles.childRowSub}>{c.sub}</span>
                      </span>
                      {isActive && (
                        <span className={styles.emptyBadge}>Ativo</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
