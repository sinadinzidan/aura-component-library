import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

import { STATE_TONE, STATE_WORD, type IsolationState } from './isolation';

export type SchematicNode = {
  id: string;
  /** Position in percent of the drawing, from the top left. */
  x: number;
  y: number;
  /** `equipment` is a labelled box; `point` is a numbered isolation point that can be selected. */
  kind: 'equipment' | 'point';
  label: string;
  /** Step number of an isolation point. */
  step?: number;
  state?: IsolationState;
};

export type SchematicLink = { from: string; to: string; kind?: 'process' | 'electrical' | 'utility' };

type IsolationSchematicProps = {
  /** What the drawing shows: "Isolation boundary of the recompressor". */
  label: string;
  nodes: readonly SchematicNode[];
  links: readonly SchematicLink[];
  /** Id of the selected isolation point. */
  selected?: string;
  onSelect?: (id: string) => void;
  /** Height of the drawing in px. */
  height?: number;
  className?: string;
};

const SQUARE_LOOKS = ['console', 'poster', 'blueprint', 'signal'];

/**
 * A simplified line diagram of the equipment with its isolation points marked on it. Process
 * lines are solid, electrical lines dashed, utilities dotted. Each point is a numbered marker
 * coloured by its state, with tag and state written beside it, and can be selected.
 */
export function IsolationSchematic({ label, nodes, links, selected, onSelect, height = 320, className }: IsolationSchematicProps) {
  const look = useLook();
  const square = SQUARE_LOOKS.includes(look);
  const byId = new Map(nodes.map((node) => [node.id, node]));

  return (
    <div role="group" aria-label={label} data-look={look} className={cx('relative w-full min-w-0 text-(--kit-text)', className)} style={{ height }}>
      <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full">
        {links.map((link) => {
          const from = byId.get(link.from);
          const to = byId.get(link.to);
          if (!from || !to) return null;
          const dash = link.kind === 'electrical' ? '6 4' : link.kind === 'utility' ? '2 4' : undefined;
          return (
            <polyline
              key={`${link.from}-${link.to}`}
              points={`${from.x},${from.y} ${to.x},${from.y} ${to.x},${to.y}`}
              fill="none"
              strokeWidth={link.kind === 'process' || !link.kind ? 3 : 2}
              strokeDasharray={dash}
              vectorEffect="non-scaling-stroke"
              className="stroke-(--kit-text-2)"
            />
          );
        })}
      </svg>
      {nodes.map((node) => {
        const position = { left: `${node.x}%`, top: `${node.y}%` };
        if (node.kind === 'equipment') {
          return (
            <span
              key={node.id}
              style={position}
              className={cx('absolute -translate-x-1/2 -translate-y-1/2 border-2 border-(--kit-text) bg-(--kit-surface) px-3 py-2 text-center text-sm leading-5 font-semibold whitespace-nowrap', square ? '' : 'rounded-(--kit-radius-sm)')}
            >
              {node.label}
            </span>
          );
        }
        const state = node.state ?? 'planned';
        const isSelected = node.id === selected;
        const marker = (
          <>
            <span
              aria-hidden="true"
              className={cx(
                'flex size-9 items-center justify-center text-base font-semibold tabular-nums ring-4',
                square ? '' : 'rounded-full',
                state === 'planned' || state === 'removed' ? 'border-2 border-(--kit-text) bg-(--kit-surface) text-(--kit-text)' : 'bg-(--t-solid) text-(--t-on-solid)',
                isSelected ? 'ring-(--kit-accent)' : 'ring-(--kit-surface)',
              )}
            >
              {node.step}
            </span>
            <span className={cx('mt-1 flex flex-col items-center bg-(--kit-surface) px-1.5 py-0.5 text-center', square ? '' : 'rounded-(--kit-radius-sm)')}>
              <span className="text-xs leading-4 font-medium whitespace-nowrap tabular-nums">{node.label}</span>
              <span className="text-xs leading-4 font-semibold whitespace-nowrap text-(--t-ink)">{STATE_WORD[state]}</span>
            </span>
          </>
        );
        return onSelect ? (
          <button
            key={node.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(node.id)}
            data-tone={STATE_TONE[state]}
            style={position}
            className="absolute flex -translate-x-1/2 -translate-y-[1.125rem] flex-col items-center outline-none focus-visible:ring-2 focus-visible:ring-(--kit-accent)"
          >
            <span className="sr-only">Point {node.step}: </span>
            {marker}
          </button>
        ) : (
          <span key={node.id} data-tone={STATE_TONE[state]} style={position} className="absolute flex -translate-x-1/2 -translate-y-[1.125rem] flex-col items-center">
            <span className="sr-only">Point {node.step}: </span>
            {marker}
          </span>
        );
      })}
    </div>
  );
}
