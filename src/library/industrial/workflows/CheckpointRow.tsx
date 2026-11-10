import { IconCheck, IconMinus, IconX } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';
import { formatLimit } from '../status';
import { ValueReadout } from '../ValueReadout';

import { isWithinLimits } from './workflow';

export type CheckpointResult = 'pass' | 'fail' | 'skip' | 'pending';

export type CheckpointReading = { value: number; unit?: string; decimals?: number; low?: number; high?: number };

export type CheckpointRowProps = {
  /** Position on the route. */
  index?: number;
  name: string;
  /** Equipment or instrument tag at the checkpoint. */
  tag?: string;
  result: CheckpointResult;
  /** A field reading taken at the checkpoint. Outside its limits it turns amber. */
  reading?: CheckpointReading;
  /** The operator's note, or why it was skipped. */
  note?: string;
  /** After the result: a photo count, a button. */
  trailing?: ReactNode;
  className?: string;
};

const RESULT_WORD: Record<CheckpointResult, string> = { pass: 'Pass', fail: 'Fail', skip: 'Skipped', pending: 'Not checked' };

const MARKER: Record<CheckpointResult, string> = {
  pass: 'bg-success-background text-success-foreground',
  fail: 'bg-critical-background text-critical-foreground',
  skip: 'border border-dashed border-emphasized text-muted-foreground',
  pending: 'border border-emphasized text-muted-foreground',
};

function limitText({ low, high, unit, decimals = 0 }: CheckpointReading): string | null {
  const suffix = unit ? ` ${unit}` : '';
  if (low !== undefined && high !== undefined) return `Limits ${formatLimit(low, decimals)}–${formatLimit(high, decimals)}${suffix}`;
  if (high !== undefined) return `Max ${formatLimit(high, decimals)}${suffix}`;
  if (low !== undefined) return `Min ${formatLimit(low, decimals)}${suffix}`;
  return null;
}

/**
 * One checkpoint on an inspection round: where, the result (pass, fail, skipped, not checked) as
 * a marker and a word, and the reading taken there judged against its limits.
 */
export function CheckpointRow({ index, name, tag, result, reading, note, trailing, className }: CheckpointRowProps) {
  const outOfLimits = reading ? !isWithinLimits(reading.value, reading.low, reading.high) : false;
  const limits = reading ? limitText(reading) : null;
  return (
    <div data-slot="checkpoint-row" data-result={result} className={cn('flex w-full items-start gap-3 py-2', className)}>
      <span className={cn('mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium tabular-nums', MARKER[result])}>
        {result === 'pass' ? <IconCheck aria-hidden className="size-3.5" /> : null}
        {result === 'fail' ? <IconX aria-hidden className="size-3.5" /> : null}
        {result === 'skip' ? <IconMinus aria-hidden className="size-3.5" /> : null}
        {result === 'pending' && index !== undefined ? <span aria-hidden>{index}</span> : null}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm text-base-foreground">{name}</span>
        {tag ? <span className="truncate font-mono text-xs text-muted-foreground">{tag}</span> : null}
        {note ? <span className="text-xs text-muted-foreground">{note}</span> : null}
      </div>
      {reading ? (
        <div className="flex shrink-0 flex-col items-end gap-1">
          <ValueReadout size="xs" value={reading.value} unit={reading.unit} decimals={reading.decimals} tone={outOfLimits ? 'warning' : 'neutral'} />
          {limits ? (
            <span className={cn('text-xs tabular-nums', outOfLimits ? 'font-medium text-warning-foreground-strong' : 'text-muted-foreground')}>
              {outOfLimits ? `Outside · ${limits}` : limits}
            </span>
          ) : null}
        </div>
      ) : null}
      <span
        className={cn(
          'w-20 shrink-0 pt-0.5 text-right text-xs',
          result === 'fail' ? 'font-medium text-critical-foreground-strong' : result === 'pass' ? 'text-base-foreground' : 'text-muted-foreground'
        )}
      >
        {RESULT_WORD[result]}
      </span>
      {trailing}
    </div>
  );
}
