import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type Messaging,
  type MessagePayload,
} from "firebase/messaging";
import { ENV, IS_PUSH_CONFIGURED } from "@/config/env";

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

async function getMessagingInstance(): Promise<Messaging | null> {
  if (!IS_PUSH_CONFIGURED || typeof window === "undefined") return null;
  if (!(await isSupported())) return null;

  if (!app) {
    app = getApps()[0] ?? initializeApp(ENV.FIREBASE);
  }
  if (!messaging) {
    messaging = getMessaging(app);
  }
  return messaging;
}

/**
 * Token FCM do dispositivo. Registra o service worker (`firebase-messaging-sw.js`,
 * raiz do domínio) antes de pedir o token, pra garantir o mesmo `swRegistration`
 * usado no `notificationclick`.
 */
export async function getFcmToken(): Promise<string | null> {
  const instance = await getMessagingInstance();
  if (!instance) return null;

  const swRegistration = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js",
  );

  return getToken(instance, {
    vapidKey: ENV.FIREBASE.vapidKey,
    serviceWorkerRegistration: swRegistration,
  });
}

/** Mensagens recebidas com o app em primeiro plano (o SW só cobre background). */
export async function onForegroundMessage(
  callback: (payload: MessagePayload) => void,
): Promise<() => void> {
  const instance = await getMessagingInstance();
  if (!instance) return () => {};
  return onMessage(instance, callback);
}
