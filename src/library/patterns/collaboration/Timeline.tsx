import type { ReactNode } from 'react';

import { TimelineLayoutContext } from './timelineLayout';
import type { TimelineLayout } from './timelineLayout';

type TimelineProps = {
  /** Accessible name of the list: "Incident timeline". */
  label: string;
  layout?: TimelineLayout;
  /** `TimelineItem` and `TimelineGap` elements, in the order they should be read. */
  children: ReactNode;
};

/**
 * A vertical timeline: an ordered list whose items are joined by a line. The layout is chosen
 * once here so every item shares the same columns. Events that happened are solid, the current
 * one is marked as current, and what has not happened yet is hollow on a dashed line.
 */
export function Timeline({ label, layout = 'plain', children }: TimelineProps) {
  return (
    <TimelineLayoutContext.Provider value={layout}>
      <ol data-slot="timeline" data-layout={layout} aria-label={label} className="flex w-full min-w-0 flex-col">
        {children}
      </ol>
    </TimelineLayoutContext.Provider>
  );
}
