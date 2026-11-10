import { cn } from '../../../lib/utils';

import { NEON_FILL, NEON_SVG_GLOW, NEON_TONE } from './neon';
import type { NeonTone } from './neon';
import { DIGIT_HEIGHT, SEGMENT_IDS, layoutNumerals, segmentPoints } from './segments';

export type SegmentNumeralsSize = 'sm' | 'md' | 'lg';

export type SegmentNumeralsProps = {
  /** Digits with optional minus, point, colon and thousands commas: "14:00", "96.4", "−12". */
  value: string;
  /** What the figure is. Read out with the value and unit. */
  label: string;
  unit?: string;
  tone?: NeonTone;
  size?: SegmentNumeralsSize;
  /** Show the unlit segments faintly, like a real display. */
  ghost?: boolean;
  className?: string;
};

const HEIGHT: Record<SegmentNumeralsSize, string> = { sm: 'h-4', md: 'h-6', lg: 'h-9' };
const UNIT_SIZE: Record<SegmentNumeralsSize, string> = { sm: 'text-xs', md: 'text-xs', lg: 'text-sm' };
/** Room for the slant on the right. */
const SLANT_ROOM = 2;

/**
 * A figure drawn as seven-segment numerals: lit segments glow, unlit ones stay faintly visible.
 * It is a picture of a number, so it carries the real value in its accessible name. Use it for
 * the few headline figures on a futuristic screen; ordinary readouts stay as text.
 */
export function SegmentNumerals({ value, label, unit, tone = 'accent', size = 'md', ghost = true, className }: SegmentNumeralsProps) {
  const { glyphs, width } = layoutNumerals(value);

  return (
    <span
      data-slot="segment-numerals"
      role="img"
      aria-label={`${label}: ${value}${unit ? ` ${unit}` : ''}`}
      className={cn(NEON_TONE[tone], 'inline-flex shrink-0 items-end gap-1.5 whitespace-nowrap', className)}
    >
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${width + SLANT_ROOM} ${DIGIT_HEIGHT}`}
        className={cn('block w-auto shrink-0 overflow-visible', HEIGHT[size], NEON_FILL)}
      >
        <g transform={`translate(${SLANT_ROOM} 0) skewX(-6)`}>
          {glyphs.map((glyph, index) => {
            if (glyph.kind !== 'digit') {
              return (
                <g key={index} data-slot={glyph.kind} className={NEON_SVG_GLOW}>
                  {glyph.kind === 'colon' ? (
                    <>
                      <rect x={glyph.x + 0.9} y={5.4} width={2.2} height={2.2} />
                      <rect x={glyph.x + 0.9} y={12.4} width={2.2} height={2.2} />
                    </>
                  ) : (
                    <rect x={glyph.x + 0.9} y={DIGIT_HEIGHT - 2.4} width={2.2} height={2.2} />
                  )}
                </g>
              );
            }
            return (
              <g key={index} transform={`translate(${glyph.x} 0)`}>
                {SEGMENT_IDS.map((id) => {
                  const lit = glyph.lit.includes(id);
                  if (!lit && !ghost) return null;
                  return (
                    <polygon
                      key={id}
                      data-segment={id}
                      data-lit={lit ? 'true' : 'false'}
                      points={segmentPoints(id)}
                      className={lit ? NEON_SVG_GLOW : 'opacity-15'}
                    />
                  );
                })}
              </g>
            );
          })}
        </g>
      </svg>
      {unit ? (
        <span aria-hidden="true" className={cn('leading-none text-muted-foreground', UNIT_SIZE[size])}>
          {unit}
        </span>
      ) : null}
    </span>
  );
}
