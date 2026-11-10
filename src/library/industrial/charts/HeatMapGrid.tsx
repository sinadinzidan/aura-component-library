import { cn } from '../../../lib/utils';
import { formatReading, formatValue } from '../status';

import { HEAT_LEVEL_BG, HeatScaleLegend } from './HeatScaleLegend';
import { heatLevel } from './stats';
import { extent } from './trendData';

export type HeatMapGridProps = {
  /** What the grid shows, with the key finding. Becomes the table's accessible name. */
  label: string;
  /** Row names, top to bottom. */
  rows: readonly string[];
  /** Column names, left to right. */
  columns: readonly string[];
  /** One array per row with a value per column. `null` is a cell without data. */
  values: readonly (readonly (number | null)[])[];
  /** Value range mapped to the lowest and highest step. Defaults to the data. */
  domain?: readonly [number, number];
  unit?: string;
  decimals?: number;
  /** Print the value in each cell. Needs cells of at least `h-8`. */
  showValues?: boolean;
  /** Show every nth column label, for dense grids such as 24 hours. */
  columnLabelEvery?: number;
  /** Tailwind height of a cell, e.g. `h-6`. */
  cellClassName?: string;
  /** Tailwind width of the row-name column, e.g. `w-12`. */
  rowLabelClassName?: string;
  /** Colour key under the grid. Pass the texts for both ends. */
  legend?: { low: string; high: string; title?: string; empty?: string };
  /** One line under the grid saying what it shows. */
  summary?: string;
  className?: string;
};

/** Text colour that stays readable on each heat step in light and dark themes. */
const HEAT_LEVEL_TEXT: readonly string[] = ['text-base-foreground', 'text-base-foreground', 'text-base-background', 'text-base-background'];

/**
 * A heat map as a plain table on the `heat-map-*` tokens: no chart library, real row and column
 * headers, every value available to assistive technology. Use it for hour × weekday patterns,
 * asset × day matrices, calendars and correlation tables.
 */
export function HeatMapGrid({
  label,
  rows,
  columns,
  values,
  domain,
  unit,
  decimals = 0,
  showValues = false,
  columnLabelEvery = 1,
  cellClassName = 'h-6',
  rowLabelClassName = 'w-12',
  legend,
  summary,
  className,
}: HeatMapGridProps) {
  const range = domain ?? extent(values.flat()) ?? [0, 1];

  return (
    <figure data-slot="heat-map-grid" className={cn('m-0 flex w-full min-w-0 flex-col gap-2', className)}>
      <table aria-label={label} className="w-full table-fixed border-separate border-spacing-0.5">
        <thead>
          <tr>
            <td className={rowLabelClassName} />
            {columns.map((column, index) => (
              <th key={`${column}-${index}`} scope="col" className="overflow-visible pb-1 text-center text-xs font-normal whitespace-nowrap text-muted-foreground tabular-nums">
                <span className={index % columnLabelEvery === 0 ? undefined : 'sr-only'}>{column}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row}>
              <th scope="row" className={cn('truncate pr-2 text-left text-xs font-normal text-muted-foreground', rowLabelClassName)}>
                {row}
              </th>
              {columns.map((column, columnIndex) => {
                const value = values[rowIndex]?.[columnIndex] ?? null;
                const level = value === null ? null : heatLevel(value, range[0], range[1], HEAT_LEVEL_BG.length);
                return (
                  <td
                    key={`${column}-${columnIndex}`}
                    data-slot="heat-cell"
                    data-level={level ?? 'empty'}
                    title={`${row}, ${column}: ${value === null ? 'no data' : formatReading(value, unit, decimals)}`}
                    className={cn(
                      'rounded-xs p-0 text-center text-xs tabular-nums',
                      cellClassName,
                      level === null ? 'bg-muted-background text-muted-foreground' : cn(HEAT_LEVEL_BG[level], HEAT_LEVEL_TEXT[level])
                    )}
                  >
                    <span className={showValues ? undefined : 'sr-only'}>{value === null ? 'No data' : formatValue(value, decimals)}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {legend ? <HeatScaleLegend lowLabel={legend.low} highLabel={legend.high} title={legend.title} emptyLabel={legend.empty} /> : null}
      {summary ? <figcaption className="text-xs text-muted-foreground">{summary}</figcaption> : null}
    </figure>
  );
}
