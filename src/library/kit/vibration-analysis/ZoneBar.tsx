import { useLook } from '../../looks/useLook';
import { cx, formatNumber } from '../tones';

import { ISO_GROUP1_RIGID, ISO_ZONES, ISO_ZONE_TONE, ISO_ZONE_WORD, isoZone } from './signal';

type ZoneBarProps = {
  /** The measurement point: "Pump drive end, horizontal". */
  label: string;
  /** Overall velocity, mm/s RMS. */
  value: number;
  /** Zone boundaries A/B, B/C and C/D. */
  boundaries?: readonly [number, number, number];
  /** End of the scale. */
  max?: number;
  unit?: string;
  size?: 'md' | 'lg';
  className?: string;
};

/**
 * An overall vibration level on the four ISO 10816 zones. The zone the reading is in is filled,
 * the others stay tinted, and the letter and word are written out — colour is never the only cue.
 */
export function ZoneBar({ label, value, boundaries = ISO_GROUP1_RIGID, max = 11, unit = 'mm/s', size = 'md', className }: ZoneBarProps) {
  const look = useLook();
  const zone = isoZone(value, boundaries);
  const edges = [0, ...boundaries, max];
  const solid = look === 'poster' || look === 'signal';
  const square = look === 'console' || look === 'poster' || look === 'blueprint';

  return (
    <div data-look={look} data-zone={zone} className={cx('flex min-w-0 flex-col gap-2', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-(--kit-text)">{label}</span>
        <span className="tabular-nums text-(--kit-text)" style={{ fontSize: size === 'lg' ? '1.75rem' : '1.125rem', lineHeight: 1.1, fontWeight: 'var(--kit-figure-weight)', letterSpacing: 'var(--kit-figure-tracking)' }}>
          {formatNumber(value, 1)}
          <span className="ml-1 text-xs font-medium tracking-normal text-(--kit-text-3)">{unit}</span>
          <span data-tone={ISO_ZONE_TONE[zone]} className="ml-2 text-sm font-semibold tracking-normal text-(--t-ink)">
            {ISO_ZONE_WORD[zone]}
          </span>
        </span>
      </div>
      <div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-valuetext={`${formatNumber(value, 1)} ${unit}, zone ${zone}, ${ISO_ZONE_WORD[zone]}`} className="relative pt-2.5">
        <div className={cx('flex gap-0.5 overflow-hidden', square ? '' : 'rounded-(--kit-radius-sm)')}>
          {ISO_ZONES.map((letter, index) => {
            const active = letter === zone;
            return (
              <span
                key={letter}
                data-tone={ISO_ZONE_TONE[letter]}
                data-active={active}
                className={cx(
                  'flex items-center justify-center text-xs font-semibold',
                  size === 'lg' ? 'h-9' : 'h-7',
                  active || solid ? 'bg-(--t-solid) text-(--t-on-solid)' : 'bg-(--t-soft) text-(--t-on-soft)',
                  solid && !active ? 'opacity-45' : ''
                )}
                style={{ width: `${((edges[index + 1] - edges[index]) / max) * 100}%` }}
              >
                {letter}
              </span>
            );
          })}
        </div>
        <span aria-hidden="true" className="absolute top-0 size-0 -translate-x-1/2 [border-inline:6px_solid_transparent] [border-top:9px_solid_var(--kit-text)]" style={{ left: `${Math.min(100, (value / max) * 100)}%` }} />
      </div>
      <div aria-hidden="true" className="relative h-4 text-xs text-(--kit-text-3) tabular-nums">
        {edges.map((edge, index) => (
          <span key={edge} className={cx('absolute', index === 0 ? '' : index === edges.length - 1 ? '-translate-x-full' : '-translate-x-1/2')} style={{ left: `${(edge / max) * 100}%` }}>
            {formatNumber(edge, Number.isInteger(edge) ? 0 : 1)}
          </span>
        ))}
      </div>
    </div>
  );
}
