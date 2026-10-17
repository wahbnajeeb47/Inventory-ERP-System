export const money = (n: number): string =>
  (Math.round(n) < 0 ? "-" : "") + "Rs " + Math.abs(Math.round(n)).toLocaleString("en-US");

export const pctText = (n: number): string => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;

export const qtyText = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(1));

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function dayLabel(d: string): string {
  const [, m, dd] = d.split("-").map(Number);
  return `${dd} ${MONTHS[m - 1]}`;
}

export function longDate(d: string): string {
  const [y, m, dd] = d.split("-").map(Number);
  return `${dd} ${MONTHS[m - 1]} ${y}`;
}
