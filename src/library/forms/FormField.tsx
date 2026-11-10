import { HelperText } from '@cognite/aura/components/helper-text';
import { Label } from '@cognite/aura/components/label';
import { useId } from 'react';
import type { ReactNode } from 'react';

/** Props to spread on the control so it is wired to the label, the helper and the error. */
export type FormFieldControlProps = {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: true;
  required?: boolean;
  disabled?: boolean;
};

type FormFieldProps = {
  label: ReactNode;
  /** Hint shown under the control. Replaced by `error` while there is one. */
  helper?: ReactNode;
  /** Error message. Marks the control invalid and is announced when it appears. */
  error?: ReactNode;
  required?: boolean;
  /** Adds "(optional)" to the label; use in forms where most fields are required. */
  optional?: boolean;
  /** Disables the control and greys out the label. Say why in `helper`. */
  disabled?: boolean;
  /** Control id. Generated when omitted. */
  id?: string;
  children: (control: FormFieldControlProps) => ReactNode;
};

/**
 * One form field: a Label, a control and helper or error text, wired together with
 * `htmlFor`, `aria-describedby` and `aria-invalid`. The parts carry their own spacing.
 */
export function FormField({
  label,
  helper,
  error,
  required = false,
  optional = false,
  disabled = false,
  id,
  children,
}: FormFieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const messageId = `${controlId}-message`;
  const hasError = error !== undefined && error !== null && error !== false && error !== '';
  const hasHelper = helper !== undefined && helper !== null && helper !== false && helper !== '';
  const hasMessage = hasError || hasHelper;

  return (
    <div className="group flex w-full flex-col" data-disabled={disabled ? 'true' : undefined}>
      <Label htmlFor={controlId} required={required}>
        {label}
        {optional ? <span className="ml-1 font-normal">(optional)</span> : null}
      </Label>
      {children({
        id: controlId,
        'aria-describedby': hasMessage ? messageId : undefined,
        'aria-invalid': hasError ? true : undefined,
        required: required ? true : undefined,
        disabled: disabled ? true : undefined,
      })}
      <div aria-live="polite">
        {hasError ? (
          <HelperText id={messageId} isError>
            {error}
          </HelperText>
        ) : hasHelper ? (
          <HelperText id={messageId}>{helper}</HelperText>
        ) : null}
      </div>
    </div>
  );
}
