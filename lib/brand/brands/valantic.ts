import type { Brand } from "@/lib/brand/types";

export const valantic: Brand = {
  id: "valantic",
  org: "valantic",
  departments: ["Langenfeld", "Mannheim", "Mainz", "Siegen"],
  emailPolicy: { allowedDomains: ["valantic.com"] },
  displayFullEmail: false,
  githubUrl: "https://github.com/football-betting",
  assets: {
    icon192: "/icon/icon-192.png",
    icon512: "/icon/icon-512.png",
    iconMaskable512: "/icon/icon-maskable-512.png",
    favicon: "/brands/valantic/icon.png",
    appleIcon: "/brands/valantic/apple-icon.png",
    bgDesktop: "/img/bg2.png",
    bgMobile: "/img/bg1.png",
  },
  themeColor: "#121317",
};
