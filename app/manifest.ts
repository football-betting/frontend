import type { MetadataRoute } from "next";
import { getBrand } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  const brand = getBrand();
  return {
    name: `WM ’26 — a ${brand.org} guessing game`,
    short_name: "WM ’26",
    description: `a ${brand.org} guessing game`,
    start_url: "/",
    display: "standalone",
    background_color: brand.themeColor,
    theme_color: brand.themeColor,
    icons: [
      {
        src: brand.assets.icon192,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: brand.assets.icon512,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: brand.assets.iconMaskable512,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
