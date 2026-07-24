import { Amplify } from "aws-amplify";
import { ENV, IS_AUTH_CONFIGURED } from "./env";

/**
 * Configura o Amplify (Cognito) uma única vez. Chamado no provider raiz do
 * cliente. Enquanto os IDs do Cognito não estiverem no ambiente (épico INF-02),
 * a configuração é ignorada — o app sobe e a landing/simulador funcionam sem login.
 */
let configured = false;

export function configureAmplify(): void {
  if (configured || !IS_AUTH_CONFIGURED) return;

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: ENV.COGNITO_USER_POOL_ID,
        userPoolClientId: ENV.COGNITO_USER_POOL_CLIENT_ID,
        loginWith: { email: true },
      },
    },
  });

  configured = true;
}
