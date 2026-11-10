import { cn } from '../../../lib/utils';
import { LABEL_TEXT, formatReading, formatValue } from '../status';

import { waterfallSteps } from './oee';

export type LossStackProps = {
  /** What the chart shows, e.g. "OEE losses, last 30 days". */
  label: string;
  /** The full amount before any loss, e.g. planned time or planned production. */
  start: { label: string; value: number };
  /** Losses in the order they occur. */
  losses: readonly { label: string; value: number }[];
  /** Name of what is left after the losses. */
  resultLabel: string;
  unit?: string;
  decimals?: number;
  /** `waterfall` steps each loss down on its own row; `stack` puts result and losses in one bar. */
  variant?: 'waterfall' | 'stack';
  className?: string;
};

const LOSS_SEGMENT = ['bg-chart-2-400', 'bg-chart-3-400', 'bg-chart-4-400', 'bg-chart-5-400'];

const percent = (value: number, whole: number): string => `${whole > 0 ? Math.max(0, (value / whole) * 100) : 0}%`;

const MINUS = '−';

/**
 * Where the gap between plan and result went. As a waterfall, every loss hangs from the one before
 * it so the eye follows the drop; as a stack, one bar splits into the result and its losses.
 */
export function LossStack({ label, start, losses, resultLabel, unit, decimals = 1, variant = 'waterfall', className }: LossStackProps) {
  const steps = waterfallSteps(start, losses, resultLabel);
  const result = steps[steps.length - 1];
  const name = `${label}: ${resultLabel} ${formatReading(result.value, unit, decimals)} of ${formatReading(start.value, unit, decimals)}; ${losses
    .map((loss) => `${loss.label} ${formatReading(loss.value, unit, decimals)}`)
    .join(', ')}`;

  if (variant === 'stack') {
    return (
      <div data-slot="loss-stack" data-variant="stack" className={cn('flex w-full min-w-0 flex-col gap-3', className)}>
        <div role="img" aria-label={name} className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full">
          <span data-slot="loss-result" className="h-full bg-chart-1-450" style={{ width: percent(result.value, start.value) }} />
          {losses.map((loss, index) => (
            <span
              key={loss.label}
              data-slot="loss-segment"
              className={cn('h-full', LOSS_SEGMENT[index % LOSS_SEGMENT.length])}
              style={{ width: percent(loss.value, start.value) }}
            />
          ))}
        </div>
        <ul className="flex flex-col gap-1.5 text-sm">
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="size-2 shrink-0 rounded-xs bg-chart-1-450" />
            <span className="font-medium text-base-foreground">{resultLabel}</span>
            <span className="ml-auto font-medium tabular-nums text-base-foreground">{formatReading(result.value, unit, decimals)}</span>
          </li>
          {losses.map((loss, index) => (
            <li key={loss.label} className="flex items-center gap-2">
              <span aria-hidden="true" className={cn('size-2 shrink-0 rounded-xs', LOSS_SEGMENT[index % LOSS_SEGMENT.length])} />
              <span className="text-medium-foreground">{loss.label}</span>
              <span className="ml-auto tabular-nums text-base-foreground">
                {MINUS}
                {formatReading(loss.value, unit, decimals)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div
      data-slot="loss-stack"
      data-variant="waterfall"
      role="img"
      aria-label={name}
      className={cn('grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2', className)}
    >
      {steps.map((step) => (
        <div key={step.label} data-slot="loss-row" data-kind={step.kind} className="contents">
          <span className={step.kind === 'loss' ? LABEL_TEXT : 'text-xs font-medium text-base-foreground'}>{step.label}</span>
          <span className="relative h-4">
            <span
              className={cn(
                'absolute inset-y-0 rounded-sm',
                step.kind === 'start' ? 'bg-chart-neutral-300' : step.kind === 'loss' ? 'bg-chart-1-200' : 'bg-chart-1-450'
              )}
              style={{ left: percent(step.from, start.value), width: percent(step.to - step.from, start.value) }}
            />
          </span>
          <span className={cn('text-right text-sm tabular-nums', step.kind === 'loss' ? 'text-medium-foreground' : 'font-medium text-base-foreground')}>
            {step.kind === 'loss' ? MINUS : ''}
            {formatValue(step.value, decimals)}
            {unit ? <span className="pl-1 text-xs font-normal text-muted-foreground">{unit}</span> : null}
          </span>
        </div>
      ))}
    </div>
  );
}
