import type { DotShape, Tone } from '../../industrial/status';

/** Crew-alerting levels, most urgent first: act now, act soon, be aware. */
export type CautionLevel = 'warning' | 'caution' | 'advisory';

export type CautionItem = {
  id: string;
  level: CautionLevel;
  message: string;
  /** Tag or system the message comes from. */
  source: string;
  /** Epoch milliseconds, used for ordering. */
  raisedAt: number;
  /** Printed time, already formatted. */
  time: string;
  acknowledged?: boolean;
};

export const CAUTION_LEVELS: readonly CautionLevel[] = ['warning', 'caution', 'advisory'];

export const CAUTION_LEVEL: Record<CautionLevel, { label: string; tone: Tone; shape: DotShape }> = {
  warning: { label: 'Warning', tone: 'critical', shape: 'diamond' },
  caution: { label: 'Caution', tone: 'warning', shape: 'square' },
  advisory: { label: 'Advisory', tone: 'info', shape: 'ring' },
};

/** Priority order: by level, then newest first. The input is not changed. */
export function sortCautions(items: readonly CautionItem[]): CautionItem[] {
  return [...items].sort(
    (a, b) => CAUTION_LEVELS.indexOf(a.level) - CAUTION_LEVELS.indexOf(b.level) || b.raisedAt - a.raisedAt || a.id.localeCompare(b.id)
  );
}

/** How many messages there are per level. */
export function countCautions(items: readonly CautionItem[]): Record<CautionLevel, number> {
  const counts: Record<CautionLevel, number> = { warning: 0, caution: 0, advisory: 0 };
  for (const item of items) counts[item.level] += 1;
  return counts;
}
