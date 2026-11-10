import { cn } from '../../../lib/utils';
import { toFraction } from '../geometry';
import { LABEL_TEXT, SCALE_TEXT, TONE_MARK_BG, formatLimit, formatValue } from '../status';
import type { Tone } from '../status';
import { StatusIndicator } from '../StatusIndicator';
import { ValueReadout } from '../ValueReadout';

import { judgeCompliance } from './compliance';
import type { ComplianceLimit } from './compliance';

export type ComplianceTileProps = {
  /** The regulated parameter, e.g. "Turbidity, treated water". */
  label: string;
  value: number;
  unit?: string;
  decimals?: number;
  /** The regulatory limit: a maximum, a minimum or both. */
  limit: ComplianceLimit;
  /** Ends of the drawn scale. Default to zero and a quarter beyond the upper limit. */
  scaleMin?: number;
  scaleMax?: number;
  /** Where the limit comes from and the period judged: "Drinking water regulation · 30-day rolling". */
  basis?: string;
  /** Samples in the period that met the limit. */
  samples?: { compliant: number; total: number };
  className?: string;
};

function limitText(limit: ComplianceLimit, unit: string | undefined, decimals: number): string {
  const suffix = unit ? ` ${unit}` : '';
  if (limit.min !== undefined && limit.max !== undefined) return `Limit ${formatLimit(limit.min, decimals)}–${formatLimit(limit.max, decimals)}${suffix}`;
  if (limit.max !== undefined) return `Limit ≤ ${formatLimit(limit.max, decimals)}${suffix}`;
  if (limit.min !== undefined) return `Limit ≥ ${formatLimit(limit.min, decimals)}${suffix}`;
  return 'No limit set';
}

/**
 * A reading against its regulatory limit: the value, where it sits on a scale with the limit
 * marked, the verdict in words and how many samples complied. The number stays neutral while the
 * limit is met with margin; it takes a status colour only when close to or past the limit.
 */
export function ComplianceTile({ label, value, unit, decimals = 0, limit, scaleMin, scaleMax, basis, samples, className }: ComplianceTileProps) {
  const result = judgeCompliance(value, limit);
  const valueTone: Tone = result.verdict === 'within' ? 'neutral' : result.tone;
  const min = scaleMin ?? Math.min(0, value, limit.min ?? 0);
  const max = scaleMax ?? Math.max(value, (limit.max ?? limit.min ?? value) * 1.25);
  const ticks = [limit.min, limit.max].filter((tick): tick is number => tick !== undefined);
  const text = limitText(limit, unit, decimals);

  return (
    <div data-slot="compliance-tile" data-verdict={result.verdict} className={cn('flex w-full min-w-0 flex-col gap-3 rounded-xl border border-default bg-card-background p-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <span className={LABEL_TEXT}>{label}</span>
        <StatusIndicator size="sm" tone={result.tone} label={result.label} shape={result.shape} />
      </div>
      <ValueReadout size="md" value={value} unit={unit} decimals={decimals} tone={valueTone} />
      <div
        role="img"
        aria-label={`${label}: ${formatValue(value, decimals)}${unit ? ` ${unit}` : ''}, ${text.toLowerCase()}, ${result.label.toLowerCase()}`}
        className="relative"
      >
        <div className="h-2 overflow-hidden rounded-full bg-chart-neutral-100">
          <div data-slot="compliance-fill" className={cn('h-full rounded-full', TONE_MARK_BG[valueTone])} style={{ width: `${toFraction(value, min, max) * 100}%` }} />
        </div>
        {ticks.map((tick) => (
          <span key={tick} data-slot="compliance-limit" className="absolute -top-1 h-4 w-px bg-base-foreground" style={{ left: `${toFraction(tick, min, max) * 100}%` }} />
        ))}
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className={SCALE_TEXT}>{text}</span>
        {samples ? (
          <span className={SCALE_TEXT}>
            {formatValue(samples.compliant, 0)} of {formatValue(samples.total, 0)} samples compliant
          </span>
        ) : null}
      </div>
      {basis ? <p className={LABEL_TEXT}>{basis}</p> : null}
    </div>
  );
}
