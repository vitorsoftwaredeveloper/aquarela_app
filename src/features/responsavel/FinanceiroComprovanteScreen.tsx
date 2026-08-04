"use client";

import { useRouter } from "next/navigation";
import { BackButton, Skeleton } from "@/components";
import { useHideTopbar, useWideContent } from "@/contexts/PageTitleContext";
import { useResponsavel } from "@/contexts/ResponsavelContext";
import { useFetch } from "@/hooks/useFetch";
import { FinanceiroService } from "@/services/financeiroService";
import { ReciboContent } from "./FinanceiroScreen";
import styles from "./responsavel.module.css";

export function FinanceiroComprovanteScreen({
  mensalidadeId,
}: {
  mensalidadeId: string;
}) {
  useHideTopbar();
  useWideContent();
  const router = useRouter();
  const { active, loading: ctxLoading } = useResponsavel();

  const { data, loading } = useFetch(() => {
    if (ctxLoading) return new Promise<never>(() => {});
    return active
      ? FinanceiroService.listMensalidades(active._id)
      : Promise.resolve([]);
  }, [active?._id, ctxLoading]);

  const mensalidade = data?.find((m) => m._id === mensalidadeId) ?? null;

  function voltar() {
    router.back();
  }

  return (
    <div>
      <div className={styles.pushHeader}>
        <BackButton onClick={voltar} />
        <div style={{ flex: 1 }}>
          <div className={styles.pushTitle}>Comprovante</div>
          {active && <div className={styles.pushSub}>{active.nome}</div>}
        </div>
      </div>

      <div className={styles.detailCard}>
        {ctxLoading || (loading && !data) ? (
          <div role="status" aria-label="Carregando…" style={{ width: "100%" }}>
            <Skeleton
              width="100%"
              height={96}
              radius={18}
              style={{ marginBottom: 18 }}
            />
            <Skeleton width="45%" height={13} style={{ marginBottom: 8 }} />
            <Skeleton width="60%" height={26} />
          </div>
        ) : mensalidade && active ? (
          <ReciboContent mensalidade={mensalidade} crianca={active} />
        ) : (
          <div className={styles.state}>
            <span className={styles.emptyBadge}>Não encontrado</span>
            <p>Esse comprovante não está mais disponível.</p>
          </div>
        )}
      </div>
    </div>
  );
}
