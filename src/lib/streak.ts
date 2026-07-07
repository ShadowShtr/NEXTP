import { getSupabase } from "@/lib/supabase";
import { todayISO } from "@/lib/format";

/** Calcula a sequência de dias consecutivos (até hoje) com pelo menos 1 gasto registado. */
export async function computeStreak(userId: string): Promise<number> {
  const { data } = await getSupabase()
    .from("expenses")
    .select("date")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("date", { ascending: false })
    .limit(400);
  if (!data || data.length === 0) return 0;

  const days = new Set(data.map((r) => r.date as string));
  let streak = 0;
  const cursor = new Date();
  // permite que "hoje" ainda não tenha gasto sem quebrar a sequência de ontem
  if (!days.has(todayISO(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(todayISO(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
