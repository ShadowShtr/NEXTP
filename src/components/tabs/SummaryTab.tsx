"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { eur, monthBounds, todayISO } from "@/lib/format";
import { BarChart, DonutChart, Legend, type Slice } from "@/components/charts/Charts";
import { computeStreak } from "@/lib/streak";
import { FeatureIcon } from "@/lib/icons";
import IncomeSheet, { type IncomeEntry } from "@/components/IncomeSheet";
import HistoryView from "@/components/HistoryView";
import { getMonthlyFinance, type MonthlyFinance } from "@/lib/finance";

type Row = { amount: number; date: string; category_id: string | null };
type Cat = { id: string; name: string; color: string; monthly_limit: number | null };
type OccRow = { status: string; expected_amount: number; paid_amount: number };

const DEFAULT_SMALL_LIMIT = 5; // fallback quando o utilizador ainda não configurou (user_settings.small_expense_limit)
const DONUT_COLORS = ["#006DFF", "#12B76A", "#FDB022", "#FF7A9A", "#9B7EDE", "#38C0F0", "#F04438", "#98A2B3"];

function prevMonthFirstDay(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  const py = m === 1 ? y - 1 : y;
  const pm = m === 1 ? 12 : m - 1;
  return `${py}-${String(pm).padStart(2, "0")}-01`;
}

export default function SummaryTab({ userId }: { userId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [prevTotal, setPrevTotal] = useState(0);
  const [occRows, setOccRows] = useState<OccRow[]>([]);
  const [streak, setStreak] = useState(0);
  const [smallLimit, setSmallLimit] = useState(DEFAULT_SMALL_LIMIT);
  const [income, setIncome] = useState<IncomeEntry[]>([]);
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeEntry | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [finance, setFinance] = useState<MonthlyFinance | null>(null);
  const [loading, setLoading] = useState(true);
  const today = todayISO();
  const now = new Date();

  const load = useCallback(async () => {
    const { start, end } = monthBounds(today);
    const prevStart = prevMonthFirstDay(today);
    const { start: prevStartB, end: prevEnd } = monthBounds(prevStart);
    const sb = getSupabase();
    const [ex, ct, prev, occ, settings, inc] = await Promise.all([
      sb.from("expenses").select("amount,date,category_id").eq("user_id", userId).gte("date", start).lte("date", end),
      sb.from("categories").select("id,name,color,monthly_limit").eq("user_id", userId),
      sb.from("expenses").select("amount").eq("user_id", userId).gte("date", prevStartB).lte("date", prevEnd),
      sb.from("recurring_occurrences").select("status,expected_amount,paid_amount")
        .eq("user_id", userId).eq("year", now.getFullYear()).eq("month", now.getMonth() + 1),
      sb.from("user_settings").select("small_expense_limit").eq("user_id", userId).maybeSingle(),
      sb.from("income_entries").select("*").eq("user_id", userId).gte("date", start).lte("date", end).order("date", { ascending: false }),
    ]);
    setRows((ex.data ?? []) as Row[]);
    setCats((ct.data ?? []) as Cat[]);
    setPrevTotal((prev.data ?? []).reduce((s, r) => s + Number(r.amount), 0));
    setOccRows((occ.data ?? []) as OccRow[]);
    setSmallLimit(settings.data?.small_expense_limit ?? DEFAULT_SMALL_LIMIT);
    setIncome((inc.data ?? []) as IncomeEntry[]);
    const f = await getMonthlyFinance(userId, now.getFullYear(), now.getMonth() + 1);
    setFinance(f);
    setLoading(false);
    computeStreak(userId).then(setStreak);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, today]);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const total = rows.reduce((s, r) => s + Number(r.amount), 0);
    const day = rows.filter((r) => r.date === today).reduce((s, r) => s + Number(r.amount), 0);
    const daysElapsed = new Date().getDate();
    const avg = total / Math.max(1, daysElapsed);
    const biggest = rows.reduce((m, r) => Math.max(m, Number(r.amount)), 0);
    const small = rows.filter((r) => Number(r.amount) < smallLimit);
    const smallTotal = small.reduce((s, r) => s + Number(r.amount), 0);
    const change = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : null;
    return { total, day, avg, biggest, smallTotal, smallCount: small.length, count: rows.length, change };
  }, [rows, today, prevTotal, smallLimit]);

  const recurringStats = useMemo(() => {
    let paid = 0, pending = 0;
    occRows.forEach((o) => {
      if (o.status === "PAID") paid += Number(o.expected_amount);
      else pending += Number(o.expected_amount) - Number(o.paid_amount);
    });
    return { paid, pending, total: paid + pending };
  }, [occRows]);

  const donut: Slice[] = useMemo(() => {
    const byCat = new Map<string, number>();
    rows.forEach((r) => {
      const k = r.category_id ?? "none";
      byCat.set(k, (byCat.get(k) ?? 0) + Number(r.amount));
    });
    const catName = new Map(cats.map((c) => [c.id, c.name]));
    return Array.from(byCat.entries())
      .map(([id, value], i) => ({ label: id === "none" ? "Sem categoria" : catName.get(id) ?? "Outros", value, color: DONUT_COLORS[i % DONUT_COLORS.length] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [rows, cats]);

  const byDay = useMemo(() => {
    const out: { label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const iso = todayISO(d);
      const v = rows.filter((r) => r.date === iso).reduce((s, r) => s + Number(r.amount), 0);
      out.push({ label: String(d.getDate()), value: v });
    }
    return out;
  }, [rows]);

  /** BUDGET-02 — progresso por categoria, só para as que têm monthly_limit definido. */
  const categoryLimits = useMemo(() => {
    const spentByCat = new Map<string, number>();
    rows.forEach((r) => {
      if (!r.category_id) return;
      spentByCat.set(r.category_id, (spentByCat.get(r.category_id) ?? 0) + Number(r.amount));
    });
    return cats
      .filter((c) => c.monthly_limit != null && c.monthly_limit > 0)
      .map((c) => {
        const spent = spentByCat.get(c.id) ?? 0;
        const pct = Math.min(100, Math.round((spent / c.monthly_limit!) * 100));
        return { id: c.id, name: c.name, spent, limit: c.monthly_limit!, pct };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [rows, cats]);

  if (loading) return <div className="px-5 py-3"><div className="clay-card text-center text-nextp-muted">A carregar…</div></div>;

  return (
    <div className="px-5 py-3 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Resumo</h1>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/resumo-wallet-growth.png" alt="" width={64} height={64} draggable={false} />
      </div>

      <MotivationalCard streak={streak} monthOnTrack={recurringStats.total > 0 && recurringStats.pending === 0} hasExpenses={stats.count > 0} />

      {/* FINANCE-13 — motor financeiro central: receitas, gastos, saldo atual e previsto */}
      {finance && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Receitas do mês" value={eur(finance.incomeTotal)} success />
            <Stat label="Gastos do mês" value={eur(finance.expenseTotal)} />
            <Stat label="Saldo atual" value={eur(finance.currentBalance)} success={finance.currentBalance >= 0} danger={finance.currentBalance < 0} />
            <Stat label="Saldo previsto" value={eur(finance.projectedBalance)} success={finance.projectedBalance >= 0} danger={finance.projectedBalance < 0} />
          </div>
          {finance.reservedAmount > 0 && (
            <Stat label="Dinheiro livre (após reserva)" value={eur(finance.freeMoney)} success={finance.freeMoney >= 0} danger={finance.freeMoney < 0} />
          )}
        </>
      )}
      <button onClick={() => { setEditingIncome(null); setIncomeOpen(true); }} className="clay-btn-ghost w-full text-sm py-2.5">
        + Nova receita
      </button>
      {income.length > 0 && (
        <div className="space-y-2">
          {income.slice(0, 5).map((i) => (
            <button key={i.id} onClick={() => { setEditingIncome(i); setIncomeOpen(true); }}
              className="clay-card-soft w-full flex items-center justify-between py-2.5 px-3 text-left">
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{i.description}</p>
                <p className="text-nextp-muted text-xs">{i.source ?? "Receita"}</p>
              </div>
              <p className="font-black text-nextp-success shrink-0">+{eur(Number(i.amount))}</p>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Gasto hoje" value={eur(stats.day)} accent />
        <Stat label="Média diária" value={eur(stats.avg)} />
        <Stat label="Maior gasto" value={eur(stats.biggest)} />
      </div>

      {/* FINANCE-16 — previsão de como o mês vai acabar */}
      {finance && finance.daysRemaining > 0 && (
        <div className="clay-card-soft space-y-1">
          <p className="text-sm">
            Ao ritmo atual, vais gastar cerca de <span className="font-black">{eur(finance.projectedExpenseByAverage)}</span> até ao fim do mês.
          </p>
          <p className={`text-sm font-bold ${finance.projectedEndBalance >= 0 ? "text-nextp-success" : "text-nextp-danger"}`}>
            Saldo previsto no fim do mês: {eur(finance.projectedEndBalance)}
          </p>
        </div>
      )}

      {/* Comparação com mês anterior */}
      {stats.change !== null && (
        <div className="clay-card-soft flex items-center justify-between">
          <span className="text-sm text-nextp-muted">Comparado ao mês anterior ({eur(prevTotal)})</span>
          <span className={`font-black text-sm ${stats.change > 0 ? "text-nextp-danger" : "text-nextp-success"}`}>
            {stats.change > 0 ? "▲" : stats.change < 0 ? "▼" : "•"} {Math.abs(stats.change)}%
          </span>
        </div>
      )}

      {/* Gastos por categoria */}
      <div className="clay-card space-y-3">
        <h2 className="font-black">Gastos por categoria</h2>
        {donut.length === 0 ? (
          <p className="text-nextp-muted text-center py-6">Sem dados este mês.</p>
        ) : (
          <div className="flex items-center gap-4">
            <DonutChart data={donut} total={stats.total} />
            <div className="flex-1"><Legend data={donut} /></div>
          </div>
        )}
      </div>

      {/* Evolução diária */}
      <div className="clay-card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-black">Gastos por dia <span className="text-nextp-muted text-xs font-normal">· últimos 7 dias</span></h2>
          <button onClick={() => setHistoryOpen(true)} className="text-nextp-blue text-xs font-bold underline shrink-0">
            Ver histórico
          </button>
        </div>
        <BarChart data={byDay} />
      </div>

      {/* BUDGET-02 — Limites por categoria */}
      {categoryLimits.length > 0 && (
        <div className="clay-card space-y-3">
          <h2 className="font-black">Limites por categoria</h2>
          {categoryLimits.map((c) => (
            <div key={c.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold">{c.name}</span>
                <span className={`font-bold ${c.pct >= 100 ? "text-nextp-danger" : c.pct >= 80 ? "text-nextp-warning" : "text-nextp-muted"}`}>
                  {eur(c.spent)} / {eur(c.limit)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-nextp-cardsoft overflow-hidden">
                <div className={`h-full ${c.pct >= 100 ? "bg-nextp-danger" : c.pct >= 80 ? "bg-nextp-warning" : "bg-nextp-blue"}`} style={{ width: `${c.pct}%` }} />
              </div>
              {c.pct >= 80 && (
                <p className={`text-xs font-bold ${c.pct >= 100 ? "text-nextp-danger" : "text-nextp-warning"}`}>
                  {c.pct >= 100 ? "Limite ultrapassado!" : `Já gastaste ${c.pct}% do limite`}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Recorrentes pagos x pendentes */}
      {recurringStats.total > 0 && (
        <div className="clay-card space-y-3">
          <h2 className="font-black">Contas recorrentes deste mês</h2>
          <div className="h-3 rounded-full bg-nextp-cardsoft overflow-hidden flex">
            <div className="h-full bg-nextp-success" style={{ width: `${(recurringStats.paid / recurringStats.total) * 100}%` }} />
            <div className="h-full bg-nextp-warning" style={{ width: `${(recurringStats.pending / recurringStats.total) * 100}%` }} />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-nextp-success font-bold">Pago: {eur(recurringStats.paid)}</span>
            <span className="text-nextp-warning font-bold">Pendente: {eur(recurringStats.pending)}</span>
          </div>
        </div>
      )}

      {/* Gastos Invisíveis */}
      <div className="clay-hero flex items-center gap-3">
        <div className="relative z-10 flex-1 space-y-1">
          <h2 className="font-black">Gastos Invisíveis</h2>
          <p className="text-3xl font-black">{eur(stats.smallTotal)}</p>
          <p className="text-white/80 text-sm">
            {stats.smallCount} pequenas compras abaixo de {eur(smallLimit)} — somam mais do que parece!
          </p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/features/feature-invisible-expenses.svg" width={72} height={72} alt="" className="relative z-10" draggable={false} />
      </div>

      {incomeOpen && (
        <IncomeSheet
          userId={userId}
          editing={editingIncome}
          onClose={() => { setIncomeOpen(false); setEditingIncome(null); }}
          onSaved={() => { setIncomeOpen(false); setEditingIncome(null); load(); }}
        />
      )}

      {historyOpen && <HistoryView userId={userId} onClose={() => setHistoryOpen(false)} />}
    </div>
  );
}

/** TASK 20 — Dashboard motivacional: mensagem, sequência de dias e conquistas. */
function MotivationalCard({ streak, monthOnTrack, hasExpenses }: { streak: number; monthOnTrack: boolean; hasExpenses: boolean }) {
  const message = streak >= 7
    ? "Você está indo muito bem! 🔥"
    : hasExpenses
      ? "Continue registando os teus gastos!"
      : "Vamos começar a registar hoje?";

  const achievements: { icon: "trophy" | "calendar-check" | "shield"; label: string; unlocked: boolean }[] = [
    { icon: "trophy", label: "Primeiro gasto", unlocked: hasExpenses },
    { icon: "calendar-check", label: "7 dias seguidos", unlocked: streak >= 7 },
    { icon: "shield", label: "Mês no azul", unlocked: monthOnTrack },
  ];

  return (
    <div className="clay-hero space-y-3">
      <div className="relative z-10 flex items-center gap-3">
        <FeatureIcon name="trophy" size={48} />
        <div>
          <p className="font-black text-lg">{message}</p>
          {streak > 0 && <p className="text-white/80 text-sm">Sequência: {streak} {streak === 1 ? "dia" : "dias"} registando gastos</p>}
        </div>
      </div>
      <div className="relative z-10 flex gap-3">
        {achievements.map((a) => (
          <div key={a.label} className={`flex-1 flex flex-col items-center gap-1 rounded-clay py-2 ${a.unlocked ? "bg-white/15" : "bg-white/5 opacity-50"}`}>
            <FeatureIcon name={a.icon} size={28} />
            <span className="text-[10px] font-bold text-center leading-tight">{a.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, accent, success, danger }: { label: string; value: string; accent?: boolean; success?: boolean; danger?: boolean }) {
  const color = danger ? "text-nextp-danger" : success ? "text-nextp-success" : accent ? "text-nextp-blue" : "";
  return (
    <div className="clay-card-soft">
      <p className="text-nextp-muted text-xs font-bold uppercase">{label}</p>
      <p className={`text-xl font-black ${color}`}>{value}</p>
    </div>
  );
}
