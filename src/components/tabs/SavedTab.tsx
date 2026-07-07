"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { getSupabase } from "@/lib/supabase";
import { eur, prettyDate, todayISO } from "@/lib/format";
import { convertWishlistToSavedItem, isAmazonUrl, isValidUrl, type WishlistItem, type WishlistPriority } from "@/lib/wishlist";
import { logMetric } from "@/lib/metrics";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";
import PhotoField from "@/components/PhotoField";

type SavedItem = {
  id: string;
  name: string;
  amount: number;
  purchase_date: string;
  store: string | null;
  warranty_until: string | null;
  purchase_url: string | null;
  invoice_image_path: string | null;
  count_as_monthly_expense: boolean;
};

type Sub = "purchased" | "wishlist";

type Props = { userId: string; autoOpen?: "saved" | "wishlist" | null; autoOpenToken?: number };

export default function SavedTab({ userId, autoOpen, autoOpenToken }: Props) {
  const [sub, setSub] = useState<Sub>("purchased");
  const [items, setItems] = useState<SavedItem[]>([]);
  const [wish, setWish] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openPurchased, setOpenPurchased] = useState(false);
  const [openWish, setOpenWish] = useState(false);
  const [converting, setConverting] = useState<WishlistItem | null>(null);
  const [editingSaved, setEditingSaved] = useState<SavedItem | null>(null);
  const [editingWish, setEditingWish] = useState<WishlistItem | null>(null);

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

  // UX-03 — chegou aqui a partir do menu rápido do botão + (Novo item guardado / Quero comprar).
  useEffect(() => {
    if (!autoOpen) return;
    if (autoOpen === "saved") { setSub("purchased"); setOpenPurchased(true); }
    else { setSub("wishlist"); setOpenWish(true); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenToken]);

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

      {/* Header azul com total — carteira grande no fundo branco, sobrepondo só a ponta
          lateral do card (nunca desce sobre as tabs Comprados/Quero comprar). */}
      <div className="relative pt-8">
        <div className="clay-hero py-4 px-4 pr-32">
          <div className="relative z-10">
            <p className="text-white/80 text-xs font-bold uppercase">{sub === "purchased" ? "Total guardado" : "Total previsto"}</p>
            <p className="text-3xl font-black">{eur(sub === "purchased" ? total : wishTotal)}</p>
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/illustrations/guardados-wallet.png"
          alt=""
          width={140}
          height={140}
          className="absolute z-20 pointer-events-none select-none"
          style={{ top: "-8px", right: "-4px" }}
          draggable={false}
        />
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
                <button onClick={() => setEditingSaved(it)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                  <ItemThumb src={it.invoice_image_path} fallback="/icons/saved/saved-purchased.svg" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{it.name}</p>
                    <p className="text-nextp-muted text-xs">
                      {prettyDate(it.purchase_date)}{it.store ? ` · ${it.store}` : ""}
                    </p>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      {warrantyBadge(it.warranty_until)}
                      {it.purchase_url && (
                        <a href={it.purchase_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-nextp-blue text-xs font-bold underline">
                          Ver compra
                        </a>
                      )}
                    </div>
                  </div>
                </button>
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
              <button onClick={() => setEditingWish(w)} className="flex items-center gap-3 w-full text-left">
                <ItemThumb src={w.image_path} fallback="/icons/saved/saved-wishlist.svg" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{w.name}</p>
                  <p className="text-nextp-muted text-xs">
                    {priorityLabel(w.priority)}{w.desired_date ? ` · até ${prettyDate(w.desired_date)}` : ""}
                  </p>
                </div>
                <p className="font-black shrink-0">{eur(Number(w.expected_amount ?? w.target_amount ?? 0))}</p>
              </button>
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

      {(openPurchased || editingSaved) && (
        <SavedSheet
          userId={userId}
          editing={editingSaved}
          onClose={() => { setOpenPurchased(false); setEditingSaved(null); }}
          onSaved={() => { setOpenPurchased(false); setEditingSaved(null); load(); }}
        />
      )}
      {(openWish || editingWish) && (
        <WishlistSheet
          userId={userId}
          editing={editingWish}
          onClose={() => { setOpenWish(false); setEditingWish(null); }}
          onSaved={() => { setOpenWish(false); setEditingWish(null); load(); }}
        />
      )}
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

/** Miniatura do produto: mostra a foto colada pelo utilizador, ou o ícone genérico se não houver/falhar. */
function ItemThumb({ src, fallback }: { src: string | null; fallback: string }) {
  const [broken, setBroken] = useState(false);
  const url = src && !broken ? src : fallback;
  const isPhoto = !!(src && !broken);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      width={48}
      height={48}
      alt=""
      className={`shrink-0 rounded-clay ${isPhoto ? "object-cover w-12 h-12 shadow-clay-sm" : ""}`}
      onError={() => setBroken(true)}
      draggable={false}
    />
  );
}

function SavedSheet({ userId, editing, onClose, onSaved }: { userId: string; editing: SavedItem | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!editing;
  const [name, setName] = useState(editing?.name ?? "");
  const [amount, setAmount] = useState(editing ? String(editing.amount).replace(".", ",") : "");
  const [store, setStore] = useState(editing?.store ?? "");
  const [url, setUrl] = useState(editing?.purchase_url ?? "");
  const [photoUrl, setPhotoUrl] = useState(editing?.invoice_image_path ?? "");
  const [date, setDate] = useState(editing?.purchase_date ?? todayISO());
  const [warranty, setWarranty] = useState(editing?.warranty_until ?? "");
  const [countMonth, setCountMonth] = useState(editing?.count_as_monthly_expense ?? false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    const value = parseFloat(amount.replace(",", "."));
    if (!name.trim()) return setErr("Escreve o nome do item.");
    if (!value || value <= 0) return setErr("Valor inválido.");
    if (!isValidUrl(url)) return setErr("Link inválido.");
    if (!isValidUrl(photoUrl)) return setErr("Link da foto inválido.");
    setSaving(true);
    const payload = {
      name: name.trim(), amount: value, purchase_date: date,
      store: store.trim() || null, warranty_until: warranty || null,
      purchase_url: url.trim() || null, invoice_image_path: photoUrl.trim() || null,
      count_as_monthly_expense: countMonth,
      updated_at: new Date().toISOString(),
    };
    if (isEdit) {
      const { error } = await getSupabase().from("saved_items").update(payload).eq("id", editing!.id);
      setSaving(false);
      if (error) return setErr(error.message);
      return onSaved();
    }
    const { data, error } = await getSupabase().from("saved_items").insert({
      ...payload, user_id: userId, source: "MANUAL",
    }).select("id").single();
    if (!error && countMonth && data) {
      // SAFETY-01 — chave determinística: reenviar o formulário não duplica o gasto ligado.
      const { error: expErr } = await getSupabase().from("expenses").insert({
        user_id: userId, description: name.trim(), amount: value, date,
        time: new Date().toTimeString().slice(0, 5), payment_method: "Outro",
        source: "SAVED_ITEM", idempotency_key: `saved_item:${data.id}`,
      });
      if (expErr && expErr.code !== "23505") { setSaving(false); return setErr(expErr.message); }
    }
    setSaving(false);
    if (error) return setErr(error.message);
    logMetric(userId, "SAVED_ITEM_CREATED");
    onSaved();
  }

  async function remove() {
    if (!editing || !confirm("Apagar este item?")) return;
    setSaving(true);
    const { error } = await getSupabase().from("saved_items").delete().eq("id", editing.id);
    setSaving(false);
    if (error) return setErr(error.message);
    onSaved();
  }

  return (
    <SheetShell title={isEdit ? "Editar item guardado" : "Novo item guardado"} onClose={onClose}>
      <input className="clay-input" placeholder="Nome (ex.: Air Fryer)" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="clay-input" inputMode="decimal" placeholder="Valor (€)" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <input className="clay-input" placeholder="Loja (opcional)" value={store} onChange={(e) => setStore(e.target.value)} />
      <input className="clay-input" placeholder="Link da compra (opcional)" value={url} onChange={(e) => setUrl(e.target.value)} />
      <PhotoField userId={userId} value={photoUrl} onChange={setPhotoUrl} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-nextp-muted text-xs font-bold uppercase mb-1">Data compra</p>
          <input type="date" className="clay-input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <p className="text-nextp-muted text-xs font-bold uppercase mb-1">Garantia até</p>
          <input type="date" className="clay-input" value={warranty ?? ""} onChange={(e) => setWarranty(e.target.value)} />
        </div>
      </div>
      <label className="flex items-center gap-3 clay-card-soft cursor-pointer">
        <input type="checkbox" checked={countMonth} onChange={(e) => setCountMonth(e.target.checked)} className="w-5 h-5 accent-nextp-blue" />
        <span className="text-sm font-bold">Contar como gasto do mês?</span>
      </label>
      {err && <p className="text-nextp-danger text-sm text-center">{err}</p>}
      <button className="clay-btn w-full text-lg" onClick={save} disabled={saving}>{saving ? "A guardar…" : isEdit ? "Guardar alterações" : "Guardar item"}</button>
      {isEdit && <button className="w-full text-nextp-danger font-bold py-2" onClick={remove} disabled={saving}>Apagar item</button>}
    </SheetShell>
  );
}

function WishlistSheet({ userId, editing, onClose, onSaved }: { userId: string; editing: WishlistItem | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!editing;
  const [name, setName] = useState(editing?.name ?? "");
  const [expected, setExpected] = useState(editing?.expected_amount != null ? String(editing.expected_amount).replace(".", ",") : "");
  const [target, setTarget] = useState(editing?.target_amount != null ? String(editing.target_amount).replace(".", ",") : "");
  const [amazonUrl, setAmazonUrl] = useState(editing?.amazon_url ?? "");
  const [externalUrl, setExternalUrl] = useState(editing?.external_url ?? "");
  const [photoUrl, setPhotoUrl] = useState(editing?.image_path ?? "");
  const [priority, setPriority] = useState<WishlistPriority>(editing?.priority ?? "MEDIUM");
  const [desired, setDesired] = useState(editing?.desired_date ?? "");
  const [note, setNote] = useState(editing?.note ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const PR: [WishlistPriority, string][] = [["LOW", "Baixa"], ["MEDIUM", "Média"], ["HIGH", "Alta"], ["URGENT", "Urgente"]];

  async function save() {
    if (!name.trim()) return setErr("Nome em falta.");
    if (!isValidUrl(amazonUrl)) return setErr("Link Amazon inválido.");
    if (!isValidUrl(externalUrl)) return setErr("Link externo inválido.");
    if (!isValidUrl(photoUrl)) return setErr("Link da foto inválido.");
    setSaving(true);
    const payload = {
      name: name.trim(),
      expected_amount: expected ? parseFloat(expected.replace(",", ".")) : null,
      target_amount: target ? parseFloat(target.replace(",", ".")) : null,
      amazon_url: amazonUrl.trim() || null,
      external_url: externalUrl.trim() || null,
      image_path: photoUrl.trim() || null,
      priority, desired_date: desired || null, note: note.trim() || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = isEdit
      ? await getSupabase().from("wishlist_items").update(payload).eq("id", editing!.id)
      : await getSupabase().from("wishlist_items").insert({ ...payload, user_id: userId, status: "WISHLIST" });
    setSaving(false);
    if (error) return setErr(error.message);
    if (!isEdit) logMetric(userId, "WISHLIST_ITEM_CREATED");
    onSaved();
  }

  async function remove() {
    if (!editing || !confirm("Apagar este produto?")) return;
    setSaving(true);
    const { error } = await getSupabase().from("wishlist_items").delete().eq("id", editing.id);
    setSaving(false);
    if (error) return setErr(error.message);
    onSaved();
  }

  return (
    <SheetShell title={isEdit ? "Editar produto desejado" : "Novo produto desejado"} onClose={onClose}>
      <input className="clay-input" placeholder="Nome (ex.: Air Fryer nova)" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <input className="clay-input" inputMode="decimal" placeholder="Valor previsto (€)" value={expected} onChange={(e) => setExpected(e.target.value)} />
        <input className="clay-input" inputMode="decimal" placeholder="Preço alvo (€)" value={target} onChange={(e) => setTarget(e.target.value)} />
      </div>
      <input className="clay-input" placeholder="Link Amazon (opcional)" value={amazonUrl ?? ""} onChange={(e) => setAmazonUrl(e.target.value)} />
      <input className="clay-input" placeholder="Link externo (opcional)" value={externalUrl ?? ""} onChange={(e) => setExternalUrl(e.target.value)} />
      <PhotoField userId={userId} value={photoUrl} onChange={setPhotoUrl} />
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
        <input type="date" className="clay-input" value={desired ?? ""} onChange={(e) => setDesired(e.target.value)} />
      </div>
      <input className="clay-input" placeholder="Observação (opcional)" value={note ?? ""} onChange={(e) => setNote(e.target.value)} />
      {err && <p className="text-nextp-danger text-sm text-center">{err}</p>}
      <button className="clay-btn w-full text-lg" onClick={save} disabled={saving}>{saving ? "A guardar…" : isEdit ? "Guardar alterações" : "Guardar produto"}</button>
      {isEdit && <button className="w-full text-nextp-danger font-bold py-2" onClick={remove} disabled={saving}>Apagar produto</button>}
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
      <input className="clay-input" inputMode="decimal" placeholder="Valor final (€)" value={amount} onChange={(e) => setAmount(e.target.value)} />
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
  useLockBodyScroll();
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" style={{ height: "100dvh" }}>
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
