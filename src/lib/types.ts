export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  monthly_limit: number | null;
  is_default: boolean;
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  category_id: string | null;
  date: string; // yyyy-mm-dd
  time: string | null;
  payment_method: string | null;
  note: string | null;
  is_recurring: boolean;
  source: string;
  wallet_account_id: string | null;
  created_at: string;
};

export const PAYMENT_METHODS = ["Dinheiro", "Cartão", "MB Way", "Transferência", "Outro"] as const;
