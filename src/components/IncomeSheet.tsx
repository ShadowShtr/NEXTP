"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { todayISO } from "@/lib/format";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";

export type IncomeEntry = {
  id: string;
  description: string;
  amount: number;
  date: string;
  source: string | null;
  note: string | null;
};

/** INCOME-01 — nova receita (salário, freelance, presente, etc.). */
export default function IncomeSheet({
  userId, editing, onClose, onSaved,
}: { userId: string; editing: IncomeEntry | null; onClose: () => void; onSaved: () => void }) {
  useLockBodyScroll();
  const isEdit = !!editing;
  const [description, setDescription] = useState(editing?.description ?? "");
  const [amount, setAmount] = useState(editing ? String(editing.amount).replace(".", ",") : "");
  const [date, setDate] = useState(editing?.date ?? todayISO());
  const [source, setSource] = useState(editing?.source ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // SAFETY-01 — evita duplicar a receita num duplo-toque ou reenvio de rede.
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  async function save() {
    const value = parseFloat(amount.replace(",", "."));
    if (!description.trim()) return setErr("Escreve uma descrição.");
    if (!value || value <= 0) return setErr("Valor inválido.");
    setSaving(true);
    const payload = {
      description: description.trim(), amount: value, date,
      source: source.trim() || null, updated_at: new Date().toISOString(),
    };
    const { error } = isEdit
      ? await getSupabase().from("income_entries").update(payload).eq("id", editing!.id)
      : await getSupabase().from("income_entries").insert({ ...payload, user_id: userId, idempotency_key: idempotencyKey });
    setSaving(false);
    if (error && error.code !== "23505") return setErr(error.message);
    onSaved();
  }

  async function remove() {
    if (!editing || !confirm("Apagar esta receita?")) return;
    setSaving(true);
    const { error } = await getSupabase().from("income_entries").delete().eq("id", editing.id);
    setSaving(false);
    if (error) return setErr(error.message);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" style={{ height: "100dvh" }}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-clay-xl shadow-clay p-5 space-y-4 max-h-[85dvh] overflow-y-auto overflow-x-hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">{isEdit ? "Editar receita" : "Nova receita"}</h2>
          <button onClick={onClose} className="text-nextp-muted font-bold">Fechar</button>
        </div>

        <div className="clay-card bg-nextp-success">
          <input
            className="w-full bg-transparent text-white text-4xl font-black text-center outline-none placeholder:text-white/60"
            inputMode="decimal" placeholder="0,00 €" value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <input className="clay-input" placeholder="Descrição (ex.: Salário, Freelance)" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input className="clay-input" placeholder="Origem (opcional)" value={source} onChange={(e) => setSource(e.target.value)} />
        <div>
          <p className="text-nextp-muted text-xs font-bold uppercase mb-1">Data</p>
          <input type="date" className="clay-input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        {err && <p className="text-nextp-danger text-sm text-center">{err}</p>}
        <button className="clay-btn w-full text-lg" onClick={save} disabled={saving}>
          {saving ? "A guardar…" : isEdit ? "Guardar alterações" : "Guardar receita"}
        </button>
        {isEdit && <button className="w-full text-nextp-danger font-bold py-2" onClick={remove} disabled={saving}>Apagar receita</button>}
      </div>
    </div>
  );
}
