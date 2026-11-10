import { Switch } from '@cognite/aura/components/switch';
import { useId } from 'react';

type SettingSwitchRowProps = {
  label: string;
  /** What the setting does, in one short sentence. */
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** When set, the switch is disabled and this sentence replaces the description. */
  disabledReason?: string;
};

/**
 * One line of a settings list: label and description on the left, the switch on the right. The
 * whole text block is the switch's label, and a disabled row always says why.
 */
export function SettingSwitchRow({
  label,
  description,
  checked,
  onCheckedChange,
  disabledReason,
}: SettingSwitchRowProps) {
  const id = useId();
  const descriptionId = `${id}-description`;
  const disabled = disabledReason !== undefined;
  const supportingText = disabledReason ?? description;

  return (
    <div className="flex w-full items-start justify-between gap-4 py-3">
      <div className="flex min-w-0 flex-col gap-1">
        <label
          htmlFor={id}
          className={
            disabled
              ? 'text-sm font-medium text-base-foreground-disabled'
              : 'cursor-pointer text-sm font-medium text-base-foreground'
          }
        >
          {label}
        </label>
        {supportingText ? (
          <p id={descriptionId} className="text-xs text-muted-foreground">
            {supportingText}
          </p>
        ) : null}
      </div>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        aria-describedby={supportingText ? descriptionId : undefined}
        onCheckedChange={(next) => onCheckedChange(next)}
      />
    </div>
  );
}
