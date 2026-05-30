export function computeScore(
  tipHome: number,
  tipAway: number,
  scoreHome: number,
  scoreAway: number,
): number {
  if (tipHome === scoreHome && tipAway === scoreAway) {
    return 5;
  }
  const tipDiff = tipHome - tipAway;
  const scoreDiff = scoreHome - scoreAway;
  if (tipDiff === scoreDiff) {
    return scoreHome === scoreAway ? 2 : 3;
  }
  if (Math.sign(tipDiff) === Math.sign(scoreDiff)) {
    return 2;
  }
  return 0;
}
