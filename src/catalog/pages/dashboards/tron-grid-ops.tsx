import { Button } from '@cognite/aura/components/button';
import { IconArrowLeft } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { EventTicker } from '../../../library/experiences/futuristic/EventTicker';
import type { TickerItem } from '../../../library/experiences/futuristic/EventTicker';
import { GlowText } from '../../../library/experiences/futuristic/GlowText';
import { GridBlock } from '../../../library/experiences/futuristic/GridBlock';
import { neonFromStatus } from '../../../library/experiences/futuristic/neon';
import type { NeonTone } from '../../../library/experiences/futuristic/neon';
import { NeonPanel } from '../../../library/experiences/futuristic/NeonPanel';
import { NeonSparkline } from '../../../library/experiences/futuristic/NeonSparkline';
import { floorPath, paintOrder } from '../../../library/experiences/futuristic/perspective';
import type { FloorBlock, FloorPoint, GridView } from '../../../library/experiences/futuristic/perspective';
import { PerspectiveGrid } from '../../../library/experiences/futuristic/PerspectiveGrid';
import { PulseLine } from '../../../library/experiences/futuristic/PulseLine';
import { SegmentNumerals } from '../../../library/experiences/futuristic/SegmentNumerals';
import { formatValue, runStateStatus, severityStatus } from '../../../library/industrial/status';
import type { DotShape, Tone } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { ALARMS, ASSETS, PLANT_KPIS, WORK_ORDERS, childrenOf, findAsset } from '../../data/plant';
import { REFERENCE_NOW, formatTime, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './tron-grid-ops.tsx?raw';

type TronGridUnit = { tag: string; name: string; tone: Tone; label: string; shape: DotShape };

type TronGridArea = {
  id: string;
  tag: string;
  name: string;
  /** Load as a share of design capacity, 0–100. Sets the height of the block. */
  load: number;
  healthScore: number;
  /** State in words and the status tone it maps to. */
  state: string;
  tone: Tone;
  shape: DotShape;
  openAlarms: number;
  units: readonly TronGridUnit[];
  /** Load over the last 24 hours, ending on `load`. */
  trend: readonly number[];
  block: FloorBlock;
};

type TronGridRoute = { id: string; points: readonly FloorPoint[]; idle?: boolean; pulses?: number; duration?: number };

const TRON_GRID_VIEW: GridView = { width: 800, height: 610, horizonY: 180, foreshortening: 0.5 };

/** Where each area stands on the floor and how loaded it is. Loads are a share of design capacity. */
const TRON_GRID_PLACEMENT: Record<string, { x: number; z: number; load: number; seed: number }> = {
  'nk-20': { x: -0.7, z: 0.5, load: 64, seed: 41 },
  'nk-23': { x: 0, z: 0.5, load: 88, seed: 42 },
  'nk-27': { x: 0.7, z: 0.5, load: 73, seed: 43 },
  'nk-40': { x: -0.52, z: 1.9, load: 41, seed: 44 },
  'nk-80': { x: 0.52, z: 1.9, load: 71, seed: 45 },
  'nk-43': { x: -1.5, z: 3.4, load: 12, seed: 46 },
};

/** Two areas the shared plant model does not carry: power and flare, with their main units. */
const TRON_GRID_EXTRA_AREAS = [
  {
    id: 'nk-80',
    tag: 'NK-80',
    name: 'Power generation',
    healthScore: 90,
    state: 'Running',
    tone: 'success',
    shape: 'dot',
    units: [
      { tag: '80-GT-8001', name: 'Gas turbine generator A', ...runStateStatus('running') },
      { tag: '80-GT-8002', name: 'Gas turbine generator B', ...runStateStatus('running') },
      { tag: '80-GE-8010', name: 'Emergency generator', ...runStateStatus('standby') },
    ],
  },
  {
    id: 'nk-43',
    tag: 'NK-43',
    name: 'Flare and vent',
    healthScore: 93,
    state: 'Standby',
    tone: 'info',
    shape: 'ring',
    units: [
      { tag: '43-FL-4301', name: 'High-pressure flare', ...runStateStatus('standby') },
      { tag: '43-VD-4310', name: 'Flare knock-out drum', ...runStateStatus('running') },
    ],
  },
] as const;

function tronGridTrend(seed: number, load: number): number[] {
  const values = makeValues({ seed, points: 24, base: load, amplitude: 5, noise: 2.5, cycles: 1.5, min: 0, max: 100, decimals: 0 });
  return [...values.slice(0, -1), load];
}

function tronGridBlock(id: string): FloorBlock {
  const { x, z, load } = TRON_GRID_PLACEMENT[id];
  return { x, z, width: 0.3, depth: 0.3, height: 0.05 + load * 0.004 };
}

/** An area takes the state of its worst unit: one trip makes the whole block critical. */
function tronGridAreaState(units: readonly TronGridUnit[]): Pick<TronGridArea, 'state' | 'tone' | 'shape'> {
  if (units.some((unit) => unit.tone === 'critical')) return { state: 'Unit tripped', tone: 'critical', shape: 'diamond' };
  if (units.some((unit) => unit.tone === 'warning')) return { state: 'Maintenance', tone: 'warning', shape: 'square' };
  return { state: 'Running', tone: 'success', shape: 'dot' };
}

const TRON_GRID_AREAS: readonly TronGridArea[] = [
  ...ASSETS.filter((asset) => asset.type === 'area' || asset.type === 'system').map((asset) => {
    const children = childrenOf(asset.id);
    const units = children.map((unit) => ({ tag: unit.tag, name: unit.name, ...runStateStatus(unit.state) }));
    const childIds = children.map((unit) => unit.id);
    const { load, seed } = TRON_GRID_PLACEMENT[asset.id];
    return {
      id: asset.id,
      tag: asset.tag,
      name: asset.name,
      load,
      healthScore: asset.healthScore,
      ...tronGridAreaState(units),
      openAlarms: ALARMS.filter((alarm) => childIds.includes(alarm.assetId) && (alarm.state === 'active' || alarm.state === 'acknowledged')).length,
      units,
      trend: tronGridTrend(seed, load),
      block: tronGridBlock(asset.id),
    };
  }),
  ...TRON_GRID_EXTRA_AREAS.map((area) => {
    const { load, seed } = TRON_GRID_PLACEMENT[area.id];
    return { ...area, load, openAlarms: 0, trend: tronGridTrend(seed, load), block: tronGridBlock(area.id) };
  }),
];

/** The process route on the floor: feed in, through compression, out to export; utilities join from behind. */
const TRON_GRID_ROUTES: readonly TronGridRoute[] = [
  { id: 'feed', points: [{ x: -1.9, z: 0.5 }, { x: -0.7, z: 0.5 }], pulses: 2, duration: 5 },
  { id: 'inlet-compression', points: [{ x: -0.7, z: 0.5 }, { x: 0, z: 0.5 }], pulses: 2, duration: 3 },
  { id: 'compression-export', points: [{ x: 0, z: 0.5 }, { x: 0.7, z: 0.5 }], pulses: 2, duration: 3 },
  { id: 'export', points: [{ x: 0.7, z: 0.5 }, { x: 1.9, z: 0.5 }], pulses: 2, duration: 5 },
  { id: 'cooling', points: [{ x: -0.52, z: 1.9 }, { x: -0.52, z: 1.2 }, { x: -0.08, z: 1.2 }, { x: -0.08, z: 0.5 }], duration: 5 },
  { id: 'power', points: [{ x: 0.52, z: 1.9 }, { x: 0.52, z: 1.2 }, { x: 0.08, z: 1.2 }, { x: 0.08, z: 0.5 }], duration: 5 },
  { id: 'flare', points: [{ x: 0, z: 0.5 }, { x: 0, z: 3.4 }, { x: -1.5, z: 3.4 }], idle: true },
];

const TRON_GRID_ACTIVE_ALARMS = ALARMS.filter((alarm) => alarm.state === 'active').length;
const TRON_GRID_TRIPPED = ASSETS.filter((asset) => asset.state === 'tripped').length;

const TRON_GRID_EVENTS: readonly TickerItem[] = [
  ...ALARMS.slice(0, 5).map((alarm) => ({
    id: alarm.id,
    time: formatTime(alarm.raisedAt),
    kind: `${severityStatus(alarm.severity).label} alarm`,
    text: `${findAsset(alarm.assetId)?.tag ?? ''} ${alarm.message}`,
    tone: neonFromStatus(severityStatus(alarm.severity).tone),
  })),
  ...WORK_ORDERS.slice(0, 3).map((order, index) => ({
    id: order.id,
    time: formatTime(REFERENCE_NOW - (index + 1) * 47 * 60_000),
    kind: 'Work order',
    text: `${order.id} ${order.title}`,
    tone: 'accent' as const,
  })),
];

function tronGridDescription(area: TronGridArea): string {
  return `${area.tag} ${area.name}: load ${area.load} %, ${area.state.toLowerCase()}`;
}

function TronGridFigure({ label, value, unit, tone = 'accent' }: { label: string; value: string; unit?: string; tone?: NeonTone }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <SegmentNumerals value={value} label={label} unit={unit} tone={tone} size="md" />
    </div>
  );
}

function TronGridTopBar() {
  const plant = runStateStatus(ASSETS[0].state);
  return (
    <header className="relative flex flex-wrap items-end gap-x-8 gap-y-3 border-b border-[color:color-mix(in_oklab,var(--primary-background)_40%,transparent)] px-5 py-3">
      <div className="mr-auto flex flex-col gap-1.5">
        <GlowText variant="label">Nordkapp // Grid operations</GlowText>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <StatusIndicator tone={plant.tone} shape={plant.shape} label={`Plant ${plant.label.toLowerCase()}`} />
          <StatusIndicator tone="critical" shape="diamond" label={`${TRON_GRID_TRIPPED} unit tripped`} />
        </div>
      </div>
      <TronGridFigure label="Gas export" value={formatValue(PLANT_KPIS.gasExport.value, 2)} unit={PLANT_KPIS.gasExport.unit} />
      <TronGridFigure label="Availability" value={formatValue(PLANT_KPIS.availability.value, 1)} unit="%" />
      <TronGridFigure label="Active alarms" value={String(TRON_GRID_ACTIVE_ALARMS).padStart(2, '0')} tone="warning" />
      <div className="flex flex-col gap-1.5">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">Time UTC</span>
        <SegmentNumerals value={formatTime(REFERENCE_NOW)} label="Time, UTC" size="md" />
      </div>
    </header>
  );
}

function TronGridScene({ selectedId, onSelect }: { selectedId: string | null; onSelect: (id: string) => void }) {
  return (
    <PerspectiveGrid
      view={TRON_GRID_VIEW}
      label="Plant areas on the grid. Block height is load, edge colour is state."
      columns={20}
      rows={9}
      xMin={-2.5}
      xMax={2.5}
      zMax={6}
      horizonRings={4}
    >
      {TRON_GRID_ROUTES.map((route) => (
        <PulseLine
          key={route.id}
          d={floorPath(TRON_GRID_VIEW, route.points)}
          idle={route.idle}
          pulses={route.pulses}
          duration={route.duration}
          tone={route.idle ? 'neutral' : 'accent'}
        />
      ))}
      {paintOrder(TRON_GRID_AREAS.map((area) => ({ area, z: area.block.z }))).map(({ area }) => (
        <GridBlock
          key={area.id}
          view={TRON_GRID_VIEW}
          block={area.block}
          label={area.tag}
          value={`${area.load}%`}
          status={area.tone === 'success' ? undefined : area.state}
          description={tronGridDescription(area)}
          tone={neonFromStatus(area.tone)}
          selected={area.id === selectedId}
          onSelect={() => onSelect(area.id)}
        />
      ))}
    </PerspectiveGrid>
  );
}

function TronGridPlantPanel({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <NeonPanel title="Plant overview" meta="NK" className="h-full">
      <p className="text-sm text-medium-foreground">Select an area on the grid or in this list to open its readout.</p>
      <ul className="mt-3 flex flex-col">
        {TRON_GRID_AREAS.map((area) => (
          <li key={area.id}>
            <button
              type="button"
              onClick={() => onSelect(area.id)}
              className="flex w-full items-center gap-3 border-b border-default py-2 text-left text-sm outline-none hover:bg-[color-mix(in_oklab,var(--primary-background)_10%,transparent)] focus-visible:bg-[color-mix(in_oklab,var(--primary-background)_18%,transparent)]"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="font-mono font-medium text-base-foreground">{area.tag}</span>
                <span className="text-xs text-muted-foreground">{area.name}</span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-0.5">
                <span className="font-mono tabular-nums text-base-foreground">{area.load} %</span>
                <StatusIndicator tone={area.tone} shape={area.shape} label={area.state} size="sm" />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </NeonPanel>
  );
}

function TronGridAreaPanel({ area, onClose }: { area: TronGridArea; onClose?: () => void }) {
  const tone = neonFromStatus(area.tone);
  return (
    <NeonPanel title="Area readout" meta={area.tag} tone={tone} className="h-full">
      <div className="flex flex-col gap-1">
        <span className="text-base font-semibold text-base-foreground">{area.name}</span>
        <StatusIndicator tone={area.tone} shape={area.shape} label={area.state} />
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Load</span>
          <SegmentNumerals value={String(area.load)} label="Load" unit="%" tone={tone} size="lg" />
        </div>
        <dl className="grid grid-cols-[auto_auto] gap-x-3 gap-y-1 text-xs">
          <dt className="text-muted-foreground">Health</dt>
          <dd className="text-right font-mono tabular-nums text-base-foreground">{area.healthScore}</dd>
          <dt className="text-muted-foreground">Open alarms</dt>
          <dd className="text-right font-mono tabular-nums text-base-foreground">{area.openAlarms}</dd>
        </dl>
      </div>

      <div className="mt-3">
        <NeonSparkline values={area.trend} label={`${area.tag} load, last 24 hours`} unit="%" decimals={0} tone={tone} height={56} />
        <div className="flex justify-between pt-1 font-mono text-xs text-muted-foreground">
          <span>-24 h</span>
          <span>now</span>
        </div>
      </div>

      <h4 className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">Units</h4>
      <ul className="mt-1 flex flex-col">
        {area.units.map((unit) => (
          <li key={unit.tag} className="flex items-center justify-between gap-3 border-b border-default py-1.5 text-xs">
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="font-mono font-medium text-base-foreground">{unit.tag}</span>
              <span className="text-muted-foreground">{unit.name}</span>
            </span>
            <StatusIndicator tone={unit.tone} shape={unit.shape} label={unit.label} size="sm" className="shrink-0" />
          </li>
        ))}
      </ul>

      {onClose ? (
        <div className="mt-auto pt-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            <IconArrowLeft />
            Back to plant
          </Button>
        </div>
      ) : null}
    </NeonPanel>
  );
}

const TRON_GRID_LEGEND = [
  runStateStatus('running'),
  runStateStatus('maintenance'),
  { ...runStateStatus('tripped'), label: 'Unit tripped' },
  runStateStatus('standby'),
];

/** Reads the scene: what height, edge colour and pulses mean. Sits in the sky, clear of the blocks. */
function TronGridLegend() {
  return (
    <div className="pointer-events-none absolute left-5 top-4 flex flex-col gap-2 text-xs">
      <GlowText variant="label">Sector NK // Process route</GlowText>
      <p className="text-muted-foreground">Height is load. Edge is the state of the worst unit. Pulses follow the flow.</p>
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {TRON_GRID_LEGEND.map((entry) => (
          <li key={entry.label}>
            <StatusIndicator tone={entry.tone} shape={entry.shape} label={entry.label} size="sm" />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Faint scan lines and an edge vignette over the scene. Both are built from tokens. */
function TronGridScanlines() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,color-mix(in_oklab,var(--primary-background)_5%,transparent)_0,color-mix(in_oklab,var(--primary-background)_5%,transparent)_1px,transparent_1px,transparent_4px)]"
    />
  );
}

function TronGridScreen({ initialAreaId = null }: { initialAreaId?: string | null }) {
  const [selectedId, setSelectedId] = useState<string | null>(initialAreaId);
  const selected = TRON_GRID_AREAS.find((area) => area.id === selectedId);
  const toggle = (id: string) => setSelectedId((current) => (current === id ? null : id));

  return (
    <div className="relative flex h-[44rem] flex-col overflow-hidden rounded-xl border border-default bg-base-background text-base-foreground">
      <TronGridTopBar />
      <div className="relative flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1">
          <TronGridScene selectedId={selectedId} onSelect={toggle} />
          <TronGridScanlines />
          <TronGridLegend />
        </div>
        <aside className="relative w-80 shrink-0 p-4 pl-2">
          {selected ? <TronGridAreaPanel area={selected} onClose={() => setSelectedId(null)} /> : <TronGridPlantPanel onSelect={toggle} />}
        </aside>
      </div>
      <footer className="relative border-t border-[color:color-mix(in_oklab,var(--primary-background)_40%,transparent)] px-3">
        <EventTicker items={TRON_GRID_EVENTS} label="Recent events" />
      </footer>
    </div>
  );
}

function TronGridStage({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <ThemeScope preset="tron" className="w-full">
      <div className={`rounded-xl border border-default bg-base-background p-5 text-base-foreground ${className}`.trim()}>{children}</div>
    </ThemeScope>
  );
}

function TronGridOpsExperience() {
  return (
    <ThemeScope preset="tron" className="w-full">
      <TronGridScreen />
    </ThemeScope>
  );
}

function TronGridOpsNeonDusk() {
  return (
    <ThemeScope preset="neon-dusk" className="w-full">
      <TronGridScreen initialAreaId="nk-23" />
    </ThemeScope>
  );
}

function TronGridOpsNightVision() {
  return (
    <ThemeScope preset="night-vision" className="w-full">
      <TronGridScreen initialAreaId="nk-40" />
    </ThemeScope>
  );
}

function TronGridPartFloor() {
  const view: GridView = { width: 480, height: 280, horizonY: 80, foreshortening: 0.55 };
  const [selected, setSelected] = useState(false);
  return (
    <TronGridStage className="h-80 overflow-hidden">
      <PerspectiveGrid view={view} label="A floor grid with one selectable block and a route" columns={16} rows={7} zMax={5}>
        <PulseLine d={floorPath(view, [{ x: -1.6, z: 0.6 }, { x: 0.4, z: 0.6 }, { x: 0.4, z: 2.4 }, { x: 1.8, z: 2.4 }])} pulses={2} duration={5} />
        <GridBlock
          view={view}
          block={{ x: -0.3, z: 0.6, width: 0.4, depth: 0.4, height: 0.34 }}
          label="NK-27"
          value="73%"
          description="NK-27 Gas export: load 73 %, running"
          selected={selected}
          onSelect={() => setSelected((current) => !current)}
        />
      </PerspectiveGrid>
    </TronGridStage>
  );
}

function TronGridPartBlockStates() {
  const view: GridView = { width: 480, height: 280, horizonY: 60, foreshortening: 0.5 };
  const blocks = [
    { tag: 'NK-20', value: '64%', status: undefined, tone: 'accent', height: 0.28, x: -0.72 },
    { tag: 'NK-40', value: '41%', status: 'Maintenance', tone: 'warning', height: 0.2, x: -0.24 },
    { tag: 'NK-23', value: '88%', status: 'Unit tripped', tone: 'critical', height: 0.38, x: 0.24 },
    { tag: 'NK-43', value: '12%', status: 'Standby', tone: 'info', height: 0.1, x: 0.72 },
  ] as const;
  return (
    <TronGridStage className="h-80 overflow-hidden">
      <PerspectiveGrid view={view} label="Blocks in each state: running, maintenance, tripped and standby" columns={16} rows={6} zMax={5}>
        {blocks.map((block) => (
          <GridBlock
            key={block.tag}
            view={view}
            block={{ x: block.x, z: 0.5, width: 0.3, depth: 0.3, height: block.height }}
            label={block.tag}
            value={block.value}
            status={block.status}
            description={`${block.tag}: load ${block.value}, ${block.status ?? 'running'}`}
            tone={block.tone}
          />
        ))}
      </PerspectiveGrid>
    </TronGridStage>
  );
}

function TronGridPartPanel() {
  return (
    <TronGridStage className="h-[34rem]">
      <TronGridAreaPanel area={TRON_GRID_AREAS[1]} />
    </TronGridStage>
  );
}

function TronGridPartNumerals() {
  return (
    <TronGridStage>
      <div className="flex flex-col gap-5">
        <TronGridFigure label="Gas export" value="4.38" unit="MSm³/d" />
        <div className="flex flex-col gap-1.5">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Time UTC</span>
          <SegmentNumerals value="14:00" label="Time, UTC" size="lg" />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Vibration, tripped</span>
          <SegmentNumerals value="11.6" label="Vibration" unit="mm/s" tone="critical" size="lg" />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Compact, no ghost segments</span>
          <SegmentNumerals value="182,400" label="Gas flow" unit="Sm³/h" size="sm" ghost={false} />
        </div>
      </div>
    </TronGridStage>
  );
}

function TronGridPartPulseLine() {
  return (
    <TronGridStage>
      <svg viewBox="0 0 280 150" role="img" aria-label="Three connector lines: flowing, alarm and idle" className="block w-full">
        <PulseLine d="M 10 30 H 120 L 150 55 H 270" pulses={2} duration={3} />
        <PulseLine d="M 10 80 H 270" tone="critical" pulses={1} duration={2} />
        <PulseLine d="M 10 125 H 150 L 180 100 H 270" tone="neutral" idle />
        <g className="fill-muted-foreground font-mono text-[0.6875rem]">
          <text x={10} y={18}>
            Flowing
          </text>
          <text x={10} y={70}>
            In alarm
          </text>
          <text x={10} y={115}>
            Idle route
          </text>
        </g>
      </svg>
    </TronGridStage>
  );
}

function TronGridPartSparkline() {
  const area = TRON_GRID_AREAS[1];
  return (
    <TronGridStage>
      <div className="flex flex-col gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Load, last 24 hours</span>
          <NeonSparkline values={area.trend} label="NK-23 load, last 24 hours" unit="%" decimals={0} height={56} />
        </div>
        <div>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Against a limit, in alarm</span>
          <NeonSparkline values={area.trend} label="NK-23 load against its limit" unit="%" decimals={0} limit={85} tone="warning" height={56} />
        </div>
      </div>
    </TronGridStage>
  );
}

function TronGridPartGlowText() {
  return (
    <TronGridStage>
      <div className="flex flex-col gap-3">
        <GlowText variant="label">Nordkapp // Grid operations</GlowText>
        <GlowText mono className="text-2xl font-semibold">
          23-KA-9101
        </GlowText>
        <GlowText tone="critical" variant="label">
          Unit tripped
        </GlowText>
        <GlowText tone="warning" variant="label">
          Maintenance
        </GlowText>
        <GlowText glow={false} className="text-sm">
          Without the halo, for dense runs of text.
        </GlowText>
      </div>
    </TronGridStage>
  );
}

function TronGridPartTicker() {
  return (
    <TronGridStage>
      <EventTicker items={TRON_GRID_EVENTS} label="Recent events" />
    </TronGridStage>
  );
}

export default definePage({
  id: 'tron-grid-ops',
  title: 'Grid operations',
  summary:
    'The plant as neon blocks on a perspective grid: height is load, edge colour is state, and pulses of light run the process route. A showpiece overview for a wall or a demo that still answers "what is running and what is not".',
  guidance: {
    use: [
      'As an overview for a wall display, a lobby or a customer demo, where presence matters as much as density.',
      'For six to ten areas with one headline value each; the grid is a stage, not a table.',
      'With a dark futuristic theme. Every colour is a token, so the accent follows the theme.',
      'Pair every block with a row in the list beside it, so the screen works without a pointer.',
    ],
    avoid: [
      'As the working screen of a control room — operators need the dense console, not perspective.',
      'More than about ten blocks: they start to hide each other.',
      'Encoding state in edge colour alone; abnormal blocks also say their state in words.',
      'Fast or constant motion. Pulses are slow, the ticker pauses, and both stop with reduced motion.',
    ],
  },
  source,
  sections: [
    {
      id: 'experience',
      title: 'Experience',
      description:
        'Shown in the Tron theme. Click a block, or a row in the panel, to lift it and open its readout; click it again or use Back to plant to return. Tab reaches every block; Enter or Space selects. Pause the ticker with its button.',
      specimens: [
        {
          id: 'TronGridOpsExperience',
          title: 'Grid operations',
          note: 'Pick it when the overview has to impress first and inform second, on a wall display or in a demo.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'experiences/futuristic/PerspectiveGrid.tsx',
            'experiences/futuristic/GridBlock.tsx',
            'experiences/futuristic/PulseLine.tsx',
            'experiences/futuristic/NeonPanel.tsx',
            'experiences/futuristic/SegmentNumerals.tsx',
            'experiences/futuristic/NeonSparkline.tsx',
            'experiences/futuristic/EventTicker.tsx',
            'experiences/futuristic/GlowText.tsx',
            'experiences/futuristic/perspective.ts',
            'experiences/futuristic/neon.ts',
            'industrial/StatusIndicator.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: TronGridOpsExperience,
        },
      ],
    },
    {
      id: 'themes',
      title: 'Themes',
      description: 'The same screen in two other presets, each opened on a selected area. Nothing changes but the tokens.',
      specimens: [
        {
          id: 'TronGridOpsNeonDusk',
          title: 'Neon dusk',
          note: 'Pick it for showpiece and AI screens; purple lines and grotesk type soften the instrument feel.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: TronGridOpsNeonDusk,
        },
        {
          id: 'TronGridOpsNightVision',
          title: 'Night vision',
          note: 'Pick it for surveillance-style monitoring rooms; green on black with monospaced type.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: TronGridOpsNightVision,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The reusable pieces on their own stage. Each takes its data through props and its colour from one neon tone.',
      specimens: [
        {
          id: 'TronGridPartFloor',
          title: 'Perspective floor',
          note: 'Pick it as the stage whenever things should stand in a space rather than sit in a grid.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'experiences/futuristic/PerspectiveGrid.tsx',
            'experiences/futuristic/GridBlock.tsx',
            'experiences/futuristic/PulseLine.tsx',
            'experiences/futuristic/perspective.ts',
          ],
          Component: TronGridPartFloor,
        },
        {
          id: 'TronGridPartBlockStates',
          title: 'Block states',
          note: 'Pick the tone from the state and add the state in words for anything that is not running.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['experiences/futuristic/GridBlock.tsx', 'experiences/futuristic/PerspectiveGrid.tsx', 'experiences/futuristic/neon.ts'],
          Component: TronGridPartBlockStates,
        },
        {
          id: 'TronGridPartPanel',
          title: 'Framed readout panel',
          note: 'Pick it for the one panel that answers a selection; its outline takes the tone of what is selected.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'experiences/futuristic/NeonPanel.tsx',
            'experiences/futuristic/SegmentNumerals.tsx',
            'experiences/futuristic/NeonSparkline.tsx',
            'industrial/StatusIndicator.tsx',
          ],
          Component: TronGridPartPanel,
        },
        {
          id: 'TronGridPartNumerals',
          title: 'Segment numerals',
          note: 'Pick them for the three or four headline figures of a screen, never for a table of values.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['experiences/futuristic/SegmentNumerals.tsx', 'experiences/futuristic/segments.ts'],
          Component: TronGridPartNumerals,
        },
        {
          id: 'TronGridPartPulseLine',
          title: 'Pulse line',
          note: 'Pick it to show which way something flows; use the idle variant for a route that is not in use.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          surface: 'muted',
          uses: ['experiences/futuristic/PulseLine.tsx', 'experiences/futuristic/usePrefersReducedMotion.ts'],
          Component: TronGridPartPulseLine,
        },
        {
          id: 'TronGridPartSparkline',
          title: 'Neon sparkline',
          note: 'Pick it for a trend inside a neon panel; on ordinary screens the plain sparkline is the better choice.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          surface: 'muted',
          uses: ['experiences/futuristic/NeonSparkline.tsx', 'industrial/sparklinePath.ts'],
          Component: TronGridPartSparkline,
        },
        {
          id: 'TronGridPartGlowText',
          title: 'Glow text',
          note: 'Pick it for titles, captions and single figures; body text stays in the normal foreground.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          surface: 'muted',
          uses: ['experiences/futuristic/GlowText.tsx', 'experiences/futuristic/neon.ts'],
          Component: TronGridPartGlowText,
        },
        {
          id: 'TronGridPartTicker',
          title: 'Event ticker',
          note: 'Pick it for ambient awareness along the bottom edge; it pauses on request and stands still with reduced motion.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['experiences/futuristic/EventTicker.tsx', 'experiences/futuristic/usePrefersReducedMotion.ts'],
          Component: TronGridPartTicker,
        },
      ],
    },
  ],
});
