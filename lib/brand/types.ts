export type EmailPolicy = "all" | { allowedDomains: readonly string[] };

export interface Brand {
  /** Brand id; drives the `data-brand` attribute on <html> and brand selection. */
  id: string;
  /** Sponsor / organisation name shown in tagline, copyright and email hints. */
  org: string;
  /** Non-empty department list offered at signup and used for ranking groups. */
  departments: readonly [string, ...string[]];
  /** `"all"` allows any valid email; otherwise only the listed domains. */
  emailPolicy: EmailPolicy;
  githubUrl: string;
  assets: {
    /** PWA manifest icons. */
    icon192: string;
    icon512: string;
    iconMaskable512: string;
    /** Browser-tab favicon + apple touch icon. */
    favicon: string;
    appleIcon: string;
    /** Page background (desktop / mobile). */
    bgDesktop: string;
    bgMobile: string;
  };
  /** PWA manifest + theme-color (matches the theme surface). */
  themeColor: string;
}
