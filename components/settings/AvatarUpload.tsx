"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import { Avatar } from "@/components/Avatar";
import { ALLOWED_AVATAR_TYPES, MAX_AVATAR_BYTES } from "@/lib/avatar";

interface AvatarUploadProps {
  avatarPath: string | null | undefined;
  email: string;
}

export function AvatarUpload({
  avatarPath,
  email,
}: AvatarUploadProps): React.ReactElement {
  const t = useTranslations("Settings");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  async function onChange(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    setError(null);
    const file = event.target.files?.[0];
    if (!file) return;

    if (!(ALLOWED_AVATAR_TYPES as readonly string[]).includes(file.type)) {
      setError(t("avatarTypeError"));
      event.target.value = "";
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError(t("avatarSizeError"));
      event.target.value = "";
      return;
    }

    const data = new FormData();
    data.append("avatar", file);

    setPending(true);
    try {
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        let next: string | null = null;
        try {
          const body: unknown = await res.json();
          if (
            body &&
            typeof body === "object" &&
            "avatar" in body &&
            typeof (body as { avatar: unknown }).avatar === "string"
          ) {
            next = `${(body as { avatar: string }).avatar}?t=${Date.now()}`;
          }
        } catch {
          // ignore parse error, fall back to router refresh
        }
        if (next) setPreview(next);
        router.refresh();
        return;
      }
      let message = t("avatarUploadFailed");
      try {
        const body: unknown = await res.json();
        if (
          body &&
          typeof body === "object" &&
          "error" in body &&
          typeof (body as { error: unknown }).error === "string"
        ) {
          message = (body as { error: string }).error;
        }
      } catch {
        // ignore parse error, fall back to default
      }
      setError(message);
    } catch {
      setError(t("networkError"));
    } finally {
      setPending(false);
      event.target.value = "";
    }
  }

  return (
    <div className="flex flex-col items-center mb-xl">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        aria-label={t("changePhoto")}
        className="group relative rounded-full cursor-pointer disabled:cursor-default disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Avatar
          avatarPath={preview ?? avatarPath}
          email={email}
          size={128}
          className="border-4 border-outline-variant"
        />
        <span
          aria-hidden="true"
          className="absolute bottom-0 right-0 bg-surface-container-highest text-on-surface-variant p-2 rounded-full border-2 border-background transition-colors group-hover:bg-primary group-hover:text-on-primary"
        >
          <span className="material-symbols-outlined text-[20px]">
            photo_camera
          </span>
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={onChange}
        disabled={pending}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        className="mt-md text-label-caps uppercase text-primary hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
      >
        {pending ? (
          <span className="material-symbols-outlined animate-spin text-[18px] align-middle">
            progress_activity
          </span>
        ) : (
          t("changePhoto")
        )}
      </button>
      <p className="mt-xs text-[11px] text-on-surface-variant">
        {t("avatarHint")}
      </p>
      {error ? (
        <p
          aria-live="polite"
          className="mt-sm text-body-sm text-error border border-error/40 bg-error-container/20 px-md py-sm rounded-lg"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
