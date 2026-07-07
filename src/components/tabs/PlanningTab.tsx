"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { getSupabase } from "@/lib/supabase";
import { eur, prettyDate } from "@/lib/format";
import { CategoryIcon, PaymentDot, type DotState } from "@/lib/icons";
import { ensureOccurrences, installmentLabel, togglePaid, type Occurrence, type RecurringPayment } from "@/lib/recurring";
import RecurringDetailSheet from "@/components/RecurringDetailSheet";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";
import { softDelete } from "@/lib/trash";
import { logActivity } from "@/lib/activityLog";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

type PlanningItem = {
  id: string; name: string; type: string; total_amount: number; paid_amount: number;
  due_date: string | null; status: string;
};

const PLAN_TABS: [string, string][] = [
  ["FUTURE_BILL", "Contas"], ["DEBT", "Dívidas"], ["WISH", "Compras"], ["GOAL", "Objetivos"],
];

/** Agrupa itens por "Este mês / Próximo mês / Mais tarde / Sem data" e soma cada grupo. */
function groupByMonth(items: PlanningItem[]) {
  const today = new Date();
  const curKey = `${today.getFullYear()}-${today.getMonth()}`;
  const next = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const nextKey = `${next.getFullYear()}-${next.getMonth()}`;

  const groups = { thisMonth: 0, nextMonth: 0, later: 0, noDate: 0 };
  for (const it of items) {
    if (!it.due_date) { groups.noDate += Number(it.total_amount); continue; }
    const d = new Date(it.due_date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (key === curKey) groups.thisMonth += Number(it.total_amount);
    else if (key === nextKey) groups.nextMonth += Number(it.total_amount);
    else groups.later += Number(it.total_amount);
  }
  return groups;
}

type Props = { userId: string; autoOpen?: "recurring" | "debt" | null; autoOpenToken?: number };

export default function PlanningTab({ userId, autoOpen, autoOpenToken }: Props) {
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
  const [editingPlan, setEditingPlan] = useState<PlanningItem | null>(null);
  const [editingRecurring, setEditingRecurring] = useState<RecurringPayment | null>(null);
  const [detail, setDetail] = useState<{ payment: RecurringPayment; occ: Occurrence } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    await ensureOccurrences(userId, year, month);
    const sb = getSupabase();
    const [p, o, f] = await Promise.all([
      sb.from("recurring_payments").select("id,name,amount,due_day,category_id,repeat_type,is_active,start_date,end_date").eq("user_id", userId).eq("is_active", true),
      sb.from("recurring_occurrences").select("*").eq("user_id", userId).eq("year", year).eq("month", month),
      sb.from("planning_items").select("*").eq("user_id", userId).is("deleted_at", null).neq("type", "RECURRING").order("due_date"),
    ]);
    setPayments((p.data ?? []) as RecurringPayment[]);
    setOcc((o.data ?? []) as Occurrence[]);
    setItems((f.data ?? []) as PlanningItem[]);
    setLoading(false);
  }, [userId, year, month]);

  useEffect(() => { load(); }, [load]);

  // UX-03 — chegou aqui a partir do menu rápido do botão + (Nova conta fixa / Nova dívida).
  useEffect(() => {
    if (!autoOpen) return;
    if (autoOpen === "recurring") setOpenRec(true);
    else { setPlanTab("DEBT"); setOpenPlan(true); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenToken]);

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
  const tabTotal = useMemo(() => itemsForTab.reduce((s, it) => s + Number(it.total_amount), 0), [itemsForTab]);
  const monthGroups = useMemo(() => groupByMonth(itemsForTab), [itemsForTab]);

  function shiftMonth(delta: number) {
    let m = month + delta, y = year;
    if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; }
    setMonth(m); setYear(y);
  }

  async function onQuickToggle(o: Occurrence) {
    // Atualização otimista local — sem recarregar a página (evita saltar para o topo).
    const nowPaying = o.status !== "PAID";
    setOcc((prev) => prev.map((x) => x.id === o.id
      ? { ...x, status: nowPaying ? "PAID" : "PENDING", paid_amount: nowPaying ? x.expected_amount : 0 }
      : x));
    const { error } = await togglePaid(userId, o);
    if (error) {
      // reverte se a gravação falhar
      setOcc((prev) => prev.map((x) => (x.id === o.id ? o : x)));
    }
  }

  return (
    <div className="px-5 py-3 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Planeamento</h1>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/planeamento-piggybank.png" alt="" width={64} height={64} draggable={false} />
      </div>

      {/* Seletor de mês */}
      <div className="clay-card flex items-center justify-between">
        <button onClick={() => shiftMonth(-1)} className="text-nextp-blue text-2xl font-black px-2">‹</button>
        <span className="font-black">{MONTHS[month - 1]} {year}</span>
        <button onClick={() => shiftMonth(1)} className="text-nextp-blue text-2xl font-black px-2">›</button>
      </div>

      {/* Totais do mês (recorrentes) */}
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
            const installment = installmentLabel(p, year, month);
            return (
              <div key={p.id} className="clay-card flex items-center gap-3">
                <button onClick={() => setDetail({ payment: p, occ: o })} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                  <div className="w-11 h-11 shrink-0"><CategoryIcon name={p.name} size={44} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{p.name}</p>
                    <p className="text-nextp-muted text-xs">
                      {eur(Number(p.amount))} · vence dia {p.due_day}
                      {installment && <span className="text-nextp-blue font-bold"> · parcela {installment}</span>}
                    </p>
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

        {/* Soma total + por mês (previsto para gastar) */}
        {itemsForTab.length > 0 && (
          <div className="clay-card-soft space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Total previsto</span>
              <span className="font-black">{eur(tabTotal)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {monthGroups.thisMonth > 0 && <MonthPill label="Este mês" value={monthGroups.thisMonth} />}
              {monthGroups.nextMonth > 0 && <MonthPill label="Próximo mês" value={monthGroups.nextMonth} />}
              {monthGroups.later > 0 && <MonthPill label="Mais tarde" value={monthGroups.later} />}
              {monthGroups.noDate > 0 && <MonthPill label="Sem data" value={monthGroups.noDate} />}
            </div>
          </div>
        )}

        {itemsForTab.length === 0 ? (
          <div className="clay-card text-center text-nextp-muted py-8">Sem itens nesta categoria.</div>
        ) : (
          itemsForTab.map((it) => {
            const pct = it.total_amount > 0 ? Math.min(100, Math.round((it.paid_amount / it.total_amount) * 100)) : 0;
            return (
              <button key={it.id} onClick={() => setEditingPlan(it)} className="clay-card w-full text-left space-y-2 block">
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
              </button>
            );
          })
        )}
        <button onClick={() => setOpenPlan(true)} className="clay-btn-ghost w-full">+ Nova conta ou dívida</button>
      </div>

      {openRec && <RecurringSheet userId={userId} editing={null} onClose={() => setOpenRec(false)} onSaved={() => { setOpenRec(false); load(); }} />}
      {editingRecurring && (
        <RecurringSheet userId={userId} editing={editingRecurring} onClose={() => setEditingRecurring(null)} onSaved={() => { setEditingRecurring(null); load(); }} />
      )}
      {(openPlan || editingPlan) && (
        <PlanSheet
          userId={userId}
          defaultType={planTab}
          editing={editingPlan}
          onClose={() => { setOpenPlan(false); setEditingPlan(null); }}
          onSaved={() => { setOpenPlan(false); setEditingPlan(null); load(); }}
        />
      )}
      {detail && (
        <RecurringDetailSheet
          userId={userId}
          payment={detail.payment}
          occurrence={detail.occ}
          onClose={() => setDetail(null)}
          onChanged={load}
          onEdit={(p) => { setDetail(null); setEditingRecurring(p); }}
        />
      )}
    </div>
  );
}

function MonthPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-clay px-2.5 py-1.5 flex items-center justify-between">
      <span className="text-nextp-muted font-bold">{label}</span>
      <span className="font-black">{eur(value)}</span>
    </div>
  );
}

function addMonths(dateStr: string, months: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const total = m - 1 + months;
  const ny = y + Math.floor(total / 12);
  const nm = (total % 12) + 1;
  const last = new Date(ny, nm, 0).getDate();
  return `${ny}-${String(nm).padStart(2, "0")}-${String(Math.min(d, last)).padStart(2, "0")}`;
}

function monthsBetween(startStr: string, endStr: string): number {
  const [sy, sm] = startStr.split("-").map(Number);
  const [ey, em] = endStr.split("-").map(Number);
  return (ey - sy) * 12 + (em - sm) + 1;
}

function RecurringSheet({ userId, editing, onClose, onSaved }: { userId: string; editing: RecurringPayment | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!editing;
  const [name, setName] = useState(editing?.name ?? "");
  const [amount, setAmount] = useState(editing ? String(editing.amount).replace(".", ",") : "");
  const [day, setDay] = useState(editing ? String(editing.due_day) : "1");
  const [startDate, setStartDate] = useState(editing?.start_date ?? new Date().toISOString().slice(0, 10));
  const [hasInstallments, setHasInstallments] = useState(!!editing?.end_date);
  const [installments, setInstallments] = useState(
    editing?.end_date && editing?.start_date ? String(monthsBetween(editing.start_date, editing.end_date)) : ""
  );
  const [totalAmount, setTotalAmount] = useState(""); // INSTALLMENTS-01 — só para calcular o valor da parcela
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function calcInstallmentAmount() {
    const total = parseFloat(totalAmount.replace(",", "."));
    const n = parseInt(installments, 10);
    if (!total || total <= 0 || !n || n < 1) return;
    setAmount((total / n).toFixed(2).replace(".", ","));
  }

  async function save() {
    const value = parseFloat(amount.replace(",", "."));
    const d = parseInt(day, 10);
    if (!name.trim()) return setErr("Nome em falta.");
    if (!value || value <= 0) return setErr("Valor inválido.");
    if (!d || d < 1 || d > 31) return setErr("Dia entre 1 e 31.");
    setSaving(true);

    if (isEdit) {
      // Editar só ajusta nome/valor/dia de vencimento — não mexe na data de
      // início nem nas parcelas de uma conta já criada.
      const { error } = await getSupabase()
        .from("recurring_payments")
        .update({ name: name.trim(), amount: value, due_day: d, updated_at: new Date().toISOString() })
        .eq("id", editing!.id);
      setSaving(false);
      if (error) return setErr(error.message);
      logActivity(userId, "recurring_payment", "UPDATED", name.trim(), value, editing!.id);
      return onSaved();
    }

    if (!startDate) { setSaving(false); return setErr("Data de início em falta."); }
    let endDate: string | null = null;
    if (hasInstallments) {
      const n = parseInt(installments, 10);
      if (!n || n < 1) { setSaving(false); return setErr("Número de parcelas inválido."); }
      endDate = addMonths(startDate, n - 1);
    }
    const { error } = await getSupabase().from("recurring_payments").insert({
      name: name.trim(), amount: value, due_day: d,
      start_date: startDate, end_date: endDate, user_id: userId, repeat_type: "MONTHLY", is_active: true,
    });
    setSaving(false);
    if (error) return setErr(error.message);
    logActivity(userId, "recurring_payment", "CREATED", name.trim(), value);
    onSaved();
  }

  async function deactivate() {
    if (!editing || !confirm("Remover esta conta recorrente? O histórico de meses anteriores fica guardado.")) return;
    setSaving(true);
    const { error } = await getSupabase().from("recurring_payments").update({ is_active: false }).eq("id", editing.id);
    setSaving(false);
    if (error) return setErr(error.message);
    logActivity(userId, "recurring_payment", "DELETED", editing.name, Number(editing.amount), editing.id);
    onSaved();
  }

  return (
    <SheetShell title={isEdit ? "Editar conta recorrente" : "Nova conta recorrente"} onClose={onClose}>
      <input className="clay-input" placeholder="Nome (ex.: Internet, Netflix)" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <input className="clay-input" inputMode="decimal" placeholder="Valor (€)" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <input className="clay-input" inputMode="numeric" placeholder="Dia venc. (1-31)" value={day} onChange={(e) => setDay(e.target.value)} />
      </div>
      {!isEdit && (
        <>
          <div>
            <p className="text-nextp-muted text-xs font-bold uppercase mb-1">Data de início</p>
            <input type="date" className="clay-input w-full box-border min-w-0" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <label className="flex items-center gap-3 clay-card-soft cursor-pointer">
            <input type="checkbox" checked={hasInstallments} onChange={(e) => setHasInstallments(e.target.checked)} className="w-5 h-5 accent-nextp-blue shrink-0" />
            <span className="text-sm font-bold">Tem número de parcelas? (ex.: empréstimo, prestação)</span>
          </label>
          {hasInstallments && (
            <div className="space-y-2">
              <p className="text-nextp-muted text-xs font-bold uppercase mb-1">Número de parcelas</p>
              <input className="clay-input" inputMode="numeric" placeholder="ex.: 8" value={installments} onChange={(e) => setInstallments(e.target.value)} />
              {installments && !isNaN(parseInt(installments, 10)) && (
                <p className="text-nextp-muted text-xs break-words">Termina em {addMonths(startDate, parseInt(installments, 10) - 1)}</p>
              )}
              {/* INSTALLMENTS-01 — opcional: sabendo o valor total, calcula o valor de cada parcela. */}
              <div className="clay-card-soft space-y-2">
                <p className="text-xs font-bold text-nextp-muted">Sabes o valor total da compra? Calculamos a parcela.</p>
                <div className="flex gap-2">
                  <input className="clay-input flex-1" inputMode="decimal" placeholder="Valor total (€)" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} />
                  <button type="button" onClick={calcInstallmentAmount} className="clay-btn-ghost text-sm px-3 shrink-0">Calcular</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      {err && <p className="text-nextp-danger text-sm text-center">{err}</p>}
      <button className="clay-btn w-full text-lg" onClick={save} disabled={saving}>{saving ? "A guardar…" : isEdit ? "Guardar alterações" : "Guardar conta"}</button>
      {isEdit && <button className="w-full text-nextp-danger font-bold py-2" onClick={deactivate} disabled={saving}>Remover conta recorrente</button>}
    </SheetShell>
  );
}

function PlanSheet({ userId, defaultType, editing, onClose, onSaved }: {
  userId: string; defaultType: string; editing: PlanningItem | null; onClose: () => void; onSaved: () => void;
}) {
  const isEdit = !!editing;
  const [name, setName] = useState(editing?.name ?? "");
  const [amount, setAmount] = useState(editing ? String(editing.total_amount).replace(".", ",") : "");
  const [paidAmount, setPaidAmount] = useState(editing ? String(editing.paid_amount).replace(".", ",") : "0");
  const [type, setType] = useState(editing?.type ?? defaultType);
  const [due, setDue] = useState(editing?.due_date ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    const value = parseFloat(amount.replace(",", "."));
    const paid = parseFloat((paidAmount || "0").replace(",", "."));
    if (!name.trim()) return setErr("Nome em falta.");
    if (!value || value <= 0) return setErr("Valor inválido.");
    setSaving(true);
    const status = paid <= 0 ? "PENDING" : paid >= value ? "PAID" : "PARTIAL";
    const payload = {
      name: name.trim(), type, total_amount: value, paid_amount: isNaN(paid) ? 0 : paid,
      due_date: due || null, status, updated_at: new Date().toISOString(),
    };
    const { error } = isEdit
      ? await getSupabase().from("planning_items").update(payload).eq("id", editing!.id)
      : await getSupabase().from("planning_items").insert({ ...payload, user_id: userId });
    setSaving(false);
    if (error) return setErr(error.message);
    logActivity(userId, "planning_item", isEdit ? "UPDATED" : "CREATED", name.trim(), value, editing?.id);
    onSaved();
  }

  async function remove() {
    if (!editing || !confirm("Apagar este item? Fica na Lixeira e pode ser restaurado.")) return;
    setSaving(true);
    const { error } = await softDelete(userId, "planning_items", editing.id);
    setSaving(false);
    if (error) return setErr(error);
    logActivity(userId, "planning_item", "DELETED", editing.name, Number(editing.total_amount), editing.id);
    onSaved();
  }

  return (
    <SheetShell title={isEdit ? "Editar item" : "Nova conta / dívida / compra"} onClose={onClose}>
      <input className="clay-input" placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="flex gap-2 overflow-x-auto pb-1">
        {PLAN_TABS.map(([v, l]) => (
          <button key={v} onClick={() => setType(v)}
            className={`clay-chip whitespace-nowrap ${type === v ? "bg-nextp-blue text-white" : "bg-nextp-cardsoft text-nextp-ink"}`}>{l}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-nextp-muted text-xs font-bold uppercase mb-1">Valor total</p>
          <input className="clay-input" inputMode="decimal" placeholder="€" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div>
          <p className="text-nextp-muted text-xs font-bold uppercase mb-1">Data</p>
          <input type="date" className="clay-input" value={due} onChange={(e) => setDue(e.target.value)} />
        </div>
      </div>
      {isEdit && (
        <div>
          <p className="text-nextp-muted text-xs font-bold uppercase mb-1">Valor já pago</p>
          <input className="clay-input" inputMode="decimal" placeholder="€" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} />
        </div>
      )}
      {err && <p className="text-nextp-danger text-sm text-center">{err}</p>}
      <button className="clay-btn w-full text-lg" onClick={save} disabled={saving}>{saving ? "A guardar…" : isEdit ? "Guardar alterações" : "Guardar"}</button>
      {isEdit && <button className="w-full text-nextp-danger font-bold py-2" onClick={remove} disabled={saving}>Apagar item</button>}
    </SheetShell>
  );
}

function SheetShell({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useLockBodyScroll();
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center" style={{ height: "100dvh" }}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-clay-xl shadow-clay p-5 space-y-3 max-h-[85dvh] overflow-y-auto overflow-x-hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">{title}</h2>
          <button onClick={onClose} className="text-nextp-muted font-bold">Fechar</button>
        </div>
        {children}
      </div>
    </div>
  );
}
