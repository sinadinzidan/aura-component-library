import { IconChevronLeft, IconChevronRight, IconDownload, IconZoomIn, IconZoomOut } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { IconAction } from '../collections/IconAction';

import { DEFAULT_ZOOM_STEPS, stepZoom } from './stepZoom';

type DocumentViewerFrameProps = {
  /** File name or document title. Also names the viewer region. */
  title: string;
  /** Current page, starting at 1. */
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  /** Zoom in percent. */
  zoom: number;
  onZoomChange: (zoom: number) => void;
  zoomSteps?: readonly number[];
  /** Renders a download button when given. */
  onDownload?: () => void;
  /** More toolbar buttons after download: print, open in new tab, close. */
  actions?: ReactNode;
  /** The page area: a rendered page, or a placeholder while it loads. */
  children: ReactNode;
};

/**
 * The chrome around a document: a toolbar with the name, page stepping, zoom and download, over a
 * muted canvas that scrolls on its own. It holds no state and renders no file; the caller owns the
 * page and zoom, so both can be restored from a link. Give it a height from its container.
 */
export function DocumentViewerFrame({
  title,
  page,
  pageCount,
  onPageChange,
  zoom,
  onZoomChange,
  zoomSteps = DEFAULT_ZOOM_STEPS,
  onDownload,
  actions,
  children,
}: DocumentViewerFrameProps) {
  const zoomIn = stepZoom(zoom, 'in', zoomSteps);
  const zoomOut = stepZoom(zoom, 'out', zoomSteps);

  return (
    <section
      aria-label={`Viewer: ${title}`}
      data-slot="document-viewer"
      className="flex h-full w-full min-w-0 flex-col overflow-hidden rounded-xl border border-default bg-base-background"
    >
      <div
        role="toolbar"
        aria-label="Document controls"
        className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-default px-3 py-2"
      >
        <p className="min-w-0 flex-1 basis-32 truncate text-sm font-medium text-base-foreground" title={title}>
          {title}
        </p>
        <div className="flex items-center gap-1">
          <IconAction label="Go to previous page" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            <IconChevronLeft />
          </IconAction>
          <span className="whitespace-nowrap px-1 text-xs tabular-nums text-muted-foreground" aria-live="polite">
            Page {page} of {pageCount}
          </span>
          <IconAction label="Go to next page" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
            <IconChevronRight />
          </IconAction>
        </div>
        <div className="flex items-center gap-1">
          <IconAction label="Zoom out" disabled={zoomOut === zoom} onClick={() => onZoomChange(zoomOut)}>
            <IconZoomOut />
          </IconAction>
          <span className="w-10 text-center text-xs tabular-nums text-muted-foreground" aria-live="polite">
            {zoom}%
          </span>
          <IconAction label="Zoom in" disabled={zoomIn === zoom} onClick={() => onZoomChange(zoomIn)}>
            <IconZoomIn />
          </IconAction>
        </div>
        {onDownload || actions ? (
          <div className="flex items-center gap-1">
            {onDownload ? (
              <IconAction label={`Download ${title}`} onClick={onDownload}>
                <IconDownload />
              </IconAction>
            ) : null}
            {actions}
          </div>
        ) : null}
      </div>
      <div className="flex min-h-0 flex-1 justify-center overflow-auto bg-muted-background p-4">{children}</div>
    </section>
  );
}
