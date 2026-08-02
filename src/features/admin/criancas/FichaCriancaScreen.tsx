"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer, ShieldAlert, KeyRound } from "lucide-react";
import { Avatar, Button } from "@/components";
import { useFetch } from "@/hooks/useFetch";
import { CriancasAdminService } from "@/services/criancasAdmin";
import { idadeEmAnos } from "@/types/criancaCadastro";
import { isoParaDataBr } from "@/utils/dataBr";
import { maskCPF, maskPhone } from "@/utils/cpf";
import { ErrorState } from "../ListState";
import adminStyles from "../admin.module.css";
import styles from "./ficha.module.css";

function formatDataHora(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatReais(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function FichaCriancaScreen({ criancaId }: { criancaId: string }) {
  const router = useRouter();
  const { data: crianca, loading, error, reload } = useFetch(
    () => CriancasAdminService.getById(criancaId),
    [criancaId],
  );

  const emitidoEm = useMemo(() => formatDataHora(new Date().toISOString()), []);

  if (loading) {
    return (
      <div className={styles.page}>
        <p style={{ fontSize: 13, color: "var(--text-dim)" }}>Carregando…</p>
      </div>
    );
  }

  if (error || !crianca) {
    return (
      <div className={styles.page}>
        <ErrorState message={error ?? "Criança não encontrada."} onRetry={reload} />
      </div>
    );
  }

  const idade = idadeEmAnos(crianca.dataNascimento);
  const saude = crianca.saude;
  const temAlergia = (saude?.alergias?.length ?? 0) > 0;
  const temRestricao = (saude?.restricoesAlimentares?.length ?? 0) > 0;
  const temMedicacao = (saude?.medicacoesContinuas?.length ?? 0) > 0;
  const temCondicao = (saude?.condicoesAtipicas?.length ?? 0) > 0;
  const temSaudeRelevante =
    temAlergia ||
    temRestricao ||
    temMedicacao ||
    temCondicao ||
    !!saude?.cuidadosEspeciais ||
    !!saude?.observacoes;

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <Button variant="secondary" onClick={() => router.back()}>
          <ArrowLeft size={16} />
          Voltar
        </Button>
        <Button onClick={() => window.print()}>
          <Printer size={16} />
          Imprimir ficha
        </Button>
      </div>

      <div className={styles.paper}>
        <div className={styles.docHead}>
          <div>
            <p className={styles.docTitle}>Ficha de Cadastro</p>
            <p className={styles.docSub}>Aquarela Kids — uso interno</p>
          </div>
          <p className={styles.docSub}>Emitido em {emitidoEm}</p>
        </div>

        <div className={styles.identRow}>
          <Avatar
            nome={crianca.nome}
            fotoUrl={crianca.fotoUrl}
            bg="#f1ecfb"
            size={72}
            radius={16}
          />
          <div>
            <p className={styles.identName}>{crianca.nome}</p>
            <p className={styles.identMeta}>
              {idade !== null ? `${idade} anos` : "Idade não informada"} ·{" "}
              {crianca.turmaNome ?? "Sem turma"}
            </p>
          </div>
        </div>

        <div className={styles.section}>
          <p className={styles.sectionTitle}>Identificação</p>
          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Nome completo</span>
              <span className={styles.fieldValue}>{crianca.nome}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Data de nascimento</span>
              <span className={styles.fieldValue}>
                {isoParaDataBr(crianca.dataNascimento) || "—"}
              </span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>CPF</span>
              <span className={styles.fieldValue}>
                {maskCPF(crianca.cpf ?? "") || "—"}
              </span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Turma</span>
              <span className={styles.fieldValue}>
                {crianca.turmaNome ?? "—"}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <p className={styles.sectionTitle}>Responsáveis</p>
          {crianca.responsaveis.length === 0 ? (
            <p className={styles.emptyHint}>Nenhum responsável vinculado.</p>
          ) : (
            crianca.responsaveis.map((r, i) => (
              <div key={i} className={styles.responsavelCard}>
                <div className={styles.responsavelHead}>
                  <span className={styles.responsavelNome}>{r.nome}</span>
                  {r.podeRetirar && (
                    <span className={styles.podeRetirar}>
                      <KeyRound size={11} />
                      Pode retirar a criança
                    </span>
                  )}
                </div>
                <div className={styles.fieldGrid}>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Parentesco</span>
                    <span className={styles.fieldValue}>
                      {r.parentesco || "—"}
                    </span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Telefone</span>
                    <span className={styles.fieldValue}>
                      {maskPhone(r.telefone ?? "") || "—"}
                    </span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>E-mail</span>
                    <span className={styles.fieldValue}>
                      {r.email || "—"}
                    </span>
                  </div>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>CPF</span>
                    <span className={styles.fieldValue}>
                      {maskCPF(r.cpf ?? "") || "—"}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className={styles.section}>
          <p className={styles.sectionTitle}>Saúde</p>
          {!temSaudeRelevante ? (
            <p className={styles.emptyHint}>
              Nenhuma alergia, restrição ou cuidado especial registrado.
            </p>
          ) : (
            <>
              {temAlergia && (
                <div className={styles.alertBox}>
                  <ShieldAlert size={16} />
                  <span>
                    <b>Alergias:</b> {saude.alergias.join(", ")}
                  </span>
                </div>
              )}
              {temRestricao && (
                <div className={styles.alertBox}>
                  <ShieldAlert size={16} />
                  <span>
                    <b>Restrições alimentares:</b>{" "}
                    {saude.restricoesAlimentares.join(", ")}
                  </span>
                </div>
              )}
              {temMedicacao && (
                <div className={styles.medList} style={{ marginBottom: 10 }}>
                  {saude.medicacoesContinuas.map((m, i) => (
                    <div key={i} className={styles.medItem}>
                      <b>{m.nome}</b> — {m.dose}, às {m.horario}
                      {m.observacao ? ` (${m.observacao})` : ""}
                    </div>
                  ))}
                </div>
              )}
              {temCondicao && (
                <div className={styles.field} style={{ marginBottom: 10 }}>
                  <span className={styles.fieldLabel}>
                    Condições atípicas
                  </span>
                  <span className={styles.fieldValue}>
                    {saude.condicoesAtipicas!.join(", ")}
                  </span>
                </div>
              )}
              {saude.cuidadosEspeciais && (
                <div className={styles.field} style={{ marginBottom: 10 }}>
                  <span className={styles.fieldLabel}>
                    Cuidados especiais
                  </span>
                  <span className={styles.fieldValue}>
                    {saude.cuidadosEspeciais}
                  </span>
                </div>
              )}
              {saude.observacoes && (
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Observações</span>
                  <span className={styles.fieldValue}>
                    {saude.observacoes}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        <div className={styles.section}>
          <p className={styles.sectionTitle}>Financeiro</p>
          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Valor da mensalidade</span>
              <span className={styles.fieldValue}>
                {formatReais(crianca.financeiro?.valorMensalidade ?? 0)}
              </span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Dia de vencimento</span>
              <span className={styles.fieldValue}>
                {crianca.financeiro?.diaVencimento
                  ? `Todo dia ${crianca.financeiro.diaVencimento}`
                  : "—"}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <p className={styles.sectionTitle}>Consentimentos</p>
          <div className={styles.consent}>
            {crianca.consentimentoLgpd?.aceito ? (
              <span>
                ✓ Consentimento LGPD aceito em{" "}
                {formatDataHora(crianca.consentimentoLgpd.aceitoEm)}
              </span>
            ) : (
              <span className={styles.emptyHint}>
                Consentimento LGPD não registrado.
              </span>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          Documento confidencial — contém dados sensíveis protegidos pela
          LGPD. Uso restrito à equipe da unidade.
        </div>
      </div>
    </div>
  );
}
