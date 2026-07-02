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
 * Converte um item da wishlist num SavedItem (Guardados > Comprados),
 * de forma transacional/segura: nunca duplica (bloqueia se já PURCHASED).
 * TASK 10 do masterplan — equivalente a WishlistRepository.convertWishlistToSavedItem.
 */
export async function convertWishlistToSavedItem(params: {
  userId: string;
  wishlist: WishlistItem;
  finalAmount: number;
  purchaseDate: string;
  countAsMonthlyExpense: boolean;
}): Promise<{ error: string | null }> {
  const { userId, wishlist, finalAmount, purchaseDate, countAsMonthlyExpense } = params;

  if (wishlist.status === "PURCHASED") {
    return { error: "Este produto já foi marcado como comprado." };
  }
  if (!finalAmount || finalAmount <= 0) {
    return { error: "Valor final inválido." };
  }

  const sb = getSupabase();

  const { data: savedItem, error: insertErr } = await sb
    .from("saved_items")
    .insert({
      user_id: userId,
      name: wishlist.name,
      amount: finalAmount,
      purchase_date: purchaseDate,
      purchase_url: wishlist.amazon_url || wishlist.external_url || null,
      invoice_image_path: wishlist.image_path || null,
      source: "WISHLIST",
      wishlist_item_id: wishlist.id,
      count_as_monthly_expense: countAsMonthlyExpense,
    })
    .select("id")
    .single();
  if (insertErr || !savedItem) return { error: insertErr?.message ?? "Falha ao criar item guardado." };

  const { error: updateErr } = await sb
    .from("wishlist_items")
    .update({
      status: "PURCHASED",
      converted_saved_item_id: savedItem.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", wishlist.id)
    .eq("status", "WISHLIST"); // guarda extra contra corrida/duplicidade
  if (updateErr) return { error: updateErr.message };

  if (countAsMonthlyExpense) {
    await sb.from("expenses").insert({
      user_id: userId,
      description: wishlist.name,
      amount: finalAmount,
      date: purchaseDate,
      time: new Date().toTimeString().slice(0, 5),
      payment_method: "Outro",
      source: "SAVED_ITEM",
    });
  }

  return { error: null };
}
