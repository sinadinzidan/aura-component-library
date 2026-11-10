import { cn } from '../../../lib/utils';
import { LinearGauge } from '../LinearGauge';
import { Sparkline } from '../Sparkline';
import { LABEL_TEXT, NO_VALUE, formatValue } from '../status';
import { StatusIndicator } from '../StatusIndicator';
import { ValueReadout } from '../ValueReadout';

import { gasOilRatio, waterCut, wellStatus } from './wells';
import type { WellState } from './wells';

export type WellRates = {
  /** Oil in Sm³/d. */
  oil: number;
  /** Gas in kSm³/d. */
  gas: number;
  /** Water in m³/d. */
  water: number;
};

export type WellCardProps = {
  /** Well name as written in the field, e.g. "NK A-12 H". Printed in monospace. */
  name: string;
  /** What kind of well it is: "Oil producer · gas lift". */
  detail?: string;
  state: WellState;
  /** Latest allocated or tested rates. Leave out for a well that is not flowing. */
  rates?: WellRates;
  /** Choke opening in percent. */
  choke: number;
  /** Tubing head pressure in barg. */
  tubingHeadPressure?: number;
  /** Oil rate history, oldest first, drawn as a sparkline under the rates. */
  trend?: readonly number[];
  trendLabel?: string;
  className?: string;
};

/**
 * One well at a glance: state, the three phase rates, the two ratios engineers derive from them
 * (water cut and gas-oil ratio) and the choke opening. A well that is not flowing keeps its
 * layout and prints dashes, so a grid of cards stays aligned.
 */
export function WellCard({ name, detail, state, rates, choke, tubingHeadPressure, trend, trendLabel, className }: WellCardProps) {
  const cut = rates ? waterCut(rates.oil, rates.water) : null;
  const ratio = rates ? gasOilRatio(rates.gas * 1000, rates.oil) : null;
  const phases = [
    { key: 'oil', label: 'Oil', value: rates?.oil ?? null, unit: 'Sm³/d', decimals: 0 },
    { key: 'gas', label: 'Gas', value: rates?.gas ?? null, unit: 'kSm³/d', decimals: 0 },
    { key: 'water', label: 'Water', value: rates?.water ?? null, unit: 'm³/d', decimals: 0 },
  ];
  const derived = [
    { key: 'cut', label: 'Water cut', text: cut === null ? NO_VALUE : `${formatValue(cut, 1)} %` },
    { key: 'gor', label: 'GOR', text: ratio === null ? NO_VALUE : `${formatValue(ratio, 0)} Sm³/Sm³` },
    ...(tubingHeadPressure === undefined ? [] : [{ key: 'thp', label: 'Tubing head', text: `${formatValue(tubingHeadPressure, 1)} barg` }]),
  ];

  return (
    <article
      data-slot="well-card"
      data-state={state}
      aria-label={`Well ${name}, ${wellStatus(state).label.toLowerCase()}`}
      className={cn('flex w-full min-w-0 flex-col gap-4 rounded-xl border border-default bg-card-background p-4', className)}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="font-mono text-sm font-medium text-base-foreground">{name}</span>
          {detail ? <span className={LABEL_TEXT}>{detail}</span> : null}
        </div>
        <StatusIndicator size="sm" {...wellStatus(state)} />
      </header>

      <dl className="grid grid-cols-3 gap-3">
        {phases.map((phase) => (
          <div key={phase.key} className="flex min-w-0 flex-col gap-1.5">
            <dt className={LABEL_TEXT}>{phase.label}</dt>
            <dd className="flex flex-col gap-1">
              <ValueReadout size="sm" value={phase.value} decimals={phase.decimals} />
              <span className={LABEL_TEXT}>{phase.unit}</span>
            </dd>
          </div>
        ))}
      </dl>

      {trend && trend.length > 1 ? <Sparkline values={trend} label={trendLabel ?? `${name} oil rate trend`} variant="area" height={32} unit="Sm³/d" /> : null}

      <dl className="flex flex-col gap-1.5 text-xs">
        {derived.map((row) => (
          <div key={row.key} className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="whitespace-nowrap tabular-nums text-base-foreground">{row.text}</dd>
          </div>
        ))}
      </dl>

      <LinearGauge size="sm" label="Choke" value={choke} unit="%" />
    </article>
  );
}
