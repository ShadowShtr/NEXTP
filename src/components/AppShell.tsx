"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { ensureDefaultCategories } from "@/lib/seed";
import RecordsTab from "@/components/tabs/RecordsTab";
import { PlaceholderTab } from "@/components/tabs/PlaceholderTab";

type Tab = "records" | "saved" | "planning" | "summary";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "records", label: "Registos", icon: "🧾" },
  { id: "saved", label: "Guardados", icon: "📦" },
  { id: "planning", label: "Planeamento", icon: "📅" },
  { id: "summary", label: "Resumo", icon: "📊" },
];

export default function AppShell({ session }: { session: Session }) {
  const userId = session.user.id;
  const [tab, setTab] = useState<Tab>("records");

  useEffect(() => {
    ensureDefaultCategories(userId).catch(() => {});
  }, [userId]);

  async function logout() {
    await getSupabase().auth.signOut();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-clay bg-nextp-icon grid place-items-center text-white font-black shadow-clay-sm">
            N
          </div>
          <span className="font-black text-nextp-blue text-lg">NextP</span>
        </div>
        <button onClick={logout} className="text-nextp-muted text-sm font-bold">
          Sair
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-28">
        {tab === "records" && <RecordsTab userId={userId} />}
        {tab === "saved" && (
          <PlaceholderTab title="Guardados" emoji="📦" text="Bens e compras importantes (Fase seguinte)." />
        )}
        {tab === "planning" && (
          <PlaceholderTab title="Planeamento" emoji="📅" text="Contas, dívidas e pagamentos recorrentes (Fase seguinte)." />
        )}
        {tab === "summary" && (
          <PlaceholderTab title="Resumo" emoji="📊" text="Gráficos e Gastos Invisíveis (Fase seguinte)." />
        )}
      </main>

      <nav
        className="fixed bottom-0 inset-x-0 bg-white shadow-clay rounded-t-clay-xl flex justify-around px-2 pt-2"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)" }}
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-clay transition-transform active:scale-90 ${
                active ? "text-nextp-blue" : "text-nextp-muted"
              }`}
            >
              <span className={`text-xl ${active ? "scale-110" : ""}`}>{t.icon}</span>
              <span className="text-[11px] font-bold">{t.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
