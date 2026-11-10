import { Input } from '@cognite/aura/components/input';
import { Fragment, useRef } from 'react';
import type { ClipboardEvent, KeyboardEvent } from 'react';

type OneTimeCodeInputProps = {
  /** Names the group: "Verification code". */
  label: string;
  /** The digits entered so far, without gaps. */
  value: string;
  onValueChange: (value: string) => void;
  /** Called once with the full code when the last digit is entered. */
  onComplete?: (code: string) => void;
  length?: number;
  /** Puts a divider after every N boxes, the way authenticator apps print codes: 3 + 3. */
  groupSize?: number;
  invalid?: boolean;
  disabled?: boolean;
  /** Id of the helper or error text under the boxes. */
  'aria-describedby'?: string;
};

const digitsOf = (text: string): string => text.replace(/\D/g, '');

/**
 * A one-time code as one box per digit. Typing moves on to the next box, Backspace steps back,
 * and a pasted or auto-filled code spreads across the boxes from wherever it lands. The value is
 * one plain string, so the caller never deals with individual boxes.
 */
export function OneTimeCodeInput({
  label,
  value,
  onValueChange,
  onComplete,
  length = 6,
  groupSize,
  invalid = false,
  disabled = false,
  'aria-describedby': describedBy,
}: OneTimeCodeInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const code = digitsOf(value).slice(0, length);

  const focusBox = (index: number) => {
    const box = inputs.current[Math.max(0, Math.min(index, length - 1))];
    box?.focus();
    box?.select();
  };

  const commit = (next: string, focusIndex: number) => {
    onValueChange(next);
    focusBox(focusIndex);
    if (next.length === length && next !== code) onComplete?.(next);
  };

  /** Writes digits starting at a box; a box past the end of the code writes at the end. */
  const insert = (index: number, digits: string) => {
    const at = Math.min(index, code.length);
    const next = `${code.slice(0, at)}${digits}${code.slice(at + digits.length)}`.slice(0, length);
    commit(next, at + digits.length);
  };

  const remove = (index: number) => {
    if (index >= code.length) return;
    onValueChange(`${code.slice(0, index)}${code.slice(index + 1)}`);
  };

  const handleChange = (index: number, raw: string) => {
    const digits = digitsOf(raw);
    if (digits === '') remove(index);
    else insert(index, digits);
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && index >= code.length && index > 0) {
      event.preventDefault();
      onValueChange(code.slice(0, index - 1) + code.slice(index));
      focusBox(index - 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusBox(index - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusBox(index + 1);
    }
  };

  const handlePaste = (index: number, event: ClipboardEvent<HTMLInputElement>) => {
    const digits = digitsOf(event.clipboardData.getData('text'));
    if (digits === '') return;
    event.preventDefault();
    insert(index, digits);
  };

  return (
    <div role="group" aria-label={label} aria-describedby={describedBy} className="flex items-center gap-2">
      {Array.from({ length }, (_, index) => (
        <Fragment key={index}>
          {groupSize !== undefined && index > 0 && index % groupSize === 0 ? (
            <span aria-hidden="true" className="h-px w-2 shrink-0 bg-emphasized" />
          ) : null}
          <Input
            ref={(element) => {
              inputs.current[index] = element;
            }}
            className="w-10 px-0 text-center"
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            aria-label={`Digit ${index + 1} of ${length}`}
            aria-invalid={invalid ? true : undefined}
            disabled={disabled}
            value={code.charAt(index)}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={(event) => handlePaste(index, event)}
            onFocus={(event) => event.target.select()}
          />
        </Fragment>
      ))}
    </div>
  );
}
