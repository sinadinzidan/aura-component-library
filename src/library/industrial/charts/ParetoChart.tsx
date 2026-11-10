import type { CategoryRow } from './CategoryChart';
import { CategoryChart } from './CategoryChart';
import { paretoRows, vitalFew } from './stats';
import type { ParetoInput } from './stats';

export type ParetoChartProps = {
  /** What is being ranked, e.g. "Downtime by cause, last 30 days". The finding is appended. */
  label: string;
  /** Causes in any order; they are sorted largest first. */
  rows: readonly ParetoInput[];
  unit?: string;
  decimals?: number;
  /** Cumulative share that separates the vital few from the rest. */
  threshold?: number;
  /** Name of the bar series in the legend and tooltip. */
  valueLabel?: string;
  legend?: boolean;
  /** Replaces the generated one-line finding. */
  summary?: string;
  heightClassName?: string;
  className?: string;
};

const round = (value: number): number => Math.round(value * 10) / 10;

/** "3 of 7 causes account for 82 % of the total." */
export function paretoSummary(rows: readonly ParetoInput[], threshold = 80): string {
  const sorted = paretoRows(rows);
  if (sorted.length === 0) return 'No data.';
  const few = vitalFew(sorted, threshold);
  return `${few} of ${sorted.length} causes account for ${Math.round(sorted[few - 1].cumulative)} % of the total; the largest is ${sorted[0].label}.`;
}

/**
 * Pareto chart: causes sorted largest first as bars, with the running share as a line against a
 * percent axis and a marker at 80 %. The causes that make up the first 80 % are drawn strongest,
 * so the eye lands on what to fix first.
 */
export function ParetoChart({
  label,
  rows,
  unit,
  decimals = 0,
  threshold = 80,
  valueLabel = 'Amount',
  legend = false,
  summary,
  heightClassName = 'h-64',
  className,
}: ParetoChartProps) {
  const sorted = paretoRows(rows);
  const few = vitalFew(sorted, threshold);
  const vital = new Set(sorted.slice(0, few).map((row) => row.label));
  const data: CategoryRow[] = sorted.map((row) => ({ category: row.label, value: row.value, cumulative: round(row.cumulative) }));
  const finding = summary ?? paretoSummary(rows, threshold);

  return (
    <CategoryChart
      label={`${label}. ${finding}`}
      rows={data}
      series={[
        { key: 'value', label: valueLabel, color: 'var(--color-chart-1-450)' },
        { key: 'cumulative', label: 'Cumulative share', type: 'line', axis: 'right', color: 'var(--color-chart-neutral-450)' },
      ]}
      colorOf={(row, key) => (key === 'value' && !vital.has(String(row.category)) ? 'var(--color-chart-1-200)' : undefined)}
      references={[{ value: threshold, label: `${threshold} %`, axis: 'right', tone: 'neutral', align: 'left' }]}
      rightDomain={[0, 100]}
      unit={unit}
      rightUnit="%"
      decimals={decimals}
      legend={legend}
      summary={finding}
      heightClassName={heightClassName}
      className={className}
    />
  );
}
