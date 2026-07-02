import { getSupabase } from "@/lib/supabase";

const DEFAULTS = [
  { name: "Comida", icon: "🍔", color: "#F79009" },
  { name: "Besteira", icon: "🍦", color: "#FF7A9A" },
  { name: "Mercado", icon: "🛒", color: "#12B76A" },
  { name: "Conta fixa", icon: "🧾", color: "#006DFF" },
  { name: "Transporte", icon: "🚌", color: "#72D7FF" },
  { name: "Casa", icon: "🏠", color: "#9B7EDE" },
  { name: "Trabalho", icon: "💼", color: "#101828" },
  { name: "Família", icon: "👨‍👩‍👧", color: "#FDB022" },
  { name: "Saúde", icon: "❤️", color: "#F04438" },
  { name: "Documentos", icon: "📄", color: "#667085" },
  { name: "Outros", icon: "📦", color: "#98A2B3" },
];

/**
 * Semeia categorias padrão na primeira utilização.
 * Idempotente e seguro contra corridas: usa upsert com "ignoreDuplicates" sobre
 * o índice único (user_id, name) — nunca cria duplicados mesmo que esta função
 * seja chamada em paralelo (ex.: dois separadores abertos ao mesmo tempo).
 */
export async function ensureDefaultCategories(userId: string) {
  const sb = getSupabase();
  const { count } = await sb
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if ((count ?? 0) > 0) return;
  await sb
    .from("categories")
    .upsert(
      DEFAULTS.map((c) => ({ ...c, is_default: true, user_id: userId })),
      { onConflict: "user_id,name", ignoreDuplicates: true }
    );
}
