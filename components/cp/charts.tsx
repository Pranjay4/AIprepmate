"use client";

import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Chart conventions: one y-axis, thin marks, recessive grid, text in ink tokens (never the
// series colour), a legend whenever there are two series, hover tooltips, and a table view.
// Series colours are the validated categorical slots 1–2 defined in globals.css.

const AXIS = { fontSize: 11, fill: "var(--muted)" };
const TOOLTIP = {
  contentStyle: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--foreground)" },
  labelStyle: { color: "var(--muted)", marginBottom: 2 },
  itemStyle: { color: "var(--foreground)" },
  cursor: { fill: "var(--surface-muted)", stroke: "var(--border)" },
};

export function ChartFrame({ height = 220, children, table }: { height?: number; children: ReactNode; table: { head: string[]; rows: (string | number)[][] } }) {
  return (
    <div>
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
      <details className="mt-2 text-xs text-muted">
        <summary className="cursor-pointer select-none hover:text-foreground w-fit">View as table</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>{table.head.map((h) => <th key={h} className="py-1 pr-4 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {table.rows.map((r, i) => (
                <tr key={i} className="border-t border-border">
                  {r.map((c, j) => <td key={j} className="py-1 pr-4 text-foreground">{c}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

export function ScoreLine({ data, name, max = 100 }: { data: { label: string; score: number }[]; name: string; max?: number }) {
  return (
    <ChartFrame table={{ head: ["Attempt", name], rows: data.map((d) => [d.label, d.score]) }}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: "var(--chart-grid)" }} interval="preserveStartEnd" minTickGap={16} />
        <YAxis domain={[0, max]} tick={AXIS} tickLine={false} axisLine={false} width={44} />
        <Tooltip {...TOOLTIP} cursor={{ stroke: "var(--border)" }} />
        <Line type="monotone" dataKey="score" name={name} stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 4, fill: "var(--chart-1)", stroke: "var(--surface)", strokeWidth: 2 }} activeDot={{ r: 6 }} isAnimationActive={false} />
      </LineChart>
    </ChartFrame>
  );
}

export function PlanBars({ data }: { data: { week: string; Planned: number; Completed: number }[] }) {
  return (
    <ChartFrame table={{ head: ["Week", "Planned", "Completed"], rows: data.map((d) => [d.week, d.Planned, d.Completed]) }}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -18 }} barGap={2} barCategoryGap="28%">
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis dataKey="week" tick={AXIS} tickLine={false} axisLine={{ stroke: "var(--chart-grid)" }} />
        <YAxis allowDecimals={false} tick={AXIS} tickLine={false} axisLine={false} width={44} />
        <Tooltip {...TOOLTIP} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} formatter={(v) => <span style={{ color: "var(--muted)" }}>{v}</span>} />
        <Bar dataKey="Planned" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={22} isAnimationActive={false} />
        <Bar dataKey="Completed" fill="var(--chart-2)" radius={[4, 4, 0, 0]} maxBarSize={22} isAnimationActive={false} />
      </BarChart>
    </ChartFrame>
  );
}

export function MinutesBars({ data }: { data: { label: string; minutes: number }[] }) {
  return (
    <ChartFrame table={{ head: ["Day", "Minutes"], rows: data.map((d) => [d.label, d.minutes]) }}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -18 }} barCategoryGap="20%">
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: "var(--chart-grid)" }} interval="preserveStartEnd" minTickGap={20} />
        <YAxis allowDecimals={false} tick={AXIS} tickLine={false} axisLine={false} width={44} />
        <Tooltip {...TOOLTIP} formatter={(v) => [`${v} min`, "Study time"]} />
        <Bar dataKey="minutes" name="Study time" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={26} isAnimationActive={false} />
      </BarChart>
    </ChartFrame>
  );
}

/** Horizontal accuracy bars with direct labels; plain HTML so labels never collide. */
export function AccuracyBars({ rows, unit = "%" }: { rows: { label: string; value: number; note?: string; muted?: boolean }[]; unit?: string }) {
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} title={`${r.label}: ${r.value}${unit}${r.note ? ` · ${r.note}` : ""}`}>
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="font-medium truncate">{r.label}</span>
            <span className="text-muted shrink-0 tabular-nums">
              {r.note && <span className="mr-2">{r.note}</span>}
              <span className="text-foreground font-semibold">{r.value}{unit}</span>
            </span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-surface-muted overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.max(2, Math.min(100, r.value))}%`, background: "var(--chart-1)", opacity: r.muted ? 0.45 : 1 }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
