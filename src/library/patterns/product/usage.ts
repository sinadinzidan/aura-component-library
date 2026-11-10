/** Pure helpers for metered usage against a plan limit. */

export type UsageLevel = 'normal' | 'near' | 'reached' | 'over';

/** Share of the limit that is used, 0–1 for the bar. An unknown or zero limit counts as empty. */
export function usageShare(used: number, limit: number): number {
  if (!Number.isFinite(used) || !Number.isFinite(limit) || limit <= 0) return 0;
  return Math.min(1, Math.max(0, used / limit));
}

/** Where usage stands against its limit. `warnAt` is the share from which it counts as near. */
export function usageLevel(used: number, limit: number, warnAt = 0.8): UsageLevel {
  if (!Number.isFinite(limit) || limit <= 0) return 'normal';
  if (used > limit) return 'over';
  if (used === limit) return 'reached';
  return used / limit >= warnAt ? 'near' : 'normal';
}

/** Whole percent of the limit used. Can exceed 100 when usage is over the limit. */
export function usagePercent(used: number, limit: number): number {
  if (!Number.isFinite(used) || !Number.isFinite(limit) || limit <= 0) return 0;
  return Math.round((Math.max(0, used) / limit) * 100);
}

const UNITS = [
  { threshold: 1e9, suffix: 'B' },
  { threshold: 1e6, suffix: 'M' },
  { threshold: 1e3, suffix: 'k' },
] as const;

/** Short count for meters: 950 → "950", 12,400 → "12.4 k", 2,000,000 → "2 M". */
export function formatCount(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const magnitude = Math.abs(value);
  for (const { threshold, suffix } of UNITS) {
    if (magnitude >= threshold) {
      const scaled = Math.round((value / threshold) * 10) / 10;
      return `${scaled}\u00a0${suffix}`;
    }
  }
  return String(Math.round(value));
}
