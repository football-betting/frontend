import Link from "next/link";

interface BottomNavProps {
  active: "dashboard" | "ranking" | "profile";
}

const ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", href: "/" },
  { id: "ranking", label: "Ranking", icon: "leaderboard", href: "/ranking" },
  { id: "profile", label: "Profile", icon: "person", href: "/profile" },
] as const;

export function BottomNav({ active }: BottomNavProps): React.ReactElement {
  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex md:hidden justify-around items-center px-margin-mobile py-2 bg-surface-container border-t border-outline-variant">
      {ITEMS.map((item) => {
        const isActive = item.id === active;
        return (
          <Link
            key={item.id}
            href={item.href}
            className={`flex flex-col items-center justify-center px-4 py-1 rounded-full transition-transform ${
              isActive
                ? "bg-secondary-container text-on-secondary-container scale-95"
                : "text-on-surface-variant hover:bg-surface-container-highest"
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {item.icon}
            </span>
            <span className="text-label-caps uppercase">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
