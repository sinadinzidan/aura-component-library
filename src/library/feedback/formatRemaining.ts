/** Turns seconds left into a short, honest estimate: "Less than a minute left", "About 4 min left". */
export function formatRemaining(secondsLeft: number): string {
  if (!Number.isFinite(secondsLeft) || secondsLeft < 0) return 'Estimating time left…';
  if (secondsLeft === 0) return 'Done';
  if (secondsLeft < 60) return 'Less than a minute left';
  const minutes = Math.round(secondsLeft / 60);
  if (minutes < 60) return `About ${minutes} min left`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `About ${hours} h left` : `About ${hours} h ${rest} min left`;
}
