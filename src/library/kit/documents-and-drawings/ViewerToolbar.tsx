import { Button } from '@cognite/aura/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconArrowsMaximize, IconChevronLeft, IconChevronRight, IconZoomIn, IconZoomOut } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

type ViewerToolbarProps = {
  /** Names the toolbar: "Drawing viewer". */
  label: string;
  /** Zoom in percent. */
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  /** Back to 100 %. */
  onFit: () => void;
  /** Limits, to disable the buttons at the ends. */
  minZoom?: number;
  maxZoom?: number;
  /** Current page and page count; leave out for a single sheet. */
  page?: number;
  pages?: number;
  onPage?: (page: number) => void;
  /** Start of the bar: the document name. */
  title?: ReactNode;
  /** End of the bar: layers, compare, download. */
  children?: ReactNode;
  className?: string;
};

type ToolProps = { name: string; disabled?: boolean; onClick: () => void; children: ReactNode };

function Tool({ name, disabled = false, onClick, children }: ToolProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="ghost" size="icon" aria-label={name} disabled={disabled} onClick={onClick}>
            {children}
          </Button>
        }
      />
      <TooltipContent>{name}</TooltipContent>
    </Tooltip>
  );
}

/**
 * The controls of a document or drawing viewer: zoom, fit and paging, with room for the document
 * name at the start and view options at the end. Sits on top of the sheet as a ruled strip.
 */
export function ViewerToolbar({ label, zoom, onZoomIn, onZoomOut, onFit, minZoom = 50, maxZoom = 400, page, pages, onPage, title, children, className }: ViewerToolbarProps) {
  const look = useLook();
  const paged = page !== undefined && pages !== undefined && pages > 1;

  return (
    <div
      role="toolbar"
      aria-label={label}
      data-look={look}
      className={cx('flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5 text-sm text-[var(--kit-text)]', className)}
      style={{ background: 'var(--kit-surface)', borderBottom: `${look === 'poster' ? 2 : 1}px solid var(--kit-rule-strong)` }}
    >
      {title ? <div className="mr-auto min-w-0 font-semibold">{title}</div> : null}
      <div className="flex items-center gap-0.5">
        <Tool name="Zoom out" disabled={zoom <= minZoom} onClick={onZoomOut}>
          <IconZoomOut />
        </Tool>
        <output aria-label="Zoom" className="w-14 text-center font-medium tabular-nums">
          {zoom} %
        </output>
        <Tool name="Zoom in" disabled={zoom >= maxZoom} onClick={onZoomIn}>
          <IconZoomIn />
        </Tool>
        <Tool name="Fit to window" onClick={onFit}>
          <IconArrowsMaximize />
        </Tool>
      </div>
      {paged ? (
        <div className="flex items-center gap-0.5">
          <Tool name="Previous page" disabled={page <= 1} onClick={() => onPage?.(page - 1)}>
            <IconChevronLeft />
          </Tool>
          <span className="whitespace-nowrap font-medium tabular-nums">
            Page {page} of {pages}
          </span>
          <Tool name="Next page" disabled={page >= pages} onClick={() => onPage?.(page + 1)}>
            <IconChevronRight />
          </Tool>
        </div>
      ) : null}
      {children ? <div className={cx('flex items-center gap-2', title ? '' : 'ml-auto')}>{children}</div> : null}
    </div>
  );
}
