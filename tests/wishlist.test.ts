import { describe, it, expect } from "vitest";
import { isValidUrl, isAmazonUrl } from "@/lib/wishlist";

describe("wishlist URL validation", () => {
  it("accepts an empty string (campo opcional)", () => {
    expect(isValidUrl("")).toBe(true);
    expect(isValidUrl("   ")).toBe(true);
  });

  it("accepts http(s) URLs", () => {
    expect(isValidUrl("https://amazon.pt/produto")).toBe(true);
    expect(isValidUrl("http://example.com")).toBe(true);
  });

  it("rejects non-http(s) or malformed URLs", () => {
    expect(isValidUrl("javascript:alert(1)")).toBe(false);
    expect(isValidUrl("not a url")).toBe(false);
    expect(isValidUrl("ftp://files.example.com/x")).toBe(false);
  });

  it("detects Amazon domains", () => {
    expect(isAmazonUrl("https://www.amazon.pt/dp/B0")).toBe(true);
    expect(isAmazonUrl("https://amazon.com/x")).toBe(true);
    expect(isAmazonUrl("https://outraLoja.pt/produto")).toBe(false);
  });

  it("isAmazonUrl never throws on garbage input", () => {
    expect(isAmazonUrl("not a url")).toBe(false);
  });
});
