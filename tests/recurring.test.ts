import { describe, it, expect } from "vitest";
import { installmentLabel, type RecurringPayment } from "@/lib/recurring";

function payment(overrides: Partial<RecurringPayment> = {}): RecurringPayment {
  return {
    id: "p1", name: "Empréstimo", amount: 100, due_day: 5,
    category_id: null, repeat_type: "MONTHLY", is_active: true,
    start_date: "2026-01-05", end_date: "2026-08-05",
    ...overrides,
  };
}

describe("installmentLabel", () => {
  it("returns null when there is no end_date (recorrência indefinida)", () => {
    expect(installmentLabel(payment({ end_date: null }), 2026, 3)).toBeNull();
  });

  it("computes the current installment out of the total", () => {
    // start 2026-01, end 2026-08 => 8 parcelas ao todo
    expect(installmentLabel(payment(), 2026, 1)).toBe("1/8");
    expect(installmentLabel(payment(), 2026, 3)).toBe("3/8");
    expect(installmentLabel(payment(), 2026, 8)).toBe("8/8");
  });

  it("returns null outside the [start, end] range", () => {
    expect(installmentLabel(payment(), 2025, 12)).toBeNull();
    expect(installmentLabel(payment(), 2026, 9)).toBeNull();
  });

  it("handles a single-installment plan", () => {
    expect(installmentLabel(payment({ start_date: "2026-05-01", end_date: "2026-05-01" }), 2026, 5)).toBe("1/1");
  });
});
