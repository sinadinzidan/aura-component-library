import type { CSSProperties } from 'react';

import type { LookId } from '../../looks/looks';
import { useLook } from '../../looks/useLook';
import { cx, formatNumber, type Tone } from '../tones';

export type HeatGridRow = {
  id: string;
  label: string;
  /** One value per column; `null` marks a cell without data. */
  values: readonly (number | null)[];
};

type HeatGridProps = {
  /** What the grid shows, in words. */
  label: string;
  rows: readonly HeatGridRow[];
  /** One caption per column. */
  columns: readonly string[];
  /** Write only every nth column caption, when there are many. */
  columnEvery?: number;
  /** Value that maps to the strongest colour. Defaults to the largest magnitude in the grid. */
  max?: number;
  tone?: Tone;
  /** Tone for values below zero, for a diverging scale such as correlation. */
  negativeTone?: Tone;
  /** Print the value in each cell. */
  showValues?: boolean;
  decimals?: number;
  /** Cell height in px. */
  cellHeight?: number;
  /** What the colour measures, with the ends of the scale named. */
  scale?: { label: string; low: string; high: string };
  /** The selected cell. */
  selected?: { row: string; column: number };
  /** Makes cells buttons. */
  onSelect?: (cell: { row: string; column: number }) => void;
  className?: string;
};

const GAP: Record<LookId, number> = { studio: 3, console: 1, poster: 2, glass: 4, editorial: 1, soft: 5, blueprint: 0, signal: 2 };
const RADIUS: Record<LookId, number> = { studio: 4, console: 0, poster: 0, glass: 7, editorial: 0, soft: 10, blueprint: 0, signal: 2 };
const SCALE_STEPS = [8, 30, 52, 76, 100];

function cellStyle(look: LookId, level: number): CSSProperties {
  const base = look === 'poster' ? 'var(--kit-surface)' : 'var(--t-soft)';
  return {
    background: `color-mix(in oklab, var(--t-solid) ${level}%, ${base})`,
    color: level >= 55 ? 'var(--t-on-solid)' : look === 'poster' ? 'var(--kit-text)' : 'var(--t-on-soft)',
    borderRadius: RADIUS[look],
    border: look === 'blueprint' ? '1px solid var(--kit-rule)' : undefined,
    margin: look === 'blueprint' ? '0 -1px -1px 0' : undefined,
  };
}

/**
 * A matrix of values as coloured cells — hour by weekday, asset by day, tag by tag. Intensity is
 * one tone on the look's own scale; cells can print their value, mark missing data with hatching
 * and be selected.
 */
export function HeatGrid({
  label,
  rows,
  columns,
  columnEvery = 1,
  max,
  tone = 'accent',
  negativeTone,
  showValues = false,
  decimals = 0,
  cellHeight = 28,
  scale,
  selected,
  onSelect,
  className,
}: HeatGridProps) {
  const look = useLook();
  const top = max ?? Math.max(1, ...rows.flatMap((row) => row.values.map((value) => Math.abs(value ?? 0))));
  const gap = GAP[look];
  const template = { gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`, gap };
  const frame: CSSProperties = look === 'poster' ? { background: 'var(--kit-text)', padding: 2 } : {};
  const interactive = Boolean(onSelect);

  return (
    <div data-look={look} className={cx('flex min-w-0 flex-col gap-3 text-[var(--kit-text)]', className)}>
      <div role={interactive ? 'group' : 'img'} aria-label={label} className="grid items-center gap-x-3" style={{ gridTemplateColumns: 'auto minmax(0, 1fr)', rowGap: look === 'poster' ? 0 : gap }}>
        {rows.map((row, rowIndex) => (
          <div key={row.id} className="contents">
            <span className="whitespace-nowrap text-sm font-medium leading-5">{row.label}</span>
            <div
              className="grid"
              style={{ ...template, ...frame, paddingTop: look === 'poster' && rowIndex > 0 ? 0 : frame.padding }}
            >
              {row.values.map((value, column) => {
                const picked = selected?.row === row.id && selected.column === column;
                const text = value === null ? 'no data' : formatNumber(value, decimals);
                const name = `${row.label}, ${columns[column] ?? ''}: ${text}`;
                const level = value === null ? 0 : Math.round(Math.max(0.06, Math.min(1, Math.abs(value) / top)) * 100);
                const style: CSSProperties =
                  value === null
                    ? {
                        height: cellHeight,
                        borderRadius: RADIUS[look],
                        border: '1px dashed var(--kit-rule-strong)',
                        background: 'repeating-linear-gradient(135deg, var(--kit-rule) 0 1px, var(--kit-halo) 1px 6px)',
                      }
                    : { ...cellStyle(look, level), height: cellHeight };
                const ring = picked ? 'outline outline-2 outline-offset-1 outline-[var(--kit-text)] relative z-10' : '';
                const classes = cx('flex min-w-0 items-center justify-center text-xs font-semibold tabular-nums leading-none', ring);
                const cellTone = value !== null && value < 0 && negativeTone ? negativeTone : tone;
                const content = showValues && value !== null ? text : null;
                return onSelect ? (
                  <button
                    key={column}
                    type="button"
                    aria-label={name}
                    aria-pressed={picked}
                    data-cell={value ?? 'none'}
                    data-tone={cellTone}
                    className={cx(classes, 'cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--kit-text)]')}
                    style={style}
                    onClick={() => onSelect({ row: row.id, column })}
                  >
                    {content}
                  </button>
                ) : (
                  <span key={column} title={name} data-cell={value ?? 'none'} data-tone={cellTone} className={classes} style={style}>
                    {content}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
        <span />
        <div aria-hidden="true" className="grid pt-1 text-xs tabular-nums leading-4 text-[var(--kit-text-2)]" style={template}>
          {columns.map((column, index) => (
            <span key={index} className="min-w-0 whitespace-nowrap text-center">
              {index % columnEvery === 0 ? column : ''}
            </span>
          ))}
        </div>
      </div>
      {scale ? (
        <div data-tone={tone} className="flex items-center gap-2 text-xs leading-4 text-[var(--kit-text-2)]">
          <span className="font-medium text-[var(--kit-text)]">{scale.label}</span>
          <span className="ml-auto">{scale.low}</span>
          <span className="flex" style={{ gap: look === 'poster' ? 0 : Math.min(gap, 2) }}>
            {SCALE_STEPS.map((level) => (
              <span key={level} className="h-3 w-6" style={{ ...cellStyle(look, level), margin: 0, border: look === 'poster' ? '2px solid var(--kit-text)' : cellStyle(look, level).border, borderRadius: Math.min(RADIUS[look], 3) }} />
            ))}
          </span>
          <span>{scale.high}</span>
        </div>
      ) : null}
    </div>
  );
}
