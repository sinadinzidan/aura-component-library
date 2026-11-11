import { useMemo } from 'react';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

import { TimelineContext } from './timelineContext';
import type { TimelineDensity, TimelineLayout, TimelineOrientation } from './timelineContext';

export type TimelineProps = {
  /** Accessible name of the list: "Incident timeline". */
  label: string;
  /** `vertical` for a log of any length; `horizontal` for a short life cycle of three to six events. */
  orientation?: TimelineOrientation;
  /** Vertical only. `time-start` puts times in their own column; `alternate` places events on both sides of the line. */
  layout?: TimelineLayout;
  density?: TimelineDensity;
  className?: string;
  /** `TimelineItem`, `TimelineGroup` and `TimelineCollapse` elements, in the order they should be read. */
  children: ReactNode;
};

/**
 * Events in order, joined by a line. What happened is solid, where things stand is marked as
 * current, and what has not happened yet is hollow on a dashed line. Orientation, layout and
 * density are chosen once here so every item shares the same columns.
 */
export function Timeline({ label, orientation = 'vertical', layout = 'plain', density = 'default', className, children }: TimelineProps) {
  const context = useMemo(() => ({ orientation, layout, density }), [orientation, layout, density]);

  return (
    <TimelineContext.Provider value={context}>
      <ol
        aria-label={label}
        data-slot="timeline"
        data-orientation={orientation}
        data-layout={orientation === 'vertical' ? layout : undefined}
        className={cn('flex w-full min-w-0 list-none', orientation === 'vertical' ? 'flex-col' : 'flex-row', className)}
      >
        {children}
      </ol>
    </TimelineContext.Provider>
  );
}
