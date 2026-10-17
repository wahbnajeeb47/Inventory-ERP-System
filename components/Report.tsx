"use client";

import { useMemo } from "react";
import { BRANCHES, BranchId, DB } from "../lib/data";
import { dayRows, totals } from "../lib/calc";
import { longDate, money, pctText, qtyText } from "../lib/format";
import { Badge, Card, Icon } from "./ui";

export default function Report({ db, branch, date }: { db: DB; branch: BranchId; date: string }) {
  const b = BRANCHES.find((x) => x.id === branch)!;
  const rows = useMemo(() => dayRows(db, branch, date), [db, branch, date]);
  const t = useMemo(() => totals(rows), [rows]);
  const hasSales = t.revenue > 0;
  const active = rows.filter((r) => r.received > 0 || r.sold > 0);
  const low = rows.filter((r) => r.low);
  const good = t.profit >= 0;

  function shareText(): string {
    const lines = [
      `*Closing Report — ${b.name} (${b.area})*`,
      longDate(date),
      "",
      `Inventory received: ${money(t.receivedValue)}`,
      `Total sales: ${money(t.revenue)}`,
      `Cost of goods sold: ${money(t.cogs)}`,
      `${good ? "Profit" : "Loss"}: ${money(Math.abs(t.profit))} (${pctText(t.pct)})`,
      `Stock remaining: ${money(t.stockValue)}`,
    ];
    if (low.length) lines.push("", `Low stock: ${low.map((r) => r.item).join(", ")}`);
    return lines.join("\n");
  }

  function whatsapp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText())}`, "_blank", "noopener");
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="bg-stone-900 px-4 py-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">Daily closing report</p>
          <h2 className="mt-1 text-xl font-bold">
            {b.name} <span className="text-sm font-normal text-stone-400">· {b.area}</span>
          </h2>
          <p className="text-sm text-stone-300">{longDate(date)}</p>
        </div>

        <div
          className={`flex items-center justify-between px-4 py-4 ${
            !hasSales ? "bg-stone-100" : good ? "bg-emerald-50" : "bg-rose-50"
          }`}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              {!hasSales ? "Result" : good ? "Net profit today" : "Net loss today"}
            </p>
            <p
              className={`text-2xl font-extrabold ${
                !hasSales ? "text-stone-500" : good ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              {hasSales ? money(t.profit) : "No sales"}
            </p>
          </div>
          {hasSales && (
            <div
              className={`rounded-2xl px-4 py-2 text-center text-xl font-extrabold ${
                good ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
              }`}
            >
              {pctText(t.pct)}
            </div>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-px bg-stone-200 text-sm">
          {[
            ["Inventory received", money(t.receivedValue)],
            ["Total sales", money(t.revenue)],
            ["Cost of goods sold", money(t.cogs)],
            ["Stock remaining (value)", money(t.stockValue)],
          ].map(([k, v]) => (
            <div key={k} className="bg-white px-4 py-3">
              <dt className="text-xs text-stone-500">{k}</dt>
              <dd className="mt-0.5 text-base font-bold text-stone-900">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-bold text-stone-800">Item-wise summary</h3>
        <div className="-mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wide text-stone-500">
                <th className="py-2 pr-2 font-semibold">Item</th>
                <th className="px-2 py-2 text-right font-semibold">In</th>
                <th className="px-2 py-2 text-right font-semibold">Sold</th>
                <th className="px-2 py-2 text-right font-semibold">Left</th>
                <th className="py-2 pl-2 text-right font-semibold">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {active.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-stone-500">
                    No activity on this day.
                  </td>
                </tr>
              )}
              {active.map((r) => (
                <tr key={r.item}>
                  <td className="py-2.5 pr-2 font-medium text-stone-800">{r.item}</td>
                  <td className="px-2 py-2.5 text-right text-stone-600">
                    {qtyText(r.received)} {r.unit}
                  </td>
                  <td className="px-2 py-2.5 text-right text-stone-600">
                    {qtyText(r.sold)} {r.unit}
                  </td>
                  <td className="px-2 py-2.5 text-right text-stone-600">
                    {qtyText(r.closing)} {r.unit}
                  </td>
                  <td
                    className={`py-2.5 pl-2 text-right font-semibold ${
                      r.sold === 0 ? "text-stone-400" : r.profit >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {r.sold === 0 ? "—" : money(r.profit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {low.length > 0 && (
        <Card className="p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-stone-800">
            <Icon name="alert" className="h-4 w-4 text-amber-600" /> Reorder from warehouse
          </h3>
          <div className="flex flex-wrap gap-2">
            {low.map((r) => (
              <Badge key={r.item} tone={r.closing <= 0 ? "red" : "amber"}>
                {r.item} · {qtyText(r.closing)} {r.unit} left
              </Badge>
            ))}
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-3 print:hidden sm:flex-row">
        <button
          onClick={whatsapp}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white hover:bg-emerald-500"
        >
          <Icon name="share" /> Share on WhatsApp
        </button>
        <button
          onClick={() => window.print()}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-3 font-bold text-stone-800 hover:bg-stone-50"
        >
          <Icon name="print" /> Print / Save PDF
        </button>
      </div>
    </div>
  );
}
