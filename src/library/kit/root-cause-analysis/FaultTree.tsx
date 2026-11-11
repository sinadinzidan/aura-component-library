import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

import { CAUSE_STATES, pathTo, type FaultNode } from './causes';

type FaultTreeProps = {
  /** The top event, in words: "Fault tree for the recompressor trip". */
  label: string;
  root: FaultNode;
  /** Highlights this node and the path from the top event down to it. */
  selected?: string;
  /** Makes nodes buttons. */
  onSelect?: (id: string) => void;
  className?: string;
};

type BranchProps = { node: FaultNode; path: readonly string[]; selected?: string; onSelect?: (id: string) => void; solid: boolean };

const SOLID_LOOKS = ['console', 'poster', 'signal'];

function Branch({ node, path, selected, onSelect, solid }: BranchProps) {
  const { tone, word } = CAUSE_STATES[node.state];
  const children = node.children ?? [];
  const onPath = path.includes(node.id);
  const ruledOut = node.state === 'ruled-out';
  const box = cx(
    'relative flex w-full max-w-52 min-w-36 flex-col gap-1 rounded-(--kit-radius-sm) border px-3 py-2 text-left',
    ruledOut ? 'border-dashed border-(--kit-rule-strong) bg-(--kit-halo)' : solid ? 'border-transparent bg-(--t-solid) text-(--t-on-solid)' : 'border-(--t-line) bg-(--t-soft)',
    selected === node.id && 'outline-2 outline-offset-2 outline-(--kit-text)',
    onSelect && 'cursor-pointer',
  );
  const content = (
    <>
      <span className={cx('text-xs leading-4 font-semibold', ruledOut ? 'text-(--kit-text-2)' : solid ? '' : 'text-(--t-ink)')}>{word}</span>
      <span className={cx('text-sm leading-5 font-medium', ruledOut && 'text-(--kit-text-2) line-through')}>{node.label}</span>
      {node.detail ? <span className={cx('text-xs leading-4 tabular-nums', solid && !ruledOut ? '' : 'text-(--kit-text-2)')}>{node.detail}</span> : null}
    </>
  );
  const rule = (active: boolean) => (active ? 'bg-(--kit-text)' : 'bg-(--kit-rule-strong)');

  return (
    <li data-node={node.id} data-state={node.state} className="flex min-w-0 flex-1 flex-col items-center">
      {onSelect ? (
        <button type="button" data-tone={tone} aria-pressed={selected === node.id} onClick={() => onSelect(node.id)} className={box}>
          {content}
        </button>
      ) : (
        <div data-tone={tone} className={box}>
          {content}
        </div>
      )}
      {children.length > 0 ? (
        <>
          <span aria-hidden="true" className={cx('h-3 w-0.5', rule(onPath && children.some((child) => path.includes(child.id))))} />
          <span className="rounded-full border border-(--kit-rule-strong) bg-(--kit-halo) px-2 text-xs leading-5 font-semibold text-(--kit-text)">{node.gate === 'and' ? 'All of' : 'Any of'}</span>
          <span aria-hidden="true" className={cx('h-3 w-0.5', rule(onPath && children.some((child) => path.includes(child.id))))} />
          <ul className="flex w-full items-start">
            {children.map((child, index) => (
              <div key={child.id} className="relative flex min-w-0 flex-1 flex-col items-center px-1.5 pt-4">
                {children.length > 1 ? (
                  <span aria-hidden="true" className={cx('absolute top-0 h-0.5 bg-(--kit-rule-strong)', index === 0 ? 'right-0 left-1/2' : index === children.length - 1 ? 'right-1/2 left-0' : 'inset-x-0')} />
                ) : null}
                <span aria-hidden="true" className={cx('absolute top-0 left-1/2 h-4 w-0.5 -translate-x-1/2', rule(path.includes(child.id)))} />
                <Branch node={child} path={path} selected={selected} onSelect={onSelect} solid={solid} />
              </div>
            ))}
          </ul>
        </>
      ) : null}
    </li>
  );
}

/**
 * A fault tree: the top event, the gates under it and every suspected cause with its state.
 * Ruled-out branches stay visible, dashed and struck through, because what was excluded is part
 * of the reasoning. Selecting a node darkens the path from the top event down to it. Nodes are
 * tinted and outlined by default and solid blocks in the block-built looks.
 */
export function FaultTree({ label, root, selected, onSelect, className }: FaultTreeProps) {
  const look = useLook();
  const path = selected ? pathTo(root, selected) : [];

  return (
    <ul aria-label={label} data-look={look} className={cx('flex min-w-0 justify-center text-(--kit-text)', className)}>
      <Branch node={root} path={path} selected={selected} onSelect={onSelect} solid={SOLID_LOOKS.includes(look)} />
    </ul>
  );
}
