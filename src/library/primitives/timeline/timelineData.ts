export type TimelineItemGroup<Item> = { key: string; items: Item[] };

/**
 * Groups consecutive items that share a key, keeping their order: events by day, by shift or by
 * hour. Items with the same key that are not next to each other stay in separate groups, so the
 * timeline never reorders what happened.
 */
export function groupTimelineItems<Item>(items: readonly Item[], keyOf: (item: Item) => string): TimelineItemGroup<Item>[] {
  const groups: TimelineItemGroup<Item>[] = [];
  for (const item of items) {
    const key = keyOf(item);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(item);
    else groups.push({ key, items: [item] });
  }
  return groups;
}

export type TimelineSplit<Item> = { head: Item[]; middle: Item[]; tail: Item[] };

/**
 * Splits a long timeline into the first `head` items, the last `tail` items and the middle that
 * folds behind "Show N earlier". Nothing is folded unless at least two items would be hidden.
 */
export function splitTimelineMiddle<Item>(items: readonly Item[], head: number, tail: number): TimelineSplit<Item> {
  const keepHead = Math.max(0, head);
  const keepTail = Math.max(0, tail);
  if (items.length - keepHead - keepTail < 2) return { head: [...items], middle: [], tail: [] };
  return {
    head: items.slice(0, keepHead),
    middle: items.slice(keepHead, items.length - keepTail),
    tail: items.slice(items.length - keepTail),
  };
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** A duration in the two largest units that matter: "45 s", "12 min", "2 h 5 min", "3 d 4 h". */
export function formatTimelineDuration(milliseconds: number): string {
  const value = Math.max(0, Math.round(milliseconds / SECOND) * SECOND);
  if (value < MINUTE) return `${value / SECOND} s`;
  if (value < HOUR) {
    const minutes = Math.round(value / MINUTE);
    return minutes === 60 ? '1 h' : `${minutes} min`;
  }
  if (value < DAY) {
    const hours = Math.floor(value / HOUR);
    const minutes = Math.round((value % HOUR) / MINUTE);
    if (minutes === 60) return `${hours + 1} h`;
    return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
  }
  const days = Math.floor(value / DAY);
  const hours = Math.round((value % DAY) / HOUR);
  if (hours === 24) return `${days + 1} d`;
  return hours === 0 ? `${days} d` : `${days} d ${hours} h`;
}
