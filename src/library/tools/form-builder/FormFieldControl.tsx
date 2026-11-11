import { CheckboxItem, CheckboxItemControl, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import { HelperText } from '@cognite/aura/components/helper-text';
import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
import { RadioGroup, RadioGroupItem, RadioGroupItemControl, RadioGroupItemLabel } from '@cognite/aura/components/radio-group';
import { Switch } from '@cognite/aura/components/switch';
import { Textarea } from '@cognite/aura/components/textarea';
import { useId } from 'react';

import { FormField } from '../../forms/FormField';
import { UnitNumberInput } from '../../forms/UnitNumberInput';
import { OptionSelect } from '../../patterns/data-entry/OptionSelect';

import type { FormFieldDef, FormValue } from './formSchema';

type FormFieldControlProps = {
  field: FormFieldDef;
  value?: FormValue;
  onChange?: (value: FormValue) => void;
  /** The message to show under the control. */
  error?: string;
  /** Id for the control, so an error summary can focus it. */
  controlId?: string;
};

const toNumber = (value: FormValue | undefined): number | null => {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Draws one field of a form schema with the real Aura controls: the same component the finished
 * form uses, so the canvas and the preview never disagree. It keeps no state; the caller owns the
 * value and decides what to do with changes.
 */
export function FormFieldControl({ field, value, onChange = () => undefined, error, controlId }: FormFieldControlProps) {
  const generated = useId();
  const id = controlId ?? generated;
  const messageId = `${id}-message`;
  const required = field.required === true;
  const text = typeof value === 'string' ? value : '';

  switch (field.type) {
    case 'heading':
      return (
        <h4 data-slot="form-heading" className="mt-2 border-b border-default pb-2 text-sm font-semibold text-base-foreground">
          {field.label}
        </h4>
      );
    case 'text':
      return (
        <FormField id={id} label={field.label} helper={field.helper} error={error} required={required}>
          {(control) => <Input {...control} value={text} placeholder={field.placeholder} onChange={(event) => onChange(event.target.value)} />}
        </FormField>
      );
    case 'textarea':
      return (
        <FormField id={id} label={field.label} helper={field.helper} error={error} required={required}>
          {(control) => <Textarea {...control} value={text} placeholder={field.placeholder} rows={3} onChange={(event) => onChange(event.target.value)} />}
        </FormField>
      );
    case 'date':
      return (
        <FormField id={id} label={field.label} helper={field.helper} error={error} required={required}>
          {(control) => <Input {...control} type="date" value={text} onChange={(event) => onChange(event.target.value)} />}
        </FormField>
      );
    case 'number':
      return (
        <FormField id={id} label={field.label} helper={field.helper} error={error} required={required}>
          {(control) => (
            <UnitNumberInput
              {...control}
              value={toNumber(value)}
              unit={field.unit ?? ''}
              min={field.min}
              max={field.max}
              placeholder={field.placeholder}
              onValueChange={(next) => onChange(next === null ? '' : String(next))}
            />
          )}
        </FormField>
      );
    case 'select':
      return (
        <FormField id={id} label={field.label} helper={field.helper} error={error} required={required}>
          {(control) => (
            <OptionSelect
              id={control.id}
              aria-describedby={control['aria-describedby']}
              aria-invalid={control['aria-invalid']}
              options={field.options ?? []}
              value={text === '' ? undefined : text}
              placeholder={field.placeholder ?? 'Select an option'}
              onValueChange={onChange}
            />
          )}
        </FormField>
      );
    case 'radio': {
      const labelId = `${id}-label`;
      return (
        <div role="group" aria-labelledby={labelId} aria-describedby={error || field.helper ? messageId : undefined} className="flex w-full flex-col">
          <Label id={labelId} required={required}>
            {field.label}
          </Label>
          <RadioGroup value={text} onValueChange={(next) => onChange(String(next))} className="gap-2 pt-1">
            {(field.options ?? []).map((option) => (
              <RadioGroupItem key={option.value}>
                <RadioGroupItemControl value={option.value} />
                <RadioGroupItemLabel>{option.label}</RadioGroupItemLabel>
              </RadioGroupItem>
            ))}
          </RadioGroup>
          <Message id={messageId} error={error} helper={field.helper} />
        </div>
      );
    }
    case 'checkbox':
      return (
        <div className="flex w-full flex-col gap-1">
          <CheckboxItem>
            <CheckboxItemControl id={id} aria-describedby={error || field.helper ? messageId : undefined} aria-invalid={error ? true : undefined} checked={value === true} onCheckedChange={(next) => onChange(next)} />
            <CheckboxItemLabel>
              {field.label}
              {required ? <span className="ml-1 text-muted-foreground">(required)</span> : null}
            </CheckboxItemLabel>
          </CheckboxItem>
          <Message id={messageId} error={error} helper={field.helper} />
        </div>
      );
    case 'switch':
      return (
        <div className="flex w-full flex-col">
          <div className="flex w-full items-center justify-between gap-4">
            <label htmlFor={id} className="text-sm font-medium text-base-foreground">
              {field.label}
              {required ? <span className="ml-1 font-normal text-muted-foreground">(required)</span> : null}
            </label>
            <Switch id={id} checked={value === true} aria-describedby={error || field.helper ? messageId : undefined} aria-invalid={error ? true : undefined} onCheckedChange={(next) => onChange(next)} />
          </div>
          <Message id={messageId} error={error} helper={field.helper} />
        </div>
      );
    default:
      return null;
  }
}

function Message({ id, error, helper }: { id: string; error?: string; helper?: string }) {
  return (
    <div aria-live="polite">
      {error ? (
        <HelperText id={id} isError>
          {error}
        </HelperText>
      ) : helper ? (
        <HelperText id={id}>{helper}</HelperText>
      ) : null}
    </div>
  );
}
