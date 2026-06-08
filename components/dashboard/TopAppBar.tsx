import Link from "next/link";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

interface TopAppBarProps {
  active: "dashboard" | "ranking" | "profile" | "settings";
}

const LINKS = [
  { id: "dashboard", href: "/" },
  { id: "ranking", href: "/ranking" },
  { id: "profile", href: "/profile" },
] as const;

export function TopAppBar({ active }: TopAppBarProps): React.ReactElement {
  const t = useTranslations("Nav");
  return (
    <header className="bg-background border-b border-outline-variant fixed top-0 left-0 w-full z-40 hidden md:block">
      <div className="flex justify-between items-center w-full px-margin-desktop h-16 max-w-(--container-max-desktop) mx-auto">
        <Link
          href="/"
          className="text-headline-md italic font-black text-on-background tracking-tighter hover:text-primary transition-colors"
        >
          {t("title")}
        </Link>
        <nav className="flex gap-lg">
          {LINKS.map((link) => {
            const isActive = link.id === active;
            return (
              <Link
                key={link.id}
                href={link.href}
                className={`text-label-caps uppercase pb-1 transition-colors ${
                  isActive
                    ? "text-primary border-b-2 border-primary"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                {t(link.id)}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-lg">
          <Link
            href="/settings"
            className={`text-label-caps uppercase pb-1 transition-colors ${
              active === "settings"
                ? "text-primary border-b-2 border-primary"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            {t("settings")}
          </Link>
          <LocaleSwitcher />
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="text-label-caps uppercase text-on-surface-variant hover:text-primary transition-colors"
            >
              {t("logout")}
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
