import type { CSSProperties } from 'react';

import type { LookId } from '../../looks/looks';
import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

import { RISK_LABEL, RISK_TONE, riskLevel, type RiskItem } from './risk';

export type RiskCell = { likelihood: number; consequence: number };

type RiskMatrixProps = {
  /** What is being assessed, in words. */
  label: string;
  items: readonly RiskItem[];
  /** `counts` prints how many risks sit in a cell; `names` lists them. */
  mode?: 'counts' | 'names';
  /** Captions for likelihood 1–5, bottom to top. */
  likelihoodLabels?: readonly string[];
  /** Captions for consequence 1–5, left to right. */
  consequenceLabels?: readonly string[];
  selected?: RiskCell | null;
  /** Makes cells buttons. */
  onSelect?: (cell: RiskCell) => void;
  /** Cell height in px. */
  cellHeight?: number;
  className?: string;
};

const LIKELIHOOD = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost certain'] as const;
const CONSEQUENCE = ['Minor', 'Moderate', 'Serious', 'Major', 'Catastrophic'] as const;
const SCALE = [5, 4, 3, 2, 1];
const GAP: Record<LookId, number> = { studio: 4, console: 1, poster: 2, glass: 6, editorial: 1, soft: 8, blueprint: 0, signal: 3 };
const RADIUS: Record<LookId, number> = { studio: 8, console: 0, poster: 0, glass: 12, editorial: 0, soft: 16, blueprint: 0, signal: 3 };

/**
 * Likelihood against consequence on a five by five grid. Every cell carries its level as colour;
 * occupied cells are filled and print their count or their risks, so the eye lands on where the
 * risk actually is.
 */
export function RiskMatrix({
  label,
  items,
  mode = 'counts',
  likelihoodLabels = LIKELIHOOD,
  consequenceLabels = CONSEQUENCE,
  selected,
  onSelect,
  cellHeight = 64,
  className,
}: RiskMatrixProps) {
  const look = useLook();
  const gap = GAP[look];
  const frame: CSSProperties = look === 'poster' ? { background: 'var(--kit-text)', padding: 2 } : {};

  return (
    <div data-look={look} className={cx('grid min-w-0 gap-x-3 gap-y-2 text-[var(--kit-text)]', className)} style={{ gridTemplateColumns: 'auto minmax(0, 1fr)' }}>
      <div className="grid text-right text-xs font-medium leading-4 text-[var(--kit-text-2)]" style={{ gridTemplateRows: 'repeat(5, minmax(0, 1fr))', gap, padding: frame.padding }}>
        {SCALE.map((likelihood) => (
          <span key={likelihood} className="flex items-center justify-end whitespace-nowrap">
            {likelihoodLabels[likelihood - 1]}
          </span>
        ))}
      </div>
      <div role="group" aria-label={label} className="grid" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap, ...frame }}>
        {SCALE.flatMap((likelihood) =>
          [1, 2, 3, 4, 5].map((consequence) => {
            const inside = items.filter((item) => item.likelihood === likelihood && item.consequence === consequence);
            const level = riskLevel(likelihood, consequence);
            const filled = inside.length > 0;
            const picked = selected?.likelihood === likelihood && selected.consequence === consequence;
            const base = look === 'poster' || look === 'blueprint' ? 'var(--kit-halo)' : 'var(--kit-track)';
            const style: CSSProperties = {
              minHeight: cellHeight,
              borderRadius: RADIUS[look],
              background: filled ? 'var(--t-solid)' : `color-mix(in oklab, var(--t-solid) ${look === 'signal' ? 34 : 20}%, ${base})`,
              color: filled ? 'var(--t-on-solid)' : 'var(--kit-text-2)',
              border: look === 'blueprint' ? '1px solid var(--kit-rule-strong)' : undefined,
              margin: look === 'blueprint' ? '0 -1px -1px 0' : undefined,
            };
            const name = `${likelihoodLabels[likelihood - 1]}, ${consequenceLabels[consequence - 1]}: ${inside.length} ${inside.length === 1 ? 'risk' : 'risks'}, ${RISK_LABEL[level].toLowerCase()}`;
            const classes = cx(
              'flex min-w-0 flex-col items-center justify-center gap-1 p-1.5 text-center',
              picked ? 'relative z-10 outline outline-[3px] outline-offset-2 outline-[var(--kit-text)]' : ''
            );
            const content =
              mode === 'names' ? (
                <span className="flex flex-wrap justify-center gap-x-2 gap-y-0.5 text-xs font-semibold tabular-nums leading-4">
                  {inside.map((item) => (
                    <span key={item.id} className="whitespace-nowrap">{item.label}</span>
                  ))}
                </span>
              ) : filled ? (
                <span className="text-2xl font-semibold tabular-nums leading-none">{inside.length}</span>
              ) : null;
            return onSelect ? (
              <button
                key={`${likelihood}-${consequence}`}
                type="button"
                aria-label={name}
                aria-pressed={picked}
                data-level={level}
                data-count={inside.length}
                data-tone={RISK_TONE[level]}
                className={cx(classes, 'cursor-pointer focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--kit-text)]')}
                style={style}
                onClick={() => onSelect({ likelihood, consequence })}
              >
                {content}
              </button>
            ) : (
              <div key={`${likelihood}-${consequence}`} title={name} data-level={level} data-count={inside.length} data-tone={RISK_TONE[level]} className={classes} style={style}>
                {content}
              </div>
            );
          })
        )}
      </div>
      <span className="text-right text-xs font-semibold leading-4">Likelihood</span>
      <div className="grid text-center text-xs font-medium leading-4 text-[var(--kit-text-2)]" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap, paddingInline: frame.padding }}>
        {consequenceLabels.map((caption) => (
          <span key={caption}>{caption}</span>
        ))}
      </div>
      <span />
      <span className="text-center text-xs font-semibold leading-4">Consequence</span>
    </div>
  );
}
