import { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-stone-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

const PATHS: Record<string, string[]> = {
  dashboard: ["M4 4h7v7H4z", "M13 4h7v4h-7z", "M13 11h7v9h-7z", "M4 14h7v6H4z"],
  intake: ["M12 3v11", "M8 10l4 4 4-4", "M4 17v3h16v-3"],
  sales: ["M3 4h2l2.4 11h10.2L20 7H6", "M9 19.5h.01", "M17 19.5h.01"],
  report: ["M7 3h7l5 5v13H7z", "M14 3v5h5", "M10 13h6", "M10 17h6"],
  stock: ["M3 7l9-4 9 4-9 4z", "M3 7v10l9 4 9-4V7", "M12 11v10"],
  trash: ["M4 7h16", "M9 7V4h6v3", "M6 7l1 13h10l1-13"],
  print: ["M7 9V3h10v6", "M7 17H5v-6h14v6h-2", "M7 14h10v7H7z"],
  share: ["M4 12v7h16v-7", "M12 3v12", "M8 7l4-4 4 4"],
  plus: ["M12 5v14", "M5 12h14"],
  reset: ["M4 4v6h6", "M5.5 15a8 8 0 101.8-8.3L4 10"],
  alert: ["M12 4l9 16H3z", "M12 10v4", "M12 17h.01"],
};

export function Icon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {(PATHS[name] ?? []).map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

export function Badge({
  tone,
  children,
}: {
  tone: "green" | "red" | "amber" | "stone";
  children: ReactNode;
}) {
  const map = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    red: "bg-rose-50 text-rose-700 ring-rose-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    stone: "bg-stone-100 text-stone-600 ring-stone-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${map[tone]}`}
    >
      {children}
    </span>
  );
}

export const inputCls =
  "w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-800 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300";

export const labelCls = "mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500";
