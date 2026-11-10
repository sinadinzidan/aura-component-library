import type { DotShape } from '../../industrial/status';
import type { ViewInsetsValue } from '../cameraTargets';
import { SceneLabel } from '../SceneLabel';
import type { SceneTone } from '../scenePalette';
import { Selectable } from '../Selectable';
import { ViewInsets } from '../ViewInsets';

import type { Outline } from './continents';
import { latLongToVec3 } from './geo';
import type { GlobeView, LatLong } from './geo';
import { Globe } from './Globe';
import { GlobeControls } from './GlobeControls';
import { GreatCircleArc } from './GreatCircleArc';
import { SiteMarker } from './SiteMarker';

/** A site on the globe: where it is, how big its marker is and what state it shows. */
export type GlobeSite = LatLong & {
  id: string;
  name: string;
  /** Marker radius in scene units. Size it by production with `markerRadius`. */
  size: number;
  tone?: SceneTone;
  /** Status in words, shown on the label of the selected or hovered site. */
  status?: string;
  /** Label dot shape, repeating the status without colour. */
  dot?: DotShape;
  /** `diamond` marks a terminal among producing sites. */
  shape?: 'dot' | 'diamond';
  pulse?: boolean;
  /** Outside the active filter: faded and not clickable. */
  dimmed?: boolean;
};

export type GlobeRoute = { id: string; from: LatLong; to: LatLong; quiet?: boolean; flow?: boolean; dimmed?: boolean };

export type FleetGlobeProps = {
  sites: readonly GlobeSite[];
  routes?: readonly GlobeRoute[];
  outlines?: readonly Outline[];
  radius?: number;
  /** Where the camera is. Change it to swing the globe; see `GlobeControls`. */
  view: GlobeView;
  /** Slow idle spin. Stop it when the user interacts. */
  spinning?: boolean;
  selectedId?: string | null;
  /** Called with a site id. */
  onSelect?: (id: string) => void;
  /** Called when the user grabs the globe. */
  onInteract?: () => void;
  /** Called when the open globe is clicked. */
  onClear?: () => void;
  /** Pixels that overlays cover on each edge of the canvas. */
  insets?: ViewInsetsValue;
};

/**
 * A fleet on a globe: coastlines and graticule, a glowing marker per site, and great-circle
 * routes between them. Only the selected site is labelled, so labels never pile up — list the
 * sites beside the canvas. Selection and camera are controlled. Render it inside `SceneCanvas`.
 */
export function FleetGlobe({ sites, routes = [], outlines = [], radius = 10, view, spinning = false, selectedId = null, onSelect, onInteract, onClear, insets }: FleetGlobeProps) {
  const { top = 0, right = 0, bottom = 0, left = 0 } = insets ?? {};

  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[radius * 2, radius * 3, radius * 4]} intensity={1.6} />
      <GlobeControls view={view} spinning={spinning} minDistance={radius * 1.25} maxDistance={radius * 5} onInteract={onInteract} />
      <ViewInsets top={top} right={right} bottom={bottom} left={left} />
      <Globe radius={radius} outlines={outlines} onClick={onClear} />

      {routes.map((route) => (
        <GreatCircleArc key={route.id} from={route.from} to={route.to} globeRadius={radius} quiet={route.quiet} flow={route.flow} dimmed={route.dimmed} width={route.quiet ? 1 : 1.75} />
      ))}

      {sites.map((site) => {
        const isSelected = site.id === selectedId;
        return (
          <group key={site.id}>
            <Selectable id={site.id} onSelect={onSelect} selected={isSelected} disabled={site.dimmed} outline={false}>
              {(state) => (
                <SiteMarker
                  lat={site.lat}
                  lon={site.lon}
                  globeRadius={radius}
                  size={site.size}
                  tone={site.tone}
                  shape={site.shape}
                  pulse={site.pulse}
                  hovered={state.hovered}
                  selected={state.selected}
                  dimmed={site.dimmed}
                />
              )}
            </Selectable>
            {isSelected ? (
              <SceneLabel position={latLongToVec3(site.lat, site.lon, radius * 1.03)} tag={site.name} value={site.status} tone={site.tone} shape={site.dot} selected />
            ) : null}
          </group>
        );
      })}
    </>
  );
}
