import Link from "next/link";

interface TopAppBarProps {
  active: "dashboard" | "ranking" | "profile";
}

const LINKS = [
  { id: "dashboard", label: "Dashboard", href: "/" },
  { id: "ranking", label: "Ranking", href: "/ranking" },
  { id: "profile", label: "Profile", href: "/profile" },
] as const;

export function TopAppBar({ active }: TopAppBarProps): React.ReactElement {
  return (
    <header className="bg-background border-b border-outline-variant fixed top-0 left-0 w-full z-40 hidden md:block">
      <div className="flex justify-between items-center w-full px-margin-desktop h-16 max-w-(--container-max-desktop) mx-auto">
        <div className="text-headline-md font-black text-on-background tracking-tighter">
          TOURNAMENT PREDICTOR
        </div>
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
                {link.label}
              </Link>
            );
          })}
        </nav>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="text-label-caps uppercase text-on-surface-variant hover:text-primary transition-colors"
          >
            Logout
          </button>
        </form>
      </div>
    </header>
  );
}
