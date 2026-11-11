import { useLook } from '../../looks/useLook';
import { cx } from '../tones';
import type { StatusTone, Tone } from '../tones';

import { levelPercent } from './levelPercent';

type LevelBlockProps = {
  /** What is being filled, for example a tank tag: "TA-204". */
  label: string;
  /** A second line: the product, the owner. */
  caption?: string;
  /** Fill, 0–1. */
  fill: number;
  /** Category colour of the contents — a decorative family, never a status. */
  tone?: Tone;
  /** A level that needs attention, as a tone and a word: "High", "Low". Leave out for normal. */
  state?: { tone: StatusTone; word: string };
  selected?: boolean;
  /** Makes the block a toggle button. */
  onSelect?: () => void;
  size?: 'md' | 'lg';
  className?: string;
};

function Face({ label, caption, percent, state, size, flooded }: { label: string; caption?: string; percent: number; state?: { tone: StatusTone; word: string }; size: 'md' | 'lg'; flooded: boolean }) {
  return (
    <span className={cx('flex h-full w-full flex-col justify-between text-left', size === 'lg' ? 'p-4' : 'px-3 py-2.5')}>
      <span className="flex items-start justify-between gap-2">
        <span className={cx('font-bold leading-tight tabular-nums', size === 'lg' ? 'text-lg' : 'text-sm')}>{label}</span>
        {state ? (
          <span data-tone={state.tone} className={cx('shrink-0 border-2 px-1.5 text-xs font-bold leading-5', flooded ? 'border-current bg-[var(--t-solid)] text-[var(--t-on-solid)]' : 'border-transparent bg-[var(--t-solid)] text-[var(--t-on-solid)]')}>
            {state.word}
          </span>
        ) : null}
      </span>
      <span className="flex items-baseline gap-1">
        <span className={cx('font-extrabold leading-none tabular-nums tracking-tighter', size === 'lg' ? 'text-7xl' : 'text-[2.5rem]')}>{percent}</span>
        <span className={cx('font-bold', size === 'lg' ? 'text-2xl' : 'text-base')}>%</span>
      </span>
      {caption ? <span className={cx('font-semibold leading-tight', size === 'lg' ? 'text-base' : 'text-xs')}>{caption}</span> : null}
    </span>
  );
}

/**
 * A level as a solid block of colour that rises from the bottom, with the percentage set large
 * across it: dark on the empty part, inverted on the filled part. Use a row or a mosaic of them
 * for tanks, silos or batteries, where the fill is the message and the colour says what is inside.
 * A level that needs attention carries a word in a status flag, never colour alone.
 */
export function LevelBlock({ label, caption, fill, tone = 'accent', state, selected = false, onSelect, size = 'md', className }: LevelBlockProps) {
  const look = useLook();
  const percent = levelPercent(fill);
  const name = `${label}${caption ? `, ${caption}` : ''}, ${percent} percent full${state ? `, ${state.word.toLowerCase()}` : ''}`;
  const frame = cx(
    'relative block min-w-0 overflow-hidden border-2 border-[var(--kit-rule-strong)] bg-[var(--kit-surface)] text-[var(--kit-text)] [border-radius:var(--kit-radius-sm)]',
    'motion-safe:transition-[translate,box-shadow] motion-safe:duration-150',
    selected ? '-translate-x-[3px] -translate-y-[3px] shadow-[6px_6px_0_var(--kit-rule-strong)]' : onSelect ? 'hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_var(--kit-rule-strong)]' : '',
    onSelect && 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring-default)]',
    className
  );
  const body = (
    <>
      <span className="absolute inset-0">
        <Face label={label} caption={caption} percent={percent} state={state} size={size} flooded={false} />
      </span>
      <span
        aria-hidden="true"
        data-slot="level-fill"
        className="absolute inset-0 bg-[var(--t-pop)] text-[var(--t-on-pop)] motion-safe:transition-[clip-path] motion-safe:duration-300"
        style={{ clipPath: `inset(${100 - percent}% 0 0 0)` }}
      >
        <Face label={label} caption={caption} percent={percent} state={state} size={size} flooded />
      </span>
    </>
  );

  return onSelect ? (
    <button type="button" data-look={look} data-tone={tone} aria-pressed={selected} aria-label={name} onClick={onSelect} className={frame}>
      {body}
    </button>
  ) : (
    <div role="img" data-look={look} data-tone={tone} aria-label={name} className={frame}>
      {body}
    </div>
  );
}
