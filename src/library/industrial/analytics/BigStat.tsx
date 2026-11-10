import { IconAlertOctagon, IconAlertTriangle, IconCircleCheck, IconInfoCircle } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';
import { TONE_TEXT, TONE_VALUE_TEXT, describeReading, formatValue } from '../status';
import type { Tone } from '../status';

export type BigStatSize = 'lg' | 'xl' | '2xl';

export type BigStatProps = {
  label: string;
  /** `null` prints an em dash. */
  value: number | null;
  unit?: string;
  decimals?: number;
  /** Colours the number. Only for a figure that is itself in an abnormal state. */
  tone?: Tone;
  /** The state in words under the figure, with an icon that repeats the tone as a shape. */
  status?: { tone: Tone; label: string };
  /** One quiet line under the figure: the target, the period, the comparison. */
  caption?: string;
  /** `lg` reads from about 4 m, `xl` from about 6 m and `2xl` from about 10 m on a 55-inch screen. */
  size?: BigStatSize;
  /** Extra content under the caption, e.g. a target bar. */
  children?: ReactNode;
  className?: string;
};

const VALUE_SIZE: Record<BigStatSize, string> = { lg: 'text-6xl', xl: 'text-8xl', '2xl': 'text-9xl' };
const UNIT_SIZE: Record<BigStatSize, string> = { lg: 'text-2xl', xl: 'text-4xl', '2xl': 'text-5xl' };
const LABEL_SIZE: Record<BigStatSize, string> = { lg: 'text-xl', xl: 'text-2xl', '2xl': 'text-3xl' };
const STATUS_SIZE: Record<BigStatSize, string> = { lg: 'text-xl', xl: 'text-2xl', '2xl': 'text-3xl' };
const ICON_SIZE: Record<BigStatSize, string> = { lg: 'size-6', xl: 'size-7', '2xl': 'size-9' };

const ICON: Record<Tone, typeof IconCircleCheck> = {
  neutral: IconInfoCircle,
  success: IconCircleCheck,
  warning: IconAlertTriangle,
  critical: IconAlertOctagon,
  info: IconInfoCircle,
};

/**
 * One figure sized to be read from across a room: label, a very large number with its unit, and
 * optionally the state in words with an icon. For wall displays, where there is room for a few
 * numbers and none for decoration. Nothing in it is smaller than `text-xl`.
 */
export function BigStat({ label, value, unit, decimals = 0, tone = 'neutral', status, caption, size = 'xl', children, className }: BigStatProps) {
  const hasValue = value !== null && Number.isFinite(value);
  const StatusIcon = status ? ICON[status.tone] : null;

  return (
    <div data-slot="big-stat" data-tone={tone} role="group" aria-label={describeReading(label, value, unit, decimals, tone)} className={cn('flex min-w-0 flex-col gap-3', className)}>
      <p className={cn('text-muted-foreground', LABEL_SIZE[size])}>{label}</p>
      <p className="flex flex-wrap items-baseline gap-x-4 leading-none">
        <span data-slot="big-stat-value" className={cn('font-semibold tabular-nums tracking-tight', VALUE_SIZE[size], hasValue ? TONE_VALUE_TEXT[tone] : 'text-muted-foreground')}>
          {formatValue(value, decimals)}
        </span>
        {unit && hasValue ? <span className={cn('text-muted-foreground', UNIT_SIZE[size])}>{unit}</span> : null}
      </p>
      {status && StatusIcon ? (
        <p data-slot="big-stat-status" className={cn('flex items-center gap-3 font-medium text-base-foreground', STATUS_SIZE[size])}>
          <StatusIcon aria-hidden="true" className={cn('shrink-0', ICON_SIZE[size], TONE_TEXT[status.tone])} />
          {status.label}
        </p>
      ) : null}
      {caption ? <p className="text-xl text-muted-foreground tabular-nums">{caption}</p> : null}
      {children}
    </div>
  );
}
