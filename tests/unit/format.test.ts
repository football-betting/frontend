import { describe, expect, it } from "vitest";
import {
  abbreviateUsername,
  extractTime,
  formatDate,
  formatDateKey,
} from "@/lib/format";

describe("formatDate", () => {
  it("formats a German locale long date string", () => {
    const date = new Date(2022, 11, 31);
    expect(formatDate(date.getTime(), "de")).toBe("Samstag, 31. Dezember 2022");
  });

  it("formats an English locale long date string", () => {
    const date = new Date(2022, 11, 31);
    expect(formatDate(date.getTime(), "en")).toBe("Saturday, December 31, 2022");
  });

  it("accepts a Date object directly", () => {
    expect(formatDate(new Date(2022, 11, 31), "de")).toBe(
      "Samstag, 31. Dezember 2022",
    );
  });
});

describe("formatDateKey", () => {
  it("formats a date as YYYY-MM-DD", () => {
    expect(formatDateKey(new Date(2022, 0, 5))).toBe("2022-01-05");
  });
});

describe("extractTime", () => {
  it("returns the German locale HH:MM string", () => {
    expect(extractTime(new Date(2022, 11, 31, 13, 45), "de")).toBe("13:45");
  });

  it("returns the English locale 12-hour string", () => {
    expect(extractTime(new Date(2022, 11, 31, 13, 45), "en")).toBe("01:45 PM");
  });
});

describe("abbreviateUsername", () => {
  it("truncates a long name to 14 chars plus ellipsis", () => {
    const longName = "verylongusernamethatistoolong";
    expect(longName.length).toBe(29);
    const result = abbreviateUsername(longName);
    expect(result).toBe("verylonguserna…");
    expect(result.length).toBe(15);
  });

  it("leaves a short name unchanged", () => {
    expect(abbreviateUsername("short")).toBe("short");
  });
});
