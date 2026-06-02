import { z } from "zod";

export const reminderEmailSchema = z.object({
  enabled: z.boolean(),
});

export type ReminderEmailInput = z.infer<typeof reminderEmailSchema>;
