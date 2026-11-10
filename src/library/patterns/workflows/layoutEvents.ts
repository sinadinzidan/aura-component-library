/**
 * Places timed events in a day column: events that overlap share the width side by side, the way
 * a calendar draws a double booking. Times are minutes from midnight.
 */

export type TimedEvent = { id: string; start: number; end: number };

export type EventPlacement = {
  id: string;
  /** Zero-based lane inside the group of overlapping events. */
  lane: number;
  /** Number of lanes in that group; the event is `1 / lanes` wide. */
  lanes: number;
  /** Top edge and height as fractions (0–1) of the visible window. */
  top: number;
  height: number;
};

export type TimeWindow = { start: number; end: number };

const overlaps = (a: TimedEvent, b: TimedEvent): boolean => a.start < b.end && b.start < a.end;

/**
 * Lane and position of every event that is at least partly inside the window, in start order.
 * Events that only touch (one ends as the next starts) do not count as overlapping.
 */
export function layoutEvents(events: readonly TimedEvent[], window: TimeWindow): EventPlacement[] {
  const span = window.end - window.start;
  if (span <= 0) return [];
  const visible = events
    .filter((event) => event.end > event.start && event.end > window.start && event.start < window.end)
    .sort((a, b) => a.start - b.start || b.end - a.end || a.id.localeCompare(b.id));

  const placements: EventPlacement[] = [];
  let group: { id: string; lane: number }[] = [];
  let laneEnds: number[] = [];
  let groupEnd = -Infinity;

  const flush = () => {
    for (const member of group) {
      const event = visible.find((candidate) => candidate.id === member.id);
      if (!event) continue;
      const start = Math.max(event.start, window.start);
      const end = Math.min(event.end, window.end);
      placements.push({
        id: event.id,
        lane: member.lane,
        lanes: laneEnds.length,
        top: (start - window.start) / span,
        height: (end - start) / span,
      });
    }
    group = [];
    laneEnds = [];
    groupEnd = -Infinity;
  };

  for (const event of visible) {
    if (group.length > 0 && event.start >= groupEnd) flush();
    const free = laneEnds.findIndex((end) => end <= event.start);
    const lane = free === -1 ? laneEnds.length : free;
    laneEnds[lane] = event.end;
    groupEnd = Math.max(groupEnd, event.end);
    group.push({ id: event.id, lane });
  }
  flush();
  return placements;
}

/** Ids of the events that overlap at least one other event. */
export function conflictingIds(events: readonly TimedEvent[]): string[] {
  return events
    .filter((event) => events.some((other) => other.id !== event.id && overlaps(event, other)))
    .map((event) => event.id);
}

/** "08:30" for 510. */
export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return `${String(hours).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}
