import {
  CheckboxGroup,
  CheckboxItem,
  CheckboxItemControl,
  CheckboxItemDescription,
  CheckboxItemLabel,
} from '@cognite/aura/components/checkbox';
import { useId } from 'react';

export type SelectAllCheckboxOption = {
  id: string;
  label: string;
  description?: string;
  /** Disabled options keep their current state and are skipped by "select all". */
  disabled?: boolean;
};

type SelectAllCheckboxListProps = {
  /** Names the whole group for assistive tech and is shown above the list. */
  label: string;
  options: readonly SelectAllCheckboxOption[];
  /** Ids of the checked options. */
  value: readonly string[];
  onValueChange: (value: string[]) => void;
  selectAllLabel?: string;
  /** Builds the count line under the list. Return an empty string to hide it. */
  formatCount?: (selected: number, total: number) => string;
};

const defaultFormatCount = (selected: number, total: number) => `${selected} of ${total} selected`;

/**
 * A checkbox list with a parent "select all" row. The parent is checked when every enabled option
 * is, indeterminate when only some are, and toggles all enabled options at once.
 */
export function SelectAllCheckboxList({
  label,
  options,
  value,
  onValueChange,
  selectAllLabel = 'Select all',
  formatCount = defaultFormatCount,
}: SelectAllCheckboxListProps) {
  const labelId = useId();
  const selected = new Set(value);
  const enabledIds = options.filter((option) => !option.disabled).map((option) => option.id);
  const enabledSelected = enabledIds.filter((id) => selected.has(id)).length;
  const allSelected = enabledIds.length > 0 && enabledSelected === enabledIds.length;
  const someSelected = enabledSelected > 0 && !allSelected;
  const selectedCount = options.filter((option) => selected.has(option.id)).length;
  const countText = formatCount(selectedCount, options.length);

  const toggleAll = (checked: boolean) => {
    // Locked (disabled) options keep whatever state they had.
    const locked = options.filter((option) => option.disabled && selected.has(option.id)).map((option) => option.id);
    onValueChange(checked ? options.filter((o) => !o.disabled || selected.has(o.id)).map((o) => o.id) : locked);
  };

  const toggleOne = (id: string, checked: boolean) => {
    onValueChange(options.filter((o) => (o.id === id ? checked : selected.has(o.id))).map((o) => o.id));
  };

  return (
    <div className="flex w-full flex-col">
      <span id={labelId} className="pb-2 text-sm font-medium text-muted-foreground">
        {label}
      </span>
      <CheckboxGroup aria-labelledby={labelId}>
        <CheckboxItem>
          <CheckboxItemControl
            checked={allSelected}
            indeterminate={someSelected}
            disabled={enabledIds.length === 0}
            onCheckedChange={(checked) => toggleAll(checked)}
          />
          <CheckboxItemLabel>{selectAllLabel}</CheckboxItemLabel>
        </CheckboxItem>
        <div className="grid pl-6">
          {options.map((option) => (
            <CheckboxItem key={option.id}>
              <CheckboxItemControl
                checked={selected.has(option.id)}
                disabled={option.disabled}
                onCheckedChange={(checked) => toggleOne(option.id, checked)}
              />
              <CheckboxItemLabel>{option.label}</CheckboxItemLabel>
              {option.description ? <CheckboxItemDescription>{option.description}</CheckboxItemDescription> : null}
            </CheckboxItem>
          ))}
        </div>
      </CheckboxGroup>
      {countText ? (
        <output aria-live="polite" className="pt-2 text-xs tabular-nums text-muted-foreground">
          {countText}
        </output>
      ) : null}
    </div>
  );
}
