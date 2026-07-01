// LISTEN FOR BACKGROUND PUSH PACKETS EMITTED FROM NODEJS VIA WEB-PUSH

self.addEventListener('push', (event) => {
  if (event.data) {
    const payload = event.data.json();

    const options = {
      body: payload.body,
      icon: payload.icon || 'https://pub-4d616d04d586465385a8e29f389675d7.r2.dev/feed-images/1781109238815-Xikika_ICON.jpeg',
      badge: 'https://pub-4d616d04d586465385a8e29f389675d7.r2.dev/feed-images/1781109238815-Xikika_ICON.jpeg',
      data: payload.data, // Holds context meta fields like roomId
      vibrate: [200],
      actions: [
        { action: 'open_chat', title: 'Reply Now' }
      ]
    };

    // Force system notification banner deployment
    event.waitUntil(
      self.registration.showNotification(payload.title, options)
    );
  }
});


// ACTIONS HANDLER WHEN USER CLICKS BACKGROUND BANNER POPUP
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Close banner alert instantly

  const targetRoomId = event.notification.data.senderId; // Extract roomId from notification data

  // Search if any existing app browser tabs are already open
  const urlToOpen = new URL(`/inbox/${targetRoomId}`, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a tab is open, focus it and redirect its location hash room window pointer
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If no tabs are open, open a brand new window tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
