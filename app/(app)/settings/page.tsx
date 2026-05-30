import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentSession } from "@/lib/session";
import { TopAppBar } from "@/components/dashboard/TopAppBar";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { PasswordChangeForm } from "@/components/settings/PasswordChangeForm";

function LogoutButton({ label }: { label: string }): React.ReactElement {
  return (
    <form action="/api/auth/logout" method="POST">
      <button
        type="submit"
        className="text-error bg-error/10 hover:bg-error/20 px-4 py-2 rounded-lg text-label-caps uppercase font-bold transition-colors active:scale-95"
      >
        {label}
      </button>
    </form>
  );
}

export default async function SettingsPage(): Promise<React.ReactElement> {
  const { user } = await getCurrentSession();
  if (!user) {
    redirect("/login");
  }
  const t = await getTranslations("Settings");

  return (
    <>
      <TopAppBar active="settings" />
      {/* Mobile header carries logout because BottomNav has none. */}
      <header className="flex md:hidden items-center justify-between px-margin-mobile h-16 border-b border-outline-variant bg-background">
        <span className="text-headline-md font-black text-on-background tracking-tighter">
          {t("title")}
        </span>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            aria-label={t("logout")}
            className="material-symbols-outlined text-primary"
          >
            logout
          </button>
        </form>
      </header>

      <main className="pt-4 md:pt-24 pb-24 md:pb-8 px-margin-mobile md:px-margin-desktop max-w-(--container-max-desktop) mx-auto">
        <div className="mb-lg">
          <h1 className="text-headline-lg font-bold mb-xs">{t("title")}</h1>
          <p className="text-body-sm text-on-surface-variant">{t("subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
          <div className="lg:col-span-5 space-y-lg">
            <section className="bg-surface-container rounded-lg p-lg border border-outline-variant">
              <h2 className="text-label-caps uppercase tracking-widest text-primary mb-lg">
                {t("identity")}
              </h2>
              <div className="flex flex-col items-center mb-xl">
                <div className="relative">
                  <div className="h-32 w-32 rounded-full border-4 border-outline-variant overflow-hidden bg-surface-container-highest flex items-center justify-center">
                    <span className="material-symbols-outlined text-[64px] text-on-surface-variant">
                      person
                    </span>
                  </div>
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 right-0 bg-surface-container-highest text-on-surface-variant p-2 rounded-full border-2 border-background"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      photo_camera
                    </span>
                  </span>
                </div>
                <button
                  type="button"
                  disabled
                  title={t("changePhotoSoon")}
                  className="mt-md text-label-caps uppercase text-on-surface-variant opacity-50 cursor-not-allowed"
                >
                  {t("changePhoto")}
                </button>
                <p className="mt-xs text-[11px] text-on-surface-variant">
                  {t("changePhotoSoon")}
                </p>
              </div>
              <div className="space-y-md">
                <div>
                  <label className="block text-label-caps uppercase text-on-surface-variant mb-xs">
                    {t("username")}
                  </label>
                  <div className="text-body-lg text-on-surface py-1">
                    {user.username}
                  </div>
                </div>
                <div>
                  <label className="block text-label-caps uppercase text-on-surface-variant mb-xs">
                    {t("email")}
                  </label>
                  <div className="text-body-lg text-on-surface py-1">
                    {user.email}
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-surface-container rounded-lg p-lg border border-outline-variant">
              <h2 className="text-label-caps uppercase tracking-widest text-on-surface-variant mb-md">
                {t("session")}
              </h2>
              <div className="flex items-center justify-between gap-md p-md bg-error-container/10 border border-error-container/30 rounded-lg">
                <div>
                  <p className="text-body-sm font-bold text-error">
                    {t("logoutHeading")}
                  </p>
                  <p className="text-[11px] text-on-surface-variant">
                    {t("logoutHint")}
                  </p>
                </div>
                <LogoutButton label={t("logout")} />
              </div>
            </section>
          </div>

          <div className="lg:col-span-7">
            <section className="bg-surface-container rounded-lg p-lg border border-outline-variant h-full">
              <h2 className="text-label-caps uppercase tracking-widest text-primary mb-lg">
                {t("security")}
              </h2>
              <PasswordChangeForm />
            </section>
          </div>
        </div>
      </main>

      <BottomNav active="profile" />
    </>
  );
}
