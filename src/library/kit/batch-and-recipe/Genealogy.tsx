import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

export type GenealogyNode = { id: string; label: string; detail?: string; tone?: Tone };

type GenealogyProps = {
  /** Names the diagram, for example "Genealogy of batch B-2603-118". */
  label: string;
  /** What went in: raw material lots. */
  inputs: readonly GenealogyNode[];
  batch: GenealogyNode;
  /** What came out: product lots. */
  outputs: readonly GenealogyNode[];
  inputsTitle?: string;
  outputsTitle?: string;
  className?: string;
};

function Links({ count, side }: { count: number; side: 'in' | 'out' }) {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" className="h-full w-full">
      {Array.from({ length: count }, (_, index) => {
        const y = ((index + 0.5) / count) * 100;
        const d = side === 'in' ? `M0,${y} C50,${y} 50,50 100,50` : `M0,50 C50,50 50,${y} 100,${y}`;
        return <path key={index} d={d} fill="none" stroke="var(--kit-rule-strong)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />;
      })}
    </svg>
  );
}

function Node({ node, strong = false }: { node: GenealogyNode; strong?: boolean }) {
  const look = useLook();
  const outlined = look === 'blueprint' || look === 'editorial';
  return (
    <li
      data-tone={node.tone ?? (strong ? 'accent' : 'neutral')}
      className={cx(
        'flex min-w-0 flex-1 list-none flex-col justify-center rounded-(--kit-radius-sm) px-3 py-2.5',
        strong ? 'bg-(--t-vivid) text-(--t-on-vivid)' : outlined ? 'border border-(--kit-rule-strong) text-(--kit-text)' : 'bg-(--t-soft) text-(--kit-text)'
      )}
    >
      <span className={cx('leading-5 font-semibold tabular-nums', strong ? 'text-lg' : 'text-sm')}>{node.id}</span>
      <span className="text-sm leading-5">{node.label}</span>
      {node.detail ? <span className={cx('text-xs leading-4', strong ? '' : 'text-(--kit-text-2)')}>{node.detail}</span> : null}
    </li>
  );
}

/**
 * Traceability of one batch: the lots that went into it on the left, the lots that came out of it
 * on the right, joined through the batch in the middle.
 */
export function Genealogy({ label, inputs, batch, outputs, inputsTitle = 'Raw material lots', outputsTitle = 'Product lots', className }: GenealogyProps) {
  const look = useLook();
  return (
    <div role="group" aria-label={label} data-look={look} className={cx('grid min-w-0 grid-cols-[minmax(0,1fr)_3rem_minmax(0,1fr)_3rem_minmax(0,1fr)] gap-y-2', className)}>
      <p className="text-sm leading-5 font-medium text-(--kit-text-2)">{inputsTitle}</p>
      <span />
      <p className="text-sm leading-5 font-medium text-(--kit-text-2)">Batch</p>
      <span />
      <p className="text-sm leading-5 font-medium text-(--kit-text-2)">{outputsTitle}</p>
      <ul className="flex flex-col gap-2">
        {inputs.map((node) => (
          <Node key={node.id} node={node} />
        ))}
      </ul>
      <Links count={inputs.length} side="in" />
      <ul className="flex flex-col justify-center">
        <Node node={batch} strong />
      </ul>
      <Links count={outputs.length} side="out" />
      <ul className="flex flex-col gap-2">
        {outputs.map((node) => (
          <Node key={node.id} node={node} />
        ))}
      </ul>
    </div>
  );
}
