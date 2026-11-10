/**
 * Pure checks for a set of alarm limits on one tag: the order LL < L < H < HH and a deadband that
 * fits inside the operating band. No React, no clock; safe to run on every keystroke.
 */

export type LimitKey = 'll' | 'l' | 'h' | 'hh';

/** The four alarm limits of a tag. `null` means the limit is not configured. */
export type LimitSet = Record<LimitKey, number | null>;

export type LimitIssue = {
  /** The limits the problem is between, lower first. A deadband issue names the band it must fit in. */
  keys: readonly [LimitKey, LimitKey];
  kind: 'order' | 'deadband';
  /** One sentence saying what to change. */
  message: string;
};

export const LIMIT_ORDER: readonly LimitKey[] = ['ll', 'l', 'h', 'hh'];

export const LIMIT_LABELS: Record<LimitKey, string> = { ll: 'LL', l: 'L', h: 'H', hh: 'HH' };

/**
 * Every pair of configured limits that is out of order. Each limit is compared with the next
 * configured one above it, so a missing limit never hides a clash between its neighbours.
 */
export function checkLimitOrder(limits: LimitSet): LimitIssue[] {
  const configured = LIMIT_ORDER.flatMap((key) => {
    const value = limits[key];
    return value === null ? [] : [{ key, value }];
  });
  const issues: LimitIssue[] = [];
  for (let index = 0; index < configured.length - 1; index += 1) {
    const lower = configured[index];
    const upper = configured[index + 1];
    if (lower.value >= upper.value) {
      issues.push({
        keys: [lower.key, upper.key],
        kind: 'order',
        message: `${LIMIT_LABELS[lower.key]} (${lower.value}) must be below ${LIMIT_LABELS[upper.key]} (${upper.value})`,
      });
    }
  }
  return issues;
}

/** A deadband must be positive and smaller than the band between L and H, or the alarm never clears. */
export function checkDeadband(limits: LimitSet, deadband: number): LimitIssue[] {
  if (deadband <= 0) {
    return [{ keys: ['l', 'h'], kind: 'deadband', message: `Deadband (${deadband}) must be above 0` }];
  }
  if (limits.l === null || limits.h === null || limits.h <= limits.l) return [];
  const band = Math.round((limits.h - limits.l) * 1000) / 1000;
  if (deadband >= band) {
    return [
      {
        keys: ['l', 'h'],
        kind: 'deadband',
        message: `Deadband (${deadband}) must be smaller than the L to H band (${band})`,
      },
    ];
  }
  return [];
}

/** All problems with one tag's limits and deadband, order problems first. */
export function validateLimits(limits: LimitSet, deadband: number): LimitIssue[] {
  return [...checkLimitOrder(limits), ...checkDeadband(limits, deadband)];
}

/** Parses what was typed into a limit cell. Empty text and "—" mean "not configured". */
export function parseLimit(text: string): number | null | undefined {
  const trimmed = text.trim().replace(',', '.');
  if (trimmed === '' || trimmed === '—' || trimmed === '-') return null;
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return undefined;
  return Number(trimmed);
}
