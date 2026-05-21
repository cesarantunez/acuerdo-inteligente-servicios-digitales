/* Acuerdo Inteligente · Service Worker (v9 network-first + auto-update)
   ESTRATEGIA:
   - Network-first para mismo-origen: el browser SIEMPRE intenta bajar la
     última versión del server. Si no hay red, sirve desde caché (offline).
     Esto evita el problema clásico de PWA "el usuario sigue viendo la
     versión vieja cacheada después del deploy".
   - Auto-skipWaiting + clients.claim: cuando se instala una versión
     nueva del SW, toma control inmediatamente.
   - Notifica a los clientes con `postMessage("RELOAD")` para que
     refresquen automáticamente y vean los cambios sin acción del usuario.
   - Ignora origenes externos (CDNs): los maneja el browser sin SW. */

const CACHE = "acuerdo-inteligente-v9";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./icon.svg",
  "./lib/i18n.js",
  "./lib/messages/es.json",
  "./lib/messages/en.json",
  "./lib/legal/glossary.js",
  "./lib/legal/labels.js",
  "./lib/legal/clauses-es.js",
  "./lib/legal/clauses-en.js",
  "./lib/vendor/signature_pad.umd.min.js",
  "./lib/vendor/html2pdf.bundle.min.js"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: "window" }))
      .then((clients) => {
        // Avisa a todas las pestañas que recarguen para tomar la versión nueva.
        clients.forEach((client) => {
          try { client.postMessage({ type: "SW_UPDATED", cache: CACHE }); } catch (_) {}
        });
      })
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Cross-origin (CDNs): dejar pasar al browser sin interceptar.
  if (url.origin !== self.location.origin) return;

  // Network-first: siempre intentar red primero, caché como fallback offline.
  e.respondWith(
    fetch(req)
      .then((resp) => {
        // Cachea respuestas válidas de mismo-origen para offline.
        if (resp && resp.status === 200 && resp.type === "basic") {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return resp;
      })
      .catch(() => caches.match(req).then((cached) => cached || Response.error()))
  );
});
