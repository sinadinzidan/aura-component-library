import { useLook } from '../../looks/useLook';
import { TagId } from '../TagId';
import { cx, formatNumber } from '../tones';

import { fillPercent, tankVerdict, ullage } from './stock';

type TankGaugeProps = {
  tag: string;
  /** What is stored: "Stabilised condensate". */
  product: string;
  volume: number;
  capacity: number;
  unit?: string;
  /** Low and high level limits, in percent of capacity. */
  low?: number;
  high?: number;
  /** A tank taken out of service shows no level and is not judged. */
  outOfService?: boolean;
  /** Height of the vessel: `lg` when the tank is the subject of its panel. */
  size?: 'md' | 'lg';
  selected?: boolean;
  onSelect?: () => void;
  className?: string;
};

const SQUARE_LOOKS = ['console', 'poster', 'blueprint', 'signal'];

/**
 * A storage tank drawn as a vessel that fills from the bottom, with its high and low limits
 * marked on the wall and the level written inside. Below it: product, tag, volume and the room
 * left. The vessel is rounded by default, square in the block-built looks and outline-only with a
 * hatched fill on a blueprint.
 */
export function TankGauge({ tag, product, volume, capacity, unit = 'm³', low = 15, high = 85, outOfService = false, size = 'md', selected = false, onSelect, className }: TankGaugeProps) {
  const look = useLook();
  const percent = fillPercent(volume, capacity);
  const verdict = outOfService ? { tone: 'neutral' as const, word: 'Out of service' } : tankVerdict(percent, low, high);
  const square = SQUARE_LOOKS.includes(look);
  const outline = look === 'blueprint';
  const body = (
    <>
      <div
        role="meter"
        aria-label={`${product}, ${tag}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={outOfService ? 0 : Math.round(percent)}
        aria-valuetext={outOfService ? 'Out of service' : `${Math.round(percent)} % full, ${verdict.word.toLowerCase()}`}
        className={cx(
          'relative w-full overflow-hidden border-2 bg-(--kit-well)',
          size === 'lg' ? 'h-52' : 'h-36',
          square ? '' : 'rounded-t-[2rem] rounded-b-xl',
          selected ? 'border-(--kit-accent)' : 'border-(--kit-rule-strong)',
        )}
      >
        {outOfService ? null : (
          <span
            aria-hidden="true"
            className={cx('absolute inset-x-0 bottom-0', outline ? 'border-t-2 border-(--t-solid) bg-(--t-soft)' : 'bg-(--t-solid)')}
            style={{ height: `${percent}%` }}
          />
        )}
        <span aria-hidden="true" className="absolute inset-x-0 border-t border-dashed border-(--kit-text)" style={{ bottom: `${high}%` }} />
        <span aria-hidden="true" className="absolute inset-x-0 border-t border-dashed border-(--kit-text)" style={{ bottom: `${low}%` }} />
        <span className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cx('bg-(--kit-surface) px-2 py-0.5 leading-none font-semibold text-(--kit-text) tabular-nums', square ? '' : 'rounded-(--kit-radius-sm)', size === 'lg' ? 'text-3xl' : 'text-xl')}>
            {outOfService ? '—' : `${Math.round(percent)} %`}
          </span>
        </span>
      </div>
      <div className="mt-3 flex min-w-0 flex-col gap-0.5 text-left">
        <span className="text-sm leading-5 font-medium text-(--kit-text)">{product}</span>
        <TagId>{tag}</TagId>
        <span className="text-xs leading-5 text-(--kit-text-2) tabular-nums">
          {outOfService ? `Capacity ${formatNumber(capacity)} ${unit}` : `${formatNumber(volume)} of ${formatNumber(capacity)} ${unit}`}
        </span>
        {outOfService ? null : <span className="text-xs leading-5 text-(--kit-text-2) tabular-nums">Room for {formatNumber(ullage(volume, capacity))} {unit}</span>}
        <span className="text-xs leading-5 font-semibold text-(--t-ink)">{verdict.word}</span>
      </div>
    </>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        data-look={look}
        data-tone={verdict.tone}
        className={cx('flex min-w-0 flex-col items-stretch justify-start text-left outline-none focus-visible:ring-2 focus-visible:ring-(--kit-accent) focus-visible:ring-offset-2', className)}
      >
        {body}
      </button>
    );
  }
  return (
    <div data-look={look} data-tone={verdict.tone} className={cx('min-w-0', className)}>
      {body}
    </div>
  );
}
