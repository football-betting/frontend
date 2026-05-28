export type ScoreTone = "success" | "warning" | "neutral" | "danger";

export function scoreColor(points: number): ScoreTone {
  if (points === 4) return "success";
  if (points === 2) return "warning";
  if (points === 0) return "danger";
  return "neutral";
}

export function scoreToneClass(tone: ScoreTone): string {
  switch (tone) {
    case "success":
      return "text-success";
    case "warning":
      return "text-warning";
    case "danger":
      return "text-danger";
    case "neutral":
    default:
      return "text-neutral";
  }
}
