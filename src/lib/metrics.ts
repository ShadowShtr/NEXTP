import { getSupabase } from "@/lib/supabase";

/** Eventos permitidos — ver docs/16-metricas.md. Nunca incluir texto livre sensível em `meta`. */
export type MetricEventType =
  | "EXPENSE_CREATED" | "EXPENSE_UPDATED" | "EXPENSE_DELETED"
  | "SAVED_ITEM_CREATED"
  | "WISHLIST_ITEM_CREATED" | "WISHLIST_OPEN_AMAZON" | "WISHLIST_CONVERTED_TO_PURCHASED"
  | "RECURRING_PAYMENT_MARKED_PAID" | "RECURRING_PAYMENT_MARKED_PARTIAL"
  | "BACKUP_STARTED" | "BACKUP_SUCCESS" | "BACKUP_FAILED";

/** Regista um evento local (fire-and-forget; nunca bloqueia a UI nem propaga erro). */
export function logMetric(userId: string, type: MetricEventType, meta?: Record<string, unknown>) {
  getSupabase()
    .from("metric_events")
    .insert({ user_id: userId, event_type: type, meta: meta ?? null })
    .then(() => {}, () => {});
}
