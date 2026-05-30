export interface TipScore {
  scoreHome: number;
  scoreAway: number;
}

// A tip starts in view mode only when one already exists to display.
// With no existing tip there is nothing to view, so we open the form.
export function initialTipEditing(initialTip: TipScore | null): boolean {
  return initialTip === null;
}

export function formatTipScore(score: TipScore): string {
  return `${score.scoreHome} : ${score.scoreAway}`;
}
