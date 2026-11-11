import { Input } from '@cognite/aura/components/input';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@cognite/aura/components/input-group';

import { MultiSelectCombobox } from '../../forms/MultiSelectCombobox';
import { OptionSelect } from '../../patterns/data-entry/OptionSelect';

import { shapeOf } from './queryModel';
import type { Condition, QueryField, QueryValue, RelativeUnit } from './queryModel';

type ValueEditorProps = {
  condition: Condition;
  field: QueryField;
  onChange: (patch: Partial<QueryValue>) => void;
  /** Name of the condition for assistive tech: "Condition 2". */
  label: string;
  invalid?: boolean;
  describedBy?: string;
};

const UNITS: readonly { value: RelativeUnit; label: string }[] = [
  { value: 'hours', label: 'hours' },
  { value: 'days', label: 'days' },
  { value: 'weeks', label: 'weeks' },
];

/**
 * The editor for a condition's value. Which one appears depends on the operator, not the field:
 * one value, the two ends of a range, a list to pick from, a count of hours, days or weeks, or
 * nothing at all for operators like "is empty".
 */
export function ValueEditor({ condition, field, onChange, label, invalid = false, describedBy }: ValueEditorProps) {
  const shape = shapeOf(condition.op);
  const { value } = condition;
  const aria = { 'aria-invalid': invalid ? (true as const) : undefined, 'aria-describedby': describedBy };

  if (shape === 'none') return <span className="px-1 text-xs text-muted-foreground">No value needed</span>;

  if (shape === 'multi') {
    return (
      <div className="min-w-48 flex-1">
        <MultiSelectCombobox
          aria-label={`${label} values`}
          aria-describedby={describedBy}
          options={field.options ?? []}
          value={value.list}
          onValueChange={(list) => onChange({ list })}
          placeholder="Choose values"
          maxVisibleChips={2}
          invalid={invalid}
        />
      </div>
    );
  }

  if (shape === 'relative') {
    return (
      <div className="flex items-center gap-2">
        <Input {...aria} aria-label={`${label} amount`} type="number" min={1} step={1} className="w-20" value={value.a} onChange={(event) => onChange({ a: event.target.value })} />
        <OptionSelect
          size="sm"
          width="compact"
          aria-label={`${label} unit`}
          options={UNITS}
          value={value.unit}
          onValueChange={(unit) => {
            if (unit === 'hours' || unit === 'days' || unit === 'weeks') onChange({ unit });
          }}
        />
      </div>
    );
  }

  const single = (key: 'a' | 'b', name: string) => {
    if (field.kind === 'enum') {
      return (
        <div className="min-w-40 flex-1">
          <OptionSelect size="sm" {...aria} aria-label={name} options={field.options ?? []} value={value[key] === '' ? undefined : value[key]} placeholder="Choose a value" onValueChange={(next) => onChange({ [key]: next })} />
        </div>
      );
    }
    if (field.kind === 'number') {
      return (
        <InputGroup className="w-36">
          <InputGroupInput {...aria} aria-label={name} type="number" value={value[key]} onChange={(event) => onChange({ [key]: event.target.value })} />
          {field.unit ? (
            <InputGroupAddon align="inline-end">
              <InputGroupText>{field.unit}</InputGroupText>
            </InputGroupAddon>
          ) : null}
        </InputGroup>
      );
    }
    if (field.kind === 'date') {
      return <Input {...aria} aria-label={name} type="date" className="w-40" value={value[key]} onChange={(event) => onChange({ [key]: event.target.value })} />;
    }
    return <Input {...aria} aria-label={name} className="min-w-40 flex-1" value={value[key]} placeholder="Text to match" onChange={(event) => onChange({ [key]: event.target.value })} />;
  };

  if (shape === 'range') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {single('a', `${label} from`)}
        <span className="text-xs text-muted-foreground">and</span>
        {single('b', `${label} to`)}
      </div>
    );
  }

  return single('a', `${label} value`);
}
