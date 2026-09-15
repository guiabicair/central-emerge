"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/status-pill";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

type SupportState = "checking" | "unsupported" | "not-configured" | "ready";

export function PushNotificationsRow() {
  const [support, setSupport] = useState<SupportState>("checking");
  const [subscribed, setSubscribed] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setSupport("unsupported");
      return;
    }
    if (!VAPID_PUBLIC_KEY) {
      setSupport("not-configured");
      return;
    }
    setSupport("ready");
    navigator.serviceWorker.getRegistration("/sw.js").then((reg) => {
      reg?.pushManager.getSubscription().then((sub) => setSubscribed(!!sub));
    });
  }, []);

  async function subscribe() {
    setPending(true);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Permissão de notificação negada.");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!),
      });
      const json = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Falha ao inscrever.");
      setSubscribed(true);
      toast.success("Notificações ativadas neste navegador.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao ativar notificações.");
    } finally {
      setPending(false);
    }
  }

  async function unsubscribe() {
    setPending(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      toast.success("Notificações desativadas neste navegador.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao desativar.");
    } finally {
      setPending(false);
    }
  }

  const description =
    support === "unsupported"
      ? "Navegador não suporta notificações push."
      : support === "not-configured"
        ? "Chaves VAPID ainda não configuradas no Vercel."
        : "Alerta quando uma rotina automática quebra ou o Gmail desconecta.";

  return (
    <div className="border-border flex items-center justify-between gap-3 rounded-xl border p-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="bg-muted text-muted-foreground grid size-8 shrink-0 place-items-center rounded-lg">
          {subscribed ? <Bell className="size-4" /> : <BellOff className="size-4" />}
        </span>
        <div className="min-w-0">
          <div className="text-sm font-medium">Notificações push</div>
          <div className="text-muted-foreground truncate text-xs">{description}</div>
        </div>
      </div>
      {support === "ready" ? (
        subscribed ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <StatusPill color="green">Ativas</StatusPill>
            <Button size="xs" variant="ghost" disabled={pending} onClick={unsubscribe}>
              Desativar
            </Button>
          </div>
        ) : (
          <Button size="xs" variant="outline" disabled={pending} onClick={subscribe}>
            Ativar
          </Button>
        )
      ) : (
        <Button size="xs" variant="outline" disabled>
          Ativar
        </Button>
      )}
    </div>
  );
}
