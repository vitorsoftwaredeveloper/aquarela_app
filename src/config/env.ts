/**
 * Variáveis de ambiente do cliente. Só usamos prefixo NEXT_PUBLIC_ (nada de
 * segredo no bundle — a fonte da verdade de autorização é o backend).
 */
export const ENV = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL ?? "",
  COGNITO_USER_POOL_ID: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ?? "",
  COGNITO_USER_POOL_CLIENT_ID:
    process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID ?? "",
  COGNITO_REGION: process.env.NEXT_PUBLIC_COGNITO_REGION ?? "us-east-1",
} as const;

/** True quando os IDs do Cognito estão configurados (auth real disponível). */
export const IS_AUTH_CONFIGURED =
  !!ENV.COGNITO_USER_POOL_ID && !!ENV.COGNITO_USER_POOL_CLIENT_ID;

/**
 * Modo de preview/demo: usa login "demo" (sem senha) e fixtures locais no lugar
 * do backend. Liga automaticamente quando não há Cognito NEM API, ou
 * explicitamente com `NEXT_PUBLIC_USE_MOCKS=true` (útil para prever as telas
 * enquanto o backend ainda não está no ar, mesmo com o Cognito já configurado).
 */
export const IS_DEV_DATA =
  process.env.NEXT_PUBLIC_USE_MOCKS === "true" ||
  (!IS_AUTH_CONFIGURED && !ENV.API_BASE_URL);
