import { useId, useState } from 'react';

import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

import { toCode } from './toCode';

type CodeInputProps = {
  /** Names the field: "Verification code". */
  label: string;
  /** Digits typed so far. */
  value: string;
  onChange: (value: string) => void;
  /** Number of digits in the code. */
  length?: number;
  /** Marks the code as wrong; say why next to the field. */
  invalid?: boolean;
  /** Id of the element that explains the field or its error. */
  describedBy?: string;
  className?: string;
};

/**
 * A one-time code as a row of large digit boxes over one real input, so paste, autofill and
 * screen readers work as for any text field. The boxes take the look's radius and rules.
 */
export function CodeInput({ label, value, onChange, length = 6, invalid = false, describedBy, className }: CodeInputProps) {
  const look = useLook();
  const id = useId();
  const [focused, setFocused] = useState(false);
  const active = Math.min(value.length, length - 1);

  return (
    <div data-look={look} className={cx('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="text-sm font-medium text-(color:--kit-text)">
        {label}
      </label>
      <div className="relative w-fit">
        <div aria-hidden="true" className="flex gap-2">
          {Array.from({ length }, (_, index) => (
            <span
              key={index}
              data-active={focused && index === active ? '' : undefined}
              data-invalid={invalid ? '' : undefined}
              className={cx(
                'flex h-14 w-12 items-center justify-center rounded-(--kit-radius-sm) border border-(--kit-rule-strong) bg-(--kit-well) text-2xl font-semibold text-(color:--kit-text) tabular-nums',
                'data-active:border-(--kit-line-accent) data-active:shadow-(--shadow-focus-ring) data-invalid:border-(--kit-line-critical)',
                index === length / 2 && 'ml-3',
              )}
            >
              {value[index] ?? ''}
            </span>
          ))}
        </div>
        <input
          id={id}
          value={value}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={length}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          onChange={(event) => onChange(toCode(event.target.value, length))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="absolute inset-0 size-full cursor-text opacity-0"
        />
      </div>
    </div>
  );
}
