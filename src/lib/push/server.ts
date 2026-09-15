import webpush from "web-push";

export interface PushPayload {
  title: string;
  body: string;
  url: string;
}

export interface StoredSubscription {
  endpoint: string;
  p256dh: string;
  auth_key: string;
}

function isConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT,
  );
}

let configured = false;
function ensureConfigured() {
  if (configured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  configured = true;
}

/**
 * Manda `payload` pra cada inscrição. Retorna os endpoints que voltaram
 * 404/410 (push service diz que a inscrição morreu) pra quem chamar
 * limpar do banco.
 */
export async function sendPushToAll(
  subscriptions: StoredSubscription[],
  payload: PushPayload,
): Promise<{ sent: number; staleEndpoints: string[] }> {
  if (!isConfigured()) {
    console.warn(
      "[push] VAPID não configurado (NEXT_PUBLIC_VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY/VAPID_SUBJECT) — notificação não enviada:",
      payload.title,
    );
    return { sent: 0, staleEndpoints: [] };
  }
  ensureConfigured();

  const body = JSON.stringify(payload);
  const staleEndpoints: string[] = [];
  let sent = 0;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth_key },
          },
          body,
        );
        sent += 1;
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          staleEndpoints.push(sub.endpoint);
        } else {
          console.error("[push] falha enviando notificação:", err);
        }
      }
    }),
  );

  return { sent, staleEndpoints };
}
