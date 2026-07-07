"use client";

import { useCallback, useEffect, useState } from "react";
import { eur } from "@/lib/format";
import { CategoryIcon } from "@/lib/icons";
import type { Category } from "@/lib/types";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";
import { createQuickExpense, deleteQuickExpense, listQuickExpenses, type QuickExpenseTemplate } from "@/lib/quickExpense";

/** UX-04 — gerir os favoritos de gasto rápido (criar/apagar). */
export default function QuickExpenseManageSheet({ userId, categories, onClose, onChanged }: {
  userId: string; categories: Category[]; onClose: () => void; onChanged: () => void;
}) {
  useLockBodyScroll();
  const [items, setItems] = useState<QuickExpenseTemplate[] | null>(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    listQuickExpenses(userId).then(setItems);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  async function add() {
    const value = parseFloat(amount.replace(",", "."));
    if (!description.trim()) return setErr("Escreve um nome.");
    if (!value || value <= 0) return setErr("Valor inválido.");
    setSaving(true);
    const { error } = await createQuickExpense(userId, {
      description: description.trim(), amount: value, categoryId, paymentMethod: null, walletAccountId: null,
    });
    setSaving(false);
    if (error) return setErr(error);
    setDescription(""); setAmount(""); setCategoryId(null);
    load();
    onChanged();
  }

  async function remove(id: string) {
    await deleteQuickExpense(id);
    load();
    onChanged();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ height: "100dvh" }}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-clay-xl shadow-clay p-5 space-y-3 max-h-[85dvh] overflow-y-auto overflow-x-hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">Gastos rápidos</h2>
          <button onClick={onClose} className="text-nextp-muted font-bold">Fechar</button>
        </div>
        <p className="text-nextp-muted text-sm">Cria atalhos para gastos que repetes (café, pão, uber…) — um toque lança o gasto na hora.</p>

        <div className="clay-card-soft space-y-2">
          <input className="clay-input" placeholder="Nome (ex.: Café)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <input className="clay-input" inputMode="decimal" placeholder="Valor (€)" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((c) => (
              <button key={c.id} onClick={() => setCategoryId(c.id)}
                className={`flex flex-col items-center gap-1 shrink-0 p-1 rounded-clay ${categoryId === c.id ? "ring-2 ring-nextp-blue" : ""}`}>
                <CategoryIcon name={c.name} size={36} />
              </button>
            ))}
          </div>
          {err && <p className="text-nextp-danger text-sm text-center">{err}</p>}
          <button onClick={add} disabled={saving} className="clay-btn w-full text-sm py-2">
            {saving ? "A guardar…" : "+ Adicionar favorito"}
          </button>
        </div>

        {!items ? (
          <p className="text-center text-nextp-muted py-6">A carregar…</p>
        ) : items.length === 0 ? (
          <p className="text-center text-nextp-muted py-6">Ainda sem gastos rápidos.</p>
        ) : (
          <div className="space-y-2">
            {items.map((it) => (
              <div key={it.id} className="clay-card-soft flex items-center justify-between py-2 px-3">
                <div>
                  <p className="font-bold text-sm">{it.description}</p>
                  <p className="text-nextp-muted text-xs">{eur(it.amount)} · usado {it.usage_count}x</p>
                </div>
                <button onClick={() => remove(it.id)} className="text-nextp-danger text-xs font-bold">apagar</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
