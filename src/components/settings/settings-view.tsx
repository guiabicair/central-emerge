"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  CreditCard,
  HardDrive,
  Info,
  Moon,
  Palette,
  RefreshCw,
  Sparkles,
  Sun,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import {
  disconnectGoogleCalendar,
  syncGoogleCalendarNow,
} from "@/app/(app)/configuracoes/actions";
import { StatusPill } from "@/components/status-pill";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { TEAM } from "@/lib/mock-data";
import { cn, formatDate, initials } from "@/lib/utils";

const SECTIONS = [
  { id: "perfil", label: "Perfil", icon: User },
  { id: "equipe", label: "Equipe", icon: Users },
  { id: "integracoes", label: "Integrações", icon: CreditCard },
  { id: "aparencia", label: "Aparência", icon: Palette },
  { id: "sobre", label: "Sobre", icon: Info },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const APP_VERSION = "0.1.0";
const THEME_KEY = "central-emerge-theme";

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-input mt-1 h-9 w-full rounded-md border bg-transparent px-2.5 text-sm outline-none"
      />
    </label>
  );
}

function IntegrationRow({
  icon: Icon,
  nome,
  conectado,
  children,
}: {
  icon: typeof User;
  nome: string;
  conectado: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="border-border flex items-center justify-between gap-3 rounded-xl border p-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="bg-muted text-muted-foreground grid size-8 shrink-0 place-items-center rounded-lg">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-medium">{nome}</div>
          <div className="text-muted-foreground text-xs">{children}</div>
        </div>
      </div>
      {conectado ? (
        <StatusPill color="green">Conectado</StatusPill>
      ) : (
        <Button size="xs" variant="outline" disabled>
          Conectar
        </Button>
      )}
    </div>
  );
}

function GoogleCalendarRow({
  googleCalendar,
}: {
  googleCalendar: { connected: boolean; email: string | null; lastSyncedAt: string | null };
}) {
  const [pending, startTransition] = useTransition();

  function sync() {
    startTransition(async () => {
      const res = await syncGoogleCalendarNow();
      if (res.error) toast.error(res.error);
      else toast.success(`${res.count ?? 0} evento(s) sincronizado(s).`);
    });
  }

  function disconnect() {
    if (!window.confirm("Desconectar o Google Calendar? Os eventos já importados continuam no calendário.")) return;
    startTransition(async () => {
      const res = await disconnectGoogleCalendar();
      if (res?.error) toast.error(res.error);
      else toast.success("Desconectado.");
    });
  }

  return (
    <div className="border-border flex items-center justify-between gap-3 rounded-xl border p-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="bg-muted text-muted-foreground grid size-8 shrink-0 place-items-center rounded-lg">
          <CalendarDays className="size-4" />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-medium">Google Calendar</div>
          <div className="text-muted-foreground truncate text-xs">
            {googleCalendar.connected
              ? `${googleCalendar.email ?? "conectado"}${
                  googleCalendar.lastSyncedAt
                    ? ` · sincronizado ${formatDate(googleCalendar.lastSyncedAt)}`
                    : " · nunca sincronizado"
                }`
              : "Puxa suas reuniões pro /calendario."}
          </div>
        </div>
      </div>
      {googleCalendar.connected ? (
        <div className="flex shrink-0 items-center gap-1.5">
          <Button size="xs" variant="outline" disabled={pending} onClick={sync}>
            <RefreshCw className="size-3.5" /> Sincronizar
          </Button>
          <Button size="xs" variant="ghost" disabled={pending} onClick={disconnect}>
            Desconectar
          </Button>
        </div>
      ) : (
        <a
          href="/api/google-calendar/authorize"
          className={buttonVariants({ variant: "outline", size: "xs" })}
        >
          Conectar
        </a>
      )}
    </div>
  );
}

export function SettingsView({
  googleCalendar,
}: {
  googleCalendar: { connected: boolean; email: string | null; lastSyncedAt: string | null };
}) {
  const [active, setActive] = useState<SectionId>("perfil");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const err = searchParams.get("google_error");
    const ok = searchParams.get("google_connected");
    const synced = searchParams.get("google_synced");
    if (err) toast.error(decodeURIComponent(err));
    if (ok) {
      const n = Number(synced ?? 0);
      toast.success(
        n > 0
          ? `Google Calendar conectado — ${n} evento(s) já sincronizado(s).`
          : "Google Calendar conectado — nenhum evento nos próximos 90 dias.",
      );
    }
    if (err || ok) router.replace("/configuracoes");
  }, [searchParams, router]);

  const [nome, setNome] = useState("Equipe Emerge");
  const [email, setEmail] = useState("contato.emergetech@gmail.com");
  const [cargo, setCargo] = useState("Administração");

  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    setTheme(
      document.documentElement.classList.contains("dark") ? "dark" : "light",
    );
  }, []);

  const applyTheme = (next: "dark" | "light") => {
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // ignore
    }
    setTheme(next);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-[188px_1fr]">
        <nav className="flex gap-1 overflow-x-auto md:flex-col">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActive(s.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active === s.id
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {s.label}
              </button>
            );
          })}
        </nav>

        <div className="border-border bg-card rounded-2xl border p-5">
          {active === "perfil" && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold">Perfil</h2>
              <div className="flex items-center gap-3">
                <Avatar className="size-12">
                  <AvatarFallback className="bg-[#45f0d1]/15 text-sm font-semibold text-[#45f0d1]">
                    {initials(nome)}
                  </AvatarFallback>
                </Avatar>
                <p className="text-muted-foreground text-xs">
                  O avatar usa as iniciais do nome. Alterações ficam só neste
                  navegador (sem persistência ainda).
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nome" value={nome} onChange={setNome} />
                <Field label="E-mail" value={email} onChange={setEmail} />
                <Field label="Cargo" value={cargo} onChange={setCargo} />
              </div>
              <Button
                size="sm"
                onClick={() => toast.success("Perfil salvo localmente")}
              >
                Salvar
              </Button>
            </div>
          )}

          {active === "equipe" && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold">Equipe</h2>
              <div className="space-y-2">
                {TEAM.map((m) => (
                  <div
                    key={m.id}
                    className="border-border flex items-center justify-between gap-3 rounded-xl border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback
                          className="text-[11px] font-semibold"
                          style={{
                            backgroundColor: `${m.cor}22`,
                            color: m.cor,
                          }}
                        >
                          {m.iniciais}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{m.nome}</span>
                    </div>
                    <StatusPill color="green">Ativo</StatusPill>
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground text-xs">
                Cadastro, papéis e permissões chegam no módulo de Administração.
              </p>
            </div>
          )}

          {active === "integracoes" && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold">Integrações</h2>
              <p className="text-muted-foreground text-xs">
                Mapa do que já existe (via o gerador de propostas) e do que
                ainda falta conectar.
              </p>
              <div className="space-y-2">
                <GoogleCalendarRow googleCalendar={googleCalendar} />
                <IntegrationRow
                  icon={HardDrive}
                  nome="Google Drive"
                  conectado={false}
                >
                  Requer configuração OAuth.
                </IntegrationRow>
                <IntegrationRow
                  icon={CreditCard}
                  nome="Asaas"
                  conectado={true}
                >
                  Gera as cobranças quando uma proposta é aceita.
                </IntegrationRow>
                <IntegrationRow
                  icon={Sparkles}
                  nome="Gemini AI"
                  conectado={true}
                >
                  Redige as propostas no gerador.
                </IntegrationRow>
              </div>
            </div>
          )}

          {active === "aparencia" && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold">Aparência</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => applyTheme("dark")}
                  className={cn(
                    "flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors",
                    theme === "dark"
                      ? "border-brand/50 bg-brand/10 text-brand"
                      : "border-border text-muted-foreground",
                  )}
                >
                  <Moon className="size-4" />
                  Escuro
                </button>
                <button
                  type="button"
                  onClick={() => applyTheme("light")}
                  className={cn(
                    "flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors",
                    theme === "light"
                      ? "border-brand/50 bg-brand/10 text-brand"
                      : "border-border text-muted-foreground",
                  )}
                >
                  <Sun className="size-4" />
                  Claro
                </button>
              </div>
              <p className="text-muted-foreground text-xs">
                A preferência fica salva neste navegador. Os canvas de Nós
                (Pipeline e Tarefas) seguem em tema escuro por design.
              </p>
            </div>
          )}

          {active === "sobre" && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold">Sobre</h2>
              <div className="flex items-center gap-2.5">
                <div className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-[#45f0d1] to-[#c9ff3f] text-sm font-bold text-[#04231d]">
                  CE
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold">Central Emerge</div>
                  <div className="text-muted-foreground text-xs">
                    Hub interno da Emerge — CRM + operações
                  </div>
                </div>
              </div>
              <dl className="text-xs">
                <div className="border-border flex justify-between border-b py-1.5">
                  <dt className="text-muted-foreground">Versão</dt>
                  <dd>{APP_VERSION}</dd>
                </div>
                <div className="border-border flex justify-between border-b py-1.5">
                  <dt className="text-muted-foreground">Fase</dt>
                  <dd>UI com dados mockados</dd>
                </div>
                <div className="flex justify-between py-1.5">
                  <dt className="text-muted-foreground">Próximo</dt>
                  <dd>Conectar Supabase</dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
