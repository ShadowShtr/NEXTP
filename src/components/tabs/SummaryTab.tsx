"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { eur, monthBounds, todayISO } from "@/lib/format";
import { BarChart, DonutChart, Legend, type Slice } from "@/components/charts/Charts";

type Row = { amount: number; date: string; category_id: string | null };
type Cat = { id: string; name: string; color: string };

const SMALL_LIMIT = 5; // Gastos Invisíveis (< 5 €)
const DONUT_COLORS = ["#006DFF", "#12B76A", "#FDB022", "#FF7A9A", "#9B7EDE", "#38C0F0", "#F04438", "#98A2B3"];

export default function SummaryTab({ userId }: { userId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const today = todayISO();

  const load = useCallback(async () => {
    const { start, end } = monthBounds(today);
    const sb = getSupabase();
    const [ex, ct] = await Promise.all([
      sb.from("expenses").select("amount,date,category_id").eq("user_id", userId).gte("date", start).lte("date", end),
      sb.from("categories").select("id,name,color").eq("user_id", userId),
    ]);
    setRows((ex.data ?? []) as Row[]);
    setCats((ct.data ?? []) as Cat[]);
    setLoading(false);
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
    return { total, day, avg, biggest, smallTotal, smallCount: small.length, count: rows.length };
  }, [rows, today]);

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
    // últimos 7 dias
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

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Gasto hoje" value={eur(stats.day)} accent />
        <Stat label="Gasto no mês" value={eur(stats.total)} />
        <Stat label="Média diária" value={eur(stats.avg)} />
        <Stat label="Maior gasto" value={eur(stats.biggest)} />
      </div>

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

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="clay-card-soft">
      <p className="text-nextp-muted text-xs font-bold uppercase">{label}</p>
      <p className={`text-xl font-black ${accent ? "text-nextp-blue" : ""}`}>{value}</p>
    </div>
  );
}
