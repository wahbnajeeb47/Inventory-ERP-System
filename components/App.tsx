"use client";

import { useCallback, useEffect, useState } from "react";
import { BRANCHES, BranchId, DB, Intake, Sale, buildSeed, iso } from "../lib/data";
import { longDate } from "../lib/format";
import Dashboard from "./Dashboard";
import { IntakeForm, SalesForm } from "./Forms";
import Report from "./Report";
import Stock from "./Stock";
import { Icon, inputCls } from "./ui";

type Tab = "dashboard" | "intake" | "sales" | "report" | "stock";

const TABS: { id: Tab; label: string; title: string; icon: string }[] = [
  { id: "dashboard", label: "Home", title: "Dashboard", icon: "dashboard" },
  { id: "intake", label: "Intake", title: "Inventory Intake", icon: "intake" },
  { id: "sales", label: "Sales", title: "Daily Sales", icon: "sales" },
  { id: "report", label: "Report", title: "Closing Report", icon: "report" },
  { id: "stock", label: "Stock", title: "Inventory List", icon: "stock" },
];

const KEY = "restostock-demo-v2";
let counter = 0;
const uid = () => `u-${Date.now()}-${counter++}`;

export default function App() {
  const [db, setDb] = useState<DB | null>(null);
  const [today, setToday] = useState("");
  const [date, setDate] = useState("");
  const [branch, setBranch] = useState<BranchId>("b1");
  const [tab, setTab] = useState<Tab>("dashboard");
  const [toast, setToast] = useState<{ msg: string; kind: "ok" | "err" } | null>(null);

  useEffect(() => {
    const t = iso(new Date());
    setToday(t);
    setDate(t);
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw);
        // Sample data is built relative to "today"; rebuild it if the demo is opened on a new day
        if (p?.seedDay === t && p?.db?.intake && p?.db?.sales) {
          setDb(p.db);
          return;
        }
      }
    } catch {
      /* ignore and fall through to fresh sample data */
    }
    setDb(buildSeed(t));
  }, []);

  useEffect(() => {
    if (!db || !today) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ seedDay: today, db }));
    } catch {
      /* storage may be unavailable; the demo still works in memory */
    }
  }, [db, today]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  const notify = useCallback((msg: string, kind: "ok" | "err" = "ok") => setToast({ msg, kind }), []);

  const addIntake = (e: Omit<Intake, "id">) =>
    setDb((d) => (d ? { ...d, intake: [...d.intake, { ...e, id: uid() }] } : d));
  const addSale = (e: Omit<Sale, "id">) =>
    setDb((d) => (d ? { ...d, sales: [...d.sales, { ...e, id: uid() }] } : d));
  const delIntake = (id: string) =>
    setDb((d) => (d ? { ...d, intake: d.intake.filter((x) => x.id !== id) } : d));
  const delSale = (id: string) =>
    setDb((d) => (d ? { ...d, sales: d.sales.filter((x) => x.id !== id) } : d));

  function resetDemo() {
    setDb(buildSeed(today));
    setDate(today);
    notify("Demo data reset");
  }

  if (!db) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 text-stone-400">
        Loading RestoStock…
      </div>
    );
  }

  const current = TABS.find((t) => t.id === tab)!;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800">
      <header className="sticky top-0 z-30 bg-stone-900 text-white shadow print:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-lg font-black text-stone-900">
            R
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="font-bold">RestoStock</p>
            <p className="text-xs text-stone-400">Inventory &amp; daily closing</p>
          </div>
          <div
            className="ml-auto flex rounded-xl bg-stone-800 p-1 text-sm font-semibold"
            role="tablist"
            aria-label="Switch branch"
          >
            {BRANCHES.map((b) => (
              <button
                key={b.id}
                role="tab"
                aria-selected={branch === b.id}
                onClick={() => setBranch(b.id)}
                className={`rounded-lg px-3.5 py-1.5 transition ${
                  branch === b.id ? "bg-amber-500 text-stone-900" : "text-stone-300 hover:text-white"
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl gap-6 px-4 pb-28 pt-4 md:flex md:pb-10">
        <aside className="hidden w-52 shrink-0 print:hidden md:block">
          <nav className="sticky top-20 space-y-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                  tab === t.id ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-200/60"
                }`}
              >
                <Icon name={t.icon} /> {t.title}
              </button>
            ))}
            <button
              onClick={resetDemo}
              className="mt-4 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-stone-500 hover:bg-stone-200/60"
            >
              <Icon name="reset" className="h-4 w-4" /> Reset demo data
            </button>
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3 print:hidden">
            <div>
              <h1 className="text-xl font-extrabold text-stone-900 sm:text-2xl">{current.title}</h1>
              <p className="text-sm text-stone-500">
                {BRANCHES.find((b) => b.id === branch)?.name} · {longDate(date)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                aria-label="Report date"
                className={`${inputCls} !w-auto !py-2`}
                value={date}
                max={today}
                onChange={(e) => e.target.value && setDate(e.target.value)}
              />
              <button
                onClick={resetDemo}
                className="rounded-xl p-2.5 text-stone-500 hover:bg-stone-200/60 md:hidden"
                aria-label="Reset demo data"
              >
                <Icon name="reset" />
              </button>
            </div>
          </div>

          {tab === "dashboard" && <Dashboard db={db} branch={branch} date={date} />}
          {tab === "intake" && (
            <IntakeForm db={db} branch={branch} date={date} notify={notify} onAdd={addIntake} onDelete={delIntake} />
          )}
          {tab === "sales" && (
            <SalesForm db={db} branch={branch} date={date} notify={notify} onAdd={addSale} onDelete={delSale} />
          )}
          {tab === "report" && <Report db={db} branch={branch} date={date} />}
          {tab === "stock" && <Stock db={db} branch={branch} date={date} />}
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur print:hidden md:hidden"
        aria-label="Main"
      >
        <div className="mx-auto grid max-w-md grid-cols-5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${
                tab === t.id ? "text-amber-600" : "text-stone-500"
              }`}
            >
              <Icon name={t.icon} className="h-6 w-6" />
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {toast && (
        <div
          role="status"
          className={`fixed inset-x-4 bottom-24 z-40 mx-auto max-w-sm rounded-xl px-4 py-3 text-center text-sm font-semibold text-white shadow-lg md:bottom-8 ${
            toast.kind === "ok" ? "bg-emerald-600" : "bg-rose-600"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
