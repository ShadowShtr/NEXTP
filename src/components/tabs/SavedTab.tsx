"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { getSupabase } from "@/lib/supabase";
import { eur, prettyDate, todayISO } from "@/lib/format";
import { FeatureIcon } from "@/lib/icons";
import { convertWishlistToSavedItem, isAmazonUrl, isValidUrl, type WishlistItem, type WishlistPriority } from "@/lib/wishlist";
import { logMetric } from "@/lib/metrics";

type SavedItem = {
  id: string;
  name: string;
  amount: number;
  purchase_date: string;
  store: string | null;
  warranty_until: string | null;
  purchase_url: string | null;
  count_as_monthly_expense: boolean;
};

type Sub = "purchased" | "wishlist";

export default function SavedTab({ userId }: { userId: string }) {
  const [sub, setSub] = useState<Sub>("purchased");
  const [items, setItems] = useState<SavedItem[]>([]);
  const [wish, setWish] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openPurchased, setOpenPurchased] = useState(false);
  const [openWish, setOpenWish] = useState(false);
  const [converting, setConverting] = useState<WishlistItem | null>(null);

  const load = useCallback(async () => {
    const sb = getSupabase();
    const [p, w] = await Promise.all([
      sb.from("saved_items").select("*").eq("user_id", userId).order("purchase_date", { ascending: false }),
      sb.from("wishlist_items").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    ]);
    setItems((p.data ?? []) as SavedItem[]);
    setWish((w.data ?? []) as WishlistItem[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const total = items.reduce((s, i) => s + Number(i.amount), 0);
  const wishTotal = wish.filter((w) => w.status === "WISHLIST").reduce((s, w) => s + Number(w.expected_amount ?? w.target_amount ?? 0), 0);
  const wishOpen = wish.filter((w) => w.status === "WISHLIST");

  async function removeItem(id: string) {
    await getSupabase().from("saved_items").delete().eq("id", id);
    load();
  }
  async function removeWish(id: string) {
    await getSupabase().from("wishlist_items").delete().eq("id", id);
    load();
  }

  function warrantyBadge(d: string | null) {
    if (!d) return null;
    const days = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
    if (days < 0) return <span className="clay-chip bg-nextp-danger/15 text-nextp-danger text-xs">Garantia expirada</span>;
    if (days < 30) return <span className="clay-chip bg-nextp-warning/15 text-nextp-warning text-xs">Garantia: {days}d</span>;
    return <span className="clay-chip bg-nextp-success/15 text-nextp-success text-xs">Na garantia</span>;
  }

  return (
    <div className="px-5 py-2 space-y-4">
      <h1 className="text-2xl font-black">Guardados</h1>

      {/* Header azul com total (muda conforme a tab) */}
      <div className="clay-card bg-nextp-blue text-white flex items-center justify-between">
        <div>
          <p className="text-white/80 text-xs font-bold uppercase">{sub === "purchased" ? "Total guardado" : "Total previsto"}</p>
          <p className="text-3xl font-black">{eur(sub === "purchased" ? total : wishTotal)}</p>
        </div>
        <FeatureIcon name={sub === "purchased" ? "wallet" : "piggy-bank"} size={64} />
      </div>

      {/* Tabs pill */}
      <div className="flex gap-2 clay-card-soft p-1.5">
        <button onClick={() => setSub("purchased")}
          className={`flex-1 py-2 rounded-clay font-bold text-sm transition-colors ${sub === "purchased" ? "bg-nextp-blue text-white shadow-clay-sm" : "text-nextp-muted"}`}>
          Comprados
        </button>
        <button onClick={() => setSub("wishlist")}
          className={`flex-1 py-2 rounded-clay font-bold text-sm transition-colors ${sub === "wishlist" ? "bg-nextp-blue text-white shadow-clay-sm" : "text-nextp-muted"}`}>
          Quero comprar
        </button>
      </div>

      {loading ? (
        <div className="clay-card text-center text-nextp-muted">A carregar…</div>
      ) : sub === "purchased" ? (
        items.length === 0 ? (
          <div className="clay-card text-center text-nextp-muted py-10">Ainda sem bens guardados. Toca em ➕ para adicionar.</div>
        ) : (
          <div className="space-y-2">
            {items.map((it) => (
              <div key={it.id} className="clay-card flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/saved/saved-purchased.svg" width={48} height={48} alt="" className="shrink-0" draggable={false} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{it.name}</p>
                  <p className="text-nextp-muted text-xs">
                    {prettyDate(it.purchase_date)}{it.store ? ` · ${it.store}` : ""}
                  </p>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    {warrantyBadge(it.warranty_until)}
                    {it.purchase_url && (
                      <a href={it.purchase_url} target="_blank" rel="noopener noreferrer" className="text-nextp-blue text-xs font-bold underline">
                        Ver compra
                      </a>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-black">{eur(Number(it.amount))}</p>
                  <button onClick={() => removeItem(it.id)} className="text-nextp-danger text-xs font-bold">apagar</button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : wishOpen.length === 0 ? (
        <div className="clay-card text-center text-nextp-muted py-10">Ainda sem produtos desejados. Toca em ➕ para adicionar.</div>
      ) : (
        <div className="space-y-2">
          {wishOpen.map((w) => (
            <div key={w.id} className="clay-card space-y-2">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/saved/saved-wishlist.svg" width={48} height={48} alt="" className="shrink-0" draggable={false} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{w.name}</p>
                  <p className="text-nextp-muted text-xs">
                    {priorityLabel(w.priority)}{w.desired_date ? ` · até ${prettyDate(w.desired_date)}` : ""}
                  </p>
                </div>
                <p className="font-black shrink-0">{eur(Number(w.expected_amount ?? w.target_amount ?? 0))}</p>
              </div>
              <div className="flex gap-2">
                {(w.amazon_url || w.external_url) && (
                  <a href={w.amazon_url || w.external_url!} target="_blank" rel="noopener noreferrer"
                    onClick={() => logMetric(userId, "WISHLIST_OPEN_AMAZON")}
                    className="clay-btn-ghost flex-1 text-center text-sm py-2 flex items-center justify-center gap-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/icons/saved/${w.amazon_url ? "saved-amazon-link" : "saved-open-link"}.svg`} width={18} height={18} alt="" />
                    Abrir {w.amazon_url && isAmazonUrl(w.amazon_url) ? "Amazon" : "link"}
                  </a>
                )}
                <button onClick={() => setConverting(w)} className="clay-btn flex-1 text-sm py-2">Marcar como comprado</button>
              </div>
              <button onClick={() => removeWish(w.id)} className="text-nextp-danger text-xs font-bold">apagar</button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => (sub === "purchased" ? setOpenPurchased(true) : setOpenWish(true))}
        className="fixed right-5 z-20 w-16 h-16 rounded-full bg-nextp-blue text-white text-3xl font-black shadow-clay-btn active:scale-90 transition-transform grid place-items-center"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 92px)" }}
        aria-label={sub === "purchased" ? "Novo item guardado" : "Novo produto desejado"}
      >＋</button>

      {openPurchased && <SavedSheet userId={userId} onClose={() => setOpenPurchased(false)} onSaved={() => { setOpenPurchased(false); load(); }} />}
      {openWish && <WishlistSheet userId={userId} onClose={() => setOpenWish(false)} onSaved={() => { setOpenWish(false); load(); }} />}
      {converting && (
        <ConvertSheet
          userId={userId}
          item={converting}
          onClose={() => setConverting(null)}
          onDone={() => { setConverting(null); load(); }}
        />
      )}
    </div>
  );
}

function priorityLabel(p: WishlistPriority) {
  return { LOW: "Baixa", MEDIUM: "Média", HIGH: "Alta", URGENT: "Urgente" }[p] ?? p;
}

function SavedSheet({ userId, onClose, onSaved }: { userId: string; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [store, setStore] = useState("");
  const [url, setUrl] = useState("");
  const [date, setDate] = useState(todayISO());
  const [warranty, setWarranty] = useState("");
  const [countMonth, setCountMonth] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    const value = parseFloat(amount.replace(",", "."));
    if (!name.trim()) return setErr("Escreve o nome do item.");
    if (!value || value <= 0) return setErr("Valor inválido.");
    if (!isValidUrl(url)) return setErr("Link inválido.");
    setSaving(true);
    const { data, error } = await getSupabase().from("saved_items").insert({
      user_id: userId, name: name.trim(), amount: value, purchase_date: date,
      store: store.trim() || null, warranty_until: warranty || null,
      purchase_url: url.trim() || null, source: "MANUAL",
      count_as_monthly_expense: countMonth,
    }).select("id").single();
    if (!error && countMonth && data) {
      await getSupabase().from("expenses").insert({
        user_id: userId, description: name.trim(), amount: value, date,
        time: new Date().toTimeString().slice(0, 5), payment_method: "Outro",
        source: "SAVED_ITEM",
      });
    }
    setSaving(false);
    if (error) return setErr(error.message);
    logMetric(userId, "SAVED_ITEM_CREATED");
    onSaved();
  }

  return (
    <SheetShell title="Novo item guardado" onClose={onClose}>
      <input className="clay-input" placeholder="Nome (ex.: Air Fryer)" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <input className="clay-input" inputMode="decimal" placeholder="Valor (€)" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <input className="clay-input" placeholder="Loja (opcional)" value={store} onChange={(e) => setStore(e.target.value)} />
      <input className="clay-input" placeholder="Link da compra (opcional)" value={url} onChange={(e) => setUrl(e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-nextp-muted text-xs font-bold uppercase mb-1">Data compra</p>
          <input type="date" className="clay-input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <p className="text-nextp-muted text-xs font-bold uppercase mb-1">Garantia até</p>
          <input type="date" className="clay-input" value={warranty} onChange={(e) => setWarranty(e.target.value)} />
        </div>
      </div>
      <label className="flex items-center gap-3 clay-card-soft cursor-pointer">
        <input type="checkbox" checked={countMonth} onChange={(e) => setCountMonth(e.target.checked)} className="w-5 h-5 accent-nextp-blue" />
        <span className="text-sm font-bold">Contar como gasto do mês?</span>
      </label>
      {err && <p className="text-nextp-danger text-sm text-center">{err}</p>}
      <button className="clay-btn w-full text-lg" onClick={save} disabled={saving}>{saving ? "A guardar…" : "Guardar item"}</button>
    </SheetShell>
  );
}

function WishlistSheet({ userId, onClose, onSaved }: { userId: string; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [expected, setExpected] = useState("");
  const [target, setTarget] = useState("");
  const [amazonUrl, setAmazonUrl] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [priority, setPriority] = useState<WishlistPriority>("MEDIUM");
  const [desired, setDesired] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const PR: [WishlistPriority, string][] = [["LOW", "Baixa"], ["MEDIUM", "Média"], ["HIGH", "Alta"], ["URGENT", "Urgente"]];

  async function save() {
    if (!name.trim()) return setErr("Nome em falta.");
    if (!isValidUrl(amazonUrl)) return setErr("Link Amazon inválido.");
    if (!isValidUrl(externalUrl)) return setErr("Link externo inválido.");
    setSaving(true);
    const { error } = await getSupabase().from("wishlist_items").insert({
      user_id: userId, name: name.trim(),
      expected_amount: expected ? parseFloat(expected.replace(",", ".")) : null,
      target_amount: target ? parseFloat(target.replace(",", ".")) : null,
      amazon_url: amazonUrl.trim() || null,
      external_url: externalUrl.trim() || null,
      priority, desired_date: desired || null, note: note.trim() || null,
      status: "WISHLIST",
    });
    setSaving(false);
    if (error) return setErr(error.message);
    logMetric(userId, "WISHLIST_ITEM_CREATED");
    onSaved();
  }

  return (
    <SheetShell title="Novo produto desejado" onClose={onClose}>
      <input className="clay-input" placeholder="Nome (ex.: Air Fryer nova)" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <div className="grid grid-cols-2 gap-3">
        <input className="clay-input" inputMode="decimal" placeholder="Valor previsto (€)" value={expected} onChange={(e) => setExpected(e.target.value)} />
        <input className="clay-input" inputMode="decimal" placeholder="Preço alvo (€)" value={target} onChange={(e) => setTarget(e.target.value)} />
      </div>
      <input className="clay-input" placeholder="Link Amazon (opcional)" value={amazonUrl} onChange={(e) => setAmazonUrl(e.target.value)} />
      <input className="clay-input" placeholder="Link externo (opcional)" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} />
      <div>
        <p className="text-nextp-muted text-xs font-bold uppercase mb-1">Prioridade</p>
        <div className="flex gap-2">
          {PR.map(([v, l]) => (
            <button key={v} onClick={() => setPriority(v)}
              className={`clay-chip flex-1 ${priority === v ? "bg-nextp-blue text-white" : "bg-nextp-cardsoft text-nextp-ink"}`}>{l}</button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-nextp-muted text-xs font-bold uppercase mb-1">Data desejada</p>
        <input type="date" className="clay-input" value={desired} onChange={(e) => setDesired(e.target.value)} />
      </div>
      <input className="clay-input" placeholder="Observação (opcional)" value={note} onChange={(e) => setNote(e.target.value)} />
      {err && <p className="text-nextp-danger text-sm text-center">{err}</p>}
      <button className="clay-btn w-full text-lg" onClick={save} disabled={saving}>{saving ? "A guardar…" : "Guardar produto"}</button>
    </SheetShell>
  );
}

function ConvertSheet({ userId, item, onClose, onDone }: { userId: string; item: WishlistItem; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState(String(item.target_amount ?? item.expected_amount ?? "").replace(".", ","));
  const [date, setDate] = useState(todayISO());
  const [countMonth, setCountMonth] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function confirm() {
    const value = parseFloat(amount.replace(",", "."));
    if (!value || value <= 0) return setErr("Valor inválido.");
    setSaving(true);
    const { error } = await convertWishlistToSavedItem({
      userId, wishlist: item, finalAmount: value, purchaseDate: date, countAsMonthlyExpense: countMonth,
    });
    setSaving(false);
    if (error) return setErr(error);
    logMetric(userId, "WISHLIST_CONVERTED_TO_PURCHASED");
    onDone();
  }

  return (
    <SheetShell title={`Comprou "${item.name}"?`} onClose={onClose}>
      <p className="text-nextp-muted text-sm">Confirma os dados para mover para “Comprados”.</p>
      <input className="clay-input" inputMode="decimal" placeholder="Valor final (€)" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
      <div>
        <p className="text-nextp-muted text-xs font-bold uppercase mb-1">Data da compra</p>
        <input type="date" className="clay-input" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <label className="flex items-center gap-3 clay-card-soft cursor-pointer">
        <input type="checkbox" checked={countMonth} onChange={(e) => setCountMonth(e.target.checked)} className="w-5 h-5 accent-nextp-blue" />
        <span className="text-sm font-bold">Contar como gasto do mês?</span>
      </label>
      {err && <p className="text-nextp-danger text-sm text-center">{err}</p>}
      <button className="clay-btn w-full text-lg" onClick={confirm} disabled={saving}>{saving ? "A confirmar…" : "Confirmar compra"}</button>
    </SheetShell>
  );
}

function SheetShell({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-clay-xl shadow-clay p-5 space-y-3 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">{title}</h2>
          <button onClick={onClose} className="text-nextp-muted font-bold">Fechar</button>
        </div>
        {children}
      </div>
    </div>
  );
}
