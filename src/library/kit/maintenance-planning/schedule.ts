/**
 * Scheduling arithmetic for a crew timeline: moving orders between days, packing overlapping
 * orders into rows, and adding up load against capacity. Pure functions, so a planner screen can
 * keep its orders in any store.
 */

export type PlanOrder = {
  id: string;
  /** Lane the order belongs to: a crew, a technician, a work centre. */
  laneId: string;
  /** First column the order occupies, or `null` while it waits in the backlog. */
  start: number | null;
  /** Number of columns it spans. */
  span: number;
  /** Work content in hours, spread evenly over the span. */
  hours: number;
};

export type LoadFigure = { planned: number; capacity: number };

/** How full a lane or a day is, as a word a planner would use. */
export type LoadState = 'free' | 'tight' | 'over';

function clampStart(start: number, span: number, columns: number): number {
  return Math.min(Math.max(start, 0), Math.max(columns - span, 0));
}

/** Moves a scheduled order by `delta` columns, kept inside the timeline. Backlog orders stay put. */
export function moveOrder<Order extends PlanOrder>(orders: readonly Order[], id: string, delta: number, columns: number): Order[] {
  return orders.map((order) =>
    order.id === id && order.start !== null ? { ...order, start: clampStart(order.start + delta, order.span, columns) } : order
  );
}

/** Puts an order on the timeline at `start`, or back in the backlog with `null`. */
export function placeOrder<Order extends PlanOrder>(orders: readonly Order[], id: string, start: number | null, columns: number): Order[] {
  return orders.map((order) => (order.id === id ? { ...order, start: start === null ? null : clampStart(start, order.span, columns) } : order));
}

/** Whether an order can still move in a direction. */
export function canMove(order: PlanOrder, delta: number, columns: number): boolean {
  if (order.start === null) return false;
  return clampStart(order.start + delta, order.span, columns) !== order.start;
}

/** Hours planned per column, for one lane or for all of them. */
export function columnHours(orders: readonly PlanOrder[], columns: number, laneId?: string): number[] {
  const totals = Array.from({ length: columns }, () => 0);
  for (const order of orders) {
    if (order.start === null || (laneId !== undefined && order.laneId !== laneId)) continue;
    const share = order.hours / order.span;
    for (let column = order.start; column < Math.min(order.start + order.span, columns); column += 1) totals[column] += share;
  }
  return totals.map((total) => Math.round(total * 10) / 10);
}

/** Planned hours of a lane against the sum of its capacity. */
export function laneLoad(orders: readonly PlanOrder[], laneId: string, capacity: readonly number[]): LoadFigure {
  const planned = columnHours(orders, capacity.length, laneId).reduce((sum, hours) => sum + hours, 0);
  return { planned: Math.round(planned), capacity: capacity.reduce((sum, hours) => sum + hours, 0) };
}

/** `over` above capacity, `tight` from 85 %, otherwise `free`. */
export function loadState({ planned, capacity }: LoadFigure): LoadState {
  if (planned > capacity) return 'over';
  return capacity > 0 && planned / capacity >= 0.85 ? 'tight' : 'free';
}

/** The first column from `from` on where the lane still has room for the order's daily share. */
export function firstFreeColumn(orders: readonly PlanOrder[], order: PlanOrder, capacity: readonly number[], from: number): number {
  const used = columnHours(orders, capacity.length, order.laneId);
  const share = order.hours / order.span;
  for (let start = from; start + order.span <= capacity.length; start += 1) {
    const fits = Array.from({ length: order.span }, (_, offset) => used[start + offset] + share <= capacity[start + offset]).every(Boolean);
    if (fits) return start;
  }
  return clampStart(from, order.span, capacity.length);
}

/** Row index per order id, so orders that overlap in one lane stack instead of colliding. */
export function packRows(orders: readonly PlanOrder[]): Map<string, number> {
  const rows = new Map<string, number>();
  const ends = new Map<string, number[]>();
  const scheduled = orders.filter((order) => order.start !== null).sort((a, b) => (a.start ?? 0) - (b.start ?? 0) || b.span - a.span);
  for (const order of scheduled) {
    const start = order.start ?? 0;
    const laneEnds = ends.get(order.laneId) ?? [];
    const free = laneEnds.findIndex((end) => end <= start);
    const row = free === -1 ? laneEnds.length : free;
    laneEnds[row] = start + order.span;
    ends.set(order.laneId, laneEnds);
    rows.set(order.id, row);
  }
  return rows;
}
