"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import type { Category, Expense } from "@/lib/types";
import { PAYMENT_METHODS } from "@/lib/types";
import { eur, monthBounds, nowHM, todayISO } from "@/lib/format";
import AddExpenseSheet from "@/components/AddExpenseSheet";

export default function RecordsTab({ userId }: { userId: string }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [today] = useState(todayISO());
  const [dayExpenses, setDayExpenses] = useState<Expense[]>([]);
  const [monthTotal, setMonthTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [presetCategory, setPresetCategory] = useState<string | null>(null);

  const dayTotal = useMemo(
    () => dayExpenses.reduce((s, e) => s + Number(e.amount), 0),
    [dayExpenses]
  );

  const load = useCallback(async () => {
    const sb = getSupabase();
    const { start, end } = monthBounds(today);

    const [cats, day, month] = await Promise.all([
      sb.from("categories").select("*").eq("user_id", userId).order("name"),
      sb.from("expenses").select("*").eq("user_id", userId).eq("date", today).order("time", { ascending: false }),
      sb.from("expenses").select("amount").eq("user_id", userId).gte("date", start).lte("date", end),
    ]);

    if (cats.data) setCategories(cats.data as Category[]);
    if (day.data) setDayExpenses(day.data as Expense[]);
    if (month.data) setMonthTotal(month.data.reduce((s, r) => s + Number(r.amount), 0));
    setLoading(false);
  }, [userId, today]);

  useEffect(() => {
    load();
  }, [load]);

  const catById = useMemo(() => {
    const m = new Map<string, Category>();
    categories.forEach((c) => m.set(c.id, c));
    return m;
  }, [categories]);

  async function remove(id: string) {
    // Otimista, com reversão em erro.
    const prev = dayExpenses;
    setDayExpenses((x) => x.filter((e) => e.id !== id));
    const { error } = await getSupabase().from("expenses").delete().eq("id", id);
    if (error) setDayExpenses(prev);
    else load();
  }

  function openAdd(categoryId?: string) {
    setPresetCategory(categoryId ?? null);
    setSheetOpen(true);
  }

  return (
    <div className="px-5 py-3 space-y-4">
      {/* Totais */}
      <div className="grid grid-cols-2 gap-3">
        <div className="clay-card-soft">
          <p className="text-nextp-muted text-xs font-bold uppercase">Hoje</p>
          <p className="text-2xl font-black text-nextp-blue">{eur(dayTotal)}</p>
        </div>
        <div className="clay-card-soft">
          <p className="text-nextp-muted text-xs font-bold uppercase">Este mês</p>
          <p className="text-2xl font-black">{eur(monthTotal)}</p>
        </div>
      </div>

      {/* Botões rápidos de categoria */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {categories.slice(0, 8).map((c) => (
          <button
            key={c.id}
            onClick={() => openAdd(c.id)}
            className="clay-chip bg-white whitespace-nowrap flex items-center gap-1"
            style={{ color: c.color }}
          >
            <span>{c.icon}</span>
            <span className="text-nextp-ink">{c.name}</span>
          </button>
        ))}
      </div>

      {/* Lista do dia */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-lg">Gastos de hoje</h2>
          <span className="text-nextp-muted text-sm">{dayExpenses.length}</span>
        </div>

        {loading ? (
          <div className="clay-card text-center text-nextp-muted">A carregar…</div>
        ) : dayExpenses.length === 0 ? (
          <div className="clay-card text-center text-nextp-muted py-10">
            Ainda sem gastos hoje. Toca no ➕ para começar.
          </div>
        ) : (
          dayExpenses.map((e) => {
            const cat = e.category_id ? catById.get(e.category_id) : undefined;
            return (
              <div key={e.id} className="clay-card flex items-center gap-3 py-3">
                <div
                  className="w-11 h-11 rounded-clay grid place-items-center text-xl shadow-clay-sm shrink-0"
                  style={{ background: (cat?.color ?? "#98A2B3") + "22" }}
                >
                  {cat?.icon ?? "📦"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{e.description}</p>
                  <p className="text-nextp-muted text-xs">
                    {cat?.name ?? "Sem categoria"} · {e.time ?? ""} {e.payment_method ? `· ${e.payment_method}` : ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-black">{eur(Number(e.amount))}</p>
                  <button onClick={() => remove(e.id)} className="text-nextp-danger text-xs font-bold">
                    apagar
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => openAdd()}
        className="fixed right-5 z-20 w-16 h-16 rounded-full bg-nextp-blue text-white text-3xl font-black shadow-clay-btn active:scale-90 transition-transform grid place-items-center"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 92px)" }}
        aria-label="Novo gasto"
      >
        ＋
      </button>

      <AddExpenseSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        userId={userId}
        categories={categories}
        presetCategory={presetCategory}
        defaults={{ date: today, time: nowHM(), method: PAYMENT_METHODS[0] }}
        onSaved={() => {
          setSheetOpen(false);
          load();
        }}
      />
    </div>
  );
}
