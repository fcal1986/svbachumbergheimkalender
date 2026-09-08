// sw.js – bewusst minimal.
// Zweck: Chrome/Android erkennt eine Seite nur dann als "installierbar" (löst
// beforeinstallprompt aus), wenn ein Service Worker registriert ist. Mehr soll
// dieser hier NICHT tun – insbesondere KEIN Caching von data/*.json oder der
// index.html, sonst würden Nutzer nach der Installation veraltete Termine
// sehen, statt immer den aktuellen Stand von GitHub zu bekommen.
self.addEventListener('install', (e) => {
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', (e) => {
  // Bewusst kein event.respondWith(...) -> der Browser lädt ganz normal vom
  // Netz, als gäbe es diesen Service Worker gar nicht. Nur die Registrierung
  // selbst zählt für die Installierbarkeit.
});
