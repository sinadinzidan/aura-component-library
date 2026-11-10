import { cn } from '../../../lib/utils';
import { describeReading, formatLimit, formatValue, toneFromLimits, zonesFromLimits } from '../../industrial/status';
import type { Limits, Tone } from '../../industrial/status';

import { tapeBands, tapeBug, tapeTicks } from './tapeScale';

export type TapeIndicatorProps = {
  label: string;
  value: number;
  unit?: string;
  decimals?: number;
  /** Width of the visible window, in value units. */
  span: number;
  /** Distance between numbered ticks. */
  majorStep: number;
  minorPerMajor?: number;
  /** Ends of the scale. */
  min?: number;
  max?: number;
  /** Target value, drawn as a bug on the edge of the tape. */
  setpoint?: number;
  /** Operating limits; drawn as bands along the tape and used to judge the value. */
  limits?: Limits;
  orientation?: 'vertical' | 'horizontal';
  /** Long side of the drawing in user units. A longer tape shows the same window with more room per tick. */
  length?: number;
  /** Overrides the tone derived from the limits. */
  tone?: Tone;
  className?: string;
};

const TAPE_TONE: Record<Tone, string> = {
  neutral: '[--tape:var(--primary-background)]',
  success: '[--tape:var(--primary-background)]',
  info: '[--tape:var(--info-foreground-strong)]',
  warning: '[--tape:var(--warning-foreground-strong)]',
  critical: '[--tape:var(--critical-foreground-strong)]',
};

const BAND_FILL: Record<Tone, string> = {
  neutral: 'fill-[color-mix(in_oklab,var(--base-foreground)_28%,transparent)]',
  success: 'fill-success-foreground-strong',
  info: 'fill-info-foreground-strong',
  warning: 'fill-warning-foreground-strong',
  critical: 'fill-critical-foreground-strong',
};

const TONE_WORD: Record<Tone, string> = { neutral: '', success: '', info: 'Advisory', warning: 'Outside limits', critical: 'At trip limit' };

const BODY = 'fill-[color-mix(in_oklab,var(--base-foreground)_7%,transparent)] stroke-[color-mix(in_oklab,var(--base-foreground)_18%,transparent)]';
const TICK = 'stroke-[color-mix(in_oklab,var(--base-foreground)_70%,transparent)]';
const WINDOW = 'fill-card-background stroke-[color:var(--tape)]';
const BUG = 'fill-[color-mix(in_oklab,var(--tape)_35%,transparent)] stroke-[color:var(--tape)]';
const GLOW = '[filter:drop-shadow(0_0_6px_color-mix(in_oklab,var(--tape)_60%,transparent))]';

const SHORT = { vertical: 150, horizontal: 84 };

/**
 * A flight-display tape: the value sits in a fixed window and the scale slides under it, with
 * the setpoint as a bug on the edge and limit bands along the side. Pick it for the one process
 * variable an operator steers by, where the distance to setpoint and limits matters more than
 * the position in the full range.
 */
export function TapeIndicator({
  label,
  value,
  unit,
  decimals = 0,
  span,
  majorStep,
  minorPerMajor = 5,
  min,
  max,
  setpoint,
  limits,
  orientation = 'vertical',
  length,
  tone,
  className,
}: TapeIndicatorProps) {
  const vertical = orientation === 'vertical';
  const long = length ?? (vertical ? 320 : 420);
  const short = SHORT[orientation];
  const resolvedTone = tone ?? (limits ? toneFromLimits(value, limits) : 'neutral');
  const ticks = tapeTicks({ value, span, majorStep, minorPerMajor, min, max });
  const zones = limits ? zonesFromLimits(min ?? value - span, max ?? value + span, limits) : [];
  const bands = tapeBands(zones, value, span).filter((band) => band.tone !== 'neutral');
  const bug = setpoint === undefined ? undefined : tapeBug(setpoint, value, span);
  const at = (offset: number) => (vertical ? long / 2 - offset * long : long / 2 + offset * long);
  const mid = long / 2;
  const word = TONE_WORD[resolvedTone];
  const description = [
    describeReading(label, value, unit, decimals, resolvedTone),
    setpoint === undefined ? '' : `setpoint ${formatLimit(setpoint, decimals)}`,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <figure
      data-slot="tape-indicator"
      data-orientation={orientation}
      data-tone={resolvedTone}
      className={cn('m-0 flex min-h-0 min-w-0 gap-1', vertical ? 'h-full flex-col items-center' : 'w-full flex-col', TAPE_TONE[resolvedTone], className)}
    >
      <figcaption className="flex items-baseline gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-medium-foreground">{label}</span>
        {unit ? <span>{unit}</span> : null}
        {word ? <span className="font-medium text-[color:var(--tape)]">{word}</span> : null}
      </figcaption>
      <svg
        role="img"
        aria-label={description}
        viewBox={vertical ? `0 0 ${short} ${long}` : `0 0 ${long} ${short}`}
        className={cn('block overflow-hidden', vertical ? 'min-h-0 w-auto flex-1' : 'h-auto w-full')}
      >
        {vertical ? (
          <>
            <rect x={44} y={0.5} width={72} height={long - 1} strokeWidth={1} className={BODY} />
            {bands.map((band) => (
              <rect
                key={`${band.from}-${band.tone}`}
                data-slot="tape-band"
                data-tone={band.tone}
                x={118}
                y={at(band.to)}
                width={5}
                height={at(band.from) - at(band.to)}
                className={BAND_FILL[band.tone]}
              />
            ))}
            {ticks.map((tick) => (
              <g key={tick.value} data-slot="tape-tick" data-major={tick.major}>
                <line x1={tick.major ? 100 : 108} x2={116} y1={at(tick.offset)} y2={at(tick.offset)} strokeWidth={tick.major ? 1.5 : 1} className={TICK} />
                {tick.major ? (
                  <text x={94} y={at(tick.offset)} textAnchor="end" dominantBaseline="central" fontSize={13} className="fill-medium-foreground tabular-nums">
                    {formatLimit(tick.value, decimals)}
                  </text>
                ) : null}
              </g>
            ))}
            {bug ? (
              <path
                data-slot="tape-bug"
                data-pinned={bug.pinned ?? 'none'}
                d={`M 125 ${at(bug.offset)} l 9 -9 h 13 v 18 h -13 Z`}
                strokeWidth={1.5}
                strokeLinejoin="round"
                className={BUG}
              />
            ) : null}
            <path
              data-slot="tape-window"
              d={`M 4 ${mid - 20} H 106 V ${mid - 7} L 117 ${mid} L 106 ${mid + 7} V ${mid + 20} H 4 Z`}
              strokeWidth={1.5}
              strokeLinejoin="round"
              className={cn(WINDOW, GLOW)}
            />
            <text x={98} y={mid} textAnchor="end" dominantBaseline="central" fontSize={24} className="fill-base-foreground font-semibold tabular-nums">
              {formatValue(value, decimals)}
            </text>
          </>
        ) : (
          <>
            <rect x={0.5} y={30} width={long - 1} height={42} strokeWidth={1} className={BODY} />
            {bands.map((band) => (
              <rect
                key={`${band.from}-${band.tone}`}
                data-slot="tape-band"
                data-tone={band.tone}
                x={at(band.from)}
                y={23}
                width={at(band.to) - at(band.from)}
                height={5}
                className={BAND_FILL[band.tone]}
              />
            ))}
            {ticks.map((tick) => (
              <g key={tick.value} data-slot="tape-tick" data-major={tick.major}>
                <line y1={30} y2={tick.major ? 44 : 37} x1={at(tick.offset)} x2={at(tick.offset)} strokeWidth={tick.major ? 1.5 : 1} className={TICK} />
                {tick.major ? (
                  <text x={at(tick.offset)} y={59} textAnchor="middle" dominantBaseline="central" fontSize={13} className="fill-medium-foreground tabular-nums">
                    {formatLimit(tick.value, decimals)}
                  </text>
                ) : null}
              </g>
            ))}
            {bug ? (
              <path
                data-slot="tape-bug"
                data-pinned={bug.pinned ?? 'none'}
                d={`M ${at(bug.offset)} 22 l -9 -8 v -11 h 18 v 11 Z`}
                strokeWidth={1.5}
                strokeLinejoin="round"
                className={BUG}
              />
            ) : null}
            <path
              data-slot="tape-window"
              d={`M ${mid - 46} 82 V 44 H ${mid - 7} L ${mid} 33 L ${mid + 7} 44 H ${mid + 46} V 82 Z`}
              strokeWidth={1.5}
              strokeLinejoin="round"
              className={cn(WINDOW, GLOW)}
            />
            <text x={mid} y={63} textAnchor="middle" dominantBaseline="central" fontSize={22} className="fill-base-foreground font-semibold tabular-nums">
              {formatValue(value, decimals)}
            </text>
          </>
        )}
      </svg>
    </figure>
  );
}
