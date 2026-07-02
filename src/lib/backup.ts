import { getSupabase } from "@/lib/supabase";
import { logMetric } from "@/lib/metrics";

const TABLES = [
  "categories", "expenses", "saved_items", "wishlist_items",
  "planning_items", "recurring_payments", "recurring_occurrences", "user_settings",
] as const;

/**
 * Exporta todos os dados do utilizador em JSON e dispara o download no browser.
 * TASK 19 (docs/19). Nunca inclui dados de outro utilizador (RLS garante).
 */
export async function exportBackup(userId: string): Promise<{ error: string | null }> {
  logMetric(userId, "BACKUP_STARTED");
  const sb = getSupabase();
  const payload: Record<string, unknown> = {
    version: 1,
    exportedAt: new Date().toISOString(),
  };

  for (const table of TABLES) {
    const { data, error } = await sb.from(table).select("*").eq("user_id", userId);
    if (error) {
      logMetric(userId, "BACKUP_FAILED");
      return { error: `Falha ao exportar ${table}: ${error.message}` };
    }
    payload[table] = data ?? [];
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nextp-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  await sb.from("user_settings").upsert({ user_id: userId, last_backup_at: new Date().toISOString() }, { onConflict: "user_id" }).select();
  logMetric(userId, "BACKUP_SUCCESS");
  return { error: null };
}

/**
 * Restaura um backup JSON. Limitação conhecida (documentada em docs/19 TASK 19):
 * como os IDs são recriados, referências entre tabelas (ex.: category_id de um
 * gasto antigo) só se mantêm válidas se as categorias já existirem na conta —
 * caso contrário essa referência específica fica a null, sem falhar o resto.
 */
export async function importBackup(userId: string, jsonText: string): Promise<{ error: string | null; imported: number; skipped: number }> {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { error: "Ficheiro JSON inválido.", imported: 0, skipped: 0 };
  }

  const sb = getSupabase();
  let imported = 0;
  let skipped = 0;

  // Categorias primeiro (outras tabelas podem referenciar category_id)
  const orderedTables = ["categories", ...TABLES.filter((t) => t !== "categories" && t !== "user_settings")];

  for (const table of orderedTables) {
    const rows = parsed[table];
    if (!Array.isArray(rows)) continue;
    for (const row of rows) {
      const { id: _id, user_id: _u, created_at: _c, ...rest } = row as Record<string, unknown>;
      const { error } = await sb.from(table).insert({ ...rest, user_id: userId });
      if (error) skipped++;
      else imported++;
    }
  }

  return { error: null, imported, skipped };
}
