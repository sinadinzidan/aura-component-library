import { Button } from '@cognite/aura/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconEye, IconEyeOff } from '@cognite/aura/icons';
import { useId, useState } from 'react';
import type { ReactNode } from 'react';

import { CopyButton } from '../../actions/CopyButton';

import { maskSecret } from './maskSecret';
import type { MaskOptions } from './maskSecret';

type SecretFieldProps = {
  /** What the value is: "Client secret", "Signing secret". */
  label: string;
  /**
   * The full secret, when the client holds it. Leave out for a stored secret the server will not
   * return again; the field then shows `masked` and offers neither reveal nor copy.
   */
  value?: string;
  /** A masked hint from the server. Without it the mask is derived from `value`. */
  masked?: string;
  /** How to derive the mask from `value`. */
  mask?: MaskOptions;
  /** Start with the value readable, for a secret that was created a moment ago. */
  defaultRevealed?: boolean;
  /** Turn off to allow copy without ever showing the value on screen. */
  revealable?: boolean;
  /** Line under the field: where it is used, or why it cannot be shown. */
  hint?: ReactNode;
  writeText?: (text: string) => Promise<void>;
};

/**
 * A secret shown read-only: masked by default, with reveal and copy when the client actually has
 * the value. The mask has a fixed length so it never gives away how long the secret is, and a
 * stored secret that cannot be fetched again is shown as a hint with no controls.
 */
export function SecretField({
  label,
  value,
  masked,
  mask,
  defaultRevealed = false,
  revealable = true,
  hint,
  writeText,
}: SecretFieldProps) {
  const id = useId();
  const [revealed, setRevealed] = useState(defaultRevealed);
  const hasValue = value !== undefined;
  const canReveal = hasValue && revealable;
  const shown = hasValue && canReveal && revealed ? value : (masked ?? maskSecret(value ?? '', mask));
  const toggleLabel = revealed ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`;

  return (
    <div className="flex w-full min-w-0 flex-col gap-1">
      <span id={`${id}-label`} className="text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <div className="flex h-9 items-center gap-1 rounded-lg bg-muted-background pr-1 pl-3">
        <code
          aria-labelledby={`${id}-label`}
          aria-describedby={hint ? `${id}-hint` : undefined}
          data-revealed={canReveal && revealed ? 'true' : undefined}
          className="min-w-0 flex-1 truncate font-mono text-sm text-base-foreground"
        >
          {shown}
        </code>
        {canReveal ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={toggleLabel}
                  aria-pressed={revealed}
                  onClick={() => setRevealed((current) => !current)}
                >
                  {revealed ? <IconEyeOff /> : <IconEye />}
                </Button>
              }
            />
            <TooltipContent>{toggleLabel}</TooltipContent>
          </Tooltip>
        ) : null}
        {hasValue ? (
          <CopyButton
            variant="ghost"
            size="icon-sm"
            text={value}
            label={`Copy ${label.toLowerCase()}`}
            iconOnly
            writeText={writeText}
          />
        ) : null}
      </div>
      {hint ? (
        <span id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </span>
      ) : null}
    </div>
  );
}
