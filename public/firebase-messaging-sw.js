importScripts(
  "https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyAeYJJzDGKrxrTOjgT8Q1o7G1fPNdoyipI",
  authDomain: "aquarela-kids-60bec.firebaseapp.com",
  projectId: "aquarela-kids-60bec",
  storageBucket: "aquarela-kids-60bec.firebasestorage.app",
  messagingSenderId: "210484521892",
  appId: "1:210484521892:web:c85a1f95f48b3ac9e22f31",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? "Aquarela Kids";
  const body = payload.notification?.body ?? "Você tem uma nova atualização.";
  self.registration.showNotification(title, {
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: payload.data ?? {},
    tag: payload.data?.url ?? `${title}|${body}`,
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.postMessage({ type: "notification-click", url });
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(url);
      }),
  );
});
