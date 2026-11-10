import { useId } from 'react';

type RatingScaleProps = {
  /** The question, as the accessible name of the group: "How easy was it to find the alarm?". */
  label: string;
  /** Lowest and highest score, inclusive. 1–5 by default; 0–10 for a recommendation score. */
  min?: number;
  max?: number;
  /** The chosen score, or `null` before an answer. */
  value: number | null;
  onValueChange: (value: number) => void;
  /** What the two ends mean: "Very hard", "Very easy". */
  lowLabel?: string;
  highLabel?: string;
  /** A word for a score, read out with it and shown under the scale once chosen: `{ 4: 'Good' }`. */
  optionLabels?: Readonly<Record<number, string>>;
  /** Radio group name. Generated when left out. */
  name?: string;
  disabled?: boolean;
};

/**
 * A numbered score selector: one segment per score with the meaning of both ends written under
 * it. It is a native radio group, so arrow keys move through the scores and a form can read the
 * answer; nothing is preselected. Numbers, not stars, so the scale also reads without colour.
 */
export function RatingScale({
  label,
  min = 1,
  max = 5,
  value,
  onValueChange,
  lowLabel,
  highLabel,
  optionLabels,
  name,
  disabled = false,
}: RatingScaleProps) {
  const generatedName = useId();
  const scores = Array.from({ length: Math.max(0, max - min + 1) }, (_, index) => min + index);
  const chosenLabel = value !== null ? optionLabels?.[value] : undefined;

  return (
    <div data-slot="rating-scale" className="flex w-full min-w-0 flex-col gap-2">
      <div role="radiogroup" aria-label={label} className="flex w-full min-w-0 gap-1">
        {scores.map((score) => {
          const word = optionLabels?.[score];
          return (
            <label key={score} className={`relative flex min-w-0 flex-1 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
              <input
                type="radio"
                name={name ?? generatedName}
                value={score}
                checked={value === score}
                disabled={disabled}
                onChange={() => onValueChange(score)}
                aria-label={word ? `${score}, ${word}` : String(score)}
                className="peer absolute inset-0 cursor-[inherit] opacity-0"
              />
              <span
                aria-hidden="true"
                className="flex h-9 w-full items-center justify-center rounded-lg border border-emphasized text-sm font-medium tabular-nums text-medium-foreground transition-colors peer-hover:bg-base-background-hover peer-checked:border-transparent peer-checked:bg-primary-background peer-checked:text-primary-foreground peer-focus-visible:shadow-focus-ring peer-disabled:border-default peer-disabled:text-base-foreground-disabled"
              >
                {score}
              </span>
            </label>
          );
        })}
      </div>
      {lowLabel || highLabel ? (
        <div aria-hidden="true" className="flex justify-between gap-4 text-xs text-muted-foreground">
          <span>{lowLabel}</span>
          <span className="text-right">{highLabel}</span>
        </div>
      ) : null}
      {optionLabels ? (
        <output aria-live="polite" className="min-h-5 text-sm text-base-foreground">
          {value !== null && chosenLabel ? (
            <>
              <span className="font-medium tabular-nums">{value}</span> · {chosenLabel}
            </>
          ) : null}
        </output>
      ) : null}
    </div>
  );
}
