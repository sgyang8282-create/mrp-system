import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Server Component / Server Action / Route Handler에서 사용하는 Supabase 클라이언트.
 * 사용자의 로그인 세션(쿠키)을 그대로 전달하므로 RLS 정책이 그대로 적용된다.
 */
export function createServerSupabaseClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );
}

/**
 * 계산 서비스(MRP/CAPA/일일계획/재고시뮬레이션) 전용.
 * RLS를 우회해 서버 배치 계산 결과를 적재해야 하므로 Service Role Key를 사용한다.
 * 절대 클라이언트 번들에 포함되지 않도록 "server-only" 파일에서만 import 할 것.
 */
export function createServiceRoleSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    { auth: { persistSession: false } }
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
