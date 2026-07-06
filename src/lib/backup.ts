import { getSupabase } from "@/lib/supabase";
import { logMetric } from "@/lib/metrics";

const TABLES = [
  "categories", "expenses", "saved_items", "wishlist_items",
  "planning_items", "recurring_payments", "recurring_occurrences",
  "income_entries", "user_settings",
] as const;

/**
 * Exporta todos os dados do utilizador em JSON e dispara o download no browser.
 * Nunca inclui dados de outro utilizador (RLS garante).
 */
export async function exportBackup(userId: string): Promise<{ error: string | null }> {
  logMetric(userId, "BACKUP_STARTED");
  const sb = getSupabase();
  const payload: Record<string, unknown> = {
    version: 2,
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

export type ImportReport = {
  error: string | null;
  imported: Record<string, number>;
  skipped: Record<string, number>;
  totalImported: number;
  totalSkipped: number;
};

/**
 * BACKUP-02 — Restaura um backup JSON preservando as relações entre tabelas.
 * Como os registos ganham NOVOS ids ao serem reinseridos, mantém-se um mapa
 * `old_id -> new_id` por tabela e usa-se esse mapa para reescrever as chaves
 * estrangeiras (category_id, recurring_payment_id, wishlist_item_id, etc.)
 * antes de inserir a tabela seguinte. A ordem respeita as dependências:
 * categorias → recorrentes (templates) → ocorrências → wishlist → guardados
 * → planeamento → gastos → receitas → definições.
 */
export async function importBackup(userId: string, jsonText: string): Promise<ImportReport> {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { error: "Ficheiro JSON inválido.", imported: {}, skipped: {}, totalImported: 0, totalSkipped: 0 };
  }

  const sb = getSupabase();
  const imported: Record<string, number> = {};
  const skipped: Record<string, number> = {};
  // um mapa de ids por tabela: idMaps.categories.get(oldId) === newId
  const idMaps: Record<string, Map<string, string>> = {};

  function rowsOf(table: string): Record<string, unknown>[] {
    const rows = parsed[table];
    return Array.isArray(rows) ? (rows as Record<string, unknown>[]) : [];
  }

  async function importTable(
    table: string,
    remap?: (row: Record<string, unknown>) => Record<string, unknown>,
  ) {
    const map = new Map<string, string>();
    idMaps[table] = map;
    let ok = 0, bad = 0;
    for (const raw of rowsOf(table)) {
      const oldId = raw.id as string | undefined;
      const { id: _id, user_id: _u, created_at: _c, ...rest } = raw;
      const payload = { ...(remap ? remap(rest) : rest), user_id: userId };
      const { data, error } = await sb.from(table).insert(payload).select("id").single();
      if (error || !data) { bad++; continue; }
      ok++;
      if (oldId) map.set(oldId, data.id as string);
    }
    imported[table] = ok;
    skipped[table] = bad;
  }

  function mapped(map: Map<string, string> | undefined, oldId: unknown): string | null {
    if (typeof oldId !== "string") return null;
    return map?.get(oldId) ?? null; // referência órfã (categoria apagada, etc.) vira null, não falha a linha
  }

  // 1) Categorias — sem dependências.
  await importTable("categories");

  // 2) Contas recorrentes (templates) — dependem de categorias.
  await importTable("recurring_payments", (row) => ({
    ...row,
    category_id: mapped(idMaps.categories, row.category_id),
  }));

  // 3) Ocorrências mensais — dependem do template recorrente.
  await importTable("recurring_occurrences", (row) => ({
    ...row,
    recurring_payment_id: mapped(idMaps.recurring_payments, row.recurring_payment_id),
    created_expense_id: null, // religado depois de importar expenses, se aplicável
  }));

  // 4) Wishlist — depende de categorias.
  await importTable("wishlist_items", (row) => ({
    ...row,
    category_id: mapped(idMaps.categories, row.category_id),
    converted_saved_item_id: null, // religado depois de importar saved_items
  }));

  // 5) Guardados — depende da wishlist (item convertido).
  await importTable("saved_items", (row) => ({
    ...row,
    wishlist_item_id: mapped(idMaps.wishlist_items, row.wishlist_item_id),
  }));

  // 6) Planeamento — sem FKs para outras tabelas do backup.
  await importTable("planning_items");

  // 7) Gastos — dependem de categoria e, opcionalmente, da ocorrência recorrente.
  await importTable("expenses", (row) => ({
    ...row,
    category_id: mapped(idMaps.categories, row.category_id),
    occurrence_id: mapped(idMaps.recurring_occurrences, row.occurrence_id),
  }));

  // 8) Receitas — sem FKs.
  await importTable("income_entries");

  // 9) Definições — upsert único (não faz sentido duplicar linhas).
  const settingsRows = rowsOf("user_settings");
  if (settingsRows[0]) {
    const { id: _id, user_id: _u, updated_at: _ua, ...rest } = settingsRows[0];
    const { error } = await sb.from("user_settings").upsert({ ...rest, user_id: userId }, { onConflict: "user_id" });
    imported.user_settings = error ? 0 : 1;
    skipped.user_settings = error ? 1 : 0;
  }

  const totalImported = Object.values(imported).reduce((s, n) => s + n, 0);
  const totalSkipped = Object.values(skipped).reduce((s, n) => s + n, 0);
  return { error: null, imported, skipped, totalImported, totalSkipped };
}
