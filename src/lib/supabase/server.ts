import { cookies } from "next/headers";

import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/lib/supabase/database.types";

/**
 * Client Supabase para Server Components, Route Handlers e Server Actions.
 * A escrita de cookies via Server Component lanca — o refresh de sessao real
 * acontece no proxy.ts, entao o catch abaixo e seguro.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // chamado de um Server Component — ignorado (proxy.ts renova a sessao)
          }
        },
      },
    },
  );
}
