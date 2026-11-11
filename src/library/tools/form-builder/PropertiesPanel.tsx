import { Input } from '@cognite/aura/components/input';
import { Separator } from '@cognite/aura/components/separator';
import { Switch } from '@cognite/aura/components/switch';

import { FormField } from '../../forms/FormField';

import { fieldTypeLabel, hasOptions, isInput, ruleSources } from './formSchema';
import type { FormFieldDef, FormSchema } from './formSchema';
import { OptionsEditor } from './OptionsEditor';
import { RuleEditor } from './RuleEditor';

type PropertiesPanelProps = {
  schema: FormSchema;
  /** The selected field, or null when nothing is selected. */
  field: FormFieldDef | null;
  onChange: (id: string, patch: Partial<Omit<FormFieldDef, 'id' | 'type'>>) => void;
  /** Problem with the selected field, from `validateSchema`. */
  problem?: string;
};

const parseNumber = (text: string): number | undefined => {
  if (text.trim() === '') return undefined;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : undefined;
};

/**
 * The settings of the selected field. What it offers follows the type: a heading has only a
 * label, a number has a unit and a range, a select has options, and every input can be required
 * or shown only when an earlier field has a given value.
 */
export function PropertiesPanel({ schema, field, onChange, problem }: PropertiesPanelProps) {
  if (!field) {
    return (
      <div data-slot="properties-empty" className="flex flex-col gap-1 py-6 text-center">
        <p className="text-sm font-medium text-base-foreground">No field selected</p>
        <p className="text-sm text-muted-foreground">Select a field on the form to edit its label, options and rules.</p>
      </div>
    );
  }
  const set = (patch: Partial<Omit<FormFieldDef, 'id' | 'type'>>) => onChange(field.id, patch);
  const numeric = field.type === 'number';
  const textual = field.type === 'text' || field.type === 'textarea';
  const input = isInput(field.type);

  return (
    <div data-slot="properties-panel" className="flex w-full flex-col gap-4">
      <div className="flex flex-col">
        <h4 className="text-sm font-semibold text-base-foreground">{fieldTypeLabel(field.type)} field</h4>
        {problem ? <p role="alert" className="text-xs font-medium text-critical-foreground-strong">{problem}</p> : null}
      </div>
      <FormField label="Label" error={field.label.trim() === '' ? 'Give this field a label.' : undefined}>
        {(control) => <Input {...control} value={field.label} onChange={(event) => set({ label: event.target.value })} />}
      </FormField>
      {input ? (
        <FormField label="Helper text" optional>
          {(control) => <Input {...control} value={field.helper ?? ''} onChange={(event) => set({ helper: event.target.value || undefined })} />}
        </FormField>
      ) : null}
      {textual || field.type === 'select' || numeric ? (
        <FormField label="Placeholder" optional>
          {(control) => <Input {...control} value={field.placeholder ?? ''} onChange={(event) => set({ placeholder: event.target.value || undefined })} />}
        </FormField>
      ) : null}
      {numeric ? (
        <FormField label="Unit" optional>
          {(control) => <Input {...control} value={field.unit ?? ''} onChange={(event) => set({ unit: event.target.value || undefined })} />}
        </FormField>
      ) : null}
      {numeric || textual ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-base-foreground">{numeric ? 'Allowed range' : 'Length'}</legend>
          <div className="grid grid-cols-2 gap-2">
            <FormField label={numeric ? 'Minimum' : 'Shortest'} optional>
              {(control) => <Input {...control} type="number" value={field.min ?? ''} onChange={(event) => set({ min: parseNumber(event.target.value) })} />}
            </FormField>
            <FormField label={numeric ? 'Maximum' : 'Longest'} optional>
              {(control) => <Input {...control} type="number" value={field.max ?? ''} onChange={(event) => set({ max: parseNumber(event.target.value) })} />}
            </FormField>
          </div>
        </fieldset>
      ) : null}
      {hasOptions(field.type) ? (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-base-foreground">Options</span>
          <OptionsEditor options={field.options ?? []} onChange={(options) => set({ options })} />
        </div>
      ) : null}
      {input ? (
        <>
          <Separator />
          <div className="flex w-full items-center justify-between gap-4">
            <label htmlFor={`${field.id}-required`} className="text-sm font-medium text-base-foreground">
              Required
            </label>
            <Switch id={`${field.id}-required`} checked={field.required === true} onCheckedChange={(next) => set({ required: next || undefined })} />
          </div>
        </>
      ) : null}
      <Separator />
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-base-foreground">Visibility</span>
        <RuleEditor sources={ruleSources(schema.fields, field.id)} rule={field.showWhen} onChange={(showWhen) => set({ showWhen })} />
      </div>
    </div>
  );
}
