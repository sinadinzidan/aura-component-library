import { Button } from '@cognite/aura/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconArrowsMaximize, IconZoomIn, IconZoomOut } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

import { stepZoom } from './workflow';
import type { ZoomRange } from './workflow';

export type ViewerToolbarProps = {
  /** Zoom level in percent. */
  zoom: number;
  onZoomChange: (zoom: number) => void;
  /** Fit the drawing to the canvas. */
  onFit: () => void;
  range?: ZoomRange;
  /** Accessible name of the toolbar. */
  label?: string;
  /** More controls after the zoom group: layers, rotate, download. */
  children?: ReactNode;
  className?: string;
};

/**
 * Zoom controls for a drawing or document viewer: out, the current level, in, and fit to screen.
 * The buttons disable at the ends of the range; further controls go in as children.
 */
export function ViewerToolbar({ zoom, onZoomChange, onFit, range, label = 'Viewer controls', children, className }: ViewerToolbarProps) {
  const zoomOut = stepZoom(zoom, -1, range);
  const zoomIn = stepZoom(zoom, 1, range);
  return (
    <div role="toolbar" aria-label={label} data-slot="viewer-toolbar" className={cn('flex items-center gap-1', className)}>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label="Zoom out" disabled={zoomOut === zoom} onClick={() => onZoomChange(zoomOut)}>
              <IconZoomOut />
            </Button>
          }
        />
        <TooltipContent>Zoom out</TooltipContent>
      </Tooltip>
      <output aria-label="Zoom level" className="w-12 text-center text-xs text-base-foreground tabular-nums">
        {zoom}%
      </output>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label="Zoom in" disabled={zoomIn === zoom} onClick={() => onZoomChange(zoomIn)}>
              <IconZoomIn />
            </Button>
          }
        />
        <TooltipContent>Zoom in</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label="Fit to screen" onClick={onFit}>
              <IconArrowsMaximize />
            </Button>
          }
        />
        <TooltipContent>Fit to screen</TooltipContent>
      </Tooltip>
      {children}
    </div>
  );
}
