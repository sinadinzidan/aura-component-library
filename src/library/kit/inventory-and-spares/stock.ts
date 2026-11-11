import type { Tone } from '../tones';

export type StockLevels = {
  onHand: number;
  /** Set aside for work orders; part of on hand but not free to use. */
  reserved: number;
  /** Ordered and not yet received. */
  onOrder: number;
  min: number;
  reorderPoint: number;
  max: number;
};

export type StockVerdict = { tone: Tone; word: string };

/** Share of a tank that is full, in percent, clamped to 0–100. */
export function fillPercent(volume: number, capacity: number): number {
  if (capacity <= 0) return 0;
  return Math.max(0, Math.min(100, (volume / capacity) * 100));
}

/** Room left in a tank. */
export function ullage(volume: number, capacity: number): number {
  return Math.max(0, capacity - volume);
}

/** Judges a tank level against its low and high limits, both in percent. */
export function tankVerdict(percent: number, low: number, high: number): StockVerdict {
  if (percent >= high) return { tone: 'critical', word: 'High level' };
  if (percent <= low) return { tone: 'warning', word: 'Low level' };
  return { tone: 'success', word: 'Normal' };
}

/** Stock that can be promised to a new job. */
export function availableStock(levels: Pick<StockLevels, 'onHand' | 'reserved'>): number {
  return Math.max(0, levels.onHand - levels.reserved);
}

/** Judges free stock against the minimum and the reorder point. */
export function stockVerdict(levels: StockLevels): StockVerdict {
  const available = availableStock(levels);
  if (available < levels.min) return { tone: 'critical', word: 'Below minimum' };
  if (available <= levels.reorderPoint) return { tone: 'warning', word: 'Reorder now' };
  if (levels.onHand > levels.max) return { tone: 'info', word: 'Overstocked' };
  return { tone: 'success', word: 'Healthy' };
}

/** How many to order to fill up to the maximum, counting what is already on its way. */
export function reorderQuantity(levels: StockLevels): number {
  return Math.max(0, levels.max - availableStock(levels) - levels.onOrder);
}

/** Whole days the stock lasts at the given daily use. Infinity when nothing is used. */
export function daysOfCover(onHand: number, dailyUse: number): number {
  if (dailyUse <= 0) return Number.POSITIVE_INFINITY;
  return Math.floor(onHand / dailyUse);
}

/** Judges cover against the time a new delivery takes. */
export function coverVerdict(days: number, leadTimeDays: number): StockVerdict {
  if (days < leadTimeDays) return { tone: 'critical', word: 'Runs out before delivery' };
  if (days < leadTimeDays * 1.5) return { tone: 'warning', word: 'Order now' };
  return { tone: 'success', word: 'Covered' };
}
