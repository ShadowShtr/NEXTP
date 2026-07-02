"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import type { Category, Expense } from "@/lib/types";
import { PAYMENT_METHODS } from "@/lib/types";
import { CategoryIcon } from "@/lib/icons";

type Props = {
  onClose: () => void;
  onSaved: () => void;
  userId: string;
  categories: Category[];
  presetCategory: string | null;
  editing: Expense | null;
  defaults: { date: string; time: string; method: string };
};

/** Folha de novo gasto / edição de gasto. */
export default function AddExpenseSheet({
  onClose, onSaved, userId, categories, presetCategory, editing, defaults,
}: Props) {
  const isEdit = !!editing;
  const [amount, setAmount] = useState(editing ? String(editing.amount).replace(".", ",") : "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(editing?.category_id ?? presetCategory);
  const [method, setMethod] = useState(editing?.payment_method ?? defaults.method);
  const [date, setDate] = useState(editing?.date ?? defaults.date);
  const [note, setNote] = useState(editing?.note ?? "");
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setErr(null); setOk(false);
  }, []);

  async function save() {
    setErr(null);
    const value = parseFloat(amount.replace(",", "."));
    if (!value || value <= 0) return setErr("Escreve um valor válido.");
    setSaving(true);
    const sb = getSupabase();
    const payload = {
      amount: value,
      description: description.trim() || "Gasto",
      category_id: categoryId,
      date,
      payment_method: method,
      note: note.trim() || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = isEdit
      ? await sb.from("expenses").update(payload).eq("id", editing!.id)
      : await sb.from("expenses").insert({ ...payload, user_id: userId, time: new Date().toTimeString().slice(0, 5), source: "MANUAL" });
    setSaving(false);
    if (error) return setErr(error.message);
    setOk(true);
    setTimeout(onSaved, 400);
  }

  async function remove() {
    if (!editing) return;
    if (!confirm("Apagar este gasto?")) return;
    setSaving(true);
    const { error } = await getSupabase().from("expenses").delete().eq("id", editing.id);
    setSaving(false);
    if (error) return setErr(error.message);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-clay-xl shadow-clay p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        {ok ? (
          <div className="py-12 text-center space-y-2">
            <div className="text-6xl">✅</div>
            <p className="font-black text-nextp-success text-xl">{isEdit ? "Atualizado!" : "Guardado!"}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">{isEdit ? "Editar gasto" : "Novo gasto"}</h2>
              <button onClick={onClose} className="text-nextp-muted font-bold">Fechar</button>
            </div>

            {/* Valor em destaque (card azul) */}
            <div className="clay-card bg-nextp-blue">
              <input
                className="w-full bg-transparent text-white text-4xl font-black text-center outline-none placeholder:text-white/60"
                inputMode="decimal" placeholder="0,00 €" value={amount}
                onChange={(e) => setAmount(e.target.value)} autoFocus={!isEdit}
              />
            </div>

            <input className="clay-input" placeholder="Descrição (ex.: Café e pastel)" value={description} onChange={(e) => setDescription(e.target.value)} />

            <div>
              <p className="text-nextp-muted text-xs font-bold uppercase mb-1">Categoria</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {categories.map((c) => (
                  <button key={c.id} onClick={() => setCategoryId(c.id)}
                    className={`flex flex-col items-center gap-1 shrink-0 p-1 rounded-clay ${categoryId === c.id ? "ring-2 ring-nextp-blue" : ""}`}>
                    <CategoryIcon name={c.name} size={44} />
                    <span className="text-[10px] font-bold text-nextp-ink">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-nextp-muted text-xs font-bold uppercase mb-1">Forma</p>
                <select className="clay-input" value={method} onChange={(e) => setMethod(e.target.value)}>
                  {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <p className="text-nextp-muted text-xs font-bold uppercase mb-1">Data</p>
                <input type="date" className="clay-input" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>

            <input className="clay-input" placeholder="Observação (opcional)" value={note} onChange={(e) => setNote(e.target.value)} />

            {err && <p className="text-nextp-danger text-sm text-center">{err}</p>}

            <button className="clay-btn w-full text-lg" onClick={save} disabled={saving}>
              {saving ? "A guardar…" : isEdit ? "Guardar alterações" : "Guardar gasto"}
            </button>
            {isEdit && (
              <button className="w-full text-nextp-danger font-bold py-2" onClick={remove} disabled={saving}>Apagar gasto</button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
