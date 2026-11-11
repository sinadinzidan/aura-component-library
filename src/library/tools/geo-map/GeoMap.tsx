import { Button } from '@cognite/aura/components/button';
import { CheckboxGroup, CheckboxItem, CheckboxItemControl, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import { Loader } from '@cognite/aura/components/loader';
import { Popover, PopoverClose, PopoverContent, PopoverHeader, PopoverHeaderContent, PopoverSlot, PopoverTitle, PopoverTrigger } from '@cognite/aura/components/popover';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import { IconStack2 } from '@cognite/aura/icons';
import { useEffect, useId, useMemo, useReducer, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react';

import type { DotShape, Tone } from '../../industrial/status';
import type { Outline } from '../../three/scenes/continents';

import { clusterMarkers } from './clustering';
import { blockGrid, chevronsAlong, graticule, graticuleStep, outlinePaths, pathThrough, projectPoints } from './geoPaths';
import type { BlockCell } from './geoPaths';
import { MapLegend } from './MapLegend';
import type { LegendLine, LegendStatus } from './MapLegend';
import { DRAG_THRESHOLD, createMapState, mapReducer } from './mapReducer';
import type { LayerId } from './mapReducer';
import { MapScaleBar } from './MapScaleBar';
import { MAX_SCALE, MIN_SCALE, fromScreen, isInFrame, kilometresPerPixel, toScreen, zoomLevel } from './mapView';
import type { MapView, Size } from './mapView';
import { PROJECTIONS, formatLatLong } from './projection';
import type { LatLong, ProjectionId } from './projection';
import { SiteMark } from './SiteMark';
import { describeView, markerRadius, worstOf } from './tones';
import { ZoomControls } from './ZoomControls';

export type MapMarker = {
  id: string;
  name: string;
  position: LatLong;
  tone: Tone;
  shape: DotShape;
  /** Sizes the marker and decides which marker leads a cluster, for example production. */
  weight: number;
  /** The state in words, spoken with the name. */
  statusLabel: string;
  /** A figure to read out with the name, for example "142 kboe/d". */
  valueLabel?: string;
};

export type MapRoute = {
  id: string;
  name: string;
  kind: 'pipeline' | 'export';
  /** Places along the route, in the direction things flow. */
  points: readonly LatLong[];
  /** Not carrying anything now: drawn dotted. */
  idle?: boolean;
};

export type MapRegion = {
  id: string;
  name: string;
  points: readonly LatLong[];
  /** Where the name sits. Defaults to the middle of the outline's bounding box. */
  labelAt?: LatLong;
  /** Drawn hatched: nothing is known about it. */
  noData?: boolean;
};

export type BlockLayer = { box: { south: number; north: number; west: number; east: number }; lonStep: number; latStep: number; licensedIds: readonly string[] };

type GeoMapProps = {
  /** What the map shows, in one sentence, for assistive technology. */
  label: string;
  outlines: readonly Outline[];
  markers?: readonly MapMarker[];
  routes?: readonly MapRoute[];
  regions?: readonly MapRegion[];
  blocks?: BlockLayer;
  initialView: MapView;
  /** Size to draw at until the frame has been measured. Also the size in tests. */
  initialSize?: Size;
  projection?: ProjectionId;
  layers?: Partial<Record<LayerId, boolean>>;
  initialSelectedId?: string | null;
  highlightedRegionId?: string | null;
  /** The card for the selected marker; it sits in the top left corner. */
  renderCard?: (marker: MapMarker, close: () => void) => ReactNode;
  legend?: { statuses?: readonly LegendStatus[]; lines?: readonly LegendLine[]; sizeNote?: string };
  onSelect?: (id: string | null) => void;
  /** Wheel zooms the map. Turn off where the page should keep scrolling. */
  wheelZoom?: boolean;
  /** `full`: layers, projection, zoom, legend and scale; `minimal`: zoom buttons and scale only; `none`: just the map. */
  chrome?: 'full' | 'minimal' | 'none';
  loading?: boolean;
  loadingText?: string;
  /** Pixels within which markers merge into a cluster. */
  clusterRadius?: number;
  className?: string;
};

const DEFAULT_SIZE: Size = { width: 800, height: 520 };
const KEY_PAN = 80;
const ZOOM_STEP = 1.6;

const LAYER_LABEL: Readonly<Record<LayerId, string>> = { sites: 'Sites', pipelines: 'Pipelines', exports: 'Export routes', blocks: 'Licence blocks' };

function isProjection(value: unknown): value is ProjectionId {
  return value === 'mercator' || value === 'equal-area';
}

const HALO = { paintOrder: 'stroke' } as const;

/**
 * A projected vector map with no tiles: coastlines from a coarse outline set, a graticule, sites
 * as status marks sized by a weight, clusters that split on zoom, pipelines with direction,
 * export routes, a licence-block grid and region outlines. Drag to pan, wheel, buttons or +/- to
 * zoom about the pointer, arrow keys to pan, 0 to reset and F to fit the sites; every marker is a
 * button and every change is announced. Pointer events with capture, state in a pure reducer.
 */
export function GeoMap({
  label,
  outlines,
  markers = [],
  routes = [],
  regions = [],
  blocks,
  initialView,
  initialSize = DEFAULT_SIZE,
  projection = 'mercator',
  layers,
  initialSelectedId = null,
  highlightedRegionId = null,
  renderCard,
  legend,
  onSelect,
  wheelZoom = true,
  chrome = 'full',
  loading = false,
  loadingText = 'Loading sites',
  clusterRadius = 30,
  className = 'size-full',
}: GeoMapProps) {
  const id = useId();
  const frameRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const captured = useRef(false);
  // True from the end of a drag until the next press, so the click that follows a drag is ignored.
  const dragged = useRef(false);
  const [state, dispatch] = useReducer(mapReducer, undefined, () => createMapState(initialView, initialSize, { projection, layers, selectedId: initialSelectedId }));
  const [pointer, setPointer] = useState<LatLong | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const { view, size, layers: shown } = state;
  const proj = state.projection;

  // Follow the frame's size, so the map always fills it and a drag moves it one pixel per pixel.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) dispatch({ type: 'resize', size: { width: Math.round(width), height: Math.round(height) } });
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  // The wheel listener is native and not passive, because React's would not let it stop page scroll.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !wheelZoom) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const box = svg.getBoundingClientRect();
      const delta = Number.isFinite(event.deltaY) ? Math.max(-120, Math.min(120, event.deltaY)) : 0;
      const factor = Math.exp(-delta * 0.0022);
      const x = Number.isFinite(event.clientX) ? event.clientX - box.left : box.width / 2;
      const y = Number.isFinite(event.clientY) ? event.clientY - box.top : box.height / 2;
      dispatch({ type: 'zoom-at', point: { x, y }, factor });
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [wheelZoom]);

  const markersById = useMemo(() => new Map(markers.map((marker) => [marker.id, marker])), [markers]);
  const maxWeight = useMemo(() => Math.max(0, ...markers.map((marker) => marker.weight)), [markers]);

  const geometry = useMemo(() => {
    const land = outlines.flatMap((outline) => outlinePaths(proj, view, size, outline.points, outline.closed).map((path, index) => ({ key: `${outline.id}-${index}`, ...path })));
    const step = graticuleStep(view.scale);
    let bounds: { south: number; north: number; west: number; east: number } | undefined;
    if (proj === 'mercator') {
      const corners = [fromScreen(proj, view, size, { x: 0, y: 0 }), fromScreen(proj, view, size, { x: size.width, y: size.height })];
      const lons = [corners[0].lon, corners[1].lon];
      // Past a half turn of longitude the view spans the whole world, and the bounds would wrap.
      bounds = size.width / view.scale < Math.PI * 1.6 ? { north: corners[0].lat, south: corners[1].lat, west: Math.min(...lons), east: Math.max(...lons) } : undefined;
    }
    const lines = graticule(proj, view, size, step, bounds);
    const regionPaths = regions.map((region) => ({ region, d: pathThrough(projectPoints(proj, view, size, region.points), true), at: toScreen(proj, view, size, region.labelAt ?? regionLabelPoint(region.points)) }));
    const routePaths = routes.map((route) => {
      const projected = projectPoints(proj, view, size, route.points);
      return { route, d: pathThrough(projected), chevrons: route.kind === 'pipeline' ? chevronsAlong(projected, 84, size) : chevronsAlong(projected, 120, size) };
    });
    const cells: { cell: BlockCell; d: string; licensed: boolean; centre: { x: number; y: number } | null }[] = blocks
      ? blockGrid(blocks.box, blocks.lonStep, blocks.latStep).map((cell) => ({
          cell,
          d: pathThrough(
            projectPoints(proj, view, size, [
              { lat: cell.north, lon: cell.west },
              { lat: cell.north, lon: cell.east },
              { lat: cell.south, lon: cell.east },
              { lat: cell.south, lon: cell.west },
            ]),
            true
          ),
          licensed: blocks.licensedIds.includes(cell.id),
          centre: toScreen(proj, view, size, { lat: (cell.north + cell.south) / 2, lon: (cell.west + cell.east) / 2 }),
        }))
      : [];
    return { land, lines, regionPaths, routePaths, cells };
  }, [proj, view, size, outlines, regions, routes, blocks]);

  const groups = useMemo(() => {
    const placed = markers.flatMap((marker) => {
      const at = toScreen(proj, view, size, marker.position);
      return at && isInFrame(size, at, 40) ? [{ marker, at }] : [];
    });
    const clusters = clusterMarkers(
      placed.map(({ marker, at }) => ({ id: marker.id, x: at.x, y: at.y, weight: marker.weight })),
      clusterRadius
    );
    return { visible: placed.length, clusters };
  }, [markers, proj, view, size, clusterRadius]);

  const selected = state.selectedId ? markersById.get(state.selectedId) : undefined;
  const kmPerPixel = useMemo(() => kilometresPerPixel(proj, view, size), [proj, view, size]);
  const sitePoints = useMemo(() => markers.map((marker) => marker.position), [markers]);

  // Say what changed after each discrete action: zoom button, key, fit, projection, selection, layer.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const picked = state.selectedId ? markersById.get(state.selectedId) : undefined;
    setAnnouncement(
      picked
        ? `Selected ${picked.name}, ${picked.statusLabel}${picked.valueLabel ? `, ${picked.valueLabel}` : ''}.`
        : describeView({
            zoom: zoomLevel(state.view),
            centre: formatLatLong(state.view.center, 1),
            markers: groups.visible,
            groups: groups.clusters.length,
            projection: PROJECTIONS.find((candidate) => candidate.id === state.projection)?.label ?? '',
          })
    );
    // Only discrete actions count: gestures in progress change the view on every move.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.past.length, state.selectedId, state.projection, state.layers]);

  const select = (next: string | null) => {
    dispatch({ type: 'select', id: next });
    onSelect?.(next);
  };

  const local = (event: { clientX: number; clientY: number }) => {
    const box = svgRef.current?.getBoundingClientRect();
    return { x: event.clientX - (box?.left ?? 0), y: event.clientY - (box?.top ?? 0) };
  };

  const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) return;
    captured.current = false;
    dragged.current = false;
    dispatch({ type: 'drag-start', point: local(event) });
  };
  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const point = local(event);
    setPointer(fromScreen(proj, view, size, point));
    if (!state.drag) return;
    // Capture only once it is a drag, so a plain click still reaches the marker under it.
    if (!captured.current && Math.hypot(point.x - state.drag.origin.x, point.y - state.drag.origin.y) > DRAG_THRESHOLD) {
      captured.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    dispatch({ type: 'drag-move', point });
  };
  const endDrag = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (captured.current && event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    dragged.current = captured.current || state.drag?.moved === true;
    captured.current = false;
    dispatch({ type: 'drag-end' });
  };

  const onKeyDown = (event: ReactKeyboardEvent<SVGSVGElement>) => {
    if (event.target !== event.currentTarget) {
      if (event.key === 'Escape' && state.selectedId) select(null);
      return;
    }
    const step = event.shiftKey ? KEY_PAN * 3 : KEY_PAN;
    const pans: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const pan = pans[event.key];
    if (pan) {
      event.preventDefault();
      dispatch({ type: 'pan-key', dx: pan[0], dy: pan[1] });
    } else if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      dispatch({ type: 'zoom-step', factor: ZOOM_STEP });
    } else if (event.key === '-' || event.key === '_') {
      event.preventDefault();
      dispatch({ type: 'zoom-step', factor: 1 / ZOOM_STEP });
    } else if (event.key === '0') {
      event.preventDefault();
      dispatch({ type: 'home' });
    } else if (event.key.toLowerCase() === 'f' && sitePoints.length > 0) {
      event.preventDefault();
      dispatch({ type: 'fit', points: sitePoints });
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      dispatch({ type: 'back' });
    } else if (event.key === 'Escape' && state.selectedId) {
      select(null);
    }
  };

  const zoomIn = () => dispatch({ type: 'zoom-step', factor: ZOOM_STEP });
  const zoomOut = () => dispatch({ type: 'zoom-step', factor: 1 / ZOOM_STEP });
  const fit = () => dispatch({ type: 'fit', points: sitePoints });
  const showSites = shown.sites && !loading;
  const full = chrome === 'full';

  return (
    <div ref={frameRef} data-slot="geo-map" data-projection={proj} className={`@container relative overflow-hidden rounded-xl border border-default bg-base-background ${className}`}>
      <svg
        ref={svgRef}
        role="group"
        aria-roledescription="map"
        aria-label={`${label}. Drag to pan, plus and minus to zoom, arrow keys to move, F to fit the sites, zero to reset.`}
        tabIndex={0}
        viewBox={`0 0 ${size.width} ${size.height}`}
        width={size.width}
        height={size.height}
        className={`block touch-none select-none outline-none focus-visible:shadow-focus-ring ${state.drag?.moved ? 'cursor-grabbing' : 'cursor-grab'}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={() => setPointer(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget || (event.target instanceof SVGElement && event.target.dataset.background !== undefined)) {
            if (!dragged.current) select(null);
          }
        }}
        onKeyDown={onKeyDown}
      >
        <defs>
          <pattern id={`${id}-hatch`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" strokeWidth="1.5" className="stroke-emphasized" />
          </pattern>
        </defs>
        <rect data-background="" width={size.width} height={size.height} className="fill-base-background" />

        <g aria-hidden="true">
          {geometry.lines.map((line) => (
            <path key={line.id} d={line.d} fill="none" strokeWidth={1} className="stroke-default" />
          ))}
          {geometry.land.map((path) => (
            <path key={path.key} d={path.d} strokeWidth={1.25} strokeLinejoin="round" className={`stroke-emphasized ${path.filled ? 'fill-muted-background' : 'fill-none'}`} />
          ))}
          {geometry.regionPaths.map(({ region, d, at }) => {
            const active = region.id === highlightedRegionId;
            return (
              <g key={region.id} data-region={region.id} data-active={active ? '' : undefined}>
                <path d={d} strokeWidth={active ? 2 : 1} strokeDasharray="4 4" className={active ? 'fill-medium-background stroke-base-foreground' : 'fill-none stroke-default'} opacity={active ? 0.7 : 1} />
                {region.noData ? <path d={d} strokeWidth={0} fill={`url(#${id}-hatch)`} opacity={0.5} /> : null}
                {at && isInFrame(size, at, 0) ? (
                  <text x={at.x} y={at.y} textAnchor="middle" fontSize={11} fontStyle="italic" style={HALO} strokeWidth={3} className="fill-muted-foreground stroke-base-background">
                    {region.noData ? `${region.name}, no data` : region.name}
                  </text>
                ) : null}
              </g>
            );
          })}
          {shown.blocks
            ? geometry.cells.map(({ cell, d, licensed, centre }) => (
                <g key={cell.id} data-block={cell.id} data-licensed={licensed ? '' : undefined}>
                  <path d={d} strokeWidth={licensed ? 1.5 : 0.75} className={`stroke-emphasized ${licensed ? 'fill-medium-background' : 'fill-none'}`} opacity={licensed ? 0.7 : 0.8} />
                  {centre && view.scale > 2500 ? (
                    <text x={centre.x} y={centre.y + 3} textAnchor="middle" fontSize={10} className="fill-muted-foreground font-mono">
                      {cell.id}
                    </text>
                  ) : null}
                </g>
              ))
            : null}
          {shown.pipelines
            ? geometry.routePaths
                .filter(({ route }) => route.kind === 'pipeline')
                .map(({ route, d, chevrons }) => (
                  <g key={route.id} data-route={route.id}>
                    <path d={d} fill="none" strokeWidth={2} strokeLinecap="round" strokeDasharray={route.idle ? '1 5' : undefined} className="stroke-medium-foreground" />
                    {chevrons.map((chevron, index) => (
                      <path key={index} d="M-3.5 -3.5 L2.5 0 L-3.5 3.5" fill="none" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" transform={`translate(${chevron.x} ${chevron.y}) rotate(${chevron.angle})`} className="stroke-medium-foreground" />
                    ))}
                  </g>
                ))
            : null}
          {shown.exports
            ? geometry.routePaths
                .filter(({ route }) => route.kind === 'export')
                .map(({ route, d, chevrons }) => (
                  <g key={route.id} data-route={route.id}>
                    <path d={d} fill="none" strokeWidth={1.25} strokeDasharray="6 4" className="stroke-muted-foreground" />
                    {chevrons.map((chevron, index) => (
                      <path key={index} d="M-3 -3 L2 0 L-3 3" fill="none" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" transform={`translate(${chevron.x} ${chevron.y}) rotate(${chevron.angle})`} className="stroke-muted-foreground" />
                    ))}
                  </g>
                ))
            : null}
        </g>

        {showSites
          ? groups.clusters.map((cluster) => {
              const members = cluster.memberIds.flatMap((memberId) => {
                const marker = markersById.get(memberId);
                return marker ? [marker] : [];
              });
              if (members.length === 0) return null;
              if (members.length === 1) {
                const marker = members[0];
                const radius = markerRadius(marker.weight, maxWeight);
                const isSelected = marker.id === state.selectedId;
                return (
                  <g
                    key={marker.id}
                    data-marker={marker.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    aria-label={`${marker.name}, ${marker.statusLabel}${marker.valueLabel ? `, ${marker.valueLabel}` : ''}`}
                    className="cursor-pointer outline-none [&:focus-visible>circle:first-child]:stroke-base-foreground"
                    onClick={() => !dragged.current && select(isSelected ? null : marker.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        select(isSelected ? null : marker.id);
                      }
                    }}
                  >
                    <circle cx={cluster.x} cy={cluster.y} r={radius + 7} fill="transparent" strokeWidth={2} className="stroke-transparent" />
                    <SiteMark x={cluster.x} y={cluster.y} tone={marker.tone} shape={marker.shape} radius={radius} selected={isSelected} />
                    <text x={cluster.x + radius + 7} y={cluster.y + 4} fontSize={11} fontWeight={500} style={HALO} strokeWidth={3} className="fill-base-foreground stroke-base-background">
                      {marker.name}
                    </text>
                  </g>
                );
              }
              const worst = worstOf(members);
              return (
                <g
                  key={cluster.id}
                  data-cluster={cluster.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${members.length} sites: ${members.map((member) => member.name).join(', ')}. Zoom to separate them.`}
                  className="cursor-pointer outline-none"
                  onClick={() => !dragged.current && dispatch({ type: 'fit', points: members.map((member) => member.position) })}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      dispatch({ type: 'fit', points: members.map((member) => member.position) });
                    }
                  }}
                >
                  <circle cx={cluster.x} cy={cluster.y} r={15} strokeWidth={1.5} className="fill-card-background stroke-base-foreground" />
                  <text x={cluster.x} y={cluster.y + 4} textAnchor="middle" fontSize={12} fontWeight={600} className="fill-base-foreground tabular-nums">
                    {members.length}
                  </text>
                  {worst && worst.tone !== 'neutral' ? <SiteMark x={cluster.x + 12} y={cluster.y - 12} tone={worst.tone} shape={worst.shape} radius={4.5} /> : null}
                </g>
              );
            })
          : null}
      </svg>

      {loading ? (
        <div role="status" className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-lg border border-default bg-card-background px-3 py-2 text-sm text-base-foreground">
          <Loader size={16} />
          {loadingText}
        </div>
      ) : null}

      {full ? (
        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <div className="pointer-events-auto flex min-w-0 flex-wrap items-center gap-2">
            <Popover>
              <PopoverTrigger
                render={
                  <Button variant="secondary" size="sm">
                    <IconStack2 /> Layers
                  </Button>
                }
              />
              <PopoverContent align="start">
                <PopoverHeader>
                  <PopoverHeaderContent>
                    <PopoverTitle>Map layers</PopoverTitle>
                    <PopoverClose />
                  </PopoverHeaderContent>
                </PopoverHeader>
                <PopoverSlot>
                  <CheckboxGroup aria-label="Map layers">
                    {(Object.keys(LAYER_LABEL) as LayerId[]).map((layer) => (
                      <CheckboxItem key={layer}>
                        <CheckboxItemControl checked={shown[layer]} onCheckedChange={() => dispatch({ type: 'toggle-layer', layer })} />
                        <CheckboxItemLabel>{LAYER_LABEL[layer]}</CheckboxItemLabel>
                      </CheckboxItem>
                    ))}
                  </CheckboxGroup>
                </PopoverSlot>
              </PopoverContent>
            </Popover>
            <SegmentedControl
              value={proj}
              onValueChange={(next) => {
                if (isProjection(next)) dispatch({ type: 'projection', projection: next });
              }}
            >
              <SegmentedControlList size="small" aria-label="Projection">
                {PROJECTIONS.map((option) => (
                  <SegmentedControlButton key={option.id} value={option.id}>
                    {option.label}
                  </SegmentedControlButton>
                ))}
              </SegmentedControlList>
            </SegmentedControl>
          </div>
          <div className="pointer-events-auto">
            <ZoomControls
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onFit={sitePoints.length > 0 ? fit : undefined}
              onHome={() => dispatch({ type: 'home' })}
              onBack={() => dispatch({ type: 'back' })}
              canZoomIn={view.scale < MAX_SCALE}
              canZoomOut={view.scale > MIN_SCALE}
              canGoBack={state.past.length > 0}
            />
          </div>
        </div>
      ) : null}

      {chrome === 'minimal' ? (
        <div className="absolute right-3 top-3">
          <ZoomControls onZoomIn={zoomIn} onZoomOut={zoomOut} canZoomIn={view.scale < MAX_SCALE} canZoomOut={view.scale > MIN_SCALE} />
        </div>
      ) : null}

      {full && selected && renderCard ? <div className="absolute left-3 top-14 w-64 max-w-[calc(100%-1.5rem)]">{renderCard(selected, () => select(null))}</div> : null}

      {full && legend ? (
        <div className="absolute bottom-3 left-3 hidden rounded-lg border border-default bg-card-background p-3 @2xl:block">
          <MapLegend {...legend} />
        </div>
      ) : null}

      {chrome !== 'none' ? (
        <div className="pointer-events-none absolute bottom-3 right-3 flex flex-col items-end gap-1 rounded-lg border border-default bg-card-background px-3 py-2">
          <MapScaleBar kmPerPixel={kmPerPixel} />
          <span data-slot="coordinates" className="font-mono text-xs tabular-nums text-medium-foreground">
            {pointer ? formatLatLong(pointer) : formatLatLong(view.center)}
          </span>
        </div>
      ) : null}

      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}

/** A point inside a region to hang its label on: the middle of its bounding box. */
function regionLabelPoint(points: readonly LatLong[]): LatLong {
  const lats = points.map((point) => point.lat);
  const lons = points.map((point) => point.lon);
  return { lat: (Math.min(...lats) + Math.max(...lats)) / 2, lon: (Math.min(...lons) + Math.max(...lons)) / 2 };
}

