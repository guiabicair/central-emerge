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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<null | "password" | "magic" | "google">(
    null,
  );
  const [msg, setMsg] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const callbackUrl = (path: string) =>
    `${window.location.origin}/auth/callback?next=${encodeURIComponent(path)}`;

  async function signInPassword(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    setMsg(null);

    const supabase = createClient();

    if (!password) {
      // sem senha -> manda magic link
      setLoading("magic");
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: callbackUrl(next) },
      });
      setLoading(null);
      if (otpError) setLocalError(otpError.message);
      else setMsg(`Link de acesso enviado para ${email}. Confira o e-mail.`);
      return;
    }

    setLoading("password");
    const { error: pwError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(null);
    if (pwError) {
      setLocalError(pwError.message);
      return;
    }
    window.location.assign(next);
  }

  async function signInGoogle() {
    setLoading("google");
    setLocalError(null);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl(next),
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (oauthError) {
      setLocalError(oauthError.message);
      setLoading(null);
    }
  }

  const shownError = localError ?? error;

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={signInPassword} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-muted-foreground text-xs font-medium">E-mail</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@emerge.com"
            className="border-input bg-background focus:ring-ring h-10 rounded-lg border px-3 text-sm outline-none focus:ring-2"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-muted-foreground text-xs font-medium">
            Senha{" "}
            <span className="text-muted-foreground/70">
              (deixe vazio p/ receber link por e-mail)
            </span>
          </span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border-input bg-background focus:ring-ring h-10 rounded-lg border px-3 text-sm outline-none focus:ring-2"
          />
        </label>
        <button
          type="submit"
          disabled={loading !== null}
          className="bg-primary text-primary-foreground hover:bg-primary/90 mt-1 flex h-10 items-center justify-center rounded-lg text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {loading === "password"
            ? "Entrando…"
            : loading === "magic"
              ? "Enviando link…"
              : "Entrar"}
        </button>
      </form>

      <div className="flex items-center gap-3">
        <span className="bg-border h-px flex-1" />
        <span className="text-muted-foreground text-[11px]">ou</span>
        <span className="bg-border h-px flex-1" />
      </div>

      <button
        type="button"
        onClick={signInGoogle}
        disabled={loading !== null}
        className="border-input bg-card hover:bg-accent flex h-10 items-center justify-center gap-3 rounded-lg border text-sm font-medium transition-colors disabled:opacity-60"
      >
        <GoogleGlyph />
        {loading === "google" ? "Redirecionando…" : "Entrar com Google"}
      </button>

      {msg && <p className="text-brand text-center text-xs">{msg}</p>}
      {shownError && (
        <p className="text-destructive text-center text-xs">{shownError}</p>
      )}

      <p className="text-muted-foreground text-center text-[11px] leading-relaxed">
        Acesso restrito à equipe Emerge.
      </p>
    </div>
  );
}
