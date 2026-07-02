"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { eur, monthBounds, todayISO } from "@/lib/format";
import { BarChart, DonutChart, Legend, type Slice } from "@/components/charts/Charts";
import { computeStreak } from "@/lib/streak";
import { FeatureIcon } from "@/lib/icons";

type Row = { amount: number; date: string; category_id: string | null };
type Cat = { id: string; name: string; color: string };
type OccRow = { status: string; expected_amount: number; paid_amount: number };

const SMALL_LIMIT = 5; // Gastos Invisíveis (< 5 €)
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
  const [loading, setLoading] = useState(true);
  const today = todayISO();
  const now = new Date();

  const load = useCallback(async () => {
    const { start, end } = monthBounds(today);
    const prevStart = prevMonthFirstDay(today);
    const { start: prevStartB, end: prevEnd } = monthBounds(prevStart);
    const sb = getSupabase();
    const [ex, ct, prev, occ] = await Promise.all([
      sb.from("expenses").select("amount,date,category_id").eq("user_id", userId).gte("date", start).lte("date", end),
      sb.from("categories").select("id,name,color").eq("user_id", userId),
      sb.from("expenses").select("amount").eq("user_id", userId).gte("date", prevStartB).lte("date", prevEnd),
      sb.from("recurring_occurrences").select("status,expected_amount,paid_amount")
        .eq("user_id", userId).eq("year", now.getFullYear()).eq("month", now.getMonth() + 1),
    ]);
    setRows((ex.data ?? []) as Row[]);
    setCats((ct.data ?? []) as Cat[]);
    setPrevTotal((prev.data ?? []).reduce((s, r) => s + Number(r.amount), 0));
    setOccRows((occ.data ?? []) as OccRow[]);
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
    const small = rows.filter((r) => Number(r.amount) < SMALL_LIMIT);
    const smallTotal = small.reduce((s, r) => s + Number(r.amount), 0);
    const change = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : null;
    return { total, day, avg, biggest, smallTotal, smallCount: small.length, count: rows.length, change };
  }, [rows, today, prevTotal]);

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

  if (loading) return <div className="px-5 py-3"><div className="clay-card text-center text-nextp-muted">A carregar…</div></div>;

  return (
    <div className="px-5 py-3 space-y-4">
      <h1 className="text-2xl font-black">Resumo</h1>

      <MotivationalCard streak={streak} monthOnTrack={recurringStats.total > 0 && recurringStats.pending === 0} hasExpenses={stats.count > 0} />

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Gasto hoje" value={eur(stats.day)} accent />
        <Stat label="Gasto no mês" value={eur(stats.total)} />
        <Stat label="Média diária" value={eur(stats.avg)} />
        <Stat label="Maior gasto" value={eur(stats.biggest)} />
      </div>

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
        <h2 className="font-black">Gastos por dia <span className="text-nextp-muted text-xs font-normal">· últimos 7 dias</span></h2>
        <BarChart data={byDay} />
      </div>

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
      <div className="clay-card bg-gradient-to-br from-nextp-blue to-[#3D93FF] text-white flex items-center gap-3">
        <div className="flex-1 space-y-1">
          <h2 className="font-black">Gastos Invisíveis</h2>
          <p className="text-3xl font-black">{eur(stats.smallTotal)}</p>
          <p className="text-white/80 text-sm">
            {stats.smallCount} pequenas compras abaixo de {eur(SMALL_LIMIT)} — somam mais do que parece!
          </p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/features/feature-invisible-expenses.svg" width={72} height={72} alt="" draggable={false} />
      </div>
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
    <div className="clay-card bg-nextp-blue text-white space-y-3">
      <div className="flex items-center gap-3">
        <FeatureIcon name="trophy" size={48} />
        <div>
          <p className="font-black text-lg">{message}</p>
          {streak > 0 && <p className="text-white/80 text-sm">Sequência: {streak} {streak === 1 ? "dia" : "dias"} registando gastos</p>}
        </div>
      </div>
      <div className="flex gap-3">
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

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="clay-card-soft">
      <p className="text-nextp-muted text-xs font-bold uppercase">{label}</p>
      <p className={`text-xl font-black ${accent ? "text-nextp-blue" : ""}`}>{value}</p>
    </div>
  );
}
