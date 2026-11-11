import { IconCheck, IconClock, IconX } from '@cognite/aura/icons';

import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

export type SignOffState = 'signed' | 'pending' | 'rejected';

export type Signer = {
  /** "Prepared by", "Reviewed by", "Approved by". */
  role: string;
  name: string;
  /** Job title. */
  title: string;
  state: SignOffState;
  /** Absolute time of the signature. */
  at?: string;
};

type SignOffProps = {
  signers: readonly Signer[];
  className?: string;
};

const STATE = {
  signed: { tone: 'success', word: 'Signed', Icon: IconCheck },
  pending: { tone: 'neutral', word: 'Awaiting signature', Icon: IconClock },
  rejected: { tone: 'critical', word: 'Returned', Icon: IconX },
} as const;

/**
 * The sign-off block at the foot of a report: one column per role with a signature line, the
 * name, and the state in words with an icon — never colour alone, because reports get printed in
 * grey. A pending signature leaves the line empty.
 */
export function SignOff({ signers, className }: SignOffProps) {
  const look = useLook();

  return (
    <dl data-look={look} className={cx('grid min-w-0 gap-6 text-(--kit-text)', className)} style={{ gridTemplateColumns: `repeat(${signers.length}, minmax(0, 1fr))` }}>
      {signers.map((signer) => {
        const { tone, word, Icon } = STATE[signer.state];
        return (
          <div key={signer.role} data-tone={tone} data-state={signer.state} className="min-w-0">
            <dt className="text-xs font-medium text-(--kit-text-2)">{signer.role}</dt>
            <dd>
              <span className={cx('mt-1 flex h-10 items-end border-b pb-1 text-xl leading-6 italic', signer.state === 'signed' ? 'border-(--kit-text) font-medium' : 'border-dashed border-(--kit-text-2)')}>
                {signer.state === 'signed' ? signer.name : null}
              </span>
              <span className="mt-2 block text-sm leading-5 font-semibold">{signer.name}</span>
              <span className="block text-xs leading-4 text-(--kit-text-2)">{signer.title}</span>
              <span className="mt-1.5 flex items-center gap-1.5 text-xs leading-4 font-medium text-(--t-ink) tabular-nums [&_svg]:h-3.5 [&_svg]:w-3.5">
                <Icon aria-hidden="true" />
                {word}
                {signer.at ? ` · ${signer.at}` : ''}
              </span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
