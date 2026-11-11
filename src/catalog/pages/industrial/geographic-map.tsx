import { Card, CardContent, CardDescription, CardHeader, CardHeaderCenter, CardHeaderEnd, CardTitle } from '@cognite/aura/components/card';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import { useState } from 'react';

import { formatValue } from '../../../library/industrial/status';
import type { DotShape, Tone } from '../../../library/industrial/status';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { WORLD_OUTLINES } from '../../../library/three/scenes/continents';
import { interpolateGreatCircle } from '../../../library/three/scenes/geo';
import { GeoMap } from '../../../library/tools/geo-map/GeoMap';
import type { BlockLayer, MapMarker, MapRegion, MapRoute } from '../../../library/tools/geo-map/GeoMap';
import { LocatorMap } from '../../../library/tools/geo-map/LocatorMap';
import { MapInfoCard } from '../../../library/tools/geo-map/MapInfoCard';
import { MapLegend } from '../../../library/tools/geo-map/MapLegend';
import type { LegendLine, LegendStatus } from '../../../library/tools/geo-map/MapLegend';
import { MapScaleBar } from '../../../library/tools/geo-map/MapScaleBar';
import { kilometresPerPixel } from '../../../library/tools/geo-map/mapView';
import type { MapView } from '../../../library/tools/geo-map/mapView';
import { SiteMark } from '../../../library/tools/geo-map/SiteMark';
import { ZoomControls } from '../../../library/tools/geo-map/ZoomControls';
import { SITES } from '../../data/plant';
import { definePage } from '../../types';

import source from './geographic-map.tsx?raw';

type GeoMapRegionName = 'Norwegian Sea' | 'North Sea' | 'Barents Sea' | 'West coast';

type GeoMapState = 'producing' | 'reduced' | 'shut-in' | 'start-up' | 'maintenance';

type GeoMapSite = {
  id: string;
  name: string;
  region: GeoMapRegionName;
  lat: number;
  lon: number;
  kind: 'Platform' | 'Terminal' | 'LNG plant';
  state: GeoMapState;
  /** kboe per day, today. Terminals produce nothing themselves. */
  production: number;
  plan: number;
  availability: number;
  alarms: number;
  note: string;
};

/** Where the four shared sites lie, and what they do today. */
const GEOMAP_KNOWN: Readonly<Record<string, Omit<GeoMapSite, 'id' | 'name' | 'region'>>> = {
  nordkapp: { lat: 65.3, lon: 7.2, kind: 'Platform', state: 'reduced', production: 142, plan: 158, availability: 96.4, alarms: 4, note: 'Recompressor tripped 14 min ago' },
  'valhall-sor': { lat: 56.3, lon: 3.4, kind: 'Platform', state: 'reduced', production: 96, plan: 112, availability: 93.8, alarms: 2, note: 'Export compressor B tripped' },
  hammerfest: { lat: 70.7, lon: 23.6, kind: 'LNG plant', state: 'producing', production: 104, plan: 102, availability: 98.9, alarms: 2, note: 'Train 1 at full rate' },
  stord: { lat: 59.8, lon: 5.5, kind: 'Terminal', state: 'producing', production: 0, plan: 0, availability: 99.2, alarms: 1, note: 'One berth, crude lifting under way' },
};

const GEOMAP_REGIONS: readonly GeoMapRegionName[] = ['Norwegian Sea', 'North Sea', 'Barents Sea', 'West coast'];

function geoMapIsRegion(value: unknown): value is GeoMapRegionName {
  return GEOMAP_REGIONS.some((region) => region === value);
}

/** Sites invented for this page, named and placed like the shared ones along the Norwegian shelf. */
const GEOMAP_EXTRA: readonly GeoMapSite[] = [
  { id: 'voring-nord', name: 'Vøring Nord', region: 'Norwegian Sea', lat: 67.3, lon: 5.2, kind: 'Platform', state: 'maintenance', production: 0, plan: 0, availability: 0, alarms: 0, note: 'Planned turnaround, day 6 of 14' },
  { id: 'froya-vest', name: 'Frøya Vest', region: 'Norwegian Sea', lat: 63.7, lon: 6.1, kind: 'Platform', state: 'producing', production: 88, plan: 86, availability: 99.1, alarms: 1, note: 'All wells on stream' },
  { id: 'tampen-ost', name: 'Tampen Øst', region: 'North Sea', lat: 61.3, lon: 2.3, kind: 'Platform', state: 'producing', production: 118, plan: 120, availability: 98.2, alarms: 1, note: 'Water injection back at plan' },
  { id: 'utsira-sor', name: 'Utsira Sør', region: 'North Sea', lat: 58.8, lon: 2.4, kind: 'Platform', state: 'producing', production: 164, plan: 160, availability: 99.4, alarms: 0, note: 'Record week' },
  { id: 'utsira-nord', name: 'Utsira Nord', region: 'North Sea', lat: 58.95, lon: 2.65, kind: 'Platform', state: 'start-up', production: 31, plan: 60, availability: 90, alarms: 1, note: 'Ramping up after first oil' },
  { id: 'sleipner-ost', name: 'Sleipner Øst', region: 'North Sea', lat: 58.55, lon: 2.05, kind: 'Platform', state: 'producing', production: 74, plan: 72, availability: 97.6, alarms: 0, note: 'Gas plateau' },
  { id: 'tromsoflaket', name: 'Tromsøflaket', region: 'Barents Sea', lat: 71.9, lon: 19.4, kind: 'Platform', state: 'shut-in', production: 0, plan: 64, availability: 41.5, alarms: 3, note: 'Shut in on gas detection, 03:12' },
  { id: 'bjornoya-sor', name: 'Bjørnøya Sør', region: 'Barents Sea', lat: 73.4, lon: 22.4, kind: 'Platform', state: 'start-up', production: 38, plan: 70, availability: 88, alarms: 2, note: 'Ramping up after first oil' },
];

const GEOMAP_SITES: readonly GeoMapSite[] = [
  ...SITES.flatMap((site) => {
    const known = GEOMAP_KNOWN[site.id];
    return known && geoMapIsRegion(site.region) ? [{ id: site.id, name: site.name, region: site.region, ...known }] : [];
  }),
  ...GEOMAP_EXTRA,
];

const GEOMAP_STATES: Readonly<Record<GeoMapState, { label: string; tone: Tone; shape: DotShape }>> = {
  producing: { label: 'Producing', tone: 'success', shape: 'dot' },
  reduced: { label: 'Reduced', tone: 'warning', shape: 'square' },
  'shut-in': { label: 'Shut in', tone: 'critical', shape: 'diamond' },
  'start-up': { label: 'Start-up', tone: 'info', shape: 'dot' },
  maintenance: { label: 'Maintenance', tone: 'neutral', shape: 'ring' },
};

const GEOMAP_MARKERS: readonly MapMarker[] = GEOMAP_SITES.map((site) => ({
  id: site.id,
  name: site.name,
  position: { lat: site.lat, lon: site.lon },
  tone: GEOMAP_STATES[site.state].tone,
  shape: GEOMAP_STATES[site.state].shape,
  weight: site.production,
  statusLabel: GEOMAP_STATES[site.state].label.toLowerCase(),
  valueLabel: site.production > 0 ? `${formatValue(site.production)} kboe/d` : undefined,
}));

const GEOMAP_STATUS_LEGEND: readonly LegendStatus[] = (Object.keys(GEOMAP_STATES) as GeoMapState[]).map((state) => ({ id: state, ...GEOMAP_STATES[state] }));

const GEOMAP_LINE_LEGEND: readonly LegendLine[] = [
  { id: 'pipeline', label: 'Pipeline, flow direction', style: 'pipeline' },
  { id: 'idle', label: 'Pipeline, not flowing', style: 'idle' },
  { id: 'export', label: 'Export route', style: 'export' },
];

const GEOMAP_LEGEND = { statuses: GEOMAP_STATUS_LEGEND, lines: GEOMAP_LINE_LEGEND, sizeNote: 'Marker size follows production today.' };

function geoMapPoint(id: string) {
  const site = GEOMAP_SITES.find((candidate) => candidate.id === id);
  return site ? [{ lat: site.lat, lon: site.lon }] : [];
}

/** Pipelines run from each site to its terminal, bending where the seabed does. */
const GEOMAP_PIPELINES: readonly MapRoute[] = [
  { id: 'gas-nordkapp', name: 'Nordkapp to Stord', kind: 'pipeline', points: [...geoMapPoint('nordkapp'), { lat: 63.5, lon: 5.0 }, { lat: 61.0, lon: 4.3 }, ...geoMapPoint('stord')] },
  { id: 'gas-froya', name: 'Frøya Vest to Nordkapp trunk', kind: 'pipeline', points: [...geoMapPoint('froya-vest'), { lat: 63.5, lon: 5.0 }] },
  { id: 'gas-voring', name: 'Vøring Nord to Nordkapp', kind: 'pipeline', idle: true, points: [...geoMapPoint('voring-nord'), ...geoMapPoint('nordkapp')] },
  { id: 'gas-tampen', name: 'Tampen Øst to Stord', kind: 'pipeline', points: [...geoMapPoint('tampen-ost'), { lat: 60.5, lon: 4.1 }, ...geoMapPoint('stord')] },
  { id: 'gas-utsira', name: 'Utsira Sør to Stord', kind: 'pipeline', points: [...geoMapPoint('utsira-sor'), { lat: 59.3, lon: 4.2 }, ...geoMapPoint('stord')] },
  { id: 'gas-valhall', name: 'Valhall Sør to Stord', kind: 'pipeline', points: [...geoMapPoint('valhall-sor'), { lat: 58.2, lon: 4.3 }, ...geoMapPoint('stord')] },
  { id: 'gas-tromso', name: 'Tromsøflaket to Hammerfest', kind: 'pipeline', idle: true, points: [...geoMapPoint('tromsoflaket'), ...geoMapPoint('hammerfest')] },
  { id: 'gas-bjornoya', name: 'Bjørnøya Sør to Hammerfest', kind: 'pipeline', points: [...geoMapPoint('bjornoya-sor'), { lat: 72.0, lon: 23.0 }, ...geoMapPoint('hammerfest')] },
];

const GEOMAP_CARGO: readonly { id: string; name: string; from: string; to: { lat: number; lon: number } }[] = [
  { id: 'cargo-rotterdam', name: 'Stord to Rotterdam', from: 'stord', to: { lat: 51.95, lon: 4.1 } },
  { id: 'cargo-immingham', name: 'Stord to Immingham', from: 'stord', to: { lat: 53.6, lon: -0.2 } },
  { id: 'cargo-milford', name: 'Hammerfest to Milford Haven', from: 'hammerfest', to: { lat: 51.7, lon: -5.1 } },
  { id: 'cargo-cove-point', name: 'Hammerfest to Cove Point', from: 'hammerfest', to: { lat: 38.4, lon: -76.4 } },
];

/** Export routes follow the great circle from terminal to buyer. */
const GEOMAP_EXPORTS: readonly MapRoute[] = GEOMAP_CARGO.map((cargo) => {
  const from = geoMapPoint(cargo.from)[0];
  return { id: cargo.id, name: cargo.name, kind: 'export', points: Array.from({ length: 25 }, (_, index) => interpolateGreatCircle(from, cargo.to, index / 24)) };
});

const GEOMAP_ROUTES: readonly MapRoute[] = [...GEOMAP_PIPELINES, ...GEOMAP_EXPORTS];

const GEOMAP_REGION_SHAPES: readonly MapRegion[] = [
  {
    id: 'Norwegian Sea',
    name: 'Norwegian Sea',
    labelAt: { lat: 68.6, lon: 4 },
    points: [{ lat: 62.3, lon: -2 }, { lat: 62.3, lon: 5.8 }, { lat: 64, lon: 8.2 }, { lat: 65.5, lon: 11 }, { lat: 67, lon: 13 }, { lat: 69, lon: 15.5 }, { lat: 70.3, lon: 19 }, { lat: 72.5, lon: 19 }, { lat: 73, lon: 8 }, { lat: 70, lon: -3 }],
  },
  {
    id: 'North Sea',
    name: 'North Sea',
    labelAt: { lat: 56.2, lon: 3.8 },
    points: [{ lat: 53.5, lon: 2 }, { lat: 53.8, lon: 6.5 }, { lat: 55.5, lon: 8 }, { lat: 57, lon: 8 }, { lat: 58, lon: 7 }, { lat: 58.5, lon: 5.8 }, { lat: 60.4, lon: 4.8 }, { lat: 62, lon: 4.6 }, { lat: 62, lon: -1 }, { lat: 58.6, lon: -2 }, { lat: 56, lon: -2 }, { lat: 54.5, lon: 0 }],
  },
  {
    id: 'Barents Sea',
    name: 'Barents Sea',
    labelAt: { lat: 74.6, lon: 28 },
    points: [{ lat: 71.5, lon: 20 }, { lat: 71.5, lon: 31 }, { lat: 73, lon: 40 }, { lat: 77, lon: 40 }, { lat: 77, lon: 20 }],
  },
];

const GEOMAP_BLOCKS: BlockLayer = { box: { south: 56, north: 62, west: 0, east: 8 }, lonStep: 2, latStep: 1, licensedIds: ['B3', 'B6', 'B7', 'B10', 'B11', 'B14', 'B18', 'B22'] };

/** The shelf, from the Barents Sea to the southern North Sea. */
const GEOMAP_SHELF: MapView = { center: { lat: 64.2, lon: 14 }, scale: 880 };
const GEOMAP_NORTH_SEA: MapView = { center: { lat: 59.2, lon: 3.8 }, scale: 3600 };
const GEOMAP_UTSIRA: MapView = { center: { lat: 58.8, lon: 2.5 }, scale: 1800 };
const GEOMAP_WORLD: MapView = { center: { lat: 40, lon: 10 }, scale: 150 };
const GEOMAP_NORTH: MapView = { center: { lat: 66, lon: 14 }, scale: 700 };

function geoMapSelectedCard(marker: MapMarker, close: () => void) {
  const site = GEOMAP_SITES.find((candidate) => candidate.id === marker.id);
  if (!site) return null;
  return <GeoMapSiteCard site={site} onClose={close} />;
}

function GeoMapSiteCard({ site, onClose }: { site: GeoMapSite; onClose?: () => void }) {
  const status = GEOMAP_STATES[site.state];
  const gap = site.plan > 0 ? site.production - site.plan : null;
  return (
    <MapInfoCard
      title={site.name}
      subtitle={`${site.region} · ${site.kind}`}
      status={status}
      rows={[
        { label: 'Production', value: site.production > 0 ? `${formatValue(site.production)} kboe/d` : 'None' },
        { label: 'Against plan', value: gap === null ? 'No plan' : `${gap > 0 ? '+' : ''}${formatValue(gap)} kboe/d` },
        { label: 'Availability', value: `${formatValue(site.availability, 1)} %` },
        { label: 'Active alarms', value: String(site.alarms) },
        { label: 'Position', value: `${site.lat.toFixed(1)}° N, ${site.lon.toFixed(1)}° E` },
      ]}
      note={site.note}
      onClose={onClose}
    />
  );
}

function GeoMapFull() {
  return (
    <div className="h-[40rem] w-full">
      <GeoMap
        label="Map of the Norwegian shelf with 12 sites, pipelines and export routes"
        outlines={WORLD_OUTLINES}
        markers={GEOMAP_MARKERS}
        routes={GEOMAP_ROUTES}
        regions={GEOMAP_REGION_SHAPES}
        blocks={GEOMAP_BLOCKS}
        initialView={GEOMAP_SHELF}
        initialSize={{ width: 1000, height: 640 }}
        initialSelectedId="nordkapp"
        renderCard={geoMapSelectedCard}
        legend={GEOMAP_LEGEND}
      />
    </div>
  );
}

function GeoMapDarkScope() {
  return (
    <ThemeScope preset="control-room" className="w-full rounded-xl bg-base-background p-4">
      <div className="h-[36rem] w-full">
        <GeoMap
          label="Map of the Norwegian shelf in a dark theme"
          outlines={WORLD_OUTLINES}
          markers={GEOMAP_MARKERS}
          routes={GEOMAP_ROUTES}
          initialView={GEOMAP_SHELF}
          initialSize={{ width: 1000, height: 576 }}
          initialSelectedId="tromsoflaket"
          renderCard={geoMapSelectedCard}
          legend={GEOMAP_LEGEND}
        />
      </div>
    </ThemeScope>
  );
}

function GeoMapMarkerStates() {
  return (
    <svg role="img" aria-label="The five site states as map marks: producing, reduced, shut in, start-up and maintenance, each with its own shape" viewBox="0 0 360 150" width="100%" style={{ maxWidth: 360 }} className="block h-auto">
      {(Object.keys(GEOMAP_STATES) as GeoMapState[]).map((state, index) => {
        const status = GEOMAP_STATES[state];
        const x = 36 + index * 72;
        return (
          <g key={state}>
            <SiteMark x={x} y={44} tone={status.tone} shape={status.shape} radius={9} />
            <text x={x} y={86} textAnchor="middle" fontSize={11} className="fill-base-foreground">
              {status.label}
            </text>
            <text x={x} y={102} textAnchor="middle" fontSize={10} className="fill-muted-foreground">
              {status.shape}
            </text>
          </g>
        );
      })}
      <text x={180} y={136} textAnchor="middle" fontSize={10} className="fill-muted-foreground">
        Shape and label carry the state; colour repeats it.
      </text>
    </svg>
  );
}

function GeoMapMarkerSizes() {
  const sizes = [
    { label: 'No output', production: 0 },
    { label: '40 kboe/d', production: 40 },
    { label: '100 kboe/d', production: 100 },
    { label: '164 kboe/d', production: 164 },
  ];
  const max = 164;
  return (
    <svg role="img" aria-label="Marker size grows with production: from none to 164 thousand barrels of oil equivalent per day" viewBox="0 0 320 110" width="100%" style={{ maxWidth: 320 }} className="block h-auto">
      {sizes.map((size, index) => {
        const radius = 5 + 8 * Math.sqrt(size.production / max);
        const x = 40 + index * 80;
        return (
          <g key={size.label}>
            <SiteMark x={x} y={40} tone="success" shape="dot" radius={radius} />
            <text x={x} y={84} textAnchor="middle" fontSize={11} className="fill-base-foreground tabular-nums">
              {size.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function GeoMapClusterZoom() {
  return (
    <div className="h-80 w-full">
      <GeoMap
        label="Map of the North Sea where three platforms close together form a cluster"
        outlines={WORLD_OUTLINES}
        markers={GEOMAP_MARKERS}
        initialView={GEOMAP_UTSIRA}
        initialSize={{ width: 640, height: 320 }}
        chrome="minimal"
        wheelZoom={false}
        clusterRadius={44}
      />
    </div>
  );
}

function GeoMapRouteStyles() {
  const rows: { label: string; note: string; style: 'pipeline' | 'idle' | 'export' }[] = [
    { label: 'Pipeline', note: 'Chevrons show the flow direction', style: 'pipeline' },
    { label: 'Pipeline, not flowing', note: 'Dotted while the source site is down', style: 'idle' },
    { label: 'Export route', note: 'Dashed great circle to the buyer', style: 'export' },
  ];
  return (
    <svg role="img" aria-label="Three route styles: a solid pipeline with direction chevrons, a dotted pipeline that is not flowing, and a dashed export route" viewBox="0 0 340 150" width="100%" style={{ maxWidth: 340 }} className="block h-auto">
      {rows.map((row, index) => {
        const y = 28 + index * 44;
        return (
          <g key={row.style}>
            <path d={`M16 ${y} H120`} fill="none" strokeLinecap="round" strokeWidth={row.style === 'export' ? 1.25 : 2} strokeDasharray={row.style === 'idle' ? '1 5' : row.style === 'export' ? '6 4' : undefined} className={row.style === 'export' ? 'stroke-muted-foreground' : 'stroke-medium-foreground'} />
            {row.style === 'pipeline' ? [40, 80].map((x) => <path key={x} d={`M${x - 3.5} ${y - 3.5} L${x + 2.5} ${y} L${x - 3.5} ${y + 3.5}`} fill="none" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="stroke-medium-foreground" />) : null}
            <text x={136} y={y - 2} fontSize={12} className="fill-base-foreground">
              {row.label}
            </text>
            <text x={136} y={y + 12} fontSize={10} className="fill-muted-foreground">
              {row.note}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function GeoMapSelectedSite() {
  const site = GEOMAP_SITES.find((candidate) => candidate.id === 'nordkapp');
  return <div className="w-full max-w-xs">{site ? <GeoMapSiteCard site={site} onClose={() => {}} /> : null}</div>;
}

function GeoMapLegendOnly() {
  return (
    <div className="w-full max-w-60 rounded-lg border border-default bg-card-background p-3">
      <MapLegend {...GEOMAP_LEGEND} />
    </div>
  );
}

function GeoMapScaleBars() {
  const size = { width: 800, height: 520 };
  const cases = [
    { label: 'Equator, zoom 3', view: { center: { lat: 0, lon: 10 }, scale: 600 } },
    { label: '60° N, zoom 3', view: { center: { lat: 60, lon: 10 }, scale: 600 } },
    { label: '70° N, zoom 6', view: { center: { lat: 70, lon: 23 }, scale: 4800 } },
  ];
  return (
    <ul className="flex flex-col gap-3">
      {cases.map((item) => (
        <li key={item.label} className="flex items-end justify-between gap-6">
          <span className="text-xs text-muted-foreground">{item.label}</span>
          <MapScaleBar kmPerPixel={kilometresPerPixel('mercator', item.view, size)} />
        </li>
      ))}
    </ul>
  );
}

function GeoMapZoomButtons() {
  const [zoom, setZoom] = useState(3);
  return (
    <div className="flex items-center gap-4">
      <ZoomControls onZoomIn={() => setZoom((value) => Math.min(8, value + 1))} onZoomOut={() => setZoom((value) => Math.max(1, value - 1))} onFit={() => setZoom(3)} onHome={() => setZoom(3)} canZoomIn={zoom < 8} canZoomOut={zoom > 1} canGoBack={false} onBack={() => {}} />
      <output className="text-sm tabular-nums text-medium-foreground">Zoom {zoom}</output>
    </div>
  );
}

function GeoMapProjections() {
  return (
    <div className="grid w-full gap-4 md:grid-cols-2">
      {(['mercator', 'equal-area'] as const).map((projection) => (
        <figure key={projection} className="flex flex-col gap-2">
          <div className="h-64">
            <GeoMap label={`The Nordic region in ${projection === 'mercator' ? 'Mercator' : 'equal-area'} projection`} outlines={WORLD_OUTLINES} markers={GEOMAP_MARKERS} projection={projection} initialView={{ center: { lat: 64, lon: 14 }, scale: 270 }} initialSize={{ width: 420, height: 256 }} chrome="none" wheelZoom={false} clusterRadius={10} />
          </div>
          <figcaption className="text-xs text-muted-foreground">{projection === 'mercator' ? 'Mercator keeps angles; areas grow toward the pole.' : 'Equal area keeps areas true; shapes bend away from the centre.'}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function GeoMapLocatorMini() {
  return (
    <div className="flex w-full max-w-48 flex-col gap-2">
      <LocatorMap
        label="Locator: the North Sea area shown on the main map, in north-west Europe"
        outlines={WORLD_OUTLINES}
        view={{ center: { lat: 58, lon: 10 }, scale: 380 }}
        size={{ width: 192, height: 140 }}
        focus={{ south: 56, north: 62, west: 0, east: 8 }}
        points={geoMapPoint('utsira-sor')}
      />
      <span className="text-xs text-muted-foreground">North Sea, blocks B1 to B24</span>
    </div>
  );
}

function GeoMapRegionHighlight() {
  const [region, setRegion] = useState<GeoMapRegionName>('North Sea');
  const shown = GEOMAP_SITES.filter((site) => site.region === region);
  return (
    <div className="flex w-full flex-col gap-3">
      <SegmentedControl
        value={region}
        onValueChange={(next) => {
          if (geoMapIsRegion(next)) setRegion(next);
        }}
      >
        <SegmentedControlList size="small" aria-label="Region">
          {(['Norwegian Sea', 'North Sea', 'Barents Sea'] as const).map((name) => (
            <SegmentedControlButton key={name} value={name}>
              {name}
            </SegmentedControlButton>
          ))}
        </SegmentedControlList>
      </SegmentedControl>
      <div className="h-80">
        <GeoMap label={`Map with the ${region} outlined`} outlines={WORLD_OUTLINES} markers={GEOMAP_MARKERS} regions={GEOMAP_REGION_SHAPES} highlightedRegionId={region} initialView={GEOMAP_NORTH} initialSize={{ width: 720, height: 320 }} chrome="minimal" wheelZoom={false} />
      </div>
      <p className="text-xs text-muted-foreground">
        {shown.length} {shown.length === 1 ? 'site' : 'sites'} in the {region}: {shown.map((site) => site.name).join(', ')}.
      </p>
    </div>
  );
}

function GeoMapLoading() {
  return (
    <div className="h-72 w-full">
      <GeoMap label="Map of the Norwegian shelf while sites load" outlines={WORLD_OUTLINES} initialView={GEOMAP_NORTH} initialSize={{ width: 640, height: 288 }} chrome="minimal" wheelZoom={false} loading loadingText="Loading 12 sites" />
    </div>
  );
}

function GeoMapNoData() {
  const regions: readonly MapRegion[] = GEOMAP_REGION_SHAPES.map((region) => (region.id === 'Barents Sea' ? { ...region, noData: true } : region));
  const visible = GEOMAP_MARKERS.filter((marker) => !['tromsoflaket', 'bjornoya-sor', 'hammerfest'].includes(marker.id));
  return (
    <div className="h-72 w-full">
      <GeoMap label="Map where the Barents Sea has no data" outlines={WORLD_OUTLINES} markers={visible} regions={regions} initialView={GEOMAP_NORTH} initialSize={{ width: 640, height: 288 }} chrome="minimal" wheelZoom={false} />
    </div>
  );
}

function GeoMapBlocks() {
  return (
    <div className="h-80 w-full">
      <GeoMap
        label="Map of the North Sea with a grid of licence blocks, eight of them licensed"
        outlines={WORLD_OUTLINES}
        markers={GEOMAP_MARKERS}
        blocks={GEOMAP_BLOCKS}
        layers={{ blocks: true, exports: false }}
        initialView={GEOMAP_NORTH_SEA}
        initialSize={{ width: 720, height: 320 }}
        chrome="minimal"
        wheelZoom={false}
      />
    </div>
  );
}

function GeoMapCompactCard() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Fleet position</CardTitle>
          <CardDescription>12 sites, 3 need attention</CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <span className="text-xs tabular-nums text-muted-foreground">1,420 kboe/d</span>
        </CardHeaderEnd>
      </CardHeader>
      <CardContent className="w-full">
        <div className="h-52 w-full">
          <GeoMap label="Compact map of fleet sites" outlines={WORLD_OUTLINES} markers={GEOMAP_MARKERS} initialView={{ center: { lat: 65, lon: 14 }, scale: 560 }} initialSize={{ width: 380, height: 208 }} chrome="none" wheelZoom={false} className="size-full" />
        </div>
      </CardContent>
    </Card>
  );
}

function GeoMapPipelinesOnly() {
  return (
    <div className="h-80 w-full">
      <GeoMap
        label="Map of the pipelines from platforms to the Stord terminal, with flow direction"
        outlines={WORLD_OUTLINES}
        markers={GEOMAP_MARKERS}
        routes={GEOMAP_PIPELINES}
        layers={{ exports: false }}
        initialView={GEOMAP_NORTH_SEA}
        initialSize={{ width: 720, height: 320 }}
        chrome="minimal"
        wheelZoom={false}
      />
    </div>
  );
}

function GeoMapWorld() {
  return (
    <div className="h-80 w-full">
      <GeoMap label="World map with export routes from the Norwegian terminals" outlines={WORLD_OUTLINES} markers={GEOMAP_MARKERS} routes={GEOMAP_EXPORTS} initialView={GEOMAP_WORLD} initialSize={{ width: 720, height: 320 }} chrome="minimal" wheelZoom={false} />
    </div>
  );
}

export default definePage({
  id: 'geographic-map',
  title: 'Geographic map',
  summary:
    'A projected vector map with no tiles: coastlines, a graticule, sites as status marks sized by production, clusters that split on zoom, pipelines with direction, export routes and licence blocks. Drag, zoom and use the keyboard.',
  guidance: {
    use: [
      'A map when where things are decides what to do: routes, nearby sites, regional rollups.',
      'Shape and label for status, size for a quantity, and cluster counts that name what is inside.',
      'A scale bar true for the latitude shown, and a projection switch where shape or area matters.',
    ],
    avoid: [
      'Tiles and street detail for a plant overview; a schematic or a list says it more clearly.',
      'Colour as the only status cue, or markers so large that neighbours hide each other.',
      'Wheel zoom inside a scrolling page without saying so; keep it for dedicated maps.',
    ],
  },
  source,
  sections: [
    {
      id: 'maps',
      title: 'Working maps',
      description: 'Drag to pan, scroll or use the buttons to zoom, click a site, open Layers, switch the projection.',
      specimens: [
        {
          id: 'GeoMapFull',
          title: 'Fleet map',
          note: 'The whole shelf with sites, clusters, pipelines, export routes, licence blocks, a site card and a legend.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: [
            'tools/geo-map/GeoMap.tsx',
            'tools/geo-map/mapReducer.ts',
            'tools/geo-map/mapView.ts',
            'tools/geo-map/projection.ts',
            'tools/geo-map/clustering.ts',
            'tools/geo-map/geoPaths.ts',
            'tools/geo-map/MapInfoCard.tsx',
            'tools/geo-map/MapLegend.tsx',
            'tools/geo-map/MapScaleBar.tsx',
            'tools/geo-map/ZoomControls.tsx',
            'tools/geo-map/SiteMark.tsx',
            'three/scenes/continents.ts',
          ],
          Component: GeoMapFull,
        },
        {
          id: 'GeoMapDarkScope',
          title: 'Dark control-room scope',
          note: 'The same map in a dark theme scope, opened on a shut-in site.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'chrome',
          uses: ['themes/ThemeScope.tsx', 'tools/geo-map/GeoMap.tsx'],
          Component: GeoMapDarkScope,
        },
      ],
    },
    {
      id: 'marks',
      title: 'Marks and parts',
      description: 'The building blocks of the map, shown on their own.',
      specimens: [
        {
          id: 'GeoMapMarkerStates',
          title: 'Marker states',
          note: 'Five states, five shapes: a status never rests on colour alone.',
          origin: 'custom',
          size: 'md',
          uses: ['tools/geo-map/SiteMark.tsx'],
          Component: GeoMapMarkerStates,
        },
        {
          id: 'GeoMapMarkerSizes',
          title: 'Marker sizes',
          note: 'Area follows production, so a large platform stands out without hiding its neighbours.',
          origin: 'custom',
          size: 'md',
          uses: ['tools/geo-map/SiteMark.tsx', 'tools/geo-map/tones.ts'],
          Component: GeoMapMarkerSizes,
        },
        {
          id: 'GeoMapClusterZoom',
          title: 'Cluster',
          note: 'Sites too close to tell apart merge into a counted group; choose it to zoom in and split it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/geo-map/GeoMap.tsx', 'tools/geo-map/clustering.ts'],
          Component: GeoMapClusterZoom,
        },
        {
          id: 'GeoMapRouteStyles',
          title: 'Route styles',
          note: 'Solid with chevrons for flowing pipelines, dotted when idle, dashed for export routes.',
          origin: 'custom',
          size: 'md',
          uses: [],
          Component: GeoMapRouteStyles,
        },
        {
          id: 'GeoMapSelectedSite',
          title: 'Site card',
          note: 'What a selected marker opens: state in words, figures against plan and the latest note.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['tools/geo-map/MapInfoCard.tsx'],
          Component: GeoMapSelectedSite,
        },
        {
          id: 'GeoMapLegendOnly',
          title: 'Legend',
          note: 'Status marks with their shapes, line styles and what size means.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['tools/geo-map/MapLegend.tsx'],
          Component: GeoMapLegendOnly,
        },
        {
          id: 'GeoMapScaleBars',
          title: 'Scale bars',
          note: 'Round-numbered and true for the latitude: the same zoom covers fewer kilometres per pixel at 60° than at the equator.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['tools/geo-map/MapScaleBar.tsx', 'tools/geo-map/scaleBar.ts'],
          Component: GeoMapScaleBars,
        },
        {
          id: 'GeoMapZoomButtons',
          title: 'Zoom controls',
          note: 'Zoom, fit, reset and previous view as labelled icon buttons, with disabled ends.',
          origin: 'custom',
          size: 'sm',
          uses: ['tools/geo-map/ZoomControls.tsx'],
          Component: GeoMapZoomButtons,
        },
      ],
    },
    {
      id: 'projections',
      title: 'Projections and regions',
      description: 'Choose the projection for the question, and highlight a region to filter by.',
      specimens: [
        {
          id: 'GeoMapProjections',
          title: 'Projections compared',
          note: 'Mercator for navigation and angles, equal area when comparing sizes.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['tools/geo-map/GeoMap.tsx', 'tools/geo-map/projection.ts'],
          Component: GeoMapProjections,
        },
        {
          id: 'GeoMapLocatorMini',
          title: 'Locator map',
          note: 'A small fixed map that answers where the main view is.',
          origin: 'custom',
          size: 'sm',
          uses: ['tools/geo-map/LocatorMap.tsx'],
          Component: GeoMapLocatorMini,
        },
        {
          id: 'GeoMapRegionHighlight',
          title: 'Region highlight',
          note: 'Pick a region to outline it on the map and list its sites; no colour scale is implied.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['tools/geo-map/GeoMap.tsx'],
          Component: GeoMapRegionHighlight,
        },
        {
          id: 'GeoMapBlocks',
          title: 'Licence blocks',
          note: 'A block grid with licensed blocks shaded and labelled once zoomed in.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/geo-map/GeoMap.tsx', 'tools/geo-map/geoPaths.ts'],
          Component: GeoMapBlocks,
        },
        {
          id: 'GeoMapPipelinesOnly',
          title: 'Pipelines with direction',
          note: 'Chevrons every 84 pixels show which way gas flows; dotted lines are not flowing now.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/geo-map/GeoMap.tsx'],
          Component: GeoMapPipelinesOnly,
        },
      ],
    },
    {
      id: 'states',
      title: 'States and compositions',
      description: 'Loading, missing data, a world view and a map inside a card.',
      specimens: [
        {
          id: 'GeoMapLoading',
          title: 'Loading sites',
          note: 'The coast draws at once; a status says what is still on its way.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/geo-map/GeoMap.tsx'],
          Component: GeoMapLoading,
        },
        {
          id: 'GeoMapNoData',
          title: 'Region with no data',
          note: 'A hatched region named "no data" tells people the gap is real, not a loading failure.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/geo-map/GeoMap.tsx'],
          Component: GeoMapNoData,
        },
        {
          id: 'GeoMapWorld',
          title: 'Export routes',
          note: 'At world zoom the routes read as arcs from terminal to buyer.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/geo-map/GeoMap.tsx'],
          Component: GeoMapWorld,
        },
        {
          id: 'GeoMapCompactCard',
          title: 'Compact map in a card',
          note: 'An overview tile: no controls, no wheel zoom, the page keeps scrolling.',
          origin: 'custom',
          size: 'md',
          uses: ['tools/geo-map/GeoMap.tsx'],
          Component: GeoMapCompactCard,
        },
      ],
    },
  ],
});
