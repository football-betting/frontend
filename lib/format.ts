export function formatDate(ts: Date | number): string {
  const d = ts instanceof Date ? ts : new Date(ts);
  return d.toLocaleDateString("de-DE", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
}

export function formatDateKey(ts: Date | number): string {
  const d = ts instanceof Date ? ts : new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function extractTime(ts: Date | number): string {
  const d = ts instanceof Date ? ts : new Date(ts);
  return d.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function abbreviateUsername(name: string): string {
  if (name.length > 17) {
    return name.slice(0, 14) + "…";
  }
  return name;
}
