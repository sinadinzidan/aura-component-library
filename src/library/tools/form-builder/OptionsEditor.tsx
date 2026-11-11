import { Button } from '@cognite/aura/components/button';
import { Input } from '@cognite/aura/components/input';
import { IconArrowDown, IconArrowUp, IconPlus, IconTrash } from '@cognite/aura/icons';

import { IconAction } from '../../patterns/collections/IconAction';

import { uniqueValue } from './formSchema';
import type { FieldOption } from './formSchema';

type OptionsEditorProps = {
  options: readonly FieldOption[];
  onChange: (options: readonly FieldOption[]) => void;
  /** Smallest number of options the field may have. */
  minOptions?: number;
};

/**
 * The list of choices for a select or a radio group: edit the label, reorder, remove, add. The
 * stored value follows the label until the option is saved elsewhere, so authors never type ids.
 */
export function OptionsEditor({ options, onChange, minOptions = 2 }: OptionsEditorProps) {
  const update = (index: number, label: string) => {
    onChange(options.map((option, position) => (position === index ? { ...option, label } : option)));
  };
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= options.length) return;
    const next = [...options];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div data-slot="options-editor" className="flex w-full flex-col gap-2">
      <ul aria-label="Options" className="flex flex-col gap-2">
        {options.map((option, index) => (
          <li key={option.value} className="flex items-center gap-1">
            <Input aria-label={`Option ${index + 1} label`} value={option.label} onChange={(event) => update(index, event.target.value)} />
            <IconAction label={index === 0 ? 'Already first' : `Move ${option.label || `option ${index + 1}`} up`} disabled={index === 0} onClick={() => move(index, -1)}>
              <IconArrowUp />
            </IconAction>
            <IconAction label={index === options.length - 1 ? 'Already last' : `Move ${option.label || `option ${index + 1}`} down`} disabled={index === options.length - 1} onClick={() => move(index, 1)}>
              <IconArrowDown />
            </IconAction>
            <IconAction
              label={options.length <= minOptions ? `Keep at least ${minOptions} options` : `Remove ${option.label || `option ${index + 1}`}`}
              disabled={options.length <= minOptions}
              onClick={() => onChange(options.filter((_, position) => position !== index))}
            >
              <IconTrash />
            </IconAction>
          </li>
        ))}
      </ul>
      <Button
        variant="ghost"
        size="sm"
        className="self-start"
        onClick={() => {
          const label = `Option ${options.length + 1}`;
          onChange([...options, { value: uniqueValue(label, options.map((option) => option.value)), label }]);
        }}
      >
        <IconPlus /> Add option
      </Button>
    </div>
  );
}
