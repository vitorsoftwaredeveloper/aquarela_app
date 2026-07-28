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
  FIREBASE: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? "",
  },
} as const;

/** True quando os IDs do Cognito estão configurados (auth real disponível). */
export const IS_AUTH_CONFIGURED =
  !!ENV.COGNITO_USER_POOL_ID && !!ENV.COGNITO_USER_POOL_CLIENT_ID;

/** True quando o Firebase (Web Push/FCM) está configurado — épico I (NOT). */
export const IS_PUSH_CONFIGURED =
  !!ENV.FIREBASE.apiKey && !!ENV.FIREBASE.appId && !!ENV.FIREBASE.vapidKey;

/**
 * Modo de preview/demo: usa login "demo" (sem senha) e fixtures locais no lugar
 * do backend. Liga automaticamente quando não há Cognito NEM API, ou
 * explicitamente com `NEXT_PUBLIC_USE_MOCKS=true` (útil para prever as telas
 * enquanto o backend ainda não está no ar, mesmo com o Cognito já configurado).
 */
export const IS_DEV_DATA =
  process.env.NEXT_PUBLIC_USE_MOCKS === "true" ||
  (!IS_AUTH_CONFIGURED && !ENV.API_BASE_URL);
