import { Button } from '@cognite/aura/components/button';
import { IconCheck, IconCopy } from '@cognite/aura/icons';
import { useEffect, useState } from 'react';
import type { ComponentProps } from 'react';

type CopyButtonProps = Omit<ComponentProps<typeof Button>, 'onClick' | 'children'> & {
  /** Text placed on the clipboard. */
  text: string;
  label?: string;
  copiedLabel?: string;
  /** Icon-only rendering; the label becomes the accessible name. */
  iconOnly?: boolean;
  writeText?: (text: string) => Promise<void>;
  resetAfterMs?: number;
};

const writeToClipboard = (text: string) => navigator.clipboard.writeText(text);

/** Copies a value and confirms in place, so no toast is needed for a one-click copy. */
export function CopyButton({
  text,
  label = 'Copy',
  copiedLabel = 'Copied',
  iconOnly = false,
  writeText = writeToClipboard,
  resetAfterMs = 2000,
  ...buttonProps
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const handle = window.setTimeout(() => setCopied(false), resetAfterMs);
    return () => window.clearTimeout(handle);
  }, [copied, resetAfterMs]);

  const copy = () => {
    void writeText(text).then(
      () => setCopied(true),
      () => setCopied(false)
    );
  };

  const currentLabel = copied ? copiedLabel : label;

  return (
    <Button {...buttonProps} aria-label={iconOnly ? currentLabel : undefined} onClick={copy}>
      {copied ? <IconCheck /> : <IconCopy />}
      {iconOnly ? null : currentLabel}
      <span aria-live="polite" className="sr-only">
        {copied ? copiedLabel : ''}
      </span>
    </Button>
  );
}
