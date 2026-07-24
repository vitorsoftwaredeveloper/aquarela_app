import { IS_AUTH_CONFIGURED } from "@/config/env";

/** Traduz erros do Amplify/Cognito para mensagens amigáveis (sem jargão). */
export function authErrorMessage(error: unknown): string {
  if (!IS_AUTH_CONFIGURED) {
    return "Login indisponível: o Cognito ainda não foi configurado (INF-02). Defina os IDs em .env.local.";
  }

  const name =
    error && typeof error === "object" && "name" in error
      ? String((error as { name: unknown }).name)
      : "";
  const rawMsg =
    error && typeof error === "object" && "message" in error
      ? String((error as { message: unknown }).message)
      : "";

  switch (name) {
    case "NotAuthorizedException":
      // Cobre senha errada E "auth flow não habilitado"/client com segredo.
      return /flow|secret|SECRET_HASH/i.test(rawMsg)
        ? `Configuração do Cognito: ${rawMsg}`
        : "E-mail ou senha incorretos.";
    case "UserNotFoundException":
      return "Não encontramos uma conta com esse e-mail.";
    case "UserNotConfirmedException":
      return "Sua conta ainda não foi confirmada. Fale com a administração.";
    case "PasswordResetRequiredException":
      return "É preciso redefinir sua senha. Use “Esqueci minha senha”.";
    case "CodeMismatchException":
      return "Código inválido. Confira o que enviamos por e-mail.";
    case "ExpiredCodeException":
      return "O código expirou. Solicite um novo.";
    case "InvalidPasswordException":
      return "Senha fora da política de segurança. Use letras, números e 8+ caracteres.";
    case "InvalidParameterException":
    case "ResourceNotFoundException":
    case "InvalidUserPoolConfigurationException":
      return `Configuração de login inválida: ${rawMsg || name}. Verifique o App Client do Cognito (fluxos de auth habilitados, sem client secret).`;
    case "UserAlreadyAuthenticatedException":
      return "Já existe uma sessão ativa. Recarregue a página e tente de novo.";
    case "LimitExceededException":
    case "TooManyRequestsException":
      return "Muitas tentativas. Aguarde alguns minutos e tente de novo.";
    default:
      // Surfacia a causa real (mensagens do Cognito não são sensíveis).
      return rawMsg
        ? `Não foi possível entrar: ${rawMsg}`
        : "Não foi possível concluir agora. Tente novamente em instantes.";
  }
}
