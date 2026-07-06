import { getSupabase } from "@/lib/supabase";
import { eur, monthBounds, todayISO } from "@/lib/format";

export type AlertSeverity = "danger" | "warning" | "info";
export type AppAlert = { id: string; severity: AlertSeverity; title: string; detail: string };

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86400000);
}

/**
 * NOTIF-02 — Central de Alertas: calculada em tempo real a partir dos dados
 * já existentes (sem tabela própria). Cobre: conta vencida, conta vence
 * hoje, garantia a expirar, categoria perto do limite, gastos invisíveis
 * altos e backup desatualizado.
 */
export async function computeAlerts(userId: string): Promise<AppAlert[]> {
  const sb = getSupabase();
  const today = todayISO();
  const now = new Date();
  const { start, end } = monthBounds(today);

  const [occ, planning, saved, cats, expenses, settings] = await Promise.all([
    sb.from("recurring_occurrences").select("id,due_date,status,expected_amount,recurring_payment_id")
      .eq("user_id", userId).eq("year", now.getFullYear()).eq("month", now.getMonth() + 1)
      .in("status", ["PENDING", "OVERDUE", "PARTIAL"]),
    sb.from("planning_items").select("id,name,due_date,status,total_amount")
      .eq("user_id", userId).not("status", "in", "(PAID,CANCELLED)").not("due_date", "is", null),
    sb.from("saved_items").select("id,name,warranty_until").eq("user_id", userId).not("warranty_until", "is", null),
    sb.from("categories").select("id,name,monthly_limit").eq("user_id", userId).not("monthly_limit", "is", null),
    sb.from("expenses").select("amount,category_id").eq("user_id", userId).gte("date", start).lte("date", end),
    sb.from("user_settings").select("small_expense_limit,last_backup_at").eq("user_id", userId).maybeSingle(),
  ]);

  const alerts: AppAlert[] = [];
  const smallLimit = settings.data?.small_expense_limit ?? 5;

  // Contas recorrentes vencidas / a vencer hoje.
  for (const o of occ.data ?? []) {
    if (o.status === "OVERDUE" || (o.due_date < today && o.status !== "PARTIAL")) {
      alerts.push({ id: `occ-overdue-${o.id}`, severity: "danger", title: "Conta vencida", detail: `Vencia em ${o.due_date} — ${eur(Number(o.expected_amount))}` });
    } else if (o.due_date === today) {
      alerts.push({ id: `occ-today-${o.id}`, severity: "warning", title: "Conta vence hoje", detail: `${eur(Number(o.expected_amount))} — marca como paga no Planeamento` });
    }
  }

  // Planeamento (contas/dívidas) vencidas / a vencer hoje.
  for (const p of planning.data ?? []) {
    if (!p.due_date) continue;
    if (p.due_date < today) {
      alerts.push({ id: `plan-overdue-${p.id}`, severity: "danger", title: `"${p.name}" vencida`, detail: `Vencia em ${p.due_date} — ${eur(Number(p.total_amount))}` });
    } else if (p.due_date === today) {
      alerts.push({ id: `plan-today-${p.id}`, severity: "warning", title: `"${p.name}" vence hoje`, detail: eur(Number(p.total_amount)) });
    }
  }

  // Garantias a expirar (próximos 30 dias) ou já expiradas.
  for (const s of saved.data ?? []) {
    if (!s.warranty_until) continue;
    const days = daysBetween(s.warranty_until, today);
    if (days < 0) {
      alerts.push({ id: `warranty-${s.id}`, severity: "info", title: `Garantia de "${s.name}" expirada`, detail: `Terminou em ${s.warranty_until}` });
    } else if (days <= 30) {
      alerts.push({ id: `warranty-${s.id}`, severity: "warning", title: `Garantia de "${s.name}" a expirar`, detail: `Faltam ${days} dias` });
    }
  }

  // Categorias perto/acima do limite mensal.
  const spentByCat = new Map<string, number>();
  for (const e of expenses.data ?? []) {
    if (!e.category_id) continue;
    spentByCat.set(e.category_id, (spentByCat.get(e.category_id) ?? 0) + Number(e.amount));
  }
  for (const c of cats.data ?? []) {
    const limit = Number(c.monthly_limit);
    if (!limit) continue;
    const spent = spentByCat.get(c.id) ?? 0;
    const pct = Math.round((spent / limit) * 100);
    if (pct >= 100) {
      alerts.push({ id: `cat-${c.id}`, severity: "danger", title: `Limite de "${c.name}" ultrapassado`, detail: `${eur(spent)} de ${eur(limit)} (${pct}%)` });
    } else if (pct >= 80) {
      alerts.push({ id: `cat-${c.id}`, severity: "warning", title: `Categoria "${c.name}" perto do limite`, detail: `${eur(spent)} de ${eur(limit)} (${pct}%)` });
    }
  }

  // Gastos Invisíveis altos este mês.
  const smallExpenses = (expenses.data ?? []).filter((e) => Number(e.amount) < smallLimit);
  const smallTotal = smallExpenses.reduce((s, e) => s + Number(e.amount), 0);
  if (smallExpenses.length >= 15 || smallTotal >= 50) {
    alerts.push({ id: "small-expenses", severity: "info", title: "Gastos Invisíveis altos este mês", detail: `${eur(smallTotal)} em ${smallExpenses.length} pequenas compras` });
  }

  // Backup desatualizado (nunca feito ou há mais de 30 dias).
  const lastBackup = settings.data?.last_backup_at;
  if (!lastBackup || daysBetween(today, lastBackup.slice(0, 10)) > 30) {
    alerts.push({ id: "backup-old", severity: "info", title: "Backup desatualizado", detail: lastBackup ? "Já lá vão mais de 30 dias — exporta um backup em Configurações." : "Ainda não fizeste nenhum backup." });
  }

  const order: Record<AlertSeverity, number> = { danger: 0, warning: 1, info: 2 };
  return alerts.sort((a, b) => order[a.severity] - order[b.severity]);
}
