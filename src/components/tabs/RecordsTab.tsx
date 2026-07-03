"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import type { Category, Expense } from "@/lib/types";
import { eur, monthBounds, todayISO } from "@/lib/format";
import { CategoryIcon } from "@/lib/icons";

type Props = {
  userId: string;
  categories: Category[];
  onEdit: (e: Expense) => void;
  onQuickAdd: (categoryId: string) => void;
};

export default function RecordsTab({ userId, categories, onEdit, onQuickAdd }: Props) {
  const [today] = useState(todayISO());
  const [dayExpenses, setDayExpenses] = useState<Expense[]>([]);
  const [monthTotal, setMonthTotal] = useState(0);
  const [budget, setBudget] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const dayTotal = useMemo(() => dayExpenses.reduce((s, e) => s + Number(e.amount), 0), [dayExpenses]);

  const load = useCallback(async () => {
    const sb = getSupabase();
    const { start, end } = monthBounds(today);
    const [day, month, settings] = await Promise.all([
      sb.from("expenses").select("*").eq("user_id", userId).eq("date", today).order("time", { ascending: false }),
      sb.from("expenses").select("amount").eq("user_id", userId).gte("date", start).lte("date", end),
      sb.from("user_settings").select("monthly_budget").eq("user_id", userId).maybeSingle(),
    ]);
    if (day.data) setDayExpenses(day.data as Expense[]);
    if (month.data) setMonthTotal(month.data.reduce((s, r) => s + Number(r.amount), 0));
    setBudget(settings.data?.monthly_budget ?? null);
    setLoading(false);
  }, [userId, today]);

  useEffect(() => { load(); }, [load]);

  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const pct = budget && budget > 0 ? Math.min(100, Math.round((monthTotal / budget) * 100)) : null;

  async function setMonthlyBudget() {
    const v = prompt("Orçamento mensal (€):", budget ? String(budget) : "");
    if (v === null) return;
    const n = parseFloat(v.replace(",", "."));
    await getSupabase().from("user_settings").upsert({ user_id: userId, monthly_budget: isNaN(n) ? null : n }, { onConflict: "user_id" });
    setBudget(isNaN(n) ? null : n);
  }

  return (
    <div className="px-5 py-2 space-y-4">
      {/* Cards Hoje + Este mês — ambos mais estreitos; o mascote (grande) atravessa os dois,
          sobretudo no fundo branco à direita, sobrepondo o canto de cada card. */}
      <div className="relative pt-3">
        <div className="clay-hero py-4 px-4 pr-24">
          <div className="relative z-10">
            <p className="text-white/80 text-xs font-bold">Hoje</p>
            <p className="text-3xl font-black leading-tight">{eur(dayTotal)}</p>
            <p className="text-white/80 text-xs">{dayExpenses.length} {dayExpenses.length === 1 ? "gasto" : "gastos"}</p>
          </div>
        </div>

        <button onClick={setMonthlyBudget} className="clay-card w-full text-left space-y-2 py-4 px-4 pr-24 mt-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-nextp-muted text-xs font-bold uppercase">Este mês</p>
              <p className="text-2xl font-black">{eur(monthTotal)}</p>
            </div>
            <p className="text-nextp-muted text-sm">{budget ? `de ${eur(budget)}` : "definir orçamento"}</p>
          </div>
          {pct !== null && (
            <>
              <div className="h-2.5 rounded-full bg-nextp-cardsoft overflow-hidden">
                <div className={`h-full ${pct >= 100 ? "bg-nextp-danger" : "bg-nextp-blue"}`} style={{ width: `${pct}%` }} />
              </div>
              <p className="text-right text-xs font-bold text-nextp-muted">{pct}%</p>
            </>
          )}
        </button>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/illustrations/registos-mascot.png"
          alt=""
          width={210}
          height={234}
          className="absolute z-20 pointer-events-none select-none"
          style={{ top: "-18px", right: "-6px" }}
          draggable={false}
        />
      </div>

      {/* Categorias rápidas */}
      <div>
        <p className="font-black text-sm mb-2">Categorias rápidas</p>
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
          {categories.slice(0, 8).map((c) => (
            <button key={c.id} onClick={() => onQuickAdd(c.id)} className="flex flex-col items-center gap-1 shrink-0 active:scale-90 transition-transform">
              <CategoryIcon name={c.name} size={54} />
              <span className="text-[11px] font-bold text-nextp-ink">{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Últimos gastos */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-lg">Gastos de hoje</h2>
          <span className="text-nextp-muted text-sm">{dayExpenses.length}</span>
        </div>

        {loading ? (
          <div className="clay-card text-center text-nextp-muted">A carregar…</div>
        ) : dayExpenses.length === 0 ? (
          <div className="clay-card text-center text-nextp-muted py-10">Ainda sem gastos hoje. Toca no ➕ azul para começar.</div>
        ) : (
          dayExpenses.map((e) => {
            const cat = e.category_id ? catById.get(e.category_id) : undefined;
            return (
              <button key={e.id} onClick={() => onEdit(e)} className="clay-card w-full text-left flex items-center gap-3 py-3 active:scale-[0.99] transition-transform">
                <div className="w-11 h-11 shrink-0"><CategoryIcon name={cat?.name ?? "Outros"} size={44} /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{e.description}</p>
                  <p className="text-nextp-muted text-xs">
                    {cat?.name ?? "Sem categoria"} · {e.time ?? ""}{e.payment_method ? ` · ${e.payment_method}` : ""}
                  </p>
                </div>
                <p className="font-black shrink-0">{eur(Number(e.amount))}</p>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
