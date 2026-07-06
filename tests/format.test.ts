import { describe, it, expect } from "vitest";
import { eur, monthBounds, prettyDate, todayISO } from "@/lib/format";

describe("format", () => {
  it("eur formats amounts as euro currency (pt-PT)", () => {
    expect(eur(78.45)).toContain("78,45");
    expect(eur(78.45)).toContain("€");
  });

  it("eur treats falsy/NaN as zero", () => {
    expect(eur(0)).toContain("0,00");
    expect(eur(Number.NaN)).toContain("0,00");
  });

  it("monthBounds returns the first and last day of the month", () => {
    expect(monthBounds("2026-02-15")).toEqual({ start: "2026-02-01", end: "2026-02-28" });
    expect(monthBounds("2024-02-10")).toEqual({ start: "2024-02-01", end: "2024-02-29" }); // ano bissexto
    expect(monthBounds("2026-01-05")).toEqual({ start: "2026-01-01", end: "2026-01-31" });
  });

  it("prettyDate converts ISO yyyy-MM-dd to dd/MM/yyyy", () => {
    expect(prettyDate("2026-07-03")).toBe("03/07/2026");
  });

  it("todayISO returns a yyyy-MM-dd string", () => {
    expect(todayISO(new Date(2026, 6, 3))).toBe("2026-07-03");
  });
});
