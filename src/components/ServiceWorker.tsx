"use client";

import { useEffect } from "react";

/**
 * Regista o service worker (só em produção/HTTPS). A partir desta versão o
 * sw.js apenas limpa caches antigas e desregista-se — ver public/sw.js.
 * Isto corrige apps já instaladas que ficavam presas numa versão antiga.
 */
export default function ServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator && window.location.protocol === "https:") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
