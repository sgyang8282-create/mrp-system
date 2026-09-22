import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { CurrentProfile } from "@/lib/role-label";
import type { UserRole } from "@/types/database";

export type { CurrentProfile } from "@/lib/role-label";
export { roleLabel } from "@/lib/role-label";

export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  if (!isSupabaseConfigured()) {
    return { id: "demo-admin", email: "demo@example.com", fullName: "데모 관리자", role: "admin", groupName: null };
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, production_groups(group_name)")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? null,
    fullName: profile?.full_name ?? user.email ?? "이름 미지정",
    role: (profile?.role as UserRole) ?? "worker",
    groupName: (profile as any)?.production_groups?.group_name ?? null,
  };
}
