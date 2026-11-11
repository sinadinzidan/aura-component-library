/** A fill fraction as a whole percentage, clamped to 0–100. Anything that is not a number reads as empty. */
export function levelPercent(fill: number): number {
  if (!Number.isFinite(fill)) return 0;
  return Math.round(Math.min(1, Math.max(0, fill)) * 100);
}
