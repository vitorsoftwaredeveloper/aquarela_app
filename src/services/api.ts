import axios from "axios";
import axiosRetry from "axios-retry";
import { fetchAuthSession } from "aws-amplify/auth";
import { ENV } from "@/config/env";

/**
 * Cliente autenticado. O idToken do Cognito é anexado automaticamente pelo
 * interceptor (padrão herdado do resgatar_app). A autorização de fato é do
 * backend — o front só transporta o token.
 */
export const api = axios.create({
  baseURL: ENV.API_BASE_URL,
});

axiosRetry(api, {
  retries: 2,
  retryDelay: axiosRetry.exponentialDelay,
});

api.interceptors.request.use(async (config) => {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Sem sessão (rota pública) — segue sem Authorization.
  }
  return config;
});

/** Cliente público (landing, simulador, registro) — sem token, com retry. */
export const publicApi = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 15000,
});

axiosRetry(publicApi, {
  retries: 2,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) =>
    axiosRetry.isNetworkError(error) || error.response?.status === 503,
});
