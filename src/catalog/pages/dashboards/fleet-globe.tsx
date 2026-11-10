import { Button } from '@cognite/aura/components/button';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import { IconWorld, IconX } from '@cognite/aura/icons';
import { useReducer } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

import { Sparkline } from '../../../library/industrial/Sparkline';
import { formatValue } from '../../../library/industrial/status';
import type { DotShape, Tone } from '../../../library/industrial/status';
import { StatusDot } from '../../../library/industrial/StatusDot';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { TrendDelta } from '../../../library/industrial/TrendDelta';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { SceneCanvas } from '../../../library/three/SceneCanvas';
import { WORLD_OUTLINES } from '../../../library/three/scenes/continents';
import { FleetGlobe } from '../../../library/three/scenes/FleetGlobe';
import type { GlobeRoute, GlobeSite } from '../../../library/three/scenes/FleetGlobe';
import { greatCircleKm, markerRadius } from '../../../library/three/scenes/geo';
import type { GlobeView, LatLong } from '../../../library/three/scenes/geo';
import { focusView, groupView } from '../../../library/three/scenes/globeFocus';
import { StillScene } from '../../../library/three/scenes/StillScene';
import { SITES } from '../../data/plant';
import { DAY, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './fleet-globe.tsx?raw';

type FleetGlobeRegion = 'Norwegian Sea' | 'North Sea' | 'Barents Sea' | 'West coast';

type FleetGlobeState = 'producing' | 'reduced' | 'shut-in' | 'start-up' | 'maintenance';

type FleetGlobeSite = LatLong & {
  id: string;
  name: string;
  region: FleetGlobeRegion;
  kind: 'Platform' | 'Terminal' | 'LNG plant';
  state: FleetGlobeState;
  /** kboe per day, today. Terminals produce nothing themselves. */
  production: number;
  plan: number;
  availability: number;
  alarms: { critical: number; high: number; medium: number };
  /** The terminal this site exports to. */
  exportTo: string | null;
  note: string;
  seed: number;
};

/** Where the four shared sites lie, and what they do today. */
const FLEETGLOBE_KNOWN: Readonly<Record<string, Omit<FleetGlobeSite, 'id' | 'name' | 'region'>>> = {
  nordkapp: { lat: 65.3, lon: 7.2, kind: 'Platform', state: 'reduced', production: 142, plan: 158, availability: 96.4, alarms: { critical: 1, high: 2, medium: 1 }, exportTo: 'stord', note: 'Recompressor tripped 14 min ago', seed: 501 },
  'valhall-sor': { lat: 56.3, lon: 3.4, kind: 'Platform', state: 'reduced', production: 96, plan: 112, availability: 93.8, alarms: { critical: 1, high: 1, medium: 0 }, exportTo: 'stord', note: 'Export compressor B tripped', seed: 502 },
  hammerfest: { lat: 70.7, lon: 23.6, kind: 'LNG plant', state: 'producing', production: 104, plan: 102, availability: 98.9, alarms: { critical: 0, high: 0, medium: 2 }, exportTo: null, note: 'Train 1 at full rate', seed: 503 },
  stord: { lat: 59.8, lon: 5.5, kind: 'Terminal', state: 'producing', production: 0, plan: 0, availability: 99.2, alarms: { critical: 0, high: 0, medium: 1 }, exportTo: null, note: 'One berth, crude lifting under way', seed: 504 },
};

const FLEETGLOBE_REGIONS: readonly FleetGlobeRegion[] = ['Norwegian Sea', 'North Sea', 'Barents Sea', 'West coast'];

function fleetGlobeIsRegion(value: unknown): value is FleetGlobeRegion {
  return FLEETGLOBE_REGIONS.some((region) => region === value);
}

/** Sites invented for this page, named and placed like the shared ones along the Norwegian shelf. */
const FLEETGLOBE_EXTRA: readonly FleetGlobeSite[] = [
  { id: 'voring-nord', name: 'Vøring Nord', region: 'Norwegian Sea', lat: 67.3, lon: 5.2, kind: 'Platform', state: 'maintenance', production: 0, plan: 0, availability: 0, alarms: { critical: 0, high: 0, medium: 0 }, exportTo: 'stord', note: 'Planned turnaround, day 6 of 14', seed: 505 },
  { id: 'froya-vest', name: 'Frøya Vest', region: 'Norwegian Sea', lat: 63.7, lon: 6.1, kind: 'Platform', state: 'producing', production: 88, plan: 86, availability: 99.1, alarms: { critical: 0, high: 0, medium: 1 }, exportTo: 'stord', note: 'All wells on stream', seed: 506 },
  { id: 'tampen-ost', name: 'Tampen Øst', region: 'North Sea', lat: 61.3, lon: 2.3, kind: 'Platform', state: 'producing', production: 118, plan: 120, availability: 98.2, alarms: { critical: 0, high: 1, medium: 0 }, exportTo: 'stord', note: 'Water injection back at plan', seed: 507 },
  { id: 'utsira-sor', name: 'Utsira Sør', region: 'North Sea', lat: 58.8, lon: 2.4, kind: 'Platform', state: 'producing', production: 164, plan: 160, availability: 99.4, alarms: { critical: 0, high: 0, medium: 0 }, exportTo: 'stord', note: 'Record week', seed: 508 },
  { id: 'tromsoflaket', name: 'Tromsøflaket', region: 'Barents Sea', lat: 71.9, lon: 19.4, kind: 'Platform', state: 'shut-in', production: 0, plan: 64, availability: 41.5, alarms: { critical: 2, high: 1, medium: 0 }, exportTo: 'hammerfest', note: 'Shut in on gas detection, 03:12', seed: 509 },
  { id: 'bjornoya-sor', name: 'Bjørnøya Sør', region: 'Barents Sea', lat: 73.4, lon: 22.4, kind: 'Platform', state: 'start-up', production: 38, plan: 70, availability: 88, alarms: { critical: 0, high: 0, medium: 2 }, exportTo: 'hammerfest', note: 'Ramping up after first oil', seed: 510 },
];

function fleetGlobeKnown(): FleetGlobeSite[] {
  return SITES.flatMap((site) => {
    const known = FLEETGLOBE_KNOWN[site.id];
    return known && fleetGlobeIsRegion(site.region) ? [{ id: site.id, name: site.name, region: site.region, ...known }] : [];
  });
}

const FLEETGLOBE_SITES: readonly FleetGlobeSite[] = [...fleetGlobeKnown(), ...FLEETGLOBE_EXTRA];

/** Where cargoes go from the two terminals. Drawn as quiet arcs; not part of the fleet. */
const FLEETGLOBE_CARGO: readonly { id: string; from: string; name: string; to: LatLong }[] = [
  { id: 'cargo-rotterdam', from: 'stord', name: 'Rotterdam', to: { lat: 51.95, lon: 4.1 } },
  { id: 'cargo-immingham', from: 'stord', name: 'Immingham', to: { lat: 53.6, lon: -0.2 } },
  { id: 'cargo-milford', from: 'hammerfest', name: 'Milford Haven', to: { lat: 51.7, lon: -5.1 } },
  { id: 'cargo-cove-point', from: 'hammerfest', name: 'Cove Point', to: { lat: 38.4, lon: -76.4 } },
];

const FLEETGLOBE_STATES: Readonly<Record<FleetGlobeState, { label: string; tone: Tone; shape: DotShape }>> = {
  producing: { label: 'Producing', tone: 'success', shape: 'dot' },
  reduced: { label: 'Reduced', tone: 'warning', shape: 'square' },
  'shut-in': { label: 'Shut in', tone: 'critical', shape: 'diamond' },
  'start-up': { label: 'Start-up', tone: 'info', shape: 'dot' },
  maintenance: { label: 'Maintenance', tone: 'neutral', shape: 'ring' },
};

const FLEETGLOBE_RADIUS = 10;

const FLEETGLOBE_OVERVIEW: GlobeView = { lat: 50, lon: 4, distance: FLEETGLOBE_RADIUS * 3.4 };

const FLEETGLOBE_MAX_PRODUCTION = Math.max(...FLEETGLOBE_SITES.map((site) => site.production));

const FLEETGLOBE_FILTERS = ['All', 'Norwegian Sea', 'North Sea', 'Barents Sea'] as const;

type FleetGlobeFilter = (typeof FLEETGLOBE_FILTERS)[number];

function fleetGlobeIsFilter(value: unknown): value is FleetGlobeFilter {
  return FLEETGLOBE_FILTERS.some((filter) => filter === value);
}

const FLEETGLOBE_GLASS = 'border border-default bg-[color-mix(in_oklab,var(--card-background)_82%,transparent)] backdrop-blur-md';

const FLEETGLOBE_FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring-default)]';

function fleetGlobeSite(id: string | null): FleetGlobeSite | undefined {
  return FLEETGLOBE_SITES.find((site) => site.id === id);
}

function fleetGlobeInFilter(site: FleetGlobeSite, filter: FleetGlobeFilter): boolean {
  if (filter === 'All' || site.region === filter) return true;
  // A terminal stays lit while a site in the region exports to it.
  return FLEETGLOBE_SITES.some((other) => other.region === filter && other.exportTo === site.id);
}

function fleetGlobeAlarmCount(site: FleetGlobeSite): number {
  return site.alarms.critical + site.alarms.high + site.alarms.medium;
}

function fleetGlobeTrend(site: FleetGlobeSite): number[] {
  if (site.plan === 0 && site.production === 0) return Array.from({ length: 28 }, () => 0);
  const raw = makeValues({ seed: site.seed, points: 28, base: Math.max(site.plan, site.production), amplitude: site.plan * 0.03, noise: site.plan * 0.02, cycles: 2, stepMs: DAY / 4, decimals: 1 });
  // The last day bends to today's figure, so the trend ends on the number in the card.
  return raw.map((value, index) => (index < 22 ? value : value + ((site.production - value) * (index - 21)) / 6));
}

type FleetGlobeUi = { selectedId: string | null; filter: FleetGlobeFilter; spinning: boolean; resets: number };

type FleetGlobeAction = { type: 'select'; id: string } | { type: 'clear' } | { type: 'filter'; filter: FleetGlobeFilter } | { type: 'interact' } | { type: 'overview' };

const FLEETGLOBE_INITIAL: FleetGlobeUi = { selectedId: null, filter: 'All', spinning: true, resets: 0 };

function fleetGlobeReducer(state: FleetGlobeUi, action: FleetGlobeAction): FleetGlobeUi {
  switch (action.type) {
    case 'select':
      return { ...state, selectedId: action.id === state.selectedId ? null : action.id, spinning: false };
    case 'clear':
      return state.selectedId ? { ...state, selectedId: null } : state;
    case 'filter': {
      const selected = fleetGlobeSite(state.selectedId);
      const keep = selected && fleetGlobeInFilter(selected, action.filter);
      return { ...state, selectedId: keep ? state.selectedId : null, filter: action.filter, spinning: false };
    }
    case 'interact':
      return state.spinning ? { ...state, spinning: false } : state;
    case 'overview':
      // Counting resets lets the camera fly home even when the view itself has not changed.
      return { selectedId: null, filter: 'All', spinning: false, resets: state.resets + 1 };
  }
}

/** Where the camera goes: onto the selected site, over the filtered region, or back to the whole globe. */
function fleetGlobeView(state: FleetGlobeUi): GlobeView {
  const selected = fleetGlobeSite(state.selectedId);
  if (selected) return focusView(selected, FLEETGLOBE_RADIUS);
  if (state.filter === 'All') return FLEETGLOBE_OVERVIEW;
  return (
    groupView(
      FLEETGLOBE_SITES.filter((site) => site.region === state.filter),
      FLEETGLOBE_RADIUS,
      { near: 2.3 }
    ) ?? FLEETGLOBE_OVERVIEW
  );
}

function fleetGlobeMarkers(filter: FleetGlobeFilter): GlobeSite[] {
  return FLEETGLOBE_SITES.map((site) => {
    const status = FLEETGLOBE_STATES[site.state];
    const abnormal = site.state === 'shut-in' || site.state === 'reduced';
    return {
      id: site.id,
      name: site.name,
      lat: site.lat,
      lon: site.lon,
      size: site.kind === 'Terminal' ? 0.075 : markerRadius(site.production, FLEETGLOBE_MAX_PRODUCTION, 0.045, 0.11),
      tone: status.tone,
      status: status.label,
      dot: status.shape,
      shape: site.kind === 'Platform' ? 'dot' : 'diamond',
      pulse: abnormal,
      dimmed: !fleetGlobeInFilter(site, filter),
    };
  });
}

function fleetGlobeRoutes(filter: FleetGlobeFilter): GlobeRoute[] {
  const exports = FLEETGLOBE_SITES.flatMap((site) => {
    const terminal = fleetGlobeSite(site.exportTo);
    return terminal ? [{ id: `export-${site.id}`, from: site, to: terminal, flow: site.production > 0, dimmed: !fleetGlobeInFilter(site, filter) || site.production === 0 }] : [];
  });
  const cargo = FLEETGLOBE_CARGO.flatMap((route) => {
    const terminal = fleetGlobeSite(route.from);
    return terminal ? [{ id: route.id, from: terminal, to: route.to, quiet: true, dimmed: !fleetGlobeInFilter(terminal, filter) }] : [];
  });
  return [...exports, ...cargo];
}

function FleetGlobeFilterSwitch({ value, onChange }: { value: FleetGlobeFilter; onChange: (filter: FleetGlobeFilter) => void }) {
  return (
    <SegmentedControl
      value={value}
      onValueChange={(next) => {
        if (fleetGlobeIsFilter(next)) onChange(next);
      }}
    >
      <SegmentedControlList size="small" aria-label="Region">
        {FLEETGLOBE_FILTERS.map((filter) => (
          <SegmentedControlButton key={filter} value={filter}>
            {filter}
          </SegmentedControlButton>
        ))}
      </SegmentedControlList>
    </SegmentedControl>
  );
}

function FleetGlobeSiteList({ filter, selectedId, onSelect }: { filter: FleetGlobeFilter; selectedId: string | null; onSelect: (id: string) => void }) {
  return (
    <ul aria-label="Sites" className="flex flex-col">
      {FLEETGLOBE_SITES.map((site) => {
        const status = FLEETGLOBE_STATES[site.state];
        const inFilter = fleetGlobeInFilter(site, filter);
        return (
          <li key={site.id}>
            <button
              type="button"
              aria-pressed={site.id === selectedId}
              aria-label={`${site.name}, ${site.region}, ${status.label.toLowerCase()}${site.kind === 'Terminal' ? '' : `, ${site.production} thousand barrels a day`}`}
              onClick={() => onSelect(site.id)}
              className={`-mx-1.5 flex w-[calc(100%+0.75rem)] flex-col gap-1 rounded-md px-1.5 py-2 text-left hover:bg-secondary-background aria-pressed:bg-secondary-background ${inFilter ? '' : 'opacity-45'} ${FLEETGLOBE_FOCUS}`}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="min-w-0 truncate text-sm text-base-foreground">{site.name}</span>
                {site.kind === 'Terminal' ? (
                  <span className="shrink-0 text-xs text-muted-foreground">Terminal</span>
                ) : (
                  <span className="shrink-0 text-sm tabular-nums text-base-foreground">
                    {site.production} <span className="text-xs text-muted-foreground">kboe/d</span>
                  </span>
                )}
              </span>
              <span className="flex items-center justify-between gap-2">
                <StatusIndicator tone={status.tone} shape={status.shape} label={status.label} size="sm" className="shrink-0" />
                <span className="min-w-0 truncate text-xs text-muted-foreground">{site.region}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function FleetGlobeStat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="flex flex-col gap-0.5">{children}</dd>
    </div>
  );
}

function FleetGlobeSiteCard({ site, onClose }: { site: FleetGlobeSite; onClose?: () => void }) {
  const status = FLEETGLOBE_STATES[site.state];
  const terminal = fleetGlobeSite(site.exportTo);
  const feeders = FLEETGLOBE_SITES.filter((other) => other.exportTo === site.id);

  return (
    <section aria-label={`${site.name} site card`} className={`flex flex-col gap-3 rounded-xl p-3 ${FLEETGLOBE_GLASS}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-base-foreground">{site.name}</h4>
          <p className="text-xs text-muted-foreground">
            {site.kind} · {site.region}
          </p>
        </div>
        {onClose ? (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <IconX /> Close
          </Button>
        ) : null}
      </div>
      <div className="flex flex-col gap-0.5">
        <StatusIndicator tone={status.tone} shape={status.shape} label={status.label} size="sm" pulse={site.state === 'shut-in'} />
        <span className="text-xs text-muted-foreground">{site.note}</span>
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-3 border-t border-default pt-3">
        {site.kind === 'Terminal' ? (
          <FleetGlobeStat label="Receiving from">
            <ValueReadout value={feeders.length} unit="sites" size="sm" />
          </FleetGlobeStat>
        ) : (
          <FleetGlobeStat label="Production">
            <ValueReadout value={site.production} unit="kboe/d" size="sm" tone={site.state === 'shut-in' ? 'critical' : 'neutral'} />
            <TrendDelta value={site.production} reference={site.plan} decimals={0} goodDirection="up" caption="vs plan" size="sm" />
          </FleetGlobeStat>
        )}
        <FleetGlobeStat label="Availability">
          <ValueReadout value={site.availability} unit="%" decimals={1} size="sm" />
        </FleetGlobeStat>
      </dl>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Open alarms</span>
        {fleetGlobeAlarmCount(site) === 0 ? (
          <span className="text-sm text-muted-foreground">None</span>
        ) : (
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm tabular-nums text-base-foreground">
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <StatusDot tone="critical" shape="diamond" size="sm" />
              {site.alarms.critical} critical
            </span>
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <StatusDot tone="warning" shape="square" size="sm" />
              {site.alarms.high} high
            </span>
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <StatusDot tone="info" shape="dot" size="sm" />
              {site.alarms.medium} medium
            </span>
          </span>
        )}
      </div>

      {site.kind === 'Terminal' ? null : (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Production, last 7 days</span>
          <Sparkline values={fleetGlobeTrend(site)} label={`${site.name} production over the last 7 days`} unit="kboe/d" decimals={0} height={32} tone={site.state === 'shut-in' ? 'critical' : 'neutral'} variant="area" showLast />
        </div>
      )}

      {terminal ? (
        <p className="border-t border-default pt-3 text-xs text-muted-foreground">
          Exports to <span className="text-base-foreground">{terminal.name}</span>, <span className="tabular-nums">{formatValue(greatCircleKm(site, terminal), 0)} km</span> along the great circle.
        </p>
      ) : null}
    </section>
  );
}

function FleetGlobeLegend() {
  const item = 'flex items-center gap-1.5 whitespace-nowrap';
  return (
    <ul aria-label="Globe legend" className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-medium-foreground">
      {Object.values(FLEETGLOBE_STATES).map((status) => (
        <li key={status.label} className={item}>
          <StatusDot tone={status.tone} shape={status.shape} size="md" />
          {status.label}
        </li>
      ))}
      <li className={item}>
        <span aria-hidden="true" className="h-0.5 w-4 bg-base-foreground" />
        Export route
      </li>
    </ul>
  );
}

function FleetGlobeTotals({ filter }: { filter: FleetGlobeFilter }) {
  const producing = FLEETGLOBE_SITES.filter((site) => site.kind !== 'Terminal');
  const total = producing.reduce((sum, site) => sum + site.production, 0);
  const plan = producing.reduce((sum, site) => sum + site.plan, 0);
  const onStream = producing.filter((site) => site.production > 0).length;
  const alarms = FLEETGLOBE_SITES.reduce((sum, site) => sum + fleetGlobeAlarmCount(site), 0);

  return (
    <div className="flex flex-wrap items-stretch gap-x-8 gap-y-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">Fleet production</span>
        <ValueReadout value={total} unit="kboe/d" size="md" />
        <TrendDelta value={total} reference={plan} decimals={0} goodDirection="up" caption="vs plan" size="sm" />
      </div>
      {FLEETGLOBE_FILTERS.slice(1).map((region) => {
        const regional = producing.filter((site) => site.region === region).reduce((sum, site) => sum + site.production, 0);
        const active = filter === region;
        return (
          <div key={region} className={`flex min-w-36 flex-1 flex-col gap-1.5 border-l pl-4 ${active ? 'border-[var(--primary-background)]' : 'border-default'}`}>
            <span className={`text-xs ${active ? 'text-base-foreground' : 'text-muted-foreground'}`}>{region}</span>
            <ValueReadout value={regional} unit="kboe/d" size="sm" />
            <span className="flex h-1 overflow-hidden rounded-full bg-secondary-background" role="img" aria-label={`${formatValue((regional / total) * 100, 0)} percent of fleet production`}>
              <span className="bg-chart-1-450" style={{ width: `${(regional / total) * 100}%` }} />
            </span>
          </div>
        );
      })}
      <div className="flex flex-col gap-0.5 border-l border-default pl-4">
        <span className="text-xs text-muted-foreground">On stream</span>
        <ValueReadout value={onStream} unit={`of ${producing.length} sites`} size="sm" />
      </div>
      <div className="flex flex-col gap-0.5 border-l border-default pl-4">
        <span className="text-xs text-muted-foreground">Open alarms</span>
        <ValueReadout value={alarms} size="sm" />
      </div>
    </div>
  );
}

function FleetGlobeFallbackList() {
  return (
    <ul className="flex flex-col gap-2 rounded-lg border border-default bg-card-background p-3">
      {FLEETGLOBE_SITES.map((site) => (
        <li key={site.id} className="flex items-center justify-between gap-3 text-sm">
          <span className="min-w-0 truncate text-base-foreground">{site.name}</span>
          <StatusIndicator {...FLEETGLOBE_STATES[site.state]} size="sm" className="shrink-0" />
        </li>
      ))}
    </ul>
  );
}

function FleetGlobeExperience({ initial = FLEETGLOBE_INITIAL, still = false }: { initial?: FleetGlobeUi; still?: boolean }) {
  const [state, dispatch] = useReducer(fleetGlobeReducer, initial);
  const selected = fleetGlobeSite(state.selectedId);
  const untouched = !selected && state.filter === 'All' && state.spinning;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && state.selectedId) {
      event.preventDefault();
      dispatch({ type: 'clear' });
    }
  };

  return (
    <div
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onPointerDownCapture={(event) => {
        // Orbit controls swallow the pointer event, so take focus by hand to keep Escape working.
        if (event.target instanceof HTMLCanvasElement) event.currentTarget.focus({ preventScroll: true });
      }}
      className="flex h-[46rem] w-full flex-col overflow-hidden rounded-xl border border-default bg-base-background outline-none"
    >
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-default px-4 py-2.5">
        <div className="flex min-w-0 items-baseline gap-3">
          <h3 className="text-sm font-semibold text-base-foreground">Fleet</h3>
          <span className="text-xs text-muted-foreground">Norwegian continental shelf · {FLEETGLOBE_SITES.length} sites</span>
        </div>
        <div className="flex items-center gap-3">
          <FleetGlobeFilterSwitch value={state.filter} onChange={(filter) => dispatch({ type: 'filter', filter })} />
          <Button variant="outline" size="sm" disabled={untouched && !still} onClick={() => dispatch({ type: 'overview' })}>
            <IconWorld /> Show whole globe
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,color-mix(in_oklab,var(--primary-background)_16%,transparent),transparent_62%)]"
          />
          <SceneCanvas
            label={`Globe showing ${FLEETGLOBE_SITES.length} sites on the Norwegian continental shelf${selected ? `, centred on ${selected.name}` : state.filter === 'All' ? '' : `, ${state.filter} in focus`}`}
            fallback={<FleetGlobeFallbackList />}
            camera={{ fov: 40, near: 0.5, far: 400 }}
          >
            <StillScene still={still}>
              <FleetGlobe
                sites={fleetGlobeMarkers(state.filter)}
                routes={fleetGlobeRoutes(state.filter)}
                outlines={WORLD_OUTLINES}
                radius={FLEETGLOBE_RADIUS}
                view={fleetGlobeView(state)}
                viewKey={state.resets}
                spinning={state.spinning && !still}
                selectedId={state.selectedId}
                onSelect={(id) => dispatch({ type: 'select', id })}
                onInteract={() => dispatch({ type: 'interact' })}
                onClear={() => dispatch({ type: 'clear' })}
                insets={{ left: selected ? 332 : 0, bottom: 36 }}
              />
            </StillScene>
          </SceneCanvas>

          <div className="pointer-events-none absolute inset-3 z-30 flex flex-col justify-between gap-3">
            <div className="flex items-start">
              {selected ? (
                <div key={selected.id} className="pointer-events-auto w-80 motion-safe:transition-[opacity,translate] motion-safe:duration-300 motion-safe:starting:-translate-x-3 motion-safe:starting:opacity-0">
                  <FleetGlobeSiteCard site={selected} onClose={() => dispatch({ type: 'clear' })} />
                </div>
              ) : (
                <p className={`rounded-lg px-3 py-1.5 text-xs text-medium-foreground ${FLEETGLOBE_GLASS}`}>
                  {state.spinning && !still ? 'Turning slowly. Drag to take over, or pick a site.' : 'Drag to rotate. Pick a site to bring it front and centre.'}
                </p>
              )}
            </div>
            <div className={`pointer-events-auto self-start rounded-lg px-3 py-1.5 ${FLEETGLOBE_GLASS}`}>
              <FleetGlobeLegend />
            </div>
          </div>
        </div>

        <aside aria-label="Site list" className="flex w-72 shrink-0 flex-col gap-2 overflow-y-auto border-l border-default p-3">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Sites</span>
          <FleetGlobeSiteList filter={state.filter} selectedId={state.selectedId} onSelect={(id) => dispatch({ type: 'select', id })} />
        </aside>
      </div>

      <footer className="shrink-0 border-t border-default px-4 py-3">
        <FleetGlobeTotals filter={state.filter} />
      </footer>
    </div>
  );
}

function FleetGlobeTron() {
  return (
    <ThemeScope preset="tron" className="w-full">
      <FleetGlobeExperience />
    </ThemeScope>
  );
}

function FleetGlobeHologram() {
  return (
    <ThemeScope preset="hologram" className="w-full">
      <FleetGlobeExperience initial={{ selectedId: 'valhall-sor', filter: 'All', spinning: false, resets: 0 }} still />
    </ThemeScope>
  );
}

function FleetGlobeAuraDark() {
  return (
    <ThemeScope preset="aura-dark" className="w-full">
      <FleetGlobeExperience initial={{ selectedId: null, filter: 'Barents Sea', spinning: false, resets: 0 }} still />
    </ThemeScope>
  );
}

function FleetGlobeStage({ label, children }: { label: string; children: ReactNode }) {
  return (
    <ThemeScope preset="tron" className="w-full">
      <div className="relative h-72 w-full overflow-hidden rounded-xl border border-default bg-base-background">
        <SceneCanvas label={label} camera={{ fov: 40, near: 0.5, far: 400 }}>
          <StillScene>{children}</StillScene>
        </SceneCanvas>
      </div>
    </ThemeScope>
  );
}

function FleetGlobePartGlobe() {
  return (
    <FleetGlobeStage label="Globe with a latitude and longitude grid and stylised coastlines, centred on Europe">
      <FleetGlobe sites={[]} outlines={WORLD_OUTLINES} radius={FLEETGLOBE_RADIUS} view={{ lat: 42, lon: 10, distance: FLEETGLOBE_RADIUS * 3.3 }} />
    </FleetGlobeStage>
  );
}

function FleetGlobePartMarkers() {
  const sites: GlobeSite[] = [
    { id: 'a', name: 'Producing', lat: 63, lon: -3, size: 0.13, tone: 'success' },
    { id: 'b', name: 'Selected', lat: 63, lon: 5, size: 0.1, tone: 'warning', status: 'Reduced', dot: 'square' },
    { id: 'c', name: 'Shut in', lat: 63, lon: 13, size: 0.08, tone: 'critical' },
    { id: 'd', name: 'Start-up', lat: 58.5, lon: 1, size: 0.06, tone: 'info' },
    { id: 'e', name: 'Terminal', lat: 58.5, lon: 9, size: 0.09, tone: 'neutral', shape: 'diamond' },
  ];

  return (
    <FleetGlobeStage label="Site markers in five statuses and sizes, with one selected">
      <FleetGlobe sites={sites} outlines={WORLD_OUTLINES} radius={FLEETGLOBE_RADIUS} view={{ lat: 61, lon: 5, distance: FLEETGLOBE_RADIUS * 1.75 }} selectedId="b" />
    </FleetGlobeStage>
  );
}

function FleetGlobePartArcs() {
  const stord = { lat: 59.8, lon: 5.5 };
  const routes: GlobeRoute[] = [
    { id: 'short', from: { lat: 65.3, lon: 7.2 }, to: stord, flow: true },
    { id: 'medium', from: stord, to: { lat: 40.4, lon: -3.7 }, flow: true },
    { id: 'long', from: stord, to: { lat: 38.4, lon: -76.4 }, quiet: true },
  ];

  return (
    <FleetGlobeStage label="Three great-circle arcs of different lengths; longer hops rise higher">
      <FleetGlobe sites={[{ id: 'stord', name: 'Stord terminal', lat: stord.lat, lon: stord.lon, size: 0.075, shape: 'diamond' }]} routes={routes} outlines={WORLD_OUTLINES} radius={FLEETGLOBE_RADIUS} view={{ lat: 46, lon: -22, distance: FLEETGLOBE_RADIUS * 3.2 }} />
    </FleetGlobeStage>
  );
}

function FleetGlobePartList() {
  const [state, dispatch] = useReducer(fleetGlobeReducer, { selectedId: 'tromsoflaket', filter: 'All', spinning: false, resets: 0 });

  return (
    <ThemeScope preset="tron" className="w-full">
      <div className="flex h-[38rem] w-full flex-col gap-3 rounded-xl border border-default bg-base-background p-3">
        <FleetGlobeFilterSwitch value={state.filter} onChange={(filter) => dispatch({ type: 'filter', filter })} />
        <div className="min-h-0 flex-1 overflow-y-auto px-1.5">
          <FleetGlobeSiteList filter={state.filter} selectedId={state.selectedId} onSelect={(id) => dispatch({ type: 'select', id })} />
        </div>
      </div>
    </ThemeScope>
  );
}

function FleetGlobePartCard() {
  const site = fleetGlobeSite('tromsoflaket');
  const terminal = fleetGlobeSite('stord');
  if (!site || !terminal) return null;

  return (
    <ThemeScope preset="tron" className="w-full">
      <div className="@container flex h-[38rem] w-full items-start justify-center gap-3 overflow-y-auto rounded-xl border border-default bg-base-background bg-[radial-gradient(circle_at_50%_40%,color-mix(in_oklab,var(--primary-background)_18%,transparent),transparent_70%)] p-4">
        <div className="w-80 shrink-0">
          <FleetGlobeSiteCard site={site} />
        </div>
        <div className="hidden w-80 shrink-0 @3xl:block">
          <FleetGlobeSiteCard site={terminal} />
        </div>
      </div>
    </ThemeScope>
  );
}

function FleetGlobePartTotals() {
  return (
    <ThemeScope preset="tron" className="w-full">
      <div className="flex w-full flex-col gap-4 rounded-xl border border-default bg-base-background p-4">
        <FleetGlobeTotals filter="North Sea" />
        <div className="border-t border-default pt-3">
          <FleetGlobeLegend />
        </div>
      </div>
    </ThemeScope>
  );
}

function FleetGlobePartFallback() {
  return (
    <ThemeScope preset="tron" className="w-full">
      <div className="h-[32rem] w-full overflow-hidden rounded-xl border border-default">
        <SceneCanvas label="Globe showing the fleet on the Norwegian continental shelf" forceFallback fallback={<FleetGlobeFallbackList />}>
          <FleetGlobe sites={[]} view={FLEETGLOBE_OVERVIEW} />
        </SceneCanvas>
      </div>
    </ThemeScope>
  );
}

export default definePage({
  id: 'fleet-globe',
  title: 'Fleet globe',
  summary:
    'The whole fleet on a globe you can spin. Sites glow in their status colour and scale with production, export routes arc to the terminals, and picking a site swings the globe round to put it front and centre with its card beside it.',
  guidance: {
    use: [
      'For a fleet spread over sea areas, when where a site lies explains its weather, its export route and its neighbours.',
      'As the way in: the globe finds the site, the card and the list carry the numbers.',
      'With the site list as the keyboard path — every marker has a row that selects it and turns the globe.',
      'With one label at a time. The selected site is named in the scene; the rest are named in the list.',
    ],
    avoid: [
      'A globe for a handful of sites in one field. A plot plan or a map tile shows that better.',
      'Reading production off marker size. Size ranks sites at a glance; the figures are in the list.',
      'Rotation that never stops. The idle spin ends on the first interaction and never starts under reduced motion.',
      'Textures and real map data in a control-room tool. A stylised outline is enough to say where.',
    ],
  },
  source,
  sections: [
    {
      id: 'experience',
      title: 'Experience',
      description:
        'The globe turns slowly until you touch it. Drag to rotate, scroll to zoom. Click a marker or a row in the site list to bring that site front and centre and open its card. Filter by region to dim the rest. Escape closes the card.',
      specimens: [
        {
          id: 'FleetGlobeTron',
          title: 'Fleet globe',
          note: 'Pick it when a fleet-wide overview should start from geography and lead to one site in a single move.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'three/SceneCanvas.tsx',
            'three/scenes/FleetGlobe.tsx',
            'three/scenes/Globe.tsx',
            'three/scenes/GlobeControls.tsx',
            'three/scenes/SiteMarker.tsx',
            'three/scenes/GreatCircleArc.tsx',
            'three/scenes/geo.ts',
            'three/scenes/globeFocus.ts',
            'three/scenes/continents.ts',
            'industrial/ValueReadout.tsx',
            'industrial/StatusIndicator.tsx',
            'industrial/Sparkline.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: FleetGlobeTron,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same globe in two more presets, opened in other states and held still. Sphere, grid, coastlines and markers take their colours from tokens.',
      specimens: [
        {
          id: 'FleetGlobeHologram',
          title: 'Hologram, one site in focus',
          note: 'Pick it for a digital-twin look: soft teal on black, here swung round to Valhall Sør with its card open.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['three/SceneCanvas.tsx', 'three/scenes/FleetGlobe.tsx', 'three/scenes/StillScene.tsx', 'themes/ThemeScope.tsx'],
          Component: FleetGlobeHologram,
        },
        {
          id: 'FleetGlobeAuraDark',
          title: 'Aura dark, one region',
          note: 'Pick it inside a standard dark Aura app; here the Barents Sea filter dims every other site and route.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['three/SceneCanvas.tsx', 'three/scenes/FleetGlobe.tsx', 'three/scenes/StillScene.tsx', 'themes/ThemeScope.tsx'],
          Component: FleetGlobeAuraDark,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The pieces on their own: globes you can drag, and the panels around the scene.',
      specimens: [
        {
          id: 'FleetGlobePartGlobe',
          title: 'Globe',
          note: 'Pick it as the stage for anything placed by latitude and longitude; grid and coastlines are plain lines.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/scenes/Globe.tsx', 'three/scenes/continents.ts', 'three/scenes/geo.ts'],
          Component: FleetGlobePartGlobe,
        },
        {
          id: 'FleetGlobePartMarkers',
          title: 'Site markers',
          note: 'Pick status colour for state, size for a ranking value and a diamond for a different kind of place.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/scenes/SiteMarker.tsx', 'three/scenes/geo.ts', 'three/SceneLabel.tsx'],
          Component: FleetGlobePartMarkers,
        },
        {
          id: 'FleetGlobePartArcs',
          title: 'Great-circle arcs',
          note: 'Pick an arc for a route between two places; it rises with distance, so long hauls read at a glance.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/scenes/GreatCircleArc.tsx', 'three/scenes/geo.ts'],
          Component: FleetGlobePartArcs,
        },
        {
          id: 'FleetGlobePartList',
          title: 'Site list with region filter',
          note: 'Pick it beside the globe as the readable, keyboard-reachable twin of the markers.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/StatusIndicator.tsx'],
          Component: FleetGlobePartList,
        },
        {
          id: 'FleetGlobePartCard',
          title: 'Site card',
          note: 'Pick it for the focused site: state, production against plan, availability, alarms, a week of trend and the export route.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/ValueReadout.tsx', 'industrial/TrendDelta.tsx', 'industrial/Sparkline.tsx', 'three/scenes/geo.ts'],
          Component: FleetGlobePartCard,
        },
        {
          id: 'FleetGlobePartTotals',
          title: 'Fleet totals strip',
          note: 'Pick it under the globe so the sum of the fleet stays in view while one site is in focus.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['industrial/ValueReadout.tsx', 'industrial/TrendDelta.tsx', 'industrial/StatusDot.tsx'],
          Component: FleetGlobePartTotals,
        },
        {
          id: 'FleetGlobePartFallback',
          title: 'Without WebGL',
          note: 'Pick a fallback that lists the same sites and their state, so the fleet is readable where 3D cannot render.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['three/SceneCanvas.tsx', 'industrial/StatusIndicator.tsx'],
          Component: FleetGlobePartFallback,
        },
      ],
    },
  ],
});
