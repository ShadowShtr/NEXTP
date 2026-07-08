#!/usr/bin/env node
/**
 * NextP General Audit Script
 * Uso:
 *   node scripts/nextp-audit.mjs
 *   node scripts/nextp-audit.mjs --run-build
 *
 * Gera audit-report.md com auditoria de:
 * - performance/carregamento;
 * - travamentos comuns em PWA/iPhone;
 * - barra inferior que solta da base;
 * - integração financeira;
 * - Supabase/schema/índices/RLS;
 * - assets/imagens pesadas;
 * - qualidade de scripts/testes.
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const runBuild = process.argv.includes("--run-build");
const findings = [];
const report = [];
const severityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };

function exists(p) { return fs.existsSync(path.join(root, p)); }
function read(p) { try { return fs.readFileSync(path.join(root, p), "utf8"); } catch { return ""; } }
function size(p) { try { return fs.statSync(path.join(root, p)).size; } catch { return 0; } }

function walk(dir, out = []) {
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) return out;
  for (const e of fs.readdirSync(full, { withFileTypes: true })) {
    const rel = path.join(dir, e.name).replaceAll("\\", "/").replace(/^\.\//, "");
    if (e.isDirectory()) {
      if (["node_modules", ".next", ".git", "dist", "build", ".vercel"].includes(e.name)) continue;
      walk(rel, out);
    } else out.push(rel);
  }
  return out;
}

function add(severity, area, title, detail, files = [], suggestion = "") {
  findings.push({ severity, area, title, detail, files, suggestion });
}

function grep(files, pattern) {
  const hits = [];
  for (const f of files) {
    const txt = read(f);
    if (!txt) continue;
    txt.split(/\r?\n/).forEach((line, i) => {
      if (pattern.test(line)) hits.push({ file: f, line: i + 1, text: line.trim() });
    });
  }
  return hits;
}

function run(cmd) {
  try {
    return execSync(cmd, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    return `ERROR:\n${e.stdout ?? ""}\n${e.stderr ?? ""}`;
  }
}

const files = walk(".");
const src = files.filter(f => /^src\/.*\.(ts|tsx|js|jsx)$/.test(f));
const sql = files.filter(f => /^supabase\/.*\.sql$/.test(f));
const publicImages = files.filter(f => /^public\/.+\.(png|jpg|jpeg|webp|gif|svg)$/i.test(f));

report.push(`# NextP — Audit Report\n`);
report.push(`Gerado em: ${new Date().toISOString()}\n`);
report.push(`Root: \`${root}\`\n`);

const pkg = exists("package.json") ? JSON.parse(read("package.json")) : null;

if (!pkg) {
  add("P0", "Build", "package.json não encontrado", "Executa o script na raiz do repositório.", ["package.json"]);
} else {
  const scripts = pkg.scripts || {};
  if (!scripts.build) add("P0", "Build", "Script build em falta", "Sem npm run build não há validação de produção.", ["package.json"], "Adicionar script build.");
  if (!scripts.lint) add("P1", "Qualidade", "Script lint em falta", "Sem lint passam erros simples.", ["package.json"], "Adicionar lint.");
  if (!scripts.test) add("P1", "Qualidade", "Script test em falta", "Ainda não há testes automatizados.", ["package.json"], "Adicionar Vitest/Playwright.");
  if (!scripts.typecheck) add("P1", "Qualidade", "Script typecheck em falta", "TypeScript deve ser verificado sem build completo.", ["package.json"], "Adicionar: tsc --noEmit.");
  if (!pkg.dependencies?.["@tanstack/react-query"]) {
    add("P2", "Performance", "Sem camada de cache de queries", "As tabs tendem a buscar Supabase de novo em cada mount.", ["package.json"], "Considerar TanStack Query ou cache/repository mensal.");
  }
}

if (runBuild) {
  report.push("\n## Build/lint\n");
  report.push("```text\n");
  report.push(pkg?.scripts?.lint ? `npm run lint:\n${run("npm run lint").slice(0, 4000)}\n` : "Sem lint.\n");
  report.push(pkg?.scripts?.build ? `npm run build:\n${run("npm run build").slice(0, 4000)}\n` : "Sem build.\n");
  report.push("\n```\n");
}

const appShell = read("src/components/AppShell.tsx");
const globals = read("src/app/globals.css");
const schema = sql.map(read).join("\n");

if (/const key = `\$\{tab\}-\$\{refresh\}`/.test(appShell) || /key=\{key\}/.test(appShell)) {
  add("P1", "Performance", "Tabs desmontam/remontam por key global",
    "Isto força reload de tabs, refaz queries e dá sensação de travamento/carregamento.",
    ["src/components/AppShell.tsx"],
    "Trocar por financeVersion prop e refresh seletivo. Não usar key para reiniciar tela inteira.");
}

const supaHits = grep(src, /getSupabase\(\)\.from|sb\.from\(/);
if (supaHits.length > 25) {
  add("P1", "Performance", "Muitas chamadas Supabase espalhadas",
    `Encontradas ${supaHits.length} chamadas. Difícil cachear, medir e evitar loading.`,
    [...new Set(supaHits.slice(0, 12).map(h => h.file))],
    "Criar repositories/hooks: monthlyFinance, useRecords, usePlanning, useSummary.");
}

const starHits = grep(src, /\.select\(["'`]\*["'`]\)/);
if (starHits.length) {
  add("P2", "Performance", "select('*') em telas",
    `${starHits.length} ocorrências. Pode trazer dados desnecessários.`,
    [...new Set(starHits.map(h => h.file))],
    "Selecionar apenas colunas usadas.");
}

const promptHits = grep(src, /\bprompt\(/);
if (promptHits.length) {
  add("P2", "UX", "prompt() bloqueante",
    "prompt trava a UI e quebra o visual no iPhone.",
    [...new Set(promptHits.map(h => h.file))],
    "Trocar por BudgetSheet/BottomSheet clay.");
}

const smallHits = grep(src, /SMALL_LIMIT\s*=\s*5|const\s+SMALL_LIMIT/);
if (smallHits.length) {
  add("P1", "Financeiro", "Gastos Invisíveis com limite fixo",
    "O limite deve vir de user_settings.small_expense_limit.",
    [...new Set(smallHits.map(h => h.file))],
    "Usar monthlyFinance.smallExpenseLimit.");
}

const toggleHits = grep(src, /togglePaid\(/);
if (toggleHits.length) {
  add("P0", "Financeiro", "Conta recorrente paga pode não entrar nos gastos",
    "Se a bolinha chama togglePaid, normalmente só muda status e não cria expense.",
    [...new Set(toggleHits.map(h => h.file))],
    "Usar setPaidStatus({ createExpense: true }) ou RPC transacional.");
}

if (!exists("src/lib/monthlyFinance.ts")) {
  add("P0", "Financeiro", "Motor financeiro central em falta",
    "Sem fonte única, Inicial, Resumo e Planeamento divergem.",
    ["src/lib/monthlyFinance.ts"],
    "Criar getMonthlyFinance(userId, year, month) e usar nas telas.");
}

if (!/income_entries/.test(schema)) {
  add("P0", "Financeiro", "Tabela income_entries em falta",
    "Sem receitas persistentes não há saldo real.",
    sql,
    "Criar income_entries com RLS, índice user/date e incluir no backup.");
}

if (!exists("src/components/AddIncomeSheet.tsx")) {
  add("P0", "Financeiro", "AddIncomeSheet em falta",
    "O botão + precisa permitir receita, não só despesa.",
    ["src/components/AddIncomeSheet.tsx"],
    "Criar sheet Nova Receita e integrar com saldo.");
}

if (/fixed bottom-0/.test(appShell)) {
  add("P1", "Layout iPhone", "BottomNav fixed pode soltar da base",
    "Fixed bottom-0 sofre com viewport dinâmica/safe-area do Safari.",
    ["src/components/AppShell.tsx"],
    "Criar AppViewport h-[100dvh], main scroll interno e nav presa ao shell.");
}

if (/padding-top:\s*env\(safe-area-inset-top\)/.test(globals)) {
  add("P2", "Layout iPhone", "Safe-area aplicada no body",
    "Pode interferir com fixed nav/sheets.",
    ["src/app/globals.css"],
    "Mover safe-area para header/nav específicos.");
}

if (!/100dvh|min-h-\[100dvh\]|h-\[100dvh\]|min-h-dvh/.test(globals + appShell)) {
  add("P1", "Layout iPhone", "Shell sem 100dvh claro",
    "min-h-screen pode calcular mal com barra do navegador.",
    ["src/components/AppShell.tsx", "src/app/globals.css"],
    "Usar h-[100dvh] ou min-h-[100dvh] no app shell.");
}

if (!/overscroll/.test(globals)) {
  add("P2", "Layout iPhone", "Sem overscroll-behavior",
    "Bounce do iPhone pode mexer página por trás e descolar UI.",
    ["src/app/globals.css"],
    "Adicionar overscroll-behavior: none no html/body e contain no main.");
}

const large = publicImages.map(f => ({ f, kb: Math.round(size(f) / 1024) })).filter(x => x.kb > 300).sort((a, b) => b.kb - a.kb);
if (large.length) {
  add("P1", "Performance", "Imagens grandes em public",
    `${large.length} imagens acima de 300KB podem atrasar carregamento.`,
    large.slice(0, 15).map(x => `${x.f} (${x.kb}KB)`),
    "Converter headers para WebP/AVIF e ícones pequenos para SVG.");
}

if (!/recurring_occurrences.*user_id.*year.*month|recurring_occurrences_user.*year.*month/s.test(schema)) {
  add("P1", "Banco", "Índice user/year/month para recorrentes pode faltar",
    "Planning consulta ocorrências por user_id, year e month.",
    sql,
    "Adicionar índice recurring_occurrences_user_year_month_idx.");
}

if (!/unique.*occurrence_id|occurrence_id.*unique|expenses_recurring_unique/s.test(schema)) {
  add("P1", "Integridade", "Falta unique/idempotência para expense recorrente",
    "Clique duplo pode duplicar gasto de conta fixa.",
    sql,
    "Adicionar unique parcial em expenses(user_id, occurrence_id) where occurrence_id is not null.");
}

if (!exists("src/components/AlertsSheet.tsx") && !exists("src/lib/alerts.ts")) {
  add("P2", "Utilidade", "Central de alertas em falta",
    "Alertas internos ajudam mesmo sem push no iPhone.",
    ["src/components/AlertsSheet.tsx", "src/lib/alerts.ts"],
    "Criar getFinancialAlerts + AlertsSheet.");
}

findings.sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9));
const counts = findings.reduce((a, f) => { a[f.severity] = (a[f.severity] || 0) + 1; return a; }, {});

report.push("\n## Resumo\n");
report.push(`Total: **${findings.length}** findings\n`);
report.push(`- P0: ${counts.P0 || 0}\n- P1: ${counts.P1 || 0}\n- P2: ${counts.P2 || 0}\n- P3: ${counts.P3 || 0}\n`);

for (const f of findings) {
  report.push(`\n### [${f.severity}] ${f.area} — ${f.title}\n`);
  report.push(`${f.detail}\n`);
  if (f.files?.length) {
    report.push("\nArquivos/indícios:\n");
    for (const file of f.files.slice(0, 20)) report.push(`- \`${file}\`\n`);
  }
  if (f.suggestion) report.push(`\nComo corrigir:\n${f.suggestion}\n`);
}

report.push(`\n## Ordem recomendada\n
1. P0 financeiro: monthlyFinance, income_entries, AddIncomeSheet, recorrentes pagos criarem expenses.
2. P1 performance: remover remount global por key, reduzir Supabase espalhado, cachear por mês/user.
3. P1 layout iPhone: shell 100dvh, main scroll interno, bottom nav presa à base.
4. P1 integridade: unique indexes/idempotency para recorrentes e saved items.
5. P1 assets: comprimir PNGs grandes e usar SVG/WebP.
6. P2 UX: trocar prompt por sheet e emojis por ícones oficiais.
7. QA: adicionar Vitest/Playwright e GitHub Actions.
`);

const output = report.join("");
fs.writeFileSync(path.join(root, "audit-report.md"), output, "utf8");
console.log(output);
console.log("\nAudit report written to audit-report.md");
