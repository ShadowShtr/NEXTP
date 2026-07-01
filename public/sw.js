/*
  NextP Service Worker — apenas para experiência tipo-app e arranque rápido.
  IMPORTANTE: NUNCA toca nos dados. Os dados vivem no Supabase (rede) e a
  sessão no armazenamento do browser — o SW só faz cache de ficheiros estáticos.
  Pedidos ao Supabase e navegação são sempre "network-first".
*/
const CACHE = "nextp-shell-v1";
const ASSETS = ["/", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // Nunca intercetar API do Supabase nem métodos não-GET.
  if (req.method !== "GET" || url.hostname.endsWith("supabase.co")) return;

  // Navegação: network-first, cai para cache offline.
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("/")));
    return;
  }

  // Estáticos: cache-first, atualiza em segundo plano.
  e.respondWith(
    caches.match(req).then((cached) => {
      const net = fetch(req)
        .then((res) => {
          if (res.ok && url.origin === self.location.origin) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || net;
    })
  );
});
