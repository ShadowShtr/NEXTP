"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import type { Category, Expense } from "@/lib/types";
import { eur, monthBounds, prettyDate } from "@/lib/format";
import { CategoryIcon } from "@/lib/icons";
import AddExpenseSheet from "@/components/AddExpenseSheet";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

/** HISTORY-01 — histórico diário/mensal de gastos, com edição. */
export default function HistoryView({ userId, onClose }: { userId: string; onClose: () => void }) {
  useLockBodyScroll();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [rows, setRows] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);

  const monthKey = `${year}-${String(month).padStart(2, "0")}-01`;

  const load = useCallback(async () => {
    setLoading(true);
    const { start, end } = monthBounds(monthKey);
    const sb = getSupabase();
    const [ex, ct] = await Promise.all([
      sb.from("expenses").select("*").eq("user_id", userId).is("deleted_at", null)
        .gte("date", start).lte("date", end)
        .order("date", { ascending: false }).order("time", { ascending: false }),
      sb.from("categories").select("*").eq("user_id", userId),
    ]);
    setRows((ex.data ?? []) as Expense[]);
    setCategories((ct.data ?? []) as Category[]);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, monthKey]);

  useEffect(() => { load(); }, [load]);

  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const byDay = useMemo(() => {
    const groups = new Map<string, Expense[]>();
    for (const r of rows) {
      const list = groups.get(r.date) ?? [];
      list.push(r);
      groups.set(r.date, list);
    }
    return Array.from(groups.entries())
      .map(([date, items]) => ({ date, items, total: items.reduce((s, i) => s + Number(i.amount), 0) }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [rows]);

  const monthTotal = useMemo(() => rows.reduce((s, r) => s + Number(r.amount), 0), [rows]);

  function shiftMonth(delta: number) {
    let m = month + delta, y = year;
    if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; }
    setMonth(m); setYear(y);
  }

  return (
    <div className="fixed inset-0 z-40 bg-nextp-bg flex flex-col" style={{ height: "100dvh" }}>
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <h1 className="text-2xl font-black">Histórico</h1>
        <button onClick={onClose} className="text-nextp-muted font-bold">Fechar</button>
      </div>

      <div className="px-5 space-y-4 flex-1 overflow-y-auto pb-8">
        <div className="clay-card flex items-center justify-between">
          <button onClick={() => shiftMonth(-1)} className="text-nextp-blue text-2xl font-black px-2">‹</button>
          <span className="font-black">{MONTHS[month - 1]} {year}</span>
          <button onClick={() => shiftMonth(1)} className="text-nextp-blue text-2xl font-black px-2">›</button>
        </div>

        <div className="clay-hero flex items-center justify-between py-3 px-4">
          <div className="relative z-10">
            <p className="text-white/80 text-xs font-bold uppercase">Total do mês</p>
            <p className="text-2xl font-black">{eur(monthTotal)}</p>
          </div>
          <p className="relative z-10 text-white/80 text-sm">{rows.length} {rows.length === 1 ? "gasto" : "gastos"}</p>
        </div>

        {loading ? (
          <div className="clay-card text-center text-nextp-muted">A carregar…</div>
        ) : byDay.length === 0 ? (
          <div className="clay-card text-center text-nextp-muted py-10">Sem gastos neste mês.</div>
        ) : (
          <div className="space-y-2">
            {byDay.map((day) => {
              const isOpen = openDay === day.date;
              return (
                <div key={day.date} className="clay-card overflow-hidden">
                  <button onClick={() => setOpenDay(isOpen ? null : day.date)} className="w-full flex items-center justify-between text-left">
                    <div>
                      <p className="font-bold">{prettyDate(day.date)}</p>
                      <p className="text-nextp-muted text-xs">{day.items.length} {day.items.length === 1 ? "gasto" : "gastos"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-black">{eur(day.total)}</p>
                      <span className={`text-nextp-muted transition-transform ${isOpen ? "rotate-180" : ""}`}>▾</span>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="mt-3 space-y-2 border-t border-nextp-cardsoft pt-3">
                      {day.items.map((e) => {
                        const cat = e.category_id ? catById.get(e.category_id) : undefined;
                        return (
                          <button key={e.id} onClick={() => setEditing(e)} className="w-full flex items-center gap-3 text-left">
                            <div className="w-9 h-9 shrink-0"><CategoryIcon name={cat?.name ?? "Outros"} size={36} /></div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm truncate">{e.description}</p>
                              <p className="text-nextp-muted text-xs">
                                {cat?.name ?? "Sem categoria"} · {e.time ?? ""}{e.payment_method ? ` · ${e.payment_method}` : ""}
                              </p>
                            </div>
                            <p className="font-black text-sm shrink-0">{eur(Number(e.amount))}</p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editing && (
        <AddExpenseSheet
          userId={userId}
          categories={categories}
          editing={editing}
          presetCategory={null}
          defaults={{ date: editing.date, time: editing.time ?? "12:00", method: editing.payment_method ?? "Dinheiro" }}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}
