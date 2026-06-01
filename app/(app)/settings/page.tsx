import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentSession } from "@/lib/session";
import { getUserById } from "@/lib/user";
import { TopAppBar } from "@/components/dashboard/TopAppBar";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { PasswordChangeForm } from "@/components/settings/PasswordChangeForm";
import { AvatarUpload } from "@/components/settings/AvatarUpload";
import { ReminderSettings } from "@/components/settings/ReminderSettings";
import { PushToggle } from "@/components/settings/PushToggle";
import {
  getEnabledChannels,
  getEnabledLeadMinutes,
} from "@/lib/reminder-store";

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
  const localUser = await getUserById(Number(user.id));
  const enabledLeadMinutes = await getEnabledLeadMinutes(Number(user.id));
  const enabledChannels = await getEnabledChannels(Number(user.id));
  const pushEnabled = enabledChannels.includes("push");
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
              <AvatarUpload
                avatarPath={localUser?.avatar}
                email={user.email}
              />
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

          <div className="lg:col-span-7 space-y-lg">
            <section className="bg-surface-container rounded-lg p-lg border border-outline-variant">
              <h2 className="text-label-caps uppercase tracking-widest text-primary mb-lg">
                {t("security")}
              </h2>
              <PasswordChangeForm />
            </section>

            <section className="bg-surface-container rounded-lg p-lg border border-outline-variant">
              <h2 className="text-label-caps uppercase tracking-widest text-primary mb-lg">
                {t("reminders")}
              </h2>
              <ReminderSettings initialLeadMinutes={enabledLeadMinutes} />
              <div className="mt-lg pt-lg border-t border-outline-variant">
                <h3 className="text-label-caps uppercase tracking-widest text-on-surface-variant mb-md">
                  {t("pushHeading")}
                </h3>
                <PushToggle initialEnabled={pushEnabled} />
              </div>
            </section>
          </div>
        </div>
      </main>

      <BottomNav active="profile" />
    </>
  );
}
