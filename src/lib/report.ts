import { getSupabase } from "@/lib/supabase";
import { eur, monthBounds, prettyDate } from "@/lib/format";
import { getMonthlyFinance, type MonthlyFinance } from "@/lib/finance";
import { logActivity } from "@/lib/activityLog";
import { logMetric } from "@/lib/metrics";

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export type MonthlyReport = {
  year: number;
  month: number;
  monthLabel: string;
  finance: MonthlyFinance;
  prevMonthTotal: number;
  changePct: number | null;
  byCategory: { name: string; total: number }[];
  biggestExpense: { description: string; amount: number; date: string } | null;
  smallExpenseTotal: number;
  smallExpenseCount: number;
  recurringPaidCount: number;
  recurringPendingCount: number;
  dailyTotals: { date: string; total: number }[];
};

/** REPORT-01 — junta tudo o que já existe no motor financeiro/Resumo num único relatório do mês. */
export async function buildMonthlyReport(userId: string, year: number, month: number): Promise<MonthlyReport> {
  const sb = getSupabase();
  const dateISO = `${year}-${String(month).padStart(2, "0")}-01`;
  const { start, end } = monthBounds(dateISO);
  const prevDate = month === 1 ? `${year - 1}-12-01` : `${year}-${String(month - 1).padStart(2, "0")}-01`;
  const { start: prevStart, end: prevEnd } = monthBounds(prevDate);

  const [finance, expenses, prevExpenses, cats, settings, occ] = await Promise.all([
    getMonthlyFinance(userId, year, month),
    sb.from("expenses").select("description,amount,date,category_id").eq("user_id", userId).is("deleted_at", null).gte("date", start).lte("date", end),
    sb.from("expenses").select("amount").eq("user_id", userId).is("deleted_at", null).gte("date", prevStart).lte("date", prevEnd),
    sb.from("categories").select("id,name").eq("user_id", userId),
    sb.from("user_settings").select("small_expense_limit").eq("user_id", userId).maybeSingle(),
    sb.from("recurring_occurrences").select("status").eq("user_id", userId).eq("year", year).eq("month", month),
  ]);

  const rows = expenses.data ?? [];
  const smallLimit = settings.data?.small_expense_limit ?? 5;
  const catName = new Map((cats.data ?? []).map((c) => [c.id, c.name]));

  const byCatMap = new Map<string, number>();
  const byDayMap = new Map<string, number>();
  let biggest: { description: string; amount: number; date: string } | null = null;
  let smallTotal = 0, smallCount = 0;

  for (const r of rows) {
    const amount = Number(r.amount);
    const catLabel = r.category_id ? catName.get(r.category_id) ?? "Outros" : "Sem categoria";
    byCatMap.set(catLabel, (byCatMap.get(catLabel) ?? 0) + amount);
    byDayMap.set(r.date, (byDayMap.get(r.date) ?? 0) + amount);
    if (!biggest || amount > biggest.amount) biggest = { description: r.description, amount, date: r.date };
    if (amount < smallLimit) { smallTotal += amount; smallCount++; }
  }

  const prevTotal = (prevExpenses.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const changePct = prevTotal > 0 ? Math.round(((finance.expenseTotal - prevTotal) / prevTotal) * 100) : null;

  const occRows = occ.data ?? [];
  const recurringPaidCount = occRows.filter((o) => o.status === "PAID").length;
  const recurringPendingCount = occRows.filter((o) => o.status !== "PAID").length;

  return {
    year, month, monthLabel: `${MONTHS[month - 1]}/${year}`,
    finance, prevMonthTotal: prevTotal, changePct,
    byCategory: Array.from(byCatMap.entries()).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total),
    biggestExpense: biggest,
    smallExpenseTotal: smallTotal, smallExpenseCount: smallCount,
    recurringPaidCount, recurringPendingCount,
    dailyTotals: Array.from(byDayMap.entries()).map(([date, total]) => ({ date, total })).sort((a, b) => a.date.localeCompare(b.date)),
  };
}

function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportReportJSON(userId: string, report: MonthlyReport) {
  downloadBlob(JSON.stringify(report, null, 2), `nextp-relatorio-${report.year}-${String(report.month).padStart(2, "0")}.json`, "application/json");
  logMetric(userId, "REPORT_EXPORTED");
  logActivity(userId, "month", "EXPORTED", `Relatório de ${report.monthLabel} (JSON)`);
}

/** HTML autossuficiente e imprimível — no browser, "Imprimir → Guardar como PDF" dá o PDF sem depender de bibliotecas extra. */
export function exportReportHTML(userId: string, report: MonthlyReport) {
  const r = report;
  const rows = r.byCategory.map((c) => `<tr><td>${escapeHtml(c.name)}</td><td class="num">${eur(c.total)}</td></tr>`).join("");
  const html = `<!doctype html>
<html lang="pt">
<head>
<meta charset="utf-8">
<title>NextP — Relatório ${r.monthLabel}</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; color: #1A2233; padding: 32px; max-width: 720px; margin: 0 auto; }
  h1 { color: #006DFF; }
  h2 { margin-top: 32px; border-bottom: 2px solid #EAF1FF; padding-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  td, th { padding: 6px 4px; text-align: left; border-bottom: 1px solid #EEE; }
  .num { text-align: right; font-weight: bold; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
  .stat { background: #F5F8FF; border-radius: 12px; padding: 12px; }
  .stat .label { font-size: 11px; text-transform: uppercase; color: #7A8699; font-weight: bold; }
  .stat .value { font-size: 20px; font-weight: 900; }
  .danger { color: #F04438; }
  .success { color: #12B76A; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <h1>NextP — Relatório de ${r.monthLabel}</h1>
  <div class="grid">
    <div class="stat"><div class="label">Receitas</div><div class="value success">${eur(r.finance.incomeTotal)}</div></div>
    <div class="stat"><div class="label">Gastos</div><div class="value">${eur(r.finance.expenseTotal)}</div></div>
    <div class="stat"><div class="label">Saldo atual</div><div class="value ${r.finance.currentBalance >= 0 ? "success" : "danger"}">${eur(r.finance.currentBalance)}</div></div>
    <div class="stat"><div class="label">Saldo previsto</div><div class="value ${r.finance.projectedBalance >= 0 ? "success" : "danger"}">${eur(r.finance.projectedBalance)}</div></div>
  </div>

  <h2>Comparação com o mês anterior</h2>
  <p>Mês anterior: ${eur(r.prevMonthTotal)}${r.changePct !== null ? ` · variação: ${r.changePct > 0 ? "+" : ""}${r.changePct}%` : ""}</p>

  <h2>Gastos por categoria</h2>
  <table><tbody>${rows || `<tr><td colspan="2">Sem gastos este mês.</td></tr>`}</tbody></table>

  <h2>Contas recorrentes</h2>
  <p>Pagas: ${r.recurringPaidCount} · Pendentes: ${r.recurringPendingCount}</p>

  <h2>Gastos Invisíveis</h2>
  <p>${eur(r.smallExpenseTotal)} em ${r.smallExpenseCount} pequenas compras.</p>

  <h2>Maior gasto</h2>
  <p>${r.biggestExpense ? `${escapeHtml(r.biggestExpense.description)} — ${eur(r.biggestExpense.amount)} (${prettyDate(r.biggestExpense.date)})` : "—"}</p>

  <h2>Previsão</h2>
  <p>Ao ritmo atual: ${eur(r.finance.projectedExpenseByAverage)} até ao fim do mês · saldo previsto no fecho: ${eur(r.finance.projectedEndBalance)}</p>

  <p style="margin-top:32px; color:#7A8699; font-size:12px;">Gerado por NextP em ${new Date().toLocaleString("pt-PT")}.</p>
</body>
</html>`;
  downloadBlob(html, `nextp-relatorio-${r.year}-${String(r.month).padStart(2, "0")}.html`, "text/html");
  logMetric(userId, "REPORT_EXPORTED");
  logActivity(userId, "month", "EXPORTED", `Relatório de ${report.monthLabel} (HTML)`);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
