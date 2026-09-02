import { redirect } from "next/navigation";

import { BrandMark } from "@/components/layout/brand-mark";
import { LoginForm } from "@/components/auth/login-form";
import { getUser } from "@/lib/supabase/auth";

export const metadata = { title: "Entrar · Central Emerge" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  if (await getUser()) {
    redirect(next && next.startsWith("/") ? next : "/");
  }

  return (
    <main className="bg-background flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <BrandMark />
        </div>
        <div className="border-border bg-card/60 rounded-2xl border p-7 shadow-xl backdrop-blur">
          <h1 className="text-lg font-semibold">Central Emerge</h1>
          <p className="text-muted-foreground mt-1 mb-6 text-sm">
            Hub interno — CRM, propostas e operações.
          </p>
          <LoginForm next={next && next.startsWith("/") ? next : "/"} error={error} />
        </div>
      </div>
    </main>
  );
}
