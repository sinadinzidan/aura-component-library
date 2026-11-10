import { IconAlertTriangle } from '@cognite/aura/icons';
import type { MouseEvent } from 'react';

export type ErrorSummaryItem = {
  /** Id of the invalid control. */
  fieldId: string;
  /** Field name and what is wrong: "Tag: use the format 23-KA-9101". */
  message: string;
};

export type ErrorSummaryProps = {
  errors: readonly ErrorSummaryItem[];
  /** Heading. Defaults to a count: "2 fields need attention". */
  title?: string;
  /** Finds a field. Injectable for tests and for shadow roots. */
  findField?: (id: string) => HTMLElement | null;
};

const findById = (id: string) => document.getElementById(id);

/**
 * Lists every invalid field at the top of a form after a failed submit. Each entry is a link that
 * moves focus to its field. The summary is an alert, so it is announced when it appears; it
 * renders nothing while there are no errors.
 */
export function ErrorSummary({ errors, title, findField = findById }: ErrorSummaryProps) {
  if (errors.length === 0) return null;

  const heading = title ?? `${errors.length} ${errors.length === 1 ? 'field needs' : 'fields need'} attention`;

  const focusField = (event: MouseEvent<HTMLAnchorElement>, fieldId: string) => {
    const field = findField(fieldId);
    if (!field) return;
    event.preventDefault();
    field.focus();
  };

  return (
    <div
      data-slot="error-summary"
      role="alert"
      className="flex gap-3 rounded-lg bg-critical-background p-3 text-critical-foreground"
    >
      <IconAlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-sm font-medium">{heading}</p>
        <ul className="mt-1 flex flex-col gap-1">
          {errors.map((error) => (
            <li key={error.fieldId} className="text-sm">
              <a
                href={`#${error.fieldId}`}
                onClick={(event) => focusField(event, error.fieldId)}
                className="rounded-sm underline underline-offset-2 outline-none focus-visible:shadow-focus-ring-destructive"
              >
                {error.message}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
