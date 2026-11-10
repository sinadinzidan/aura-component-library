import type { DotShape, Tone } from '../status';

export type ComplianceLimit = {
  /** The reading must stay at or below this. */
  max?: number;
  /** The reading must stay at or above this. */
  min?: number;
};

export type ComplianceVerdict = 'within' | 'close' | 'exceeded';

export type ComplianceResult = {
  verdict: ComplianceVerdict;
  tone: Tone;
  label: string;
  shape: DotShape;
  /** Distance to the nearest limit in the reading's unit; negative once it is breached. */
  margin: number | null;
};

const DESCRIPTOR: Record<ComplianceVerdict, { tone: Tone; label: string; shape: DotShape }> = {
  within: { tone: 'success', label: 'Within limit', shape: 'dot' },
  close: { tone: 'warning', label: 'Close to limit', shape: 'square' },
  exceeded: { tone: 'critical', label: 'Limit exceeded', shape: 'diamond' },
};

/**
 * Judges a reading against a regulatory limit. "Close" starts when less than `warnShare` of the
 * limit is left as margin (10 % by default), so people act before the limit rather than after.
 */
export function judgeCompliance(value: number, limit: ComplianceLimit, warnShare = 0.1): ComplianceResult {
  const margins: { margin: number; size: number }[] = [];
  if (limit.max !== undefined) margins.push({ margin: limit.max - value, size: Math.abs(limit.max) });
  if (limit.min !== undefined) margins.push({ margin: value - limit.min, size: Math.abs(limit.min) });
  const nearest = margins.reduce<{ margin: number; size: number } | null>((best, entry) => (best === null || entry.margin < best.margin ? entry : best), null);
  if (nearest === null) return { verdict: 'within', ...DESCRIPTOR.within, margin: null };
  const verdict: ComplianceVerdict = nearest.margin < 0 ? 'exceeded' : nearest.margin < nearest.size * warnShare ? 'close' : 'within';
  return { verdict, ...DESCRIPTOR[verdict], margin: nearest.margin };
}

/** Share of samples that met the limit, in percent. `null` with no samples. */
export function complianceRate(compliant: number, samples: number): number | null {
  if (!(samples > 0)) return null;
  return (Math.min(compliant, samples) / samples) * 100;
}
