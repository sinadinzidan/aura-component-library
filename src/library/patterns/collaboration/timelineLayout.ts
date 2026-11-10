import { createContext } from 'react';

/**
 * `plain`: marker, then content with the time at the end of the title line.
 * `time-start`: a right-aligned time column before the markers, for logs read by time.
 * `alternate`: content on alternating sides of a centre line, for a wide, sparse history.
 */
export type TimelineLayout = 'plain' | 'time-start' | 'alternate';

/** Tells `TimelineItem` and `TimelineGap` which grid their `Timeline` uses. */
export const TimelineLayoutContext = createContext<TimelineLayout>('plain');

/** Grid columns per layout: optional time column, the marker column, the content. */
export const TIMELINE_GRID: Record<TimelineLayout, string> = {
  plain: 'grid-cols-[1.5rem_minmax(0,1fr)]',
  'time-start': 'grid-cols-[3.5rem_1.5rem_minmax(0,1fr)]',
  alternate: 'grid-cols-[minmax(0,1fr)_1.5rem_minmax(0,1fr)]',
};
