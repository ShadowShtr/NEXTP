import { getSupabase } from "@/lib/supabase";

export type ActivityAction =
  | "CREATED" | "UPDATED" | "DELETED" | "RESTORED"
  | "MARKED_PAID" | "MARKED_PENDING" | "CONVERTED"
  | "IMPORTED" | "EXPORTED" | "CLOSED" | "REOPENED";

export type ActivityEntry = {
  id: string;
  entity_type: string;
  action: ActivityAction;
  description: string;
  amount: number | null;
  created_at: string;
};

export const ACTION_LABEL: Record<ActivityAction, string> = {
  CREATED: "Criou", UPDATED: "Editou", DELETED: "Apagou", RESTORED: "Restaurou",
  MARKED_PAID: "Marcou pago", MARKED_PENDING: "Desmarcou", CONVERTED: "Converteu",
  IMPORTED: "Importou", EXPORTED: "Exportou", CLOSED: "Fechou", REOPENED: "Reabriu",
};

/**
 * SAFETY-02 — histórico de alterações financeiras (fire-and-forget, nunca bloqueia
 * a UI nem propaga erro, tal como `logMetric`).
 */
export function logActivity(
  userId: string, entityType: string, action: ActivityAction, description: string,
  amount?: number | null, entityId?: string | null,
) {
  getSupabase()
    .from("activity_log")
    .insert({ user_id: userId, entity_type: entityType, entity_id: entityId ?? null, action, description, amount: amount ?? null })
    .then(() => {}, () => {});
}

export async function listActivity(userId: string, limit = 100): Promise<ActivityEntry[]> {
  const { data } = await getSupabase().from("activity_log").select("*")
    .eq("user_id", userId).order("created_at", { ascending: false }).limit(limit);
  return (data ?? []) as ActivityEntry[];
}
