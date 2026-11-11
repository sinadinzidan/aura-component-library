import { useLook } from '../../looks/useLook';
import { cx, formatNumber, type Tone } from '../tones';

import { rangeShare } from './limits';

export type LevelMark = { value: number; label: string; tone?: Tone };

type LevelTankProps = {
  /** Name of the vessel; shown under it and used as the accessible name. */
  label: string;
  value: number;
  min?: number;
  max?: number;
  unit?: string;
  decimals?: number;
  /** Limit lines across the vessel, labelled at the side. */
  marks?: readonly LevelMark[];
  /** Colour of the liquid: the state of the level. */
  tone?: Tone;
  /** `drum` is a lying vessel, wider than tall. */
  shape?: 'column' | 'drum';
  /** Height of the vessel in px. */
  height?: number;
  /** A line under the name: the tag or the state. */
  caption?: string;
  className?: string;
};

/**
 * A vessel with its liquid level and limit lines: the picture an operator has of a separator or a
 * tank. Radius, wall and liquid treatment come from the look — hatched on a blueprint, a solid
 * block in poster, a glowing column in glass.
 */
export function LevelTank({ label, value, min = 0, max = 100, unit = '%', decimals = 0, marks = [], tone = 'accent', shape = 'column', height = 160, caption, className }: LevelTankProps) {
  const look = useLook();
  const share = rangeShare(value, min, max);
  const drum = shape === 'drum';
  const width = drum ? Math.round(height * 1.5) : Math.round(height * 0.5);
  const square = look === 'console' || look === 'poster' || look === 'blueprint';
  const radius = square ? (look === 'blueprint' ? 6 : 0) : drum ? height / 2 : Math.min(width / 2, 28);
  const hatched = look === 'blueprint' || look === 'editorial';
  const wall = look === 'poster' ? 2 : 1.5;
  const liquid = hatched
    ? 'repeating-linear-gradient(135deg, color-mix(in oklab, var(--t-line) 70%, transparent) 0 1.5px, color-mix(in oklab, var(--t-line) 10%, transparent) 1.5px 7px)'
    : look === 'poster' || look === 'console' || look === 'signal'
      ? 'var(--t-line)'
      : 'linear-gradient(to top, color-mix(in oklab, var(--t-line) 88%, transparent), color-mix(in oklab, var(--t-line) 52%, transparent))';

  return (
    <div data-look={look} data-tone={tone} data-shape={shape} className={cx('inline-flex min-w-0 flex-col items-center gap-2 text-(--kit-text)', className)}>
      <div className="flex items-stretch">
        <div
          role="meter"
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={`${formatNumber(value, decimals)}${unit ? ` ${unit}` : ''}`}
          className="relative shrink-0 overflow-hidden bg-(--kit-track)"
          style={{
            width,
            height,
            borderRadius: radius,
            border: `${wall}px solid var(--kit-rule-strong)`,
            boxShadow: look === 'glass' ? '0 0 18px -4px var(--t-line)' : undefined,
          }}
        >
          <span data-part="liquid" className="absolute inset-x-0 bottom-0" style={{ height: `${share * 100}%`, background: liquid, borderTop: '2px solid var(--t-line)' }} />
          {marks.map((mark) => (
            <span
              key={mark.label}
              data-tone={mark.tone ?? 'neutral'}
              className="absolute inset-x-0 border-t border-dashed"
              style={{ bottom: `${rangeShare(mark.value, min, max) * 100}%`, borderColor: 'var(--t-line)' }}
            />
          ))}
          <span className="absolute inset-0 flex items-center justify-center">
            <span
              className="bg-(--kit-halo) px-2 py-1 leading-none tabular-nums"
              style={{ fontSize: '1.125rem', borderRadius: 'var(--kit-radius-sm)', fontWeight: 'var(--kit-figure-weight)', border: '1px solid var(--kit-rule)' }}
            >
              {formatNumber(value, decimals)}
              {unit ? <span className="ml-0.5 text-xs font-medium text-(--kit-text-3)">{unit}</span> : null}
            </span>
          </span>
        </div>
        {marks.length > 0 ? (
          <div aria-hidden="true" className="relative w-16 shrink-0" style={{ height }}>
            {marks.map((mark) => (
              <span
                key={mark.label}
                data-tone={mark.tone ?? 'neutral'}
                className="absolute left-0 flex translate-y-1/2 items-center gap-1 text-xs leading-none font-medium whitespace-nowrap tabular-nums"
                style={{ bottom: `${rangeShare(mark.value, min, max) * 100}%`, color: 'var(--t-ink)' }}
              >
                <span className="w-2 border-t" style={{ borderColor: 'var(--t-line)' }} />
                {mark.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex flex-col items-center gap-0.5 text-center">
        <span className="text-sm font-medium text-(--kit-text-2)">{label}</span>
        {caption ? <span className="text-xs text-(--kit-text-3)">{caption}</span> : null}
      </div>
    </div>
  );
}
