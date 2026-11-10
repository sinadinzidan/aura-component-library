import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';
import { LABEL_TEXT } from '../status';
import type { GoodDirection } from '../status';
import { StatusIndicator } from '../StatusIndicator';
import { TrendDelta } from '../TrendDelta';
import { ValueReadout } from '../ValueReadout';

import { runStatus } from './scenarios';
import type { RunStatus } from './scenarios';

export type ScenarioAssumption = { label: string; value: string };

export type ScenarioResult = {
  label: string;
  value: number;
  unit?: string;
  decimals?: number;
  /** Baseline value the result is compared with. */
  baseline?: number;
  goodDirection?: GoodDirection;
};

export type ScenarioCardProps = {
  name: string;
  /** One line on what the scenario tests. */
  description?: string;
  status: RunStatus;
  /** Detail after the status: "62 %", "2 min ago", "Solver did not converge". */
  statusDetail?: string;
  /** The inputs that differ from the baseline. Three or four read well. */
  assumptions: readonly ScenarioAssumption[];
  /** Headline result, once the run is done. */
  result?: ScenarioResult;
  /** Who made it and when: "Aisha Khan · 12 Mar, 11:20". */
  meta?: string;
  /** Buttons for the card's footer. */
  actions?: ReactNode;
  className?: string;
};

/**
 * One what-if scenario: its name, what was changed from the baseline, where its run stands and —
 * once it is done — the headline result with its change against the baseline. Assumptions come
 * before the result on purpose: a result nobody can trace to its inputs is not worth much.
 */
export function ScenarioCard({ name, description, status, statusDetail, assumptions, result, meta, actions, className }: ScenarioCardProps) {
  const descriptor = runStatus(status);

  return (
    <article
      data-slot="scenario-card"
      data-status={status}
      aria-label={`Scenario ${name}, ${descriptor.label.toLowerCase()}`}
      className={cn('flex w-full min-w-0 flex-col gap-4 rounded-xl border border-default bg-card-background p-4', className)}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="text-sm font-medium text-base-foreground">{name}</h3>
          {description ? <p className={LABEL_TEXT}>{description}</p> : null}
        </div>
        <StatusIndicator size="sm" {...descriptor} detail={statusDetail} pulse={status === 'running'} />
      </header>

      <dl aria-label="Assumptions" className="flex flex-col gap-1.5 text-xs">
        {assumptions.map((assumption) => (
          <div key={assumption.label} className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{assumption.label}</dt>
            <dd className="whitespace-nowrap tabular-nums text-base-foreground">{assumption.value}</dd>
          </div>
        ))}
      </dl>

      {result ? (
        <div data-slot="scenario-result" className="flex flex-col gap-1.5 border-t border-default pt-3">
          <span className={LABEL_TEXT}>{result.label}</span>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <ValueReadout size="md" value={result.value} unit={result.unit} decimals={result.decimals ?? 1} />
            {result.baseline === undefined ? null : (
              <TrendDelta size="sm" value={result.value} reference={result.baseline} decimals={result.decimals ?? 1} goodDirection={result.goodDirection} caption="vs baseline" />
            )}
          </div>
        </div>
      ) : null}

      {meta || actions ? (
        <footer className="mt-auto flex flex-wrap items-center justify-between gap-2">
          {meta ? <span className={LABEL_TEXT}>{meta}</span> : <span />}
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </footer>
      ) : null}
    </article>
  );
}
