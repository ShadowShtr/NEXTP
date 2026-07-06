"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";

/** UI-01 — substitui o prompt() nativo por um sheet claymorphism para o orçamento mensal. */
export default function BudgetSheet({
  userId, current, onClose, onSaved,
}: { userId: string; current: number | null; onClose: () => void; onSaved: (value: number | null) => void }) {
  useLockBodyScroll();
  const [value, setValue] = useState(current ? String(current).replace(".", ",") : "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setErr(null);
    const trimmed = value.trim();
    const n = trimmed ? parseFloat(trimmed.replace(",", ".")) : null;
    if (trimmed && (n === null || isNaN(n) || n <= 0)) return setErr("Valor inválido.");
    setSaving(true);
    const { error } = await getSupabase()
      .from("user_settings")
      .upsert({ user_id: userId, monthly_budget: n }, { onConflict: "user_id" });
    setSaving(false);
    if (error) return setErr(error.message);
    onSaved(n);
  }

  async function remove() {
    setSaving(true);
    const { error } = await getSupabase()
      .from("user_settings")
      .upsert({ user_id: userId, monthly_budget: null }, { onConflict: "user_id" });
    setSaving(false);
    if (error) return setErr(error.message);
    onSaved(null);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" style={{ height: "100dvh" }}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-clay-xl shadow-clay p-5 space-y-4 max-h-[85dvh] overflow-y-auto overflow-x-hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">Orçamento mensal</h2>
          <button onClick={onClose} className="text-nextp-muted font-bold">Fechar</button>
        </div>
        <p className="text-nextp-muted text-sm">
          Define quanto queres gastar por mês para acompanhares o progresso no card "Este mês".
        </p>
        <div className="clay-card bg-nextp-blue">
          <input
            className="w-full bg-transparent text-white text-4xl font-black text-center outline-none placeholder:text-white/60"
            inputMode="decimal"
            placeholder="0,00 €"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus={false}
          />
        </div>
        {err && <p className="text-nextp-danger text-sm text-center">{err}</p>}
        <button className="clay-btn w-full text-lg" onClick={save} disabled={saving}>
          {saving ? "A guardar…" : "Guardar orçamento"}
        </button>
        {current !== null && (
          <button className="w-full text-nextp-danger font-bold py-2" onClick={remove} disabled={saving}>
            Remover orçamento
          </button>
        )}
      </div>
    </div>
  );
}
