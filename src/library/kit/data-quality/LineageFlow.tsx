import { IconArrowNarrowRight } from '@cognite/aura/icons';
import type { CSSProperties, ReactNode } from 'react';

import type { LookId } from '../../looks/looks';
import { useLook } from '../../looks/useLook';
import { StatusPill } from '../StatusPill';
import { cx, type Tone } from '../tones';

export type LineageNode = {
  id: string;
  /** The step this node is: "Source", "Staged", "Transformed", "Data model". */
  stage: string;
  name: string;
  /** One line of evidence: row count, age. */
  detail: string;
  /** The state as a word. */
  state: string;
  tone: Tone;
  icon?: ReactNode;
};

type LineageFlowProps = {
  /** What flows, in words. */
  label: string;
  /** Upstream first. */
  nodes: readonly LineageNode[];
  selected?: string;
  /** Makes each node a button. */
  onSelect?: (id: string) => void;
  className?: string;
};

function nodeStyle(look: LookId, picked: boolean): CSSProperties {
  const base: CSSProperties = {
    borderRadius: 'var(--kit-radius-sm)',
    background: look === 'editorial' ? 'transparent' : 'var(--kit-surface)',
    border: look === 'poster' ? '2px solid var(--kit-text)' : look === 'editorial' ? '0' : '1px solid var(--kit-rule-strong)',
    borderTop: look === 'editorial' ? '2px solid var(--kit-text)' : undefined,
    boxShadow: look === 'poster' ? '4px 4px 0 var(--kit-text)' : undefined,
  };
  if (look === 'console' || look === 'signal') return { ...base, border: '0', borderLeft: '4px solid var(--t-line)', background: 'var(--kit-well)' };
  if (look === 'soft') return { ...base, border: '0', background: 'var(--t-soft)' };
  return picked ? { ...base, borderColor: 'var(--kit-text)' } : base;
}

/**
 * Where data comes from and where it goes: source to data model as a row of nodes joined by
 * arrows. Each node carries its state, so a break upstream is visible at the step where it starts.
 */
export function LineageFlow({ label, nodes, selected, onSelect, className }: LineageFlowProps) {
  const look = useLook();

  return (
    <ol aria-label={label} data-look={look} className={cx('flex min-w-0 items-stretch text-[var(--kit-text)]', className)}>
      {nodes.map((node, index) => {
        const picked = selected === node.id;
        const body = (
          <>
            <span className="flex items-center gap-2 text-xs font-medium leading-4 text-[var(--kit-text-2)]">
              {node.icon ? <span className="flex size-4 items-center justify-center [&>svg]:size-4">{node.icon}</span> : null}
              {node.stage}
            </span>
            <span className="text-sm font-semibold leading-5 [overflow-wrap:anywhere]">{node.name}</span>
            <span className="text-xs leading-4 text-[var(--kit-text-2)]">{node.detail}</span>
            <span className="mt-auto pt-2">
              <StatusPill tone={node.tone}>{node.state}</StatusPill>
            </span>
          </>
        );
        const classes = cx(
          'flex h-full w-full min-w-0 flex-col items-start gap-1 p-3 text-left',
          picked ? 'outline outline-2 outline-offset-2 outline-[var(--kit-text)]' : ''
        );
        return (
          <li key={node.id} data-node={node.id} data-tone={node.tone} className="flex min-w-0 flex-1 items-stretch">
            {index > 0 ? (
              <span aria-hidden="true" className="flex w-8 shrink-0 items-center justify-center text-[var(--kit-text-2)] [&>svg]:size-5">
                <IconArrowNarrowRight />
              </span>
            ) : null}
            {onSelect ? (
              <button
                type="button"
                aria-pressed={picked}
                className={cx(classes, 'cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--kit-text)]')}
                style={nodeStyle(look, picked)}
                onClick={() => onSelect(node.id)}
              >
                {body}
              </button>
            ) : (
              <div className={classes} style={nodeStyle(look, picked)}>
                {body}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
