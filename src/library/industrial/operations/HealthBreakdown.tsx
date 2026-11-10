import { cn } from '../../../lib/utils';
import { TONE_MARK_BG, healthStatus } from '../status';
import { StatusDot } from '../StatusDot';
import { ValueReadout } from '../ValueReadout';

import { DEFAULT_HEALTH_THRESHOLDS, healthFromScore, healthTone } from './health';
import type { HealthThresholds } from './health';

export type HealthIndicator = {
  id: string;
  /** What is assessed: "Vibration", "Lubrication". */
  label: string;
  /** 0–100; `null` when the indicator cannot be assessed. */
  score: number | null;
  /** The finding in a few words: "6.8 mm/s, rising". */
  detail?: string;
};

export type HealthBreakdownProps = {
  indicators: readonly HealthIndicator[];
  thresholds?: HealthThresholds;
  /** Accessible name of the list. */
  label?: string;
  /** Good / Watch / Poor in words after each score. */
  showStatus?: boolean;
  className?: string;
};

/**
 * A health score taken apart: one bar per condition indicator, each judged against the same
 * thresholds. Good bars stay the data colour; watch and poor take their status colour and a
 * shaped dot, so the weak indicator is the only thing that stands out.
 */
export function HealthBreakdown({
  indicators,
  thresholds = DEFAULT_HEALTH_THRESHOLDS,
  label = 'Health by indicator',
  showStatus = true,
  className,
}: HealthBreakdownProps) {
  return (
    <ul data-slot="health-breakdown" aria-label={label} className={cn('flex w-full min-w-0 flex-col gap-3', className)}>
      {indicators.map((indicator) => {
        const health = indicator.score === null ? null : healthFromScore(indicator.score, thresholds);
        const status = health ? healthStatus(health) : null;
        const tone = health ? healthTone(health) : 'neutral';
        return (
          <li key={indicator.id} data-health={health ?? 'unknown'} className="flex min-w-0 flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-sm text-base-foreground">{indicator.label}</span>
              <span className="flex shrink-0 items-baseline gap-2">
                {indicator.detail ? <span className="text-xs text-muted-foreground tabular-nums">{indicator.detail}</span> : null}
                <ValueReadout value={indicator.score} size="xs" tone={tone} className="w-7 justify-end" />
                {showStatus ? (
                  <span className="inline-flex w-14 items-center gap-1.5 text-xs text-muted-foreground">
                    {status ? <StatusDot size="sm" tone={status.tone} shape={status.shape} /> : null}
                    {status ? status.label : 'No data'}
                  </span>
                ) : null}
              </span>
            </div>
            <div
              role="img"
              aria-label={indicator.score === null ? `${indicator.label}: no data` : `${indicator.label}: ${indicator.score} of 100, ${status?.label.toLowerCase()}`}
              className="relative h-1.5 overflow-hidden rounded-full bg-chart-neutral-100"
            >
              {indicator.score === null ? null : (
                <span data-slot="health-bar" className={cn('block h-full rounded-full', TONE_MARK_BG[tone])} style={{ width: `${Math.min(100, Math.max(0, indicator.score))}%` }} />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
