import { Label } from '@cognite/aura/components/label';
import { Switch } from '@cognite/aura/components/switch';
import { useId, useState } from 'react';

type StateTextSwitchProps = {
  /** Visible label in front of the switch. Without it, pass `aria-label`. */
  label?: string;
  'aria-label'?: string;
  /** Controlled state. Leave out to let the switch keep its own state. */
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  checkedText?: string;
  uncheckedText?: string;
  /** Which side of the switch the state text sits on. */
  textSide?: 'before' | 'after';
  disabled?: boolean;
};

/**
 * A switch that spells out its current state next to it ("On" / "Off", "Running" / "Paused").
 * Aura's own `textLeft` / `textRight` props only update the text when both are set; this keeps a
 * single state word in step with the switch.
 */
export function StateTextSwitch({
  label,
  'aria-label': ariaLabel,
  checked,
  defaultChecked = false,
  onCheckedChange,
  checkedText = 'On',
  uncheckedText = 'Off',
  textSide = 'after',
  disabled = false,
}: StateTextSwitchProps) {
  const id = useId();
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isOn = checked ?? internalChecked;

  return (
    <div className="inline-flex items-center gap-3">
      {label ? (
        <Label htmlFor={id} className="pb-0">
          {label}
        </Label>
      ) : null}
      <div
        className={
          textSide === 'before' ? 'inline-flex flex-row-reverse items-center gap-1' : 'inline-flex items-center gap-1'
        }
      >
        <Switch
          id={id}
          aria-label={label ? undefined : ariaLabel}
          checked={isOn}
          disabled={disabled}
          onCheckedChange={(next) => {
            setInternalChecked(next);
            onCheckedChange?.(next);
          }}
        />
        <span
          aria-hidden="true"
          data-slot="switch-state-text"
          className={disabled ? 'text-sm text-base-foreground-disabled' : 'text-sm text-muted-foreground'}
        >
          {isOn ? checkedText : uncheckedText}
        </span>
      </div>
    </div>
  );
}
