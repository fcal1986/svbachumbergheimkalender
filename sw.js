// sw.js – bewusst minimal (kein eigenes Caching).
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
  // Ab 06.10.2026 · 21: Seitenaufrufe (die App selbst = index.html) immer beim Server nachfragen.
  // GitHub Pages erlaubt dem Browser sonst, die Seite 10 Minuten zwischenzuspeichern – wer kurz vor
  // einem Update geöffnet hat, bekam beim nächsten Start noch die alte Version. "no-cache" heißt:
  // gespeicherte Kopie nur nach Rückfrage (unverändert = 304, kaum Datenverbrauch).
  // Alles andere (data/*.json, Bilder) läuft weiter ganz normal am Service Worker vorbei.
  if (e.request.mode !== 'navigate' || e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request.url, { cache: 'no-cache', credentials: 'same-origin' }).catch(() => fetch(e.request)));
});

// Push-Benachrichtigungen (ab 02.10.2026 · 1): Nachricht anzeigen; Antippen öffnet Platzcoach beim Termin.
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Platzcoach', {
    body: d.body || '', tag: d.tag || undefined, renotify: !!d.tag,
    icon: 'icon-192.png', badge: 'icon-192.png', data: { url: d.url || './' },
  }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) {
      if ('focus' in c) { await c.focus(); if ('navigate' in c) { try { await c.navigate(url); } catch (err) {} } return; }
    }
    if (self.clients.openWindow) await self.clients.openWindow(url);
  })());
});
