import { BranchId, CATALOG, DB, reorderLevel, shiftDate, unitOf } from "./data";
import { dayLabel } from "./format";

export type Row = {
  item: string;
  unit: string;
  opening: number;
  received: number;
  sold: number;
  closing: number;
  avgCost: number;
  receivedValue: number;
  revenue: number;
  cogs: number;
  profit: number;
  stockValue: number;
  low: boolean;
};

export function itemNames(db: DB, branch: BranchId): string[] {
  const names = CATALOG.map((c) => c.name);
  const lower = new Set(names.map((n) => n.toLowerCase()));
  db.intake.forEach((i) => {
    if (i.branch === branch && !lower.has(i.item.toLowerCase())) {
      lower.add(i.item.toLowerCase());
      names.push(i.item);
    }
  });
  return names;
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export function dayRows(db: DB, branch: BranchId, date: string): Row[] {
  return itemNames(db, branch).map((item) => {
    const key = item.toLowerCase();
    const inTill = db.intake.filter(
      (i) => i.branch === branch && i.item.toLowerCase() === key && i.date <= date
    );
    const soldTill = db.sales.filter(
      (s) => s.branch === branch && s.item.toLowerCase() === key && s.date <= date
    );
    const totalQty = sum(inTill.map((i) => i.qty));
    const totalCost = sum(inTill.map((i) => i.qty * i.unitCost));
    const fallback = CATALOG.find((c) => c.name.toLowerCase() === key)?.cost ?? 0;
    const avgCost = totalQty > 0 ? totalCost / totalQty : fallback;

    const received = sum(inTill.filter((i) => i.date === date).map((i) => i.qty));
    const receivedValue = sum(inTill.filter((i) => i.date === date).map((i) => i.qty * i.unitCost));
    const todays = soldTill.filter((s) => s.date === date);
    const sold = sum(todays.map((s) => s.qty));
    const revenue = sum(todays.map((s) => s.qty * s.price));
    const closing = totalQty - sum(soldTill.map((s) => s.qty));
    const cogs = sold * avgCost;

    return {
      item,
      unit: unitOf(item),
      opening: closing - received + sold,
      received,
      sold,
      closing,
      avgCost,
      receivedValue,
      revenue,
      cogs,
      profit: revenue - cogs,
      stockValue: closing * avgCost,
      low: closing <= reorderLevel(item, branch),
    };
  });
}

export type Totals = {
  receivedValue: number;
  receivedLines: number;
  revenue: number;
  cogs: number;
  profit: number;
  pct: number;
  stockValue: number;
  soldUnits: number;
};

export function totals(rows: Row[]): Totals {
  const revenue = sum(rows.map((r) => r.revenue));
  const cogs = sum(rows.map((r) => r.cogs));
  const profit = revenue - cogs;
  return {
    receivedValue: sum(rows.map((r) => r.receivedValue)),
    receivedLines: rows.filter((r) => r.received > 0).length,
    revenue,
    cogs,
    profit,
    pct: cogs > 0 ? (profit / cogs) * 100 : 0,
    stockValue: sum(rows.map((r) => r.stockValue)),
    soldUnits: sum(rows.map((r) => r.sold)),
  };
}

export type TrendPoint = {
  date: string;
  label: string;
  revenue: number;
  cogs: number;
  profit: number;
  pct: number;
};

export function trendFor(db: DB, branch: BranchId, endDate: string, days = 7): TrendPoint[] {
  const out: TrendPoint[] = [];
  for (let k = days - 1; k >= 0; k--) {
    const date = shiftDate(endDate, -k);
    const t = totals(dayRows(db, branch, date));
    out.push({
      date,
      label: dayLabel(date),
      revenue: t.revenue,
      cogs: t.cogs,
      profit: t.profit,
      pct: t.pct,
    });
  }
  return out;
}
