import { Topbar } from "@/components/layout/topbar";
import { SettingsView } from "@/components/settings/settings-view";
import { getUser } from "@/lib/supabase/auth";
import { createUntypedClient } from "@/lib/supabase/server";

export const metadata = { title: "Configurações · Central Emerge" };

export default async function ConfiguracoesPage() {
  const user = await getUser();
  const db = await createUntypedClient();

  let googleCalendar: {
    connected: boolean;
    email: string | null;
    lastSyncedAt: string | null;
  } = { connected: false, email: null, lastSyncedAt: null };

  if (user) {
    const { data } = await db
      .from("google_calendar_connections")
      .select("google_email, last_synced_at")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) {
      googleCalendar = {
        connected: true,
        email: (data as { google_email: string | null }).google_email,
        lastSyncedAt: (data as { last_synced_at: string | null }).last_synced_at,
      };
    }
  }

  return (
    <>
      <Topbar
        title="Configurações"
        description="Perfil, equipe, integrações e aparência"
      />
      <SettingsView googleCalendar={googleCalendar} />
    </>
  );
}
