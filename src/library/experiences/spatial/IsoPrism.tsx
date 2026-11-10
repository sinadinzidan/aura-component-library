import { cn } from '../../../lib/utils';

import { DEFAULT_ISO_VIEW, prismFaces } from './isoProjection';
import type { IsoBox, IsoView } from './isoProjection';
import { ISO_FACE_GHOST, ISO_FACE_LEFT, ISO_FACE_RIGHT, ISO_FACE_TOP, ISO_GLOW, ISO_TONE, isoEdgeClass } from './isoStyle';
import type { IsoTone, IsoVariant } from './isoStyle';

export type IsoPrismProps = {
  /** World box: position of the lowest corner and size along x, y and z. */
  box: IsoBox;
  view?: IsoView;
  tone?: IsoTone;
  variant?: IsoVariant;
  /** Accent outline and glow, for a hovered or selected unit. */
  outlined?: boolean;
  className?: string;
};

/**
 * A box in isometric projection: three faces shaded from one colour. It is an SVG fragment.
 * Pick it for buildings, skids, decks, pipe runs and anything else that is roughly a block;
 * draw boxes back to front (`sortBackToFront`) so nearer ones cover the ones behind.
 */
export function IsoPrism({ box, view = DEFAULT_ISO_VIEW, tone = 'neutral', variant = 'solid', outlined = false, className }: IsoPrismProps) {
  const faces = prismFaces(box, view);
  const ghost = variant === 'ghost';
  const edge = isoEdgeClass(variant, outlined);

  return (
    <g
      data-slot="iso-prism"
      data-variant={variant}
      data-outlined={outlined}
      strokeWidth={outlined ? 1.75 : 1}
      strokeLinejoin="round"
      strokeDasharray={ghost && !outlined ? '3 3' : undefined}
      className={cn(ISO_TONE[tone], edge, outlined && ISO_GLOW, className)}
    >
      <polygon data-face="left" points={faces.left} className={ghost ? ISO_FACE_GHOST : ISO_FACE_LEFT} />
      <polygon data-face="right" points={faces.right} className={ghost ? ISO_FACE_GHOST : ISO_FACE_RIGHT} />
      <polygon data-face="top" points={faces.top} className={ghost ? ISO_FACE_GHOST : ISO_FACE_TOP} />
    </g>
  );
}
