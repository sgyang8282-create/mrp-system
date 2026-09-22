"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GitBranch,
  Boxes,
  Users,
  CalendarRange,
  Workflow,
  Gauge,
  CalendarCheck2,
  LineChart,
  ClipboardList,
  BarChart3,
  Factory,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bom", label: "BOM 관리", icon: GitBranch },
  { href: "/inventory", label: "현재고 관리", icon: Boxes },
  { href: "/groups", label: "생산그룹 관리", icon: Users },
  { href: "/monthly-plans", label: "월간 생산계획", icon: CalendarRange },
  { href: "/mrp", label: "MRP 전개", icon: Workflow },
  { href: "/capa", label: "CAPA 분석", icon: Gauge },
  { href: "/daily-plans", label: "일일 생산계획", icon: CalendarCheck2 },
  { href: "/simulation", label: "재고 시뮬레이션", icon: LineChart },
  { href: "/actuals", label: "생산실적 입력", icon: ClipboardList },
  { href: "/plan-vs-actual", label: "계획대비실적", icon: BarChart3 },
] as const;

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex h-full w-60 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-4 py-4">
        <Factory className="h-5 w-5 text-accent" strokeWidth={1.75} />
        <div className="leading-tight">
          <p className="text-sm font-semibold">생산관리 시스템</p>
          <p className="text-xs text-fg-muted">MRP · CAPA · 재고관리</p>
        </div>
      </div>

      <ul className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2.5 rounded px-3 py-2 text-sm transition-colors",
                  active
                    ? "border-l-2 border-accent bg-accent/10 text-fg font-medium"
                    : "border-l-2 border-transparent text-fg-muted hover:bg-surface-raised hover:text-fg"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                <span className="truncate">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export { NAV_ITEMS };
