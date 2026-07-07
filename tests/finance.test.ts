import { describe, expect, it } from "vitest";
import { computeMonthlyFinance } from "@/lib/finance";

describe("computeMonthlyFinance", () => {
  it("soma receitas e gastos diretos quando não há recorrentes", () => {
    const f = computeMonthlyFinance({
      year: 2026, month: 7, today: "2026-07-15",
      incomeRows: [{ amount: 1200 }],
      expenseRows: [{ amount: 400, source: "MANUAL" }],
      occurrenceRows: [],
      reservedAmount: 0,
    });
    expect(f.incomeTotal).toBe(1200);
    expect(f.expenseTotal).toBe(400);
    expect(f.currentBalance).toBe(800);
    expect(f.projectedBalance).toBe(800);
    expect(f.freeMoney).toBe(800);
  });

  it("conta recorrente paga sem gasto ligado entra no expenseTotal (não fica invisível)", () => {
    const f = computeMonthlyFinance({
      year: 2026, month: 7, today: "2026-07-15",
      incomeRows: [{ amount: 1200 }],
      expenseRows: [],
      occurrenceRows: [{ status: "PAID", expected_amount: 100, paid_amount: 100 }],
      reservedAmount: 0,
    });
    expect(f.expenseTotal).toBe(100);
    expect(f.recurringPending).toBe(0);
  });

  it("não conta a dobrar quando a conta recorrente paga TEM gasto ligado (source RECURRING)", () => {
    const f = computeMonthlyFinance({
      year: 2026, month: 7, today: "2026-07-15",
      incomeRows: [],
      expenseRows: [{ amount: 100, source: "RECURRING" }],
      occurrenceRows: [{ status: "PAID", expected_amount: 100, paid_amount: 100 }],
      reservedAmount: 0,
    });
    expect(f.expenseTotal).toBe(100);
  });

  it("contas pendentes reduzem o saldo previsto mas não o saldo atual", () => {
    const f = computeMonthlyFinance({
      year: 2026, month: 7, today: "2026-07-15",
      incomeRows: [{ amount: 1000 }],
      expenseRows: [{ amount: 200, source: "MANUAL" }],
      occurrenceRows: [{ status: "PENDING", expected_amount: 300, paid_amount: 0 }],
      reservedAmount: 0,
    });
    expect(f.currentBalance).toBe(800);
    expect(f.projectedBalance).toBe(500);
    expect(f.recurringPending).toBe(300);
  });

  it("pagamento parcial soma a parte paga ao gasto e o resto ao pendente", () => {
    const f = computeMonthlyFinance({
      year: 2026, month: 7, today: "2026-07-15",
      incomeRows: [],
      expenseRows: [],
      occurrenceRows: [{ status: "PARTIAL", expected_amount: 100, paid_amount: 40 }],
      reservedAmount: 0,
    });
    expect(f.expenseTotal).toBe(40);
    expect(f.recurringPending).toBe(60);
  });

  it("dinheiro livre desconta a reserva do saldo previsto", () => {
    const f = computeMonthlyFinance({
      year: 2026, month: 7, today: "2026-07-15",
      incomeRows: [{ amount: 1000 }],
      expenseRows: [{ amount: 300, source: "MANUAL" }],
      occurrenceRows: [],
      reservedAmount: 200,
    });
    expect(f.projectedBalance).toBe(700);
    expect(f.freeMoney).toBe(500);
  });

  it("gasto por dia disponível considera os dias restantes do mês (incluindo hoje)", () => {
    // Julho/2026 tem 31 dias; hoje é dia 21 → faltam 11 dias (21..31 inclusive).
    const f = computeMonthlyFinance({
      year: 2026, month: 7, today: "2026-07-21",
      incomeRows: [{ amount: 1100 }],
      expenseRows: [{ amount: 100, source: "MANUAL" }],
      occurrenceRows: [],
      reservedAmount: 0,
    });
    expect(f.daysInMonth).toBe(31);
    expect(f.daysElapsed).toBe(21);
    expect(f.daysRemaining).toBe(11);
    expect(f.dailyAvailable).toBeCloseTo(1000 / 11, 5);
  });

  it("previsão de fim de mês usa a média diária projetada para o mês inteiro", () => {
    const f = computeMonthlyFinance({
      year: 2026, month: 6, today: "2026-06-10",
      incomeRows: [{ amount: 500 }],
      expenseRows: [{ amount: 180, source: "MANUAL" }],
      occurrenceRows: [],
      reservedAmount: 0,
    });
    // média diária = 18€/dia × 30 dias de Junho = 540€ previsto
    expect(f.daysInMonth).toBe(30);
    expect(f.averageDailyExpense).toBeCloseTo(18, 5);
    expect(f.projectedExpenseByAverage).toBeCloseTo(540, 5);
    expect(f.projectedEndBalance).toBeCloseTo(500 - 540, 5);
  });
});
