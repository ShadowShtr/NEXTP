"use client";

import { useEffect, useState } from "react";
import { computeAlerts, type AppAlert } from "@/lib/alerts";
import { FeatureIcon } from "@/lib/icons";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";

const SEVERITY_STYLE = {
  danger: "border-nextp-danger/30 bg-nextp-danger/5",
  warning: "border-nextp-warning/30 bg-nextp-warning/5",
  info: "border-nextp-cardsoft bg-nextp-cardsoft",
} as const;

/** NOTIF-02 — Central de Alertas dentro da app. */
export default function AlertsSheet({ userId, onClose }: { userId: string; onClose: () => void }) {
  useLockBodyScroll();
  const [alerts, setAlerts] = useState<AppAlert[] | null>(null);

  useEffect(() => { computeAlerts(userId).then(setAlerts); }, [userId]);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" style={{ height: "100dvh" }}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-clay-xl shadow-clay p-5 space-y-3 max-h-[85dvh] overflow-y-auto overflow-x-hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">Central de Alertas</h2>
          <button onClick={onClose} className="text-nextp-muted font-bold">Fechar</button>
        </div>

        {alerts === null ? (
          <p className="text-center text-nextp-muted py-8">A carregar…</p>
        ) : alerts.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <FeatureIcon name="shield" size={48} />
            <p className="text-nextp-muted">Tudo em dia! Sem alertas por agora.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((a) => (
              <div key={a.id} className={`rounded-clay border py-3 px-4 ${SEVERITY_STYLE[a.severity]}`}>
                <p className="font-bold text-sm">{a.title}</p>
                <p className="text-nextp-muted text-xs">{a.detail}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
