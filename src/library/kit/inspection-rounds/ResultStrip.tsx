import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

import { RESULT_TONE, roundProgress, type CheckpointResult } from './rounds';

type ResultStripProps = {
  /** Accessible name: "Compressor hall round". */
  label: string;
  /** One result per checkpoint, in route order. */
  results: readonly CheckpointResult[];
  /** `lg` for a strip that is the main content of a tile. */
  size?: 'md' | 'lg';
  className?: string;
};

const BLOCK_LOOKS = ['console', 'poster', 'signal'];
const OUTLINE_LOOKS = ['blueprint', 'editorial'];

/**
 * A round as one cell per checkpoint in route order, coloured by result, so the operator sees
 * where on the route the failures and the gaps are. Cells are pills by default, solid blocks in
 * the block-built looks and outlined boxes on a blueprint or in a report.
 */
export function ResultStrip({ label, results, size = 'md', className }: ResultStripProps) {
  const look = useLook();
  const progress = roundProgress(results);
  const shape = BLOCK_LOOKS.includes(look) ? 'block' : OUTLINE_LOOKS.includes(look) ? 'outline' : 'pill';
  const height = size === 'lg' ? 'h-5' : 'h-2.5';

  return (
    <div
      role="img"
      aria-label={`${label}: ${progress.done} of ${progress.total} checkpoints done, ${progress.failed} failed, ${progress.skipped} skipped`}
      data-look={look}
      data-shape={shape}
      className={cx('flex min-w-0', shape === 'block' ? 'gap-0.5' : 'gap-1', className)}
    >
      {results.map((result, index) => (
        <span
          key={index}
          data-tone={RESULT_TONE[result]}
          data-result={result}
          className={cx(
            'min-w-0 flex-1',
            shape === 'block' ? (size === 'lg' ? 'h-6' : 'h-4') : height,
            shape === 'pill' ? 'rounded-full' : '',
            shape === 'outline' ? 'border border-(--kit-text)' : '',
            result === 'pending' ? (shape === 'outline' ? '' : 'bg-(--kit-track) ring-1 ring-(--kit-rule) ring-inset') : 'bg-(--t-solid)',
          )}
        />
      ))}
    </div>
  );
}
