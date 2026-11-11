import { Button } from '@cognite/aura/components/button';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import { IconActivity, IconAlertOctagon, IconAlertTriangle, IconAnchor, IconArrowUpRight, IconPlayerPlay, IconTool, IconWorld, IconX } from '@cognite/aura/icons';
import { useReducer } from 'react';
import type { ReactNode } from 'react';

import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { Delta } from '../../../library/kit/Delta';
import { IconChip } from '../../../library/kit/IconChip';
import { Meter } from '../../../library/kit/Meter';
import { Panel } from '../../../library/kit/Panel';
import { RingGauge } from '../../../library/kit/RingGauge';
import { SceneStage } from '../../../library/kit/scene/SceneStage';
import { StatusPill } from '../../../library/kit/StatusPill';
import { formatNumber, type StatusTone } from '../../../library/kit/tones';
import { TrendArea } from '../../../library/kit/TrendArea';
import { LookScope } from '../../../library/looks/LookScope';
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

type FleetGlobeStateMeta = { label: string; tone: StatusTone; dot: NonNullable<GlobeSite['dot']>; icon: ReactNode };

const FLEETGLOBE_STATES: Readonly<Record<FleetGlobeState, FleetGlobeStateMeta>> = {
  producing: { label: 'Producing', tone: 'success', dot: 'dot', icon: <IconActivity /> },
  reduced: { label: 'Reduced', tone: 'warning', dot: 'square', icon: <IconAlertTriangle /> },
  'shut-in': { label: 'Shut in', tone: 'critical', dot: 'diamond', icon: <IconAlertOctagon /> },
  'start-up': { label: 'Start-up', tone: 'info', dot: 'dot', icon: <IconPlayerPlay /> },
  maintenance: { label: 'Maintenance', tone: 'neutral', dot: 'ring', icon: <IconTool /> },
};

const FLEETGLOBE_RADIUS = 10;

/** The home view: close enough that the shelf fills the screen, far enough that it still reads as a globe. */
const FLEETGLOBE_OVERVIEW: GlobeView = { lat: 58, lon: 6, distance: FLEETGLOBE_RADIUS * 2.45 };

const FLEETGLOBE_MAX_PRODUCTION = Math.max(...FLEETGLOBE_SITES.map((site) => site.production));

const FLEETGLOBE_FILTERS = ['All', 'Norwegian Sea', 'North Sea', 'Barents Sea'] as const;

type FleetGlobeFilter = (typeof FLEETGLOBE_FILTERS)[number];

function fleetGlobeIsFilter(value: unknown): value is FleetGlobeFilter {
  return FLEETGLOBE_FILTERS.some((filter) => filter === value);
}

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
      dot: status.dot,
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

const FLEETGLOBE_FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring-default)]';

const FLEETGLOBE_STATE_ORDER: readonly FleetGlobeState[] = ['shut-in', 'reduced', 'start-up', 'maintenance', 'producing'];

function fleetGlobeTotals(filter: FleetGlobeFilter): { production: number; plan: number; sites: number } {
  const sites = FLEETGLOBE_SITES.filter((site) => filter === 'All' || site.region === filter);
  return { production: sites.reduce((sum, site) => sum + site.production, 0), plan: sites.reduce((sum, site) => sum + site.plan, 0), sites: sites.length };
}

const FLEETGLOBE_WEEK = ['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'];

/** One label per six-hour point of the last seven days, ending today, Thursday. */
function fleetGlobeDays(): string[] {
  return Array.from({ length: 28 }, (_, index) => FLEETGLOBE_WEEK[Math.floor(index / 4)]);
}

type FleetGlobeSceneProps = {
  state: FleetGlobeUi;
  dispatch: (action: FleetGlobeAction) => void;
  insets?: { top?: number; right?: number; bottom?: number; left?: number };
  still?: boolean;
};

function FleetGlobeScene({ state, dispatch, insets, still = false }: FleetGlobeSceneProps) {
  const selected = fleetGlobeSite(state.selectedId);

  return (
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
          insets={insets}
        />
      </StillScene>
    </SceneCanvas>
  );
}

function FleetGlobeFallbackList() {
  return (
    <ul className="flex flex-col gap-2 rounded-xl border border-default bg-card-background p-4">
      {FLEETGLOBE_SITES.slice(0, 6).map((site) => (
        <li key={site.id} className="flex items-baseline justify-between gap-4 text-sm">
          <span className="text-base-foreground">{site.name}</span>
          <span className="text-medium-foreground">{FLEETGLOBE_STATES[site.state].label}</span>
        </li>
      ))}
    </ul>
  );
}

/** The fleet in one sentence: the figure that matters, what it is measured against, and the states in words. */
function FleetGlobeHeadline({ filter }: { filter: FleetGlobeFilter }) {
  const totals = fleetGlobeTotals(filter);
  const sites = FLEETGLOBE_SITES.filter((site) => filter === 'All' || site.region === filter);

  return (
    <div className="pointer-events-auto flex max-w-sm flex-col gap-3 [text-shadow:0_1px_14px_var(--mountain-black)]">
      <div className="flex items-center gap-3">
        <IconChip tone="accent" size="lg">
          <IconWorld />
        </IconChip>
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-[color:var(--kit-text)]">Fleet today</h2>
          <p className="text-sm text-[color:var(--kit-text-2)]">{filter === 'All' ? 'Norwegian continental shelf' : filter} · 14:00 UTC</p>
        </div>
      </div>
      <p className="flex items-baseline gap-2">
        <span className="text-6xl font-semibold tracking-tight tabular-nums text-[color:var(--kit-text)]">{formatNumber(totals.production)}</span>
        <span className="text-lg text-[color:var(--kit-text-2)]">kboe/d</span>
      </p>
      <p className="text-sm text-[color:var(--kit-text-2)]">
        <span className="font-semibold tabular-nums text-[color:var(--kit-text)]">{formatNumber((totals.production / Math.max(totals.plan, 1)) * 100)} %</span> of the {formatNumber(totals.plan)} kboe/d plan, from{' '}
        {totals.sites} sites.
      </p>
      <ul aria-label="Sites by state" className="flex flex-wrap gap-2">
        {FLEETGLOBE_STATE_ORDER.map((state) => {
          const count = sites.filter((site) => site.state === state).length;
          return count > 0 ? (
            <li key={state}>
              <StatusPill tone={FLEETGLOBE_STATES[state].tone} icon={FLEETGLOBE_STATES[state].icon}>
                {count} {FLEETGLOBE_STATES[state].label.toLowerCase()}
              </StatusPill>
            </li>
          ) : null;
        })}
      </ul>
    </div>
  );
}

function FleetGlobeRegionSwitch({ value, onChange }: { value: FleetGlobeFilter; onChange: (filter: FleetGlobeFilter) => void }) {
  return (
    <SegmentedControl
      value={value}
      onValueChange={(next) => {
        if (fleetGlobeIsFilter(next)) onChange(next);
      }}
    >
      <SegmentedControlList aria-label="Region">
        {FLEETGLOBE_FILTERS.map((filter) => (
          <SegmentedControlButton key={filter} value={filter}>
            {filter}
          </SegmentedControlButton>
        ))}
      </SegmentedControlList>
    </SegmentedControl>
  );
}

function FleetGlobeAlarms({ site }: { site: FleetGlobeSite }) {
  if (fleetGlobeAlarmCount(site) === 0) return <StatusPill tone="success">No open alarms</StatusPill>;
  return (
    <ul aria-label="Open alarms" className="flex flex-wrap gap-1.5">
      {site.alarms.critical > 0 ? (
        <li>
          <StatusPill tone="critical" icon={<IconAlertOctagon />}>
            {site.alarms.critical} critical
          </StatusPill>
        </li>
      ) : null}
      {site.alarms.high > 0 ? (
        <li>
          <StatusPill tone="warning" icon={<IconAlertTriangle />}>
            {site.alarms.high} high
          </StatusPill>
        </li>
      ) : null}
      {site.alarms.medium > 0 ? (
        <li>
          <StatusPill tone="info">{site.alarms.medium} medium</StatusPill>
        </li>
      ) : null}
    </ul>
  );
}

/** The card a picked site opens: state, production against plan, availability, alarms and a week of output. */
function FleetGlobeSiteCard({ site, onClose, className }: { site: FleetGlobeSite; onClose?: () => void; className?: string }) {
  const status = FLEETGLOBE_STATES[site.state];
  const terminal = fleetGlobeSite(site.exportTo);
  const feeders = FLEETGLOBE_SITES.filter((other) => other.exportTo === site.id);
  const produces = site.kind !== 'Terminal' && site.plan > 0;

  return (
    <Panel
      className={className}
      tone={status.tone === 'success' ? 'neutral' : status.tone}
      title={site.name}
      subtitle={`${site.kind} · ${site.region}`}
      icon={<IconChip tone={status.tone}>{site.kind === 'Terminal' ? <IconAnchor /> : status.icon}</IconChip>}
      actions={
        onClose ? (
          <Button variant="ghost" size="icon-sm" aria-label={`Close ${site.name}`} onClick={onClose}>
            <IconX />
          </Button>
        ) : undefined
      }
    >
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <div>
            <StatusPill tone={status.tone} size="lg" icon={status.icon}>
              {status.label}
            </StatusPill>
          </div>
          <p className="text-sm text-[color:var(--kit-text-2)]">{site.note}</p>
        </div>

        <div className="flex items-center justify-between gap-4">
          {produces ? (
            <div className="flex flex-col gap-1">
              <span className="text-sm text-[color:var(--kit-text-2)]">Production</span>
              <span className="flex items-baseline gap-2">
                <span className="text-5xl font-semibold tracking-tight tabular-nums text-[color:var(--kit-text)]">{formatNumber(site.production)}</span>
                <span className="text-sm text-[color:var(--kit-text-2)]">kboe/d</span>
              </span>
              <span className="flex items-center gap-2 text-sm text-[color:var(--kit-text-2)]">
                <Delta value={site.production - site.plan} decimals={0} /> vs plan {formatNumber(site.plan)}
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <span className="text-sm text-[color:var(--kit-text-2)]">{site.kind === 'Terminal' ? 'Receiving from' : 'Production'}</span>
              <span className="flex items-baseline gap-2">
                <span className="text-5xl font-semibold tracking-tight tabular-nums text-[color:var(--kit-text)]">{site.kind === 'Terminal' ? feeders.length : 0}</span>
                <span className="text-sm text-[color:var(--kit-text-2)]">{site.kind === 'Terminal' ? 'sites' : 'kboe/d'}</span>
              </span>
              <span className="text-sm text-[color:var(--kit-text-2)]">{site.kind === 'Terminal' ? feeders.map((feeder) => feeder.name).join(', ') : 'Nothing planned during the turnaround'}</span>
            </div>
          )}
          <RingGauge label="Availability" value={site.availability} decimals={0} size={96} tone={site.availability >= 95 ? 'success' : site.availability >= 85 ? 'warning' : 'critical'} />
        </div>

        {produces ? (
          <>
            <Meter label="Against plan" value={site.production} max={Math.max(site.plan, site.production) * 1.15} unit="kboe/d" target={{ value: site.plan, label: 'Plan' }} tone={status.tone === 'success' ? 'accent' : status.tone} />
            <TrendArea
              label={`${site.name} production over the last seven days against plan`}
              labels={fleetGlobeDays()}
              series={[{ id: site.id, label: 'Production', values: fleetGlobeTrend(site), tone: status.tone === 'success' ? 'accent' : status.tone }]}
              limits={[{ value: site.plan, label: 'Plan', tone: 'neutral' }]}
              unit="kboe/d"
              height={128}
              showLegend={false}
            />
          </>
        ) : null}

        <div className="mt-auto flex flex-col gap-2">
          <FleetGlobeAlarms site={site} />
          {terminal ? (
            <p className="flex items-center gap-1.5 text-sm text-[color:var(--kit-text-2)]">
              <IconArrowUpRight className="size-4 shrink-0" />
              <span>
                Exports to <span className="font-medium text-[color:var(--kit-text)]">{terminal.name}</span>, <span className="tabular-nums">{formatNumber(greatCircleKm(site, terminal))} km</span>
              </span>
            </p>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}

/** What the right side shows before a site is picked: the sites that are not simply producing. */
function FleetGlobeAttention({ filter, onSelect, className }: { filter: FleetGlobeFilter; onSelect: (id: string) => void; className?: string }) {
  const sites = FLEETGLOBE_STATE_ORDER.flatMap((state) => FLEETGLOBE_SITES.filter((site) => site.state === state && state !== 'producing' && fleetGlobeInFilter(site, filter)));

  return (
    <Panel className={className} title="Needs attention" subtitle={`${sites.length} of ${fleetGlobeTotals(filter).sites} sites are off plan`} padding="tight">
      <ul className="flex flex-col gap-1">
        {sites.map((site) => {
          const status = FLEETGLOBE_STATES[site.state];
          return (
            <li key={site.id}>
              <button
                type="button"
                data-tone={status.tone}
                onClick={() => onSelect(site.id)}
                className={`flex w-full items-center gap-3 rounded-[var(--kit-radius-sm)] px-3 py-2.5 text-left hover:bg-[var(--kit-track)] ${FLEETGLOBE_FOCUS}`}
              >
                <IconChip tone={status.tone} size="sm">
                  {status.icon}
                </IconChip>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-semibold text-[color:var(--kit-text)]">{site.name}</span>
                  <span className="truncate text-xs text-[color:var(--kit-text-2)]">{site.note}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-base font-semibold tabular-nums text-[color:var(--kit-text)]">{formatNumber(site.production)}</span>
                  <span className="block text-xs tabular-nums text-[color:var(--kit-text-3)]">of {formatNumber(site.plan)}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

/** Every site as a chip: the keyboard path onto the globe. */
function FleetGlobeDock({ filter, selectedId, onSelect }: { filter: FleetGlobeFilter; selectedId: string | null; onSelect: (id: string) => void }) {
  return (
    <ul
      aria-label="Sites"
      className="pointer-events-auto flex max-w-full flex-wrap justify-center gap-2 rounded-[var(--kit-radius)] border border-[color:var(--kit-rule)] bg-[color-mix(in_oklab,var(--card-background)_66%,transparent)] p-2 shadow-[0_18px_40px_-20px_var(--opacity-black-60)] backdrop-blur-xl"
    >
      {FLEETGLOBE_SITES.map((site) => {
        const status = FLEETGLOBE_STATES[site.state];
        const active = fleetGlobeInFilter(site, filter);
        return (
          <li key={site.id}>
            <button
              type="button"
              data-tone={status.tone}
              aria-pressed={site.id === selectedId}
              aria-label={`${site.name}, ${status.label.toLowerCase()}${site.kind === 'Terminal' ? ', terminal' : `, ${site.production} thousand barrels a day`}`}
              disabled={!active}
              onClick={() => onSelect(site.id)}
              className={`flex h-10 items-center gap-2 rounded-[var(--kit-radius-sm)] border border-transparent px-3 text-sm font-medium text-[color:var(--kit-text)] hover:bg-[var(--kit-track)] disabled:opacity-40 aria-pressed:border-[var(--primary-background)] aria-pressed:bg-[color-mix(in_oklab,var(--primary-background)_18%,transparent)] ${FLEETGLOBE_FOCUS}`}
            >
              <span aria-hidden="true" className={`size-2.5 shrink-0 bg-[var(--t-line)] ${site.kind === 'Platform' ? 'rounded-full' : 'rotate-45'}`} />
              {site.name}
              {site.kind === 'Terminal' ? null : <span className="tabular-nums text-[color:var(--kit-text-3)]">{formatNumber(site.production)}</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function FleetGlobeBoard({ initial = FLEETGLOBE_INITIAL, still = false }: { initial?: FleetGlobeUi; still?: boolean }) {
  const [state, dispatch] = useReducer(fleetGlobeReducer, initial);
  const selected = fleetGlobeSite(state.selectedId);
  const select = (id: string) => dispatch({ type: 'select', id });

  return (
    <LookScope look="glass">
      <Canvas padding="none" className="h-[54rem]">
        <SceneStage
          className="h-full"
          onEscape={() => dispatch({ type: 'clear' })}
          overlay={
            <div className="flex h-full flex-col justify-between gap-4 p-6">
              <div className="flex min-h-0 flex-1 items-start justify-between gap-4">
                <FleetGlobeHeadline filter={state.filter} />
                <div className="flex max-h-full min-h-0 w-[22rem] shrink-0 flex-col items-end gap-3">
                  <div className="pointer-events-auto flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => dispatch({ type: 'overview' })}>
                      <IconWorld /> Whole fleet
                    </Button>
                  </div>
                  <div className="pointer-events-auto w-full">
                    {selected ? (
                      <FleetGlobeSiteCard key={selected.id} site={selected} onClose={() => dispatch({ type: 'clear' })} />
                    ) : (
                      <FleetGlobeAttention filter={state.filter} onSelect={select} />
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="pointer-events-auto">
                  <FleetGlobeRegionSwitch value={state.filter} onChange={(filter) => dispatch({ type: 'filter', filter })} />
                </div>
                <FleetGlobeDock filter={state.filter} selectedId={state.selectedId} onSelect={select} />
              </div>
            </div>
          }
        >
          <FleetGlobeScene state={state} dispatch={dispatch} insets={{ right: 340, bottom: 150, left: 160 }} still={still} />
        </SceneStage>
      </Canvas>
    </LookScope>
  );
}

function FleetGlobeSignature() {
  return <FleetGlobeBoard />;
}

/** The detail state: one region in focus and the card of the site that is shut in. */
function FleetGlobeBarents() {
  return <FleetGlobeBoard initial={{ selectedId: 'tromsoflaket', filter: 'Barents Sea', spinning: false, resets: 0 }} still />;
}

const FLEETGLOBE_COLUMNS = (selectedId: string | null, onSelect: (id: string) => void): DataTableColumn<FleetGlobeSite>[] => [
  {
    id: 'site',
    header: 'Site',
    cell: (site) => (
      <button type="button" aria-pressed={site.id === selectedId} onClick={() => onSelect(site.id)} className={`flex items-center gap-2 text-left font-semibold underline-offset-4 hover:underline aria-pressed:underline ${FLEETGLOBE_FOCUS}`}>
        <span aria-hidden="true" className={`size-2 shrink-0 ${site.id === selectedId ? 'bg-[var(--primary-background)]' : 'bg-transparent'}`} />
        {site.name}
      </button>
    ),
    nowrap: true,
  },
  { id: 'region', header: 'Region', cell: (site) => site.region, muted: true, nowrap: true },
  { id: 'state', header: 'State', cell: (site) => <StatusPill tone={FLEETGLOBE_STATES[site.state].tone}>{FLEETGLOBE_STATES[site.state].label}</StatusPill> },
  { id: 'production', header: 'kboe/d', cell: (site) => (site.kind === 'Terminal' ? '–' : formatNumber(site.production)), numeric: true },
  { id: 'plan', header: 'Plan', cell: (site) => (site.kind === 'Terminal' ? '–' : formatNumber(site.plan)), numeric: true, muted: true },
  { id: 'availability', header: 'Avail. %', cell: (site) => formatNumber(site.availability, 1), numeric: true },
  { id: 'alarms', header: 'Alarms', cell: (site) => fleetGlobeAlarmCount(site), numeric: true },
];

/** The same fleet for a control room: the register is the screen and the globe only locates the row. */
function FleetGlobeRegister() {
  const [state, dispatch] = useReducer(fleetGlobeReducer, { selectedId: 'valhall-sor', filter: 'All', spinning: false, resets: 0 });
  const selected = fleetGlobeSite(state.selectedId);
  const select = (id: string) => dispatch({ type: 'select', id });
  const totals = fleetGlobeTotals('All');

  return (
    <LookScope look="console">
      <Canvas padding="none" className="grid h-[38rem] grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-px bg-[var(--kit-rule)]">
        <Panel title="Fleet register" subtitle={`${formatNumber(totals.production)} of ${formatNumber(totals.plan)} kboe/d · 10 sites`} padding="none">
          <DataTable
            label="Sites of the fleet with state, production, plan, availability and open alarms"
            columns={FLEETGLOBE_COLUMNS(state.selectedId, select)}
            rows={FLEETGLOBE_STATE_ORDER.flatMap((order) => FLEETGLOBE_SITES.filter((site) => site.state === order))}
            rowKey={(site) => site.id}
            rowTone={(site) => (site.state === 'producing' ? undefined : FLEETGLOBE_STATES[site.state].tone)}
            flush
          />
        </Panel>
        <Panel title="Locator" subtitle={selected ? `${selected.name} · ${selected.note}` : 'Pick a row to find the site'} tone={selected ? FLEETGLOBE_STATES[selected.state].tone : 'neutral'} padding="none">
          <SceneStage className="min-h-0 flex-1" onEscape={() => dispatch({ type: 'clear' })}>
            <FleetGlobeScene state={state} dispatch={dispatch} still />
          </SceneStage>
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function FleetGlobePartStage({ label, children }: { label: string; children: ReactNode }) {
  return (
    <LookScope look="glass" className="w-full">
      <Canvas padding="none" className="h-72">
        <SceneStage className="h-full">
          <SceneCanvas label={label} camera={{ fov: 40, near: 0.5, far: 400 }}>
            <StillScene>{children}</StillScene>
          </SceneCanvas>
        </SceneStage>
      </Canvas>
    </LookScope>
  );
}

function FleetGlobePartCard() {
  const site = fleetGlobeSite('nordkapp') ?? FLEETGLOBE_SITES[0];

  return (
    <LookScope look="glass" className="w-full">
      <Canvas className="flex h-[40rem] flex-col">
        <FleetGlobeSiteCard site={site} />
      </Canvas>
    </LookScope>
  );
}

function FleetGlobePartAttention() {
  const [state, dispatch] = useReducer(fleetGlobeReducer, { selectedId: null, filter: 'All', spinning: false, resets: 0 });
  const selected = fleetGlobeSite(state.selectedId);

  return (
    <LookScope look="glass" className="w-full">
      <Canvas className="flex h-[40rem] flex-col gap-4">
        <div>
          <FleetGlobeAttention filter={state.filter} onSelect={(id) => dispatch({ type: 'select', id })} />
        </div>
        <p className="text-sm text-[color:var(--kit-text-2)]">{selected ? `Opens the card of ${selected.name} and swings the globe to it.` : 'Picking a row opens that site and swings the globe to it.'}</p>
      </Canvas>
    </LookScope>
  );
}

function FleetGlobePartDock() {
  const [state, dispatch] = useReducer(fleetGlobeReducer, { selectedId: 'utsira-sor', filter: 'North Sea', spinning: false, resets: 0 });

  return (
    <LookScope look="glass" className="w-full">
      <Canvas className="flex h-72 flex-col items-center justify-center gap-4">
        <FleetGlobeRegionSwitch value={state.filter} onChange={(filter) => dispatch({ type: 'filter', filter })} />
        <FleetGlobeDock filter={state.filter} selectedId={state.selectedId} onSelect={(id) => dispatch({ type: 'select', id })} />
      </Canvas>
    </LookScope>
  );
}

function FleetGlobePartHeadline() {
  return (
    <LookScope look="glass" className="w-full">
      <Canvas className="flex h-72 flex-col justify-center">
        <FleetGlobeHeadline filter="All" />
      </Canvas>
    </LookScope>
  );
}

function FleetGlobePartMarkers() {
  const sites: GlobeSite[] = [
    { id: 'a', name: 'Producing', lat: 63, lon: -3, size: 0.2, tone: 'success' },
    { id: 'b', name: 'Selected', lat: 63, lon: 5, size: 0.16, tone: 'warning', status: 'Reduced', dot: 'square' },
    { id: 'c', name: 'Shut in', lat: 63, lon: 13, size: 0.12, tone: 'critical' },
    { id: 'd', name: 'Start-up', lat: 58.5, lon: 1, size: 0.09, tone: 'info' },
    { id: 'e', name: 'Terminal', lat: 58.5, lon: 9, size: 0.14, tone: 'neutral', shape: 'diamond' },
  ];

  return (
    <FleetGlobePartStage label="Site markers in five states and sizes, with one selected">
      <FleetGlobe sites={sites} outlines={WORLD_OUTLINES} radius={FLEETGLOBE_RADIUS} view={{ lat: 61, lon: 5, distance: FLEETGLOBE_RADIUS * 1.75 }} selectedId="b" />
    </FleetGlobePartStage>
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
    <FleetGlobePartStage label="Three great-circle arcs of different lengths; longer hops rise higher">
      <FleetGlobe sites={[{ id: 'stord', name: 'Stord terminal', lat: stord.lat, lon: stord.lon, size: 0.075, shape: 'diamond' }]} routes={routes} outlines={WORLD_OUTLINES} radius={FLEETGLOBE_RADIUS} view={{ lat: 46, lon: -22, distance: FLEETGLOBE_RADIUS * 3.2 }} />
    </FleetGlobePartStage>
  );
}

function FleetGlobePartFallback() {
  return (
    <LookScope look="glass" className="w-full">
      <Canvas className="h-72">
        <SceneCanvas label="Globe showing the fleet" forceFallback fallback={<FleetGlobeFallbackList />} camera={{ fov: 40, near: 0.5, far: 400 }}>
          <FleetGlobe sites={[]} view={FLEETGLOBE_OVERVIEW} />
        </SceneCanvas>
      </Canvas>
    </LookScope>
  );
}

export default definePage({
  id: 'fleet-globe',
  title: 'Fleet globe',
  summary:
    'A whole fleet on a globe that fills the screen. Markers are sized by production and coloured by state, arcs show where each site exports to, and picking a site swings the globe to it and opens its card. Every site is also a chip in the dock, so nothing depends on the pointer.',
  guidance: {
    use: [
      'When the story is geographic: sites spread over a shelf or a continent and routes between them.',
      'With one headline figure for the fleet and the states in words, so the answer is there before anyone touches the globe.',
      'With a card for one picked site; the globe labels only that site, so labels never pile up.',
      'On a wall or in a review, where a slowly turning globe is an asset rather than a distraction.',
    ],
    avoid: [
      'Comparing sites number by number: use the register, where the globe only locates the row.',
      'A single plant or a handful of sites in one field: a map or the 3D plant explorer shows more.',
      'Leaving the spin on once the user has touched anything.',
      'State by marker colour alone: the dock, the card and the pills all say the state in words.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'The globe turns slowly until you touch it. Drag to rotate, pick a marker, a chip in the dock or a row under Needs attention to open a site, and switch region to light only that part of the shelf. Escape closes the card.',
      specimens: [
        {
          id: 'FleetGlobeSignature',
          title: 'Fleet globe',
          note: 'Pick it as the opening view of a fleet: the total, what is off plan, and one click to any site.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: [
            'kit/scene/SceneStage.tsx',
            'kit/Panel.tsx',
            'kit/StatusPill.tsx',
            'kit/RingGauge.tsx',
            'kit/Meter.tsx',
            'kit/TrendArea.tsx',
            'looks/LookScope.tsx',
            'three/scenes/FleetGlobe.tsx',
            'three/scenes/globeFocus.ts',
            'three/scenes/geo.ts',
            'three/scenes/continents.ts',
            'three/SceneCanvas.tsx',
          ],
          Component: FleetGlobeSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Other screens',
      description: 'The detail state with a site card open on one region, and the fleet register for a control room, where the table leads and the globe locates.',
      specimens: [
        {
          id: 'FleetGlobeBarents',
          title: 'Site card open',
          note: 'Pick it to see the detail state: the Barents Sea in focus and the card of the site that is shut in.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/scene/SceneStage.tsx', 'kit/Panel.tsx', 'kit/RingGauge.tsx', 'kit/Meter.tsx', 'kit/TrendArea.tsx', 'three/scenes/FleetGlobe.tsx'],
          Component: FleetGlobeBarents,
        },
        {
          id: 'FleetGlobeRegister',
          title: 'Fleet register',
          note: 'Pick it when operators compare sites row by row: a dense table sorted by state, with a small globe that finds the selected row.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/DataTable.tsx', 'kit/Panel.tsx', 'kit/StatusPill.tsx', 'kit/scene/SceneStage.tsx', 'three/scenes/FleetGlobe.tsx', 'looks/LookScope.tsx'],
          Component: FleetGlobeRegister,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The overlays around the globe and the pieces of the globe itself.',
      specimens: [
        {
          id: 'FleetGlobePartCard',
          title: 'Site card',
          note: 'Pick it as what a picked site opens: state, production against plan, availability, alarms and where it exports to.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/RingGauge.tsx', 'kit/Meter.tsx', 'kit/TrendArea.tsx', 'kit/Delta.tsx', 'kit/StatusPill.tsx'],
          Component: FleetGlobePartCard,
        },
        {
          id: 'FleetGlobePartAttention',
          title: 'Needs attention',
          note: 'Pick it for the empty state of a selection panel: instead of a hint, list what is worth selecting.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/IconChip.tsx'],
          Component: FleetGlobePartAttention,
        },
        {
          id: 'FleetGlobePartDock',
          title: 'Site dock',
          note: 'Pick a dock of chips as the keyboard path onto a globe; chips outside the region are disabled, not removed.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          bleed: true,
          uses: ['three/scenes/globeFocus.ts'],
          Component: FleetGlobePartDock,
        },
        {
          id: 'FleetGlobePartHeadline',
          title: 'Fleet headline',
          note: 'Pick one very large figure with its plan in a sentence instead of a row of tiles over a scene.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/StatusPill.tsx', 'kit/IconChip.tsx'],
          Component: FleetGlobePartHeadline,
        },
        {
          id: 'FleetGlobePartMarkers',
          title: 'Site markers',
          note: 'Pick markers sized by production and coloured by state; a diamond marks a terminal and only the selected one is labelled.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['three/scenes/SiteMarker.tsx', 'three/scenes/FleetGlobe.tsx', 'three/SceneLabel.tsx'],
          Component: FleetGlobePartMarkers,
        },
        {
          id: 'FleetGlobePartArcs',
          title: 'Route arcs',
          note: 'Pick great-circle arcs for export routes; longer hops rise higher so they never cut through the globe.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['three/scenes/GreatCircleArc.tsx', 'three/scenes/geo.ts'],
          Component: FleetGlobePartArcs,
        },
        {
          id: 'FleetGlobePartFallback',
          title: 'Without WebGL',
          note: 'Pick a fallback that still names the sites and their states where a globe cannot render.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['three/SceneCanvas.tsx', 'three/webgl.ts'],
          Component: FleetGlobePartFallback,
        },
      ],
    },
  ],
});
