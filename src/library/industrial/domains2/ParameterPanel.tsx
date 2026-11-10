import { Button } from '@cognite/aura/components/button';

import { cn } from '../../../lib/utils';
import { SliderNumberInput } from '../../forms/SliderNumberInput';
import { SCALE_TEXT, formatDelta, formatValue } from '../status';

export type ModelParameter = {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  decimals?: number;
  /** Value in the baseline case. Changes are shown against it. */
  baseline: number;
};

export type ParameterPanelProps = {
  /** Heading of the panel. */
  title?: string;
  parameters: readonly ModelParameter[];
  /** Current value per parameter key. A missing key means the baseline. */
  values: Readonly<Record<string, number>>;
  onChange: (key: string, value: number) => void;
  /** Called by "Reset to baseline", which is shown once something has changed. */
  onReset?: () => void;
  className?: string;
};

/**
 * The inputs of a what-if model: a slider with a number field per parameter, each showing its
 * baseline and how far it has been moved. Controlled, so the caller can feed the same values to a
 * model and show the result beside it.
 */
export function ParameterPanel({ title = 'Parameters', parameters, values, onChange, onReset, className }: ParameterPanelProps) {
  const valueOf = (parameter: ModelParameter): number => values[parameter.key] ?? parameter.baseline;
  const changed = parameters.filter((parameter) => valueOf(parameter) !== parameter.baseline).length;

  return (
    <section data-slot="parameter-panel" aria-label={title} className={cn('flex w-full min-w-0 flex-col gap-4', className)}>
      <div className="flex min-h-7 items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <h3 className="text-sm font-medium text-base-foreground">{title}</h3>
          <span data-slot="parameter-changes" className="text-xs tabular-nums text-muted-foreground">
            {changed === 0 ? 'At baseline' : `${changed} changed`}
          </span>
        </div>
        {onReset && changed > 0 ? (
          <Button variant="ghost" size="sm" onClick={onReset}>
            Reset to baseline
          </Button>
        ) : null}
      </div>
      <div className="flex flex-col gap-4">
        {parameters.map((parameter) => {
          const value = valueOf(parameter);
          const decimals = parameter.decimals ?? 0;
          const delta = value - parameter.baseline;
          const suffix = parameter.unit ? ` ${parameter.unit}` : '';
          return (
            <div key={parameter.key} data-slot="parameter" data-changed={delta !== 0 ? 'true' : undefined} className="flex flex-col gap-1">
              <SliderNumberInput
                label={parameter.label}
                value={value}
                onValueChange={(next) => onChange(parameter.key, next)}
                min={parameter.min}
                max={parameter.max}
                step={parameter.step}
                unit={parameter.unit}
              />
              <div className={cn(SCALE_TEXT, 'flex justify-between gap-3')}>
                <span>
                  Baseline {formatValue(parameter.baseline, decimals)}
                  {suffix}
                </span>
                {delta !== 0 ? (
                  <span className="font-medium text-base-foreground">
                    {formatDelta(delta, decimals)}
                    {suffix}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
