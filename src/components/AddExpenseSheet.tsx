"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import type { Category } from "@/lib/types";
import { PAYMENT_METHODS } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  userId: string;
  categories: Category[];
  presetCategory: string | null;
  defaults: { date: string; time: string; method: string };
};

/** Folha (bottom sheet) de novo gasto — rápida, otimizada para pequenos gastos. */
export default function AddExpenseSheet({
  open,
  onClose,
  onSaved,
  userId,
  categories,
  presetCategory,
  defaults,
}: Props) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(presetCategory);
  const [method, setMethod] = useState(defaults.method);
  const [date, setDate] = useState(defaults.date);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setAmount("");
      setDescription("");
      setCategoryId(presetCategory);
      setMethod(defaults.method);
      setDate(defaults.date);
      setNote("");
      setErr(null);
      setOk(false);
    }
  }, [open, presetCategory, defaults.method, defaults.date]);

  if (!open) return null;

  async function save() {
    setErr(null);
    const value = parseFloat(amount.replace(",", "."));
    if (!value || value <= 0) return setErr("Escreve um valor válido.");
    setSaving(true);
    const { error } = await getSupabase().from("expenses").insert({
      user_id: userId,
      amount: value,
      description: description.trim() || "Gasto",
      category_id: categoryId,
      date,
      time: new Date().toTimeString().slice(0, 5),
      payment_method: method,
      note: note.trim() || null,
      source: "MANUAL",
    });
    setSaving(false);
    if (error) return setErr(error.message);
    setOk(true);
    setTimeout(onSaved, 450); // pequena animação de sucesso
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-clay-xl shadow-clay p-5 space-y-4 animate-[slideup_.2s_ease]">
        <style>{`@keyframes slideup{from{transform:translateY(30px);opacity:.6}to{transform:none;opacity:1}}`}</style>

        {ok ? (
          <div className="py-12 text-center space-y-2">
            <div className="text-6xl">✅</div>
            <p className="font-black text-nextp-success text-xl">Guardado!</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">Novo gasto</h2>
              <button onClick={onClose} className="text-nextp-muted font-bold">Fechar</button>
            </div>

            <input
              className="clay-input text-3xl font-black text-center"
              inputMode="decimal"
              placeholder="0,00 €"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />

            <input
              className="clay-input"
              placeholder="Descrição (ex.: Café e pastel)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div>
              <p className="text-nextp-muted text-xs font-bold uppercase mb-1">Categoria</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCategoryId(c.id)}
                    className={`clay-chip whitespace-nowrap flex items-center gap-1 ${
                      categoryId === c.id ? "bg-nextp-blue text-white" : "bg-nextp-cardsoft text-nextp-ink"
                    }`}
                  >
                    <span>{c.icon}</span>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-nextp-muted text-xs font-bold uppercase mb-1">Forma</p>
                <select className="clay-input" value={method} onChange={(e) => setMethod(e.target.value)}>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-nextp-muted text-xs font-bold uppercase mb-1">Data</p>
                <input type="date" className="clay-input" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>

            <input
              className="clay-input"
              placeholder="Observação (opcional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            {err && <p className="text-nextp-danger text-sm text-center">{err}</p>}

            <button className="clay-btn w-full text-lg" onClick={save} disabled={saving}>
              {saving ? "A guardar…" : "Guardar gasto"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
