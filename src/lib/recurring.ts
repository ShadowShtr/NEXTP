import { getSupabase } from "@/lib/supabase";
import { logMetric } from "@/lib/metrics";
import { logActivity } from "@/lib/activityLog";

export type RecurringPayment = {
  id: string;
  name: string;
  amount: number;
  due_day: number;
  category_id: string | null;
  repeat_type: string;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
};

/**
 * "Parcela X/Y" quando a conta tem data final definida (empréstimo, prestação).
 * Sem end_date, a conta é recorrente indefinidamente e isto devolve null.
 */
export function installmentLabel(payment: RecurringPayment, year: number, month: number): string | null {
  if (!payment.end_date || !payment.start_date) return null;
  const [sy, sm] = payment.start_date.split("-").map(Number);
  const [ey, em] = payment.end_date.split("-").map(Number);
  const total = (ey - sy) * 12 + (em - sm) + 1;
  const current = (year - sy) * 12 + (month - sm) + 1;
  if (total <= 0 || current < 1 || current > total) return null;
  return `${current}/${total}`;
}

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
    .select("id, name, amount, due_day, category_id, repeat_type, is_active, start_date, end_date")
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

  const monthKey = `${year}-${String(month).padStart(2, "0")}`;

  const toCreate = (payments as RecurringPayment[])
    .filter((p) => !have.has(p.id))
    // respeita a janela de parcelas: não gera ocorrências antes do início nem depois do fim.
    .filter((p) => {
      if (p.start_date && monthKey < p.start_date.slice(0, 7)) return false;
      if (p.end_date && monthKey > p.end_date.slice(0, 7)) return false;
      return true;
    })
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
          // SAFETY-01 — chave determinística: marcar "pago" duas vezes seguidas nunca duplica o gasto ligado.
          idempotency_key: `recurring_occurrence:${occ.id}`,
        })
        .select("id")
        .single();
      if (expErr && expErr.code !== "23505") return { error: expErr.message };
      if (exp) {
        createdExpenseId = exp.id;
      } else if (expErr?.code === "23505") {
        // já existe um gasto com esta chave (duplo-toque) — reaproveita o id em vez de duplicar.
        const { data: existing } = await sb.from("expenses").select("id")
          .eq("user_id", userId).eq("idempotency_key", `recurring_occurrence:${occ.id}`).maybeSingle();
        createdExpenseId = existing?.id ?? null;
      }
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
    logActivity(userId, "recurring_occurrence", "MARKED_PAID", paymentName, Number(occ.expected_amount), occ.id);
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
  if (!error) logActivity(userId, "recurring_occurrence", "MARKED_PENDING", paymentName, Number(occ.expected_amount), occ.id);
  return { error: error?.message ?? null };
}

/** Marca pagamento parcial (guarda o valor efetivamente pago). */
export async function markPartial(userId: string, occ: Occurrence, partialAmount: number, paymentName: string): Promise<{ error: string | null }> {
  const { error } = await getSupabase()
    .from("recurring_occurrences")
    .update({
      status: "PARTIAL",
      paid_amount: partialAmount,
      paid_at: new Date().toISOString().slice(0, 10),
      updated_at: new Date().toISOString(),
    })
    .eq("id", occ.id);
  if (!error) {
    logMetric(userId, "RECURRING_PAYMENT_MARKED_PARTIAL");
    logActivity(userId, "recurring_occurrence", "MARKED_PAID", `${paymentName} (parcial)`, partialAmount, occ.id);
  }
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
