import { z } from "zod";
import { REMINDER_CHANNELS } from "@/lib/reminders";

export const reminderChannelSchema = z.object({
  channel: z.enum(REMINDER_CHANNELS),
  enabled: z.boolean(),
});

export type ReminderChannelInput = z.infer<typeof reminderChannelSchema>;
