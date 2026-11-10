import { Button } from '@cognite/aura/components/button';
import { Progress } from '@cognite/aura/components/progress';
import { IconAlertTriangle, IconCircleCheck, IconDownload, IconFileExport } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

export type ExportStatus = 'running' | 'ready' | 'cancelled' | 'failed';

type ExportProgressProps = {
  /** The file being produced: "alarm-history-february.csv". */
  fileName: string;
  status: ExportStatus;
  /** 0–100 while running. */
  value?: number;
  /** While running: what has been done, such as "184,000 of 412,000 rows". */
  detail?: string;
  /** When ready: size and how long the file is kept, such as "18.4 MB · Available for 7 days". */
  readyText?: string;
  /** When failed: what went wrong, in a sentence. */
  errorText?: string;
  /** Icon for the file type. */
  icon?: ReactNode;
  onCancel?: () => void;
  onDownload?: () => void;
  /** Offered after a failure or a cancellation. */
  onRetry?: () => void;
};

/**
 * One export job from start to file: progress with a way to cancel while it runs, then a download
 * button, or what went wrong with a way to try again. The row keeps its place and height through
 * every state, and each change is announced.
 */
export function ExportProgress({
  fileName,
  status,
  value = 0,
  detail,
  readyText,
  errorText = 'The export could not be completed.',
  icon,
  onCancel,
  onDownload,
  onRetry,
}: ExportProgressProps) {
  const percent = Math.round(Math.max(0, Math.min(100, value)));

  return (
    <div data-slot="export-progress" data-status={status} className="flex w-full min-w-0 items-center gap-3">
      <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted-background text-medium-foreground [&>svg]:size-4">
        {icon ?? <IconFileExport />}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex min-w-0 items-baseline justify-between gap-3">
          <span className="min-w-0 truncate font-mono text-sm text-base-foreground">{fileName}</span>
          {status === 'running' ? <span className="shrink-0 text-sm tabular-nums text-muted-foreground">{percent}%</span> : null}
        </div>
        {status === 'running' ? (
          <Progress value={percent} size="sm" aria-label={`Exporting ${fileName}`} aria-valuetext={`${percent}%`} />
        ) : null}
        <p role="status" className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          {status === 'running' ? (detail ?? 'Preparing the file') : null}
          {status === 'ready' ? (
            <>
              <IconCircleCheck aria-hidden="true" className="size-3.5 shrink-0 text-success-foreground-strong" />
              <span>Ready{readyText ? ` · ${readyText}` : ''}</span>
            </>
          ) : null}
          {status === 'cancelled' ? 'Export cancelled. No file was created.' : null}
          {status === 'failed' ? (
            <>
              <IconAlertTriangle aria-hidden="true" className="size-3.5 shrink-0 text-critical-foreground-strong" />
              <span className="text-critical-foreground-strong">{errorText}</span>
            </>
          ) : null}
        </p>
      </div>
      <div className="flex shrink-0 items-center">
        {status === 'running' && onCancel ? (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel export
          </Button>
        ) : null}
        {status === 'ready' && onDownload ? (
          <Button variant="secondary" size="sm" onClick={onDownload}>
            <IconDownload /> Download
          </Button>
        ) : null}
        {(status === 'failed' || status === 'cancelled') && onRetry ? (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            {status === 'failed' ? 'Try again' : 'Export again'}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
