"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { BRANCHES, BranchId, CATALOG, DB, Intake, Sale, unitOf } from "../lib/data";
import { dayRows, itemNames } from "../lib/calc";
import { dayLabel, money, pctText, qtyText } from "../lib/format";
import { Card, Icon, inputCls, labelCls } from "./ui";

type Notify = (msg: string, kind?: "ok" | "err") => void;

function BranchSelect({ value, onChange }: { value: BranchId; onChange: (b: BranchId) => void }) {
  return (
    <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value as BranchId)}>
      {BRANCHES.map((b) => (
        <option key={b.id} value={b.id}>
          {b.name} — {b.area}
        </option>
      ))}
    </select>
  );
}

export function IntakeForm({
  db,
  branch,
  date,
  notify,
  onAdd,
  onDelete,
}: {
  db: DB;
  branch: BranchId;
  date: string;
  notify: Notify;
  onAdd: (e: Omit<Intake, "id">) => void;
  onDelete: (id: string) => void;
}) {
  const [fb, setFb] = useState<BranchId>(branch);
  const [fd, setFd] = useState(date);
  const [item, setItem] = useState("");
  const [qty, setQty] = useState("");
  const [cost, setCost] = useState("");

  useEffect(() => setFb(branch), [branch]);
  useEffect(() => setFd(date), [date]);

  const names = useMemo(() => itemNames(db, fb), [db, fb]);
  const unit = unitOf(item.trim());
  const total = (parseFloat(qty) || 0) * (parseFloat(cost) || 0);

  function pick(v: string) {
    setItem(v);
    const c = CATALOG.find((x) => x.name.toLowerCase() === v.trim().toLowerCase());
    if (c) setCost(String(c.cost));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const name = item.trim();
    const q = parseFloat(qty);
    const c = parseFloat(cost);
    if (!name) return notify("Please enter an item name", "err");
    if (!(q > 0)) return notify("Quantity must be more than 0", "err");
    if (!(c > 0)) return notify("Unit cost must be more than 0", "err");
    const canonical = names.find((n) => n.toLowerCase() === name.toLowerCase()) ?? name;
    onAdd({ branch: fb, date: fd, item: canonical, qty: q, unitCost: c });
    notify(`Added ${qtyText(q)} ${unitOf(canonical)} ${canonical} to ${BRANCHES.find((b) => b.id === fb)?.name}`);
    setQty("");
    setItem("");
    setCost("");
  }

  const recent = useMemo(
    () =>
      db.intake
        .map((x, i) => ({ x, i }))
        .filter(({ x }) => x.branch === fb)
        .sort((a, b) => (a.x.date === b.x.date ? b.i - a.i : a.x.date < b.x.date ? 1 : -1))
        .slice(0, 8)
        .map(({ x }) => x),
    [db, fb]
  );

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Card className="p-4 lg:col-span-2">
        <h2 className="mb-3 text-sm font-bold text-stone-800">Log warehouse delivery</h2>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className={labelCls}>Branch</label>
            <BranchSelect value={fb} onChange={setFb} />
          </div>
          <div>
            <label className={labelCls}>Date</label>
            <input type="date" className={inputCls} value={fd} onChange={(e) => setFd(e.target.value)} required />
          </div>
          <div>
            <label className={labelCls}>Item name</label>
            <input
              className={inputCls}
              list="intake-items"
              placeholder="e.g. Chicken"
              value={item}
              onChange={(e) => pick(e.target.value)}
            />
            <datalist id="intake-items">
              {names.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Quantity ({unit})</label>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                className={inputCls}
                placeholder="0"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Unit cost (Rs)</label>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                className={inputCls}
                placeholder="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2 text-sm">
            <span className="text-stone-500">Total cost</span>
            <span className="font-bold text-stone-800">{money(total)}</span>
          </div>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-base font-bold text-stone-900 shadow-sm active:scale-[0.99] hover:bg-amber-400"
          >
            <Icon name="plus" className="h-5 w-5" /> Add to inventory
          </button>
        </form>
      </Card>

      <Card className="p-4 lg:col-span-3">
        <h2 className="mb-3 text-sm font-bold text-stone-800">
          Recent deliveries — {BRANCHES.find((b) => b.id === fb)?.name}
        </h2>
        <ul className="divide-y divide-stone-100">
          {recent.map((r) => (
            <li key={r.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-stone-800">{r.item}</p>
                <p className="text-xs text-stone-500">
                  {dayLabel(r.date)} · {qtyText(r.qty)} {unitOf(r.item)} @ {money(r.unitCost)}
                </p>
              </div>
              <p className="text-sm font-bold text-stone-800">{money(r.qty * r.unitCost)}</p>
              <button
                onClick={() => onDelete(r.id)}
                className="rounded-lg p-2 text-stone-400 hover:bg-rose-50 hover:text-rose-600"
                aria-label={`Delete ${r.item} delivery`}
              >
                <Icon name="trash" className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

export function SalesForm({
  db,
  branch,
  date,
  notify,
  onAdd,
  onDelete,
}: {
  db: DB;
  branch: BranchId;
  date: string;
  notify: Notify;
  onAdd: (e: Omit<Sale, "id">) => void;
  onDelete: (id: string) => void;
}) {
  const [fb, setFb] = useState<BranchId>(branch);
  const [fd, setFd] = useState(date);
  const [item, setItem] = useState("");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => setFb(branch), [branch]);
  useEffect(() => setFd(date), [date]);

  const rows = useMemo(() => dayRows(db, fb, fd), [db, fb, fd]);
  const row = rows.find((r) => r.item === item);
  const avail = row ? row.closing : 0;
  const q = parseFloat(qty) || 0;
  const p = parseFloat(price) || 0;
  const margin = row && row.avgCost > 0 && p > 0 ? ((p - row.avgCost) / row.avgCost) * 100 : null;

  function pick(v: string) {
    setItem(v);
    const c = CATALOG.find((x) => x.name === v);
    if (c) setPrice(String(c.sell));
    else setPrice("");
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!item) return notify("Please choose an item", "err");
    if (!(q > 0)) return notify("Quantity must be more than 0", "err");
    if (!(p > 0)) return notify("Selling price must be more than 0", "err");
    if (q > avail) return notify(`Only ${qtyText(avail)} ${row?.unit ?? ""} ${item} in stock`, "err");
    onAdd({ branch: fb, date: fd, item, qty: q, price: p });
    notify(`Sale recorded: ${qtyText(q)} ${row?.unit ?? ""} ${item}`);
    setQty("");
  }

  const recent = useMemo(
    () =>
      db.sales
        .map((x, i) => ({ x, i }))
        .filter(({ x }) => x.branch === fb)
        .sort((a, b) => (a.x.date === b.x.date ? b.i - a.i : a.x.date < b.x.date ? 1 : -1))
        .slice(0, 8)
        .map(({ x }) => x),
    [db, fb]
  );

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Card className="p-4 lg:col-span-2">
        <h2 className="mb-3 text-sm font-bold text-stone-800">Record sales</h2>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className={labelCls}>Branch</label>
            <BranchSelect value={fb} onChange={setFb} />
          </div>
          <div>
            <label className={labelCls}>Date</label>
            <input type="date" className={inputCls} value={fd} onChange={(e) => setFd(e.target.value)} required />
          </div>
          <div>
            <label className={labelCls}>Item</label>
            <select className={inputCls} value={item} onChange={(e) => pick(e.target.value)}>
              <option value="">Select item…</option>
              {rows.map((r) => (
                <option key={r.item} value={r.item}>
                  {r.item} ({qtyText(r.closing)} {r.unit} left)
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Qty sold ({row?.unit ?? "unit"})</label>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                className={inputCls}
                placeholder="0"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Selling price (Rs)</label>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                className={inputCls}
                placeholder="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1 rounded-xl bg-stone-50 px-3 py-2 text-sm">
            <div className="flex justify-between">
              <span className="text-stone-500">Available</span>
              <span className="font-semibold text-stone-800">
                {item ? `${qtyText(avail)} ${row?.unit ?? ""}` : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Sale value</span>
              <span className="font-bold text-stone-800">{money(q * p)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Margin on cost</span>
              <span
                className={`font-semibold ${
                  margin === null ? "text-stone-400" : margin >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {margin === null ? "—" : pctText(margin)}
              </span>
            </div>
          </div>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-base font-bold text-stone-900 shadow-sm active:scale-[0.99] hover:bg-amber-400"
          >
            <Icon name="plus" className="h-5 w-5" /> Record sale
          </button>
        </form>
      </Card>

      <Card className="p-4 lg:col-span-3">
        <h2 className="mb-3 text-sm font-bold text-stone-800">
          Recent sales — {BRANCHES.find((b) => b.id === fb)?.name}
        </h2>
        <ul className="divide-y divide-stone-100">
          {recent.map((r) => (
            <li key={r.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-stone-800">{r.item}</p>
                <p className="text-xs text-stone-500">
                  {dayLabel(r.date)} · {qtyText(r.qty)} {unitOf(r.item)} @ {money(r.price)}
                </p>
              </div>
              <p className="text-sm font-bold text-stone-800">{money(r.qty * r.price)}</p>
              <button
                onClick={() => onDelete(r.id)}
                className="rounded-lg p-2 text-stone-400 hover:bg-rose-50 hover:text-rose-600"
                aria-label={`Delete ${r.item} sale`}
              >
                <Icon name="trash" className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
