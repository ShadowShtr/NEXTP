import { getSupabase } from "@/lib/supabase";
import { logMetric } from "@/lib/metrics";

export type RecurringPayment = {
  id: string;
  name: string;
  amount: number;
  due_day: number;
  category_id: string | null;
  repeat_type: string;
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
  created_expense_id: string | null;
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
    .select("id, name, amount, due_day, category_id, repeat_type, is_active")
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

/** Alterna pago/pendente de uma ocorrência (só afeta ESTE mês). Sem lançar gasto. */
export async function togglePaid(userId: string, occ: Occurrence): Promise<{ error: string | null }> {
  const sb = getSupabase();
  const nowPaying = occ.status !== "PAID";
  const { error } = await sb
    .from("recurring_occurrences")
    .update({
      status: nowPaying ? "PAID" : "PENDING",
      paid_amount: nowPaying ? occ.expected_amount : 0,
      paid_at: nowPaying ? new Date().toISOString().slice(0, 10) : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", occ.id);
  if (error) return { error: error.message };
  if (nowPaying) logMetric(userId, "RECURRING_PAYMENT_MARKED_PAID");
  return { error: null };
}

/**
 * Marca como pago (ou desmarca) e opcionalmente lança/estorna o gasto vinculado.
 * Nunca duplica: usa `created_expense_id` para saber se já existe um gasto ligado.
 */
export async function setPaidStatus(params: {
  userId: string;
  occ: Occurrence;
  paymentName: string;
  paid: boolean;
  createExpense: boolean;
}): Promise<{ error: string | null }> {
  const { userId, occ, paymentName, paid, createExpense } = params;
  const sb = getSupabase();

  if (paid) {
    let createdExpenseId = occ.created_expense_id;
    if (createExpense && !createdExpenseId) {
      const { data: exp, error: expErr } = await sb
        .from("expenses")
        .insert({
          user_id: userId,
          description: paymentName,
          amount: occ.expected_amount,
          date: new Date().toISOString().slice(0, 10),
          time: new Date().toTimeString().slice(0, 5),
          payment_method: "Outro",
          source: "RECURRING",
          occurrence_id: occ.id,
        })
        .select("id")
        .single();
      if (expErr) return { error: expErr.message };
      createdExpenseId = exp?.id ?? null;
    }
    const { error } = await sb
      .from("recurring_occurrences")
      .update({
        status: "PAID",
        paid_amount: occ.expected_amount,
        paid_at: new Date().toISOString().slice(0, 10),
        created_expense_id: createdExpenseId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", occ.id);
    if (error) return { error: error.message };
    logMetric(userId, "RECURRING_PAYMENT_MARKED_PAID");
    return { error: null };
  }

  // desmarcar: volta a pendente e estorna o gasto ligado, se existir
  if (occ.created_expense_id) {
    await sb.from("expenses").delete().eq("id", occ.created_expense_id);
  }
  const { error } = await sb
    .from("recurring_occurrences")
    .update({ status: "PENDING", paid_amount: 0, paid_at: null, created_expense_id: null, updated_at: new Date().toISOString() })
    .eq("id", occ.id);
  return { error: error?.message ?? null };
}

/** Marca pagamento parcial (guarda o valor efetivamente pago). */
export async function markPartial(userId: string, occ: Occurrence, partialAmount: number): Promise<{ error: string | null }> {
  const { error } = await getSupabase()
    .from("recurring_occurrences")
    .update({
      status: "PARTIAL",
      paid_amount: partialAmount,
      paid_at: new Date().toISOString().slice(0, 10),
      updated_at: new Date().toISOString(),
    })
    .eq("id", occ.id);
  if (!error) logMetric(userId, "RECURRING_PAYMENT_MARKED_PARTIAL");
  return { error: error?.message ?? null };
}

/** Histórico completo de ocorrências de uma conta recorrente, mais recente primeiro. */
export async function getOccurrenceHistory(userId: string, recurringPaymentId: string): Promise<Occurrence[]> {
  const { data } = await getSupabase()
    .from("recurring_occurrences")
    .select("*")
    .eq("user_id", userId)
    .eq("recurring_payment_id", recurringPaymentId)
    .order("year", { ascending: false })
    .order("month", { ascending: false });
  return (data ?? []) as Occurrence[];
}
