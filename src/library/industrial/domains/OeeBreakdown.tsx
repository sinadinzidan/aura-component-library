import { cn } from '../../../lib/utils';
import { ProgressRing } from '../ProgressRing';
import { LABEL_TEXT, SCALE_TEXT, formatReading } from '../status';
import { ValueReadout } from '../ValueReadout';

import { oee } from './oee';
import type { OeeFactors } from './oee';

export type OeeBreakdownProps = OeeFactors & {
  decimals?: number;
  /** `equation` prints A × P × Q = OEE as numbers; `rings` draws each factor as a ring. */
  layout?: 'equation' | 'rings';
  /** OEE target, printed under the result. */
  target?: number;
  className?: string;
};

const FACTORS = [
  { key: 'availability', label: 'Availability' },
  { key: 'performance', label: 'Performance' },
  { key: 'quality', label: 'Quality' },
] as const;

function Operator({ symbol }: { symbol: string }) {
  return (
    <span aria-hidden="true" className="text-base text-muted-foreground">
      {symbol}
    </span>
  );
}

/**
 * OEE shown as what it is: availability × performance × quality. The result is computed from the
 * factors, so the equation on screen always holds.
 */
export function OeeBreakdown({ availability, performance, quality, decimals = 1, layout = 'equation', target, className }: OeeBreakdownProps) {
  const factors = { availability, performance, quality };
  const result = oee(factors);
  const name = `OEE ${formatReading(result, '%', decimals)}: ${FACTORS.map((factor) => `${factor.label.toLowerCase()} ${formatReading(factors[factor.key], '%', decimals)}`).join(' × ')}`;

  if (layout === 'rings') {
    return (
      <div data-slot="oee-breakdown" role="group" aria-label={name} className={cn('flex flex-wrap items-center gap-x-4 gap-y-3', className)}>
        {FACTORS.map((factor, index) => (
          <div key={factor.key} className="flex items-center gap-4">
            {index > 0 ? <Operator symbol="×" /> : null}
            <ProgressRing size="md" label={factor.label} value={factors[factor.key]} decimals={decimals} showLabel />
          </div>
        ))}
        <Operator symbol="=" />
        <ProgressRing size="lg" label="OEE" value={result} decimals={decimals} showLabel />
      </div>
    );
  }

  return (
    <div data-slot="oee-breakdown" role="group" aria-label={name} className={cn('flex flex-wrap items-end gap-x-3 gap-y-3', className)}>
      {FACTORS.map((factor, index) => (
        <div key={factor.key} className="flex items-end gap-3">
          {index > 0 ? <Operator symbol="×" /> : null}
          <div className="flex flex-col gap-1.5">
            <span className={LABEL_TEXT}>{factor.label}</span>
            <ValueReadout size="sm" value={factors[factor.key]} unit="%" decimals={decimals} />
          </div>
        </div>
      ))}
      <Operator symbol="=" />
      <div className="flex flex-col gap-1.5">
        <span className={LABEL_TEXT}>OEE</span>
        <span className="flex items-baseline gap-2">
          <ValueReadout size="md" value={result} unit="%" decimals={decimals} />
          {target !== undefined ? <span className={SCALE_TEXT}>Target {formatReading(target, '%', decimals)}</span> : null}
        </span>
      </div>
    </div>
  );
}
