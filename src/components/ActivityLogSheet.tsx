"use client";

import { useEffect, useState } from "react";
import { eur } from "@/lib/format";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";
import { listActivity, ACTION_LABEL, type ActivityEntry } from "@/lib/activityLog";

const ENTITY_LABEL: Record<string, string> = {
  expense: "Gasto", income: "Receita", saved_item: "Item guardado", wishlist_item: "Wishlist",
  planning_item: "Conta/dívida", recurring_payment: "Conta fixa", recurring_occurrence: "Pagamento recorrente",
  backup: "Backup", month: "Mês",
};

/** SAFETY-02 — histórico de alterações financeiras (só leitura). */
export default function ActivityLogSheet({ userId, onClose }: { userId: string; onClose: () => void }) {
  useLockBodyScroll();
  const [items, setItems] = useState<ActivityEntry[] | null>(null);

  useEffect(() => { listActivity(userId).then(setItems); }, [userId]);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" style={{ height: "100dvh" }}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-clay-xl shadow-clay p-5 space-y-3 max-h-[85dvh] overflow-y-auto overflow-x-hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">Histórico de alterações</h2>
          <button onClick={onClose} className="text-nextp-muted font-bold">Fechar</button>
        </div>

        {!items ? (
          <p className="text-center text-nextp-muted py-8">A carregar…</p>
        ) : items.length === 0 ? (
          <p className="text-center text-nextp-muted py-8">Ainda sem atividade registada.</p>
        ) : (
          <div className="space-y-2">
            {items.map((it) => (
              <div key={it.id} className="clay-card-soft py-2.5 px-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-sm truncate">
                    {ACTION_LABEL[it.action]} {(ENTITY_LABEL[it.entity_type] ?? it.entity_type).toLowerCase()}: {it.description}
                  </p>
                  {it.amount != null && <span className="font-black text-sm shrink-0">{eur(Number(it.amount))}</span>}
                </div>
                <p className="text-nextp-muted text-xs">{new Date(it.created_at).toLocaleString("pt-PT")}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
