"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";

/**
 * Login por EMAIL + PASSWORD — sem emails, sem limites de envio.
 * Primeira vez: cria a conta automaticamente (requer "Confirm email" DESLIGADO
 * no Supabase). Depois é só entrar. Os dados vivem no Supabase (nunca se perdem).
 */
export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    setMsg(null);
    if (!email.includes("@")) return setMsg("Escreve um email válido.");
    if (password.length < 6) return setMsg("A password precisa de 6+ caracteres.");
    setLoading(true);
    const sb = getSupabase();

    // 1) tenta entrar
    const { error: signInErr } = await sb.auth.signInWithPassword({ email, password });

    // 2) se ainda não existe conta, cria e entra
    if (signInErr) {
      if (/invalid login credentials/i.test(signInErr.message)) {
        const { data: up, error: signUpErr } = await sb.auth.signUp({ email, password });
        setLoading(false);
        if (signUpErr) return setMsg(signUpErr.message);
        if (!up.session) return setMsg('Conta criada. Desliga "Confirm email" no Supabase e tenta entrar.');
        return; // sessão criada — onAuthStateChange trata do resto
      }
      setLoading(false);
      return setMsg(signInErr.message);
    }

    setLoading(false);
    // onAuthStateChange trata do resto.
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="clay-card w-full max-w-sm space-y-5">
        <div className="text-center space-y-1">
          <div className="mx-auto w-16 h-16 rounded-clay bg-nextp-icon grid place-items-center shadow-clay text-white text-3xl font-black">
            N
          </div>
          <h1 className="text-2xl font-black text-nextp-blue">NextP</h1>
          <p className="text-nextp-muted text-sm">O teu ajudador financeiro pessoal</p>
        </div>

        <div className="space-y-3">
          <input
            className="clay-input"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="clay-input"
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <button className="clay-btn w-full text-lg" onClick={submit} disabled={loading}>
            {loading ? "A entrar…" : "Entrar / Criar conta"}
          </button>
        </div>

        {msg && <p className="text-center text-sm text-nextp-muted">{msg}</p>}
        <p className="text-center text-xs text-nextp-muted">
          Primeira vez? A conta é criada automaticamente.
        </p>
      </div>
    </div>
  );
}
