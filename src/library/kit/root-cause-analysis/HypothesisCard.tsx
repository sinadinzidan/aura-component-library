import { useLook } from '../../looks/useLook';
import { StatusPill } from '../StatusPill';
import { cx } from '../tones';

import { CAUSE_STATES, supportShare, type CauseState } from './causes';

type HypothesisCardProps = {
  /** Reference used in the text: "H1". */
  reference: string;
  title: string;
  state: CauseState;
  /** One or two sentences: what would have to be true. */
  summary: string;
  /** Number of evidence items for and against. */
  supports: number;
  contradicts: number;
  owner?: string;
  selected?: boolean;
  onSelect?: () => void;
  className?: string;
};

/**
 * One suspected cause with its state and the balance of evidence behind it: a bar split into
 * supporting and contradicting items with the counts written out. A ruled-out hypothesis stays
 * readable but recedes. The card is a button when `onSelect` is given.
 */
export function HypothesisCard({ reference, title, state, summary, supports, contradicts, owner, selected = false, onSelect, className }: HypothesisCardProps) {
  const look = useLook();
  const { tone, word } = CAUSE_STATES[state];
  const share = supportShare(supports, contradicts);
  const classes = cx(
    'flex h-full min-w-0 flex-col gap-3 rounded-(--kit-radius-sm) border bg-(--kit-surface) p-4 text-left text-(--kit-text)',
    state === 'ruled-out' ? 'border-dashed border-(--kit-rule-strong)' : 'border-(--kit-rule)',
    state === 'confirmed' && 'border-l-4 border-l-(--t-line)',
    selected && 'outline-2 outline-offset-2 outline-(--kit-text)',
    onSelect && 'cursor-pointer',
    className,
  );
  const content = (
    <>
      <span className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-(--kit-text-2) tabular-nums">{reference}</span>
        <StatusPill tone={tone}>{word}</StatusPill>
      </span>
      <span className="block">
        <span className={cx('block text-base leading-6 font-semibold', state === 'ruled-out' && 'text-(--kit-text-2)')}>{title}</span>
        <span className="mt-1 block text-sm leading-5 text-(--kit-text-2)">{summary}</span>
      </span>
      <span className="mt-auto block">
        <span aria-hidden="true" className="flex h-2 gap-0.5">
          <span className="bg-(--kit-text)" style={{ width: `${share}%` }} />
          <span className="flex-1 border border-(--kit-text-2)" />
        </span>
        <span className="mt-1.5 flex justify-between gap-2 text-xs leading-4 tabular-nums">
          <span className="font-medium">{supports} supporting</span>
          <span className="text-(--kit-text-2)">{contradicts} contradicting</span>
        </span>
        {owner ? <span className="mt-2 block text-xs leading-4 text-(--kit-text-2)">Owner: {owner}</span> : null}
      </span>
    </>
  );

  return onSelect ? (
    <button type="button" data-look={look} data-tone={tone} data-state={state} aria-pressed={selected} onClick={onSelect} className={classes}>
      {content}
    </button>
  ) : (
    <div data-look={look} data-tone={tone} data-state={state} className={classes}>
      {content}
    </div>
  );
}
