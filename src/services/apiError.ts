import { AxiosError } from "axios";

interface ApiErrorBody {
  // O backend usa tanto o formato aninhado (`{ error: { code, message } }`)
  // quanto o plano (`{ code, message }`) — cobrimos os dois.
  error?: { code?: string; message?: string };
  code?: string;
  message?: string;
}

/**
 * Extrai uma mensagem amigável do padrão de erro do backend
 * (`{ error: { code, message } }` ou `{ code, message }`) ou de falhas de rede.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = "Não foi possível concluir a operação.",
): string {
  if (error instanceof AxiosError) {
    const body = error.response?.data as ApiErrorBody | undefined;
    if (body?.error?.message) return body.error.message;
    if (body?.message) return body.message;
    if (error.code === "ERR_NETWORK") {
      return "Sem conexão com o servidor. Verifique a API e tente novamente.";
    }
    if (error.response?.status === 409) {
      return "Operação em conflito com o estado atual do registro.";
    }
  }
  return fallback;
}

/** Código HTTP da resposta, quando houver. */
export function getApiErrorStatus(error: unknown): number | undefined {
  return error instanceof AxiosError ? error.response?.status : undefined;
}

/** Código de negócio do backend (ex.: "MENSALIDADE_PAGA"), quando houver. */
export function getApiErrorCode(error: unknown): string | undefined {
  if (error instanceof AxiosError) {
    const body = error.response?.data as ApiErrorBody | undefined;
    return body?.error?.code ?? body?.code;
  }
  return undefined;
}
