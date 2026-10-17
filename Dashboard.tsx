"use client";

import { useMemo } from "react";
import { BRANCHES, BranchId, DB } from "../lib/data";
import { dayRows, totals, trendFor } from "../lib/calc";
import { money, pctText, qtyText } from "../lib/format";
import { Badge, Card, Icon } from "./ui";
import { CostSalesChart, TrendChart } from "./Charts";

function Stat({
  label,
  value,
  sub,
  tone = "stone",
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "stone" | "green" | "red";
}) {
  const color =
    tone === "green" ? "text-emerald-600" : tone === "red" ? "text-rose-600" : "text-stone-900";
  return (
    <Card className="p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</p>
      <p className={`mt-1 text-xl font-bold sm:text-2xl ${color}`}>{value}</p>
      <p className="mt-0.5 text-xs text-stone-500">{sub}</p>
    </Card>
  );
}

export default function Dashboard({
  db,
  branch,
  date,
}: {
  db: DB;
  branch: BranchId;
  date: string;
}) {
  const rows = useMemo(() => dayRows(db, branch, date), [db, branch, date]);
  const t = useMemo(() => totals(rows), [rows]);
  const trend = useMemo(() => trendFor(db, branch, date, 7), [db, branch, date]);
  const compare = useMemo(
    () => BRANCHES.map((b) => ({ b, t: totals(dayRows(db, b.id, date)) })),
    [db, date]
  );
  const top = useMemo(
    () => [...rows].filter((r) => r.revenue > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    [rows]
  );
  const low = rows.filter((r) => r.low);
  const hasSales = t.revenue > 0;
  const tone = t.profit >= 0 ? "green" : "red";
  const topMax = Math.max(1, ...top.map((r) => r.revenue));

  return (
    <div className="space-y-4">
      <div
        className={`flex items-center justify-between rounded-2xl px-4 py-3 ${
          !hasSales
            ? "bg-stone-100 text-stone-600"
            : t.profit >= 0
            ? "bg-emerald-50 text-emerald-800"
            : "bg-rose-50 text-rose-800"
        }`}
      >
        <p className="text-sm font-semibold">
          {!hasSales
            ? "No sales recorded for this day yet"
            : t.profit >= 0
            ? "Today you are in profit"
            : "Today you are running at a loss"}
        </p>
        {hasSales && <span className="text-lg font-bold">{pctText(t.pct)}</span>}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Inventory received"
          value={money(t.receivedValue)}
          sub={`${t.receivedLines} items from warehouse`}
        />
        <Stat label="Total sales" value={money(t.revenue)} sub={`${qtyText(t.soldUnits)} units sold`} />
        <Stat
          label={t.profit >= 0 ? "Profit" : "Loss"}
          value={money(t.profit)}
          sub={`Cost of goods ${money(t.cogs)}`}
          tone={hasSales ? tone : "stone"}
        />
        <Stat
          label="Profit / loss %"
          value={pctText(t.pct)}
          sub={`Stock in hand ${money(t.stockValue)}`}
          tone={hasSales ? tone : "stone"}
        />
      </div>

      <Card className="p-4">
        <h2 className="text-sm font-bold text-stone-800">Profit / loss % — last 7 days</h2>
        <p className="mb-2 text-xs text-stone-500">Above the dashed line is profit, below is loss.</p>
        <TrendChart
          data={trend.map((p) => ({ label: p.label, value: Math.round(p.pct * 10) / 10 }))}
          fmt={(n) => `${n.toFixed(0)}%`}
        />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-2 text-sm font-bold text-stone-800">Cost vs sales — last 7 days</h2>
          <CostSalesChart data={trend.map((p) => ({ label: p.label, cost: p.cogs, sales: p.revenue }))} />
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 text-sm font-bold text-stone-800">Both branches today</h2>
          <div className="space-y-3">
            {compare.map(({ b, t: bt }) => (
              <div
                key={b.id}
                className={`rounded-xl border p-3 ${
                  b.id === branch ? "border-amber-300 bg-amber-50/50" : "border-stone-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-stone-800">
                    {b.name} <span className="text-xs font-normal text-stone-500">· {b.area}</span>
                  </p>
                  <Badge tone={bt.revenue === 0 ? "stone" : bt.profit >= 0 ? "green" : "red"}>
                    {bt.revenue === 0 ? "No sales" : pctText(bt.pct)}
                  </Badge>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-stone-500">
                  <div>
                    <p>Received</p>
                    <p className="text-sm font-semibold text-stone-800">{money(bt.receivedValue)}</p>
                  </div>
                  <div>
                    <p>Sales</p>
                    <p className="text-sm font-semibold text-stone-800">{money(bt.revenue)}</p>
                  </div>
                  <div>
                    <p>{bt.profit >= 0 ? "Profit" : "Loss"}</p>
                    <p
                      className={`text-sm font-semibold ${
                        bt.profit >= 0 ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {money(bt.profit)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-bold text-stone-800">Top items by sales</h2>
          {top.length === 0 ? (
            <p className="text-sm text-stone-500">No sales yet for this day.</p>
          ) : (
            <ul className="space-y-3">
              {top.map((r) => (
                <li key={r.item}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-stone-700">{r.item}</span>
                    <span className="text-stone-600">{money(r.revenue)}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{ width: `${(r.revenue / topMax) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-stone-800">
            <Icon name="alert" className="h-4 w-4 text-amber-600" /> Low stock alerts
          </h2>
          {low.length === 0 ? (
            <p className="text-sm text-stone-500">All items are well stocked.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {low.map((r) => (
                <li key={r.item} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-medium text-stone-700">{r.item}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-stone-600">
                      {qtyText(r.closing)} {r.unit}
                    </span>
                    <Badge tone={r.closing <= 0 ? "red" : "amber"}>{r.closing <= 0 ? "Out" : "Low"}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
