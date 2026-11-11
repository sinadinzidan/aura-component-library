import type { SchedEvent } from './conflicts';
import { clamp, SLOT } from './timeMath';
import type { TimeWindow } from './timeMath';

/** A column of the calendar: a day in week and day views, a crew in the resource view. */
export type SchedColumn = {
  id: string;
  label: string;
  dayId: string;
  /** Set in the resource view, where dropping on a column assigns the crew. */
  resourceId?: string;
};

/** Where an item sits: a column's day and crew, and its time. */
export type Placement = Pick<SchedEvent, 'dayId' | 'resourceId' | 'start' | 'end'>;

/** The index of the column under `x`; the nearest one when `x` is outside them all. */
export function columnIndexAt(x: number, bounds: readonly { left: number; right: number }[]): number {
  if (bounds.length === 0) return 0;
  const inside = bounds.findIndex((box) => x >= box.left && x < box.right);
  if (inside !== -1) return inside;
  return x < bounds[0].left ? 0 : bounds.length - 1;
}

/** Whether an item belongs in a column. */
export function inColumn(event: Pick<SchedEvent, 'dayId' | 'resourceId'>, column: SchedColumn): boolean {
  return event.dayId === column.dayId && (column.resourceId === undefined || column.resourceId === event.resourceId);
}

/** The column an item is shown in, or -1. */
export function columnOf(event: Pick<SchedEvent, 'dayId' | 'resourceId'>, columns: readonly SchedColumn[]): number {
  return columns.findIndex((column) => inColumn(event, column));
}

/** A new draft from where a drag started to where it is now; at least one slot long, kept in the window. */
export function draftFromDrag(anchor: number, current: number, window: TimeWindow): { start: number; end: number } {
  let start = Math.min(anchor, current);
  let end = Math.max(anchor, current);
  if (end - start < SLOT) {
    if (anchor <= current) end = start + SLOT;
    else start = end - SLOT;
  }
  start = clamp(start, window.start, window.end - SLOT);
  end = clamp(end, window.start + SLOT, window.end);
  return { start, end };
}

/** The item moved to a column, with its start at `start`; the duration is kept and the item stays in the window. */
export function movedTo(event: Placement, column: SchedColumn, start: number, window: TimeWindow): Placement {
  const duration = event.end - event.start;
  const clamped = clamp(start, window.start, Math.max(window.start, window.end - duration));
  return { dayId: column.dayId, resourceId: column.resourceId ?? event.resourceId, start: clamped, end: clamped + duration };
}

/** The item with a new end, at least one slot after its start and inside the window. */
export function resizedTo(event: Placement, end: number, window: TimeWindow): Placement {
  return { ...event, end: clamp(end, event.start + SLOT, Math.max(event.start + SLOT, window.end)) };
}

export type NudgeKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';

/**
 * What an arrow key does to a focused item: Up and Down move it one slot, Left and Right one
 * column; with Shift, Up and Down change the end by a slot instead. Returns `null` for a key or a
 * move that changes nothing.
 */
export function nudge(event: Placement, key: NudgeKey, shift: boolean, columns: readonly SchedColumn[], window: TimeWindow): Placement | null {
  const index = columnOf(event, columns);
  let next: Placement;
  if (shift && (key === 'ArrowUp' || key === 'ArrowDown')) {
    next = resizedTo(event, event.end + (key === 'ArrowDown' ? SLOT : -SLOT), window);
  } else if (key === 'ArrowUp' || key === 'ArrowDown') {
    next = movedTo(event, columns[Math.max(index, 0)] ?? { id: '', label: '', dayId: event.dayId }, event.start + (key === 'ArrowDown' ? SLOT : -SLOT), window);
    next = { ...next, dayId: event.dayId, resourceId: event.resourceId };
  } else {
    const target = columns[clamp(index + (key === 'ArrowRight' ? 1 : -1), 0, columns.length - 1)];
    if (index === -1 || target === undefined) return null;
    next = movedTo(event, target, event.start, window);
  }
  const same = next.dayId === event.dayId && next.resourceId === event.resourceId && next.start === event.start && next.end === event.end;
  return same ? null : next;
}
