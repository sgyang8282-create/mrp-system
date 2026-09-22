import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "critical" | "warning" | "good" | "accent";

const TONE_BAR: Record<Tone, string> = {
  neutral: "bg-border",
  critical: "bg-signal-critical",
  warning: "bg-signal-warning",
  good: "bg-signal-good",
  accent: "bg-accent",
};

const TONE_TEXT: Record<Tone, string> = {
  neutral: "text-fg",
  critical: "text-signal-critical",
  warning: "text-signal-warning",
  good: "text-signal-good",
  accent: "text-accent",
};

export function KpiCard({
  label,
  value,
  unit,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: Tone;
  hint?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded border border-border bg-surface pl-4 pr-3 py-3">
      <span className={cn("absolute left-0 top-0 h-full w-1", TONE_BAR[tone])} aria-hidden />
      <p className="text-xs text-fg-muted">{label}</p>
      <p className="mt-1.5 flex items-baseline gap-1">
        <span className={cn("font-gauge text-2xl font-semibold tabular-nums", TONE_TEXT[tone])}>
          {value}
        </span>
        {unit && <span className="text-sm text-fg-muted">{unit}</span>}
      </p>
      {hint && <p className="mt-1 text-xs text-fg-muted">{hint}</p>}
    </div>
  );
}
