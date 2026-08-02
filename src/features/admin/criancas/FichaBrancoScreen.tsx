"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components";
import adminStyles from "../admin.module.css";
import styles from "./ficha.module.css";

function formatDataHora(data: Date): string {
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** OPS-04 · Ficha em branco — mesmo layout da ficha de cadastro, sem dados, para preencher à mão antes do cadastro digital. */
export function FichaBrancoScreen() {
  const router = useRouter();

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <Button variant="secondary" onClick={() => router.back()}>
          <ArrowLeft size={16} />
          Voltar
        </Button>
        <Button onClick={() => window.print()}>
          <Printer size={16} />
          Imprimir
        </Button>
      </div>

      <div className={styles.paper}>
        <div className={styles.docHead}>
          <div>
            <p className={styles.docTitle}>Ficha de Cadastro</p>
            <p className={styles.docSub}>
              Aquarela Kids — uso interno · preenchimento manual
            </p>
          </div>
          <p className={styles.docSub}>
            Gerado em {formatDataHora(new Date())}
          </p>
        </div>

        <div className={styles.section}>
          <p className={styles.sectionTitle}>Identificação</p>
          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Nome completo</span>
              <span className={styles.blankLine} />
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Data de nascimento</span>
              <span className={styles.blankLine} />
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>CPF</span>
              <span className={styles.blankLine} />
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Turma</span>
              <span className={styles.blankLine} />
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <p className={styles.sectionTitle}>Responsáveis</p>
          {[1, 2].map((n) => (
            <div key={n} className={styles.responsavelCard}>
              <div className={styles.responsavelHead}>
                <span className={styles.responsavelNome}>
                  Responsável {n}
                </span>
              </div>
              <div className={styles.fieldGrid}>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Nome</span>
                  <span className={styles.blankLine} />
                </div>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Parentesco</span>
                  <span className={styles.blankLine} />
                </div>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Telefone</span>
                  <span className={styles.blankLine} />
                </div>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>E-mail</span>
                  <span className={styles.blankLine} />
                </div>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>CPF</span>
                  <span className={styles.blankLine} />
                </div>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Pode retirar a criança</span>
                  <span className={styles.checkboxMark} aria-hidden /> Sim
                  &nbsp;&nbsp;
                  <span className={styles.checkboxMark} aria-hidden /> Não
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.section}>
          <p className={styles.sectionTitle}>Saúde</p>
          <div className={styles.field} style={{ marginBottom: 10 }}>
            <span className={styles.fieldLabel}>Alergias</span>
            <span className={styles.blankLine} />
          </div>
          <div className={styles.field} style={{ marginBottom: 10 }}>
            <span className={styles.fieldLabel}>Restrições alimentares</span>
            <span className={styles.blankLine} />
          </div>
          <div className={styles.field} style={{ marginBottom: 10 }}>
            <span className={styles.fieldLabel}>
              Medicações contínuas (nome, dose, horário)
            </span>
            <span className={styles.blankBox} />
          </div>
          <div className={styles.field} style={{ marginBottom: 10 }}>
            <span className={styles.fieldLabel}>
              Condições atípicas (opcional)
            </span>
            <span className={styles.blankLine} />
          </div>
          <div className={styles.field} style={{ marginBottom: 10 }}>
            <span className={styles.fieldLabel}>
              Cuidados especiais (opcional)
            </span>
            <span className={styles.blankLine} />
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Observações (opcional)</span>
            <span className={styles.blankBox} />
          </div>
        </div>

        <div className={styles.section}>
          <p className={styles.sectionTitle}>Financeiro</p>
          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Valor da mensalidade</span>
              <span className={styles.blankLine} />
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Dia de vencimento</span>
              <span className={styles.blankLine} />
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <p className={styles.sectionTitle}>Consentimentos</p>
          <div className={styles.checkboxRow}>
            <span>
              <span className={styles.checkboxMark} aria-hidden />
              Autorizo o tratamento dos dados desta ficha pela Aquarela Kids,
              conforme a LGPD.
            </span>
          </div>
        </div>

        <div className={styles.signatureRow}>
          <div className={styles.signatureField}>
            <span className={styles.fieldLabel}>Assinatura do responsável</span>
            <span className={styles.blankLine} />
          </div>
          <div className={styles.signatureField} style={{ maxWidth: 160 }}>
            <span className={styles.fieldLabel}>Data</span>
            <span className={styles.blankLine} />
          </div>
        </div>

        <div className={styles.footer}>
          Documento para preenchimento manual — os dados serão digitados no
          cadastro do sistema pela secretaria. Contém informação sensível
          protegida pela LGPD assim que preenchido.
        </div>
      </div>
    </div>
  );
}
