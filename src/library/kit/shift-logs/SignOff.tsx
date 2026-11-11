import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

export type Signer = {
  id: string;
  name: string;
  /** What the person signs as, e.g. `Outgoing operator`. */
  capacity: string;
  /** When they signed; leave out while the signature is pending. */
  signedAt?: string;
};

type SignOffProps = {
  label: string;
  signers: readonly Signer[];
  /** A button for the next person to sign, shown under their line. */
  action?: ReactNode;
  className?: string;
};

/**
 * Signature lines for a handover or report: a handwritten-style name on a rule once signed, a
 * dashed empty rule while pending, with the capacity and time underneath.
 */
export function SignOff({ label, signers, action, className }: SignOffProps) {
  const look = useLook();
  const pending = signers.find((signer) => !signer.signedAt);
  return (
    <ul aria-label={label} data-look={look} className={cx('grid w-full gap-x-6 gap-y-4', className)} style={{ gridTemplateColumns: `repeat(${signers.length}, minmax(0, 1fr))` }}>
      {signers.map((signer) => (
        <li key={signer.id} data-signed={Boolean(signer.signedAt)} className="flex min-w-0 flex-col gap-1">
          <div className="flex h-9 items-end pb-1" style={{ borderBottom: signer.signedAt ? '1.5px solid var(--kit-text)' : '1.5px dashed var(--kit-rule-strong)' }}>
            {signer.signedAt ? <span className="text-xl leading-none text-(--kit-text) italic">{signer.name}</span> : <span className="text-sm text-(--kit-text-3)">Not signed yet</span>}
          </div>
          <p className="text-sm font-medium text-(--kit-text)">{signer.capacity}</p>
          <p className="text-xs text-(--kit-text-3) tabular-nums">{signer.signedAt ? `Signed ${signer.signedAt}` : `Waiting for ${signer.name}`}</p>
          {action && pending?.id === signer.id ? <div className="mt-1">{action}</div> : null}
        </li>
      ))}
    </ul>
  );
}
