"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PvaDailyTotal } from "@/types/plan-vs-actual";

export function PvaTrendChart({ data }: { data: PvaDailyTotal[] }) {
  if (data.length === 0) {
    return <div className="flex h-64 items-center justify-center text-sm text-fg-muted">데이터가 없습니다.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="date" stroke="hsl(var(--fg-muted))" fontSize={12} tickFormatter={(d) => d.slice(5)} />
        <YAxis stroke="hsl(var(--fg-muted))" fontSize={12} />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--surface-raised))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 6,
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="plannedQty" name="계획" fill="hsl(var(--fg-muted))" radius={[3, 3, 0, 0]} maxBarSize={28} />
        <Bar dataKey="actualQty" name="실적" fill="hsl(var(--accent))" radius={[3, 3, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
