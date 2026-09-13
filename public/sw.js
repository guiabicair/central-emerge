self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Central Emerge", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Central Emerge";
  const options = {
    body: data.body || "",
    icon: "/next.svg",
    badge: "/next.svg",
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const w of windows) {
        if (w.url.includes(url) && "focus" in w) return w.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    }),
  );
});
