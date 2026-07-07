"use client";

import { useCallback, useEffect, useState } from "react";
import { eur, prettyDate } from "@/lib/format";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";
import { listTrash, restoreFromTrash, TRASH_TABLE_LABEL, type TrashItem } from "@/lib/trash";
import { logActivity } from "@/lib/activityLog";

/** SAFETY-03 — nada apagado desaparece de vez: fica aqui até ser restaurado. */
export default function TrashSheet({ userId, onClose }: { userId: string; onClose: () => void }) {
  useLockBodyScroll();
  const [items, setItems] = useState<TrashItem[] | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const load = useCallback(() => {
    listTrash(userId).then(setItems);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  async function restore(item: TrashItem) {
    setRestoringId(item.id);
    const { error } = await restoreFromTrash(userId, item.table, item.id);
    setRestoringId(null);
    if (!error) logActivity(userId, item.table, "RESTORED", item.label, item.amount, item.id);
    load();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" style={{ height: "100dvh" }}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-clay-xl shadow-clay p-5 space-y-3 max-h-[85dvh] overflow-y-auto overflow-x-hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">Lixeira</h2>
          <button onClick={onClose} className="text-nextp-muted font-bold">Fechar</button>
        </div>
        <p className="text-nextp-muted text-sm">
          Nada é apagado de vez — o que removeres fica aqui e pode ser restaurado a qualquer momento.
        </p>

        {!items ? (
          <p className="text-center text-nextp-muted py-8">A carregar…</p>
        ) : items.length === 0 ? (
          <p className="text-center text-nextp-muted py-8">A Lixeira está vazia.</p>
        ) : (
          <div className="space-y-2">
            {items.map((it) => (
              <div key={`${it.table}-${it.id}`} className="clay-card-soft flex items-center justify-between py-2.5 px-3 gap-2">
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{it.label}</p>
                  <p className="text-nextp-muted text-xs">
                    {TRASH_TABLE_LABEL[it.table]}{it.amount != null ? ` · ${eur(it.amount)}` : ""} · apagado {prettyDate(it.deletedAt.slice(0, 10))}
                  </p>
                </div>
                <button onClick={() => restore(it)} disabled={restoringId === it.id}
                  className="clay-btn-ghost text-xs py-2 px-3 shrink-0">
                  {restoringId === it.id ? "…" : "Restaurar"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
