import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentProfile } from "@/lib/supabase/profile";

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  // 미들웨어가 1차로 막지만, 직접 접근 등 예외 상황에 대비한 2차 방어선.
  if (!profile) {
    redirect("/login");
  }

  return <AppShell profile={profile}>{children}</AppShell>;
}
