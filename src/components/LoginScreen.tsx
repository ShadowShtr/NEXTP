"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";

/**
 * Login por CÓDIGO (OTP) enviado por email — ideal para PWA no iPhone
 * (não sai da app para abrir links). Os dados nunca dependem deste login:
 * se a sessão expirar, faz-se login outra vez e os dados continuam na nuvem.
 */
export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function sendCode() {
    setMsg(null);
    if (!email.includes("@")) return setMsg("Escreve um email válido.");
    setLoading(true);
    const { error } = await getSupabase().auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) return setMsg(error.message);
    setStage("code");
    setMsg("Enviámos um código para o teu email.");
  }

  async function verify() {
    setMsg(null);
    setLoading(true);
    const { error } = await getSupabase().auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });
    setLoading(false);
    if (error) return setMsg(error.message);
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

        {stage === "email" ? (
          <div className="space-y-3">
            <input
              className="clay-input"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="o.teu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="clay-btn w-full" onClick={sendCode} disabled={loading}>
              {loading ? "A enviar…" : "Receber código"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              className="clay-input text-center tracking-[0.4em] text-xl font-black"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button className="clay-btn w-full" onClick={verify} disabled={loading}>
              {loading ? "A entrar…" : "Entrar"}
            </button>
            <button className="clay-btn-ghost w-full" onClick={() => setStage("email")}>
              Voltar
            </button>
          </div>
        )}

        {msg && <p className="text-center text-sm text-nextp-muted">{msg}</p>}
      </div>
    </div>
  );
}
