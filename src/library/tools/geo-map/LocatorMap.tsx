import type { Outline } from '../../three/scenes/continents';

import { outlinePaths } from './geoPaths';
import { toScreen } from './mapView';
import type { MapView, Size } from './mapView';
import type { LatLong, ProjectionId } from './projection';

type LocatorMapProps = {
  label: string;
  outlines: readonly Outline[];
  /** What the locator is zoomed to. */
  view: MapView;
  size?: Size;
  projection?: ProjectionId;
  /** The area the main map shows, drawn as a box. */
  focus?: { south: number; north: number; west: number; east: number };
  /** Places to mark, for example the selected site. */
  points?: readonly LatLong[];
};

/**
 * A small fixed map that answers "where is this": coastlines, a box for the area shown on the
 * main map and dots for chosen places. It does not pan or zoom.
 */
export function LocatorMap({ label, outlines, view, size = { width: 160, height: 120 }, projection = 'equal-area', focus, points = [] }: LocatorMapProps) {
  const corners = focus
    ? [
        { lat: focus.north, lon: focus.west },
        { lat: focus.north, lon: focus.east },
        { lat: focus.south, lon: focus.east },
        { lat: focus.south, lon: focus.west },
      ].map((corner) => toScreen(projection, view, size, corner))
    : [];
  const box = corners.every((corner) => corner !== null) && corners.length === 4 ? corners.flatMap((corner) => (corner ? [corner] : [])) : [];

  return (
    <svg role="img" aria-label={label} data-slot="locator-map" viewBox={`0 0 ${size.width} ${size.height}`} width="100%" style={{ maxWidth: size.width }} className="block h-auto rounded-lg border border-default bg-base-background">
      {outlines.flatMap((outline) =>
        outlinePaths(projection, view, size, outline.points, outline.closed).map((path, index) => (
          <path key={`${outline.id}-${index}`} d={path.d} strokeWidth={0.75} strokeLinejoin="round" className={`stroke-emphasized ${path.filled ? 'fill-muted-background' : 'fill-none'}`} />
        ))
      )}
      {box.length === 4 ? <polygon points={box.map((corner) => `${corner.x},${corner.y}`).join(' ')} fill="none" strokeWidth={1.5} className="stroke-base-foreground" /> : null}
      {points.map((point, index) => {
        const at = toScreen(projection, view, size, point);
        return at ? <circle key={index} cx={at.x} cy={at.y} r={3} strokeWidth={1.5} className="fill-base-foreground stroke-base-background" /> : null;
      })}
    </svg>
  );
}
