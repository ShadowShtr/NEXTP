"use client";

import React from "react";
import { eur } from "@/lib/format";

export type Slice = { label: string; value: number; color: string };

/** Donut chart em SVG (Gastos por categoria). */
export function DonutChart({ data, total, size = 168, stroke = 26 }: { data: Slice[]; total: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  let offset = 0;
  const sum = data.reduce((s, d) => s + d.value, 0) || 1;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#EEF2F7" strokeWidth={stroke} />
      <g transform={`rotate(-90 ${cx} ${cx})`}>
        {data.map((d, i) => {
          const frac = d.value / sum;
          const len = frac * c;
          const el = (
            <circle
              key={i}
              cx={cx}
              cy={cx}
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={stroke}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += len;
          return el;
        })}
      </g>
      <text x="50%" y="46%" textAnchor="middle" className="fill-nextp-muted" fontSize="11" fontWeight="700">Total</text>
      <text x="50%" y="58%" textAnchor="middle" className="fill-nextp-ink" fontSize="16" fontWeight="900">{eur(total)}</text>
    </svg>
  );
}

/** Barras verticais (Gastos por dia / Evolução diária). */
export function BarChart({ data, height = 150 }: { data: { label: string; value: number }[]; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end justify-between gap-2" style={{ height }}>
      {data.map((d, i) => {
        const h = Math.max(6, (d.value / max) * (height - 34));
        const top = d.value === max && d.value > 0;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 justify-end">
            {top ? <span className="text-[10px] font-black text-nextp-blue">{Math.round(d.value)}</span> : <span className="h-3" />}
            <div
              className="w-full rounded-t-lg transition-all"
              style={{ height: h, background: top ? "#006DFF" : "#BFDBFF" }}
            />
            <span className="text-[10px] text-nextp-muted">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Legenda para o donut. */
export function Legend({ data }: { data: Slice[] }) {
  return (
    <div className="space-y-1.5">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
          <span className="flex-1 text-nextp-ink">{d.label}</span>
          <span className="font-bold text-nextp-muted">{eur(d.value)}</span>
        </div>
      ))}
    </div>
  );
}
