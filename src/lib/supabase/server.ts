import { cookies } from "next/headers";

import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/lib/supabase/database.types";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

function cookieAdapter(cookieStore: CookieStore) {
  return {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
      try {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      } catch {
        // chamado de um Server Component — ignorado (proxy.ts renova a sessao)
      }
    },
  };
}

/**
 * Client Supabase para Server Components, Route Handlers e Server Actions,
 * tipado pelo schema gerado.
 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieAdapter(cookieStore) },
  );
}

/**
 * Client sem tipagem de schema — usado para tabelas que ainda nao estao
 * no database.types.ts (as `app_*` da migration 0001). Trocar pelo
 * `createClient` tipado depois de rodar o generate-types.
 */
export async function createUntypedClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieAdapter(cookieStore) },
  );
}
