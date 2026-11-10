import { Alert, AlertDescription, AlertTitle } from '@cognite/aura/components/alert';

export type ValidationSummaryError = {
  /** `id` of the invalid control. */
  fieldId: string;
  /** The field's label, shown as the link text. */
  label: string;
  /** How to fix it, as shown under the field. */
  message: string;
};

type ValidationSummaryProps = {
  errors: readonly ValidationSummaryError[];
  /** Builds the heading from the number of errors. */
  formatTitle?: (count: number) => string;
  /** Moves focus to a field. Defaults to focusing the element with that id. */
  focusField?: (fieldId: string) => void;
};

const defaultFormatTitle = (count: number) =>
  count === 1 ? 'Fix 1 field to continue' : `Fix ${count} fields to continue`;

const focusById = (fieldId: string) => document.getElementById(fieldId)?.focus();

/**
 * The error summary at the top of a long form after a failed submission. Lists every invalid
 * field as a link that moves focus to it; the inline message stays on the field as well.
 * Renders nothing while there are no errors.
 */
export function ValidationSummary({
  errors,
  formatTitle = defaultFormatTitle,
  focusField = focusById,
}: ValidationSummaryProps) {
  if (errors.length === 0) return null;

  return (
    <Alert variant="error" role="alert">
      <AlertTitle>{formatTitle(errors.length)}</AlertTitle>
      <AlertDescription>
        <ul className="flex list-none flex-col gap-1">
          {errors.map((error) => (
            <li key={error.fieldId}>
              <button
                type="button"
                className="cursor-pointer rounded-sm text-left underline underline-offset-2 outline-none focus-visible:shadow-focus-ring"
                onClick={() => focusField(error.fieldId)}
              >
                {error.label}
              </button>
              <span> – {error.message}</span>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
