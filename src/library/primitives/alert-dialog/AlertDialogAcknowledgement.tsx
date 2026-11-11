import { CheckboxItem, CheckboxItemControl, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import { useEffect, useId, useState } from 'react';
import type { ReactNode } from 'react';

import { useAlertDialogContext } from './alertDialogContext';

export type AlertDialogAcknowledgementProps = {
  /** A first-person statement of the consequence: "I understand that production stops". */
  children: ReactNode;
  /**
   * `true` (default) keeps the confirming action locked until the box is ticked. `false` makes
   * it an optional preference, such as "Don't ask again", that never blocks the action.
   */
  required?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

/**
 * A checkbox inside an alert dialog. Required, it makes the user acknowledge one specific
 * consequence before the action unlocks. Optional, it records a preference for low-risk prompts.
 */
export function AlertDialogAcknowledgement({
  children,
  required = true,
  defaultChecked = false,
  onCheckedChange,
}: AlertDialogAcknowledgementProps) {
  const id = useId();
  const { pending, setGate } = useAlertDialogContext();
  const [checked, setChecked] = useState(defaultChecked);

  useEffect(() => {
    setGate(id, required ? checked : null);
  }, [id, required, checked, setGate]);

  useEffect(() => () => setGate(id, null), [id, setGate]);

  return (
    <div data-slot="alert-dialog-acknowledgement" className="pt-2">
      <CheckboxItem>
        <CheckboxItemControl
          checked={checked}
          disabled={pending}
          required={required}
          onCheckedChange={(next) => {
            setChecked(next);
            onCheckedChange?.(next);
          }}
        />
        <CheckboxItemLabel>{children}</CheckboxItemLabel>
      </CheckboxItem>
    </div>
  );
}
