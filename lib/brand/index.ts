import type { Brand } from "@/lib/brand/types";
import { valantic } from "@/lib/brand/brands/valantic";
import { fuhlingen } from "@/lib/brand/brands/fuhlingen";

const BRANDS: Record<string, Brand> = { valantic, fuhlingen };

/**
 * Active brand, selected at build time by `NEXT_PUBLIC_BRAND`. The value is
 * intentionally public (it shapes the visible identity), so the `NEXT_PUBLIC_`
 * prefix is deliberate. Defaults to `valantic`.
 */
export function getBrand(): Brand {
  const id = process.env.NEXT_PUBLIC_BRAND ?? "valantic";
  return BRANDS[id] ?? valantic;
}

export type { Brand, EmailPolicy } from "@/lib/brand/types";
