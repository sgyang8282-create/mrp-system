"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS } from "@/components/layout/sidebar";
import { roleLabel } from "@/lib/role-label";
import type { CurrentProfile } from "@/lib/role-label";

export function Header({ onMenuClick, profile }: { onMenuClick?: () => void; profile: CurrentProfile | null }) {
  const pathname = usePathname();
  const current = NAV_ITEMS.find(
    (item) => pathname === item.href || pathname?.startsWith(`${item.href}/`)
  );
  const today = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date());

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick} aria-label="메뉴 열기">
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-base font-semibold">{current?.label ?? "생산관리 시스템"}</h1>
        <span className="hidden text-sm text-fg-muted md:inline">{today}</span>
      </div>
      <div className="flex items-center gap-2">
        {profile && (
          <div className="hidden items-center gap-1.5 sm:flex">
            <span className="text-sm text-fg-muted">{profile.fullName}</span>
            <Badge variant="accent">{roleLabel(profile.role)}</Badge>
            {profile.groupName && <Badge>{profile.groupName}</Badge>}
          </div>
        )}
        <ThemeToggle />
        <SignOutButton />
      </div>
    </header>
  );
}
