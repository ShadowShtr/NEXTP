import { getSupabase } from "@/lib/supabase";

export type WalletType = "CASH" | "BANK" | "CARD" | "SAVINGS" | "MBWAY" | "OTHER";

export type WalletAccount = {
  id: string;
  name: string;
  type: WalletType;
  initial_balance: number;
  color: string | null;
  icon: string | null;
  is_default: boolean;
  // CREDIT-01 — só usados quando type === "CARD"; primeira versão apenas informativa
  // (gastos no cartão continuam a contar já no mês, a fatura em si é trabalho futuro).
  closing_day: number | null;
  due_day: number | null;
  credit_limit: number | null;
};

export type WalletBalance = WalletAccount & { balance: number };

export const WALLET_TYPE_LABEL: Record<WalletType, string> = {
  CASH: "Dinheiro", BANK: "Banco", CARD: "Cartão", SAVINGS: "Poupança", MBWAY: "MB Way", OTHER: "Outro",
};

export async function listWallets(userId: string): Promise<WalletAccount[]> {
  const { data } = await getSupabase().from("wallet_accounts").select("*").eq("user_id", userId).order("created_at");
  return (data ?? []) as WalletAccount[];
}

/**
 * FINANCE-12 — o saldo de cada carteira nunca é guardado numa coluna (evita
 * ficar dessincronizado se um gasto for editado/apagado por fora); é sempre
 * recalculado a partir do saldo inicial + receitas − gastos ligados a ela.
 */
export async function getWalletBalances(userId: string): Promise<WalletBalance[]> {
  const sb = getSupabase();
  const [wallets, income, expenses] = await Promise.all([
    listWallets(userId),
    sb.from("income_entries").select("amount,wallet_account_id").eq("user_id", userId).is("deleted_at", null).not("wallet_account_id", "is", null),
    sb.from("expenses").select("amount,wallet_account_id").eq("user_id", userId).is("deleted_at", null).not("wallet_account_id", "is", null),
  ]);
  const net = new Map<string, number>();
  for (const i of income.data ?? []) {
    const id = i.wallet_account_id as string;
    net.set(id, (net.get(id) ?? 0) + Number(i.amount));
  }
  for (const e of expenses.data ?? []) {
    const id = e.wallet_account_id as string;
    net.set(id, (net.get(id) ?? 0) - Number(e.amount));
  }
  return wallets.map((w) => ({ ...w, balance: Number(w.initial_balance) + (net.get(w.id) ?? 0) }));
}

export async function saveWallet(userId: string, wallet: {
  id?: string; name: string; type: WalletType; initialBalance: number; isDefault: boolean;
  closingDay?: number | null; dueDay?: number | null; creditLimit?: number | null;
}): Promise<{ error: string | null }> {
  const sb = getSupabase();
  if (wallet.isDefault) {
    await sb.from("wallet_accounts").update({ is_default: false }).eq("user_id", userId);
  }
  const payload = {
    name: wallet.name, type: wallet.type, initial_balance: wallet.initialBalance,
    is_default: wallet.isDefault,
    closing_day: wallet.type === "CARD" ? wallet.closingDay ?? null : null,
    due_day: wallet.type === "CARD" ? wallet.dueDay ?? null : null,
    credit_limit: wallet.type === "CARD" ? wallet.creditLimit ?? null : null,
    updated_at: new Date().toISOString(),
  };
  const { error } = wallet.id
    ? await sb.from("wallet_accounts").update(payload).eq("id", wallet.id)
    : await sb.from("wallet_accounts").insert({ ...payload, user_id: userId });
  return { error: error?.message ?? null };
}

export async function deleteWallet(id: string): Promise<{ error: string | null }> {
  // on delete set null nas tabelas de gastos/receitas — nunca apaga histórico financeiro.
  const { error } = await getSupabase().from("wallet_accounts").delete().eq("id", id);
  return { error: error?.message ?? null };
}

export async function defaultWalletId(userId: string): Promise<string | null> {
  const { data } = await getSupabase().from("wallet_accounts").select("id").eq("user_id", userId).eq("is_default", true).maybeSingle();
  return data?.id ?? null;
}
