import { cn } from '../../../lib/utils';
import type { Tone } from '../../industrial/status';

export type MiniMapRegion = { id: string; label: string; x: number; y: number; width: number; height: number; tone?: Tone };

export type MiniMapProps = {
  /** Size of the whole plan, in the same units as the regions and the viewport. */
  world: { width: number; height: number };
  regions: readonly MiniMapRegion[];
  /** The part of the plan currently on screen. */
  viewport: { x: number; y: number; width: number; height: number };
  /** Accessible name, e.g. "Overview: showing Gas compression". */
  label: string;
  /** Makes regions clickable. */
  onSelectRegion?: (id: string) => void;
  className?: string;
};

const REGION_STROKE: Record<Tone, string> = {
  neutral: 'stroke-emphasized',
  success: 'stroke-emphasized',
  info: 'stroke-emphasized',
  warning: 'stroke-warning-foreground-strong',
  critical: 'stroke-critical-foreground-strong',
};

/**
 * A small overview of a zoomable plan with a frame marking what is on screen, so a deep zoom never
 * loses its bearings. The frame slides between positions; regions can be made clickable.
 */
export function MiniMap({ world, regions, viewport, label, onSelectRegion, className }: MiniMapProps) {
  // Keep the frame visible when the viewport is a tiny part of the plan.
  const minWidth = world.width * 0.06;
  const minHeight = world.height * 0.06;
  const width = Math.max(viewport.width, minWidth);
  const height = Math.max(viewport.height, minHeight);
  const x = viewport.x + viewport.width / 2 - width / 2;
  const y = viewport.y + viewport.height / 2 - height / 2;
  const stroke = world.width / 80;

  return (
    <svg
      data-slot="mini-map"
      role="img"
      aria-label={label}
      viewBox={`0 0 ${world.width} ${world.height}`}
      className={cn('block w-36 rounded-md border border-default bg-card-background', className)}
    >
      {regions.map((region) => (
        <rect
          key={region.id}
          data-slot="mini-map-region"
          data-tone={region.tone ?? 'neutral'}
          x={region.x}
          y={region.y}
          width={region.width}
          height={region.height}
          rx={stroke}
          strokeWidth={stroke / 1.5}
          onClick={onSelectRegion ? () => onSelectRegion(region.id) : undefined}
          className={cn('fill-muted-background', REGION_STROKE[region.tone ?? 'neutral'], onSelectRegion ? 'cursor-pointer hover:fill-medium-background' : '')}
        >
          <title>{region.label}</title>
        </rect>
      ))}
      <rect
        data-slot="mini-map-viewport"
        width={world.width}
        height={world.height}
        strokeWidth={stroke}
        vectorEffect="non-scaling-stroke"
        style={{
          transformOrigin: '0 0',
          transform: `translate(${x}px, ${y}px) scale(${width / world.width}, ${height / world.height})`,
          fill: 'color-mix(in oklab, var(--primary-background) 16%, transparent)',
        }}
        className="pointer-events-none stroke-primary-background [stroke-width:2] motion-safe:transition-transform motion-safe:duration-500"
      />
    </svg>
  );
}
