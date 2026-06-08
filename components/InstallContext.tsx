"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Set up by the inline head script in the root layout, which captures
// `beforeinstallprompt` before React hydrates (the event fires once, early).
type InstallWindow = Window & {
  __wmInstall?: { e: BeforeInstallPromptEvent | null };
};

type RelatedAppsNavigator = Navigator & {
  standalone?: boolean;
  getInstalledRelatedApps?: () => Promise<unknown[]>;
};

interface InstallState {
  // A native install prompt was captured (Android/Chromium, app not installed).
  canInstall: boolean;
  // App is running standalone, or is already installed on this device.
  installed: boolean;
  install: () => Promise<void>;
}

const InstallContext = createContext<InstallState>({
  canInstall: false,
  installed: false,
  install: async () => {},
});

export function useInstall(): InstallState {
  return useContext(InstallContext);
}

// Mounted high in the tree (root layout). Adopts the install signal captured by
// the inline head script and tracks whether the app is already installed, so the
// settings install card only offers an install when one is genuinely possible.
export function InstallProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const w = window as InstallWindow;
    const nav = window.navigator as RelatedAppsNavigator;

    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      nav.standalone === true
    ) {
      setInstalled(true);
    }
    // Adopt a prompt the head script captured before this component mounted.
    if (w.__wmInstall?.e) setDeferred(w.__wmInstall.e);

    const onInstallable = (): void => {
      if (w.__wmInstall?.e) setDeferred(w.__wmInstall.e);
    };
    const onPrompt = (event: Event): void => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = (): void => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("wm-installable", onInstallable);
    window.addEventListener("wm-installed", onInstalled);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // The PWA is already installed on this device — don't offer to install it.
    if (typeof nav.getInstalledRelatedApps === "function") {
      nav
        .getInstalledRelatedApps()
        .then((apps) => {
          if (apps.length > 0) setInstalled(true);
        })
        .catch(() => {});
    }

    return () => {
      window.removeEventListener("wm-installable", onInstallable);
      window.removeEventListener("wm-installed", onInstalled);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<void> => {
    const w = window as InstallWindow;
    const event = deferred ?? w.__wmInstall?.e ?? null;
    if (!event) return;
    await event.prompt();
    await event.userChoice;
    setDeferred(null);
    if (w.__wmInstall) w.__wmInstall.e = null;
  }, [deferred]);

  return (
    <InstallContext.Provider
      value={{ canInstall: deferred !== null, installed, install }}
    >
      {children}
    </InstallContext.Provider>
  );
}
