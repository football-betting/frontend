import { getBrand } from "@/lib/brand";

// Brand logo, carried over from the EM '24 frontend: an italic bold title and
// the "a <org> guessing game" tagline (org name extra-bold). No custom font is
// involved — the original "gilroy" class was never defined.
export function Logo(): React.ReactElement {
  const { org } = getBrand();
  return (
    <div className="text-center">
      <div className="italic text-4xl font-bold text-on-background leading-none">
        WM ’26
      </div>
      <p className="text-sm font-light text-on-surface-variant mt-xs">
        a <span className="font-extrabold text-white">{org}</span> guessing game
      </p>
    </div>
  );
}
