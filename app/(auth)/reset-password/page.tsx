import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentSession } from "@/lib/session";
import { ResetPasswordForm } from "./reset-password-form";

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps): Promise<React.ReactElement> {
  const { user } = await getCurrentSession();
  if (user) {
    redirect("/");
  }

  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  const t = await getTranslations("Auth");

  return (
    <main
      className="flex min-h-screen items-center justify-center p-margin-mobile md:p-0"
      style={{
        background:
          "radial-gradient(circle at 50% -20%, #292a2e 0%, #121317 70%)",
      }}
    >
      <div className="w-full max-w-[440px] z-10">
        <div className="mb-lg text-center">
          <h1 className="text-headline-lg font-black text-on-background uppercase tracking-tighter">
            {t("appName")}
          </h1>
          <p className="text-body-sm text-on-surface-variant mt-xs opacity-60">
            {t("resetPasswordTitle")}
          </p>
        </div>

        <div className="bg-surface-container border border-outline-variant rounded-lg p-xl shadow-2xl">
          {token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <p
              aria-live="polite"
              className="text-body-sm text-error border border-error/40 bg-error-container/20 px-md py-sm"
            >
              {t("resetTokenMissing")}
            </p>
          )}

          <div className="text-center pt-lg">
            <Link
              className="text-secondary text-label-caps uppercase hover:text-tertiary transition-colors border-b border-transparent hover:border-tertiary pb-1"
              href="/login"
            >
              {t("backToLogin")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
