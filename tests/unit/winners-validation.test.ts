import { describe, expect, it } from "vitest";
import { winnersSchema } from "@/lib/validation/winners";

describe("winnersSchema", () => {
  it("accepts a valid payload with winner !== secretWinner", () => {
    const result = winnersSchema.safeParse({
      winner: "DEU",
      secretWinner: "ESP",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when winner equals secretWinner", () => {
    const result = winnersSchema.safeParse({
      winner: "DEU",
      secretWinner: "DEU",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) =>
        i.path.includes("secretWinner"),
      );
      expect(issue?.message).toBe("winnersMustDiffer");
    }
  });

  it("rejects an unknown team code", () => {
    const result = winnersSchema.safeParse({
      winner: "ZZZ",
      secretWinner: "ESP",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when a field is missing", () => {
    const result = winnersSchema.safeParse({ winner: "DEU" });
    expect(result.success).toBe(false);
  });

  it("rejects when winner is not a string", () => {
    const result = winnersSchema.safeParse({
      winner: 123,
      secretWinner: "ESP",
    });
    expect(result.success).toBe(false);
  });
});
