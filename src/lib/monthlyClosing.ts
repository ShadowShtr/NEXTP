import { getSupabase } from "@/lib/supabase";
import { getMonthlyFinance } from "@/lib/finance";
import { monthBounds } from "@/lib/format";
import { logMetric } from "@/lib/metrics";
import { logActivity } from "@/lib/activityLog";

export type MonthlyClosing = {
  id: string;
  year: number;
  month: number;
  income_total: number;
  expense_total: number;
  recurring_paid: number;
  recurring_pending: number;
  small_expense_total: number;
  final_balance: number;
  projected_balance: number;
  top_category: string | null;
  closed_at: string;
  reopened_at: string | null;
};

/** Categoria com maior gasto e total de Gastos Invisíveis do mês, para o snapshot do fechamento. */
async function expenseBreakdownOf(userId: string, year: number, month: number): Promise<{ topCategory: string | null; smallExpenseTotal: number }> {
  const sb = getSupabase();
  const dateISO = `${year}-${String(month).padStart(2, "0")}-01`;
  const { start, end } = monthBounds(dateISO);
  const [exp, cats, settings] = await Promise.all([
    sb.from("expenses").select("amount,category_id").eq("user_id", userId).is("deleted_at", null).gte("date", start).lte("date", end),
    sb.from("categories").select("id,name").eq("user_id", userId),
    sb.from("user_settings").select("small_expense_limit").eq("user_id", userId).maybeSingle(),
  ]);
  const smallLimit = settings.data?.small_expense_limit ?? 5;
  const byCat = new Map<string, number>();
  let smallExpenseTotal = 0;
  for (const e of exp.data ?? []) {
    const amount = Number(e.amount);
    if (amount < smallLimit) smallExpenseTotal += amount;
    if (!e.category_id) continue;
    byCat.set(e.category_id, (byCat.get(e.category_id) ?? 0) + amount);
  }
  let bestId: string | null = null, bestAmount = 0;
  for (const [id, amount] of byCat) {
    if (amount > bestAmount) { bestId = id; bestAmount = amount; }
  }
  const topCategory = bestId ? (cats.data ?? []).find((c) => c.id === bestId)?.name ?? null : null;
  return { topCategory, smallExpenseTotal };
}

/** FINANCE-15 — tira (ou atualiza) o snapshot financeiro do mês e marca-o como fechado. */
export async function closeMonth(userId: string, year: number, month: number): Promise<{ error: string | null }> {
  const [finance, breakdown] = await Promise.all([
    getMonthlyFinance(userId, year, month),
    expenseBreakdownOf(userId, year, month),
  ]);
  const { error } = await getSupabase().from("monthly_closings").upsert({
    user_id: userId, year, month,
    income_total: finance.incomeTotal,
    expense_total: finance.expenseTotal,
    recurring_paid: finance.recurringPaid,
    recurring_pending: finance.recurringPending,
    small_expense_total: breakdown.smallExpenseTotal,
    final_balance: finance.currentBalance,
    projected_balance: finance.projectedBalance,
    top_category: breakdown.topCategory,
    closed_at: new Date().toISOString(),
    reopened_at: null,
  }, { onConflict: "user_id,year,month" });
  if (!error) {
    logMetric(userId, "MONTH_CLOSED");
    logActivity(userId, "month", "CLOSED", `${month}/${year}`, finance.currentBalance);
  }
  return { error: error?.message ?? null };
}

/** Mantém o snapshot (histórico), mas volta a marcar o mês como aberto/editável. */
export async function reopenMonth(userId: string, year: number, month: number): Promise<{ error: string | null }> {
  const { error } = await getSupabase().from("monthly_closings")
    .update({ reopened_at: new Date().toISOString() })
    .eq("user_id", userId).eq("year", year).eq("month", month);
  if (!error) {
    logMetric(userId, "MONTH_REOPENED");
    logActivity(userId, "month", "REOPENED", `${month}/${year}`);
  }
  return { error: error?.message ?? null };
}

export async function getClosing(userId: string, year: number, month: number): Promise<MonthlyClosing | null> {
  const { data } = await getSupabase().from("monthly_closings").select("*")
    .eq("user_id", userId).eq("year", year).eq("month", month).maybeSingle();
  return (data as MonthlyClosing | null) ?? null;
}

export async function listClosings(userId: string): Promise<MonthlyClosing[]> {
  const { data } = await getSupabase().from("monthly_closings").select("*")
    .eq("user_id", userId).order("year", { ascending: false }).order("month", { ascending: false });
  return (data ?? []) as MonthlyClosing[];
}

/** FINANCE-15 — usado para avisar (não bloquear) quando se edita um gasto/receita de um mês já fechado. */
export async function isMonthClosed(userId: string, dateISO: string): Promise<boolean> {
  const [year, month] = dateISO.split("-").map(Number);
  const closing = await getClosing(userId, year, month);
  return !!closing && !closing.reopened_at;
}
