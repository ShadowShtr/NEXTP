"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import LoginScreen from "@/components/LoginScreen";
import AppShell from "@/components/AppShell";

export default function Page() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!supabaseConfigured) {
      setReady(true);
      return;
    }
    const sb = getSupabase();
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!supabaseConfigured) return <SetupNotice />;
  if (!ready) return <Splash />;
  if (!session) return <LoginScreen />;
  return <AppShell session={session} />;
}

function Splash() {
  return (
    <div className="min-h-screen grid place-items-center">
      <div className="text-nextp-blue text-2xl font-black animate-pulse">NextP…</div>
    </div>
  );
}

function SetupNotice() {
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="clay-card max-w-md text-center space-y-3">
        <div className="text-3xl">⚙️</div>
        <h1 className="text-xl font-black text-nextp-blue">Falta configurar o Supabase</h1>
        <p className="text-nextp-muted text-sm">
          Define <code>NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> (em <code>.env.local</code> e no Vercel).
          Ver <code>docs/13-web-supabase-vercel.md</code>.
        </p>
      </div>
    </div>
  );
}
