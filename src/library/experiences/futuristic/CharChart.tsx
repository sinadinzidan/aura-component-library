import { cn } from '../../../lib/utils';
import { formatReading, formatValue } from '../../industrial/status';

import { NEON_TEXT, NEON_TONE } from './neon';
import type { NeonTone } from './neon';
import { columnChart, resample, rowOfValue, textDomain } from './textCharts';

export type CharChartProps = {
  /** Oldest first. Longer series are averaged down to `columns`. */
  values: readonly number[];
  /** What the chart shows, e.g. "23-PT-92531 discharge pressure, last 48 hours". */
  label: string;
  columns?: number;
  rows?: number;
  /** Reference value drawn as a dashed row, such as a high limit. */
  limit?: number;
  unit?: string;
  decimals?: number;
  /** Captions under the left and right ends of the time axis. */
  startLabel?: string;
  endLabel?: string;
  tone?: NeonTone;
  className?: string;
};

const LIMIT_CHAR = '┄';

/**
 * A column chart made of characters: block cells for the series, box-drawing characters for the
 * axes, a dashed row for a limit. One picture for assistive technology, with the latest value
 * and range in its name. For text-mode screens; it trades precision for character.
 */
export function CharChart({
  values,
  label,
  columns = 48,
  rows = 8,
  limit,
  unit,
  decimals = 1,
  startLabel,
  endLabel,
  tone = 'accent',
  className,
}: CharChartProps) {
  const series = resample(values, columns);
  const domain = textDomain(series, limit === undefined ? [] : [limit]);
  const limitRow = limit === undefined ? null : rowOfValue(limit, rows, domain);
  const chartRows = columnChart(series, rows, domain).map((row, index) =>
    index === limitRow ? row.replace(/ /g, LIMIT_CHAR) : row
  );
  const top = formatValue(domain[1], decimals);
  const bottom = formatValue(domain[0], decimals);
  const limitText = limit === undefined ? '' : formatValue(limit, decimals);
  const gutter = Math.max(top.length, bottom.length, limitText.length);
  const axisLabel = (index: number): string => {
    if (index === 0) return top;
    if (index === rows - 1) return bottom;
    if (index === limitRow) return limitText;
    return '';
  };
  const description =
    values.length === 0
      ? `${label}: no data`
      : `${label}: latest ${formatReading(values[values.length - 1], unit, decimals)}, range ${formatValue(Math.min(...values), decimals)} to ${formatValue(Math.max(...values), decimals)}${limit === undefined ? '' : `, limit ${limitText}`}`;

  return (
    <div
      data-slot="char-chart"
      role="img"
      aria-label={description}
      className={cn(NEON_TONE[tone], 'inline-block whitespace-pre font-mono text-xs leading-none', className)}
    >
      {chartRows.map((row, index) => (
        <div key={index} data-slot="char-chart-row" aria-hidden="true">
          <span className="text-muted-foreground">
            {axisLabel(index).padStart(gutter)}
            {axisLabel(index) ? ' ┤' : ' │'}
          </span>
          {row.split(new RegExp(`(${LIMIT_CHAR}+)`)).map((run, runIndex) =>
            run.startsWith(LIMIT_CHAR) ? (
              <span key={runIndex} data-slot="char-chart-limit" className="text-warning-foreground-strong">
                {run}
              </span>
            ) : (
              <span key={runIndex} className={NEON_TEXT}>
                {run}
              </span>
            )
          )}
        </div>
      ))}
      <div aria-hidden="true" className="text-muted-foreground">
        {`${' '.repeat(gutter)} └${'─'.repeat(series.length)}`}
      </div>
      {startLabel || endLabel ? (
        <div aria-hidden="true" className="pt-1 text-muted-foreground">
          {`${' '.repeat(gutter + 2)}${startLabel ?? ''}${(endLabel ?? '').padStart(Math.max(series.length - (startLabel ?? '').length, (endLabel ?? '').length + 1))}`}
        </div>
      ) : null}
    </div>
  );
}
