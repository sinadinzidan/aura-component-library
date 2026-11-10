import { IconBellRinging, IconCheck, IconEyeOff } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';
import { formatValue } from '../status';

import { scoreLevel } from './anomaly';
import type { ScoreLevel } from './anomaly';

export type AnomalyStatus = 'new' | 'acknowledged' | 'dismissed';

export type AnomalyRecord = {
  id: string;
  /** Instrument tag the anomaly was found on. */
  tag: string;
  /** Measurement name: "Drive-end vibration". */
  name: string;
  /** Peak anomaly score, 0–1. */
  score: number;
  status: AnomalyStatus;
};

export type AnomalyRowProps = {
  anomaly: AnomalyRecord;
  /** When it started, already formatted: "12 Mar, 11:30". */
  started: string;
  /** How long it lasted or has lasted: "2 h 16 min". */
  duration: string;
  /** Score at which a sample counts as anomalous; sets the wording and the colour of the score. */
  threshold?: number;
  /** The shape of the deviation in a word: "Drift", "Spike", "Flatline". */
  pattern?: string;
  /** Equipment the tag belongs to. */
  assetName?: string;
  /** `compact` drops the start and duration columns for side panels. */
  density?: 'full' | 'compact';
  /** Row actions: acknowledge, dismiss, open. */
  actions?: ReactNode;
  className?: string;
};

const STATUS_WORD: Record<AnomalyStatus, string> = { new: 'New', acknowledged: 'Acknowledged', dismissed: 'Dismissed' };
const STATUS_ICON = { new: IconBellRinging, acknowledged: IconCheck, dismissed: IconEyeOff } as const;

const LEVEL_BAR: Record<ScoreLevel, string> = {
  normal: 'bg-chart-neutral-300',
  elevated: 'bg-chart-neutral-450',
  anomalous: 'bg-chart-warning-450',
};

const LEVEL_WORD: Record<ScoreLevel, string> = { normal: 'normal', elevated: 'elevated', anomalous: 'anomalous' };

/**
 * One detected anomaly as a list row: measurement and tag, the score as a number and a bar, when
 * it started, how long it lasted and where it is in review. Columns have fixed widths so stacked
 * rows read as a table. Only a new anomaly is strong; a dismissed one drops to muted text.
 */
export function AnomalyRow({ anomaly, started, duration, threshold = 0.7, pattern, assetName, density = 'full', actions, className }: AnomalyRowProps) {
  const level = scoreLevel(anomaly.score, threshold);
  const dismissed = anomaly.status === 'dismissed';
  const StatusIcon = STATUS_ICON[anomaly.status];

  return (
    <li data-slot="anomaly-row" data-status={anomaly.status} data-level={level} className={cn('flex min-w-0 items-center gap-4 py-2.5', className)}>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className={cn('truncate text-sm', dismissed ? 'text-muted-foreground' : 'text-base-foreground')}>
          {anomaly.name}
          {pattern ? <span className="text-muted-foreground"> · {pattern}</span> : null}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          <span className="font-mono">{anomaly.tag}</span>
          {assetName ? ` · ${assetName}` : null}
          {density === 'compact' ? ` · ${started}` : null}
        </p>
      </div>

      <div className="flex w-20 shrink-0 flex-col gap-1" aria-label={`Anomaly score ${formatValue(anomaly.score, 2)}, ${LEVEL_WORD[level]}`} role="img">
        <span className={cn('text-sm font-medium tabular-nums', dismissed ? 'text-muted-foreground' : 'text-base-foreground')}>{formatValue(anomaly.score, 2)}</span>
        <span className="h-1 w-full overflow-hidden rounded-full bg-chart-neutral-100">
          <span className={cn('block h-full rounded-full', LEVEL_BAR[level])} style={{ width: `${Math.min(Math.max(anomaly.score, 0), 1) * 100}%` }} />
        </span>
      </div>

      {density === 'full' ? (
        <div className="flex w-28 shrink-0 flex-col gap-0.5">
          <span className="text-sm text-base-foreground tabular-nums">{started}</span>
          <span className="text-xs text-muted-foreground tabular-nums">{duration}</span>
        </div>
      ) : null}

      <span
        data-slot="anomaly-status"
        className={cn('flex w-32 shrink-0 items-center gap-1.5 text-sm', anomaly.status === 'new' ? 'font-medium text-base-foreground' : 'text-muted-foreground')}
      >
        <StatusIcon aria-hidden="true" className="size-4 shrink-0" />
        {STATUS_WORD[anomaly.status]}
      </span>

      {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
    </li>
  );
}
