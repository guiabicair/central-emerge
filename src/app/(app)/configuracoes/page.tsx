import { Topbar } from "@/components/layout/topbar";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata = { title: "Configurações · Central Emerge" };

export default function ConfiguracoesPage() {
  return (
    <>
      <Topbar
        title="Configurações"
        description="Perfil, equipe, integrações e aparência"
      />
      <SettingsView />
    </>
  );
}
