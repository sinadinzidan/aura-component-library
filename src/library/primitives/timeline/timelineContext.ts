import { createContext } from 'react';

export type TimelineOrientation = 'vertical' | 'horizontal';
/** Vertical only: time beside the title, time in a column before the line, or events on alternating sides. */
export type TimelineLayout = 'plain' | 'time-start' | 'alternate';
export type TimelineDensity = 'compact' | 'default' | 'comfortable';
export type TimelineTone = 'neutral' | 'info' | 'success' | 'warning' | 'critical';
export type TimelineShape = 'dot' | 'ring' | 'square' | 'diamond';
export type TimelineState = 'done' | 'current' | 'pending';
export type TimelineConnector = 'solid' | 'dashed' | 'none';

export type TimelineContextValue = {
  orientation: TimelineOrientation;
  layout: TimelineLayout;
  density: TimelineDensity;
};

export const TimelineContext = createContext<TimelineContextValue>({ orientation: 'vertical', layout: 'plain', density: 'default' });

/** Width of the time column in the `time-start` layout: enough for "13:46" or "12 Mar". */
export const TIMELINE_TIME_COLUMN = 'w-14 shrink-0 text-right';

/** Height of the marker box and the title's line height, so the two share a centre line. */
export const TIMELINE_ROW: Record<TimelineDensity, { box: string; leading: string; gap: string }> = {
  compact: { box: 'h-5', leading: 'leading-5', gap: 'pb-3' },
  default: { box: 'h-6', leading: 'leading-6', gap: 'pb-5' },
  comfortable: { box: 'h-6', leading: 'leading-6', gap: 'pb-7' },
};
