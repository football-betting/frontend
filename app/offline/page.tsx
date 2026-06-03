"use client";

import { useTranslations } from "next-intl";

// The offline page is served by the service worker when the device is offline,
// so it must render correctly without any external CSS or web font. Everything
// here is inline (an inline SVG icon + inline styles) and self-contained.
export default function OfflinePage(): React.ReactElement {
  const t = useTranslations("Offline");

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.25rem",
        padding: "2rem 1.5rem",
        textAlign: "center",
        background: "#121317",
        color: "#e3e2e6",
        fontFamily:
          "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "5rem",
          height: "5rem",
          borderRadius: "9999px",
          background: "#1e2025",
          border: "1px solid #2c2f36",
        }}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9aa0aa"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M1 1l22 22" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      </span>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
        {t("title")}
      </h1>
      <p
        style={{
          fontSize: "0.95rem",
          lineHeight: 1.5,
          color: "#9aa0aa",
          maxWidth: "24rem",
          margin: 0,
        }}
      >
        {t("description")}
      </p>
    </main>
  );
}
