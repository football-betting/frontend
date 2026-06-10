import { afterEach, describe, expect, it } from "vitest";
import { getBrand } from "@/lib/brand";
import { isAllowedSignupEmailDomain } from "@/lib/validation/auth";

const original = process.env.NEXT_PUBLIC_BRAND;

afterEach(() => {
  if (original === undefined) {
    delete process.env.NEXT_PUBLIC_BRAND;
  } else {
    process.env.NEXT_PUBLIC_BRAND = original;
  }
});

describe("getBrand", () => {
  it("defaults to valantic when unset", () => {
    delete process.env.NEXT_PUBLIC_BRAND;
    const brand = getBrand();
    expect(brand.id).toBe("valantic");
    expect(brand.org).toBe("valantic");
    expect(brand.emailPolicy).toEqual({ allowedDomains: ["valantic.com"] });
  });

  it("selects fuhlingen when requested", () => {
    process.env.NEXT_PUBLIC_BRAND = "fuhlingen";
    const brand = getBrand();
    expect(brand.id).toBe("fuhlingen");
    expect(brand.org).toBe("fuhlingen");
    expect(brand.departments).toEqual(["A-Jugend", "Herren", "Andere"]);
    expect(brand.emailPolicy).toBe("all");
  });

  it("falls back to valantic for an unknown brand", () => {
    process.env.NEXT_PUBLIC_BRAND = "does-not-exist";
    expect(getBrand().id).toBe("valantic");
  });
});

describe("isAllowedSignupEmailDomain across brands", () => {
  it("restricts to valantic.com under the valantic brand", () => {
    delete process.env.NEXT_PUBLIC_BRAND;
    expect(isAllowedSignupEmailDomain("a@valantic.com")).toBe(true);
    expect(isAllowedSignupEmailDomain("a@gmail.com")).toBe(false);
  });

  it("accepts any valid email under the fuhlingen brand", () => {
    process.env.NEXT_PUBLIC_BRAND = "fuhlingen";
    expect(isAllowedSignupEmailDomain("a@gmail.com")).toBe(true);
    expect(isAllowedSignupEmailDomain("a@anything.example")).toBe(true);
  });
});
