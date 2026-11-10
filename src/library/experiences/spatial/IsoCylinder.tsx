import { cn } from '../../../lib/utils';
import { clamp } from '../../industrial/geometry';

import { DEFAULT_ISO_VIEW, cylinderShape } from './isoProjection';
import type { IsoCylinderSpec, IsoView } from './isoProjection';
import { ISO_FACE_GHOST, ISO_FACE_LEFT, ISO_FACE_TOP, ISO_GLOW, ISO_TONE, isoEdgeClass } from './isoStyle';
import type { IsoTone, IsoVariant } from './isoStyle';

export type IsoCylinderProps = IsoCylinderSpec & {
  view?: IsoView;
  tone?: IsoTone;
  variant?: IsoVariant;
  outlined?: boolean;
  /**
   * Fill level, 0–1, for a vertical cylinder. The shell turns translucent and the contents are
   * drawn inside it up to this share of the height.
   */
  level?: number;
  /** Colour of the contents. */
  contentTone?: IsoTone;
  className?: string;
};

/**
 * A cylinder in isometric projection, standing (`axis="z"`) or lying along x or y. It is an SVG
 * fragment. Pick it for tanks, vessels, columns, stacks and motors; give a standing one a
 * `level` to show how full it is through a translucent shell.
 */
export function IsoCylinder({
  x,
  y,
  z,
  radius,
  length,
  axis = 'z',
  view = DEFAULT_ISO_VIEW,
  tone = 'neutral',
  variant = 'solid',
  outlined = false,
  level,
  contentTone = 'liquid',
  className,
}: IsoCylinderProps) {
  const shell = cylinderShape({ x, y, z, radius, length, axis }, view);
  const ghost = variant === 'ghost';
  const hasLevel = level !== undefined && axis === 'z';
  const share = hasLevel ? clamp(level, 0, 1) : 0;
  const content = hasLevel && share > 0 ? cylinderShape({ x, y, z, radius: radius * 0.94, length: length * share, axis }, view) : undefined;
  const see = ghost || hasLevel;

  return (
    <g
      data-slot="iso-cylinder"
      data-axis={axis}
      data-variant={variant}
      data-outlined={outlined}
      strokeWidth={outlined ? 1.75 : 1}
      strokeLinejoin="round"
      strokeDasharray={ghost && !outlined ? '3 3' : undefined}
      className={cn(ISO_TONE[tone], isoEdgeClass(variant, outlined), outlined && ISO_GLOW, className)}
    >
      <polygon data-part="far-cap" points={shell.farCap} className={see ? ISO_FACE_GHOST : ISO_FACE_LEFT} />
      <polygon data-part="body" points={shell.body} className={see ? ISO_FACE_GHOST : ISO_FACE_LEFT} />
      {content ? (
        <g data-slot="iso-cylinder-content" data-level={share} className={cn(ISO_TONE[contentTone], 'stroke-[color-mix(in_oklab,var(--iso)_80%,var(--base-foreground))]')} strokeDasharray="none">
          <polygon points={content.farCap} className="fill-[color-mix(in_oklab,var(--iso)_55%,var(--card-background))]" />
          <polygon points={content.body} className="fill-[color-mix(in_oklab,var(--iso)_55%,var(--card-background))]" />
          <polygon points={content.nearCap} className="fill-[color-mix(in_oklab,var(--iso)_78%,var(--card-background))]" />
        </g>
      ) : null}
      <polygon data-part="near-cap" points={shell.nearCap} className={see ? ISO_FACE_GHOST : ISO_FACE_TOP} />
    </g>
  );
}
