"use client";

import { useEffect } from "react";

/** Regista o service worker (só em produção/HTTPS). */
export default function ServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator && window.location.protocol === "https:") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
