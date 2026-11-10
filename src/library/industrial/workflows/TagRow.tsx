import { IconClock } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';
import { qualityStatus } from '../status';
import type { SignalQuality, Tone } from '../status';
import { StatusIndicator } from '../StatusIndicator';
import { ValueReadout } from '../ValueReadout';

export type TagRowProps = {
  /** Instrument tag, also the time series external ID. */
  tag: string;
  /** What the tag measures. */
  name: string;
  /** `null` renders an em dash. */
  value: number | null;
  unit?: string;
  decimals?: number;
  /** Colours the value. Leave neutral unless the reading itself is abnormal. */
  tone?: Tone;
  quality?: SignalQuality;
  /** How old the value is, e.g. "14 min". Shown only when the value is stale. */
  age?: string;
  /** The value has not updated when it should have: it is dimmed and its age is shown. */
  stale?: boolean;
  /** In front of the tag: a checkbox, a pin button, a colour key. */
  leading?: ReactNode;
  /** After the quality: a sparkline, a copy button, a menu. */
  trailing?: ReactNode;
  className?: string;
};

/**
 * One tag on one line: tag and description, current value with unit, signal quality. Value and
 * quality sit in fixed-width columns so a stack of rows reads as a table.
 */
export function TagRow({ tag, name, value, unit, decimals = 0, tone = 'neutral', quality, age, stale = false, leading, trailing, className }: TagRowProps) {
  return (
    <div data-slot="tag-row" data-stale={stale ? 'true' : undefined} className={cn('flex w-full items-center gap-3 py-2', className)}>
      {leading}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-mono text-sm text-base-foreground">{tag}</span>
        <span className="truncate text-xs text-muted-foreground">{name}</span>
      </div>
      <div className="flex w-28 shrink-0 flex-col items-end gap-1">
        <ValueReadout size="sm" value={value} unit={unit} decimals={decimals} tone={tone} className={stale ? 'opacity-60' : undefined} />
        {stale && age ? (
          <span className="inline-flex items-center gap-1 text-xs whitespace-nowrap text-warning-foreground-strong tabular-nums">
            <IconClock aria-hidden className="size-3" />
            Stale · {age}
          </span>
        ) : null}
      </div>
      {quality ? (
        <div className="w-24 shrink-0">
          <StatusIndicator size="sm" {...qualityStatus(quality)} />
        </div>
      ) : null}
      {trailing}
    </div>
  );
}
