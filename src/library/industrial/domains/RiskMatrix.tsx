import { useRef } from 'react';
import type { KeyboardEvent } from 'react';

import { cn } from '../../../lib/utils';
import { LABEL_TEXT, TONE_SURFACE } from '../status';
import { StatusIndicator } from '../StatusIndicator';

import { RISK_RATINGS, riskLevel, riskScore, riskStatus } from './safety';
import type { RiskLevel, RiskRating } from './safety';

export type RiskCell = { likelihood: RiskRating; consequence: RiskRating };

export type RiskMatrixProps = {
  /** What is being assessed, e.g. "Residual risk". */
  label: string;
  value: RiskCell | null;
  /** Called with the picked cell. Leave out, or set `readOnly`, to show an assessment without editing it. */
  onChange?: (cell: RiskCell) => void;
  readOnly?: boolean;
  /** An earlier assessment shown as a hollow marker, e.g. the risk before mitigation. */
  reference?: RiskCell & { label: string };
  /** Five names each, rating 1 first. */
  likelihoodLabels?: readonly string[];
  consequenceLabels?: readonly string[];
  className?: string;
};

const LIKELIHOOD = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost certain'];
const CONSEQUENCE = ['Negligible', 'Minor', 'Moderate', 'Major', 'Severe'];

const LEVELS: readonly { level: RiskLevel; range: string }[] = [
  { level: 'low', range: '1–4' },
  { level: 'medium', range: '5–9' },
  { level: 'high', range: '10–16' },
  { level: 'extreme', range: '20–25' },
];

const ROWS: readonly RiskRating[] = [5, 4, 3, 2, 1];

const ARROW: Record<string, { likelihood: number; consequence: number } | undefined> = {
  ArrowUp: { likelihood: 1, consequence: 0 },
  ArrowDown: { likelihood: -1, consequence: 0 },
  ArrowRight: { likelihood: 0, consequence: 1 },
  ArrowLeft: { likelihood: 0, consequence: -1 },
};

const isSame = (a: RiskCell | null | undefined, b: RiskCell): boolean => a?.likelihood === b.likelihood && a.consequence === b.consequence;

/**
 * A 5 × 5 risk matrix that doubles as a picker: likelihood up the side, consequence along the
 * bottom, each cell showing its score on the tint of its risk level. Arrow keys move between
 * cells; the chosen cell is framed and spelled out underneath.
 */
export function RiskMatrix({
  label,
  value,
  onChange,
  readOnly = false,
  reference,
  likelihoodLabels = LIKELIHOOD,
  consequenceLabels = CONSEQUENCE,
  className,
}: RiskMatrixProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const interactive = !readOnly && onChange !== undefined;
  const tabStop: RiskCell = value ?? { likelihood: 1, consequence: 1 };

  const moveFocus = (event: KeyboardEvent<HTMLButtonElement>, cell: RiskCell) => {
    const step = ARROW[event.key];
    if (!step) return;
    event.preventDefault();
    const target = gridRef.current?.querySelector<HTMLElement>(
      `[data-likelihood="${cell.likelihood + step.likelihood}"][data-consequence="${cell.consequence + step.consequence}"]`
    );
    target?.focus();
  };

  return (
    <div data-slot="risk-matrix" className={cn('flex w-full min-w-0 flex-col gap-3', className)}>
      <div className="flex flex-col gap-1.5">
        <span className={LABEL_TEXT}>Likelihood</span>
        <div ref={gridRef} role="radiogroup" aria-label={label} aria-readonly={interactive ? undefined : true} className="grid grid-cols-[auto_repeat(5,minmax(0,1fr))] gap-1">
          {ROWS.map((likelihood) => (
            <div key={likelihood} className="contents">
              <span aria-hidden="true" className={cn(LABEL_TEXT, 'flex items-center pr-2')}>
                {likelihoodLabels[likelihood - 1]}
              </span>
              {RISK_RATINGS.map((consequence) => {
                const cell = { likelihood, consequence };
                const level = riskLevel(likelihood, consequence);
                const status = riskStatus(level);
                const selected = isSame(value, cell);
                const isReference = reference !== undefined && isSame(reference, cell);
                return (
                  <button
                    key={consequence}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={`Likelihood ${likelihoodLabels[likelihood - 1].toLowerCase()}, consequence ${consequenceLabels[consequence - 1].toLowerCase()}: ${status.label.toLowerCase()} risk, score ${riskScore(likelihood, consequence)}${isReference && reference ? `, ${reference.label.toLowerCase()}` : ''}`}
                    aria-disabled={interactive ? undefined : true}
                    tabIndex={isSame(tabStop, cell) ? 0 : -1}
                    data-likelihood={likelihood}
                    data-consequence={consequence}
                    data-level={level}
                    onClick={interactive ? () => onChange(cell) : undefined}
                    onKeyDown={(event) => moveFocus(event, cell)}
                    className={cn(
                      'relative flex h-9 items-center justify-center rounded-md border-2 text-sm tabular-nums outline-none focus-visible:shadow-focus-ring',
                      TONE_SURFACE[status.tone],
                      interactive ? 'cursor-pointer' : 'cursor-default',
                      selected ? 'border-base-foreground font-semibold' : 'border-transparent'
                    )}
                  >
                    {riskScore(likelihood, consequence)}
                    {isReference ? <span data-slot="risk-reference" aria-hidden="true" className="absolute right-1 top-1 size-2 rounded-full border border-base-foreground" /> : null}
                  </button>
                );
              })}
            </div>
          ))}
          <span aria-hidden="true" />
          {RISK_RATINGS.map((consequence) => (
            <span key={consequence} aria-hidden="true" className={cn(LABEL_TEXT, 'truncate pt-1 text-center')}>
              {consequenceLabels[consequence - 1]}
            </span>
          ))}
          <span aria-hidden="true" />
          <span className={cn(LABEL_TEXT, 'col-span-5 text-center')}>Consequence</span>
        </div>
      </div>

      <ul aria-label="Risk levels" className="flex flex-wrap gap-x-4 gap-y-1">
        {LEVELS.map((entry) => (
          <li key={entry.level}>
            <StatusIndicator size="sm" detail={entry.range} {...riskStatus(entry.level)} />
          </li>
        ))}
        {reference ? (
          <li className={cn(LABEL_TEXT, 'flex items-center gap-1.5 text-base-foreground')}>
            <span aria-hidden="true" className="size-2 rounded-full border border-base-foreground" />
            {reference.label}
          </li>
        ) : null}
      </ul>

      <p data-slot="risk-result" aria-live="polite" className="flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-base-foreground">
        {value ? (
          <>
            <span className="font-medium">{label}:</span>
            <StatusIndicator {...riskStatus(riskLevel(value.likelihood, value.consequence))} detail={`score ${riskScore(value.likelihood, value.consequence)}`} />
            <span className="text-muted-foreground">
              {likelihoodLabels[value.likelihood - 1]} × {consequenceLabels[value.consequence - 1].toLowerCase()}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">Pick the cell that matches likelihood and consequence.</span>
        )}
      </p>
    </div>
  );
}
