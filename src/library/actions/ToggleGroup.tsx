import { Toggle } from '@cognite/aura/components/toggle';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import type { ComponentProps, ReactNode } from 'react';

export type ToggleGroupOption = {
  value: string;
  /** Visible label, or the accessible name and tooltip when `iconOnly` is set. */
  label: string;
  icon?: ReactNode;
  /** Number of matching items, shown after the label. */
  count?: number;
  disabled?: boolean;
};

type ToggleGroupProps = {
  /** Accessible name for the whole group, for example "Chart overlays". */
  label: string;
  options: readonly ToggleGroupOption[];
  /** Values of the pressed options. */
  value: readonly string[];
  onValueChange: (value: string[]) => void;
  /** `multiple` lets any number be pressed; `single` keeps at most one. */
  selection?: 'single' | 'multiple';
  /** With `single`, keeps the pressed option pressed when it is activated again. */
  required?: boolean;
  /** Renders icons only; each label becomes the accessible name and a tooltip. */
  iconOnly?: boolean;
  variant?: ComponentProps<typeof Toggle>['variant'];
  size?: ComponentProps<typeof Toggle>['size'];
  disabled?: boolean;
};

/**
 * Two to four related Toggles that share one value. Aura documents a Toggle Group but does not ship
 * one, so this composes Aura's Toggle and owns only the selection rules.
 */
export function ToggleGroup({
  label,
  options,
  value,
  onValueChange,
  selection = 'multiple',
  required = false,
  iconOnly = false,
  variant,
  size,
  disabled = false,
}: ToggleGroupProps) {
  const change = (optionValue: string, pressed: boolean) => {
    if (selection === 'single') {
      if (pressed) onValueChange([optionValue]);
      else if (!required) onValueChange([]);
      return;
    }
    const rest = value.filter((current) => current !== optionValue);
    onValueChange(pressed ? [...rest, optionValue] : rest);
  };

  return (
    <div role="group" aria-label={label} className="flex items-center gap-1">
      {options.map((option) => {
        const shared = {
          variant,
          size,
          pressed: value.includes(option.value),
          disabled: disabled || option.disabled,
          onPressedChange: (pressed: boolean) => change(option.value, pressed),
        };

        if (iconOnly) {
          return (
            <Tooltip key={option.value}>
              <TooltipTrigger
                render={
                  <Toggle {...shared} aria-label={option.label}>
                    {option.icon}
                  </Toggle>
                }
              />
              <TooltipContent>{option.label}</TooltipContent>
            </Tooltip>
          );
        }

        return <Toggle key={option.value} {...shared} icon={option.icon} label={option.label} count={option.count} />;
      })}
    </div>
  );
}
