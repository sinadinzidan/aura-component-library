import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useState } from 'react';
import { Vector3 } from 'three';

import { cn } from '../../lib/utils';
import { TONE_BORDER, TONE_TEXT } from '../industrial/status';
import type { DotShape } from '../industrial/status';
import { StatusDot } from '../industrial/StatusDot';

import { toTuple } from './cameraTargets';
import type { Vec3 } from './cameraTargets';
import type { SceneTone } from './scenePalette';

export type SceneLabelProps = {
  /** Anchor point in the scene. The label sits above it on a short stem. */
  position: Vec3;
  /** Tag or short code, set in monospace. */
  tag: string;
  /** Plain-language name after the tag. */
  name?: string;
  /** A reading or status text, e.g. "48.6 barg" or "Tripped". */
  value?: string;
  /** Colours the status dot and the value. Always paired with `value` text, never colour alone. */
  tone?: SceneTone;
  shape?: DotShape;
  /** Accent border, for the label of the selected item. */
  selected?: boolean;
  /** Quieter rendering for labels outside the area in focus. */
  dimmed?: boolean;
  /** Hide the label when the camera is further away than this, so labels do not pile up. */
  maxDistance?: number;
  /** Hide the label when the camera is closer than this, e.g. area labels once inside the area. */
  minDistance?: number;
  /** Makes the label a button. Pointer only: provide the same action as a real button outside the canvas. */
  onClick?: () => void;
};

/**
 * A DOM label pinned to a point in the scene: tag in monospace, optional name, value and status.
 * It is ordinary HTML styled with tokens, so it stays crisp at any zoom and follows the theme.
 * Hidden from assistive technology — the canvas is one image; list the same items beside it.
 */
export function SceneLabel({ position, tag, name, value, tone, shape = 'dot', selected = false, dimmed = false, maxDistance, minDistance, onClick }: SceneLabelProps) {
  const [inRange, setInRange] = useState(true);
  const anchor = useMemo(() => new Vector3(position[0], position[1], position[2]), [position]);

  useFrame(({ camera }) => {
    if (maxDistance === undefined && minDistance === undefined) return;
    const distance = camera.position.distanceTo(anchor);
    const next = (maxDistance === undefined || distance <= maxDistance) && (minDistance === undefined || distance >= minDistance);
    if (next !== inRange) setInRange(next);
  });

  if (!inRange) return null;

  const body = (
    <>
      {tone ? <StatusDot tone={tone} shape={shape} size="sm" /> : null}
      <span className="font-mono font-medium text-base-foreground">{tag}</span>
      {name ? <span className="text-muted-foreground">{name}</span> : null}
      {value ? <span className={cn('tabular-nums', tone ? TONE_TEXT[tone] : 'text-medium-foreground')}>{value}</span> : null}
    </>
  );
  const pill = cn(
    'flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-1 text-xs leading-none backdrop-blur-sm',
    'bg-[color-mix(in_oklab,var(--card-background)_82%,transparent)]',
    selected ? 'border-[var(--primary-background)]' : tone && tone !== 'neutral' ? TONE_BORDER[tone] : 'border-default',
    dimmed && 'opacity-50'
  );

  return (
    <Html position={toTuple(position)} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
      <div data-slot="scene-label" aria-hidden="true" className="flex -translate-y-1/2 flex-col items-center pb-6 font-sans">
        {onClick ? (
          <button type="button" tabIndex={-1} onClick={onClick} className={cn(pill, 'pointer-events-auto cursor-pointer hover:border-emphasized')}>
            {body}
          </button>
        ) : (
          <div className={pill}>{body}</div>
        )}
        <span className={cn('h-4 w-px', selected ? 'bg-[var(--primary-background)]' : 'bg-emphasized')} />
      </div>
    </Html>
  );
}
