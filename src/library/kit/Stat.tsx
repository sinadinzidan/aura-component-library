import type { ReactNode } from 'react';

import { useLook } from '../looks/useLook';

import { Delta, type DeltaProps } from './Delta';
import { SparkLine } from './SparkLine';
import { cx, formatNumber, type Tone } from './tones';

type StatProps = {
  label: string;
  /** A number is formatted with `decimals`; a string is shown as given. */
  value: number | string;
  unit?: string;
  decimals?: number;
  /** Change against a reference, with the words that say which one ("vs last week"). */
  delta?: DeltaProps & { caption?: string };
  /** The figure this one is measured against, written out: "Target 97.5 %". */
  target?: string;
  /** Icon element; the stat wraps it in a chip the look styles. */
  icon?: ReactNode;
  /** Recent values for a word-sized trend. */
  sparkline?: readonly number[];
  /** The judgement in a word — "On target", "Watch", "Critical". Signal makes it the headline. */
  state?: string;
  /** Icon shown with the state word. */
  stateIcon?: ReactNode;
  tone?: Tone;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  /** `tile` draws its own surface; `plain` sits inside a panel or a `StatGroup`. */
  variant?: 'tile' | 'plain';
  /** `strong` fills a studio tile with its tone, for the one figure that leads the screen. */
  emphasis?: 'default' | 'strong';
  /** Layout classes: the grid span. */
  className?: string;
};

/**
 * One figure with everything needed to read it: label, unit, change, target and recent trend.
 * The look decides the anatomy — an icon chip and sparkline in studio, a solid colour block in
 * poster, a state word in signal, a dimension line on a blueprint.
 */
export function Stat({
  label,
  value,
  unit,
  decimals = 0,
  delta,
  target,
  icon,
  sparkline,
  state,
  stateIcon,
  tone = 'neutral',
  size = 'md',
  variant = 'tile',
  emphasis = 'default',
  className,
}: StatProps) {
  const look = useLook();
  const shown = typeof value === 'number' ? formatNumber(value, decimals) : value;
  const { caption, ...deltaProps } = delta ?? { value: 0 };

  return (
    <div
      role="group"
      aria-label={label}
      data-look={look}
      data-tone={tone}
      data-size={size}
      data-variant={variant}
      data-emphasis={emphasis}
      data-state={state ? '' : undefined}
      className={cx('kit-stat', className)}
    >
      <div className="kit-stat-head">
        {icon ? (
          <span aria-hidden="true" data-look={look} data-tone={tone === 'neutral' ? 'accent' : tone} data-size="sm" className="kit-chip kit-stat-chip">
            {icon}
          </span>
        ) : null}
        <span className="kit-stat-label">{label}</span>
      </div>
      {state ? (
        <div className="kit-stat-state">
          {stateIcon}
          <span>{state}</span>
        </div>
      ) : null}
      <div className="kit-stat-figure">
        <span className="kit-stat-value">{shown}</span>
        {unit ? <span className="kit-stat-unit">{unit}</span> : null}
      </div>
      {delta || target ? (
        <div className="kit-stat-meta">
          {delta ? <Delta {...deltaProps} /> : null}
          {caption ? <span>{caption}</span> : null}
          {target ? <span className="kit-stat-target">{target}</span> : null}
        </div>
      ) : null}
      {sparkline ? (
        <div className="kit-stat-spark">
          <SparkLine values={sparkline} label={`${label} trend`} tone={tone === 'neutral' ? 'accent' : tone} />
        </div>
      ) : null}
    </div>
  );
}
