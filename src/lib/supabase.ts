"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase único (browser). A sessão é persistida automaticamente e
 * renovada sozinha. Os DADOS vivem na nuvem (tabelas), por isso limpar cache
 * ou fazer deploy NUNCA os apaga — no pior caso pede-se login outra vez.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!url || !anon) {
    throw new Error(
      "Supabase não configurado: define NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  if (!_client) {
    _client = createClient(url, anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "nextp-auth",
      },
    });
  }
  return _client;
}

export const supabaseConfigured = Boolean(url && anon);
