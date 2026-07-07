"use client";

import { useEffect, useState } from "react";
import { eur, prettyDate } from "@/lib/format";
import { CategoryIcon, PaymentDot, type DotState } from "@/lib/icons";
import {
  getOccurrenceHistory, installmentLabel, markPartial, setPaidStatus,
  type Occurrence, type RecurringPayment,
} from "@/lib/recurring";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

type Props = {
  userId: string;
  payment: RecurringPayment;
  occurrence: Occurrence;
  onClose: () => void;
  onChanged: () => void;
  onEdit: (payment: RecurringPayment) => void;
};

/** TASK 16 — Detalhe da conta recorrente + histórico mensal completo. */
export default function RecurringDetailSheet({ userId, payment, occurrence, onClose, onChanged, onEdit }: Props) {
  useLockBodyScroll();
  const [occ, setOcc] = useState(occurrence);
  const [history, setHistory] = useState<Occurrence[] | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [partialOpen, setPartialOpen] = useState(false);
  const [partialValue, setPartialValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (showHistory && !history) {
      getOccurrenceHistory(userId, payment.id).then(setHistory);
    }
  }, [showHistory, history, userId, payment.id]);

  async function togglePaidWithExpense() {
    setErr(null);
    const willPay = occ.status !== "PAID";
    let createExpense = false;
    if (willPay) {
      createExpense = confirm(`Deseja lançar "${payment.name}" também como gasto do mês?`);
    }
    setBusy(true);
    const { error } = await setPaidStatus({ userId, occ, paymentName: payment.name, paid: willPay, createExpense });
    setBusy(false);
    if (error) return setErr(error);
    setOcc({ ...occ, status: willPay ? "PAID" : "PENDING", paid_amount: willPay ? occ.expected_amount : 0 });
    setHistory(null);
    onChanged();
  }

  async function confirmPartial() {
    const v = parseFloat(partialValue.replace(",", "."));
    if (!v || v <= 0) return setErr("Valor inválido.");
    setBusy(true);
    const { error } = await markPartial(userId, occ, v, payment.name);
    setBusy(false);
    if (error) return setErr(error);
    setOcc({ ...occ, status: "PARTIAL", paid_amount: v });
    setPartialOpen(false);
    setHistory(null);
    onChanged();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" style={{ height: "100dvh" }}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-clay-xl shadow-clay p-5 space-y-4 max-h-[85dvh] overflow-y-auto overflow-x-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CategoryIcon name={payment.name} size={40} />
            <h2 className="text-xl font-black">{payment.name}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => onEdit(payment)} className="text-nextp-blue font-bold text-sm">Editar</button>
            <button onClick={onClose} className="text-nextp-muted font-bold">Fechar</button>
          </div>
        </div>

        <div className="clay-card-soft space-y-2">
          <Row label="Valor" value={eur(Number(payment.amount))} />
          <Row label="Dia de vencimento" value={String(payment.due_day)} />
          <Row label="Data de início" value={prettyDate(payment.start_date)} />
          <Row label="Repetição" value={payment.repeat_type === "MONTHLY" ? "Mensal" : payment.repeat_type} />
          <Row label="Próximo vencimento" value={prettyDate(occ.due_date)} />
          {installmentLabel(payment, occ.year, occ.month) && (
            <Row label="Parcela" value={installmentLabel(payment, occ.year, occ.month)!} />
          )}
          <div className="flex items-center justify-between pt-1">
            <span className="text-nextp-muted text-sm">Estado em {MONTHS[occ.month - 1]}/{occ.year}</span>
            <div className="flex items-center gap-2">
              <PaymentDot state={occ.status.toLowerCase() as DotState} size={26} />
              <span className="font-bold text-sm">{statusLabel(occ.status)}</span>
            </div>
          </div>
        </div>

        {err && <p className="text-nextp-danger text-sm text-center">{err}</p>}

        <div className="grid grid-cols-2 gap-3">
          <button onClick={togglePaidWithExpense} disabled={busy} className="clay-btn text-sm py-3">
            {occ.status === "PAID" ? "Desmarcar pago" : "Marcar como pago"}
          </button>
          <button onClick={() => setPartialOpen(true)} disabled={busy} className="clay-btn-ghost text-sm py-3">
            Marcar parcial
          </button>
        </div>

        {partialOpen && (
          <div className="clay-card-soft space-y-2">
            <p className="text-sm font-bold">Valor pago parcialmente</p>
            <input className="clay-input" inputMode="decimal" placeholder="€" value={partialValue} onChange={(e) => setPartialValue(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={confirmPartial} disabled={busy} className="clay-btn flex-1 text-sm py-2">Confirmar</button>
              <button onClick={() => setPartialOpen(false)} className="clay-btn-ghost flex-1 text-sm py-2">Cancelar</button>
            </div>
          </div>
        )}

        <button onClick={() => setShowHistory((s) => !s)} className="text-nextp-blue font-bold text-sm underline w-full text-center">
          {showHistory ? "Ocultar histórico" : "+ Histórico de pagamentos"}
        </button>

        {showHistory && (
          <div className="space-y-2">
            {!history ? (
              <p className="text-center text-nextp-muted text-sm">A carregar…</p>
            ) : history.length === 0 ? (
              <p className="text-center text-nextp-muted text-sm">Sem histórico ainda.</p>
            ) : (
              history.map((h) => (
                <div key={h.id} className="clay-card flex items-center justify-between py-2.5">
                  <span className="font-bold text-sm">{MONTHS[h.month - 1]}/{h.year}</span>
                  <span className="text-nextp-muted text-xs">
                    {h.status === "PAID" || h.status === "PARTIAL" ? (h.paid_at ? prettyDate(h.paid_at) : "") : statusLabel(h.status)}
                  </span>
                  <PaymentDot state={h.status.toLowerCase() as DotState} size={22} />
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function statusLabel(s: string) {
  return { PENDING: "Pendente", PAID: "Pago", PARTIAL: "Parcial", OVERDUE: "Vencido", IGNORED: "Ignorado" }[s] ?? s;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-nextp-muted text-sm">{label}</span>
      <span className="font-bold text-sm">{value}</span>
    </div>
  );
}
