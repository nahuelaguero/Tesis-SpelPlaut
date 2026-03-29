declare const self: ServiceWorkerGlobalScope;

self.addEventListener("push", (event: PushEvent) => {
  if (!event.data) return;

  let data: { title?: string; body?: string; url?: string; tag?: string };
  try {
    data = event.data.json();
  } catch {
    data = { title: "Spelplaut", body: event.data.text() };
  }

  const title = data.title || "Spelplaut";
  const options: NotificationOptions = {
    body: data.body || "",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    tag: data.tag || "spelplaut-notification",
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const url: string = (event.notification.data as { url?: string })?.url || "/";
  event.waitUntil(
    (self.clients as Clients).matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      if ((self.clients as Clients & { openWindow: (url: string) => Promise<WindowClient | null> }).openWindow) {
        return (self.clients as Clients & { openWindow: (url: string) => Promise<WindowClient | null> }).openWindow(url);
      }
    })
  );
});
