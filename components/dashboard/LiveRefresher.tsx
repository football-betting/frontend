"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface LiveRefresherProps {
  isLive: boolean;
  nextKickoff: number | null;
  intervalMs?: number;
}

const DEFAULT_INTERVAL_MS = 60000;

export function LiveRefresher({
  isLive,
  nextKickoff,
  intervalMs = DEFAULT_INTERVAL_MS,
}: LiveRefresherProps): React.ReactElement | null {
  const router = useRouter();

  useEffect(() => {
    if (!isLive && nextKickoff === null) {
      return;
    }

    let pollId: ReturnType<typeof setInterval> | null = null;
    let kickoffTimer: ReturnType<typeof setTimeout> | null = null;

    const startPolling = (): void => {
      if (pollId === null) {
        pollId = setInterval(() => router.refresh(), intervalMs);
      }
    };

    if (isLive) {
      startPolling();
    } else if (nextKickoff !== null) {
      const delay = nextKickoff - Date.now();
      if (delay <= 0) {
        router.refresh();
      } else {
        kickoffTimer = setTimeout(() => {
          startPolling();
          router.refresh();
        }, delay);
      }
    }

    const onActive = (): void => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    };

    document.addEventListener("visibilitychange", onActive);
    window.addEventListener("focus", onActive);

    return () => {
      if (pollId !== null) clearInterval(pollId);
      if (kickoffTimer !== null) clearTimeout(kickoffTimer);
      document.removeEventListener("visibilitychange", onActive);
      window.removeEventListener("focus", onActive);
    };
  }, [isLive, nextKickoff, intervalMs, router]);

  return null;
}
