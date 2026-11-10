import { CheckboxItemControl } from '@cognite/aura/components/checkbox';

type SelectionCheckboxProps = {
  /** Accessible name, for example "Select WO-104482" or "Select all rows". */
  label: string;
  checked: boolean;
  /** Some, but not all, of what this checkbox stands for is selected. */
  indeterminate?: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
};

/**
 * A bare checkbox for selecting table rows: no visible label, so it always needs an accessible
 * name. Used by `selectionColumn` for the header and for every row.
 */
export function SelectionCheckbox({ label, checked, indeterminate = false, disabled = false, onChange }: SelectionCheckboxProps) {
  return (
    // The control is an inline element; the flex wrapper lets it keep its size inside a table cell.
    <span className="flex items-center">
      <CheckboxItemControl
        aria-label={label}
        checked={checked}
        indeterminate={indeterminate}
        disabled={disabled}
        onCheckedChange={(next) => onChange(next)}
      />
    </span>
  );
}
