"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Factory, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createBrowserSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (signInError) {
      setError(
        signInError.message === "Invalid login credentials"
          ? "이메일 또는 비밀번호가 올바르지 않습니다."
          : signInError.message
      );
      return;
    }

    router.push(redirectTo || "/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded border border-border bg-surface p-6 shadow-panel">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <Factory className="h-8 w-8 text-accent" strokeWidth={1.5} />
          <h1 className="text-lg font-semibold">생산관리 시스템</h1>
          <p className="text-xs text-fg-muted">MRP · CAPA · 재고관리</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-fg-muted">이메일</label>
            <Input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-fg-muted">비밀번호</label>
            <Input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded bg-signal-critical/10 px-2.5 py-1.5 text-xs text-signal-critical">{error}</p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "로그인 중..." : "로그인"}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-fg-muted">
          계정이 없으신가요? 생산관리자(관리자)에게 계정 생성을 요청해 주세요.
        </p>
      </div>
    </div>
  );
}
