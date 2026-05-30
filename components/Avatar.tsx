import { displayNameFromEmail } from "@/lib/user-name";
import { decideAvatarMode, initialsFromName } from "@/lib/avatar";

interface AvatarProps {
  avatarPath: string | null | undefined;
  email: string;
  name?: string;
  size: number;
  className?: string;
}

export function Avatar({
  avatarPath,
  email,
  name,
  size,
  className,
}: AvatarProps): React.ReactElement {
  const displayName = (name ?? displayNameFromEmail(email)).trim();
  const initials = initialsFromName(displayName);
  const mode = decideAvatarMode({ avatarPath, initials });

  const dimension = `${size}px`;
  const wrapperClass = [
    "rounded-full overflow-hidden bg-surface-container-highest flex items-center justify-center text-on-surface-variant",
    className ?? "",
  ]
    .filter((c) => c.length > 0)
    .join(" ");

  const label = displayName.length > 0 ? displayName : email;

  if (mode === "photo" && avatarPath) {
    return (
      <span
        className={wrapperClass}
        style={{ width: dimension, height: dimension }}
      >
        <img
          src={avatarPath}
          alt={label}
          width={size}
          height={size}
          className="h-full w-full object-cover"
        />
      </span>
    );
  }

  if (mode === "initials") {
    return (
      <span
        role="img"
        aria-label={label}
        className={wrapperClass}
        style={{
          width: dimension,
          height: dimension,
          fontSize: `${Math.round(size * 0.4)}px`,
        }}
      >
        <span aria-hidden="true" className="font-bold uppercase">
          {initials}
        </span>
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label={label}
      className={wrapperClass}
      style={{ width: dimension, height: dimension }}
    >
      <span
        aria-hidden="true"
        className="material-symbols-outlined"
        style={{ fontSize: `${Math.round(size * 0.5)}px` }}
      >
        person
      </span>
    </span>
  );
}
