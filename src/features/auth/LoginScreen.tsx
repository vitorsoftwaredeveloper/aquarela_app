"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { confirmResetPassword, resetPassword } from "aws-amplify/auth";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Droplet,
  GraduationCap,
  KeyRound,
  Lock,
  Mail,
  Shield,
  Users,
} from "lucide-react";
import type { Role } from "@/types/user";
import { Button, Input } from "@/components";
import { useAuth } from "@/contexts/AuthContext";
import { HOME_BY_ROLE } from "@/types/user";
import {
  forgotConfirmSchema,
  forgotRequestSchema,
  loginSchema,
  newPasswordSchema,
  type ForgotConfirmFormData,
  type ForgotRequestFormData,
  type LoginFormData,
  type NewPasswordFormData,
} from "@/schemas/auth";
import { authErrorMessage } from "./authErrors";
import styles from "./auth.module.css";

type Mode = "login" | "newPassword" | "forgotRequest" | "forgotConfirm";

const DEMO_ROLES: {
  role: Role;
  label: string;
  icon: React.ReactNode;
  bg: string;
  fg: string;
}[] = [
  {
    role: "admin",
    label: "Admin",
    icon: <Shield size={18} />,
    bg: "#EAF3FC",
    fg: "#2F7FCB",
  },
  {
    role: "professor",
    label: "Professor",
    icon: <GraduationCap size={18} />,
    bg: "#E7F7F1",
    fg: "#2E9E7B",
  },
  {
    role: "responsavel",
    label: "Responsável",
    icon: <Users size={18} />,
    bg: "#FBEAF3",
    fg: "#C0468A",
  },
];

export function LoginScreen() {
  const {
    login,
    confirmNewPassword,
    isAuthenticated,
    role,
    isDevMode,
    devLogin,
  } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("login");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState("");

  // Já autenticado (ou logou agora): manda para a home do papel.
  useEffect(() => {
    if (!isAuthenticated) return;
    if (role) {
      router.replace(HOME_BY_ROLE[role]);
    } else {
      // Logou, mas sem papel (sem grupo no Cognito nem /me no banco).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(
        "Login efetuado, mas sua conta ainda não tem um papel (admin, professor ou responsável). Peça à administração para vincular seu grupo/usuário.",
      );
    }
  }, [isAuthenticated, role, router]);

  function switchMode(next: Mode) {
    setError(null);
    setNotice(null);
    setMode(next);
  }

  async function handleLogin({ email, password }: LoginFormData) {
    setError(null);
    setNotice(null);
    try {
      const step = await login(email, password);
      if (!step.done && step.challenge === "NEW_PASSWORD") {
        setPendingEmail(email);
        switchMode("newPassword");
      } else if (!step.done) {
        setError("Este método de login ainda não é suportado.");
      }
      // step.done → o efeito acima redireciona.
    } catch (err) {
      console.error("[auth] falha no login:", err);
      setError(authErrorMessage(err));
    }
  }

  async function handleNewPassword({ password }: NewPasswordFormData) {
    setError(null);
    try {
      const step = await confirmNewPassword(password);
      if (!step.done)
        setError("Não foi possível definir a senha. Tente de novo.");
    } catch (err) {
      setError(authErrorMessage(err));
    }
  }

  async function handleForgotRequest({ email }: ForgotRequestFormData) {
    setError(null);
    try {
      await resetPassword({ username: email });
      setPendingEmail(email);
      setNotice("Enviamos um código de verificação para o seu e-mail.");
      setMode("forgotConfirm");
    } catch (err) {
      setError(authErrorMessage(err));
    }
  }

  async function handleForgotConfirm({
    code,
    password,
  }: ForgotConfirmFormData) {
    setError(null);
    try {
      await confirmResetPassword({
        username: pendingEmail,
        confirmationCode: code,
        newPassword: password,
      });
      setNotice("Senha redefinida! Entre com a nova senha.");
      setMode("login");
    } catch (err) {
      setError(authErrorMessage(err));
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.headerMark}>
            <Droplet size={30} fill="#fff" strokeWidth={0} />
          </div>
          <div className={styles.headerTitle}>Aquarela Kids</div>
          <div className={styles.headerSub}>
            A agenda diária do seu filho,
            <br />
            do jeitinho que ele merece.
          </div>
        </div>

        <div className={styles.body}>
          {mode !== "login" && (
            <button
              type="button"
              className={styles.back}
              onClick={() => switchMode("login")}
            >
              <ArrowLeft size={16} /> Voltar ao login
            </button>
          )}

          {notice && (
            <div className={styles.notice}>
              <CheckCircle2 size={18} />
              <span>{notice}</span>
            </div>
          )}
          {error && (
            <div className={styles.alert} role="alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {mode === "login" && (
            <LoginForm
              onSubmit={handleLogin}
              onForgot={() => switchMode("forgotRequest")}
            />
          )}
          {mode === "newPassword" && (
            <NewPasswordForm onSubmit={handleNewPassword} />
          )}
          {mode === "forgotRequest" && (
            <ForgotRequestForm
              defaultEmail={pendingEmail}
              onSubmit={handleForgotRequest}
            />
          )}
          {mode === "forgotConfirm" && (
            <ForgotConfirmForm onSubmit={handleForgotConfirm} />
          )}

          {mode === "login" && isDevMode && (
            <div className={styles.demo}>
              <div className={styles.demoDivider}>
                <span>entrar como (demo)</span>
              </div>
              <div className={styles.demoGrid}>
                {DEMO_ROLES.map((d) => (
                  <button
                    key={d.role}
                    type="button"
                    className={styles.demoBtn}
                    onClick={() => devLogin(d.role)}
                  >
                    <span
                      className={styles.demoIcon}
                      style={{ background: d.bg, color: d.fg }}
                    >
                      {d.icon}
                    </span>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === "login" && (
            <div className={styles.footer}>
              <Button
                href="/simulador"
                variant="secondary"
                className={styles.simBtn}
              >
                <KeyRound size={16} /> Simular mensalidade
              </Button>
              <div className={styles.footerNote}>
                Ainda não é da Aquarela?{" "}
                <Link href="/#planos">Agende uma visita</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Sub-formulários (cada um com seu useForm) ---------------- */

function LoginForm({
  onSubmit,
  onForgot,
}: {
  onSubmit: (d: LoginFormData) => Promise<void>;
  onForgot: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: yupResolver(loginSchema) });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className={styles.formTitle}>Entrar na conta</div>
      <p className={styles.formHint}>
        Acesse a agenda e o financeiro do seu filho.
      </p>
      <div className={styles.fields}>
        <Input
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="voce@email.com"
          leftIcon={<Mail size={18} />}
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Senha"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          leftIcon={<Lock size={18} />}
          error={errors.password?.message}
          {...register("password")}
        />
      </div>
      <button type="button" className={styles.forgotLink} onClick={onForgot}>
        Esqueci minha senha
      </button>
      <Button type="submit" className={styles.submit} disabled={isSubmitting}>
        {isSubmitting ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}

function NewPasswordForm({
  onSubmit,
}: {
  onSubmit: (d: NewPasswordFormData) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordFormData>({
    resolver: yupResolver(newPasswordSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className={styles.formTitle}>Crie sua senha</div>
      <p className={styles.formHint}>
        Primeiro acesso: defina uma senha própria para continuar.
      </p>
      <div className={styles.fields}>
        <Input
          label="Nova senha"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          leftIcon={<Lock size={18} />}
          error={errors.password?.message}
          {...register("password")}
        />
        <Input
          label="Confirmar senha"
          type="password"
          autoComplete="new-password"
          placeholder="Repita a senha"
          leftIcon={<Lock size={18} />}
          error={errors.confirm?.message}
          {...register("confirm")}
        />
      </div>
      <Button type="submit" className={styles.submit} disabled={isSubmitting}>
        {isSubmitting ? "Salvando…" : "Definir senha e entrar"}
      </Button>
    </form>
  );
}

function ForgotRequestForm({
  defaultEmail,
  onSubmit,
}: {
  defaultEmail: string;
  onSubmit: (d: ForgotRequestFormData) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotRequestFormData>({
    resolver: yupResolver(forgotRequestSchema),
    defaultValues: { email: defaultEmail },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className={styles.formTitle}>Esqueci minha senha</div>
      <p className={styles.formHint}>
        Informe seu e-mail e enviaremos um código para redefinir a senha.
      </p>
      <div className={styles.fields}>
        <Input
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="voce@email.com"
          leftIcon={<Mail size={18} />}
          error={errors.email?.message}
          {...register("email")}
        />
      </div>
      <Button type="submit" className={styles.submit} disabled={isSubmitting}>
        {isSubmitting ? "Enviando…" : "Enviar código"}
      </Button>
    </form>
  );
}

function ForgotConfirmForm({
  onSubmit,
}: {
  onSubmit: (d: ForgotConfirmFormData) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotConfirmFormData>({
    resolver: yupResolver(forgotConfirmSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className={styles.formTitle}>Redefinir senha</div>
      <p className={styles.formHint}>
        Digite o código recebido por e-mail e crie uma nova senha.
      </p>
      <div className={styles.fields}>
        <Input
          label="Código"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          leftIcon={<KeyRound size={18} />}
          error={errors.code?.message}
          {...register("code")}
        />
        <Input
          label="Nova senha"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          leftIcon={<Lock size={18} />}
          error={errors.password?.message}
          {...register("password")}
        />
        <Input
          label="Confirmar senha"
          type="password"
          autoComplete="new-password"
          placeholder="Repita a senha"
          leftIcon={<Lock size={18} />}
          error={errors.confirm?.message}
          {...register("confirm")}
        />
      </div>
      <Button type="submit" className={styles.submit} disabled={isSubmitting}>
        {isSubmitting ? "Redefinindo…" : "Redefinir senha"}
      </Button>
    </form>
  );
}
