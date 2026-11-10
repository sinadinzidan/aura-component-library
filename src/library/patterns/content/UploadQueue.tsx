import { Progress } from '@cognite/aura/components/progress';
import { IconAlertTriangle, IconBan, IconCircleCheck, IconRefresh, IconX } from '@cognite/aura/icons';

import { IconAction } from '../collections/IconAction';

import { fileKindOf } from './fileKind';
import { FileTypeIcon } from './FileTypeIcon';
import { formatBytes } from './formatBytes';
import type { UploadItem } from './uploadReducer';

type UploadQueueProps = {
  /** Accessible name of the list: "Uploads". */
  label: string;
  items: readonly UploadItem[];
  /** Stops a waiting or running upload. */
  onCancel?: (id: string) => void;
  /** Starts a failed or cancelled upload again. */
  onRetry?: (id: string) => void;
  /** Takes a finished, failed or cancelled row off the list. */
  onRemove?: (id: string) => void;
};

function percentOf(item: UploadItem): number {
  return item.size === 0 ? 0 : Math.floor((item.loaded * 100) / item.size);
}

/**
 * The files of one upload batch, each with its own progress and its own way out: cancel while it
 * moves, retry when it failed or was cancelled, remove when it is over. Every state has words and
 * an icon, so a failed row is not told apart by colour alone.
 */
export function UploadQueue({ label, items, onCancel, onRetry, onRemove }: UploadQueueProps) {
  return (
    <ul aria-label={label} data-slot="upload-queue" className="flex w-full min-w-0 list-none flex-col gap-1">
      {items.map((item) => {
        const active = item.status === 'queued' || item.status === 'uploading';
        const percent = percentOf(item);
        const sent = `${formatBytes(item.loaded)} of ${formatBytes(item.size)}`;

        return (
          <li key={item.id} data-status={item.status} className="flex min-w-0 items-start gap-3 py-2">
            <FileTypeIcon kind={fileKindOf(item.name)} />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex min-w-0 items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-sm font-medium text-base-foreground" title={item.name}>
                  {item.name}
                </span>
                {active ? <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{percent}%</span> : null}
              </div>
              {active ? (
                <Progress
                  value={percent}
                  size="sm"
                  aria-label={`Uploading ${item.name}`}
                  aria-valuetext={`${percent}%, ${sent}`}
                />
              ) : null}
              <p className="flex min-w-0 items-center gap-1.5 text-xs tabular-nums text-muted-foreground">
                {item.status === 'queued' ? `Waiting · ${formatBytes(item.size)}` : null}
                {item.status === 'uploading' ? sent : null}
                {item.status === 'done' ? (
                  <>
                    <IconCircleCheck aria-hidden="true" className="size-3.5 shrink-0 text-success-foreground-strong" />
                    <span>Uploaded · {formatBytes(item.size)}</span>
                  </>
                ) : null}
                {item.status === 'failed' ? (
                  <>
                    <IconAlertTriangle aria-hidden="true" className="size-3.5 shrink-0 text-critical-foreground-strong" />
                    <span className="min-w-0 text-critical-foreground-strong">
                      {item.error ?? 'Upload failed'} · {sent} sent
                    </span>
                  </>
                ) : null}
                {item.status === 'cancelled' ? (
                  <>
                    <IconBan aria-hidden="true" className="size-3.5 shrink-0" />
                    <span>Cancelled · {sent} sent</span>
                  </>
                ) : null}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {active && onCancel ? (
                <IconAction label={`Cancel upload of ${item.name}`} onClick={() => onCancel(item.id)}>
                  <IconX />
                </IconAction>
              ) : null}
              {(item.status === 'failed' || item.status === 'cancelled') && onRetry ? (
                <IconAction label={`Retry upload of ${item.name}`} onClick={() => onRetry(item.id)}>
                  <IconRefresh />
                </IconAction>
              ) : null}
              {!active && onRemove ? (
                <IconAction label={`Remove ${item.name} from the list`} onClick={() => onRemove(item.id)}>
                  <IconX />
                </IconAction>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
