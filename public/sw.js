// Minimal service worker — required by Chrome for the PWA install prompt.
// Does not cache anything; the app always loads fresh from the network.
self.addEventListener("install",  () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
