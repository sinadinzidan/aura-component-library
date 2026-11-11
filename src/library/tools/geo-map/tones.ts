import type { DotShape, Tone } from '../../industrial/status';

const SEVERITY: Readonly<Record<Tone, number>> = { critical: 4, warning: 3, info: 2, success: 1, neutral: 0 };

/** The most urgent of some tones: critical, then warning, info, success, neutral. */
export function worstTone(tones: readonly Tone[]): Tone {
  return tones.reduce<Tone>((worst, tone) => (SEVERITY[tone] > SEVERITY[worst] ? tone : worst), 'neutral');
}

/** The tone and shape of the most urgent item; the first wins a tie. */
export function worstOf<T extends { tone: Tone; shape: DotShape }>(items: readonly T[]): T | undefined {
  return items.reduce<T | undefined>((worst, item) => (worst === undefined || SEVERITY[item.tone] > SEVERITY[worst.tone] ? item : worst), undefined);
}

/** The radius of a marker for a weight, growing with the square root so area follows the value. */
export function markerRadius(weight: number, maxWeight: number, smallest = 5, largest = 13): number {
  if (!(maxWeight > 0) || !(weight > 0)) return smallest;
  return smallest + (largest - smallest) * Math.sqrt(Math.min(1, weight / maxWeight));
}

/** One sentence for assistive technology after the view changes. */
export function describeView(options: { zoom: number; centre: string; markers: number; groups: number; projection: string }): string {
  const { zoom, centre, markers, groups, projection } = options;
  const clustered = groups < markers ? ` in ${groups} ${groups === 1 ? 'group' : 'groups'}` : '';
  return `${projection}, zoom ${zoom.toFixed(1)}, centred on ${centre}. ${markers} ${markers === 1 ? 'site' : 'sites'} in view${clustered}.`;
}
