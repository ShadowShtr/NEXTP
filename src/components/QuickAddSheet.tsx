"use client";

import { useLockBodyScroll } from "@/lib/useLockBodyScroll";
import { FeatureIcon, type FeatureKey } from "@/lib/icons";

export type QuickAddTarget = "expense" | "income" | "recurring" | "saved" | "wishlist" | "debt";

const OPTIONS: { id: QuickAddTarget; label: string; icon: FeatureKey }[] = [
  { id: "expense", label: "Nova despesa", icon: "chart" },
  { id: "income", label: "Nova receita", icon: "wallet" },
  { id: "recurring", label: "Nova conta fixa", icon: "calendar-check" },
  { id: "saved", label: "Novo item guardado", icon: "shield" },
  { id: "wishlist", label: "Quero comprar", icon: "trophy" },
  { id: "debt", label: "Nova dívida", icon: "piggy-bank" },
];

/** UX-03 — o botão + central abre um menu rápido em vez de ir sempre direto para "novo gasto". */
export default function QuickAddSheet({ onClose, onSelect }: { onClose: () => void; onSelect: (t: QuickAddTarget) => void }) {
  useLockBodyScroll();
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" style={{ height: "100dvh" }}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-clay-xl shadow-clay p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">O que queres lançar?</h2>
          <button onClick={onClose} className="text-nextp-muted font-bold">Fechar</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {OPTIONS.map((o) => (
            <button key={o.id} onClick={() => onSelect(o.id)}
              className="clay-card-soft flex flex-col items-center gap-2 py-4 active:scale-95 transition-transform">
              <FeatureIcon name={o.icon} size={32} />
              <span className="font-bold text-sm text-center">{o.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
