"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import type { Category, Expense } from "@/lib/types";
import { eur, monthBounds, todayISO } from "@/lib/format";
import { CategoryIcon } from "@/lib/icons";
import BudgetSheet from "@/components/BudgetSheet";
import { getMonthlyFinance, type MonthlyFinance } from "@/lib/finance";
import QuickExpenseManageSheet from "@/components/QuickExpenseManageSheet";
import { launchQuickExpense, listQuickExpenses, type QuickExpenseTemplate } from "@/lib/quickExpense";
import HistoryView from "@/components/HistoryView";

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
  const [budgetSheetOpen, setBudgetSheetOpen] = useState(false);
  const [finance, setFinance] = useState<MonthlyFinance | null>(null);
  const [quickExpenses, setQuickExpenses] = useState<QuickExpenseTemplate[]>([]);
  const [manageQuickOpen, setManageQuickOpen] = useState(false);
  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const dayTotal = useMemo(() => dayExpenses.reduce((s, e) => s + Number(e.amount), 0), [dayExpenses]);

  const load = useCallback(async () => {
    const sb = getSupabase();
    const { start, end } = monthBounds(today);
    const now = new Date();
    const [day, month, settings, f, quick] = await Promise.all([
      sb.from("expenses").select("*").eq("user_id", userId).is("deleted_at", null).eq("date", today).order("time", { ascending: false }),
      sb.from("expenses").select("amount").eq("user_id", userId).is("deleted_at", null).gte("date", start).lte("date", end),
      sb.from("user_settings").select("monthly_budget").eq("user_id", userId).maybeSingle(),
      getMonthlyFinance(userId, now.getFullYear(), now.getMonth() + 1),
      listQuickExpenses(userId),
    ]);
    if (day.data) setDayExpenses(day.data as Expense[]);
    if (month.data) setMonthTotal(month.data.reduce((s, r) => s + Number(r.amount), 0));
    setBudget(settings.data?.monthly_budget ?? null);
    setFinance(f);
    setQuickExpenses(quick.slice(0, 8));
    setLoading(false);
  }, [userId, today]);

  async function launch(t: QuickExpenseTemplate) {
    setLaunchingId(t.id);
    await launchQuickExpense(userId, t);
    setLaunchingId(null);
    load();
  }

  useEffect(() => { load(); }, [load]);

  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const pct = budget && budget > 0 ? Math.min(100, Math.round((monthTotal / budget) * 100)) : null;


  return (
    <div className="px-5 py-2 space-y-4">
      {/* Cards Hoje + Este mês — os cards TERMINAM antes do mascote (mr): atrás dele
          fica o fundo branco da página; ele só sobrepõe a ponta de cada card e
          desce até à linha final do card Este mês. */}
      <div className="relative pt-4">
        <button onClick={() => setHistoryOpen(true)} className="clay-hero block w-full text-left py-4 px-4 mr-28 active:scale-[0.99] transition-transform">
          <div className="relative z-10">
            <p className="text-white/80 text-xs font-bold">Hoje</p>
            <p className="text-3xl font-black leading-tight">{eur(dayTotal)}</p>
            <p className="text-white/80 text-xs">{dayExpenses.length} {dayExpenses.length === 1 ? "gasto" : "gastos"} · toca para ver o extrato</p>
          </div>
        </button>

        <button onClick={() => setBudgetSheetOpen(true)} className="clay-card block text-left space-y-2 py-4 px-4 mt-3" style={{ width: "calc(100% - 7rem)" }}>
          <p className="text-nextp-muted text-xs font-bold uppercase">Este mês</p>
          <p className="text-2xl font-black leading-tight">{eur(monthTotal)}</p>
          <p className="text-nextp-muted text-xs">
            {budget ? `de ${eur(budget)}${pct !== null ? ` · ${pct}%` : ""}` : "definir orçamento"}
          </p>
          {pct !== null && (
            <div className="h-2.5 rounded-full bg-nextp-cardsoft overflow-hidden">
              <div className={`h-full ${pct >= 100 ? "bg-nextp-danger" : "bg-nextp-blue"}`} style={{ width: `${pct}%` }} />
            </div>
          )}
        </button>

        {/* Ancorado pela BASE: bottom 0 = linha final do card Este mês (nunca fica a "voar"). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/illustrations/registos-mascot.png"
          alt=""
          width={215}
          height={240}
          className="absolute z-20 pointer-events-none select-none"
          style={{ bottom: "0px", right: "-6px" }}
          draggable={false}
        />
      </div>

      {/* FINANCE-14 — quanto posso gastar por dia até ao fim do mês */}
      {finance && finance.daysRemaining > 0 && (
        <div className={`clay-card-soft text-sm ${finance.dailyAvailable < 0 ? "text-nextp-danger" : ""}`}>
          {finance.dailyAvailable >= 0 ? (
            <>Podes gastar até <span className="font-black">{eur(finance.dailyAvailable)}/dia</span> para fechar o mês positivo ({finance.daysRemaining} dias restantes).</>
          ) : (
            <>Atenção: contando as contas pendentes, o mês já está negativo em {eur(Math.abs(finance.projectedBalance))}.</>
          )}
        </div>
      )}

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

      {/* UX-04 — gastos rápidos favoritos */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="font-black text-sm">Gastos rápidos</p>
          <button onClick={() => setManageQuickOpen(true)} className="text-nextp-blue text-xs font-bold underline">Gerir</button>
        </div>
        {quickExpenses.length === 0 ? (
          <button onClick={() => setManageQuickOpen(true)} className="clay-card-soft w-full text-center text-nextp-muted text-sm py-3">
            + Cria atalhos para os gastos que repetes (café, pão, uber…)
          </button>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {quickExpenses.map((t) => (
              <button key={t.id} onClick={() => launch(t)} disabled={launchingId === t.id}
                className="clay-chip whitespace-nowrap shrink-0 bg-nextp-cardsoft text-nextp-ink active:scale-95 transition-transform">
                {launchingId === t.id ? "…" : `${t.description} · ${eur(t.amount)}`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Últimos gastos */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-lg">Gastos de hoje</h2>
          <div className="flex items-center gap-3">
            <button onClick={() => setHistoryOpen(true)} className="text-nextp-blue text-xs font-bold underline">
              Ver extrato completo
            </button>
            <span className="text-nextp-muted text-sm">{dayExpenses.length}</span>
          </div>
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

      {budgetSheetOpen && (
        <BudgetSheet
          userId={userId}
          current={budget}
          onClose={() => setBudgetSheetOpen(false)}
          onSaved={(v) => { setBudget(v); setBudgetSheetOpen(false); }}
        />
      )}

      {manageQuickOpen && (
        <QuickExpenseManageSheet
          userId={userId}
          categories={categories}
          onClose={() => setManageQuickOpen(false)}
          onChanged={load}
        />
      )}

      {historyOpen && (
        <HistoryView userId={userId} onClose={() => { setHistoryOpen(false); load(); }} />
      )}
    </div>
  );
}
