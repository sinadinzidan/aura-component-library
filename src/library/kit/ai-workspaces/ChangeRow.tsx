import { IconArrowRight } from '@cognite/aura/icons';
import { useId } from 'react';
import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { StatusPill } from '../StatusPill';
import { cx, type Tone } from '../tones';

type ChangeRowProps = {
  /** What would change: "High vibration alarm limit". */
  title: string;
  /** The object it belongs to and why the agent proposes it. */
  detail?: ReactNode;
  /** Value today and value proposed, already formatted with their unit. */
  from: string;
  to: string;
  /** How risky the change is, as a word and a tone: `{ label: 'Low risk', tone: 'success' }`. */
  risk: { label: string; tone: Tone };
  /** Whether this change is part of what will be approved. */
  included: boolean;
  onToggle: (included: boolean) => void;
  className?: string;
};

/**
 * One change an agent proposes, for a person to include or leave out before approving: what it
 * is, today's value struck through beside the proposed one, and the risk as a word in its tone.
 */
export function ChangeRow({ title, detail, from, to, risk, included, onToggle, className }: ChangeRowProps) {
  const look = useLook();
  const id = useId();
  return (
    <li
      data-look={look}
      data-tone={risk.tone}
      data-included={included ? '' : undefined}
      className={cx('flex min-w-0 items-center gap-4 border-b border-(--kit-rule) py-3.5 last:border-b-0', included ? '' : 'opacity-60', className)}
    >
      <input
        id={id}
        type="checkbox"
        checked={included}
        onChange={(event) => onToggle(event.target.checked)}
        className="size-4.5 shrink-0 cursor-pointer accent-(--kit-line-accent)"
      />
      <label htmlFor={id} className="flex min-w-0 flex-1 cursor-pointer flex-col">
        <span className="text-sm font-semibold text-(color:--kit-text)">{title}</span>
        {detail ? <span className="text-sm text-(color:--kit-text-2)">{detail}</span> : null}
      </label>
      <span className="flex shrink-0 items-baseline gap-2 tabular-nums">
        <span className="text-sm text-(color:--kit-text-3) line-through">
          <span className="sr-only">From </span>
          {from}
        </span>
        <IconArrowRight aria-hidden="true" className="size-4 self-center text-(color:--kit-text-3)" />
        <span className="text-lg font-semibold text-(color:--kit-text)">
          <span className="sr-only">to </span>
          {to}
        </span>
      </span>
      <StatusPill tone={risk.tone} className="w-32 shrink-0 justify-center">
        {risk.label}
      </StatusPill>
    </li>
  );
}
