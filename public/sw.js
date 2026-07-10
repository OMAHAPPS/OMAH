// LISTEN FOR BACKGROUND PUSH PACKETS EMITTED FROM NODEJS VIA WEB-PUSH

self.addEventListener('push', (event) => {
  if (event.data) {
    const payload = event.data.json();

    const optionsMessage = {
      body: payload.body,
      icon: payload.icon || 'https://pub-4d616d04d586465385a8e29f389675d7.r2.dev/feed-images/1781109238815-Xikika_ICON.jpeg',
      badge: '/XIKIKA-KE.png',
      data: payload.data, // Holds context meta fields like roomId
      vibrate: [200],
      actions: [
        { action: 'open_chat', title: 'Reply Now' }
      ]
    }

    const optionsPost = {
      body: payload.body,
      icon: payload.icon || 'https://pub-4d616d04d586465385a8e29f389675d7.r2.dev/feed-images/1781109238815-Xikika_ICON.jpeg',
      badge: '/XIKIKA-KE.png',
      data: payload.data,
      vibrate: [200],
      actions: [
        { action: 'open_post', title: 'View Post' }
      ]
    }

    const optionsFallback = {
       
       body: payload.body || '',
       icon: payload.icon || 'https://pub-4d616d04d586465385a8e29f389675d7.r2.dev/feed-images/1781109238815-Xikika_ICON.jpeg',
       badge: '/XIKIKA-KE.png',
       data: payload.data,
      vibrate: [200],
      actions: [
        { action: 'open_web', title: 'View' }
      ]
    }

    // Route to specialized handlers based on the payload type
    switch (payload.type) {
      case 'MESSAGE':
        event.waitUntil(self.registration.showNotification(payload.title, optionsMessage));
        break;
      case 'NEW_POST':
        event.waitUntil(self.registration.showNotification(payload.title, optionsPost));
        break;
      default:
        event.waitUntil(self.registration.showNotification(payload.title || 'Notification', optionsFallback));
    }

    

    
  }
});


// ACTIONS HANDLER WHEN USER CLICKS BACKGROUND BANNER POPUP
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Close banner alert instantly

  const dataLinkType = event.notification.data 

  if (dataLinkType.route == 'post') {

     const targetPostLink = dataLinkType.postId
     // Search if any existing app browser tabs are already open
     const urlToOpen = new URL(`/post/${targetPostLink}`, self.location.origin).href;

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


  } else if (dataLinkType.route == 'inbox') {

     const targetRoomId = dataLinkType.senderId
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

  }

  
});
