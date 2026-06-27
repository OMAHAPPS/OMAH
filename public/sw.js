// This event intercepts system notifications pushed from your server while offline
self.addEventListener('push', (event) => {

  if (!event.data) return;

     // Extract the JSON payload payload sent from Node.js
     const data = event.data.json()

     const options = {
           body: data.body,
           icon: 'https://pub-4d616d04d586465385a8e29f389675d7.r2.dev/feed-images/1781109238815-Xikika_ICON.jpeg',
           badge: 'https://pub-4d616d04d586465385a8e29f389675d7.r2.dev/feed-images/1781109238815-Xikika_ICON.jpeg',
           vibrate: [200], // Vibrate pattern for mobile devices
           data: { url: data.url }  // Custom payload metadata
     }

     // Keep worker alive until operating system renders the push container
     event.waitUntil(
         self.registration.showNotification(data.title, options)
     )
})

// Handles click targeting on system notification cards
self.addEventListener('notificationclick', (event) => {

     event.notification.close();

     event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {

           // If the tab is already running in memory, focus it
           for (const client of clientList) {

               if (client.url === event.notification.data.url && 'focus' in client) {
                       return client.focus();
                }
            }

           // If closed completely, spawn a fresh window process
           if (clients.openWindow) {
               return clients.openWindow(event.notification.data.url);
            }
        })
    )
})
