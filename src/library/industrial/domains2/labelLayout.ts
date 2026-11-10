/**
 * Moves labels on a shared axis apart until none are closer than `minGap`, keeping their order
 * and staying inside `min`–`max` where that is possible. Positions must be sorted ascending.
 * Used where labels sit at data positions (depths, times) that can fall arbitrarily close.
 */
export function spreadPositions(positions: readonly number[], minGap: number, min = 0, max = 100): number[] {
  const spread = positions.map((position) => Math.max(min, position));
  for (let index = 1; index < spread.length; index += 1) {
    spread[index] = Math.max(spread[index], spread[index - 1] + minGap);
  }
  const last = spread.length - 1;
  if (last >= 0 && spread[last] > max) {
    spread[last] = Math.max(max, min + last * minGap);
    for (let index = last - 1; index >= 0; index -= 1) {
      spread[index] = Math.min(spread[index], spread[index + 1] - minGap);
    }
  }
  return spread;
}
