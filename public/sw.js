// eitaxi Service Worker - GPS Reminders
const CACHE_NAME = 'eitaxi-v1';
const NOTIFICATION_TAG = 'gps-reminder';

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installed');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Push event - Handle incoming push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  
  const options = {
    body: data.body || '¡No olvides activar tu GPS para recibir clientes!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: NOTIFICATION_TAG,
    renotify: true,
    requireInteraction: true,
    actions: [
      {
        action: 'activate-gps',
        title: '🚀 Activar GPS',
        icon: '/icons/gps-icon.png'
      },
      {
        action: 'dismiss',
        title: 'Más tarde',
        icon: '/icons/dismiss-icon.png'
      }
    ],
    data: {
      url: data.url || '/dashboard',
      driverId: data.driverId
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '🚕 eitaxi', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'activate-gps') {
    // Open the dashboard GPS tab
    event.waitUntil(
      clients.openWindow(event.notification.data.url + '?tab=gps')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    console.log('[SW] Notification dismissed');
  } else {
    // Clicked on notification body
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// Background sync for GPS status check
self.addEventListener('sync', (event) => {
  if (event.tag === 'check-gps-status') {
    event.waitUntil(checkGPSStatus());
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'gps-reminder-sync') {
    event.waitUntil(checkGPSAndNotify());
  }
});

async function checkGPSAndNotify() {
  try {
    // Get GPS status from server
    const clients = await self.clients.matchAll();
    
    // Send reminder notification
    await self.registration.showNotification('🚕 eitaxi', {
      body: '¡Recuerda activar tu GPS para recibir más clientes hoy!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'gps-reminder',
      renotify: true,
      requireInteraction: true,
      vibrate: [200, 100, 200],
      actions: [
        {
          action: 'activate-gps',
          title: '🚀 Activar GPS'
        },
        {
          action: 'dismiss',
          title: 'Más tarde'
        }
      ]
    });
  } catch (error) {
    console.error('[SW] Error checking GPS status:', error);
  }
}
