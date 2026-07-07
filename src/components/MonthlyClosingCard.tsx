"use client";

import { useCallback, useEffect, useState } from "react";
import { eur, prettyDate } from "@/lib/format";
import { closeMonth, reopenMonth, getClosing, listClosings, type MonthlyClosing } from "@/lib/monthlyClosing";

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

/** FINANCE-15 — fechar/reabrir o mês corrente e ver o histórico de meses já fechados. */
export default function MonthlyClosingCard({ userId, year, month }: { userId: string; year: number; month: number }) {
  const [closing, setClosing] = useState<MonthlyClosing | null>(null);
  const [history, setHistory] = useState<MonthlyClosing[] | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    getClosing(userId, year, month).then(setClosing);
  }, [userId, year, month]);

  useEffect(() => { load(); }, [load]);

  const isClosed = !!closing && !closing.reopened_at;

  async function onClose() {
    setBusy(true);
    await closeMonth(userId, year, month);
    setBusy(false);
    load();
    if (showHistory) listClosings(userId).then(setHistory);
  }

  async function onReopen() {
    setBusy(true);
    await reopenMonth(userId, year, month);
    setBusy(false);
    load();
    if (showHistory) listClosings(userId).then(setHistory);
  }

  function toggleHistory() {
    const next = !showHistory;
    setShowHistory(next);
    if (next && !history) listClosings(userId).then(setHistory);
  }

  return (
    <div className="clay-card space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-black">Fechamento do mês</h2>
        {isClosed && <span className="clay-chip bg-nextp-success/15 text-nextp-success text-xs">Fechado</span>}
      </div>
      {isClosed ? (
        <>
          <p className="text-nextp-muted text-sm">
            Fechado em {prettyDate(closing!.closed_at.slice(0, 10))} — saldo final {eur(closing!.final_balance)}.
          </p>
          <button onClick={onReopen} disabled={busy} className="clay-btn-ghost w-full text-sm py-2.5">
            {busy ? "A reabrir…" : "Reabrir mês"}
          </button>
        </>
      ) : (
        <>
          <p className="text-nextp-muted text-sm">
            Fechar o mês guarda uma fotografia dos valores atuais (receitas, gastos, saldo) para consultares mais tarde.
          </p>
          <button onClick={onClose} disabled={busy} className="clay-btn w-full text-sm py-2.5">
            {busy ? "A fechar…" : "Fechar mês"}
          </button>
        </>
      )}
      <button onClick={toggleHistory} className="text-nextp-blue text-xs font-bold underline w-full text-center">
        {showHistory ? "Ocultar meses fechados" : "Ver meses fechados"}
      </button>
      {showHistory && (
        <div className="space-y-2 pt-1">
          {!history ? (
            <p className="text-center text-nextp-muted text-sm">A carregar…</p>
          ) : history.length === 0 ? (
            <p className="text-center text-nextp-muted text-sm">Ainda sem meses fechados.</p>
          ) : (
            history.map((h) => (
              <div key={h.id} className="clay-card-soft flex items-center justify-between py-2 px-3">
                <div>
                  <p className="font-bold text-sm">{MONTHS[h.month - 1]}/{h.year}{h.reopened_at ? " · reaberto" : ""}</p>
                  <p className="text-nextp-muted text-xs">{h.top_category ? `Maior categoria: ${h.top_category}` : "Sem categoria dominante"}</p>
                </div>
                <p className={`font-black text-sm ${h.final_balance >= 0 ? "text-nextp-success" : "text-nextp-danger"}`}>{eur(h.final_balance)}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
