import { useLook } from '../../looks/useLook';
import { StatusPill } from '../StatusPill';
import { TagId } from '../TagId';
import { cx, formatNumber } from '../tones';

import { RESULT_TONE, RESULT_WORD, type Checkpoint } from './rounds';

type CheckpointListProps = {
  /** Accessible name: "Route, compressor hall round". */
  label: string;
  checkpoints: readonly Checkpoint[];
  /** Id of the checkpoint the operator is at. */
  current?: string;
  onSelect?: (id: string) => void;
  /** `compact` drops the location line, for a side column. */
  density?: 'default' | 'compact';
  className?: string;
};

function readingText(checkpoint: Checkpoint): string {
  if (checkpoint.value === undefined) return checkpoint.unit ? `Reading in ${checkpoint.unit}` : 'Visual check';
  return `${formatNumber(checkpoint.value, checkpoint.decimals ?? 1)} ${checkpoint.unit ?? ''}`.trim();
}

function limitText(checkpoint: Checkpoint): string | undefined {
  const decimals = checkpoint.decimals ?? 1;
  if (checkpoint.low !== undefined && checkpoint.high !== undefined) return `${formatNumber(checkpoint.low, decimals)}–${formatNumber(checkpoint.high, decimals)}`;
  if (checkpoint.high !== undefined) return `max ${formatNumber(checkpoint.high, decimals)}`;
  if (checkpoint.low !== undefined) return `min ${formatNumber(checkpoint.low, decimals)}`;
  return undefined;
}

/**
 * The route of a round as a numbered list along a line: each stop carries its tag, where it is,
 * the reading against its limits and the result. The stop the operator is at is highlighted and
 * every stop can be selected.
 */
export function CheckpointList({ label, checkpoints, current, onSelect, density = 'default', className }: CheckpointListProps) {
  const look = useLook();
  const square = look === 'console' || look === 'poster' || look === 'blueprint' || look === 'signal';

  return (
    <ol aria-label={label} data-look={look} className={cx('flex min-w-0 flex-col text-(--kit-text)', className)}>
      {checkpoints.map((checkpoint, index) => {
        const isCurrent = checkpoint.id === current;
        const last = index === checkpoints.length - 1;
        const limits = limitText(checkpoint);
        return (
          <li key={checkpoint.id} data-tone={RESULT_TONE[checkpoint.result]} className="relative">
            {last ? null : <span aria-hidden="true" className="absolute top-9 bottom-0 left-[1.6875rem] w-px bg-(--kit-rule-strong)" />}
            <button
              type="button"
              aria-current={isCurrent ? 'step' : undefined}
              onClick={() => onSelect?.(checkpoint.id)}
              className={cx(
                'relative grid w-full grid-cols-[2rem_minmax(0,1fr)_auto] items-start gap-x-3 px-3 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-(--kit-accent)',
                square ? '' : 'rounded-(--kit-radius-sm)',
                isCurrent ? 'bg-(--kit-well)' : 'hover:bg-(--kit-well)',
              )}
            >
              <span
                aria-hidden="true"
                className={cx(
                  'flex size-8 items-center justify-center text-sm font-semibold tabular-nums',
                  square ? '' : 'rounded-full',
                  checkpoint.result === 'pending' ? 'border border-(--kit-rule-strong) bg-(--kit-surface) text-(--kit-text-2)' : 'bg-(--t-solid) text-(--t-on-solid)',
                )}
              >
                {index + 1}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm leading-5 font-medium">{checkpoint.name}</span>
                <span className="flex flex-wrap items-baseline gap-x-2 text-xs leading-5 text-(--kit-text-2)">
                  <TagId>{checkpoint.tag}</TagId>
                  {density === 'default' ? <span>{checkpoint.location}</span> : null}
                </span>
                {checkpoint.note ? <span className="text-xs leading-5 font-medium text-(--t-ink)">{checkpoint.note}</span> : null}
              </span>
              <span className="flex flex-col items-end gap-1">
                <span className="text-sm leading-5 font-semibold tabular-nums">{readingText(checkpoint)}</span>
                {limits && density === 'default' ? <span className="text-xs text-(--kit-text-2) tabular-nums">Limits {limits}</span> : null}
                <StatusPill tone={RESULT_TONE[checkpoint.result]}>{RESULT_WORD[checkpoint.result]}</StatusPill>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
