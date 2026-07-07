import { getSupabase } from "@/lib/supabase";
import { logMetric } from "@/lib/metrics";

export type TrashTable = "expenses" | "income_entries" | "saved_items" | "wishlist_items" | "planning_items";

export const TRASH_TABLE_LABEL: Record<TrashTable, string> = {
  expenses: "Gasto", income_entries: "Receita", saved_items: "Item guardado",
  wishlist_items: "Produto desejado", planning_items: "Conta / dívida",
};

/** SAFETY-03 — apagar nunca é definitivo: marca `deleted_at` em vez de remover a linha. */
export async function softDelete(userId: string, table: TrashTable, id: string): Promise<{ error: string | null }> {
  const { error } = await getSupabase().from(table).update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (!error) logMetric(userId, "ITEM_TRASHED", { table });
  return { error: error?.message ?? null };
}

export async function restoreFromTrash(userId: string, table: TrashTable, id: string): Promise<{ error: string | null }> {
  const { error } = await getSupabase().from(table).update({ deleted_at: null }).eq("id", id);
  if (!error) logMetric(userId, "ITEM_RESTORED", { table });
  return { error: error?.message ?? null };
}

export type TrashItem = { table: TrashTable; id: string; label: string; amount: number | null; deletedAt: string };

export async function listTrash(userId: string): Promise<TrashItem[]> {
  const sb = getSupabase();
  const [exp, inc, saved, wish, plan] = await Promise.all([
    sb.from("expenses").select("id,description,amount,deleted_at").eq("user_id", userId).not("deleted_at", "is", null),
    sb.from("income_entries").select("id,description,amount,deleted_at").eq("user_id", userId).not("deleted_at", "is", null),
    sb.from("saved_items").select("id,name,amount,deleted_at").eq("user_id", userId).not("deleted_at", "is", null),
    sb.from("wishlist_items").select("id,name,expected_amount,target_amount,deleted_at").eq("user_id", userId).not("deleted_at", "is", null),
    sb.from("planning_items").select("id,name,total_amount,deleted_at").eq("user_id", userId).not("deleted_at", "is", null),
  ]);
  const items: TrashItem[] = [];
  for (const r of exp.data ?? []) items.push({ table: "expenses", id: r.id, label: r.description, amount: Number(r.amount), deletedAt: r.deleted_at as string });
  for (const r of inc.data ?? []) items.push({ table: "income_entries", id: r.id, label: r.description, amount: Number(r.amount), deletedAt: r.deleted_at as string });
  for (const r of saved.data ?? []) items.push({ table: "saved_items", id: r.id, label: r.name, amount: Number(r.amount), deletedAt: r.deleted_at as string });
  for (const r of wish.data ?? []) items.push({ table: "wishlist_items", id: r.id, label: r.name, amount: r.expected_amount ?? r.target_amount ?? null, deletedAt: r.deleted_at as string });
  for (const r of plan.data ?? []) items.push({ table: "planning_items", id: r.id, label: r.name, amount: Number(r.total_amount), deletedAt: r.deleted_at as string });
  return items.sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
}
