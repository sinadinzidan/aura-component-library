import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@cognite/aura/components/select';

export type SelectOption = { value: string; label: string };

type OptionSelectProps = {
  options: readonly SelectOption[];
  /** Controlled value. Leave out, with `defaultValue`, to let the select keep its own state. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  /** Id of the trigger, so a `Label htmlFor` can point at it. */
  id?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: true;
  disabled?: boolean;
  size?: 'default' | 'sm';
  /** `field` fills its column like an input; `compact` keeps a small minimum for toolbars and rows. */
  width?: 'field' | 'compact';
};

/**
 * A single-choice Select driven by an options array. Forms and toolbars repeat the same five
 * Select parts for every list; this keeps the label lookup, the placeholder and the field-width
 * behaviour in one place.
 */
export function OptionSelect({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder = 'Select an option',
  id,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  disabled = false,
  size = 'default',
  width = 'field',
}: OptionSelectProps) {
  // The trigger sets its own aria attributes; only override the ones that were passed.
  const described = ariaDescribedBy === undefined ? {} : { 'aria-describedby': ariaDescribedBy };
  const invalid = ariaInvalid === undefined ? {} : { 'aria-invalid': ariaInvalid };

  return (
    <Select
      items={[...options]}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        size={size}
        aria-label={ariaLabel}
        className={width === 'field' ? 'max-w-full' : 'min-w-36'}
        {...described}
        {...invalid}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
