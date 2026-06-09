import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentSession } from "@/lib/session";
import { getUserById } from "@/lib/user";
import { TopAppBar } from "@/components/dashboard/TopAppBar";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { PasswordChangeForm } from "@/components/settings/PasswordChangeForm";
import { AvatarUpload } from "@/components/settings/AvatarUpload";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { DepartmentSwitcher } from "@/components/settings/DepartmentSwitcher";
import { InstallApp } from "@/components/InstallApp";
import { ReminderPreferences } from "@/components/settings/ReminderPreferences";
import {
  getEnabledLeadMinutes,
  isEmailEnabled,
} from "@/lib/reminder-store";
import { userHasPushSubscription } from "@/lib/push-store";

function LogoutButton({ label }: { label: string }): React.ReactElement {
  return (
    <form action="/api/auth/logout" method="POST">
      <button
        type="submit"
        className="text-on-surface-variant bg-surface-container-highest hover:bg-surface-bright border border-outline-variant px-4 py-2 rounded-lg text-label-caps uppercase font-bold transition-colors active:scale-95"
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
  const emailEnabled = await isEmailEnabled(Number(user.id));
  const pushActive = await userHasPushSubscription(Number(user.id));
  const t = await getTranslations("Settings");

  return (
    <>
      <TopAppBar active="settings" />

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
              <div className="flex items-center justify-between gap-md p-md bg-surface-container-highest border border-outline-variant rounded-lg">
                <div>
                  <p className="text-body-sm font-bold text-on-surface">
                    {t("logoutHeading")}
                  </p>
                  <p className="text-[11px] text-on-surface-variant">
                    {t("logoutHint")}
                  </p>
                </div>
                <LogoutButton label={t("logout")} />
              </div>
            </section>

            <section className="bg-surface-container rounded-lg p-lg border border-outline-variant">
              <h2 className="text-label-caps uppercase tracking-widest text-primary mb-lg">
                {t("language")}
              </h2>
              <div className="flex items-center justify-between gap-md p-md bg-surface-container-highest border border-outline-variant rounded-lg">
                <p className="text-body-sm text-on-surface-variant">
                  {t("languageHint")}
                </p>
                <LocaleSwitcher />
              </div>
            </section>

            <section className="bg-surface-container rounded-lg p-lg border border-outline-variant">
              <h2 className="text-label-caps uppercase tracking-widest text-primary mb-lg">
                {t("location")}
              </h2>
              <div className="flex items-center justify-between gap-md p-md bg-surface-container-highest border border-outline-variant rounded-lg">
                <p className="text-body-sm text-on-surface-variant">
                  {t("locationHint")}
                </p>
                <DepartmentSwitcher current={localUser?.department ?? ""} />
              </div>
            </section>

            <InstallApp />
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
              <ReminderPreferences
                initialLeadMinutes={enabledLeadMinutes}
                initialEmailEnabled={emailEnabled}
                initialPushActive={pushActive}
              />
            </section>
          </div>
        </div>
      </main>

      <BottomNav active="settings" />
    </>
  );
}
