import { z } from "zod";
import { REMINDER_LEAD_MINUTES, isValidLeadMinutes } from "@/lib/reminders";

export const remindersSchema = z.object({
  leadMinutes: z
    .array(
      z
        .number()
        .int()
        .refine(isValidLeadMinutes, { message: "invalidInput" }),
    )
    .max(REMINDER_LEAD_MINUTES.length, { message: "invalidInput" }),
});

export type RemindersInput = z.infer<typeof remindersSchema>;
