"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CapaLoadItem } from "@/types/dashboard";

function loadColor(loadPct: number) {
  if (loadPct > 100) return "hsl(var(--signal-critical))";
  if (loadPct >= 85) return "hsl(var(--signal-warning))";
  return "hsl(var(--signal-good))";
}

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const row: CapaLoadItem = payload[0].payload;
  return (
    <div className="rounded border border-border bg-surface-raised px-3 py-2 text-xs shadow-panel">
      <p className="mb-1 font-medium text-fg">{row.groupName}</p>
      <p className="text-fg-muted">
        가용 <span className="font-gauge text-fg">{row.availableMinutes.toLocaleString()}</span>분
      </p>
      <p className="text-fg-muted">
        소요 <span className="font-gauge text-fg">{row.requiredMinutes.toLocaleString()}</span>분
      </p>
      <p className="text-fg-muted">
        부하율{" "}
        <span className="font-gauge font-semibold" style={{ color: loadColor(row.loadPct) }}>
          {row.loadPct.toFixed(1)}%
        </span>
      </p>
    </div>
  );
}

export function CapaLoadChart({ data }: { data: CapaLoadItem[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-fg-muted">
        CAPA 분석 데이터가 없습니다. 월간계획 확정 후 MRP 전개를 실행해 주세요.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
        <XAxis
          type="number"
          domain={[0, (max: number) => Math.max(120, Math.ceil(max / 10) * 10)]}
          tickFormatter={(v) => `${v}%`}
          stroke="hsl(var(--fg-muted))"
          fontSize={12}
        />
        <YAxis
          type="category"
          dataKey="groupName"
          width={72}
          stroke="hsl(var(--fg-muted))"
          fontSize={12}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--surface-raised))" }} />
        <ReferenceLine x={100} stroke="hsl(var(--signal-critical))" strokeDasharray="4 4" />
        <Bar dataKey="loadPct" radius={[0, 3, 3, 0]} maxBarSize={22}>
          {data.map((entry, index) => (
            <Cell key={index} fill={loadColor(entry.loadPct)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
