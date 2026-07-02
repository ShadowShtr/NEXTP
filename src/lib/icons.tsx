/* NextP — ligação aos SVG masters do NextP Clay System (assets/icons/svg → public/icons). */
import React from "react";

const DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");

/** Remove acentos para o matching de nome não falhar com "Família", "Saúde", etc. */
function stripAccents(s: string): string {
  return s.normalize("NFD").replace(DIACRITICS_RE, "");
}

/** nome da categoria → ficheiro SVG em /public/icons/categories */
export function categorySvg(name: string): string {
  const n = stripAccents((name || "").toLowerCase());
  let key = "other";
  if (n.includes("comida")) key = "food";
  else if (n.includes("besteira")) key = "fun";
  else if (n.includes("mercado")) key = "market";
  else if (n.includes("conta")) key = "fixed-bill";
  else if (n.includes("transp")) key = "transport";
  else if (n.includes("casa")) key = "home";
  else if (n.includes("trabalho")) key = "work";
  else if (n.includes("famil")) key = "family";
  else if (n.includes("saude")) key = "health";
  else if (n.includes("document")) key = "documents";
  return `/icons/categories/category-${key}.svg`;
}

/** Ícone de categoria (telha clay premium). */
export function CategoryIcon({ name, size = 48 }: { name: string; size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={categorySvg(name)} width={size} height={size} alt={name}
      className="drop-shadow-[0_6px_10px_rgba(0,109,255,0.18)]" draggable={false} />
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
