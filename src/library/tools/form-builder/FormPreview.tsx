import { Button } from '@cognite/aura/components/button';
import { useState } from 'react';

import { FormActions } from '../../patterns/data-entry/FormActions';
import { ValidationSummary } from '../../patterns/data-entry/ValidationSummary';

import { FormFieldControl } from './FormFieldControl';
import { initialValues, validateValues, visibleFields } from './formSchema';
import type { FormSchema, FormValue, FormValues } from './formSchema';

type FormPreviewProps = {
  schema: FormSchema;
  submitLabel?: string;
  /** Called with the visible answers once the form is valid. */
  onSubmit?: (values: FormValues) => void;
  /** Prefix for control ids, so two previews on a page do not clash. */
  idPrefix?: string;
};

/**
 * The finished form, rendered from the schema and ready to fill in: required fields, ranges and
 * lengths are enforced on submit, conditional fields appear and disappear as their rule says, and
 * the errors are listed at the top as links to the fields. After the first attempt, answers are
 * re-checked as they change.
 */
export function FormPreview({ schema, submitLabel = 'Submit', onSubmit, idPrefix = 'form-preview' }: FormPreviewProps) {
  const [values, setValues] = useState<FormValues>(() => initialValues(schema));
  const [attempted, setAttempted] = useState(false);
  const [sent, setSent] = useState<FormValues | null>(null);

  const errors = attempted ? validateValues(schema, values) : {};
  const shown = visibleFields(schema, values);
  const summary = shown.filter((field) => errors[field.id]).map((field) => ({ fieldId: `${idPrefix}-${field.id}`, label: field.label, message: errors[field.id] }));

  return (
    <form
      noValidate
      aria-label={schema.title}
      data-slot="form-preview"
      className="flex w-full flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setAttempted(true);
        if (Object.keys(validateValues(schema, values)).length > 0) {
          setSent(null);
          return;
        }
        const answers: Record<string, FormValue | undefined> = {};
        for (const field of shown) answers[field.id] = values[field.id];
        setSent(answers);
        onSubmit?.(answers);
      }}
    >
      <h3 className="text-base font-semibold text-base-foreground">{schema.title}</h3>
      <ValidationSummary errors={summary} />
      {sent ? (
        <p role="status" className="rounded-lg bg-success-background px-3 py-2 text-sm text-success-foreground">
          Submitted. {Object.values(sent).filter((answer) => answer !== undefined && answer !== '').length} answers recorded.
        </p>
      ) : null}
      <div className="flex flex-col gap-4">
        {shown.map((field) => (
          <FormFieldControl
            key={field.id}
            field={field}
            controlId={`${idPrefix}-${field.id}`}
            value={values[field.id]}
            error={errors[field.id]}
            onChange={(next) => {
              setSent(null);
              setValues({ ...values, [field.id]: next });
            }}
          />
        ))}
      </div>
      <FormActions align="start" label="Form actions">
        <Button type="submit">{submitLabel}</Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setValues(initialValues(schema));
            setAttempted(false);
            setSent(null);
          }}
        >
          Clear form
        </Button>
      </FormActions>
    </form>
  );
}
