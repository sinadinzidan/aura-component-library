import type { StatusDescriptor, Tone } from '../status';

/** Pure stock maths shared by the inventory components. */

export type StockLevels = {
  onHand: number;
  /** Safety stock: below this the store can no longer cover a critical job. */
  min: number;
  /** Order when stock falls to or below this point. */
  reorderPoint: number;
  /** Order-up-to level. */
  max: number;
};

export type StockState = 'stock-out' | 'below-min' | 'reorder' | 'in-range' | 'overstock';

const STOCK_STATUS: Record<StockState, StatusDescriptor> = {
  'stock-out': { tone: 'critical', label: 'Out of stock', shape: 'diamond' },
  'below-min': { tone: 'critical', label: 'Below minimum', shape: 'diamond' },
  reorder: { tone: 'warning', label: 'Reorder', shape: 'square' },
  'in-range': { tone: 'neutral', label: 'In range', shape: 'dot' },
  overstock: { tone: 'info', label: 'Overstock', shape: 'ring' },
};

/** Where stock on hand sits against its minimum, reorder point and maximum. */
export function stockState({ onHand, min, reorderPoint, max }: StockLevels): StockState {
  if (onHand <= 0) return 'stock-out';
  if (onHand < min) return 'below-min';
  if (onHand <= reorderPoint) return 'reorder';
  if (onHand > max) return 'overstock';
  return 'in-range';
}

/** Tone, label and shape for a stock state. In range is neutral: normal is not news. */
export function stockStatus(levels: StockLevels): StatusDescriptor {
  return STOCK_STATUS[stockState(levels)];
}

/** Stock not yet promised to a work order; never negative. */
export function availableStock(onHand: number, reserved: number): number {
  return Math.max(0, onHand - reserved);
}

/** Quantity that brings stock on hand plus stock on order back up to the maximum; 0 when already there. */
export function reorderQuantity(onHand: number, onOrder: number, max: number): number {
  return Math.max(0, max - onHand - onOrder);
}

/** Days the stock lasts at the current use; `null` when nothing is being used. */
export function daysOfCover(onHand: number, dailyUse: number): number | null {
  if (!(dailyUse > 0)) return null;
  return Math.max(0, onHand) / dailyUse;
}

/**
 * Cover judged against the replenishment lead time: critical when stock runs out before a new
 * delivery can arrive, warning with less than half a lead time to spare.
 */
export function coverTone(days: number | null, leadTimeDays: number): Tone {
  if (days === null) return 'neutral';
  if (days < leadTimeDays) return 'critical';
  if (days < leadTimeDays * 1.5) return 'warning';
  return 'neutral';
}

/** Free space left in a tank; never negative. */
export function ullage(capacity: number, volume: number): number {
  return Math.max(0, capacity - volume);
}

/** Fill of a tank in percent of capacity, 0–100. */
export function fillPercent(volume: number, capacity: number): number {
  if (!(capacity > 0)) return 0;
  return Math.min(100, Math.max(0, (volume / capacity) * 100));
}
