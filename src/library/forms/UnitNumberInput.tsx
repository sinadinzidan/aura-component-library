import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupStepper,
  InputGroupText,
} from '@cognite/aura/components/input-group';
import type { ComponentProps } from 'react';

type UnitNumberInputProps = Omit<
  ComponentProps<typeof InputGroupInput>,
  'type' | 'value' | 'defaultValue' | 'onChange' | 'min' | 'max' | 'step'
> & {
  /** Current value; `null` while the field is empty. */
  value: number | null;
  onValueChange: (value: number | null) => void;
  /** Unit shown after the value, e.g. "barg". */
  unit: string;
  min?: number;
  max?: number;
  step?: number;
  /** Hide the stepper for values people type rather than nudge. */
  hideStepper?: boolean;
};

function decimalsOf(step: number): number {
  const [, fraction = ''] = String(step).split('.');
  return fraction.length;
}

function clamp(value: number, min: number | undefined, max: number | undefined): number {
  const atLeastMin = min === undefined ? value : Math.max(min, value);
  return max === undefined ? atLeastMin : Math.min(max, atLeastMin);
}

/**
 * A number field with its unit as a suffix and a stepper that respects `min`, `max` and `step`.
 * Typing is not clamped, so range errors can be reported on blur by the caller.
 */
export function UnitNumberInput({
  value,
  onValueChange,
  unit,
  min,
  max,
  step = 1,
  hideStepper = false,
  disabled,
  readOnly,
  ...inputProps
}: UnitNumberInputProps) {
  const nudge = (direction: 1 | -1) => {
    const start = value ?? min ?? 0;
    const next = clamp(start + direction * step, min, max);
    onValueChange(Number(next.toFixed(decimalsOf(step))));
  };

  const locked = disabled === true || readOnly === true;

  return (
    <InputGroup>
      <InputGroupInput
        {...inputProps}
        type="number"
        inputMode="decimal"
        value={value ?? ''}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        readOnly={readOnly}
        onChange={(event) => {
          const next = event.target.valueAsNumber;
          onValueChange(Number.isNaN(next) ? null : next);
        }}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupText>{unit}</InputGroupText>
        {hideStepper ? null : (
          <InputGroupStepper
            disabled={locked}
            incrementDisabled={max !== undefined && value !== null && value >= max}
            decrementDisabled={min !== undefined && value !== null && value <= min}
            incrementLabel={`Increase by ${step} ${unit}`}
            decrementLabel={`Decrease by ${step} ${unit}`}
            onIncrement={() => nudge(1)}
            onDecrement={() => nudge(-1)}
          />
        )}
      </InputGroupAddon>
    </InputGroup>
  );
}
