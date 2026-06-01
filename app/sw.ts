import { defaultCache } from "@serwist/next/worker";
import type {
  PrecacheEntry,
  RuntimeCaching,
  SerwistGlobalConfig,
} from "serwist";
import { NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const apiNetworkOnly: RuntimeCaching = {
  matcher: ({ sameOrigin, url: { pathname } }) =>
    sameOrigin && pathname.startsWith("/api/"),
  handler: new NetworkOnly(),
};

const runtimeCaching: RuntimeCaching[] = [apiNetworkOnly, ...defaultCache];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: {
    cleanupOutdatedCaches: true,
    navigateFallback: "/offline",
    navigateFallbackAllowlist: [/^\/(?!api\/).*/],
  },
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  disableDevLogs: true,
  runtimeCaching,
});

serwist.addEventListeners();

// Web Push (FE-060). Custom listeners coexist with Serwist's own. The cron
// sends a JSON body of `{ title, body, url }` (see lib/push.ts).
interface PushPayload {
  title: string;
  body: string;
  url: string;
}

function parsePushPayload(data: PushEvent["data"]): PushPayload {
  const fallback: PushPayload = {
    title: "Tipp-Erinnerung",
    body: "",
    url: "/",
  };
  if (!data) return fallback;
  try {
    const raw: unknown = data.json();
    if (raw && typeof raw === "object") {
      const obj = raw as Record<string, unknown>;
      return {
        title: typeof obj.title === "string" ? obj.title : fallback.title,
        body: typeof obj.body === "string" ? obj.body : fallback.body,
        url: typeof obj.url === "string" ? obj.url : fallback.url,
      };
    }
  } catch {
    // Non-JSON payload: fall back to plain text body if present.
    const text = data.text();
    if (text) return { ...fallback, body: text };
  }
  return fallback;
}

self.addEventListener("push", (event: PushEvent) => {
  const payload = parsePushPayload(event.data);
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      data: { url: payload.url },
      icon: "/icon/icon-192.png",
      badge: "/icon/icon-192.png",
    }),
  );
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const data = event.notification.data as { url?: unknown } | null;
  const targetUrl =
    data && typeof data.url === "string" && data.url.length > 0
      ? data.url
      : "/";
  event.waitUntil(
    (async () => {
      const target = new URL(targetUrl, self.location.origin);
      const clientList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of clientList) {
        if (new URL(client.url).href === target.href && "focus" in client) {
          await client.focus();
          return;
        }
      }
      await self.clients.openWindow(target.href);
    })(),
  );
});
