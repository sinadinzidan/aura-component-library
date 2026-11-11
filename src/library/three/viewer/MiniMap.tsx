import { DiagramCanvas } from '../../industrial/diagrams/DiagramCanvas';
import type { Bounds, CameraTarget } from '../cameraTargets';

import { planBox, planPoint, viewConePath } from './plan';
import type { PlanSpace } from './plan';
import { findPart, partBounds } from './viewerModelLogic';

export type MiniMapProps = {
  /** Bounds of the whole model. */
  bounds: Bounds;
  /** Footprints to draw, e.g. one per part. */
  parts?: readonly { id: string; bounds: Bounds }[];
  /** Where the camera is and what it looks at. */
  pose: CameraTarget;
  /** Part ids drawn in the accent, e.g. the selection. */
  highlightIds?: readonly string[];
  width?: number;
  height?: number;
  className?: string;
};

const DEFAULT_PARTS = ['base-frame', 'separator', 'scrubber', 'compressor', 'motor', 'cooler', 'lube-oil', 'antisurge'].flatMap((id) => {
  const part = findPart(id);
  return part ? [{ id, bounds: partBounds(part) }] : [];
});

/**
 * A plan view of the model with the camera on it: footprints of the parts, a dot for the camera and
 * a wedge for what it sees. North is up. It orients the user when the camera is close in, and
 * states the heading in its accessible name.
 */
export function MiniMap({ bounds, parts = DEFAULT_PARTS, pose, highlightIds = [], width = 200, height = 120, className }: MiniMapProps) {
  const space: PlanSpace = { bounds, width, height, padding: 20 };
  const camera = planPoint(pose.position, space);
  const heading = Math.round(((Math.atan2(pose.lookAt[0] - pose.position[0], -(pose.lookAt[2] - pose.position[2])) * 180) / Math.PI + 360) % 360);

  return (
    <DiagramCanvas label={`Plan view. The camera looks towards ${heading} degrees from north.`} width={width} height={height} className={className}>
      <rect x={0.5} y={0.5} width={width - 1} height={height - 1} rx={6} strokeWidth={1} className="fill-muted-background stroke-chart-neutral-200" />
      {parts.map((part) => {
        const box = planBox(part.bounds, space);
        return <rect key={part.id} data-slot="map-part" x={box.x} y={box.y} width={box.width} height={box.height} rx={1.5} strokeWidth={highlightIds.includes(part.id) ? 2 : 1} className={highlightIds.includes(part.id) ? 'fill-chart-neutral-200 stroke-[var(--primary-background)]' : 'fill-chart-neutral-100 stroke-chart-neutral-300'} />;
      })}
      <path data-slot="map-cone" d={viewConePath(pose, space)} strokeWidth={1} className="fill-chart-1-200 stroke-chart-1-450" opacity={0.6} />
      <circle data-slot="map-camera" cx={camera.x} cy={camera.y} r={3.5} className="fill-base-foreground" />
      <text x={width - 8} y={14} fontSize={10} textAnchor="end" className="fill-muted-foreground">
        N
      </text>
    </DiagramCanvas>
  );
}
