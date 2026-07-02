/*
  NextP Service Worker — versão de limpeza.
  O SW anterior fazia cache-first dos ficheiros estáticos, o que prendia
  versões antigas da app (F5 e a app instalada no ecrã inicial nunca
  atualizavam). Este script substitui-o: limpa todas as caches antigas,
  desregista-se a si próprio e recarrega as janelas abertas — a partir daí
  a app passa a carregar sempre diretamente da rede, como um site normal.
*/
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) client.navigate(client.url);
    })()
  );
});
