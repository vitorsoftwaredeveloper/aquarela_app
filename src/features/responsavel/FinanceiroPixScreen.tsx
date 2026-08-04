"use client";

import { useRouter } from "next/navigation";
import { BackButton, Skeleton } from "@/components";
import { useHideTopbar, useWideContent } from "@/contexts/PageTitleContext";
import { useResponsavel } from "@/contexts/ResponsavelContext";
import { useFetch } from "@/hooks/useFetch";
import { FinanceiroService } from "@/services/financeiroService";
import { PixContent } from "./FinanceiroScreen";
import styles from "./responsavel.module.css";

export function FinanceiroPixScreen({
  mensalidadeId,
}: {
  mensalidadeId: string;
}) {
  useHideTopbar();
  useWideContent();
  const router = useRouter();
  const { active, loading: ctxLoading } = useResponsavel();

  const { data, loading, reload } = useFetch(() => {
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
          <div className={styles.pushTitle}>Pagamento via PIX</div>
          {active && <div className={styles.pushSub}>{active.nome}</div>}
        </div>
      </div>

      <div className={styles.detailCard}>
        {ctxLoading || (loading && !data) ? (
          <div role="status" aria-label="Carregando…" style={{ width: "100%" }}>
            <Skeleton
              width="55%"
              height={13}
              style={{ margin: "0 auto 16px" }}
            />
            <Skeleton
              width={188}
              height={188}
              radius={18}
              style={{ margin: "0 auto" }}
            />
          </div>
        ) : mensalidade ? (
          <PixContent
            mensalidade={mensalidade}
            onPaid={reload}
            onClose={voltar}
          />
        ) : (
          <div className={styles.state}>
            <span className={styles.emptyBadge}>Não encontrada</span>
            <p>Essa mensalidade não está mais disponível para pagamento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
