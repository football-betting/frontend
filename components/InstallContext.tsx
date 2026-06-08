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

interface InstallState {
  // A native install prompt was captured (Android/Chromium, app not installed).
  canInstall: boolean;
  // App is running standalone, or was installed this session.
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

// Mounted high in the tree (root layout) so the `beforeinstallprompt` event —
// which fires once, early, on the first page load — is captured even before the
// user navigates to the settings page where the install button lives.
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
    const nav = window.navigator as Navigator & { standalone?: boolean };
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      nav.standalone === true
    ) {
      setInstalled(true);
    }
    const onPrompt = (event: Event): void => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = (): void => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<void> => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }, [deferred]);

  return (
    <InstallContext.Provider
      value={{ canInstall: deferred !== null, installed, install }}
    >
      {children}
    </InstallContext.Provider>
  );
}
