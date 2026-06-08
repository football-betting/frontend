// Brand logo, carried over from the EM '24 frontend: an italic bold title and
// the "a valantic guessing game" tagline (valantic extra-bold). No custom font
// is involved — the original "gilroy" class was never defined.
export function Logo(): React.ReactElement {
  return (
    <div className="text-center">
      <div className="italic text-4xl font-bold text-on-background leading-none">
        WM ’26
      </div>
      <p className="text-sm font-light text-on-surface-variant mt-xs">
        a <span className="font-extrabold text-white">valantic</span> guessing
        game
      </p>
    </div>
  );
}
