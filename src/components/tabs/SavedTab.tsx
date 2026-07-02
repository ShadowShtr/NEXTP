"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { eur, prettyDate, todayISO } from "@/lib/format";
import { FeatureIcon } from "@/lib/icons";

type SavedItem = {
  id: string;
  name: string;
  amount: number;
  purchase_date: string;
  store: string | null;
  warranty_until: string | null;
  count_as_monthly_expense: boolean;
};

export default function SavedTab({ userId }: { userId: string }) {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    const { data } = await getSupabase()
      .from("saved_items")
      .select("*")
      .eq("user_id", userId)
      .order("purchase_date", { ascending: false });
    const list = (data ?? []) as SavedItem[];
    setItems(list);
    setTotal(list.reduce((s, i) => s + Number(i.amount), 0));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: string) {
    await getSupabase().from("saved_items").delete().eq("id", id);
    load();
  }

  function warrantyBadge(d: string | null) {
    if (!d) return null;
    const days = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
    if (days < 0) return <span className="clay-chip bg-nextp-danger/15 text-nextp-danger text-xs">Garantia expirada</span>;
    if (days < 30) return <span className="clay-chip bg-nextp-warning/15 text-nextp-warning text-xs">Garantia: {days}d</span>;
    return <span className="clay-chip bg-nextp-success/15 text-nextp-success text-xs">Na garantia</span>;
  }

  return (
    <div className="px-5 py-3 space-y-4">
      <h1 className="text-2xl font-black">Guardados</h1>

      <div className="clay-card bg-nextp-blue text-white flex items-center justify-between">
        <div>
          <p className="text-white/80 text-xs font-bold uppercase">Total guardado</p>
          <p className="text-3xl font-black">{eur(total)}</p>
        </div>
        <FeatureIcon name="wallet" size={64} />
      </div>

      {loading ? (
        <div className="clay-card text-center text-nextp-muted">A carregar…</div>
      ) : items.length === 0 ? (
        <div className="clay-card text-center text-nextp-muted py-10">
          Ainda sem bens guardados. Toca em ➕ para adicionar.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.id} className="clay-card flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/saved/saved-purchased.svg" width={48} height={48} alt="" className="shrink-0" draggable={false} />
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{it.name}</p>
                <p className="text-nextp-muted text-xs">
                  {prettyDate(it.purchase_date)}{it.store ? ` · ${it.store}` : ""}
                </p>
                <div className="mt-1">{warrantyBadge(it.warranty_until)}</div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-black">{eur(Number(it.amount))}</p>
                <button onClick={() => remove(it.id)} className="text-nextp-danger text-xs font-bold">apagar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => setOpen(true)}
        className="fixed right-5 z-20 w-16 h-16 rounded-full bg-nextp-blue text-white text-3xl font-black shadow-clay-btn active:scale-90 transition-transform grid place-items-center"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 92px)" }}
        aria-label="Novo item guardado"
      >＋</button>

      {open && <SavedSheet userId={userId} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); load(); }} />}
    </div>
  );
}

function SavedSheet({ userId, onClose, onSaved }: { userId: string; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [store, setStore] = useState("");
  const [date, setDate] = useState(todayISO());
  const [warranty, setWarranty] = useState("");
  const [countMonth, setCountMonth] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    const value = parseFloat(amount.replace(",", "."));
    if (!name.trim()) return setErr("Escreve o nome do item.");
    if (!value || value <= 0) return setErr("Valor inválido.");
    setSaving(true);
    const { data, error } = await getSupabase().from("saved_items").insert({
      user_id: userId, name: name.trim(), amount: value, purchase_date: date,
      store: store.trim() || null, warranty_until: warranty || null,
      count_as_monthly_expense: countMonth,
    }).select("id").single();
    if (!error && countMonth && data) {
      // lançar também como gasto do mês
      await getSupabase().from("expenses").insert({
        user_id: userId, description: name.trim(), amount: value, date,
        time: new Date().toTimeString().slice(0, 5), payment_method: "Outro",
        source: "SAVED_ITEM",
      });
    }
    setSaving(false);
    if (error) return setErr(error.message);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-clay-xl shadow-clay p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">Novo item guardado</h2>
          <button onClick={onClose} className="text-nextp-muted font-bold">Fechar</button>
        </div>
        <input className="clay-input" placeholder="Nome (ex.: Air Fryer)" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <input className="clay-input" inputMode="decimal" placeholder="Valor (€)" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <input className="clay-input" placeholder="Loja (opcional)" value={store} onChange={(e) => setStore(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-nextp-muted text-xs font-bold uppercase mb-1">Data compra</p>
            <input type="date" className="clay-input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <p className="text-nextp-muted text-xs font-bold uppercase mb-1">Garantia até</p>
            <input type="date" className="clay-input" value={warranty} onChange={(e) => setWarranty(e.target.value)} />
          </div>
        </div>
        <label className="flex items-center gap-3 clay-card-soft cursor-pointer">
          <input type="checkbox" checked={countMonth} onChange={(e) => setCountMonth(e.target.checked)} className="w-5 h-5 accent-nextp-blue" />
          <span className="text-sm font-bold">Contar como gasto do mês?</span>
        </label>
        {err && <p className="text-nextp-danger text-sm text-center">{err}</p>}
        <button className="clay-btn w-full text-lg" onClick={save} disabled={saving}>{saving ? "A guardar…" : "Guardar item"}</button>
      </div>
    </div>
  );
}
