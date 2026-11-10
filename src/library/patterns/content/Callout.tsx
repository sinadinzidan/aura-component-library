import { Alert, AlertActions, AlertDescription, AlertTitle } from '@cognite/aura/components/alert';
import type { ReactNode } from 'react';

export type CalloutTone = 'note' | 'info' | 'caution' | 'critical';

const TONES = {
  note: { variant: 'default', spoken: 'Note' },
  info: { variant: 'info', spoken: 'Information' },
  caution: { variant: 'warning', spoken: 'Caution' },
  critical: { variant: 'error', spoken: 'Warning' },
} as const;

type CalloutProps = {
  /** How much the reader must not miss it. `caution` and `critical` are for risk, not emphasis. */
  tone?: CalloutTone;
  title: string;
  /** One or two sentences. */
  children?: ReactNode;
  /** `AlertButton`s for the one thing the reader can do about it. */
  actions?: ReactNode;
};

/**
 * A highlighted aside inside written content, built on Aura's Alert. Unlike an Alert raised by
 * the system it is part of the document, so it is announced as a note rather than interrupting,
 * and the tone is read out in words as well as shown by the icon and colour.
 */
export function Callout({ tone = 'note', title, children, actions }: CalloutProps) {
  const { variant, spoken } = TONES[tone];

  return (
    <Alert variant={variant} role="note" data-tone={tone}>
      <AlertTitle>
        <span className="sr-only">{spoken}: </span>
        {title}
      </AlertTitle>
      {children ? <AlertDescription>{children}</AlertDescription> : null}
      {actions ? <AlertActions>{actions}</AlertActions> : null}
    </Alert>
  );
}
