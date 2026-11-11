import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

import { SymbolGlyph } from './SymbolGlyph';
import { portShare, type SymbolKind } from './symbols';

export type TrainNode = {
  id: string;
  kind: SymbolKind;
  /** Functional location tag, printed under the symbol. */
  tag: string;
  name: string;
  tone?: Tone;
  /** The state as a word, shown when it is not normal or when the node is selected. */
  state?: string;
  /** A live reading, already formatted. */
  value?: string;
  /** What flows out of this node towards the next, printed on the pipe: "48.6 barg". */
  outLabel?: string;
  /** No flow in the pipe after this node: drawn dashed. */
  blocked?: boolean;
  dashed?: boolean;
  fault?: boolean;
};

type SymbolTrainProps = {
  /** What the train is, for assistive technology: "Gas compression train". */
  label: string;
  nodes: readonly TrainNode[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** Side of each symbol in px. */
  size?: number;
  className?: string;
};

/**
 * Symbols joined by pipes into a process train that reads left to right: each machine with its
 * tag and reading under it, the stream condition on the pipe between, and one machine selectable
 * for detail. Pipes thicken and square off with the look.
 */
export function SymbolTrain({ label, nodes, selectedId, onSelect, size = 56, className }: SymbolTrainProps) {
  const look = useLook();
  const pipe = look === 'poster' ? 4 : look === 'blueprint' || look === 'editorial' ? 1.5 : 3;

  return (
    <div role="group" aria-label={label} data-look={look} className={cx('flex min-w-0 items-start text-(--kit-text)', className)}>
      {nodes.map((node, index) => {
        const selected = node.id === selectedId;
        const lift = (0.5 - portShare(node.kind, 'in').y) * size;
        const next = nodes[index + 1];
        return (
          <div key={node.id} className={cx('flex min-w-0 items-start', next ? 'flex-1' : '')}>
            <button
              type="button"
              aria-pressed={selected}
              aria-label={`${node.name}, ${node.tag}${node.state ? `, ${node.state}` : ''}`}
              data-tone={node.tone ?? 'neutral'}
              onClick={() => onSelect?.(node.id)}
              className="flex w-24 shrink-0 cursor-pointer flex-col items-center gap-1.5 px-1 pb-2 text-center outline-none hover:bg-(--kit-track) focus-visible:ring-2 focus-visible:ring-(--kit-text)"
              style={{
                borderRadius: 'var(--kit-radius-sm)',
                background: selected ? 'color-mix(in oklab, var(--kit-line-accent) 12%, transparent)' : undefined,
                boxShadow: selected ? 'inset 0 0 0 2px var(--kit-line-accent)' : undefined,
              }}
            >
              <span className="flex items-center justify-center" style={{ height: size + 16 }}>
                <span style={{ transform: `translateY(${lift}px)` }}>
                  <SymbolGlyph kind={node.kind} label={null} size={size} tone={node.tone} dashed={node.dashed} fault={node.fault} />
                </span>
              </span>
              <span className="text-xs leading-4 font-semibold tabular-nums">{node.tag}</span>
              <span className="text-xs leading-4 text-(--kit-text-2)">{node.name}</span>
              {node.value ? <span className="text-sm leading-5 font-semibold tabular-nums">{node.value}</span> : null}
              {node.state ? (
                <span className="px-1.5 py-0.5 text-xs font-semibold" style={{ background: 'var(--t-soft)', color: 'var(--t-on-soft)', borderRadius: look === 'console' || look === 'blueprint' || look === 'poster' ? 0 : 999 }}>
                  {node.state}
                </span>
              ) : null}
            </button>
            {next ? (
              <div aria-hidden="true" data-part="pipe" className="relative min-w-6 flex-1" style={{ height: size + 16 }}>
                <span
                  className="absolute inset-x-0 top-1/2 -translate-y-1/2"
                  style={{ borderTop: `${pipe}px ${node.blocked ? 'dashed' : 'solid'} ${node.blocked ? 'var(--kit-text-3)' : 'var(--kit-text-2)'}` }}
                />
                {node.blocked ? null : (
                  <svg width="12" height="14" viewBox="0 0 12 14" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <path d="M1 1L11 7L1 13Z" fill="var(--kit-text-2)" />
                  </svg>
                )}
                {node.outLabel ? (
                  <span className="absolute inset-x-0 bottom-[calc(50%+10px)] text-center text-xs leading-4 font-medium whitespace-nowrap text-(--kit-text-2) tabular-nums">{node.outLabel}</span>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
