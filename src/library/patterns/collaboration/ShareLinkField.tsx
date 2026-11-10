import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
import { useId } from 'react';
import type { ReactNode } from 'react';

import { CopyButton } from '../../actions/CopyButton';

type ShareLinkFieldProps = {
  /** What the link opens: "Link to this view". */
  label: string;
  url: string;
  /** Who can open it, or when it expires. */
  hint?: ReactNode;
  copyLabel?: string;
  copiedLabel?: string;
  /** Hides the visible label when the surrounding heading already names the field. */
  hideLabel?: boolean;
  writeText?: (text: string) => Promise<void>;
};

/**
 * A link someone is about to share: the URL in a read-only field that selects itself on focus,
 * and a copy button that confirms in place. The hint under it says who the link works for, so
 * nobody pastes a link the recipient cannot open.
 */
export function ShareLinkField({
  label,
  url,
  hint,
  copyLabel = 'Copy link',
  copiedLabel = 'Link copied',
  hideLabel = false,
  writeText,
}: ShareLinkFieldProps) {
  const id = useId();
  const hintId = useId();

  return (
    <div data-slot="share-link-field" className="flex w-full min-w-0 flex-col">
      {hideLabel ? null : <Label htmlFor={id}>{label}</Label>}
      <div className="flex min-w-0 items-center gap-2">
        <Input
          id={id}
          readOnly
          value={url}
          aria-label={hideLabel ? label : undefined}
          aria-describedby={hint ? hintId : undefined}
          onFocus={(event) => event.target.select()}
          className="min-w-0 flex-1"
        />
        <CopyButton variant="secondary" text={url} label={copyLabel} copiedLabel={copiedLabel} writeText={writeText} className="shrink-0" />
      </div>
      {hint ? (
        <p id={hintId} className="pt-2 text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
