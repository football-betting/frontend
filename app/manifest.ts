import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tournament Predictor",
    short_name: "Predictor",
    description: "Office tournament pool",
    start_url: "/",
    display: "standalone",
    background_color: "#121317",
    theme_color: "#121317",
    icons: [
      {
        src: "/icon/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
