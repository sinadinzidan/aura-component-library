import { cn } from '../../../lib/utils';
import { formatValue } from '../../industrial/status';

import { waterfallDomain, waterfallSteps } from './waterfallSteps';
import type { WaterfallInput } from './waterfallSteps';

export type LossWaterfallProps = WaterfallInput & {
  unit: string;
  decimals?: number;
  /** Accessible name, e.g. "Month-to-date production, plan to actual". */
  label: string;
  /** Rounds the lifted axis floor down to a multiple of this. */
  floorStep?: number;
  /** Makes the loss bars selectable. */
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
};

const percent = (fraction: number): string => `${Math.round(fraction * 10000) / 100}%`;

/**
 * Plan → losses by category → actual, as a bridge chart. The two totals stand on the axis in a
 * quiet neutral; every loss hangs from the level the previous one left, so the eye follows the
 * staircase down. When losses are small against the total the axis starts above zero, and the
 * chart says so. Loss bars can be made selectable to drive a detail view.
 */
export function LossWaterfall({ start, losses, endLabel, endId, unit, decimals = 1, label, floorStep = 1, selectedId = null, onSelect, className }: LossWaterfallProps) {
  const steps = waterfallSteps({ start, losses, endLabel, endId });
  const [min, max] = waterfallDomain(steps, floorStep);
  const span = max - min || 1;
  const level = (value: number): number => Math.min(Math.max((value - min) / span, 0), 1);
  const summary = steps.map((step) => `${step.label} ${step.kind === 'loss' ? 'minus ' : ''}${formatValue(step.value, decimals)}`).join(', ');

  return (
    <div data-slot="loss-waterfall" className={cn('flex w-full min-w-0 flex-col gap-2', className)}>
      <ol
        aria-label={`${label}, in ${unit}: ${summary}`}
        className="grid w-full grid-flow-col auto-cols-fr gap-x-2"
      >
        {steps.map((step, index) => {
          const isLoss = step.kind === 'loss';
          const bottom = level(isLoss ? step.from : min);
          const top = level(step.to);
          const selectable = isLoss && onSelect !== undefined;
          const selected = selectable && selectedId === step.id;
          const text = `${isLoss ? '−' : ''}${formatValue(step.value, decimals)}`;
          const bar = (
            <span className="relative block h-44 w-full">
              {/* Connector to the next step at the level this one ends on. */}
              {index < steps.length - 1 ? (
                <span
                  aria-hidden
                  className="absolute right-[-0.5rem] left-1/2 border-t border-dashed border-emphasized"
                  style={{ bottom: percent(isLoss ? bottom : top) }}
                />
              ) : null}
              <span
                data-slot="waterfall-bar"
                data-kind={step.kind}
                className={cn(
                  'absolute inset-x-[12%] min-h-0.5 rounded-sm',
                  isLoss ? 'bg-chart-1-450' : 'bg-chart-neutral-300',
                  selectable && !selected && selectedId !== null ? 'opacity-45' : undefined,
                  selected ? 'outline-2 outline-offset-2 outline-[color:var(--ring-default)]' : undefined
                )}
                style={{ bottom: percent(bottom), height: percent(Math.max(top - bottom, 0)) }}
              />
              <span
                className={cn('absolute inset-x-0 pb-1 text-center text-xs tabular-nums', isLoss ? 'font-medium text-base-foreground' : 'font-semibold text-base-foreground')}
                style={{ bottom: percent(top) }}
              >
                {text}
              </span>
            </span>
          );
          return (
            <li key={step.id} className="flex min-w-0 flex-col">
              {selectable ? (
                <button
                  type="button"
                  aria-pressed={selected}
                  aria-label={`${step.label}: ${text} ${unit}, ${formatValue(step.share * 100, 1)}% of ${start.label.toLowerCase()}`}
                  onClick={() => onSelect(step.id)}
                  className="flex cursor-pointer flex-col rounded-md pt-6 outline-none hover:bg-muted-background focus-visible:ring-2 focus-visible:ring-[color:var(--ring-default)]"
                >
                  {bar}
                </button>
              ) : (
                <span className="flex flex-col pt-6">{bar}</span>
              )}
              <span className="mt-2 border-t border-emphasized pt-2 text-center text-xs text-medium-foreground">{step.label}</span>
            </li>
          );
        })}
      </ol>
      {min > 0 ? (
        <p data-slot="waterfall-axis-note" className="text-xs text-muted-foreground tabular-nums">
          Axis starts at {formatValue(min, decimals)} {unit} so the losses stay readable.
        </p>
      ) : null}
    </div>
  );
}
