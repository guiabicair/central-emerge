import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

/**
 * Client com service_role — bypassa RLS e permite `auth.admin.*`.
 * Nunca importar de um Client Component. Só para ações server-side que
 * precisam mesmo de poder total (ex: excluir usuário de verdade).
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não configurada — adicione no Vercel (Project Settings → Environment Variables) com o valor de Project Settings → API → service_role no Supabase.",
    );
  }
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
