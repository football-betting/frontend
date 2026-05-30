import { describe, expect, it } from "vitest";
import { tlaToIso2 } from "@/lib/flag";

describe("tlaToIso2", () => {
  it("maps the demo FIFA codes to ISO-3166-1 alpha-2", () => {
    expect(tlaToIso2("GER")).toBe("de");
    expect(tlaToIso2("ESP")).toBe("es");
    expect(tlaToIso2("FRA")).toBe("fr");
    expect(tlaToIso2("ITA")).toBe("it");
    expect(tlaToIso2("POR")).toBe("pt");
    expect(tlaToIso2("NED")).toBe("nl");
    expect(tlaToIso2("POL")).toBe("pl");
    expect(tlaToIso2("CRO")).toBe("hr");
  });

  it("maps non-European WM-2026 contenders", () => {
    expect(tlaToIso2("BRA")).toBe("br");
    expect(tlaToIso2("ARG")).toBe("ar");
    expect(tlaToIso2("USA")).toBe("us");
    expect(tlaToIso2("JPN")).toBe("jp");
    expect(tlaToIso2("MEX")).toBe("mx");
    expect(tlaToIso2("KOR")).toBe("kr");
  });

  it("maps UK subdivisions to flag-icons subdivision codes", () => {
    expect(tlaToIso2("ENG")).toBe("gb-eng");
    expect(tlaToIso2("SCO")).toBe("gb-sct");
    expect(tlaToIso2("WAL")).toBe("gb-wls");
    expect(tlaToIso2("NIR")).toBe("gb-nir");
  });

  it("accepts ISO-3166-1 alpha-3 codes as well", () => {
    expect(tlaToIso2("DEU")).toBe("de");
    expect(tlaToIso2("NLD")).toBe("nl");
    expect(tlaToIso2("HRV")).toBe("hr");
  });

  it("is case-insensitive", () => {
    expect(tlaToIso2("ger")).toBe("de");
    expect(tlaToIso2("Bra")).toBe("br");
  });

  it("returns undefined for an unknown code (placeholder path)", () => {
    expect(tlaToIso2("XYZ")).toBeUndefined();
    expect(tlaToIso2("")).toBeUndefined();
  });
});
