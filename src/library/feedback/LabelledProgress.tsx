import { Progress } from '@cognite/aura/components/progress';
import { useId } from 'react';
import type { ReactNode } from 'react';

type LabelledProgressProps = {
  /** What is progressing, for example "Uploading P&ID drawings". Also the accessible name. */
  label: string;
  value: number;
  max?: number;
  /** Replaces the percentage, for example "128 of 340 files". */
  valueText?: string;
  /** Line under the bar: time left, current item, or what happens next. */
  hint?: ReactNode;
  size?: 'default' | 'sm';
};

/**
 * A progress bar that says what it measures and how far it has come: label on the left, value on
 * the right, optional hint (such as time left) underneath. The value is announced to screen
 * readers with the same text people see.
 */
export function LabelledProgress({ label, value, max = 100, valueText, hint, size = 'default' }: LabelledProgressProps) {
  const labelId = useId();
  const safeMax = max > 0 ? max : 100;
  const clamped = Math.max(0, Math.min(value, safeMax));
  const shown = valueText ?? `${Math.round((clamped * 100) / safeMax)}%`;

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span id={labelId} className="min-w-0 truncate font-medium text-base-foreground">
          {label}
        </span>
        <span className="shrink-0 tabular-nums text-muted-foreground">{shown}</span>
      </div>
      <Progress value={clamped} max={safeMax} size={size} aria-label={label} aria-valuetext={shown} />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
