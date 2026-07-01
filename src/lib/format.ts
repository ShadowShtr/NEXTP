/** Helpers de data (ISO local, sem fuso) e moeda. */

export function todayISO(d = new Date()): string {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export function nowHM(d = new Date()): string {
  return d.toTimeString().slice(0, 5);
}

export function monthBounds(iso: string): { start: string; end: string } {
  const [y, m] = iso.split("-").map(Number);
  const start = `${y}-${String(m).padStart(2, "0")}-01`;
  const last = new Date(y, m, 0).getDate();
  const end = `${y}-${String(m).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
  return { start, end };
}

export function eur(n: number, currency = "EUR"): string {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency }).format(n || 0);
}

export function prettyDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
