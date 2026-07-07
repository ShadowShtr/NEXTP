import { getSupabase } from "@/lib/supabase";
import { todayISO, nowHM } from "@/lib/format";
import { logMetric } from "@/lib/metrics";
import { logActivity } from "@/lib/activityLog";

export type QuickExpenseTemplate = {
  id: string;
  description: string;
  amount: number;
  category_id: string | null;
  payment_method: string | null;
  wallet_account_id: string | null;
  usage_count: number;
};

/** UX-04 — favoritos ordenados pelos mais usados primeiro. */
export async function listQuickExpenses(userId: string): Promise<QuickExpenseTemplate[]> {
  const { data } = await getSupabase().from("quick_expense_templates").select("*")
    .eq("user_id", userId).order("usage_count", { ascending: false }).order("created_at", { ascending: false });
  return (data ?? []) as QuickExpenseTemplate[];
}

export async function createQuickExpense(userId: string, t: {
  description: string; amount: number; categoryId: string | null; paymentMethod: string | null; walletAccountId: string | null;
}): Promise<{ error: string | null }> {
  const { error } = await getSupabase().from("quick_expense_templates").insert({
    user_id: userId, description: t.description, amount: t.amount,
    category_id: t.categoryId, payment_method: t.paymentMethod, wallet_account_id: t.walletAccountId,
  });
  return { error: error?.message ?? null };
}

export async function deleteQuickExpense(id: string): Promise<{ error: string | null }> {
  const { error } = await getSupabase().from("quick_expense_templates").delete().eq("id", id);
  return { error: error?.message ?? null };
}

/** Lança o gasto imediatamente (hoje) e conta o uso para reordenar os favoritos. */
export async function launchQuickExpense(userId: string, t: QuickExpenseTemplate): Promise<{ error: string | null }> {
  const sb = getSupabase();
  const { error } = await sb.from("expenses").insert({
    user_id: userId, description: t.description, amount: t.amount,
    category_id: t.category_id, date: todayISO(), time: nowHM(),
    payment_method: t.payment_method ?? "Outro", wallet_account_id: t.wallet_account_id, source: "QUICK",
  });
  if (error) return { error: error.message };
  await sb.from("quick_expense_templates").update({ usage_count: t.usage_count + 1 }).eq("id", t.id);
  logMetric(userId, "EXPENSE_CREATED");
  logActivity(userId, "expense", "CREATED", t.description, t.amount);
  return { error: null };
}
