"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { todayISO } from "@/lib/format";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";
import { defaultWalletId, listWallets, WALLET_TYPE_LABEL, type WalletAccount } from "@/lib/wallets";
import { softDelete } from "@/lib/trash";
import { logActivity } from "@/lib/activityLog";
import { isMonthClosed } from "@/lib/monthlyClosing";

export type IncomeEntry = {
  id: string;
  description: string;
  amount: number;
  date: string;
  source: string | null;
  note: string | null;
  wallet_account_id?: string | null;
};

/** INCOME-01 — nova receita (salário, freelance, presente, etc.). */
export default function IncomeSheet({
  userId, editing, onClose, onSaved,
}: { userId: string; editing: IncomeEntry | null; onClose: () => void; onSaved: () => void }) {
  useLockBodyScroll();
  const isEdit = !!editing;
  const [description, setDescription] = useState(editing?.description ?? "");
  const [amount, setAmount] = useState(editing ? String(editing.amount).replace(".", ",") : "");
  const [date, setDate] = useState(editing?.date ?? todayISO());
  const [source, setSource] = useState(editing?.source ?? "");
  const [wallets, setWallets] = useState<WalletAccount[]>([]);
  const [walletId, setWalletId] = useState<string | null>(editing?.wallet_account_id ?? null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [closedMonthWarning, setClosedMonthWarning] = useState(false);
  // SAFETY-01 — evita duplicar a receita num duplo-toque ou reenvio de rede.
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  useEffect(() => {
    listWallets(userId).then((ws) => {
      setWallets(ws);
      if (!isEdit) defaultWalletId(userId).then((id) => id && setWalletId(id));
    });
    // FINANCE-15 — avisa (não bloqueia) se esta receita pertence a um mês já fechado.
    if (isEdit && editing) isMonthClosed(userId, editing.date).then(setClosedMonthWarning);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    const value = parseFloat(amount.replace(",", "."));
    if (!description.trim()) return setErr("Escreve uma descrição.");
    if (!value || value <= 0) return setErr("Valor inválido.");
    setSaving(true);
    const payload = {
      description: description.trim(), amount: value, date,
      source: source.trim() || null, wallet_account_id: walletId, updated_at: new Date().toISOString(),
    };
    const { error } = isEdit
      ? await getSupabase().from("income_entries").update(payload).eq("id", editing!.id)
      : await getSupabase().from("income_entries").insert({ ...payload, user_id: userId, idempotency_key: idempotencyKey });
    setSaving(false);
    if (error && error.code !== "23505") return setErr(error.message);
    logActivity(userId, "income", isEdit ? "UPDATED" : "CREATED", payload.description, value, editing?.id);
    onSaved();
  }

  async function remove() {
    if (!editing || !confirm("Apagar esta receita? Fica na Lixeira e pode ser restaurada.")) return;
    setSaving(true);
    const { error } = await softDelete(userId, "income_entries", editing.id);
    setSaving(false);
    if (error) return setErr(error);
    logActivity(userId, "income", "DELETED", editing.description, Number(editing.amount), editing.id);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" style={{ height: "100dvh" }}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-clay-xl shadow-clay p-5 space-y-4 max-h-[85dvh] overflow-y-auto overflow-x-hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">{isEdit ? "Editar receita" : "Nova receita"}</h2>
          <button onClick={onClose} className="text-nextp-muted font-bold">Fechar</button>
        </div>

        {closedMonthWarning && (
          <p className="clay-chip bg-nextp-warning/15 text-nextp-warning text-xs text-center py-2">
            Esta receita é de um mês já fechado — alterar aqui muda os totais registados, mas não atualiza o fechamento guardado.
          </p>
        )}

        <div className="clay-card bg-nextp-success">
          <input
            className="w-full bg-transparent text-white text-4xl font-black text-center outline-none placeholder:text-white/60"
            inputMode="decimal" placeholder="0,00 €" value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <input className="clay-input" placeholder="Descrição (ex.: Salário, Freelance)" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input className="clay-input" placeholder="Origem (opcional)" value={source} onChange={(e) => setSource(e.target.value)} />
        <div>
          <p className="text-nextp-muted text-xs font-bold uppercase mb-1">Data</p>
          <input type="date" className="clay-input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        {/* FINANCE-12 — carteira opcional (para onde entrou o dinheiro) */}
        {wallets.length > 0 && (
          <div>
            <p className="text-nextp-muted text-xs font-bold uppercase mb-1">Carteira</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button onClick={() => setWalletId(null)}
                className={`clay-chip whitespace-nowrap shrink-0 ${walletId === null ? "bg-nextp-blue text-white" : "bg-nextp-cardsoft text-nextp-ink"}`}>
                Sem carteira
              </button>
              {wallets.map((w) => (
                <button key={w.id} onClick={() => setWalletId(w.id)}
                  className={`clay-chip whitespace-nowrap shrink-0 ${walletId === w.id ? "bg-nextp-blue text-white" : "bg-nextp-cardsoft text-nextp-ink"}`}>
                  {w.name} <span className="opacity-70">· {WALLET_TYPE_LABEL[w.type]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {err && <p className="text-nextp-danger text-sm text-center">{err}</p>}
        <button className="clay-btn w-full text-lg" onClick={save} disabled={saving}>
          {saving ? "A guardar…" : isEdit ? "Guardar alterações" : "Guardar receita"}
        </button>
        {isEdit && <button className="w-full text-nextp-danger font-bold py-2" onClick={remove} disabled={saving}>Apagar receita</button>}
      </div>
    </div>
  );
}
