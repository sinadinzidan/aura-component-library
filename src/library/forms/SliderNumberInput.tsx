import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
import { Slider } from '@cognite/aura/components/slider';
import { useId, useState } from 'react';

type SliderNumberInputProps = {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Shown after the number field, e.g. `%`. */
  unit?: string;
  disabled?: boolean;
};

/** Clamps to the range and snaps to the nearest step counted from `min`. */
function snapToStep(value: number, min: number, max: number, step: number): number {
  const clamped = Math.min(max, Math.max(min, value));
  const snapped = min + Math.round((clamped - min) / step) * step;
  const decimals = (String(step).split('.')[1] ?? '').length;
  return Number(Math.min(max, snapped).toFixed(decimals));
}

/**
 * A slider paired with a number field for the same value: drag for a rough setting, type for an
 * exact one. Typed values are committed on Enter or blur, clamped to the range and snapped to the
 * step; anything that is not a number is discarded.
 */
export function SliderNumberInput({
  label,
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  unit,
  disabled = false,
}: SliderNumberInputProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const inputId = `${id}-input`;
  // `null` means the field mirrors `value`; a string is an edit in progress.
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    if (draft === null) return;
    const parsed = Number(draft);
    if (draft.trim() !== '' && Number.isFinite(parsed)) {
      onValueChange(snapToStep(parsed, min, max, step));
    }
    setDraft(null);
  };

  return (
    <div className="group flex w-full flex-col" data-disabled={disabled ? 'true' : undefined}>
      <Label id={labelId} htmlFor={inputId}>
        {label}
      </Label>
      <div className="flex items-center gap-3">
        <Slider
          value={[value]}
          onValueChange={(next) => {
            setDraft(null);
            onValueChange(next[0] ?? min);
          }}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          aria-labelledby={labelId}
        />
        <div className="flex shrink-0 items-center gap-2">
          <Input
            id={inputId}
            className="w-20"
            inputMode="decimal"
            value={draft ?? String(value)}
            disabled={disabled}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commit();
              if (event.key === 'Escape') setDraft(null);
            }}
          />
          {unit ? <span className="text-sm text-muted-foreground">{unit}</span> : null}
        </div>
      </div>
    </div>
  );
}
