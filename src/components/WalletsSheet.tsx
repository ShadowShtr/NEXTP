"use client";

import { useCallback, useEffect, useState } from "react";
import { eur } from "@/lib/format";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";
import {
  deleteWallet, getWalletBalances, saveWallet, WALLET_TYPE_LABEL,
  type WalletBalance, type WalletType,
} from "@/lib/wallets";

const TYPES: WalletType[] = ["CASH", "BANK", "CARD", "SAVINGS", "MBWAY", "OTHER"];

/** FINANCE-12 — carteiras/contas: de onde sai e para onde entra o dinheiro. */
export default function WalletsSheet({ userId, onClose }: { userId: string; onClose: () => void }) {
  useLockBodyScroll();
  const [wallets, setWallets] = useState<WalletBalance[] | null>(null);
  const [editing, setEditing] = useState<WalletBalance | "new" | null>(null);

  const load = useCallback(() => {
    getWalletBalances(userId).then(setWallets);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  async function remove(id: string) {
    if (!confirm("Remover esta carteira? Os gastos/receitas já lançados ficam sem carteira (não são apagados).")) return;
    await deleteWallet(id);
    load();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" style={{ height: "100dvh" }}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-clay-xl shadow-clay p-5 space-y-3 max-h-[85dvh] overflow-y-auto overflow-x-hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">Carteiras</h2>
          <button onClick={onClose} className="text-nextp-muted font-bold">Fechar</button>
        </div>
        <p className="text-nextp-muted text-sm">
          Liga cada gasto/receita a uma carteira (Dinheiro, Banco, Cartão…) para saberes quanto tens em cada lugar.
        </p>

        {!wallets ? (
          <p className="text-center text-nextp-muted py-6">A carregar…</p>
        ) : wallets.length === 0 ? (
          <p className="text-center text-nextp-muted py-6">Ainda sem carteiras.</p>
        ) : (
          <div className="space-y-2">
            {wallets.map((w) => (
              <button key={w.id} onClick={() => setEditing(w)} className="clay-card-soft w-full flex items-center justify-between py-2.5 px-3 text-left">
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{w.name}{w.is_default ? " · padrão" : ""}</p>
                  <p className="text-nextp-muted text-xs">
                    {WALLET_TYPE_LABEL[w.type]}
                    {w.type === "CARD" && w.due_day ? ` · fatura vence dia ${w.due_day}` : ""}
                  </p>
                </div>
                <p className={`font-black shrink-0 ${w.balance < 0 ? "text-nextp-danger" : ""}`}>{eur(w.balance)}</p>
              </button>
            ))}
          </div>
        )}

        <button onClick={() => setEditing("new")} className="clay-btn-ghost w-full text-sm py-2.5">+ Nova carteira</button>

        {editing && (
          <WalletForm
            userId={userId}
            editing={editing === "new" ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={() => { setEditing(null); load(); }}
            onDelete={editing !== "new" ? () => { remove(editing.id); setEditing(null); } : undefined}
          />
        )}
      </div>
    </div>
  );
}

function WalletForm({ userId, editing, onClose, onSaved, onDelete }: {
  userId: string; editing: WalletBalance | null; onClose: () => void; onSaved: () => void; onDelete?: () => void;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [type, setType] = useState<WalletType>(editing?.type ?? "CASH");
  const [initial, setInitial] = useState(editing ? String(editing.initial_balance).replace(".", ",") : "0");
  const [isDefault, setIsDefault] = useState(editing?.is_default ?? false);
  const [closingDay, setClosingDay] = useState(editing?.closing_day != null ? String(editing.closing_day) : "");
  const [dueDay, setDueDay] = useState(editing?.due_day != null ? String(editing.due_day) : "");
  const [creditLimit, setCreditLimit] = useState(editing?.credit_limit != null ? String(editing.credit_limit).replace(".", ",") : "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    if (!name.trim()) return setErr("Nome em falta.");
    const value = parseFloat((initial || "0").replace(",", "."));
    if (isNaN(value)) return setErr("Saldo inicial inválido.");
    setSaving(true);
    const { error } = await saveWallet(userId, {
      id: editing?.id, name: name.trim(), type, initialBalance: value, isDefault,
      closingDay: closingDay ? parseInt(closingDay, 10) : null,
      dueDay: dueDay ? parseInt(dueDay, 10) : null,
      creditLimit: creditLimit ? parseFloat(creditLimit.replace(",", ".")) : null,
    });
    setSaving(false);
    if (error) return setErr(error);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ height: "100dvh" }}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-clay-xl shadow-clay p-5 space-y-3 max-h-[85dvh] overflow-y-auto overflow-x-hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black">{editing ? "Editar carteira" : "Nova carteira"}</h2>
          <button onClick={onClose} className="text-nextp-muted font-bold">Fechar</button>
        </div>
        <input className="clay-input" placeholder="Nome (ex.: Banco BPI)" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TYPES.map((t) => (
            <button key={t} onClick={() => setType(t)}
              className={`clay-chip whitespace-nowrap ${type === t ? "bg-nextp-blue text-white" : "bg-nextp-cardsoft text-nextp-ink"}`}>
              {WALLET_TYPE_LABEL[t]}
            </button>
          ))}
        </div>
        <div>
          <p className="text-nextp-muted text-xs font-bold uppercase mb-1">Saldo inicial</p>
          <input className="clay-input" inputMode="decimal" placeholder="€" value={initial} onChange={(e) => setInitial(e.target.value)} />
        </div>

        {/* CREDIT-01 — fatura do cartão (informativo; gastos continuam a contar já no mês) */}
        {type === "CARD" && (
          <div className="clay-card-soft space-y-2">
            <p className="text-xs font-bold text-nextp-muted">Fatura do cartão (opcional)</p>
            <div className="grid grid-cols-2 gap-3">
              <input className="clay-input" inputMode="numeric" placeholder="Dia fecho (1-31)" value={closingDay} onChange={(e) => setClosingDay(e.target.value)} />
              <input className="clay-input" inputMode="numeric" placeholder="Dia vencimento (1-31)" value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
            </div>
            <input className="clay-input" inputMode="decimal" placeholder="Limite de crédito (€)" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} />
          </div>
        )}

        <label className="flex items-center gap-3 clay-card-soft cursor-pointer">
          <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="w-5 h-5 accent-nextp-blue" />
          <span className="text-sm font-bold">Usar como carteira padrão</span>
        </label>
        {err && <p className="text-nextp-danger text-sm text-center">{err}</p>}
        <button className="clay-btn w-full text-lg" onClick={save} disabled={saving}>{saving ? "A guardar…" : "Guardar"}</button>
        {onDelete && <button className="w-full text-nextp-danger font-bold py-2" onClick={onDelete} disabled={saving}>Remover carteira</button>}
      </div>
    </div>
  );
}
