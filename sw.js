/* Acuerdo Inteligente · Service Worker (v7 vendor libs + PDF robustez) */
const CACHE = "acuerdo-inteligente-v7";
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
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  // Solo manejamos recursos de mismo origen — los CDN (signature_pad, html2pdf)
  // los deja pasar el browser sin interceptar para no romper CORS ni dejar
  // al usuario con una respuesta vacía cuando el SW falla.
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((resp) => {
        if (resp && resp.status === 200 && resp.type === "basic") {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return resp;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
