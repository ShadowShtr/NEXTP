/* NextP — sistema de ícones claymorphism em SVG (telhas com gradiente + brilho). */
import React from "react";

type IconKey =
  | "comida" | "besteira" | "mercado" | "conta" | "transporte" | "casa"
  | "trabalho" | "familia" | "saude" | "documentos" | "outros"
  | "wifi" | "bulb" | "drop" | "card" | "dumbbell" | "film" | "coins";

const PAL: Record<string, [string, string, string]> = {
  // [grad de, grad até, glifo]
  comida: ["#FFB65C", "#F79009", "#7A3E00"],
  besteira: ["#FF9DB4", "#FF7A9A", "#7A0E27"],
  mercado: ["#4FDC93", "#12B76A", "#053D24"],
  conta: ["#5AA3FF", "#006DFF", "#062E66"],
  transporte: ["#8CE0FF", "#38C0F0", "#064055"],
  casa: ["#B79BEC", "#9B7EDE", "#33195E"],
  trabalho: ["#5C6B84", "#344054", "#0B1220"],
  familia: ["#FEC84B", "#FDB022", "#5C3D00"],
  saude: ["#FF8A80", "#F04438", "#5E0B05"],
  documentos: ["#98A2B3", "#667085", "#1D2530"],
  outros: ["#B5C0CE", "#98A2B3", "#2A3340"],
  wifi: ["#5AA3FF", "#006DFF", "#FFFFFF"],
  bulb: ["#FEC84B", "#FDB022", "#5C3D00"],
  drop: ["#8CE0FF", "#38C0F0", "#FFFFFF"],
  card: ["#5C6B84", "#344054", "#FFFFFF"],
  dumbbell: ["#B79BEC", "#9B7EDE", "#FFFFFF"],
  film: ["#FF6B6B", "#E23B3B", "#FFFFFF"],
  coins: ["#FEC84B", "#FDB022", "#7A5200"],
};

/** Devolve a chave de ícone a partir do nome da categoria. */
export function iconKeyForCategory(name: string): IconKey {
  const n = name.toLowerCase();
  if (n.includes("comida")) return "comida";
  if (n.includes("besteira")) return "besteira";
  if (n.includes("mercado")) return "mercado";
  if (n.includes("conta")) return "conta";
  if (n.includes("transp")) return "transporte";
  if (n.includes("casa")) return "casa";
  if (n.includes("trabalho")) return "trabalho";
  if (n.includes("famil")) return "familia";
  if (n.includes("saúde") || n.includes("saude")) return "saude";
  if (n.includes("document")) return "documentos";
  if (n.includes("intern") || n.includes("wifi")) return "wifi";
  if (n.includes("luz") || n.includes("eletr")) return "bulb";
  if (n.includes("água") || n.includes("agua")) return "drop";
  if (n.includes("cart")) return "card";
  if (n.includes("academ") || n.includes("gin")) return "dumbbell";
  if (n.includes("netflix") || n.includes("stream")) return "film";
  return "outros";
}

function Glyph({ k, c }: { k: IconKey; c: string }) {
  const s = { fill: "none", stroke: c, strokeWidth: 2.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const f = { fill: c };
  switch (k) {
    case "comida": // hambúrguer
      return (<g><path d="M6 10c0-3 2.7-5 6-5s6 2 6 5" {...s} /><rect x="5.4" y="12.5" width="13.2" height="0.2" {...s} /><path d="M6 15.5h12c0 2-2 3-6 3s-6-1-6-3z" {...s} /></g>);
    case "besteira": // comando
      return (<g><rect x="4.5" y="8.5" width="15" height="8" rx="4" {...s} /><path d="M8 11v3M6.5 12.5h3" {...s} /><circle cx="15.5" cy="12" r="0.9" {...f} /><circle cx="17" cy="13.6" r="0.9" {...f} /></g>);
    case "mercado": // carrinho
      return (<g><path d="M4 5h2l2 9h9l2-6H7" {...s} /><circle cx="9" cy="18" r="1.2" {...f} /><circle cx="16" cy="18" r="1.2" {...f} /></g>);
    case "conta": // recibo
      return (<g><path d="M7 4h10v16l-2-1.3-2 1.3-2-1.3-2 1.3V4z" {...s} /><path d="M10 8h4M10 11h4" {...s} /></g>);
    case "transporte": // autocarro
      return (<g><rect x="5" y="5" width="14" height="11" rx="3" {...s} /><path d="M5 11h14" {...s} /><circle cx="8.5" cy="18" r="1.1" {...f} /><circle cx="15.5" cy="18" r="1.1" {...f} /></g>);
    case "casa": // casa
      return (<g><path d="M5 11l7-6 7 6" {...s} /><path d="M7 10v8h10v-8" {...s} /></g>);
    case "trabalho": // mala
      return (<g><rect x="4.5" y="8" width="15" height="10" rx="2.5" {...s} /><path d="M9 8V6.5C9 5.7 9.7 5 10.5 5h3C14.3 5 15 5.7 15 6.5V8" {...s} /></g>);
    case "familia": // corações
      return (<g><path d="M9 6.5c1.2-1.4 3.5-.8 3.5 1 0 1.6-3.5 4-3.5 4S5.5 9.1 5.5 7.5c0-1.8 2.3-2.4 3.5-1z" {...f} /><path d="M16 12c.9-1 2.6-.6 2.6.8 0 1.2-2.6 3-2.6 3s-2.6-1.8-2.6-3c0-1.4 1.7-1.8 2.6-.8z" {...f} /></g>);
    case "saude": // coração +
      return (<g><path d="M12 19s-6-4-6-8.5C6 8 7.8 6.5 9.6 6.5c1.2 0 2 .7 2.4 1.3.4-.6 1.2-1.3 2.4-1.3C16.2 6.5 18 8 18 10.5 18 15 12 19 12 19z" {...s} /></g>);
    case "documentos": // ficheiro
      return (<g><path d="M8 4h5l3 3v13H8z" {...s} /><path d="M13 4v3h3M10 12h4M10 15h4" {...s} /></g>);
    case "wifi": // wifi
      return (<g><path d="M4.5 9.5c4-3.5 11-3.5 15 0" {...s} /><path d="M7 12.5c2.7-2.3 7.3-2.3 10 0" {...s} /><path d="M9.5 15.3c1.5-1.2 3.5-1.2 5 0" {...s} /><circle cx="12" cy="18" r="1.1" {...f} /></g>);
    case "bulb": // lâmpada
      return (<g><path d="M9 15a5 5 0 1 1 6 0c-.6.5-1 1.2-1 2H10c0-.8-.4-1.5-1-2z" {...s} /><path d="M10 19h4M10.5 21h3" {...s} /></g>);
    case "drop": // gota
      return (<g><path d="M12 4s5 5.5 5 9a5 5 0 0 1-10 0c0-3.5 5-9 5-9z" {...s} /></g>);
    case "card": // cartão
      return (<g><rect x="4" y="7" width="16" height="11" rx="2.5" {...s} /><path d="M4 11h16" {...s} /><path d="M7 15h4" {...s} /></g>);
    case "dumbbell": // haltere
      return (<g><path d="M4 12h16M6 9v6M18 9v6M9 10.5v3M15 10.5v3" {...s} /></g>);
    case "film": // N (streaming)
      return (<g><path d="M9 18V6M15 6v12M9 6l6 12" style={{ ...s, strokeWidth: 3 }} /></g>);
    case "coins": // moedas
      return (<g><ellipse cx="12" cy="8.5" rx="6" ry="2.5" {...s} /><path d="M6 8.5v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-4" {...s} /></g>);
    default: // outros
      return (<g><circle cx="7" cy="12" r="1.4" {...f} /><circle cx="12" cy="12" r="1.4" {...f} /><circle cx="17" cy="12" r="1.4" {...f} /></g>);
  }
}

/** Telha clay com o ícone da categoria. */
export function CategoryIcon({ name, size = 48 }: { name: string; size?: number }) {
  const k = iconKeyForCategory(name);
  const [g0, g1, glyph] = PAL[k] ?? PAL.outros;
  const gid = `g_${k}`;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label={name}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={g0} />
          <stop offset="1" stopColor={g1} />
        </linearGradient>
        <linearGradient id={`${gid}_hi`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="15" fill={`url(#${gid})`} />
      <rect x="2" y="2" width="44" height="22" rx="15" fill={`url(#${gid}_hi)`} />
      <g transform="translate(12 12) scale(1)">
        <Glyph k={k} c={glyph} />
      </g>
    </svg>
  );
}
