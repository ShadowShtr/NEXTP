"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { CategoryIcon } from "@/lib/icons";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";

type Cat = { id: string; name: string; monthly_limit: number | null };

/** BUDGET-02 — definir o limite mensal de cada categoria (usado no alerta de 80% no Resumo). */
export default function CategoryLimitsSheet({ userId, onClose }: { userId: string; onClose: () => void }) {
  useLockBodyScroll();
  const [cats, setCats] = useState<Cat[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    getSupabase().from("categories").select("id,name,monthly_limit").eq("user_id", userId).order("name").then(({ data }) => {
      const list = (data ?? []) as Cat[];
      setCats(list);
      const init: Record<string, string> = {};
      list.forEach((c) => { init[c.id] = c.monthly_limit != null ? String(c.monthly_limit).replace(".", ",") : ""; });
      setValues(init);
    });
  }, [userId]);

  async function saveLimit(id: string) {
    const raw = (values[id] ?? "").trim();
    const n = raw ? parseFloat(raw.replace(",", ".")) : null;
    if (raw && (n === null || isNaN(n) || n <= 0)) return;
    setSavingId(id);
    const { error } = await getSupabase().from("categories").update({ monthly_limit: n }).eq("id", id);
    setSavingId(null);
    if (!error) {
      setSavedId(id);
      setTimeout(() => setSavedId((cur) => (cur === id ? null : cur)), 1200);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" style={{ height: "100dvh" }}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-clay-xl shadow-clay p-5 space-y-3 max-h-[85dvh] overflow-y-auto overflow-x-hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">Limites por categoria</h2>
          <button onClick={onClose} className="text-nextp-muted font-bold">Fechar</button>
        </div>
        <p className="text-nextp-muted text-sm">
          Define um limite mensal para cada categoria. Quando ultrapassares 80%, aparece um alerta na Central de Alertas.
        </p>
        <div className="space-y-2">
          {cats.map((c) => (
            <div key={c.id} className="clay-card-soft flex items-center gap-3 py-2.5 px-3">
              <div className="w-9 h-9 shrink-0"><CategoryIcon name={c.name} size={36} /></div>
              <p className="flex-1 font-bold text-sm truncate">{c.name}</p>
              <input
                className="clay-input w-24 !py-2 text-right text-sm"
                inputMode="decimal"
                placeholder="sem limite"
                value={values[c.id] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [c.id]: e.target.value }))}
                onBlur={() => saveLimit(c.id)}
              />
              {savingId === c.id && <span className="text-nextp-muted text-xs shrink-0">…</span>}
              {savedId === c.id && <span className="text-nextp-success text-xs shrink-0">✓</span>}
            </div>
          ))}
        </div>
        {cats.length === 0 && <p className="text-center text-nextp-muted py-6">Sem categorias ainda.</p>}
      </div>
    </div>
  );
}
