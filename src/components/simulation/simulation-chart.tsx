"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SimulationDayRow } from "@/types/simulation";

function alertColor(level: SimulationDayRow["alertLevel"]) {
  if (level === "CRITICAL") return "hsl(var(--signal-critical))";
  if (level === "WARNING") return "hsl(var(--signal-warning))";
  return "hsl(var(--accent))";
}

function CustomDot(props: any) {
  const { cx, cy, payload } = props;
  return <circle cx={cx} cy={cy} r={4} fill={alertColor(payload.alertLevel)} stroke="none" />;
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const row: SimulationDayRow = payload[0].payload;
  return (
    <div className="rounded border border-border bg-surface-raised px-3 py-2 text-xs shadow-panel">
      <p className="mb-1 font-medium">{label}</p>
      <p className="text-fg-muted">
        예상재고 <span className="font-gauge font-semibold" style={{ color: alertColor(row.alertLevel) }}>{row.expectedQty}</span>
      </p>
      <p className="text-fg-muted">생산 +{row.productionQty} · 소요 -{row.requirementQty}</p>
      <p className="text-fg-muted">출고 -{row.shipmentQty} · 불량 -{row.defectQty}</p>
    </div>
  );
}

export function SimulationChart({ days }: { days: SimulationDayRow[] }) {
  if (days.length === 0) {
    return <div className="flex h-64 items-center justify-center text-sm text-fg-muted">데이터가 없습니다.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={days} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="date" stroke="hsl(var(--fg-muted))" fontSize={12} tickFormatter={(d) => d.slice(5)} />
        <YAxis stroke="hsl(var(--fg-muted))" fontSize={12} />
        <Tooltip content={<ChartTooltip />} />
        <ReferenceLine y={0} stroke="hsl(var(--signal-critical))" strokeDasharray="4 4" />
        <Line
          type="monotone"
          dataKey="expectedQty"
          name="예상재고"
          stroke="hsl(var(--accent))"
          strokeWidth={2}
          dot={<CustomDot />}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
