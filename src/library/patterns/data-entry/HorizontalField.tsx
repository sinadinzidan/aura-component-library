import { HelperText } from '@cognite/aura/components/helper-text';
import { Label } from '@cognite/aura/components/label';
import { useId } from 'react';
import type { ReactNode } from 'react';

/** Props to spread on the control so it is wired to the label, the helper and the error. */
export type HorizontalFieldControlProps = {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: true;
  required?: boolean;
};

type HorizontalFieldProps = {
  label: string;
  /** Hint under the control. Replaced by `error` while there is one. */
  helper?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children: (control: HorizontalFieldControlProps) => ReactNode;
};

/**
 * A form field with the label in a column to the left of the control, for dense property forms
 * where labels are short and people scan down one edge. The label column collapses above the
 * control when the container gets narrow.
 */
export function HorizontalField({ label, helper, error, required = false, children }: HorizontalFieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const hasError = error !== undefined && error !== null && error !== false && error !== '';
  const hasHelper = helper !== undefined && helper !== null && helper !== false && helper !== '';

  return (
    <div className="@container w-full">
      <div className="grid w-full gap-x-4 @md:grid-cols-3">
        <div className="flex h-9 items-center self-start @max-md:h-auto @max-md:pb-2">
          <Label htmlFor={id} required={required} className="pb-0">
            {label}
          </Label>
        </div>
        <div className="min-w-0 @md:col-span-2">
          {children({
            id,
            'aria-describedby': hasError || hasHelper ? messageId : undefined,
            'aria-invalid': hasError ? true : undefined,
            required: required ? true : undefined,
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
      </div>
    </div>
  );
}
