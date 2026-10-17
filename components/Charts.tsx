"use client";

type Pt = { label: string; value: number };

export function TrendChart({ data, fmt }: { data: Pt[]; fmt: (n: number) => string }) {
  const W = 640,
    H = 250,
    L = 48,
    R = 22,
    T = 26,
    B = 32;
  const vals = data.map((d) => d.value);
  let min = Math.min(0, ...vals);
  let max = Math.max(0, ...vals);
  if (max - min < 1) max = min + 1;
  const pad = (max - min) * 0.14;
  if (max > 0) max += pad;
  if (min < 0) min -= pad;

  const x = (i: number) =>
    L + (data.length === 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (data.length - 1));
  const y = (v: number) => T + ((max - v) / (max - min)) * (H - T - B);

  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d.value)}`).join(" ");
  const area = `${line} L${x(data.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const ticks = [0, 1, 2, 3, 4].map((k) => min + ((max - min) * k) / 4);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Profit percentage trend">
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#e7e5e4" strokeWidth={1} />
          <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="#78716c">
            {fmt(t)}
          </text>
        </g>
      ))}
      <line x1={L} x2={W - R} y1={y(0)} y2={y(0)} stroke="#a8a29e" strokeWidth={1.2} strokeDasharray="4 4" />
      <path d={area} fill="#f59e0b" opacity={0.12} />
      <path d={line} fill="none" stroke="#b45309" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.value)} r={4.5} fill={d.value >= 0 ? "#059669" : "#e11d48"} stroke="#fff" strokeWidth={2} />
          <text
            x={x(i)}
            y={y(d.value) + (d.value >= 0 ? -10 : 18)}
            textAnchor="middle"
            fontSize={11}
            fontWeight={600}
            fill={d.value >= 0 ? "#047857" : "#be123c"}
          >
            {fmt(d.value)}
          </text>
          <text x={x(i)} y={H - 10} textAnchor="middle" fontSize={11} fill="#78716c">
            {d.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

type Pair = { label: string; cost: number; sales: number };

export function CostSalesChart({ data }: { data: Pair[] }) {
  const W = 640,
    H = 240,
    L = 48,
    R = 12,
    T = 14,
    B = 32;
  const max = Math.max(1, ...data.map((d) => Math.max(d.cost, d.sales))) * 1.1;
  const y = (v: number) => T + ((max - v) / max) * (H - T - B);
  const slot = (W - L - R) / data.length;
  const bw = Math.min(26, slot / 3);
  const k = (v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(Math.round(v)));

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Cost versus sales by day">
        {[0, 1, 2, 3].map((i) => {
          const v = (max * i) / 3;
          return (
            <g key={i}>
              <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="#e7e5e4" />
              <text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize={11} fill="#78716c">
                {k(v)}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const cx = L + slot * i + slot / 2;
          return (
            <g key={i}>
              <rect x={cx - bw - 2} y={y(d.cost)} width={bw} height={H - B - y(d.cost)} rx={4} fill="#a8a29e" />
              <rect x={cx + 2} y={y(d.sales)} width={bw} height={H - B - y(d.sales)} rx={4} fill="#f59e0b" />
              <text x={cx} y={H - 10} textAnchor="middle" fontSize={11} fill="#78716c">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex justify-center gap-5 text-xs text-stone-600">
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-2.5 w-2.5 rounded-sm bg-stone-400" /> Cost of goods
        </span>
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-500" /> Sales
        </span>
      </div>
    </div>
  );
}
