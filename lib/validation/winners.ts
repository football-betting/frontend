import { z } from "zod";
import { TEAM_CODES } from "@/lib/data/teams";

export const winnersSchema = z
  .object({
    winner: z.enum(TEAM_CODES as unknown as [string, ...string[]], {
      message: "winner",
    }),
    secretWinner: z.enum(TEAM_CODES as unknown as [string, ...string[]], {
      message: "secretWinner",
    }),
  })
  .refine((data) => data.winner !== data.secretWinner, {
    message: "Winner and secret winner must differ.",
    path: ["secretWinner"],
  });

export type WinnersInput = z.infer<typeof winnersSchema>;
