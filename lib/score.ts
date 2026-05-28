export function computeScore(
  tipHome: number,
  tipAway: number,
  scoreHome: number,
  scoreAway: number,
): number {
  if (tipHome === scoreHome && tipAway === scoreAway) {
    return 4;
  }
  const tipDiff = tipHome - tipAway;
  const scoreDiff = scoreHome - scoreAway;
  if (tipDiff === scoreDiff) {
    return 2;
  }
  const tipWinner = Math.sign(tipDiff);
  const scoreWinner = Math.sign(scoreDiff);
  if (tipWinner === scoreWinner) {
    return 1;
  }
  return 0;
}
