export type BranchId = "b1" | "b2";

export const BRANCHES: { id: BranchId; name: string; area: string }[] = [
  { id: "b1", name: "Branch 1", area: "Gulberg" },
  { id: "b2", name: "Branch 2", area: "DHA" },
];

export type CatalogItem = {
  name: string;
  unit: string;
  cost: number; // typical purchase cost per unit
  sell: number; // typical selling value per unit
  daily: number; // typical daily intake at branch 1
  burn: number; // share of intake that gets sold daily
};

export const CATALOG: CatalogItem[] = [
  { name: "Chicken", unit: "kg", cost: 520, sell: 760, daily: 40, burn: 0.88 },
  { name: "Beef", unit: "kg", cost: 1450, sell: 1900, daily: 25, burn: 0.85 },
  { name: "Basmati Rice", unit: "kg", cost: 340, sell: 450, daily: 30, burn: 0.86 },
  { name: "Cooking Oil", unit: "L", cost: 520, sell: 640, daily: 15, burn: 0.9 },
  { name: "Tomatoes", unit: "kg", cost: 120, sell: 190, daily: 20, burn: 0.87 },
  { name: "Onions", unit: "kg", cost: 90, sell: 140, daily: 18, burn: 0.88 },
  { name: "Cheese", unit: "kg", cost: 1250, sell: 1700, daily: 10, burn: 1.15 },
  { name: "Flour", unit: "kg", cost: 110, sell: 160, daily: 25, burn: 0.84 },
  { name: "Cold Drinks", unit: "btl", cost: 70, sell: 120, daily: 120, burn: 0.9 },
  { name: "French Fries", unit: "kg", cost: 260, sell: 420, daily: 30, burn: 1.12 },
];

export type Intake = {
  id: string;
  branch: BranchId;
  date: string;
  item: string;
  qty: number;
  unitCost: number;
};

export type Sale = {
  id: string;
  branch: BranchId;
  date: string;
  item: string;
  qty: number;
  price: number;
};

export type DB = { intake: Intake[]; sales: Sale[] };

export function iso(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function shiftDate(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return iso(new Date(y, m - 1, d + n));
}

export function unitOf(item: string): string {
  return CATALOG.find((c) => c.name.toLowerCase() === item.toLowerCase())?.unit ?? "unit";
}

export function reorderLevel(item: string, branch: BranchId): number {
  const c = CATALOG.find((x) => x.name.toLowerCase() === item.toLowerCase());
  if (!c) return 5;
  return Math.round(c.daily * (branch === "b1" ? 1 : 0.8) * 0.6);
}

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Builds 8 days of realistic sample data ending today, for both branches.
export function buildSeed(today: string): DB {
  const intake: Intake[] = [];
  const sales: Sale[] = [];
  let n = 0;

  BRANCHES.forEach((b, bi) => {
    const rnd = rng(7 + bi * 101);
    const scale = bi === 0 ? 1 : 0.8;
    const stock: Record<string, number> = {};

    for (let off = 7; off >= 0; off--) {
      const date = shiftDate(today, -off);
      CATALOG.forEach((it) => {
        const base = it.daily * scale;
        const qty =
          off === 7 ? Math.round(base * 1.4) : Math.round(base * (0.85 + rnd() * 0.3));
        const cost = Math.round(it.cost * (0.97 + rnd() * 0.06));
        intake.push({ id: `s-${n++}`, branch: b.id, date, item: it.name, qty, unitCost: cost });
        stock[it.name] = (stock[it.name] ?? 0) + qty;

        if (off === 7) return; // opening stock day, no sales yet

        const want = Math.round(base * it.burn * (0.9 + rnd() * 0.2));
        const sold = Math.min(want, Math.floor(stock[it.name]));
        // Branch 2 ran a heavy discount day 3 days ago -> shows a loss on the trend chart
        const discount = bi === 1 && off === 3 ? 0.66 : 1;
        const price = Math.round(it.sell * (0.97 + rnd() * 0.06) * discount);
        if (sold > 0) {
          sales.push({ id: `s-${n++}`, branch: b.id, date, item: it.name, qty: sold, price });
          stock[it.name] -= sold;
        }
      });
    }
  });

  return { intake, sales };
}
