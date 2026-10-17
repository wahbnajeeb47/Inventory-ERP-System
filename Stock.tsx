"use client";

import { useMemo, useState } from "react";
import { BranchId, DB, reorderLevel } from "../lib/data";
import { dayRows, totals } from "../lib/calc";
import { money, qtyText } from "../lib/format";
import { Badge, Card, inputCls } from "./ui";

export default function Stock({ db, branch, date }: { db: DB; branch: BranchId; date: string }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "low">("all");

  const rows = useMemo(() => dayRows(db, branch, date), [db, branch, date]);
  const t = useMemo(() => totals(rows), [rows]);
  const shown = rows
    .filter((r) => r.item.toLowerCase().includes(q.trim().toLowerCase()))
    .filter((r) => (filter === "low" ? r.low : true));
  const lowCount = rows.filter((r) => r.low).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3">
          <p className="text-xs text-stone-500">Items</p>
          <p className="text-lg font-bold text-stone-900">{rows.length}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-stone-500">Stock value</p>
          <p className="text-lg font-bold text-stone-900">{money(t.stockValue)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-stone-500">Low / out</p>
          <p className={`text-lg font-bold ${lowCount ? "text-amber-600" : "text-emerald-600"}`}>{lowCount}</p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row">
          <input
            className={inputCls}
            placeholder="Search item…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search items"
          />
          <div className="flex shrink-0 rounded-xl bg-stone-100 p-1 text-sm font-semibold">
            {(["all", "low"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 rounded-lg px-4 py-1.5 sm:flex-none ${
                  filter === f ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"
                }`}
              >
                {f === "all" ? "All" : "Low stock"}
              </button>
            ))}
          </div>
        </div>

        <div className="-mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wide text-stone-500">
                <th className="py-2 pr-2 font-semibold">Item</th>
                <th className="px-2 py-2 text-right font-semibold">On hand</th>
                <th className="px-2 py-2 text-right font-semibold">Avg cost</th>
                <th className="px-2 py-2 text-right font-semibold">Value</th>
                <th className="py-2 pl-2 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {shown.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-stone-500">
                    Nothing matches.
                  </td>
                </tr>
              )}
              {shown.map((r) => (
                <tr key={r.item}>
                  <td className="py-2.5 pr-2 font-medium text-stone-800">
                    {r.item}
                    <span className="block text-xs font-normal text-stone-400">
                      reorder at {reorderLevel(r.item, branch)} {r.unit}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-right font-semibold text-stone-800">
                    {qtyText(r.closing)} {r.unit}
                  </td>
                  <td className="px-2 py-2.5 text-right text-stone-600">{money(r.avgCost)}</td>
                  <td className="px-2 py-2.5 text-right text-stone-600">{money(r.stockValue)}</td>
                  <td className="py-2.5 pl-2 text-right">
                    <Badge tone={r.closing <= 0 ? "red" : r.low ? "amber" : "green"}>
                      {r.closing <= 0 ? "Out" : r.low ? "Low" : "OK"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
