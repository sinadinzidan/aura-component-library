import { Badge } from '@cognite/aura/components/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@cognite/aura/components/command';
import { Popover, PopoverContent, PopoverTrigger } from '@cognite/aura/components/popover';
import { IconCheck, IconPlus, IconSelector, IconX } from '@cognite/aura/icons';
import { cn } from '@cognite/aura/utils';
import { Fragment, useId, useRef, useState } from 'react';

export type MultiSelectOption = { value: string; label: string };
export type MultiSelectOptionGroup = {
  label?: string;
  options: readonly MultiSelectOption[];
};

type MultiSelectComboboxProps = {
  options: readonly MultiSelectOption[] | readonly MultiSelectOptionGroup[];
  /** Values of the selected options, in the order they were picked. */
  value: readonly string[];
  onValueChange: (value: string[]) => void;
  /** Id of the trigger, so a `Label htmlFor` can point at it. */
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  /** Chips beyond this number collapse into a "+N more" chip. */
  maxVisibleChips?: number;
  /** Offers "Create …" for a search term that matches no option. Add the option in the handler. */
  onCreateOption?: (label: string) => void;
  invalid?: boolean;
  disabled?: boolean;
};

function isGrouped(
  options: readonly MultiSelectOption[] | readonly MultiSelectOptionGroup[]
): options is readonly MultiSelectOptionGroup[] {
  return options.length > 0 && 'options' in options[0];
}

/**
 * A searchable multi-select: picked options show as removable chips in the field, and the list
 * stays open while picking. Aura's `Combobox` is single-select only; this composes the same
 * `Popover` and `Command` parts for the multi-select case.
 */
export function MultiSelectCombobox({
  options,
  value,
  onValueChange,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  placeholder = 'Select options',
  searchPlaceholder = 'Search…',
  emptyText = 'No option found.',
  maxVisibleChips,
  onCreateOption,
  invalid = false,
  disabled = false,
}: MultiSelectComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const anchorRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const groups: readonly MultiSelectOptionGroup[] = isGrouped(options) ? options : [{ options }];
  const allOptions = groups.flatMap((group) => group.options);
  const selectedOptions = value.flatMap((selected) => allOptions.filter((option) => option.value === selected));
  const visibleChips = maxVisibleChips === undefined ? selectedOptions : selectedOptions.slice(0, maxVisibleChips);
  const hiddenCount = selectedOptions.length - visibleChips.length;

  const term = search.trim();
  const canCreate =
    onCreateOption !== undefined &&
    term !== '' &&
    !allOptions.some((option) => option.label.toLowerCase() === term.toLowerCase());

  const toggle = (optionValue: string) => {
    onValueChange(value.includes(optionValue) ? value.filter((v) => v !== optionValue) : [...value, optionValue]);
  };

  const remove = (optionValue: string) => {
    onValueChange(value.filter((v) => v !== optionValue));
  };

  const changeOpen = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setSearch('');
  };

  return (
    <div data-slot="multi-select-combobox" className="w-full">
      <Popover open={open} onOpenChange={changeOpen}>
        <div
          ref={anchorRef}
          className={cn(
            'flex min-h-9 w-full items-center gap-1 rounded-lg border border-transparent bg-medium-background py-1 pl-2 pr-1 transition-[color,box-shadow]',
            'focus-within:bg-base-background focus-within:shadow-focus-ring',
            !disabled && 'hover:border-emphasized focus-within:hover:border-transparent',
            open && 'bg-base-background shadow-focus-ring hover:border-transparent',
            invalid && 'shadow-focus-ring-destructive',
            disabled && 'border-disabled bg-transparent'
          )}
        >
          {selectedOptions.length > 0 ? (
            <ul className="flex min-w-0 flex-wrap items-center gap-1">
              {visibleChips.map((option) => (
                <li key={option.value} className="flex min-w-0">
                  <Badge variant="secondary" className="max-w-full gap-1">
                    <span className="truncate">{option.label}</span>
                    {disabled ? null : (
                      <button
                        type="button"
                        aria-label={`Remove ${option.label}`}
                        className="-mr-1 flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-sm outline-none hover:bg-secondary-background-hover focus-visible:shadow-focus-ring"
                        onClick={() => remove(option.value)}
                      >
                        <IconX aria-hidden="true" className="size-3" />
                      </button>
                    )}
                  </Badge>
                </li>
              ))}
              {hiddenCount > 0 ? (
                <li>
                  <Badge variant="secondary">+{hiddenCount} more</Badge>
                </li>
              ) : null}
            </ul>
          ) : null}
          <PopoverTrigger
            render={
              <button
                type="button"
                id={id}
                role="combobox"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={open ? listId : undefined}
                aria-label={ariaLabel}
                aria-labelledby={ariaLabelledBy}
                aria-describedby={ariaDescribedBy}
                aria-invalid={invalid ? true : undefined}
                disabled={disabled}
                className={cn(
                  'flex h-7 min-w-10 flex-1 cursor-pointer items-center justify-between gap-2 text-left text-sm outline-none',
                  disabled ? 'cursor-not-allowed text-base-foreground-disabled' : 'text-muted-foreground'
                )}
                onKeyDown={(event) => {
                  // Backspace on the closed field removes the last chip, like a tag input.
                  if (event.key === 'Backspace' && !open && value.length > 0) {
                    onValueChange(value.slice(0, -1));
                  }
                }}
              >
                <span className="truncate">{selectedOptions.length === 0 ? placeholder : ''}</span>
                <IconSelector aria-hidden="true" className="size-4 shrink-0 opacity-50" />
              </button>
            }
          />
        </div>
        <PopoverContent anchor={anchorRef} align="start" className="w-(--anchor-width) min-w-56 p-0">
          <Command>
            <CommandInput placeholder={searchPlaceholder} value={search} onValueChange={setSearch} />
            <CommandList id={listId} aria-multiselectable="true">
              {canCreate ? null : <CommandEmpty>{emptyText}</CommandEmpty>}
              {groups.map((group, groupIndex) => (
                <Fragment key={group.label ?? groupIndex}>
                  {groupIndex > 0 ? <CommandSeparator /> : null}
                  <CommandGroup heading={group.label}>
                    {group.options.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        keywords={[option.label]}
                        aria-selected={value.includes(option.value)}
                        onSelect={() => toggle(option.value)}
                      >
                        <span className="flex-1 truncate">{option.label}</span>
                        <IconCheck
                          aria-hidden="true"
                          className={value.includes(option.value) ? 'size-4 opacity-100' : 'size-4 opacity-0'}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Fragment>
              ))}
              {canCreate ? (
                <CommandGroup forceMount>
                  <CommandItem
                    forceMount
                    value={`create ${term}`}
                    onSelect={() => {
                      onCreateOption?.(term);
                      setSearch('');
                    }}
                  >
                    <IconPlus aria-hidden="true" />
                    <span className="flex-1 truncate">Create “{term}”</span>
                  </CommandItem>
                </CommandGroup>
              ) : null}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
