export function displayNameFromEmail(email: string): string {
  const localPart = email.split("@")[0] ?? "";
  return localPart
    .split(".")
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
