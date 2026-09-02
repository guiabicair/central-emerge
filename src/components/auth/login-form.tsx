"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.44-1.68 4.22-5.5 4.22-3.31 0-6.01-2.74-6.01-6.12S8.69 6.08 12 6.08c1.88 0 3.15.8 3.87 1.49l2.64-2.55C16.8 2.9 14.62 2 12 2 6.98 2 2.9 6.08 2.9 12S6.98 22 12 22c5.78 0 9.6-4.06 9.6-9.78 0-.66-.07-1.16-.16-1.66H12z"
      />
    </svg>
  );
}

export function LoginForm({ next, error }: { next: string; error?: string }) {
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function signIn() {
    setLoading(true);
    setLocalError(null);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (oauthError) {
      setLocalError(oauthError.message);
      setLoading(false);
    }
  }

  const shownError = localError ?? error;

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={signIn}
        disabled={loading}
        className="border-input bg-card hover:bg-accent flex h-11 items-center justify-center gap-3 rounded-xl border text-sm font-medium transition-colors disabled:opacity-60"
      >
        <GoogleGlyph />
        {loading ? "Redirecionando…" : "Entrar com Google"}
      </button>

      {shownError && (
        <p className="text-destructive text-center text-xs">{shownError}</p>
      )}

      <p className="text-muted-foreground text-center text-[11px] leading-relaxed">
        Acesso restrito à equipe Emerge. Sua conta precisa estar aprovada no
        sistema.
      </p>
    </div>
  );
}
