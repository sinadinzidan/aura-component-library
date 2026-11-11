import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

import { riskRating } from './permits';

export type RiskPoint = { likelihood: number; consequence: number };

type RiskMatrixProps = {
  label: string;
  /** Likelihood words from 1 (rare) to 5. */
  likelihoods?: readonly string[];
  /** Consequence words from 1 (minor) to 5. */
  consequences?: readonly string[];
  /** The assessed risk before controls. */
  initial?: RiskPoint;
  /** The risk left once the controls are in place. */
  residual?: RiskPoint;
  /** Number of register entries per cell, keyed `likelihood-consequence`. */
  counts?: Readonly<Record<string, number>>;
  /** Makes cells selectable; called with the picked cell. */
  onSelect?: (point: RiskPoint) => void;
  selected?: RiskPoint;
  size?: 'md' | 'lg';
  className?: string;
};

const LIKELIHOODS = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Frequent'];

const CONSEQUENCES = ['Minor', 'Moderate', 'Serious', 'Major', 'Severe'];

const same = (a: RiskPoint | undefined, likelihood: number, consequence: number): boolean => a?.likelihood === likelihood && a.consequence === consequence;

/**
 * A 5 × 5 risk matrix. Cells carry the colour of their band and a word, so the rating never
 * rests on colour alone. Mark the initial and residual risk, show counts from a register, or
 * pass `onSelect` to use it as a picker. Outline looks (blueprint, editorial) draw the bands
 * as tinted outlines instead of solid blocks.
 */
export function RiskMatrix({ label, likelihoods = LIKELIHOODS, consequences = CONSEQUENCES, initial, residual, counts, onSelect, selected, size = 'md', className }: RiskMatrixProps) {
  const look = useLook();
  const solid = look === 'poster' || look === 'signal' || look === 'console';
  const cell = size === 'lg' ? 56 : 44;
  const rows = [5, 4, 3, 2, 1];

  return (
    <div data-look={look} className={cx('flex min-w-0 flex-col gap-2', className)}>
      <div role="grid" aria-label={label} className="grid gap-1" style={{ gridTemplateColumns: `minmax(5.5rem, auto) repeat(5, minmax(${cell}px, 1fr))` }}>
        {rows.map((likelihood) => (
          <div role="row" key={likelihood} className="contents">
            <span role="rowheader" className="flex items-center pr-2 text-xs font-medium text-(--kit-text-2)">
              {likelihoods[likelihood - 1]}
            </span>
            {[1, 2, 3, 4, 5].map((consequence) => {
              const rating = riskRating(likelihood, consequence);
              const isInitial = same(initial, likelihood, consequence);
              const isResidual = same(residual, likelihood, consequence);
              const isSelected = same(selected, likelihood, consequence);
              const count = counts?.[`${likelihood}-${consequence}`];
              const mark = isInitial ? 'Initial' : isResidual ? 'Residual' : isSelected ? 'Picked' : undefined;
              const name = `${likelihoods[likelihood - 1]}, ${consequences[consequence - 1]}: ${rating.label} ${rating.score}${mark ? `, ${mark.toLowerCase()}` : ''}`;
              const body = (
                <>
                  <span className="text-sm font-semibold tabular-nums">{count ?? rating.score}</span>
                  {mark ? <span className="text-xs leading-none font-semibold">{mark}</span> : null}
                </>
              );
              const classes = 'flex w-full flex-col items-center justify-center gap-0.5';
              const style = {
                height: cell,
                borderRadius: 'var(--kit-radius-sm)',
                background: solid || mark ? 'var(--t-solid)' : 'var(--t-soft)',
                color: solid || mark ? 'var(--t-on-solid)' : 'var(--t-on-soft)',
                boxShadow: mark ? '0 0 0 2px var(--kit-surface), 0 0 0 4px var(--kit-text)' : undefined,
              };
              return (
                <div role="gridcell" key={consequence} data-tone={rating.tone} data-mark={mark?.toLowerCase()} aria-selected={onSelect ? isSelected : undefined}>
                  {onSelect ? (
                    <button type="button" aria-label={name} onClick={() => onSelect({ likelihood, consequence })} className={cx(classes, 'cursor-pointer outline-offset-2 focus-visible:outline-2')} style={style}>
                      {body}
                    </button>
                  ) : (
                    <div aria-label={name} className={classes} style={style}>
                      {body}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        <div role="row" className="contents">
          <span role="rowheader" className="pt-1 text-xs text-(--kit-text-3)">
            Likelihood ↑
          </span>
          {consequences.map((consequence) => (
            <span role="columnheader" key={consequence} className="pt-1 text-center text-xs font-medium text-(--kit-text-2)">
              {consequence}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
