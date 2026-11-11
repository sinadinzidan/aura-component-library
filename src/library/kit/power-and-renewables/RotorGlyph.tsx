import { cx } from '../tones';

type RotorGlyphProps = {
  /** Height in px; the width follows. */
  size?: number;
  /** Where the first blade points, in degrees clockwise from straight up. */
  angle?: number;
  /** Feathered blades are drawn thin: the turbine is not taking wind. */
  feathered?: boolean;
  className?: string;
};

const BLADE = 'M 0 0 C 2.6 -6 2.4 -15 0.4 -22 L -0.4 -22 C -1.6 -15 -1.8 -6 0 0 Z';

/** A wind turbine in three blades and a tower, drawn in the current text colour. Decorative. */
export function RotorGlyph({ size = 56, angle = 12, feathered = false, className }: RotorGlyphProps) {
  return (
    <svg aria-hidden="true" data-feathered={feathered || undefined} viewBox="0 0 48 56" width={(size * 48) / 56} height={size} className={cx('shrink-0', className)}>
      <path d="M 22.6 54 L 23.4 24 L 24.6 24 L 25.4 54 Z" fill="currentColor" opacity={0.55} />
      <g transform={`translate(24 24) rotate(${angle})`} fill="currentColor">
        {[0, 120, 240].map((turn) => (
          <path key={turn} d={BLADE} transform={`rotate(${turn}) scale(${feathered ? 0.45 : 1} 1)`} />
        ))}
      </g>
      <circle cx={24} cy={24} r={2.6} fill="currentColor" />
    </svg>
  );
}
