import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx, formatNumber, type Tone } from '../tones';

type BigFigureProps = {
  label: string;
  /** A number is formatted with `decimals`; `null` means the signal is lost. */
  value: number | null;
  unit?: string;
  decimals?: number;
  /** The judgement in a word: "On plan", "Behind", "Stopped". */
  state: string;
  /** Icon shown with the state word. */
  stateIcon?: ReactNode;
  tone?: Tone;
  /** What the figure is measured against, in words: "Plan 4.50". */
  reference?: string;
  /** Progress towards the reference, 0–1, drawn as a bar along the bottom. */
  progress?: number;
  /** `xl` is the single hero of a screen, read from fifteen metres. */
  size?: 'lg' | 'xl';
  className?: string;
};

const FIGURE_SIZE = { lg: '4.5rem', xl: '7.5rem' } as const;

/**
 * One figure for a wall: a numeral large enough to read across a room, its unit, and the state as
 * a word with an icon. Status-first looks fill the whole tile with the state; the others keep the
 * surface calm and colour the state line and the progress bar.
 */
export function BigFigure({ label, value, unit, decimals = 0, state, stateIcon, tone = 'neutral', reference, progress, size = 'lg', className }: BigFigureProps) {
  const look = useLook();
  const filled = look === 'signal' || look === 'poster';
  const square = look === 'console' || look === 'poster' || look === 'blueprint';
  const lost = value === null;

  return (
    <div
      role="group"
      aria-label={label}
      data-look={look}
      data-tone={tone}
      data-filled={filled}
      className={cx(
        'relative flex min-w-0 flex-col justify-between gap-4 overflow-hidden p-6',
        square ? '' : 'rounded-(--kit-radius)',
        filled ? (look === 'poster' ? 'bg-(--t-pop) text-(--t-on-pop)' : 'bg-(--t-solid) text-(--t-on-solid)') : 'bg-(--kit-panel-bg) text-(--kit-text)',
        className
      )}
      style={{ border: 'var(--kit-panel-border)', boxShadow: filled ? undefined : 'var(--kit-panel-shadow)' }}
    >
      <div className="flex items-start justify-between gap-4">
        <span className={cx('font-semibold', size === 'xl' ? 'text-2xl leading-8' : 'text-lg leading-6')}>{label}</span>
        <span className={cx('flex shrink-0 items-center gap-2 font-semibold whitespace-nowrap [&>svg]:size-[1.2em]', size === 'xl' ? 'text-2xl leading-8' : 'text-lg leading-6', filled ? '' : 'text-(--t-ink)')}>
          {stateIcon}
          {state}
        </span>
      </div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="tabular-nums" style={{ fontSize: FIGURE_SIZE[size], lineHeight: 0.95, fontWeight: 'var(--kit-figure-weight)', letterSpacing: '-0.035em' }}>
          {lost ? '—' : formatNumber(value, decimals)}
        </span>
        {unit && !lost ? <span className={cx('font-medium', size === 'xl' ? 'text-3xl' : 'text-xl', filled ? '' : 'text-(--kit-text-2)')}>{unit}</span> : null}
      </div>
      {reference ? <span className={cx('font-medium', size === 'xl' ? 'text-xl' : 'text-base', filled ? '' : 'text-(--kit-text-2)')}>{reference}</span> : null}
      {progress !== undefined ? (
        <div role="progressbar" aria-label={`${label} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} className="absolute right-0 bottom-0 left-0 h-2 bg-(--kit-track)">
          <span className="block h-full" style={{ width: `${Math.min(1, Math.max(0, progress)) * 100}%`, background: filled ? 'currentColor' : 'var(--t-line)' }} />
        </div>
      ) : null}
    </div>
  );
}
