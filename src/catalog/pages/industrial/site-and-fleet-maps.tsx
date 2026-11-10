import { Card, CardContent, CardDescription, CardHeader, CardHeaderCenter, CardHeaderEnd, CardTitle } from '@cognite/aura/components/card';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { HeatMapGrid } from '../../../library/industrial/charts/HeatMapGrid';
import { AreaBlock } from '../../../library/industrial/diagrams/AreaBlock';
import { DiagramCanvas } from '../../../library/industrial/diagrams/DiagramCanvas';
import { EquipmentSymbol } from '../../../library/industrial/diagrams/EquipmentSymbol';
import { PipeLine } from '../../../library/industrial/diagrams/PipeLine';
import { ValueTag } from '../../../library/industrial/diagrams/ValueTag';
import { ValveSymbol } from '../../../library/industrial/diagrams/ValveSymbol';
import { LevelMeter } from '../../../library/industrial/LevelMeter';
import { runStateStatus, severityStatus } from '../../../library/industrial/status';
import type { DotShape, StatusDescriptor, Tone } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { ALARMS, ASSETS, PLANT_KPIS, SITES, WORK_ORDERS } from '../../data/plant';
import type { RunState } from '../../data/plant';
import { REFERENCE_NOW, formatAgo, formatTime } from '../../data/series';
import { definePage } from '../../types';

import source from './site-and-fleet-maps.tsx?raw';

type PlantArea = {
  id: string;
  tag: string;
  name: string;
  state: RunState;
  /** Grid placement on the six-column plot plan. */
  span: string;
  /** What is in the area, for the detail panel. */
  contents: string;
};

/**
 * Plot plan of the Nordkapp plant. The first four areas are the plant's asset hierarchy; the
 * rest are the supporting areas every site has.
 */
const PLANT_AREAS: readonly PlantArea[] = [
  { id: 'nk-20', tag: 'NK-20', name: 'Inlet and separation', state: 'running', span: 'col-span-2', contents: '2 separators · 1 shutdown valve' },
  { id: 'nk-23', tag: 'NK-23', name: 'Gas compression', state: 'running', span: 'col-span-2 row-span-2', contents: '3 compressors · 1 turbine · 1 cooler' },
  { id: 'nk-27', tag: 'NK-27', name: 'Gas export', state: 'running', span: 'col-span-2', contents: '2 export pumps · metering' },
  { id: 'nk-40', tag: 'NK-40', name: 'Cooling water', state: 'running', span: 'col-span-2', contents: '2 pumps · 1 cooler' },
  { id: 'nk-60', tag: 'NK-60', name: 'Tank farm', state: 'running', span: 'col-span-2', contents: '4 storage tanks' },
  { id: 'nk-50', tag: 'NK-50', name: 'Power and utilities', state: 'running', span: 'col-span-2', contents: 'Switchboard 82-EN-001 · emergency generator' },
  { id: 'nk-80', tag: 'NK-80', name: 'Flare', state: 'standby', span: 'col-span-2', contents: 'Flare stack · knock-out drum' },
  { id: 'nk-90', tag: 'NK-90', name: 'Control room', state: 'running', span: 'col-span-2', contents: 'Muster point A · 24 on site' },
];

const SEVERITY_RANK = { critical: 0, high: 1, medium: 2, low: 3 } as const;

/** Active alarms on equipment in an area, worst first. */
function activeAlarmsIn(areaId: string) {
  return ALARMS.filter((alarm) => alarm.state === 'active' && ASSETS.some((asset) => asset.id === alarm.assetId && asset.parentId === areaId)).sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
  );
}

/** Count and tone of an area's active alarms, in the shape `AreaBlock` takes. */
function alarmSummary(areaId: string): { alarmCount: number; alarmTone: Tone; tone: 'neutral' | 'critical' } {
  const alarms = activeAlarmsIn(areaId);
  const worst = alarms[0];
  return {
    alarmCount: alarms.length,
    alarmTone: worst ? severityStatus(worst.severity).tone : 'neutral',
    tone: worst?.severity === 'critical' ? 'critical' : 'neutral',
  };
}

type FleetSite = {
  id: string;
  kind: string;
  state: RunState;
  /** Shown instead of the run state when it says more. */
  stateLabel?: string;
  alarms: number;
  alarmTone: Tone;
  availability: number;
  output: number;
  outputUnit: string;
  /** Position on the schematic region, in diagram units. */
  x: number;
  y: number;
  labelSide: 'start' | 'end';
};

/** Roll-up figures per site. Nordkapp agrees with the plant KPIs used across the library. */
const FLEET: readonly FleetSite[] = [
  { id: 'hammerfest', kind: 'LNG plant', state: 'maintenance', stateLabel: 'Turnaround', alarms: 0, alarmTone: 'neutral', availability: 71.5, output: 0, outputUnit: 'MSm³/d', x: 318, y: 66, labelSide: 'end' },
  { id: 'nordkapp', kind: 'Gas processing plant', state: 'running', alarms: PLANT_KPIS.activeAlarms.value, alarmTone: 'critical', availability: PLANT_KPIS.availability.value, output: PLANT_KPIS.gasExport.value, outputUnit: PLANT_KPIS.gasExport.unit, x: 150, y: 120, labelSide: 'end' },
  { id: 'stord', kind: 'Export terminal', state: 'running', alarms: 0, alarmTone: 'neutral', availability: 99.1, output: 3.92, outputUnit: 'MSm³/d', x: 138, y: 226, labelSide: 'start' },
  { id: 'valhall-sor', kind: 'Offshore platform', state: 'running', alarms: 1, alarmTone: 'warning', availability: 98.2, output: 1.84, outputUnit: 'MSm³/d', x: 70, y: 268, labelSide: 'start' },
];

function siteOf(fleetSite: FleetSite) {
  const site = SITES.find((candidate) => candidate.id === fleetSite.id);
  if (!site) throw new Error(`Unknown site ${fleetSite.id}`);
  return site;
}

const siteStatus = (site: FleetSite): StatusDescriptor => ({ ...runStateStatus(site.state), label: site.stateLabel ?? runStateStatus(site.state).label });

/** The mark a site gets on the map: shape and tone follow its worst alarm, or its state. */
function pinOf(site: FleetSite): { tone: Tone; shape: DotShape } {
  if (site.alarmTone === 'critical') return { tone: 'critical', shape: 'diamond' };
  if (site.alarmTone === 'warning') return { tone: 'warning', shape: 'square' };
  return site.state === 'running' ? { tone: 'neutral', shape: 'dot' } : { tone: 'neutral', shape: 'ring' };
}

const PIN_FILL: Record<Tone, string> = {
  neutral: 'fill-medium-foreground',
  success: 'fill-success-foreground-strong',
  warning: 'fill-warning-foreground-strong',
  critical: 'fill-critical-foreground-strong',
  info: 'fill-info-foreground-strong',
};

const PIN_STROKE: Record<Tone, string> = {
  neutral: 'stroke-medium-foreground',
  success: 'stroke-success-foreground-strong',
  warning: 'stroke-warning-foreground-strong',
  critical: 'stroke-critical-foreground-strong',
  info: 'stroke-info-foreground-strong',
};

/** A map mark in the shared status shapes, so a state reads without colour. Draw inside a canvas. */
function SiteMapPin({ x, y, tone = 'neutral', shape = 'dot', selected = false, size = 6 }: { x: number; y: number; tone?: Tone; shape?: DotShape; selected?: boolean; size?: number }) {
  return (
    <g>
      {selected ? <circle cx={x} cy={y} r={size + 6} strokeWidth={1.5} className="fill-base-background stroke-emphasized" /> : null}
      {shape === 'dot' ? <circle cx={x} cy={y} r={size} className={PIN_FILL[tone]} /> : null}
      {shape === 'ring' ? <circle cx={x} cy={y} r={size - 1} strokeWidth={2} className={`fill-base-background ${PIN_STROKE[tone]}`} /> : null}
      {shape === 'square' ? <rect x={x - size} y={y - size} width={size * 2} height={size * 2} rx={1.5} className={PIN_FILL[tone]} /> : null}
      {shape === 'diamond' ? (
        <rect x={x - size} y={y - size} width={size * 2} height={size * 2} rx={1.5} transform={`rotate(45 ${x} ${y})`} className={PIN_FILL[tone]} />
      ) : null}
    </g>
  );
}

/** Text on a map. */
function SiteMapText({ x, y, anchor = 'start', quiet = false, mono = false, children }: { x: number; y: number; anchor?: 'start' | 'middle' | 'end'; quiet?: boolean; mono?: boolean; children: ReactNode }) {
  return (
    <text x={x} y={y} fontSize={10} textAnchor={anchor} className={`tabular-nums ${quiet ? 'fill-muted-foreground' : 'fill-base-foreground'} ${mono ? 'font-mono' : ''}`}>
      {children}
    </text>
  );
}

/** The plot plan as a grid of area blocks. Pass a handler to make the blocks selectable. */
function SiteMapPlan({ selectedId, onSelect }: { selectedId?: string; onSelect?: (areaId: string) => void }) {
  return (
    <div role="group" aria-label="Nordkapp plot plan" className="grid w-full auto-rows-fr grid-cols-6 gap-2">
      {PLANT_AREAS.map((area) => (
        <AreaBlock
          key={area.id}
          className={area.span}
          name={area.name}
          tag={area.tag}
          status={runStateStatus(area.state)}
          selected={area.id === selectedId}
          onSelect={onSelect ? () => onSelect(area.id) : undefined}
          {...alarmSummary(area.id)}
        />
      ))}
    </div>
  );
}

/** The plot plan without text: blocks only, tinted where an area has a critical alarm. */
function SiteMapThumbnail({ highlightId }: { highlightId?: string }) {
  const withAlarms = PLANT_AREAS.filter((area) => alarmSummary(area.id).alarmCount > 0).length;
  return (
    <div role="img" aria-label={`Nordkapp plot plan thumbnail, ${withAlarms} of ${PLANT_AREAS.length} areas with active alarms`} className="grid w-full max-w-48 grid-cols-6 gap-1">
      {PLANT_AREAS.map((area) => (
        <span
          key={area.id}
          className={`${area.span} min-h-5 rounded-xs border ${alarmSummary(area.id).tone === 'critical' ? 'bg-critical-background' : 'bg-muted-background'} ${
            area.id === highlightId ? 'border-emphasized' : 'border-transparent'
          }`}
        />
      ))}
    </div>
  );
}

/** The fleet on an abstract coast: land as one plain shape, sites as status marks. */
function SiteMapRegion({ selectedId }: { selectedId?: string }) {
  return (
    <DiagramCanvas
      label={`Schematic map of ${FLEET.length} sites along the Norwegian coast: ${FLEET.map((site) => `${siteOf(site).name}, ${siteStatus(site).label.toLowerCase()}, ${site.alarms} active alarms`).join('; ')}`}
      width={420}
      height={300}
    >
      <path d="M 150 300 L 124 232 L 152 172 L 212 112 L 292 62 L 372 30 L 412 36 L 420 64 L 420 300 Z" className="fill-muted-background" />
      <SiteMapText x={300} y={22} anchor="end" quiet>
        Barents Sea
      </SiteMapText>
      <SiteMapText x={24} y={70} quiet>
        Norwegian Sea
      </SiteMapText>
      <SiteMapText x={16} y={206} quiet>
        North Sea
      </SiteMapText>
      {FLEET.map((site) => {
        const offset = site.labelSide === 'start' ? 16 : -16;
        return (
          <g key={site.id}>
            <SiteMapPin x={site.x} y={site.y} selected={site.id === selectedId} {...pinOf(site)} />
            <SiteMapText x={site.x + offset} y={site.y - 1} anchor={site.labelSide}>
              {siteOf(site).name}
            </SiteMapText>
            <SiteMapText x={site.x + offset} y={site.y + 12} anchor={site.labelSide} quiet>
              {site.alarms > 0 ? `${site.alarms} ${site.alarms === 1 ? 'alarm' : 'alarms'}` : siteStatus(site).label}
            </SiteMapText>
          </g>
        );
      })}
    </DiagramCanvas>
  );
}

const TANKS = [
  { tag: '60-TA-6001', name: 'Condensate A', level: 72.4, volume: 3620 },
  { tag: '60-TA-6002', name: 'Condensate B', level: 41.0, volume: 2050 },
  { tag: '60-TA-6003', name: 'Produced water', level: 88.2, volume: 1760 },
  { tag: '60-TA-6004', name: 'Methanol', level: 12.6, volume: 126 },
] as const;

const TANK_LIMITS = { low: 15, high: 85, highHigh: 95 };

function SiteMapAreaBlock() {
  const area = PLANT_AREAS[0];
  return (
    <div className="w-full max-w-56">
      <AreaBlock name={area.name} tag={area.tag} status={runStateStatus(area.state)} />
    </div>
  );
}

function SiteMapAreaBlockWithReading() {
  return (
    <div className="w-full max-w-56">
      <AreaBlock name="Gas export" tag="NK-27" status={runStateStatus('running')}>
        <ValueReadout size="sm" value={PLANT_KPIS.gasExport.value} unit={PLANT_KPIS.gasExport.unit} decimals={2} />
      </AreaBlock>
    </div>
  );
}

function SiteMapPinStates() {
  const pins = [
    { label: 'Normal', tone: 'neutral', shape: 'dot', selected: false },
    { label: 'Not producing', tone: 'neutral', shape: 'ring', selected: false },
    { label: 'Warning alarm', tone: 'warning', shape: 'square', selected: false },
    { label: 'Critical alarm', tone: 'critical', shape: 'diamond', selected: false },
    { label: 'Selected', tone: 'neutral', shape: 'dot', selected: true },
  ] as const;
  return (
    <ul className="flex flex-col gap-2">
      {pins.map((pin) => (
        <li key={pin.label} className="flex items-center gap-3 text-xs text-base-foreground">
          <svg role="img" aria-label={`${pin.label} pin`} viewBox="0 0 28 28" className="size-7">
            <SiteMapPin x={14} y={14} tone={pin.tone} shape={pin.shape} selected={pin.selected} />
          </svg>
          {pin.label}
        </li>
      ))}
    </ul>
  );
}

function SiteMapAreaBlockStates() {
  return (
    <div className="grid w-full grid-cols-2 gap-2 lg:grid-cols-3">
      <AreaBlock name="Running, no alarms" tag="NK-20" status={runStateStatus('running')} />
      <AreaBlock name="With a low alarm" tag="NK-27" status={runStateStatus('running')} alarmCount={1} alarmTone="neutral" />
      <AreaBlock name="With a critical alarm" tag="NK-23" status={runStateStatus('running')} alarmCount={2} tone="critical" />
      <AreaBlock name="Under maintenance" tag="NK-40" status={runStateStatus('maintenance')} tone="warning" />
      <AreaBlock name="Standby" tag="NK-80" status={runStateStatus('standby')} />
      <AreaBlock name="Selected" tag="NK-60" status={runStateStatus('running')} selected />
    </div>
  );
}

function SiteMapLegend() {
  return (
    <ul className="flex w-full max-w-56 flex-col gap-3 text-xs text-base-foreground">
      <li className="flex items-center gap-3">
        <span aria-hidden className="h-5 w-8 shrink-0 rounded-xs bg-muted-background" />
        Area
      </li>
      <li className="flex items-center gap-3">
        <span aria-hidden className="h-5 w-8 shrink-0 rounded-xs bg-critical-background" />
        Area with a critical alarm
      </li>
      <li className="flex items-center gap-3">
        <span aria-hidden className="h-5 w-8 shrink-0 rounded-xs border border-emphasized bg-muted-background" />
        Selected area
      </li>
      <li className="flex items-center gap-3">
        <span aria-hidden className="h-0 w-8 shrink-0 border-t border-dashed border-emphasized" />
        Escape route
      </li>
      <li className="flex items-center gap-3">
        <span aria-hidden className="mx-2.5 size-3 shrink-0 rounded-xs bg-medium-foreground" />
        Muster point
      </li>
    </ul>
  );
}

function SiteMapTankSingle() {
  const tank = TANKS[0];
  return (
    <div className="flex items-center gap-4">
      <LevelMeter height={96} showReadout={false} label={`${tank.name} level`} value={tank.level} decimals={1} limits={TANK_LIMITS} />
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-xs text-muted-foreground">{tank.tag}</span>
        <span className="text-sm font-medium text-base-foreground">{tank.name}</span>
        <ValueReadout size="sm" value={tank.level} unit="%" decimals={1} />
        <span className="text-xs text-muted-foreground tabular-nums">{tank.volume.toLocaleString('en-US')} m³</span>
      </div>
    </div>
  );
}

function SiteMapPipelineStation() {
  return (
    <DiagramCanvas label="Valve station VS-1 at kilometre 42 on the export pipeline, valve open, 141.2 barg" width={260} height={130}>
      <PipeLine points={[{ x: 8, y: 84 }, { x: 116, y: 84 }]} weight="heavy" flow="forward" />
      <PipeLine points={[{ x: 144, y: 84 }, { x: 252, y: 84 }]} weight="heavy" flow="forward" />
      <ValveSymbol type="gate" position="open" size={40} cx={130} cy={79} label="Valve station VS-1" />
      <ValueTag x={130} y={10} anchor="middle" label="VS-1" value={141.2} unit="barg" decimals={1} />
      <path d="M 130 98 V 106" strokeWidth={1} className="stroke-muted-foreground" />
      <SiteMapText x={130} y={120} anchor="middle" quiet>
        km 42
      </SiteMapText>
    </DiagramCanvas>
  );
}

function SiteMapScaleAndNorth() {
  return (
    <DiagramCanvas label="Scale bar of 100 metres and a north arrow" width={220} height={90}>
      <path d="M 20 56 H 140 M 20 50 V 62 M 80 52 V 60 M 140 50 V 62" strokeWidth={1.5} className="stroke-medium-foreground" />
      <SiteMapText x={20} y={78} anchor="middle" quiet>
        0
      </SiteMapText>
      <SiteMapText x={80} y={78} anchor="middle" quiet>
        50
      </SiteMapText>
      <SiteMapText x={140} y={78} anchor="middle" quiet>
        100 m
      </SiteMapText>
      <path d="M 190 62 V 26 M 183 36 L 190 24 L 197 36" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="stroke-medium-foreground" />
      <SiteMapText x={190} y={16} anchor="middle">
        N
      </SiteMapText>
      <SiteMapText x={20} y={30} quiet>
        Schematic, not to scale
      </SiteMapText>
    </DiagramCanvas>
  );
}

function SiteMapPlotPlan() {
  return <SiteMapPlan />;
}

function SiteMapPlotPlanCompact() {
  return (
    <div className="flex flex-col items-center gap-3">
      <SiteMapThumbnail />
      <div className="flex flex-col items-center gap-1">
        <span className="text-sm font-medium text-base-foreground">Nordkapp</span>
        <StatusIndicator size="sm" tone="critical" shape="diamond" label="1 area with a critical alarm" />
      </div>
    </div>
  );
}

function SiteMapSelectedArea() {
  const [selectedId, setSelectedId] = useState('nk-23');
  const area = PLANT_AREAS.find((candidate) => candidate.id === selectedId) ?? PLANT_AREAS[1];
  const alarms = activeAlarmsIn(area.id);
  const equipment = ASSETS.filter((asset) => asset.parentId === area.id);
  const openOrders = WORK_ORDERS.filter((order) => order.status !== 'done' && equipment.some((asset) => asset.id === order.assetId)).length;
  return (
    <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <SiteMapPlan selectedId={selectedId} onSelect={setSelectedId} />
      <section aria-live="polite" aria-label="Selected area" className="flex flex-col gap-4 rounded-lg bg-muted-background p-4">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs text-muted-foreground">{area.tag}</span>
          <h4 className="text-sm font-medium text-base-foreground">{area.name}</h4>
          <span className="text-xs text-muted-foreground">{area.contents}</span>
        </div>
        <div className="flex gap-8">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Active alarms</span>
            <ValueReadout size="sm" value={alarms.length} tone={alarms[0]?.severity === 'critical' ? 'critical' : 'neutral'} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Open work orders</span>
            <ValueReadout size="sm" value={openOrders} />
          </div>
        </div>
        {alarms.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {alarms.map((alarm) => (
              <li key={alarm.id} className="flex flex-col gap-0.5">
                <StatusIndicator size="sm" {...severityStatus(alarm.severity)} detail={formatAgo(alarm.raisedAt)} />
                <span className="text-xs text-base-foreground">{alarm.message}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">No active alarms in this area.</p>
        )}
      </section>
    </div>
  );
}

type DeckBlock = { name: string; tag: string; span: string; state: RunState; alarmCount?: number; alarmTone?: Tone };

const DECKS: Record<string, { name: string; elevation: string; blocks: readonly DeckBlock[] }> = {
  weather: {
    name: 'Weather deck',
    elevation: '+42 m',
    blocks: [
      { name: 'Helideck', tag: 'W-01', span: 'col-span-2', state: 'standby' },
      { name: 'Crane and laydown', tag: 'W-02', span: 'col-span-2', state: 'running' },
      { name: 'Living quarters', tag: 'W-03', span: 'col-span-2', state: 'running' },
      { name: 'Flare boom', tag: 'W-04', span: 'col-span-4', state: 'standby' },
    ],
  },
  process: {
    name: 'Process deck',
    elevation: '+31 m',
    blocks: [
      { name: 'Separation', tag: 'P-01', span: 'col-span-2', state: 'running' },
      { name: 'Gas compression', tag: 'P-02', span: 'col-span-2', state: 'running', alarmCount: 1, alarmTone: 'warning' },
      { name: 'Local equipment room', tag: 'P-03', span: 'col-span-2', state: 'running' },
      { name: 'Water injection', tag: 'P-04', span: 'col-span-2', state: 'maintenance' },
    ],
  },
  cellar: {
    name: 'Cellar deck',
    elevation: '+22 m',
    blocks: [
      { name: 'Wellheads', tag: 'C-01', span: 'col-span-2', state: 'running' },
      { name: 'Manifolds', tag: 'C-02', span: 'col-span-2', state: 'running' },
      { name: 'Drains and sumps', tag: 'C-03', span: 'col-span-2', state: 'running' },
      { name: 'Lifeboat station 1', tag: 'C-04', span: 'col-span-2', state: 'standby' },
    ],
  },
};

function SiteMapDeckSelector() {
  const [deckId, setDeckId] = useState('process');
  const deck = DECKS[deckId] ?? DECKS.process;
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-base-foreground">Valhall Sør · {deck.name}</span>
          <span className="text-xs text-muted-foreground tabular-nums">Elevation {deck.elevation}</span>
        </div>
        <SegmentedControl value={deckId} onValueChange={(value) => setDeckId(typeof value === 'string' ? value : 'process')}>
          <SegmentedControlList size="small" aria-label="Deck level">
            <SegmentedControlButton value="weather" tabContent="label-only">
              Weather
            </SegmentedControlButton>
            <SegmentedControlButton value="process" tabContent="label-only">
              Process
            </SegmentedControlButton>
            <SegmentedControlButton value="cellar" tabContent="label-only">
              Cellar
            </SegmentedControlButton>
          </SegmentedControlList>
        </SegmentedControl>
      </div>
      <div role="group" aria-label={`${deck.name} block plan`} className="grid auto-rows-fr grid-cols-4 gap-2 sm:grid-cols-6">
        {deck.blocks.map((block) => (
          <AreaBlock key={block.tag} className={block.span} name={block.name} tag={block.tag} status={runStateStatus(block.state)} alarmCount={block.alarmCount} alarmTone={block.alarmTone} />
        ))}
      </div>
    </div>
  );
}

function SiteMapLocator() {
  return (
    <div className="flex flex-col items-center gap-3">
      <SiteMapThumbnail highlightId="nk-23" />
      <div className="flex flex-col items-center gap-0.5 text-center">
        <span className="text-sm font-medium text-base-foreground">Gas compression</span>
        <span className="text-xs text-muted-foreground">Nordkapp · Norwegian Sea</span>
      </div>
    </div>
  );
}

function SiteMapTankFarm() {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-base-foreground">Tank farm</span>
        <span className="font-mono text-xs text-muted-foreground">NK-60 · bund A</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-5 rounded-lg border border-dashed border-emphasized p-4 sm:grid-cols-4">
        {TANKS.map((tank) => (
          <div key={tank.tag} className="flex flex-col gap-2">
            <LevelMeter height={88} showLimits={false} label={tank.name} value={tank.level} decimals={1} limits={TANK_LIMITS} />
            <span className="font-mono text-xs text-muted-foreground">{tank.tag}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        <StatusIndicator size="sm" tone="warning" shape="square" label="High level" detail="60-TA-6003" />
        <StatusIndicator size="sm" tone="warning" shape="square" label="Low level" detail="60-TA-6004" />
      </div>
    </div>
  );
}

function SiteMapEscapeRoutes() {
  const blocks = [
    { x: 12, y: 12, width: 130, height: 76, name: 'Inlet and separation' },
    { x: 162, y: 12, width: 130, height: 172, name: 'Gas compression' },
    { x: 312, y: 12, width: 136, height: 76, name: 'Gas export' },
    { x: 12, y: 108, width: 130, height: 76, name: 'Cooling water' },
    { x: 312, y: 108, width: 136, height: 76, name: 'Tank farm' },
  ];
  return (
    <DiagramCanvas
      label="Escape routes on the Nordkapp plot plan: walkways between the process areas lead south to muster point A at the control room, with 24 people on site"
      width={460}
      height={270}
    >
      {blocks.map((block) => (
        <g key={block.name}>
          <rect x={block.x} y={block.y} width={block.width} height={block.height} rx={6} className="fill-muted-background" />
          <SiteMapText x={block.x + 10} y={block.y + 20} quiet>
            {block.name}
          </SiteMapText>
        </g>
      ))}
      <PipeLine points={[{ x: 152, y: 12 }, { x: 152, y: 196 }]} weight="light" dashed flow="forward" arrows={2} arrowSize={6} />
      <PipeLine points={[{ x: 302, y: 12 }, { x: 302, y: 196 }]} weight="light" dashed flow="forward" arrows={2} arrowSize={6} />
      <PipeLine points={[{ x: 12, y: 98 }, { x: 152, y: 98 }]} weight="light" dashed flow="forward" arrowSize={6} />
      <PipeLine points={[{ x: 448, y: 98 }, { x: 302, y: 98 }]} weight="light" dashed flow="forward" arrowSize={6} />
      <PipeLine points={[{ x: 12, y: 196 }, { x: 214, y: 196 }]} weight="light" dashed flow="forward" arrowSize={6} />
      <PipeLine points={[{ x: 448, y: 196 }, { x: 246, y: 196 }]} weight="light" dashed flow="forward" arrowSize={6} />
      <PipeLine points={[{ x: 230, y: 196 }, { x: 230, y: 226 }]} weight="light" dashed flow="forward" arrowSize={6} />
      <rect x={222} y={228} width={16} height={16} rx={2} className="fill-medium-foreground" />
      <SiteMapText x={246} y={236}>
        Muster point A
      </SiteMapText>
      <SiteMapText x={246} y={249} quiet>
        Control room · 24 on site
      </SiteMapText>
      <SiteMapText x={12} y={262} quiet>
        Dashed lines are escape routes; arrows point to the muster point.
      </SiteMapText>
    </DiagramCanvas>
  );
}

function SiteMapPipelineStrip() {
  const length = 214;
  const xOf = (km: number): number => 50 + (km / length) * 780;
  const stations = [
    { km: 0, name: 'Nordkapp plant', kind: 'plant', pressure: 148.0 },
    { km: 42, name: 'VS-1', kind: 'valve', pressure: 141.2 },
    { km: 118, name: 'Compressor station', kind: 'compressor', pressure: 150.4 },
    { km: 171, name: 'VS-2', kind: 'valve', pressure: 143.6 },
    { km: 214, name: 'Stord terminal', kind: 'plant', pressure: 138.1 },
  ] as const;
  const y = 96;
  return (
    <DiagramCanvas
      label="Export pipeline route strip, 214 kilometres from Nordkapp plant to Stord terminal, with two valve stations and a compressor station: pressure falls from 148.0 to 141.2 barg, is boosted to 150.4, and arrives at 138.1"
      width={880}
      height={160}
    >
      {stations.slice(1).map((station, index) => (
        <PipeLine key={station.name} points={[{ x: xOf(stations[index].km) + 16, y }, { x: xOf(station.km) - 16, y }]} weight="heavy" flow="forward" />
      ))}
      {[0, 50, 100, 150, 200].map((km) => (
        <g key={km}>
          <path d={`M ${xOf(km)} ${y + 26} V ${y + 32}`} strokeWidth={1} className="stroke-muted-foreground" />
          <SiteMapText x={xOf(km)} y={y + 46} anchor="middle" quiet>
            {km === 0 ? '0 km' : String(km)}
          </SiteMapText>
        </g>
      ))}
      <path d={`M ${xOf(0)} ${y + 26} H ${xOf(length)}`} strokeWidth={1} className="stroke-muted-foreground" />
      {stations.map((station) => {
        const x = xOf(station.km);
        return (
          <g key={station.name}>
            {station.kind === 'valve' ? <ValveSymbol type="gate" position="open" size={32} cx={x} cy={y - 4} label={`Valve station ${station.name}`} /> : null}
            {station.kind === 'compressor' ? <EquipmentSymbol kind="compressor" size={32} cx={x} cy={y} fill="solid" label={station.name} /> : null}
            {station.kind === 'plant' ? <rect x={x - 12} y={y - 12} width={24} height={24} rx={3} className="fill-medium-foreground" /> : null}
            <ValueTag x={x} y={22} anchor="middle" label={station.name} value={station.pressure} unit="barg" decimals={1} />
          </g>
        );
      })}
    </DiagramCanvas>
  );
}

const TURBINE_STATES = {
  generating: { tone: 'neutral', shape: 'dot', label: 'Generating' },
  idle: { tone: 'neutral', shape: 'ring', label: 'Idle, low wind' },
  service: { tone: 'warning', shape: 'square', label: 'In for service' },
  fault: { tone: 'critical', shape: 'diamond', label: 'Fault' },
} as const;

type TurbineState = keyof typeof TURBINE_STATES;

/** Twenty turbines in four staggered rows; the few that are not generating are listed by index. */
const TURBINE_EXCEPTIONS: Record<number, TurbineState> = { 6: 'service', 11: 'fault', 17: 'idle', 18: 'idle' };

function SiteMapWindFarm() {
  const turbines = Array.from({ length: 20 }, (_, index) => {
    const row = Math.floor(index / 5);
    const column = index % 5;
    const state: TurbineState = TURBINE_EXCEPTIONS[index] ?? 'generating';
    return { id: `WT${String(index + 1).padStart(2, '0')}`, x: 60 + column * 76 + (row % 2) * 30, y: 34 + row * 52, state };
  });
  const count = (state: TurbineState): number => turbines.filter((turbine) => turbine.state === state).length;
  const states: readonly TurbineState[] = ['generating', 'idle', 'service', 'fault'];
  return (
    <div className="flex w-full flex-col gap-3">
      <DiagramCanvas
        label={`Wind farm layout of 20 turbines in four rows: ${count('generating')} generating, ${count('idle')} idle, ${count('service')} in for service and ${count('fault')} with a fault, WT12`}
        width={460}
        height={230}
      >
        {[0, 1, 2, 3].map((row) => (
          <PipeLine key={row} points={[{ x: 60 + (row % 2) * 30, y: 34 + row * 52 }, { x: 420, y: 34 + row * 52 }]} weight="light" />
        ))}
        <PipeLine points={[{ x: 420, y: 34 }, { x: 420, y: 190 }]} weight="light" />
        <rect x={412} y={104} width={16} height={16} rx={2} className="fill-medium-foreground" />
        <SiteMapText x={434} y={116} quiet>
          Sub
        </SiteMapText>
        {turbines.map((turbine) => (
          <g key={turbine.id}>
            <SiteMapPin x={turbine.x} y={turbine.y} tone={TURBINE_STATES[turbine.state].tone} shape={TURBINE_STATES[turbine.state].shape} />
            {turbine.state === 'generating' ? null : (
              <SiteMapText x={turbine.x} y={turbine.y + 20} anchor="middle" mono>
                {turbine.id}
              </SiteMapText>
            )}
          </g>
        ))}
        <PipeLine points={[{ x: 16, y: 218 }, { x: 76, y: 218 }]} weight="light" flow="forward" arrowSize={6} />
        <SiteMapText x={84} y={221} quiet>
          Wind 9.4 m/s from the west
        </SiteMapText>
      </DiagramCanvas>
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        {states.map((state) => (
          <StatusIndicator key={state} size="sm" {...TURBINE_STATES[state]} detail={String(count(state))} />
        ))}
      </div>
    </div>
  );
}

function SiteMapZoneHeat() {
  const areas = PLANT_AREAS.slice(0, 6);
  const values = [
    [1, 2, 0, 1],
    [9, 6, 2, 3],
    [2, 3, 1, 0],
    [4, 5, 3, 1],
    [0, 1, 0, 2],
    [1, 2, 1, 0],
  ];
  return (
    <HeatMapGrid
      label="Open items per plant area and type: Gas compression stands out with 9 alarms in the last 24 hours and 6 open work orders"
      rows={areas.map((area) => area.name)}
      columns={['Alarms 24 h', 'Work orders', 'Overdue rounds', 'Permits']}
      values={values}
      domain={[0, 9]}
      showValues
      cellClassName="h-8"
      rowLabelClassName="w-36"
      legend={{ low: '0', high: '9', title: 'Open items' }}
      summary="Gas compression carries the most alarms and work orders."
    />
  );
}

function SiteMapFleetSummary() {
  const running = FLEET.filter((site) => site.state === 'running').length;
  const alarms = FLEET.reduce((sum, site) => sum + site.alarms, 0);
  const output = FLEET.filter((site) => site.id !== 'stord').reduce((sum, site) => sum + site.output, 0);
  const availability = FLEET.reduce((sum, site) => sum + site.availability, 0) / FLEET.length;
  const figures = [
    { label: 'Sites running', value: running, unit: `of ${FLEET.length}`, decimals: 0, tone: 'neutral' },
    { label: 'Active alarms', value: alarms, unit: '', decimals: 0, tone: 'critical' },
    { label: 'Gas produced', value: output, unit: 'MSm³/d', decimals: 2, tone: 'neutral' },
    { label: 'Availability', value: availability, unit: '%', decimals: 1, tone: 'neutral' },
  ] as const;
  return (
    <header className="flex w-full flex-wrap items-end justify-between gap-x-10 gap-y-4">
      <div className="flex flex-col gap-1">
        <h4 className="text-xl font-semibold text-base-foreground">Fleet overview</h4>
        <span className="text-xs text-muted-foreground tabular-nums">
          {FLEET.length} sites · updated {formatTime(REFERENCE_NOW)} UTC
        </span>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
          <StatusIndicator size="sm" tone="critical" shape="diamond" label="Nordkapp" detail="1 critical alarm" />
          <StatusIndicator size="sm" tone="warning" shape="square" label="Hammerfest LNG" detail="turnaround" />
        </div>
      </div>
      <dl className="flex flex-wrap gap-x-10 gap-y-4">
        {figures.map((figure) => (
          <div key={figure.label} className="flex flex-col gap-1.5">
            <dt className="text-xs text-muted-foreground">{figure.label}</dt>
            <dd>
              <ValueReadout size="md" value={figure.value} unit={figure.unit} decimals={figure.decimals} tone={figure.tone} />
            </dd>
          </div>
        ))}
      </dl>
    </header>
  );
}

function SiteMapRegionPins() {
  return <SiteMapRegion />;
}

/** One site as a card: name, kind, state and three roll-up figures. */
function SiteMapSiteCardBody({ site, thumbnail = false }: { site: FleetSite; thumbnail?: boolean }) {
  const info = siteOf(site);
  return (
    <Card className="w-full">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>{info.name}</CardTitle>
          <CardDescription>
            {site.kind} · {info.region}
          </CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <StatusIndicator variant="badge" {...siteStatus(site)} />
        </CardHeaderEnd>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {thumbnail ? <SiteMapThumbnail /> : null}
        <dl className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <dt className="text-xs text-muted-foreground">Availability</dt>
            <dd>
              <ValueReadout size="sm" value={site.availability} unit="%" decimals={1} />
            </dd>
          </div>
          <div className="flex flex-col gap-1.5">
            <dt className="text-xs text-muted-foreground">Output</dt>
            <dd>
              <ValueReadout size="sm" value={site.state === 'running' ? site.output : null} unit={site.outputUnit} decimals={2} />
            </dd>
          </div>
          <div className="flex flex-col gap-1.5">
            <dt className="text-xs text-muted-foreground">Alarms</dt>
            <dd>
              <ValueReadout size="sm" value={site.alarms} tone={site.alarmTone} />
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

function SiteMapSiteCard() {
  return <SiteMapSiteCardBody site={FLEET[1]} thumbnail />;
}

function SiteMapFleetList() {
  const [selectedId, setSelectedId] = useState('nordkapp');
  return (
    <div className="grid w-full grid-cols-1 items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <SiteMapRegion selectedId={selectedId} />
      <ul aria-label="Sites" className="flex flex-col gap-1">
        {FLEET.map((site) => {
          const info = siteOf(site);
          const selected = site.id === selectedId;
          return (
            <li key={site.id}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => setSelectedId(site.id)}
                className={`flex w-full cursor-pointer items-center justify-between gap-4 rounded-lg border px-3 py-2.5 text-left outline-none transition-colors focus-visible:shadow-focus-ring ${
                  selected ? 'border-emphasized bg-muted-background' : 'border-transparent hover:bg-muted-background'
                }`}
              >
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium text-base-foreground">{info.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {site.kind} · {info.region}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <StatusIndicator size="sm" {...siteStatus(site)} />
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {site.alarms === 0 ? 'No alarms' : `${site.alarms} ${site.alarms === 1 ? 'alarm' : 'alarms'}`} · {site.availability.toFixed(1)} %
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SiteMapSiteCards() {
  return (
    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
      {FLEET.map((site) => (
        <SiteMapSiteCardBody key={site.id} site={site} />
      ))}
    </div>
  );
}

export default definePage({
  id: 'site-and-fleet-maps',
  title: 'Site and fleet maps',
  summary:
    'Schematic views of where things are: a plant as labelled area blocks, a platform deck by deck, a pipeline as a strip, a fleet as marks on a plain coastline. They place status in space without map tiles.',
  guidance: {
    use: [
      'Draw areas as plain blocks in roughly their real arrangement; people navigate by neighbours, not coordinates.',
      'Put state and alarm count in every block, in words, and tint only the block that needs attention now.',
      'Use the status shapes for map marks, so a site reads the same on the map and in the list beside it.',
      'Pair every map with a list or a detail panel; the map answers where, the list answers what.',
    ],
    avoid: [
      'Geographic tiles, satellite imagery or terrain when the question is status, not navigation.',
      'Colouring healthy areas green; the plan should be grey until something is wrong.',
      'Marks without labels; four dots on a coast say nothing without names.',
      'Safety overlays in status colours; keep escape routes neutral so they never read as alarms.',
    ],
  },
  source,
  sections: [
    {
      id: 'marks',
      title: 'Blocks, pins and marks',
      description: 'The pieces a schematic map is built from.',
      specimens: [
        {
          id: 'SiteMapAreaBlock',
          title: 'Area block',
          note: 'Pick it for each area on a plot plan: tag, name and state in one neutral block.',
          origin: 'custom',
          uses: ['industrial/diagrams/AreaBlock.tsx', 'industrial/status.ts'],
          align: 'stretch',
          Component: SiteMapAreaBlock,
        },
        {
          id: 'SiteMapAreaBlockWithReading',
          title: 'Block with a reading',
          note: 'Pick it when one figure sums up the area, such as the export rate of the export area.',
          origin: 'custom',
          uses: ['industrial/diagrams/AreaBlock.tsx', 'industrial/ValueReadout.tsx'],
          align: 'stretch',
          Component: SiteMapAreaBlockWithReading,
        },
        {
          id: 'SiteMapPinStates',
          title: 'Pin states',
          note: 'Pick these marks for sites and turbines on a map; the shape carries the state, the ring carries selection.',
          origin: 'custom',
          Component: SiteMapPinStates,
        },
        {
          id: 'SiteMapAreaBlockStates',
          title: 'Area block states',
          note: 'Pick the tint only for an area that needs action now; alarm counts and selection work without it.',
          origin: 'custom',
          uses: ['industrial/diagrams/AreaBlock.tsx', 'industrial/status.ts'],
          size: 'lg',
          align: 'stretch',
          Component: SiteMapAreaBlockStates,
        },
        {
          id: 'SiteMapLegend',
          title: 'Legend',
          note: 'Pick it beside any plan that uses tints, outlines or overlays, so each mark is explained once.',
          origin: 'custom',
          align: 'stretch',
          Component: SiteMapLegend,
        },
        {
          id: 'SiteMapTankSingle',
          title: 'Tank with level',
          note: 'Pick it for one tank on a tank farm plan: the level drawn, then tag, name, percent and volume.',
          origin: 'custom',
          uses: ['industrial/LevelMeter.tsx', 'industrial/ValueReadout.tsx'],
          Component: SiteMapTankSingle,
        },
        {
          id: 'SiteMapPipelineStation',
          title: 'Pipeline station',
          note: 'Pick it for a point on a route: the station symbol on the line, its reading above, its distance below.',
          origin: 'custom',
          uses: ['industrial/diagrams/ValveSymbol.tsx', 'industrial/diagrams/PipeLine.tsx', 'industrial/diagrams/ValueTag.tsx', 'industrial/diagrams/DiagramCanvas.tsx'],
          Component: SiteMapPipelineStation,
        },
        {
          id: 'SiteMapScaleAndNorth',
          title: 'Scale and north',
          note: 'Pick it on plans where distance matters, and say so plainly when the plan is not to scale.',
          origin: 'custom',
          uses: ['industrial/diagrams/DiagramCanvas.tsx'],
          Component: SiteMapScaleAndNorth,
        },
      ],
    },
    {
      id: 'plant',
      title: 'Plant and platform',
      description: 'One site, laid out the way it stands.',
      specimens: [
        {
          id: 'SiteMapPlotPlan',
          title: 'Plot plan',
          note: 'Pick it as the front page of a site: every area with its state and alarm count, the worst one tinted.',
          origin: 'custom',
          uses: ['industrial/diagrams/AreaBlock.tsx', 'industrial/status.ts'],
          size: 'lg',
          align: 'stretch',
          Component: SiteMapPlotPlan,
        },
        {
          id: 'SiteMapPlotPlanCompact',
          title: 'Plan thumbnail',
          note: 'Pick it in a site card or list row: the shape of the site with only the trouble marked.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx'],
          Component: SiteMapPlotPlanCompact,
        },
        {
          id: 'SiteMapSelectedArea',
          title: 'Plan with selected-area detail',
          note: 'Pick it when the plan is the navigation: select a block and the panel lists what is active there.',
          origin: 'custom',
          uses: ['industrial/diagrams/AreaBlock.tsx', 'industrial/StatusIndicator.tsx', 'industrial/ValueReadout.tsx', 'industrial/status.ts'],
          size: 'full',
          align: 'stretch',
          Component: SiteMapSelectedArea,
        },
        {
          id: 'SiteMapDeckSelector',
          title: 'Deck level selector',
          note: 'Pick it for platforms and multi-storey plants, where the plan changes with the level.',
          origin: 'custom',
          uses: ['industrial/diagrams/AreaBlock.tsx', 'industrial/status.ts'],
          size: 'lg',
          align: 'stretch',
          Component: SiteMapDeckSelector,
        },
        {
          id: 'SiteMapLocator',
          title: 'Locator',
          note: 'Pick it on an area or asset page to show where on the site the reader is.',
          origin: 'custom',
          Component: SiteMapLocator,
        },
        {
          id: 'SiteMapTankFarm',
          title: 'Tank farm with levels',
          note: 'Pick it for storage: tanks in their bund with levels drawn, and the ones outside limits named.',
          origin: 'custom',
          uses: ['industrial/LevelMeter.tsx', 'industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: SiteMapTankFarm,
        },
        {
          id: 'SiteMapEscapeRoutes',
          title: 'Escape route overlay',
          note: 'Pick it for muster and escape information: neutral dashes and arrows that never compete with alarms.',
          origin: 'custom',
          uses: ['industrial/diagrams/PipeLine.tsx', 'industrial/diagrams/DiagramCanvas.tsx'],
          size: 'md',
          align: 'stretch',
          Component: SiteMapEscapeRoutes,
        },
      ],
    },
    {
      id: 'routes',
      title: 'Routes, farms and zones',
      description: 'Layouts that are not a plot plan: a line, a field of machines, a matrix of zones.',
      specimens: [
        {
          id: 'SiteMapPipelineStrip',
          title: 'Pipeline route strip',
          note: 'Pick it for pipelines and cables: a straight strip with stations in order and distance along the bottom.',
          origin: 'custom',
          uses: ['industrial/diagrams/PipeLine.tsx', 'industrial/diagrams/ValveSymbol.tsx', 'industrial/diagrams/EquipmentSymbol.tsx', 'industrial/diagrams/ValueTag.tsx', 'industrial/diagrams/DiagramCanvas.tsx'],
          size: 'full',
          align: 'stretch',
          Component: SiteMapPipelineStrip,
        },
        {
          id: 'SiteMapWindFarm',
          title: 'Wind farm layout',
          note: 'Pick it for many identical machines: a mark each, with only the exceptions shaped, coloured and named.',
          origin: 'custom',
          uses: ['industrial/diagrams/PipeLine.tsx', 'industrial/diagrams/DiagramCanvas.tsx', 'industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: SiteMapWindFarm,
        },
        {
          id: 'SiteMapZoneHeat',
          title: 'Zone heat',
          note: 'Pick it to compare areas across several counts at once; the heat steps show where the load is.',
          origin: 'custom',
          uses: ['industrial/charts/HeatMapGrid.tsx'],
          size: 'md',
          align: 'stretch',
          Component: SiteMapZoneHeat,
        },
      ],
    },
    {
      id: 'fleet',
      title: 'Fleet',
      description: 'Several sites at once, as a header, a map, a list and cards.',
      specimens: [
        {
          id: 'SiteMapFleetSummary',
          title: 'Fleet summary header',
          note: 'Pick it at the top of a fleet page: the roll-up figures and the two sites that need a look.',
          origin: 'custom',
          uses: ['industrial/ValueReadout.tsx', 'industrial/StatusIndicator.tsx'],
          size: 'full',
          align: 'stretch',
          Component: SiteMapFleetSummary,
        },
        {
          id: 'SiteMapRegionPins',
          title: 'Site pins on a region',
          note: 'Pick it when relative position helps: one plain land shape, named seas, and a labelled mark per site.',
          origin: 'custom',
          uses: ['industrial/diagrams/DiagramCanvas.tsx'],
          size: 'lg',
          align: 'stretch',
          Component: SiteMapRegionPins,
        },
        {
          id: 'SiteMapSiteCard',
          title: 'Site card',
          note: 'Pick it for one site in a grid: state in the header, a plan thumbnail and three roll-up figures.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/ValueReadout.tsx'],
          align: 'stretch',
          Component: SiteMapSiteCard,
        },
        {
          id: 'SiteMapFleetList',
          title: 'Fleet list beside a map',
          note: 'Pick it as the fleet landing view: the list is the control, the map shows where the selected site is.',
          origin: 'custom',
          uses: ['industrial/diagrams/DiagramCanvas.tsx', 'industrial/StatusIndicator.tsx'],
          size: 'full',
          align: 'stretch',
          Component: SiteMapFleetList,
        },
        {
          id: 'SiteMapSiteCards',
          title: 'Site cards grid',
          note: 'Pick it when sites are compared more than located: the same three figures on every card.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/ValueReadout.tsx'],
          size: 'full',
          align: 'stretch',
          Component: SiteMapSiteCards,
        },
      ],
    },
  ],
});
