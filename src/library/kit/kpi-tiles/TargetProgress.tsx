import { useLook } from '../../looks/useLook';
import { cx, formatNumber, type Tone } from '../tones';

import { filledBlocks, scalePosition, shareOfTarget } from './progress';

export type TargetProgressVariant = 'bar' | 'blocks' | 'scale';

type TargetProgressProps = {
  /** What is measured: "Gas export". */
  label: string;
  value: number;
  target: number;
  /** End of the scale. Defaults to 125 % of the target so the target sits inside the track. */
  max?: number;
  unit?: string;
  decimals?: number;
  tone?: Tone;
  /** Leave out to let the look choose: blocks in console, poster and signal, a ruled scale on a blueprint. */
  variant?: TargetProgressVariant;
  /** Number of blocks in the `blocks` variant. */
  blocks?: number;
  className?: string;
};

const BLOCK_LOOKS = ['console', 'poster', 'signal'];
const TICKS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

/**
 * A figure measured against its target: label and value on one line, a track with the target
 * marked on it, and the share reached written out. The track is a rounded bar by default, a row
 * of solid blocks in the block-built looks and a ruled scale with a pointer on a blueprint.
 */
export function TargetProgress({ label, value, target, max, unit, decimals = 0, tone = 'accent', variant, blocks = 12, className }: TargetProgressProps) {
  const look = useLook();
  const shape: TargetProgressVariant = variant ?? (BLOCK_LOOKS.includes(look) ? 'blocks' : look === 'blueprint' ? 'scale' : 'bar');
  const end = max ?? target * 1.25;
  const at = scalePosition(value, end);
  const targetAt = scalePosition(target, end);
  const share = shareOfTarget(value, target);
  const filled = filledBlocks(value, end, blocks);
  const targetBlock = filledBlocks(target, end, blocks);

  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={end}
      aria-valuenow={value}
      aria-valuetext={`${formatNumber(value, decimals)}${unit ? ` ${unit}` : ''}, ${formatNumber(share)} % of target`}
      data-look={look}
      data-tone={tone}
      data-variant={shape}
      className={cx('min-w-0 text-(--kit-text)', className)}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-lg leading-6 font-semibold tabular-nums">
          {formatNumber(value, decimals)}
          {unit ? <span className="ml-1 text-sm font-medium text-(--kit-text-2)">{unit}</span> : null}
        </span>
      </div>

      {shape === 'bar' ? (
        <div aria-hidden="true" className="relative mt-2 h-2.5 rounded-full bg-(--kit-track)">
          <span className="absolute inset-y-0 left-0 rounded-full bg-(--t-solid)" style={{ width: `${at}%` }} />
          <span className="absolute -inset-y-1 w-0.5 rounded-full bg-(--kit-text)" style={{ left: `${targetAt}%` }} />
        </div>
      ) : null}

      {shape === 'blocks' ? (
        <div aria-hidden="true" className="mt-2 flex gap-1">
          {Array.from({ length: blocks }, (_, index) => (
            <span
              key={index}
              data-filled={index < filled ? '' : undefined}
              className={cx(
                'h-5 flex-1 border-(--kit-text)',
                index < filled ? 'bg-(--t-solid)' : 'bg-(--kit-track)',
                index === targetBlock - 1 ? 'border-r-2' : '',
              )}
            />
          ))}
        </div>
      ) : null}

      {shape === 'scale' ? (
        <div aria-hidden="true" className="relative mt-2 h-7">
          <span className="absolute inset-x-0 bottom-2 h-px bg-(--kit-text)" />
          {TICKS.map((tick) => (
            <span key={tick} className={cx('absolute bottom-2 w-px bg-(--kit-text)', tick % 50 === 0 ? 'h-3' : 'h-1.5')} style={{ left: `${tick}%` }} />
          ))}
          <span className="absolute bottom-2 h-1 bg-(--t-solid)" style={{ left: 0, width: `${at}%` }} />
          <span className="absolute bottom-0 h-7 w-0.5 bg-(--t-solid)" style={{ left: `${at}%` }} />
          <span className="absolute bottom-0 h-7 border-l border-dashed border-(--kit-text)" style={{ left: `${targetAt}%` }} />
        </div>
      ) : null}

      <div className="mt-2 flex items-baseline justify-between gap-3 text-xs text-(--kit-text-2)">
        <span className="font-medium text-(--t-ink) tabular-nums">{formatNumber(share)} % of target</span>
        <span className="tabular-nums">
          Target {formatNumber(target, decimals)}
          {unit ? ` ${unit}` : ''}
        </span>
      </div>
    </div>
  );
}
