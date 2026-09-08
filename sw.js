self.addEventListener('push', function(event) {
  let data = {
    title: 'MANGALORE MOVIES',
    message: 'New movie available to watch & download!',
    icon: 'https://i.ibb.co/xtdHs2Zb/1000147633-1.png',
    badge: 'https://i.ibb.co/xtdHs2Zb/1000147633-1.png',
    image: undefined,
    url: self.location.origin
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data.title = payload.title || data.title;
      data.message = payload.message || payload.body || data.message;
      data.image = payload.image || payload.photoUrl || data.image; // Lock screen image
      data.url = payload.link || payload.url || data.url;
    } catch (e) {}
  }

  const options = {
    body: data.message,
    icon: data.icon,
    badge: data.badge,
    image: data.image,
    vibrate: [200, 100, 200, 100, 200],
    tag: 'mangalore-movies',
    renotify: true,
    data: { url: data.url }
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = event.notification.data.url;
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === url && 'focus' in client) { return client.focus(); }
      }
      if (clients.openWindow) { return clients.openWindow(url); }
    })
  );
});