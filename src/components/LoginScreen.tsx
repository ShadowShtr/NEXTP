"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";

type Mode = "signin" | "signup" | "reset";

/**
 * Login por EMAIL + PASSWORD, com fluxos separados (LOGIN-01):
 * - Entrar: conta já existente.
 * - Criar conta: signUp explícito (requer "Confirm email" desligado no Supabase).
 * - Esqueci a password: envia email de reposição.
 * - Entrar com Google: botão preparado (ver docs/13 — falta ativar o provider).
 */
export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgKind, setMsgKind] = useState<"error" | "success">("error");

  function say(text: string, kind: "error" | "success" = "error") {
    setMsg(text);
    setMsgKind(kind);
  }

  async function signIn() {
    say("");
    if (!email.includes("@")) return say("Escreve um email válido.");
    if (password.length < 6) return say("A password precisa de 6+ caracteres.");
    setLoading(true);
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return say(/invalid login credentials/i.test(error.message)
      ? "Email ou password incorretos."
      : error.message);
    // onAuthStateChange trata do resto.
  }

  async function signUp() {
    say("");
    if (!email.includes("@")) return say("Escreve um email válido.");
    if (password.length < 6) return say("A password precisa de 6+ caracteres.");
    setLoading(true);
    const { data, error } = await getSupabase().auth.signUp({ email, password });
    setLoading(false);
    if (error) return say(/already registered|already exists/i.test(error.message)
      ? "Já existe uma conta com este email. Tenta entrar."
      : error.message);
    if (!data.session) return say('Conta criada. Se não entrar automaticamente, desliga "Confirm email" no Supabase.', "success");
    // onAuthStateChange trata do resto.
  }

  async function resetPassword() {
    say("");
    if (!email.includes("@")) return say("Escreve o teu email primeiro.");
    setLoading(true);
    const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
    });
    setLoading(false);
    if (error) return say(error.message);
    say("Enviámos um email com o link para repores a password.", "success");
  }

  async function signInWithGoogle() {
    say("");
    setLoading(true);
    const { error } = await getSupabase().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
    });
    setLoading(false);
    if (error) return say("Login com Google ainda não está ativado (ver docs/13-web-supabase-vercel.md).");
  }

  function submit() {
    if (mode === "signin") return signIn();
    if (mode === "signup") return signUp();
    return resetPassword();
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
          {mode !== "reset" && (
            <input
              className="clay-input"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          )}

          <button className="clay-btn w-full text-lg" onClick={submit} disabled={loading}>
            {loading ? "Aguarda…" : mode === "signin" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar email de reposição"}
          </button>

          {mode === "signin" && (
            <button className="w-full text-center text-nextp-muted text-sm font-bold" onClick={() => { setMode("reset"); say(""); }}>
              Esqueci a password
            </button>
          )}

          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-nextp-cardsoft" />
            <span className="text-nextp-muted text-xs font-bold">ou</span>
            <div className="flex-1 h-px bg-nextp-cardsoft" />
          </div>

          <button className="clay-btn-ghost w-full flex items-center justify-center gap-2" onClick={signInWithGoogle} disabled={loading}>
            <span className="text-lg">G</span> Entrar com Google
          </button>
        </div>

        {msg && (
          <p className={`text-center text-sm ${msgKind === "error" ? "text-nextp-danger" : "text-nextp-success"}`}>{msg}</p>
        )}

        <div className="text-center text-sm">
          {mode === "signin" && (
            <button className="font-bold text-nextp-blue" onClick={() => { setMode("signup"); say(""); }}>
              Não tens conta? Criar conta
            </button>
          )}
          {mode === "signup" && (
            <button className="font-bold text-nextp-blue" onClick={() => { setMode("signin"); say(""); }}>
              Já tens conta? Entrar
            </button>
          )}
          {mode === "reset" && (
            <button className="font-bold text-nextp-blue" onClick={() => { setMode("signin"); say(""); }}>
              Voltar a entrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
