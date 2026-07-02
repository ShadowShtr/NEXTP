import { getSupabase } from "@/lib/supabase";
import { logMetric } from "@/lib/metrics";

export type RecurringPayment = {
  id: string;
  name: string;
  amount: number;
  due_day: number;
  is_active: boolean;
};

export type Occurrence = {
  id: string;
  recurring_payment_id: string;
  month: number;
  year: number;
  due_date: string;
  expected_amount: number;
  paid_amount: number;
  status: "PENDING" | "PAID" | "PARTIAL" | "OVERDUE" | "IGNORED";
  paid_at: string | null;
};

function clampDay(year: number, month: number, day: number) {
  const last = new Date(year, month, 0).getDate();
  return Math.min(day, last);
}

/**
 * Garante que existe uma ocorrência para cada conta ativa no mês pedido.
 * Idempotente (o índice único evita duplicados). Cada mês é independente.
 */
export async function ensureOccurrences(userId: string, year: number, month: number) {
  const sb = getSupabase();
  const { data: payments } = await sb
    .from("recurring_payments")
    .select("id, name, amount, due_day, is_active")
    .eq("user_id", userId)
    .eq("is_active", true);
  if (!payments || payments.length === 0) return;

  const { data: existing } = await sb
    .from("recurring_occurrences")
    .select("recurring_payment_id")
    .eq("user_id", userId)
    .eq("year", year)
    .eq("month", month);
  const have = new Set((existing ?? []).map((o) => o.recurring_payment_id));

  const toCreate = (payments as RecurringPayment[])
    .filter((p) => !have.has(p.id))
    .map((p) => {
      const day = clampDay(year, month, p.due_day);
      const due = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const overdue = new Date(due) < new Date(new Date().toDateString());
      return {
        user_id: userId,
        recurring_payment_id: p.id,
        year,
        month,
        due_date: due,
        expected_amount: p.amount,
        paid_amount: 0,
        status: overdue ? "OVERDUE" : "PENDING",
      };
    });

  if (toCreate.length) await sb.from("recurring_occurrences").insert(toCreate);
}

/** Alterna pago/pendente de uma ocorrência (só afeta ESTE mês). */
export async function togglePaid(userId: string, occ: Occurrence) {
  const sb = getSupabase();
  const nowPaying = occ.status !== "PAID";
  await sb
    .from("recurring_occurrences")
    .update({
      status: nowPaying ? "PAID" : "PENDING",
      paid_amount: nowPaying ? occ.expected_amount : 0,
      paid_at: nowPaying ? new Date().toISOString().slice(0, 10) : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", occ.id);
  if (nowPaying) logMetric(userId, "RECURRING_PAYMENT_MARKED_PAID");
}
