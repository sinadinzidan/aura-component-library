import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';
import { EquipmentSymbol } from '../diagrams/EquipmentSymbol';

import type { NormalPoint } from './annotations';
import { FRAME_HEIGHT, FRAME_WIDTH, findScene } from './frameScenes';

export type PrivacyMask = { x: number; y: number; w: number; h: number };

export type CameraFrameProps = {
  /** Scene id from `FRAME_SCENES`. */
  scene: string;
  /** Accessible name of the frame, e.g. "Compressor hall camera, 12 Mar 14:02". */
  label: string;
  /** Printed top-left over the frame, in monospace: the time stamp every real camera burns in. */
  timestamp?: string;
  /** Printed bottom-left: camera name or tag. */
  caption?: string;
  /** `night` is the infra-red look: the scene sinks and a quiet overlay is added. */
  mode?: 'day' | 'night';
  /** Zoom, and pan and tilt in degrees, as set by a PTZ control. */
  view?: { pan: number; tilt: number; zoom: number };
  /** Regions blanked for privacy, in normalised frame coordinates. */
  masks?: readonly PrivacyMask[];
  /** Layers over the frame in normalised coordinates: annotations, boxes, handles. */
  children?: ReactNode;
  className?: string;
};

const OVERLAY_CHIP =
  'rounded-xs bg-[color-mix(in_oklab,var(--card-background)_78%,transparent)] px-1.5 py-0.5 font-mono text-xs leading-none tabular-nums text-base-foreground';

/**
 * A stand-in for a camera frame where no image exists: the plant silhouette of a scene drawn from
 * the equipment symbols in quiet tokens, with the time stamp and camera name overlaid as a real
 * feed shows them. Layers placed as children are positioned over the whole frame.
 */
export function CameraFrame({ scene, label, timestamp, caption, mode = 'day', view = { pan: 0, tilt: 0, zoom: 1 }, masks = [], children, className }: CameraFrameProps) {
  const definition = findScene(scene);
  const shift = `translate(${(-view.pan * 0.9).toFixed(1)}px, ${(view.tilt * 0.6).toFixed(1)}px) scale(${view.zoom})`;

  return (
    <div role="img" aria-label={label} data-slot="camera-frame" data-mode={mode} className={cn('relative aspect-video w-full overflow-hidden rounded-lg bg-muted-background', className)}>
      <svg aria-hidden="true" viewBox={`0 0 ${FRAME_WIDTH} ${FRAME_HEIGHT}`} preserveAspectRatio="xMidYMid slice" fill="none" className="absolute inset-0 size-full">
        <g style={{ transform: shift, transformOrigin: `${FRAME_WIDTH / 2}px ${FRAME_HEIGHT / 2}px` }}>
          <rect x={-FRAME_WIDTH} y={-FRAME_HEIGHT} width={FRAME_WIDTH * 3} height={definition.horizon + FRAME_HEIGHT} className="fill-muted-background" />
          <rect x={-FRAME_WIDTH} y={definition.horizon} width={FRAME_WIDTH * 3} height={FRAME_HEIGHT * 2} className="fill-medium-background" />
          <line x1={-FRAME_WIDTH} x2={FRAME_WIDTH * 2} y1={definition.horizon} y2={definition.horizon} strokeWidth={1} className="stroke-chart-neutral-300" />
          {definition.lines.map((line) => (
            <path key={line.d} d={line.d} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="stroke-chart-neutral-300" />
          ))}
          {definition.items.map((item) => (
            <EquipmentSymbol key={`${item.kind}-${item.x}`} kind={item.kind} size={item.size} cx={item.x} cy={item.y} fill="soft" className="text-chart-neutral-450" label={item.kind.replace(/-/g, ' ')} />
          ))}
        </g>
        {mode === 'night' ? <rect width={FRAME_WIDTH} height={FRAME_HEIGHT} className="fill-base-foreground opacity-20" /> : null}
      </svg>
      {masks.map((mask, index) => (
        <span
          key={index}
          data-slot="privacy-mask"
          className="absolute flex items-center justify-center bg-chart-neutral-450 text-xs font-medium text-base-background"
          style={{ left: `${mask.x * 100}%`, top: `${mask.y * 100}%`, width: `${mask.w * 100}%`, height: `${mask.h * 100}%` }}
        >
          Masked
        </span>
      ))}
      {children}
      {timestamp ? (
        <span data-slot="frame-timestamp" aria-hidden="true" className={cn('absolute left-2 top-2', OVERLAY_CHIP)}>
          {timestamp}
        </span>
      ) : null}
      {caption ? (
        <span data-slot="frame-caption" aria-hidden="true" className={cn('absolute bottom-2 left-2', OVERLAY_CHIP)}>
          {caption}
        </span>
      ) : null}
      {mode === 'night' ? (
        <span aria-hidden="true" className={cn('absolute right-2 top-2', OVERLAY_CHIP)}>
          IR
        </span>
      ) : null}
    </div>
  );
}

/** The point in a frame under a pointer, for components that draw over it. */
export type FramePoint = NormalPoint;
