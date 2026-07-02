"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { getSupabase } from "@/lib/supabase";
import { eur, prettyDate } from "@/lib/format";
import { CategoryIcon, PaymentDot, type DotState } from "@/lib/icons";
import { ensureOccurrences, togglePaid, type Occurrence, type RecurringPayment } from "@/lib/recurring";
import RecurringDetailSheet from "@/components/RecurringDetailSheet";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

type PlanningItem = {
  id: string; name: string; type: string; total_amount: number; paid_amount: number;
  due_date: string | null; status: string;
};

const PLAN_TABS: [string, string][] = [
  ["FUTURE_BILL", "Contas"], ["DEBT", "Dívidas"], ["WISH", "Compras"], ["GOAL", "Objetivos"],
];

export default function PlanningTab({ userId }: { userId: string }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [payments, setPayments] = useState<RecurringPayment[]>([]);
  const [occ, setOcc] = useState<Occurrence[]>([]);
  const [items, setItems] = useState<PlanningItem[]>([]);
  const [planTab, setPlanTab] = useState<string>("FUTURE_BILL");
  const [loading, setLoading] = useState(true);
  const [openRec, setOpenRec] = useState(false);
  const [openPlan, setOpenPlan] = useState(false);
  const [detail, setDetail] = useState<{ payment: RecurringPayment; occ: Occurrence } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    await ensureOccurrences(userId, year, month);
    const sb = getSupabase();
    const [p, o, f] = await Promise.all([
      sb.from("recurring_payments").select("id,name,amount,due_day,category_id,repeat_type,is_active").eq("user_id", userId).eq("is_active", true),
      sb.from("recurring_occurrences").select("*").eq("user_id", userId).eq("year", year).eq("month", month),
      sb.from("planning_items").select("*").eq("user_id", userId).neq("type", "RECURRING").order("due_date"),
    ]);
    setPayments((p.data ?? []) as RecurringPayment[]);
    setOcc((o.data ?? []) as Occurrence[]);
    setItems((f.data ?? []) as PlanningItem[]);
    setLoading(false);
  }, [userId, year, month]);

  useEffect(() => { load(); }, [load]);

  const byPayment = useMemo(() => {
    const m = new Map<string, Occurrence>();
    occ.forEach((o) => m.set(o.recurring_payment_id, o));
    return m;
  }, [occ]);

  const totals = useMemo(() => {
    let paid = 0, pending = 0, total = 0;
    occ.forEach((o) => {
      total += Number(o.expected_amount);
      if (o.status === "PAID") paid += Number(o.expected_amount);
      else pending += Number(o.expected_amount) - Number(o.paid_amount);
    });
    return { paid, pending, total };
  }, [occ]);

  const itemsForTab = useMemo(() => items.filter((it) => it.type === planTab), [items, planTab]);

  function shiftMonth(delta: number) {
    let m = month + delta, y = year;
    if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; }
    setMonth(m); setYear(y);
  }

  async function onQuickToggle(o: Occurrence) {
    setOcc((prev) => prev.map((x) => x.id === o.id
      ? { ...x, status: x.status === "PAID" ? "PENDING" : "PAID", paid_amount: x.status === "PAID" ? 0 : x.expected_amount }
      : x));
    await togglePaid(userId, o);
    load();
  }

  return (
    <div className="px-5 py-3 space-y-4">
      <h1 className="text-2xl font-black">Planeamento</h1>

      {/* Seletor de mês */}
      <div className="clay-card flex items-center justify-between">
        <button onClick={() => shiftMonth(-1)} className="text-nextp-blue text-2xl font-black px-2">‹</button>
        <span className="font-black">{MONTHS[month - 1]} {year}</span>
        <button onClick={() => shiftMonth(1)} className="text-nextp-blue text-2xl font-black px-2">›</button>
      </div>

      {/* Totais do mês */}
      <div className="grid grid-cols-3 gap-2">
        <div className="clay-card-soft text-center py-3">
          <p className="text-[10px] text-nextp-muted font-bold uppercase">Total</p>
          <p className="font-black text-sm">{eur(totals.total)}</p>
        </div>
        <div className="clay-card-soft text-center py-3">
          <p className="text-[10px] text-nextp-muted font-bold uppercase">Pago</p>
          <p className="font-black text-sm text-nextp-success">{eur(totals.paid)}</p>
        </div>
        <div className="clay-card-soft text-center py-3">
          <p className="text-[10px] text-nextp-muted font-bold uppercase">Pendente</p>
          <p className="font-black text-sm text-nextp-warning">{eur(totals.pending)}</p>
        </div>
      </div>

      {/* Checklist de contas recorrentes */}
      <div className="space-y-2">
        <h2 className="font-black text-lg">Contas recorrentes</h2>
        {loading ? (
          <div className="clay-card text-center text-nextp-muted">A carregar…</div>
        ) : payments.length === 0 ? (
          <div className="clay-card text-center text-nextp-muted py-8">Sem contas recorrentes. Toca em “+ Nova conta recorrente”.</div>
        ) : (
          payments.map((p) => {
            const o = byPayment.get(p.id);
            if (!o) return null;
            const dot = o.status.toLowerCase() as DotState;
            return (
              <div key={p.id} className="clay-card flex items-center gap-3">
                <button onClick={() => setDetail({ payment: p, occ: o })} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                  <div className="w-11 h-11 shrink-0"><CategoryIcon name={p.name} size={44} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{p.name}</p>
                    <p className="text-nextp-muted text-xs">{eur(Number(p.amount))} · vence {prettyDate(o.due_date)}</p>
                  </div>
                </button>
                <button onClick={() => onQuickToggle(o)} aria-label={o.status === "PAID" ? "marcar pendente" : "marcar pago"}
                  className="shrink-0 active:scale-90 transition-transform">
                  <PaymentDot state={dot} size={34} />
                </button>
              </div>
            );
          })
        )}
        <button onClick={() => setOpenRec(true)} className="clay-btn w-full">+ Nova conta recorrente</button>
      </div>

      {/* Contas / dívidas / compras / objetivos (tabs) */}
      <div className="space-y-2">
        <h2 className="font-black text-lg">Contas, dívidas e compras futuras</h2>
        <div className="flex gap-2 clay-card-soft p-1.5">
          {PLAN_TABS.map(([v, l]) => (
            <button key={v} onClick={() => setPlanTab(v)}
              className={`flex-1 py-1.5 rounded-clay font-bold text-xs transition-colors ${planTab === v ? "bg-nextp-blue text-white shadow-clay-sm" : "text-nextp-muted"}`}>
              {l}
            </button>
          ))}
        </div>

        {itemsForTab.length === 0 ? (
          <div className="clay-card text-center text-nextp-muted py-8">Sem itens nesta categoria.</div>
        ) : (
          itemsForTab.map((it) => {
            const pct = it.total_amount > 0 ? Math.min(100, Math.round((it.paid_amount / it.total_amount) * 100)) : 0;
            return (
              <div key={it.id} className="clay-card space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-bold">{it.name}</p>
                  <p className="font-black">{eur(Number(it.total_amount))}</p>
                </div>
                <div className="flex items-center justify-between text-xs text-nextp-muted">
                  <span>{it.due_date ? `Vence ${prettyDate(it.due_date)}` : "Sem data"}</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-nextp-cardsoft overflow-hidden">
                  <div className="h-full bg-nextp-blue" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })
        )}
        <button onClick={() => setOpenPlan(true)} className="clay-btn-ghost w-full">+ Nova conta ou dívida</button>
      </div>

      {openRec && <RecurringSheet userId={userId} onClose={() => setOpenRec(false)} onSaved={() => { setOpenRec(false); load(); }} />}
      {openPlan && (
        <PlanSheet userId={userId} defaultType={planTab} onClose={() => setOpenPlan(false)} onSaved={() => { setOpenPlan(false); load(); }} />
      )}
      {detail && (
        <RecurringDetailSheet
          userId={userId}
          payment={detail.payment}
          occurrence={detail.occ}
          onClose={() => setDetail(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}

function RecurringSheet({ userId, onClose, onSaved }: { userId: string; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [day, setDay] = useState("1");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    const value = parseFloat(amount.replace(",", "."));
    const d = parseInt(day, 10);
    if (!name.trim()) return setErr("Nome em falta.");
    if (!value || value <= 0) return setErr("Valor inválido.");
    if (!d || d < 1 || d > 31) return setErr("Dia entre 1 e 31.");
    setSaving(true);
    const { error } = await getSupabase().from("recurring_payments").insert({
      user_id: userId, name: name.trim(), amount: value, due_day: d,
      repeat_type: "MONTHLY", start_date: new Date().toISOString().slice(0, 10), is_active: true,
    });
    setSaving(false);
    if (error) return setErr(error.message);
    onSaved();
  }

  return (
    <SheetShell title="Nova conta recorrente" onClose={onClose}>
      <input className="clay-input" placeholder="Nome (ex.: Internet, Netflix)" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <div className="grid grid-cols-2 gap-3">
        <input className="clay-input" inputMode="decimal" placeholder="Valor (€)" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <input className="clay-input" inputMode="numeric" placeholder="Dia venc. (1-31)" value={day} onChange={(e) => setDay(e.target.value)} />
      </div>
      {err && <p className="text-nextp-danger text-sm text-center">{err}</p>}
      <button className="clay-btn w-full text-lg" onClick={save} disabled={saving}>{saving ? "A guardar…" : "Guardar conta"}</button>
    </SheetShell>
  );
}

function PlanSheet({ userId, defaultType, onClose, onSaved }: { userId: string; defaultType: string; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState(defaultType);
  const [due, setDue] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    const value = parseFloat(amount.replace(",", "."));
    if (!name.trim()) return setErr("Nome em falta.");
    if (!value || value <= 0) return setErr("Valor inválido.");
    setSaving(true);
    const { error } = await getSupabase().from("planning_items").insert({
      user_id: userId, name: name.trim(), type, total_amount: value, paid_amount: 0,
      due_date: due || null, status: "PENDING",
    });
    setSaving(false);
    if (error) return setErr(error.message);
    onSaved();
  }

  return (
    <SheetShell title="Nova conta / dívida / compra" onClose={onClose}>
      <input className="clay-input" placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <div className="flex gap-2 overflow-x-auto pb-1">
        {PLAN_TABS.map(([v, l]) => (
          <button key={v} onClick={() => setType(v)}
            className={`clay-chip whitespace-nowrap ${type === v ? "bg-nextp-blue text-white" : "bg-nextp-cardsoft text-nextp-ink"}`}>{l}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input className="clay-input" inputMode="decimal" placeholder="Valor (€)" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <input type="date" className="clay-input" value={due} onChange={(e) => setDue(e.target.value)} />
      </div>
      {err && <p className="text-nextp-danger text-sm text-center">{err}</p>}
      <button className="clay-btn w-full text-lg" onClick={save} disabled={saving}>{saving ? "A guardar…" : "Guardar"}</button>
    </SheetShell>
  );
}

function SheetShell({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-clay-xl shadow-clay p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">{title}</h2>
          <button onClick={onClose} className="text-nextp-muted font-bold">Fechar</button>
        </div>
        {children}
      </div>
    </div>
  );
}
