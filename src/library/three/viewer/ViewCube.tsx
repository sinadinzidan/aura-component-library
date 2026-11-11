import { cn } from '../../../lib/utils';

import { CUBE_FACES, cubeTransform } from './viewCube';
import type { CubeFaceId, ViewAngles } from './viewCube';

export type ViewCubeProps = {
  /** Where the camera is, so the cube shows the model's orientation as the camera sees it. */
  angles: ViewAngles;
  /** The face the camera looks at squarely, highlighted. */
  active?: CubeFaceId | null;
  /** Called with the face a user chose. The bottom face is never chosen: the camera cannot go below ground. */
  onFace?: (face: CubeFaceId) => void;
  className?: string;
};

const HALF = '2rem';

const FACE_TRANSFORM: Record<CubeFaceId, string> = {
  front: `translateZ(${HALF})`,
  back: `rotateY(180deg) translateZ(${HALF})`,
  right: `rotateY(90deg) translateZ(${HALF})`,
  left: `rotateY(-90deg) translateZ(${HALF})`,
  top: `rotateX(90deg) translateZ(${HALF})`,
  bottom: `rotateX(-90deg) translateZ(${HALF})`,
};

/**
 * An orientation gizmo: a small cube that turns with the camera. Each face is a button that sets
 * the camera to look at the model from that side; the face the camera already looks at is outlined.
 * Pure DOM and CSS 3D, so it works on any viewer and needs no extra canvas.
 */
export function ViewCube({ angles, active = null, onFace, className }: ViewCubeProps) {
  return (
    <div role="group" aria-label="View cube" data-slot="view-cube" className={cn('size-16 [perspective:260px]', className)}>
      <div className="relative size-full [transform-style:preserve-3d]" style={{ transform: cubeTransform(angles) }}>
        {CUBE_FACES.map((face) => {
          const available = face.reachable && onFace !== undefined;
          return (
            <button
              key={face.id}
              type="button"
              disabled={!available}
              aria-label={face.reachable ? `View from the ${face.label.toLowerCase()}` : 'View from below, not available'}
              aria-pressed={active === face.id}
              onClick={() => onFace?.(face.id)}
              data-face={face.id}
              className={cn(
                'absolute inset-0 flex items-center justify-center border text-xs font-medium [backface-visibility:hidden]',
                'bg-[color-mix(in_oklab,var(--card-background)_90%,transparent)] text-base-foreground',
                active === face.id ? 'border-2 border-[var(--primary-background)]' : 'border-default',
                available ? 'cursor-pointer hover:bg-secondary-background focus-visible:outline-2 focus-visible:outline-[var(--ring-default)]' : 'cursor-not-allowed text-muted-foreground'
              )}
              style={{ transform: FACE_TRANSFORM[face.id] }}
            >
              {face.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
