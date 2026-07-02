/* NextP — ligação aos assets visuais do NextP Clay System. */
import React from "react";

const DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");

/** Remove acentos para o matching de nome não falhar com "Família", "Saúde", etc. */
function stripAccents(s: string): string {
  return s.normalize("NFD").replace(DIACRITICS_RE, "");
}

type CatKey = "food" | "fun" | "market" | "fixed-bill" | "transport" | "home" | "work" | "family" | "health" | "documents" | "other";

function categoryKey(name: string): CatKey {
  const n = stripAccents((name || "").toLowerCase());
  if (n.includes("comida")) return "food";
  if (n.includes("besteira")) return "fun";
  if (n.includes("mercado")) return "market";
  if (n.includes("conta")) return "fixed-bill";
  if (n.includes("transp")) return "transport";
  if (n.includes("casa")) return "home";
  if (n.includes("trabalho")) return "work";
  if (n.includes("famil")) return "family";
  if (n.includes("saude")) return "health";
  if (n.includes("document")) return "documents";
  return "other";
}

/** Ícones 3D premium (pack oficial) — só existem para estas categorias; as restantes usam o SVG clay. */
const PNG_ICONS: Partial<Record<CatKey, string>> = {
  food: "/icons/categories-png/category-food-burger.png",
  fun: "/icons/categories-png/category-fun-game-controller.png",
  home: "/icons/categories-png/category-home-house.png",
  transport: "/icons/categories-png/category-transport-bus.png",
};

/** nome da categoria → ficheiro SVG em /public/icons/categories (fallback quando não há PNG 3D). */
export function categorySvg(name: string): string {
  return `/icons/categories/category-${categoryKey(name)}.svg`;
}

/** Ícone de categoria: usa o PNG 3D oficial quando existe, senão a telha SVG clay. */
export function CategoryIcon({ name, size = 48 }: { name: string; size?: number }) {
  const key = categoryKey(name);
  const png = PNG_ICONS[key];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={png ?? categorySvg(name)}
      width={size}
      height={size}
      alt={name}
      className={png ? "" : "drop-shadow-[0_6px_10px_rgba(0,109,255,0.18)]"}
      draggable={false}
    />
  );
}

export type FeatureKey =
  | "bell" | "calendar-check" | "chart" | "cloud-backup" | "invisible-expenses"
  | "piggy-bank" | "shield" | "trophy" | "wallet";

/** Ícone/ilustração de funcionalidade. */
export function FeatureIcon({ name, size = 48 }: { name: FeatureKey; size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/icons/features/feature-${name}.svg`} width={size} height={size} alt={name} draggable={false} />
  );
}

export type DotState = "pending" | "paid" | "partial" | "overdue" | "ignored";

/** Bolinha de checklist dos pagamentos recorrentes (SVG master). */
export function PaymentDot({ state, size = 34 }: { state: DotState; size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/icons/payments/payment-dot-${state}.svg`} width={size} height={size} alt={state} draggable={false} />
  );
}
