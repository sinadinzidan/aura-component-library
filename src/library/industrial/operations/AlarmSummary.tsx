import { cn } from '../../../lib/utils';
import { LABEL_TEXT, severityStatus } from '../status';
import type { Severity } from '../status';
import { StatusDot } from '../StatusDot';
import { StatusIndicator } from '../StatusIndicator';
import { ValueReadout } from '../ValueReadout';

import { SEVERITY_ORDER } from './alarms';

export type AlarmSummaryProps = {
  counts: Readonly<Record<Severity, number>>;
  /** `inline` is one line for headers and toolbars; `tiles` is four figures for an overview. */
  variant?: 'inline' | 'tiles';
  /** What is being counted, for the accessible name: "Open alarms". */
  label?: string;
  /** Leading total before the per-severity counts (inline only). */
  showTotal?: boolean;
  className?: string;
};

/**
 * Alarm counts by severity, most severe first. A severity with no alarms stays in place but goes
 * quiet, so the four positions never shift and a zero is as easy to read as a count.
 */
export function AlarmSummary({ counts, variant = 'inline', label = 'Alarms by severity', showTotal = false, className }: AlarmSummaryProps) {
  const total = SEVERITY_ORDER.reduce((sum, severity) => sum + counts[severity], 0);

  if (variant === 'tiles') {
    return (
      <dl data-slot="alarm-summary" aria-label={label} className={cn('grid w-full grid-cols-4 gap-4', className)}>
        {SEVERITY_ORDER.map((severity) => {
          const status = severityStatus(severity);
          const count = counts[severity];
          return (
            <div key={severity} data-severity={severity} className="flex min-w-0 flex-col gap-2">
              <dt className={cn(LABEL_TEXT, 'flex items-center gap-1.5')}>
                <StatusDot size="sm" tone={count > 0 ? status.tone : 'neutral'} shape={status.shape} />
                {status.label}
              </dt>
              <dd>
                <ValueReadout value={count} size="md" tone={count > 0 && severity === 'critical' ? 'critical' : 'neutral'} className={count === 0 ? 'opacity-50' : undefined} />
              </dd>
            </div>
          );
        })}
      </dl>
    );
  }

  return (
    <div data-slot="alarm-summary" role="group" aria-label={label} className={cn('flex flex-wrap items-center gap-x-4 gap-y-1', className)}>
      {showTotal ? (
        <span className="text-sm text-base-foreground">
          <span className="font-medium tabular-nums">{total}</span> open
        </span>
      ) : null}
      {SEVERITY_ORDER.map((severity) => {
        const status = severityStatus(severity);
        const count = counts[severity];
        return (
          <span key={severity} data-severity={severity} className={count === 0 ? 'opacity-50' : undefined}>
            <StatusIndicator size="sm" tone={count > 0 ? status.tone : 'neutral'} shape={status.shape} label={status.label} detail={String(count)} />
          </span>
        );
      })}
    </div>
  );
}
