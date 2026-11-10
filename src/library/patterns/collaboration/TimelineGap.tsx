import { Button } from '@cognite/aura/components/button';
import { IconDotsVertical } from '@cognite/aura/icons';
import { useContext } from 'react';

import { TIMELINE_GRID, TimelineLayoutContext } from './timelineLayout';

type TimelineGapProps = {
  /** How many events are folded away. */
  count: number;
  /** Shows the hidden events. The owner then renders them in place of the gap. */
  onExpand: () => void;
  /** Button text for a given count. */
  label?: (count: number) => string;
};

const defaultLabel = (count: number) => `Show ${count} earlier ${count === 1 ? 'event' : 'events'}`;

/**
 * The folded middle of a long `Timeline`: a break in the line with a button that says how many
 * events it hides. Keeps the first and the latest events on screen without pretending the ones
 * in between did not happen.
 */
export function TimelineGap({ count, onExpand, label = defaultLabel }: TimelineGapProps) {
  const layout = useContext(TimelineLayoutContext);

  return (
    <li data-slot="timeline-gap" className={`grid min-w-0 items-center gap-x-3 pb-5 ${TIMELINE_GRID[layout]}`}>
      {layout === 'plain' ? null : <span />}
      <span aria-hidden="true" className="flex h-7 items-center justify-center text-muted-foreground">
        <IconDotsVertical className="size-4" />
      </span>
      <div className="flex min-w-0">
        <Button variant="ghost" size="sm" onClick={onExpand} className="-ml-2">
          {label(count)}
        </Button>
      </div>
    </li>
  );
}
