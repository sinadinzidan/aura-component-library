import { HelperText } from '@cognite/aura/components/helper-text';
import { Label } from '@cognite/aura/components/label';
import { Slider } from '@cognite/aura/components/slider';
import { useId } from 'react';

type SliderFieldProps = {
  label: string;
  /** One number for a single thumb, two for a range. */
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Shown after the value in the readout, e.g. `barg`. */
  unit?: string;
  /** Formats one thumb value for the readout and the scale ends. */
  formatValue?: (value: number) => string;
  /** Prints the minimum and maximum under the track. */
  showScale?: boolean;
  helperText?: string;
  disabled?: boolean;
};

const defaultFormatValue = (value: number) => String(value);

/**
 * A labelled slider with a live value readout and unit. Works for a single value or a range, and
 * can print the ends of the scale so the thumb position has a reference.
 */
export function SliderField({
  label,
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  unit,
  formatValue = defaultFormatValue,
  showScale = false,
  helperText,
  disabled = false,
}: SliderFieldProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const helperId = `${id}-helper`;
  const readout = value.map(formatValue).join(' – ');

  return (
    <div className="group flex w-full flex-col" data-disabled={disabled ? 'true' : undefined}>
      <div className="flex items-baseline justify-between gap-3">
        <Label id={labelId}>{label}</Label>
        <output
          aria-live="off"
          className={
            disabled
              ? 'pb-2 text-sm font-medium tabular-nums text-base-foreground-disabled'
              : 'pb-2 text-sm font-medium tabular-nums text-base-foreground'
          }
        >
          {unit ? `${readout} ${unit}` : readout}
        </output>
      </div>
      <Slider
        value={value}
        onValueChange={onValueChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        aria-labelledby={labelId}
        aria-describedby={helperText ? helperId : undefined}
      />
      {showScale ? (
        <div aria-hidden="true" className="flex justify-between pt-1 text-xs tabular-nums text-muted-foreground">
          <span>{formatValue(min)}</span>
          <span>{formatValue(max)}</span>
        </div>
      ) : null}
      {helperText ? <HelperText id={helperId}>{helperText}</HelperText> : null}
    </div>
  );
}
