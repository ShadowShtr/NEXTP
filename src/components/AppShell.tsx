"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { ensureDefaultCategories } from "@/lib/seed";
import type { Category, Expense } from "@/lib/types";
import { nowHM, todayISO } from "@/lib/format";
import { PAYMENT_METHODS } from "@/lib/types";
import RecordsTab from "@/components/tabs/RecordsTab";
import SavedTab from "@/components/tabs/SavedTab";
import PlanningTab from "@/components/tabs/PlanningTab";
import SummaryTab from "@/components/tabs/SummaryTab";
import AddExpenseSheet from "@/components/AddExpenseSheet";
import SettingsSheet from "@/components/SettingsSheet";
import AlertsSheet from "@/components/AlertsSheet";
import QuickAddSheet, { type QuickAddTarget } from "@/components/QuickAddSheet";
import IncomeSheet from "@/components/IncomeSheet";
import { computeAlerts } from "@/lib/alerts";
import { FeatureIcon } from "@/lib/icons";

type Tab = "records" | "saved" | "planning" | "summary";

export default function AppShell({ session }: { session: Session }) {
  const userId = session.user.id;
  const email = session.user.email ?? "";
  const [tab, setTab] = useState<Tab>("records");
  const [categories, setCategories] = useState<Category[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [preset, setPreset] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<QuickAddTarget | null>(null);
  const [pendingToken, setPendingToken] = useState(0);

  const loadCats = useCallback(async () => {
    await ensureDefaultCategories(userId);
    const { data } = await getSupabase().from("categories").select("*").eq("user_id", userId).order("name");
    if (data) setCategories(data as Category[]);
  }, [userId]);

  useEffect(() => { loadCats(); }, [loadCats]);
  useEffect(() => { computeAlerts(userId).then((a) => setAlertCount(a.length)); }, [userId, refresh]);

  function openAdd() { setEditing(null); setPreset(null); setAddOpen(true); }
  function openQuick(catId: string) { setEditing(null); setPreset(catId); setAddOpen(true); }
  function openEdit(e: Expense) { setEditing(e); setPreset(null); setAddOpen(true); }
  function close() { setAddOpen(false); setEditing(null); setPreset(null); }
  function afterSave() { close(); setRefresh((r) => r + 1); }

  /** UX-03 — o + central abre um menu rápido; cada opção decide para onde ir. */
  function handleQuickAdd(target: QuickAddTarget) {
    setQuickAddOpen(false);
    if (target === "expense") return openAdd();
    if (target === "income") return setIncomeOpen(true);
    if (target === "recurring" || target === "debt") setTab("planning");
    else setTab("saved"); // saved | wishlist
    setPendingAction(target);
    setPendingToken((t) => t + 1);
  }

  async function logout() { await getSupabase().auth.signOut(); }

  const key = `${tab}-${refresh}`;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-5 pt-4 pb-1">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-clay bg-nextp-icon grid place-items-center text-white font-black shadow-clay-sm">N</div>
          <span className="font-black text-nextp-blue text-xl">NextP</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setAlertsOpen(true)} aria-label="Alertas"
            className="relative w-9 h-9 rounded-full bg-white shadow-clay-sm grid place-items-center">
            <FeatureIcon name="bell" size={20} />
            {alertCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-nextp-danger ring-2 ring-white" />
            )}
          </button>
          <button onClick={() => setSettingsOpen(true)} aria-label="Configurações"
            className="w-9 h-9 rounded-full bg-white shadow-clay-sm grid place-items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/system/system-settings.svg" width={22} height={22} alt="" draggable={false} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-28">
        {tab === "records" && <RecordsTab key={key} userId={userId} categories={categories} onEdit={openEdit} onQuickAdd={openQuick} />}
        {tab === "saved" && <SavedTab key={key} userId={userId} autoOpen={pendingAction === "saved" || pendingAction === "wishlist" ? pendingAction : null} autoOpenToken={pendingToken} />}
        {tab === "planning" && <PlanningTab key={key} userId={userId} autoOpen={pendingAction === "recurring" || pendingAction === "debt" ? pendingAction : null} autoOpenToken={pendingToken} />}
        {tab === "summary" && <SummaryTab key={key} userId={userId} />}
      </main>

      <BottomNav tab={tab} setTab={setTab} onAdd={() => setQuickAddOpen(true)} />

      {addOpen && (
        <AddExpenseSheet
          userId={userId}
          categories={categories}
          editing={editing}
          presetCategory={preset}
          defaults={{ date: todayISO(), time: nowHM(), method: PAYMENT_METHODS[0] }}
          onClose={close}
          onSaved={afterSave}
        />
      )}

      {settingsOpen && (
        <SettingsSheet userId={userId} email={email} onClose={() => setSettingsOpen(false)} onLogout={logout} />
      )}

      {alertsOpen && <AlertsSheet userId={userId} onClose={() => setAlertsOpen(false)} />}

      {quickAddOpen && <QuickAddSheet onClose={() => setQuickAddOpen(false)} onSelect={handleQuickAdd} />}

      {incomeOpen && (
        <IncomeSheet userId={userId} editing={null}
          onClose={() => setIncomeOpen(false)}
          onSaved={() => { setIncomeOpen(false); setRefresh((r) => r + 1); }}
        />
      )}
    </div>
  );
}

/** UI-02 — ícones oficiais 3D/SVG (nunca emoji) na navegação principal. */
const NAV_ICONS: Record<Tab, string> = {
  records: "/icons/categories-png/category-home-house.png",
  saved: "/icons/features/feature-wallet.svg",
  planning: "/icons/features/feature-calendar-check.svg",
  summary: "/icons/features/feature-chart.svg",
};

function BottomNav({
  tab, setTab, onAdd,
}: { tab: string; setTab: (t: Tab) => void; onAdd: () => void }) {
  const item = (id: Tab, label: string) => {
    const active = tab === id;
    return (
      <button onClick={() => setTab(id)} className={`flex flex-col items-center gap-0.5 w-16 py-1 ${active ? "text-nextp-blue" : "text-nextp-muted"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={NAV_ICONS[id]} alt="" width={26} height={26} className={active ? "scale-110" : "opacity-70"} draggable={false} />
        <span className="text-[10px] font-bold">{label}</span>
      </button>
    );
  };
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white shadow-clay rounded-t-clay-xl flex items-center justify-between px-3"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 6px)", paddingTop: "8px" }}>
      {item("records", "Registos")}
      {item("saved", "Guardados")}
      <button onClick={onAdd} aria-label="Novo gasto"
        className="w-16 h-16 -mt-8 rounded-full bg-nextp-blue text-white text-4xl font-black shadow-clay-btn grid place-items-center active:scale-90 transition-transform ring-4 ring-white">
        ＋
      </button>
      {item("planning", "Planeamento")}
      {item("summary", "Resumo")}
    </nav>
  );
}
