import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { InstallProvider } from "@/components/InstallContext";
import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  applicationName: "WM ’26",
  title: "WM ’26 — a valantic guessing game",
  description: "Office tournament pool",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "WM ’26",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#121317",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${hankenGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
        <script
          // Capture the install signal before React hydrates: `beforeinstallprompt`
          // fires once, early, and would otherwise be missed by client components.
          dangerouslySetInnerHTML={{
            __html:
              "(function(){window.__wmInstall={e:null};" +
              "addEventListener('beforeinstallprompt',function(ev){ev.preventDefault();window.__wmInstall.e=ev;dispatchEvent(new Event('wm-installable'))});" +
              "addEventListener('appinstalled',function(){window.__wmInstall.e=null;dispatchEvent(new Event('wm-installed'))})})();",
          }}
        />
      </head>
      <body>
        <NextIntlClientProvider>
          <InstallProvider>{children}</InstallProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
