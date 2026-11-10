import { Button } from '@cognite/aura/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconZoomIn, IconZoomOut, IconZoomReset } from '@cognite/aura/icons';

import { cn } from '../../../lib/utils';

import { formatSpan } from './timeAxis';
import type { TimeWindow, WindowBounds } from './timeWindow';
import { canZoom, zoomWindow } from './timeWindow';

export type ZoomControlsProps = {
  /** The window being shown. */
  value: TimeWindow;
  onValueChange: (window: [number, number]) => void;
  /** The window "reset" returns to. Leave out to hide the reset button. */
  home?: TimeWindow;
  /** Span limits and the latest allowed end. */
  bounds?: WindowBounds;
  /** `end` keeps the latest edge fixed (live trends); `center` keeps the middle fixed. */
  anchor?: 'center' | 'end';
  /** Print the current span between the buttons. */
  showSpan?: boolean;
  className?: string;
};

/**
 * Zoom in, zoom out and reset for a time axis. Each step halves or doubles the span; the buttons
 * disable at the span limits. Pair it with drag-to-zoom on the chart, never replace it: buttons
 * are the keyboard path.
 */
export function ZoomControls({ value, onValueChange, home, bounds = {}, anchor = 'center', showSpan = false, className }: ZoomControlsProps) {
  const atHome = home !== undefined && home[0] === value[0] && home[1] === value[1];
  const zoom = (factor: number) => onValueChange(zoomWindow(value, factor, bounds, anchor));

  return (
    <div data-slot="zoom-controls" role="group" aria-label="Zoom time axis" className={cn('flex items-center gap-1', className)}>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label="Zoom out" disabled={!canZoom(value, 2, bounds)} onClick={() => zoom(2)}>
              <IconZoomOut />
            </Button>
          }
        />
        <TooltipContent>Zoom out</TooltipContent>
      </Tooltip>
      {showSpan ? (
        <span data-slot="zoom-span" aria-live="polite" className="min-w-12 text-center text-sm text-base-foreground tabular-nums">
          {formatSpan(value[1] - value[0])}
        </span>
      ) : null}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label="Zoom in" disabled={!canZoom(value, 0.5, bounds)} onClick={() => zoom(0.5)}>
              <IconZoomIn />
            </Button>
          }
        />
        <TooltipContent>Zoom in</TooltipContent>
      </Tooltip>
      {home ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="Reset zoom" disabled={atHome} onClick={() => onValueChange([home[0], home[1]])}>
                <IconZoomReset />
              </Button>
            }
          />
          <TooltipContent>Reset zoom</TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
}
