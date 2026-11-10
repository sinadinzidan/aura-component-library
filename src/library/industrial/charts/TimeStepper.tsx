import { Button } from '@cognite/aura/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconChevronLeft, IconChevronRight } from '@cognite/aura/icons';

import { cn } from '../../../lib/utils';

import { formatRange, formatSpan } from './timeAxis';
import type { TimeWindow, WindowBounds } from './timeWindow';
import { canShiftBack, canShiftForward, shiftWindow, windowEndingAt } from './timeWindow';

export type TimeStepperProps = {
  /** The window being shown. */
  value: TimeWindow;
  onValueChange: (window: [number, number]) => void;
  /** Where the window may go. `max` is normally "now". */
  bounds?: WindowBounds;
  /** Share of the window to move per step. 1 pages, 0.5 keeps half of the previous view. */
  fraction?: number;
  /** Adds a button that jumps back to the window ending at `bounds.max`. */
  showLatest?: boolean;
  timeZone?: string;
  className?: string;
};

/**
 * Step back and forward through time by the length of the current window, with the window written
 * out between the arrows. Forward is disabled at "now", and its name and title say why.
 */
export function TimeStepper({ value, onValueChange, bounds = {}, fraction = 1, showLatest = false, timeZone = 'UTC', className }: TimeStepperProps) {
  const span = formatSpan((value[1] - value[0]) * fraction);
  const back = canShiftBack(value, bounds);
  const forward = canShiftForward(value, bounds);
  const atLatest = bounds.max !== undefined && value[1] >= bounds.max;

  return (
    <div data-slot="time-stepper" role="group" aria-label="Step through time" className={cn('flex items-center gap-1', className)}>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={back ? `Back ${span}` : `Back ${span}, unavailable: start of the data`}
              title={back ? undefined : 'Start of the data'}
              disabled={!back}
              onClick={() => onValueChange(shiftWindow(value, -1, bounds, fraction))}
            >
              <IconChevronLeft />
            </Button>
          }
        />
        <TooltipContent>Back {span}</TooltipContent>
      </Tooltip>
      <span data-slot="time-stepper-range" aria-live="polite" className="min-w-44 px-1 text-center text-sm text-base-foreground tabular-nums">
        {formatRange(value[0], value[1], timeZone)}
      </span>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={forward ? `Forward ${span}` : `Forward ${span}, unavailable: already at the latest data`}
              title={forward ? undefined : 'Already at the latest data'}
              disabled={!forward}
              onClick={() => onValueChange(shiftWindow(value, 1, bounds, fraction))}
            >
              <IconChevronRight />
            </Button>
          }
        />
        <TooltipContent>Forward {span}</TooltipContent>
      </Tooltip>
      {showLatest && bounds.max !== undefined ? (
        <Button variant="ghost" size="sm" disabled={atLatest} onClick={() => onValueChange(windowEndingAt(bounds.max ?? value[1], value[1] - value[0]))}>
          Latest
        </Button>
      ) : null}
    </div>
  );
}
