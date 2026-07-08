"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import type { Category, Expense } from "@/lib/types";
import { eur, prettyDate, todayISO } from "@/lib/format";
import { CategoryIcon } from "@/lib/icons";
import AddExpenseSheet from "@/components/AddExpenseSheet";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** HISTORY-01 — extrato com calendário: escolhe qualquer dia e vê/lança gastos nele. */
export default function HistoryView({ userId, onClose }: { userId: string; onClose: () => void }) {
  useLockBodyScroll();
  const today = todayISO();
  const [year, setYear] = useState(Number(today.slice(0, 4)));
  const [month, setMonth] = useState(Number(today.slice(5, 7))); // 1..12
  const [selected, setSelected] = useState(today);
  const [rows, setRows] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [addingDate, setAddingDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const monthKey = `${year}-${pad2(month)}`;

  const load = useCallback(async () => {
    setLoading(true);
    const start = `${monthKey}-01`;
    const end = `${monthKey}-${pad2(new Date(year, month, 0).getDate())}`;
    const sb = getSupabase();
    const [ex, ct] = await Promise.all([
      sb.from("expenses").select("*").eq("user_id", userId).is("deleted_at", null)
        .gte("date", start).lte("date", end),
      sb.from("categories").select("*").eq("user_id", userId),
    ]);
    setRows((ex.data ?? []) as Expense[]);
    setCategories((ct.data ?? []) as Category[]);
    setLoading(false);
  }, [userId, monthKey, year, month]);

  useEffect(() => { load(); }, [load]);

  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const totalsByDay = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) m.set(r.date, (m.get(r.date) ?? 0) + Number(r.amount));
    return m;
  }, [rows]);

  const selectedItems = useMemo(
    () => rows.filter((r) => r.date === selected).sort((a, b) => (b.time ?? "").localeCompare(a.time ?? "")),
    [rows, selected]
  );
  const selectedTotal = useMemo(() => selectedItems.reduce((s, r) => s + Number(r.amount), 0), [selectedItems]);
  const monthTotal = useMemo(() => rows.reduce((s, r) => s + Number(r.amount), 0), [rows]);

  function shiftMonth(delta: number) {
    let m = month + delta, y = year;
    if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; }
    setMonth(m); setYear(y);
    const last = new Date(y, m, 0).getDate();
    const day = Math.min(Number(selected.slice(8, 10)), last);
    setSelected(`${y}-${pad2(m)}-${pad2(day)}`);
  }

  const firstWeekday = new Date(year, month - 1, 1).getDay(); // 0 = domingo
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="fixed inset-0 z-40 bg-nextp-bg flex flex-col" style={{ height: "100dvh" }}>
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <h1 className="text-2xl font-black">Extrato</h1>
        <button onClick={onClose} className="text-nextp-muted font-bold">Fechar</button>
      </div>

      <div className="px-5 space-y-4 flex-1 overflow-y-auto pb-8">
        {/* Calendário */}
        <div className="clay-card space-y-3">
          <div className="flex items-center justify-between">
            <button onClick={() => shiftMonth(-1)} className="text-nextp-blue text-2xl font-black px-2">‹</button>
            <span className="font-black">{MONTHS[month - 1]} {year}</span>
            <button onClick={() => shiftMonth(1)} className="text-nextp-blue text-2xl font-black px-2">›</button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((w, i) => (
              <span key={i} className="text-center text-[10px] font-bold text-nextp-muted">{w}</span>
            ))}
            {cells.map((d, i) => {
              if (d === null) return <div key={`b${i}`} />;
              const dateStr = `${year}-${pad2(month)}-${pad2(d)}`;
              const hasExpenses = totalsByDay.has(dateStr);
              const isToday = dateStr === today;
              const isSelected = dateStr === selected;
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelected(dateStr)}
                  className={`aspect-square rounded-clay flex flex-col items-center justify-center text-xs font-bold relative transition-colors
                    ${isSelected ? "bg-nextp-blue text-white" : isToday ? "ring-2 ring-nextp-blue text-nextp-blue" : "text-nextp-ink active:bg-nextp-cardsoft"}`}
                >
                  {d}
                  {hasExpenses && (
                    <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-nextp-blue"}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Total do mês */}
        <div className="clay-hero flex items-center justify-between py-3 px-4">
          <div className="relative z-10">
            <p className="text-white/80 text-xs font-bold uppercase">Total do mês</p>
            <p className="text-2xl font-black">{eur(monthTotal)}</p>
          </div>
          <p className="relative z-10 text-white/80 text-sm">{rows.length} {rows.length === 1 ? "gasto" : "gastos"}</p>
        </div>

        {/* Extrato do dia selecionado */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-lg">{selected === today ? "Hoje" : prettyDate(selected)}</h2>
            <p className="font-black">{eur(selectedTotal)}</p>
          </div>

          {loading ? (
            <div className="clay-card text-center text-nextp-muted">A carregar…</div>
          ) : selectedItems.length === 0 ? (
            <div className="clay-card text-center text-nextp-muted py-8">Sem gastos neste dia.</div>
          ) : (
            <div className="space-y-2">
              {selectedItems.map((e) => {
                const cat = e.category_id ? catById.get(e.category_id) : undefined;
                return (
                  <button key={e.id} onClick={() => setEditing(e)} className="clay-card w-full flex items-center gap-3 text-left active:scale-[0.99] transition-transform">
                    <div className="w-10 h-10 shrink-0"><CategoryIcon name={cat?.name ?? "Outros"} size={40} /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{e.description}</p>
                      <p className="text-nextp-muted text-xs">
                        {cat?.name ?? "Sem categoria"}{e.time ? ` · ${e.time}` : ""}{e.payment_method ? ` · ${e.payment_method}` : ""}
                      </p>
                    </div>
                    <p className="font-black text-sm shrink-0">{eur(Number(e.amount))}</p>
                  </button>
                );
              })}
            </div>
          )}

          {/* + para lançar num dia qualquer, não só hoje */}
          <button onClick={() => setAddingDate(selected)} className="clay-btn w-full text-sm py-2.5">
            + Adicionar gasto a {selected === today ? "hoje" : prettyDate(selected)}
          </button>
        </div>
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

      {addingDate && (
        <AddExpenseSheet
          userId={userId}
          categories={categories}
          editing={null}
          presetCategory={null}
          defaults={{ date: addingDate, time: "12:00", method: "Dinheiro" }}
          onClose={() => setAddingDate(null)}
          onSaved={() => { setAddingDate(null); load(); }}
        />
      )}
    </div>
  );
}
