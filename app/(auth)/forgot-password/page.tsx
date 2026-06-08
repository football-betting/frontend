import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/Logo";
import { getCurrentSession } from "@/lib/session";
import { ForgotPasswordForm } from "./forgot-password-form";

export default async function ForgotPasswordPage(): Promise<React.ReactElement> {
  const { user } = await getCurrentSession();
  if (user) {
    redirect("/");
  }

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
          <Logo />
          <p className="text-body-sm text-on-surface-variant mt-xs opacity-60">
            {t("forgotPasswordTitle")}
          </p>
        </div>

        <div className="bg-surface-container border border-outline-variant rounded-lg p-xl shadow-2xl">
          <ForgotPasswordForm />

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
