"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { activeChannels, remindersActive } from "@/lib/reminders";
import { EmailReminderToggle } from "@/components/settings/EmailReminderToggle";
import { PushToggle } from "@/components/settings/PushToggle";
import { ReminderSettings } from "@/components/settings/ReminderSettings";

interface ReminderPreferencesProps {
  initialLeadMinutes: number[];
  initialEmailEnabled: boolean;
  initialPushActive: boolean;
}

// Coordinates the two independent channels (email + push) and the account-wide
// lead-time toggles (FE-073). Channel state is lifted here so toggling email or
// push live-enables/disables the lead-time toggles, which are only selectable
// when at least one channel is active.
export function ReminderPreferences({
  initialLeadMinutes,
  initialEmailEnabled,
  initialPushActive,
}: ReminderPreferencesProps): React.ReactElement {
  const t = useTranslations("Settings");
  const [emailEnabled, setEmailEnabled] = useState(initialEmailEnabled);
  const [pushActive, setPushActive] = useState(initialPushActive);

  const channelActive = remindersActive(
    activeChannels({ email: emailEnabled, push: pushActive }),
  );

  return (
    <div className="space-y-lg">
      <div className="space-y-md">
        <h3 className="text-label-caps uppercase tracking-widest text-on-surface-variant">
          {t("emailHeading")}
        </h3>
        <EmailReminderToggle
          enabled={emailEnabled}
          onChange={setEmailEnabled}
        />
      </div>

      <div className="pt-lg border-t border-outline-variant space-y-md">
        <h3 className="text-label-caps uppercase tracking-widest text-on-surface-variant">
          {t("pushHeading")}
        </h3>
        <PushToggle
          initialAccountActive={initialPushActive}
          onActiveChange={setPushActive}
        />
      </div>

      <div className="pt-lg border-t border-outline-variant">
        <h3 className="text-label-caps uppercase tracking-widest text-on-surface-variant mb-md">
          {t("reminderLeadHeading")}
        </h3>
        <ReminderSettings
          initialLeadMinutes={initialLeadMinutes}
          channelActive={channelActive}
        />
      </div>
    </div>
  );
}
