// Unregister any existing service worker
self.addEventListener('install', () => {
  self.skipWaiting();
});
self.addEventListener('activate', () => {
  self.clients.claim();
  self.registration.unregister().then(() => {
    console.log('Service Worker unregistered');
  });
});
self.addEventListener('fetch', (event) => {
  // Don't intercept anything - pass through to network
  event.respondWith(fetch(event.request));
});
