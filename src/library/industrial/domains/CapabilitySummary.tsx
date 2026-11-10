import { cn } from '../../../lib/utils';
import { LABEL_TEXT, SCALE_TEXT, formatReading, formatValue } from '../status';
import type { StatusDescriptor } from '../status';
import { StatusIndicator } from '../StatusIndicator';
import { ValueReadout } from '../ValueReadout';

import { capability, capabilityVerdict, histogram } from './spc';
import type { CapabilityVerdict } from './spc';

export type CapabilitySummaryProps = {
  /** The parameter, e.g. "Wobbe index". */
  label: string;
  /** Individual measurements. */
  values: readonly number[];
  /** Lower and upper specification limits. */
  lsl: number;
  usl: number;
  unit?: string;
  decimals?: number;
  /** Number of histogram bars. */
  bins?: number;
  /** Height of the histogram in pixels. */
  height?: number;
  className?: string;
};

const VERDICT: Record<CapabilityVerdict, StatusDescriptor> = {
  capable: { tone: 'success', label: 'Capable', shape: 'dot' },
  marginal: { tone: 'warning', label: 'Marginal', shape: 'square' },
  'not-capable': { tone: 'critical', label: 'Not capable', shape: 'diamond' },
};

const index2 = (value: number): string => (Number.isFinite(value) ? formatValue(value, 2) : '∞');

/**
 * Process capability at a glance: Cp and Cpk with a verdict, and the histogram of measurements
 * between its specification limits. Bars outside the limits are drawn in the critical colour.
 */
export function CapabilitySummary({ label, values, lsl, usl, unit, decimals = 1, bins = 14, height = 112, className }: CapabilitySummaryProps) {
  const result = capability(values, lsl, usl);
  const verdict = VERDICT[capabilityVerdict(result.cpk)];
  const padding = (usl - lsl) * 0.12;
  const domainMin = Math.min(lsl, ...values) - padding;
  const domainMax = Math.max(usl, ...values) + padding;
  const buckets = histogram(values, bins, domainMin, domainMax);
  const tallest = Math.max(1, ...buckets.map((bucket) => bucket.count));
  const outside = values.filter((value) => value < lsl || value > usl).length;
  const at = (value: number): string => `${((value - domainMin) / (domainMax - domainMin)) * 100}%`;
  const name = `${label} capability: Cp ${index2(result.cp)}, Cpk ${index2(result.cpk)}, ${verdict.label.toLowerCase()}; mean ${formatReading(
    result.mean,
    unit,
    decimals
  )}, ${outside} of ${values.length} outside ${formatValue(lsl, decimals)} to ${formatReading(usl, unit, decimals)}`;

  return (
    <div data-slot="capability-summary" data-verdict={capabilityVerdict(result.cpk)} className={cn('flex w-full min-w-0 flex-col gap-4', className)}>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <div className="flex flex-col gap-1.5">
          <span className={LABEL_TEXT}>Cpk</span>
          <span data-slot="cpk" className={cn('text-2xl font-semibold leading-none tracking-tight tabular-nums text-base-foreground')}>
            {index2(result.cpk)}
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className={LABEL_TEXT}>Cp</span>
          <span data-slot="cp" className="text-base font-semibold leading-none tabular-nums text-base-foreground">
            {index2(result.cp)}
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className={LABEL_TEXT}>Mean</span>
          <ValueReadout size="sm" value={result.mean} unit={unit} decimals={decimals + 1} />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className={LABEL_TEXT}>Std dev</span>
          <ValueReadout size="sm" value={result.sigma} decimals={decimals + 1} />
        </div>
        <StatusIndicator size="sm" className="ml-auto" {...verdict} />
      </div>

      <div role="img" aria-label={name} className="flex flex-col gap-1.5">
        <div className="relative" style={{ height }}>
          <div className="absolute inset-0 flex items-end gap-px">
            {buckets.map((bucket) => {
              const middle = (bucket.from + bucket.to) / 2;
              const isOutside = middle < lsl || middle > usl;
              return (
                <span
                  key={bucket.from}
                  data-slot="histogram-bar"
                  data-outside={isOutside ? 'true' : undefined}
                  className={cn('flex-1 rounded-t-xs', isOutside ? 'bg-chart-critical-450' : 'bg-chart-1-300')}
                  style={{ height: `${(bucket.count / tallest) * 100}%` }}
                />
              );
            })}
          </div>
          <span data-slot="spec-line" className="absolute inset-y-0 border-l border-dashed border-chart-critical-450" style={{ left: at(lsl) }} />
          <span data-slot="spec-line" className="absolute inset-y-0 border-l border-dashed border-chart-critical-450" style={{ left: at(usl) }} />
          <span data-slot="mean-line" className="absolute inset-y-0 border-l border-base-foreground" style={{ left: at(result.mean) }} />
        </div>
        <div className={cn(SCALE_TEXT, 'relative h-3 leading-none')}>
          <span className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: at(lsl) }}>
            LSL {formatValue(lsl, decimals)}
          </span>
          <span className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: at(usl) }}>
            USL {formatValue(usl, decimals)}
          </span>
        </div>
      </div>
    </div>
  );
}
