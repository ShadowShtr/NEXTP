import { getSupabase } from "@/lib/supabase";
import { monthBounds, todayISO } from "@/lib/format";
import { ensureOccurrences } from "@/lib/recurring";

export type MonthlyFinance = {
  year: number;
  month: number;
  incomeTotal: number;
  expenseTotal: number;
  recurringPending: number;
  currentBalance: number;
  projectedBalance: number;
  reservedAmount: number;
  freeMoney: number;
  daysInMonth: number;
  daysElapsed: number;
  daysRemaining: number;
  averageDailyExpense: number;
  dailyAvailable: number;
  projectedExpenseByAverage: number;
  projectedEndBalance: number;
};

type IncomeRow = { amount: number | string };
type ExpenseRow = { amount: number | string; source: string | null };
type OccurrenceRow = { status: string; expected_amount: number | string; paid_amount: number | string };

/**
 * Motor financeiro central (FINANCE-13/14/16) — função pura, sem I/O, para poder
 * ser testada e para garantir que Registos/Resumo/Alertas leem sempre os mesmos
 * números. Contas fixas pagas contam sempre como gasto, mesmo quando o
 * utilizador não pediu para lançar o gasto ligado (evita dinheiro "invisível").
 */
export function computeMonthlyFinance(params: {
  year: number;
  month: number;
  today: string;
  incomeRows: IncomeRow[];
  expenseRows: ExpenseRow[];
  occurrenceRows: OccurrenceRow[];
  reservedAmount: number;
}): MonthlyFinance {
  const { year, month, today, incomeRows, expenseRows, occurrenceRows, reservedAmount } = params;

  const incomeTotal = incomeRows.reduce((s, r) => s + Number(r.amount), 0);

  // Gastos diretos (Registos, Guardados) — as contas recorrentes lançadas como
  // gasto (source "RECURRING") ficam de fora aqui para não contar a dobrar,
  // porque já entram via paid_amount das ocorrências, abaixo.
  const directExpenses = expenseRows
    .filter((r) => r.source !== "RECURRING")
    .reduce((s, r) => s + Number(r.amount), 0);

  let recurringPaid = 0;
  let recurringPending = 0;
  for (const o of occurrenceRows) {
    const expected = Number(o.expected_amount);
    const paid = Number(o.paid_amount);
    if (o.status === "PAID" || o.status === "PARTIAL") {
      recurringPaid += paid;
      recurringPending += Math.max(0, expected - paid);
    } else {
      recurringPending += expected;
    }
  }

  const expenseTotal = directExpenses + recurringPaid;
  const currentBalance = incomeTotal - expenseTotal;
  const projectedBalance = currentBalance - recurringPending;
  const freeMoney = projectedBalance - reservedAmount;

  const daysInMonth = new Date(year, month, 0).getDate();
  const [ty, tm, td] = today.split("-").map(Number);
  let daysElapsed: number;
  if (ty === year && tm === month) daysElapsed = td;
  else if (ty > year || (ty === year && tm > month)) daysElapsed = daysInMonth;
  else daysElapsed = 0;
  const daysRemaining = Math.max(0, daysInMonth - daysElapsed + (daysElapsed > 0 && daysElapsed <= daysInMonth ? 1 : 0));

  const averageDailyExpense = expenseTotal / Math.max(1, daysElapsed);
  const dailyAvailable = daysRemaining > 0 ? projectedBalance / daysRemaining : projectedBalance;
  const projectedExpenseByAverage = averageDailyExpense * daysInMonth;
  const projectedEndBalance = incomeTotal - projectedExpenseByAverage - recurringPending;

  return {
    year, month, incomeTotal, expenseTotal, recurringPending,
    currentBalance, projectedBalance, reservedAmount, freeMoney,
    daysInMonth, daysElapsed, daysRemaining, averageDailyExpense, dailyAvailable,
    projectedExpenseByAverage, projectedEndBalance,
  };
}

/** Busca os dados do mês e devolve o motor financeiro já calculado. */
export async function getMonthlyFinance(userId: string, year: number, month: number): Promise<MonthlyFinance> {
  await ensureOccurrences(userId, year, month);
  const sb = getSupabase();
  const dateISO = `${year}-${String(month).padStart(2, "0")}-01`;
  const { start, end } = monthBounds(dateISO);
  const [inc, exp, occ, settings] = await Promise.all([
    sb.from("income_entries").select("amount").eq("user_id", userId).gte("date", start).lte("date", end),
    sb.from("expenses").select("amount,source").eq("user_id", userId).gte("date", start).lte("date", end),
    sb.from("recurring_occurrences").select("status,expected_amount,paid_amount").eq("user_id", userId).eq("year", year).eq("month", month),
    sb.from("user_settings").select("reserved_amount").eq("user_id", userId).maybeSingle(),
  ]);
  return computeMonthlyFinance({
    year, month, today: todayISO(),
    incomeRows: (inc.data ?? []) as IncomeRow[],
    expenseRows: (exp.data ?? []) as ExpenseRow[],
    occurrenceRows: (occ.data ?? []) as OccurrenceRow[],
    reservedAmount: Number(settings.data?.reserved_amount ?? 0),
  });
}
