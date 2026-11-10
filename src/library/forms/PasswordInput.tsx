import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@cognite/aura/components/input-group';
import { IconEye, IconEyeOff } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ComponentProps } from 'react';

type PasswordInputProps = Omit<ComponentProps<typeof InputGroupInput>, 'type'> & {
  showLabel?: string;
  hideLabel?: string;
  /** Start with the value visible, for secrets the user has just generated. */
  defaultVisible?: boolean;
};

/** A password or secret field with a show/hide toggle, so people can check what they typed. */
export function PasswordInput({
  showLabel = 'Show password',
  hideLabel = 'Hide password',
  defaultVisible = false,
  disabled,
  ...inputProps
}: PasswordInputProps) {
  const [visible, setVisible] = useState(defaultVisible);

  return (
    <InputGroup>
      <InputGroupInput {...inputProps} disabled={disabled} type={visible ? 'text' : 'password'} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
          disabled={disabled}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <IconEyeOff /> : <IconEye />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
