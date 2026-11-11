import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
import { useEffect, useId, useState } from 'react';
import type { ReactNode } from 'react';

import { useAlertDialogContext } from './alertDialogContext';
import { matchesConfirmation } from './matchesConfirmation';

export type AlertDialogTypedConfirmationProps = {
  /** The exact text to type: the name or tag of the object, never a generic word. */
  text: string;
  /** Replaces the default "Type … to confirm" label. Must still show `text`. */
  label?: ReactNode;
  /** Ignore letter case when comparing. Tags are case-sensitive by default. */
  ignoreCase?: boolean;
};

/**
 * A field that keeps the confirming action locked until the object's name is typed exactly.
 * Reserve it for actions that cannot be undone and reach far: it is friction on purpose.
 */
export function AlertDialogTypedConfirmation({ text, label, ignoreCase = false }: AlertDialogTypedConfirmationProps) {
  const id = useId();
  const { pending, setGate, inputRef } = useAlertDialogContext();
  const [typed, setTyped] = useState('');
  const satisfied = matchesConfirmation(typed, text, ignoreCase);

  useEffect(() => {
    setGate(id, satisfied);
  }, [id, satisfied, setGate]);

  useEffect(() => () => setGate(id, null), [id, setGate]);

  return (
    <div data-slot="alert-dialog-typed-confirmation" className="pt-2">
      <Label htmlFor={id}>
        {label ?? (
          <span>
            Type <span className="font-mono font-semibold text-base-foreground">{text}</span> to confirm
          </span>
        )}
      </Label>
      <Input
        ref={inputRef}
        id={id}
        value={typed}
        autoComplete="off"
        spellCheck={false}
        disabled={pending}
        onChange={(event) => setTyped(event.target.value)}
      />
    </div>
  );
}
