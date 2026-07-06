import { getSupabase } from "@/lib/supabase";

export type WishlistPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type WishlistStatus = "WISHLIST" | "PURCHASED";

export type WishlistItem = {
  id: string;
  name: string;
  expected_amount: number | null;
  target_amount: number | null;
  current_amount: number | null;
  amazon_url: string | null;
  external_url: string | null;
  image_path: string | null;
  category_id: string | null;
  priority: WishlistPriority;
  status: WishlistStatus;
  desired_date: string | null;
  note: string | null;
  converted_saved_item_id: string | null;
  created_at: string;
};

/** Regra de negócio (docs/15-security.md): aceita http(s) válido; marca amazon.* como Amazon. */
export function isValidUrl(url: string): boolean {
  if (!url.trim()) return true; // campo opcional
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function isAmazonUrl(url: string): boolean {
  try {
    return new URL(url).hostname.includes("amazon.");
  } catch {
    return false;
  }
}

/**
 * Converte um item da wishlist num SavedItem (Guardados > Comprados).
 * WISHLIST-02: chama o RPC `convert_wishlist_to_saved_item` no Postgres, que
 * faz o insert do saved_item + update do wishlist_item + insert opcional do
 * expense **numa única transação** no servidor (não em 2-3 chamadas
 * separadas do cliente). Um índice único em `saved_items.wishlist_item_id`
 * e um `select ... for update` dentro da função impedem duplicação mesmo
 * sob corrida (duplo toque, duas abas abertas, etc.).
 */
export async function convertWishlistToSavedItem(params: {
  userId: string;
  wishlist: WishlistItem;
  finalAmount: number;
  purchaseDate: string;
  countAsMonthlyExpense: boolean;
}): Promise<{ error: string | null }> {
  const { wishlist, finalAmount, purchaseDate, countAsMonthlyExpense } = params;

  if (wishlist.status === "PURCHASED") {
    return { error: "Este produto já foi marcado como comprado." };
  }
  if (!finalAmount || finalAmount <= 0) {
    return { error: "Valor final inválido." };
  }

  const { error } = await getSupabase().rpc("convert_wishlist_to_saved_item", {
    p_wishlist_id: wishlist.id,
    p_final_amount: finalAmount,
    p_purchase_date: purchaseDate,
    p_count_as_expense: countAsMonthlyExpense,
  });
  if (error) return { error: error.message };
  return { error: null };
}
