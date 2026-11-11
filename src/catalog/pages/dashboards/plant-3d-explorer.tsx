import { Button } from '@cognite/aura/components/button';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import { Slider } from '@cognite/aura/components/slider';
import { Switch } from '@cognite/aura/components/switch';
import {
  IconAlertOctagon,
  IconAlertTriangle,
  IconArrowLeft,
  IconBell,
  IconBuildingFactory2,
  IconChartLine,
  IconChevronRight,
  IconFlame,
  IconInfoCircle,
  IconLayoutSidebarRightCollapse,
  IconLayoutSidebarRightExpand,
  IconTool,
} from '@cognite/aura/icons';
import { useReducer, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

import { IconChip } from '../../../library/kit/IconChip';
import { Legend } from '../../../library/kit/Legend';
import type { LegendItem } from '../../../library/kit/Legend';
import { ListRow } from '../../../library/kit/ListRow';
import { Meter } from '../../../library/kit/Meter';
import { Panel } from '../../../library/kit/Panel';
import { RingGauge } from '../../../library/kit/RingGauge';
import { Stat } from '../../../library/kit/Stat';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import { formatNumber } from '../../../library/kit/tones';
import type { StatusTone } from '../../../library/kit/tones';
import { TrendLine } from '../../../library/kit/TrendLine';
import type { TrendLimit } from '../../../library/kit/TrendLine';
import { LookScope } from '../../../library/looks/LookScope';
import type { CameraView, Vec3 } from '../../../library/three/cameraTargets';
import { CompressorSkid } from '../../../library/three/CompressorSkid';
import { INITIAL_EXPLORER_STATE, explorerBreadcrumb, explorerFocusId, explorerLevel, explorerReducer } from '../../../library/three/explorerState';
import type { ExplorerAction, ExplorerState } from '../../../library/three/explorerState';
import { EQUIPMENT_SIZES, findNode } from '../../../library/three/plantLayout';
import type { PlantLayout } from '../../../library/three/plantLayout';
import { PlantScene } from '../../../library/three/PlantScene';
import type { PlantNodeStatus, PlantSceneMarker } from '../../../library/three/PlantScene';
import { SceneCanvas } from '../../../library/three/SceneCanvas';
import { StillScene } from '../../../library/three/scenes/StillScene';
import { StorageTank } from '../../../library/three/StorageTank';
import { TurntableStage } from '../../../library/three/TurntableStage';
import { ALARMS, PLANT_KPIS, SENSORS, WORK_ORDERS, findAsset, findPerson } from '../../data/plant';
import type { Alarm, Asset, Health, RunState, Sensor, Severity } from '../../data/plant';
import { MINUTE, formatAgo, formatDate, formatTime, makeSeries, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './plant-3d-explorer.tsx?raw';

/**
 * The Nordkapp plot plan: x runs east, z south, units are metres. Process areas sit north of the
 * pipe rack, utilities and tankage south of it. Ids match `ASSETS`, so status joins by id.
 */
const PLANT3D_LAYOUT: PlantLayout = {
  id: 'nk',
  name: 'Nordkapp plant',
  size: [128, 88],
  areas: [
    {
      id: 'nk-20',
      tag: 'NK-20',
      name: 'Inlet and separation',
      center: [-38, -10],
      size: [28, 30],
      labelOffset: [0, 0, -11],
      equipment: [
        { id: '20-xv-1105', kind: 'valve', tag: '20-XV-1105', position: [-47, 0, -18] },
        { id: '20-va-1001', kind: 'horizontal-vessel', tag: '20-VA-1001', position: [-36, 0, -18] },
        { id: '20-va-1002', kind: 'horizontal-vessel', tag: '20-VA-1002', position: [-36, 0, -5], scale: 0.8 },
      ],
    },
    {
      id: 'nk-23',
      tag: 'NK-23',
      name: 'Gas compression',
      center: [0, -10],
      size: [38, 30],
      equipment: [
        { id: '23-ka-9101', kind: 'compressor', tag: '23-KA-9101', position: [-9, 0, -18] },
        { id: '23-ka-9102', kind: 'compressor', tag: '23-KA-9102', position: [-9, 0, -10] },
        { id: '23-ka-9103', kind: 'compressor', tag: '23-KA-9103', position: [-9, 0, -2] },
        { id: '23-gt-9001', kind: 'turbine', tag: '23-GT-9001', position: [10, 0, -18] },
        { id: '23-ha-9114', kind: 'heat-exchanger', tag: '23-HA-9114', position: [9, 0, -3] },
      ],
    },
    {
      id: 'nk-27',
      tag: 'NK-27',
      name: 'Gas export',
      center: [36, -10],
      size: [24, 30],
      labelOffset: [0, 0, 11],
      equipment: [
        { id: '27-pa-2001a', kind: 'pump', tag: '27-PA-2001A', position: [34, 0, -16], scale: 1.3 },
        { id: '27-pa-2001b', kind: 'pump', tag: '27-PA-2001B', position: [34, 0, -6], scale: 1.3 },
      ],
    },
    {
      id: 'nk-40',
      tag: 'NK-40',
      name: 'Cooling water',
      center: [-22, 27],
      size: [36, 16],
      height: 6,
      equipment: [{ id: '40-pa-4001', kind: 'pump', tag: '40-PA-4001', position: [-33, 0, 27], scale: 1.3 }],
    },
  ],
  scenery: [
    { id: 'scenery-rack', kind: 'pipe-rack', tag: 'Pipe rack', position: [-2, 0, 10], length: 100 },
    { id: 'scenery-flare', kind: 'flare', tag: 'Flare', position: [55, 0, -35] },
    { id: 'scenery-contactor', kind: 'column', tag: 'Glycol contactor', position: [-28, 0, -11] },
    { id: 'scenery-scrubber', kind: 'vertical-vessel', tag: 'Export scrubber', position: [43, 0, -18] },
    { id: 'scenery-cooler', kind: 'air-cooler', tag: 'Cooling water cooler', position: [-17, 0, 27] },
    { id: 'scenery-tank-a', kind: 'storage-tank', tag: 'Condensate tank A', position: [11, 0, 28], fill: 0.62 },
    { id: 'scenery-tank-b', kind: 'storage-tank', tag: 'Condensate tank B', position: [24, 0, 28], fill: 0.34 },
    { id: 'scenery-control-room', kind: 'control-room', tag: 'Control room', position: [44, 0, 30] },
  ],
  pipes: [
    {
      id: 'pipe-inlet',
      flow: true,
      points: [
        [-64, 1, -18],
        [-43, 1, -18],
        [-43, 2.4, -18],
        [-41, 2.4, -18],
      ],
    },
    {
      id: 'pipe-suction',
      flow: true,
      points: [
        [-33.5, 4.7, -18],
        [-33.5, 6.2, -18],
        [-12.3, 6.2, -18],
        [-12.3, 4, -18],
      ],
    },
    {
      id: 'pipe-interstage',
      flow: true,
      areaId: 'nk-23',
      radius: 0.2,
      points: [
        [-11.1, 4, -18],
        [-11.1, 5.2, -18],
        [-11.1, 5.2, -14],
        [6.8, 5.2, -14],
        [6.8, 5.2, -3],
        [6.8, 3.3, -3],
      ],
    },
    {
      id: 'pipe-cooled',
      flow: true,
      areaId: 'nk-23',
      radius: 0.2,
      points: [
        [11.2, 3.3, -3],
        [11.2, 4.4, -3],
        [11.2, 4.4, -6.5],
        [-12.3, 4.4, -6.5],
        [-12.3, 4.4, -10],
        [-12.3, 4, -10],
      ],
    },
    {
      id: 'pipe-export-header',
      flow: true,
      points: [
        [-11.1, 4, -10],
        [-11.1, 6.8, -10],
        [-17, 6.8, -10],
        [-17, 6.8, 10],
        [28, 6.8, 10],
        [28, 6.8, -16],
        [28, 1.3, -16],
        [31.6, 1.3, -16],
      ],
    },
    {
      id: 'pipe-export',
      flow: true,
      points: [
        [32.5, 3, -16],
        [32.5, 4.2, -16],
        [47, 4.2, -16],
        [47, 1.2, -16],
        [64, 1.2, -16],
      ],
    },
    {
      id: 'pipe-flare-header',
      radius: 0.2,
      points: [
        [48, 5.5, 11.4],
        [58, 5.5, 11.4],
        [58, 5.5, -35],
        [58, 1.4, -35],
        [55.6, 1.4, -35],
      ],
    },
    {
      id: 'pipe-cooling-water',
      flow: true,
      areaId: 'nk-40',
      radius: 0.2,
      points: [
        [-34.5, 3, 27],
        [-34.5, 4.5, 27],
        [-22.6, 4.5, 27],
      ],
    },
  ],
};

/** Readings for assets that have none in the shared plant data, in the same tag style. */
const PLANT3D_EXTRA_SENSORS: readonly Sensor[] = [
  { id: 'vt-92740', tag: '23-VT-92740', name: 'Drive-end vibration', assetId: '23-ka-9103', unit: 'mm/s', value: 11.6, lowLimit: 0, highLimit: 7.1, highHighLimit: 11, rangeMin: 0, rangeMax: 15, decimals: 1, quality: 'good', seed: 61 },
  { id: 'st-92701', tag: '23-ST-92701', name: 'Shaft speed', assetId: '23-ka-9103', unit: 'rpm', value: 0, lowLimit: 0, highLimit: 10500, rangeMin: 0, rangeMax: 12000, decimals: 0, quality: 'good', seed: 62 },
  { id: 'pt-92631', tag: '23-PT-92631', name: 'Discharge pressure', assetId: '23-ka-9102', unit: 'barg', value: 96.2, lowLimit: 85, highLimit: 102, highHighLimit: 108, rangeMin: 0, rangeMax: 120, decimals: 1, quality: 'good', seed: 63 },
  { id: 'tt-92632', tag: '23-TT-92632', name: 'Discharge temperature', assetId: '23-ka-9102', unit: '°C', value: 128.4, lowLimit: 90, highLimit: 145, highHighLimit: 155, rangeMin: 0, rangeMax: 180, decimals: 1, quality: 'good', seed: 64 },
  { id: 'tt-90011', tag: '23-TT-90011', name: 'Exhaust temperature', assetId: '23-gt-9001', unit: '°C', value: 486, lowLimit: 380, highLimit: 520, highHighLimit: 545, rangeMin: 0, rangeMax: 600, decimals: 0, quality: 'good', seed: 65 },
  { id: 'st-90001', tag: '23-ST-90001', name: 'Power turbine speed', assetId: '23-gt-9001', unit: 'rpm', value: 9840, lowLimit: 7000, highLimit: 10500, rangeMin: 0, rangeMax: 12000, decimals: 0, quality: 'good', seed: 66 },
];

const PLANT3D_SENSORS: readonly Sensor[] = [...SENSORS, ...PLANT3D_EXTRA_SENSORS];

/** Where each instrument sits on its machine: x and z from −1 to 1 across the footprint, y from 0 to 1. */
const PLANT3D_SENSOR_ANCHORS: Readonly<Record<string, Vec3>> = {
  'pt-92531': [-0.42, 0.95, 0],
  'pt-92530': [-0.66, 0.95, 0],
  'tt-92532': [-0.42, 0.7, 0.55],
  'vt-92540': [-0.2, 0.5, 0.5],
  'st-92501': [0.12, 0.55, 0.3],
  'ft-92510': [-0.92, 0.6, 0],
  'lt-10012': [0.45, 0.5, 1],
  'pt-10010': [-0.3, 0.95, 0],
  'tt-91141': [0.85, 0.3, 0],
  'ft-20011': [-0.56, 0.95, 0],
  'it-20013': [0.5, 0.9, 0],
  'tt-40015': [-0.2, 0.55, 1],
  'vt-92740': [-0.2, 0.5, 0.5],
  'st-92701': [0.12, 0.55, 0.3],
  'pt-92631': [-0.42, 0.95, 0],
  'tt-92632': [-0.42, 0.7, 0.55],
  'tt-90011': [0.72, 0.95, 0],
  'st-90001': [0, 0.45, 1],
};

type Plant3dMark = { tone: StatusTone; label: string; shape: 'dot' | 'ring' | 'square' | 'diamond' };

const PLANT3D_SEVERITY: Record<Severity, Plant3dMark & { rank: number }> = {
  critical: { tone: 'critical', label: 'Critical', shape: 'diamond', rank: 0 },
  high: { tone: 'warning', label: 'High', shape: 'square', rank: 1 },
  medium: { tone: 'info', label: 'Medium', shape: 'dot', rank: 2 },
  low: { tone: 'neutral', label: 'Low', shape: 'ring', rank: 3 },
};

const PLANT3D_RUN: Record<RunState, Plant3dMark> = {
  running: { tone: 'success', label: 'Running', shape: 'dot' },
  standby: { tone: 'neutral', label: 'Standby', shape: 'ring' },
  stopped: { tone: 'neutral', label: 'Stopped', shape: 'ring' },
  tripped: { tone: 'critical', label: 'Tripped', shape: 'diamond' },
  maintenance: { tone: 'warning', label: 'Maintenance', shape: 'square' },
};

const PLANT3D_HEALTH: Record<Health, { tone: StatusTone; label: string }> = {
  good: { tone: 'success', label: 'Good' },
  watch: { tone: 'warning', label: 'Watch' },
  poor: { tone: 'critical', label: 'Poor' },
};

const PLANT3D_ORDER_STATUS = {
  open: { label: 'Open', tone: 'neutral' },
  planned: { label: 'Planned', tone: 'info' },
  'in-progress': { label: 'In progress', tone: 'success' },
  waiting: { label: 'Waiting', tone: 'warning' },
  done: { label: 'Done', tone: 'neutral' },
} as const;

const PLANT3D_OPEN_ALARMS: readonly Alarm[] = ALARMS.filter((alarm) => alarm.state === 'active' || alarm.state === 'acknowledged').sort(
  (a, b) => PLANT3D_SEVERITY[a.severity].rank - PLANT3D_SEVERITY[b.severity].rank
);

const PLANT3D_LEGEND: readonly LegendItem[] = [
  { label: 'Tripped', tone: 'critical' },
  { label: 'Warning', tone: 'warning' },
  { label: 'Advisory', tone: 'info' },
  { label: 'Standby', tone: 'neutral' },
  { label: 'Selected', tone: 'accent' },
];

const PLANT3D_VIEWS: readonly { value: CameraView; label: string }[] = [
  { value: 'perspective', label: 'Perspective' },
  { value: 'top', label: 'Top' },
  { value: 'isometric', label: 'Isometric' },
];

const PLANT3D_EXPORT_TREND = [...makeValues({ seed: 31, points: 24, base: 4.32, amplitude: 0.14, noise: 0.04, cycles: 1.2, decimals: 2 }), PLANT_KPIS.gasExport.value];

/** A floating studio card: the same surface, border and shadow the kit panel uses. */
const PLANT3D_CARD = 'rounded-xl border border-[var(--kit-rule)] bg-[var(--kit-surface)] shadow-[var(--kit-panel-shadow)]';

const PLANT3D_FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring-default)]';

/** A list row that is one button: hover wash, pressed state, visible focus. */
const PLANT3D_ROW = `flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-[var(--kit-well)] aria-pressed:bg-[color-mix(in_oklab,var(--kit-accent)_10%,transparent)] ${PLANT3D_FOCUS}`;

/** Scene labels are plain DOM: keep them in the UI sans at a readable size. */
const PLANT3D_SCENE_TYPE = '[&_.font-mono]:[font-family:inherit] [&_.font-mono]:tabular-nums [&_[data-slot=scene-label]>:first-child]:text-[0.8125rem]';

function plant3dIsView(value: unknown): value is CameraView {
  return PLANT3D_VIEWS.some((view) => view.value === value);
}

function plant3dSensorsOf(assetId: string): Sensor[] {
  return PLANT3D_SENSORS.filter((sensor) => sensor.assetId === assetId);
}

function plant3dAreaAssetIds(areaId: string): string[] {
  const area = PLANT3D_LAYOUT.areas.find((candidate) => candidate.id === areaId);
  return area ? [area.id, ...area.equipment.map((equipment) => equipment.id)] : [];
}

function plant3dAlarmsOf(assetIds: readonly string[]): Alarm[] {
  return PLANT3D_OPEN_ALARMS.filter((alarm) => assetIds.includes(alarm.assetId));
}

function plant3dCount(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

function plant3dEquipmentStatus(asset: Asset): PlantNodeStatus | undefined {
  if (asset.state === 'tripped') return { tone: 'critical', shape: 'diamond', text: 'Tripped', pulse: true };
  if (asset.state === 'maintenance') return { tone: 'warning', shape: 'square', text: 'Maintenance' };
  // Standby and stopped are normal states for a spare: named on the label, with a neutral ring.
  if (asset.state !== 'running') return { tone: 'neutral', shape: 'ring', text: PLANT3D_RUN[asset.state].label };
  const alarms = plant3dAlarmsOf([asset.id]);
  if (alarms.length === 0) return undefined;
  const worst = PLANT3D_SEVERITY[alarms[0].severity];
  return { tone: worst.tone, shape: worst.shape, text: plant3dCount(alarms.length, 'alarm') };
}

function plant3dAreaStatus(areaId: string): PlantNodeStatus {
  const alarms = plant3dAlarmsOf(plant3dAreaAssetIds(areaId));
  // Normal is quiet: an area without alarms shows only its name.
  if (alarms.length === 0) return {};
  const worst = PLANT3D_SEVERITY[alarms[0].severity];
  return { tone: worst.tone, shape: worst.shape, text: plant3dCount(alarms.length, 'open alarm') };
}

const PLANT3D_STATUSES: Readonly<Record<string, PlantNodeStatus>> = Object.fromEntries([
  ...PLANT3D_LAYOUT.areas.map((area) => [area.id, plant3dAreaStatus(area.id)] as const),
  ...PLANT3D_LAYOUT.areas
    .flatMap((area) => area.equipment)
    .flatMap((equipment) => {
      const asset = findAsset(equipment.id);
      const status = asset ? plant3dEquipmentStatus(asset) : undefined;
      return status ? [[equipment.id, status] as const] : [];
    }),
]);

/** Above the trip limit is critical, outside the operating band a warning, otherwise the accent. */
function plant3dSensorTone(sensor: Sensor): StatusTone | 'accent' {
  if (sensor.quality === 'bad') return 'neutral';
  if (sensor.highHighLimit !== undefined && sensor.value >= sensor.highHighLimit) return 'critical';
  if (sensor.value > sensor.highLimit || sensor.value < sensor.lowLimit) return 'warning';
  if (sensor.value > sensor.highLimit - (sensor.highLimit - sensor.lowLimit) * 0.1) return 'warning';
  return 'accent';
}

function plant3dSensorWord(sensor: Sensor): string {
  if (sensor.quality === 'bad') return 'Signal lost';
  if (sensor.highHighLimit !== undefined && sensor.value >= sensor.highHighLimit) return 'Above trip limit';
  if (sensor.value > sensor.highLimit) return 'Above high limit';
  if (sensor.value < sensor.lowLimit) return 'Below low limit';
  if (plant3dSensorTone(sensor) === 'warning') return 'Near high limit';
  return 'In range';
}

function plant3dReading(sensor: Sensor): string {
  return sensor.quality === 'bad' ? 'Bad quality' : `${formatNumber(sensor.value, sensor.decimals)} ${sensor.unit}`;
}

/** Last 24 hours for a tag, ending exactly on its current value. */
function plant3dTrend(sensor: Sensor): { values: number[]; labels: string[] } {
  const span = sensor.highLimit - sensor.lowLimit;
  const still = sensor.value === 0 || sensor.quality === 'bad';
  const raw = makeSeries({ seed: sensor.seed, points: 49, base: sensor.value, amplitude: still ? 0 : span * 0.05, noise: still ? 0 : span * 0.025, cycles: 1.5, stepMs: 30 * MINUTE, decimals: sensor.decimals + 1 });
  const shift = sensor.value - raw[raw.length - 1].v;
  const factor = 10 ** sensor.decimals;
  return {
    values: raw.map((point) => Math.round(Math.min(sensor.rangeMax, Math.max(sensor.rangeMin, point.v + shift)) * factor) / factor),
    // The inspector is narrow: name every second tick so the times never collide.
    labels: raw.map((point, index) => ((raw.length - 1 - index) % 14 === 0 ? formatTime(point.t) : '')),
  };
}

function plant3dLimits(sensor: Sensor): TrendLimit[] {
  const limits: TrendLimit[] = [];
  if (sensor.highHighLimit !== undefined) limits.push({ value: sensor.highHighLimit, label: 'Trip', tone: 'critical' });
  limits.push({ value: sensor.highLimit, label: 'High', tone: 'warning' });
  return limits;
}

function plant3dLabelOf(id: string): string {
  if (id === PLANT3D_LAYOUT.id) return 'Nordkapp';
  const node = findNode(PLANT3D_LAYOUT, id);
  if (node?.type === 'area') return node.area.name;
  if (node?.type === 'equipment') return node.equipment.tag;
  return PLANT3D_SENSORS.find((sensor) => sensor.id === id)?.tag ?? id;
}

function plant3dSelectAction(id: string): ExplorerAction | null {
  const node = findNode(PLANT3D_LAYOUT, id);
  if (node?.type === 'area') return { type: 'selectArea', areaId: node.area.id };
  if (node?.type === 'equipment') return { type: 'selectEquipment', areaId: node.area.id, equipmentId: node.equipment.id };
  if (node?.type === 'plant') return { type: 'home' };
  return null;
}

function Plant3dSeverityIcon({ severity }: { severity: Severity }) {
  if (severity === 'critical') return <IconAlertOctagon />;
  if (severity === 'high') return <IconAlertTriangle />;
  if (severity === 'medium') return <IconInfoCircle />;
  return <IconBell />;
}

function Plant3dSection({ title, meta, children }: { title: string; meta?: string; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="text-sm font-semibold text-[var(--kit-text)]">{title}</h4>
        {meta ? <span className="text-xs tabular-nums text-[var(--kit-text-3)]">{meta}</span> : null}
      </div>
      {children}
    </section>
  );
}

function Plant3dAlarmRows({ alarms, onSelect }: { alarms: readonly Alarm[]; onSelect?: (assetId: string) => void }) {
  if (alarms.length === 0) return <p className="rounded-lg bg-[var(--kit-well)] px-3 py-2.5 text-sm text-[var(--kit-text-2)]">No open alarms. Everything here is inside its limits.</p>;
  return (
    <ul className="flex flex-col">
      {alarms.map((alarm) => {
        const severity = PLANT3D_SEVERITY[alarm.severity];
        return (
          <ListRow
            key={alarm.id}
            tone={severity.tone}
            leading={
              <IconChip tone={severity.tone} size="sm">
                <Plant3dSeverityIcon severity={alarm.severity} />
              </IconChip>
            }
            title={
              onSelect ? (
                <button type="button" onClick={() => onSelect(alarm.assetId)} className={`text-left after:absolute after:inset-0 hover:underline ${PLANT3D_FOCUS}`}>
                  {alarm.message}
                </button>
              ) : (
                alarm.message
              )
            }
            meta={
              <>
                <TagId>{alarm.sensorTag}</TagId>
                <span>
                  {alarm.value} · limit {alarm.limit}
                </span>
              </>
            }
            trailing={formatAgo(alarm.raisedAt)}
          />
        );
      })}
    </ul>
  );
}

function Plant3dPlantInspector({ onSelect }: { onSelect?: (id: string) => void }) {
  return (
    <>
      <Stat
        variant="plain"
        size="lg"
        label="Gas export"
        value={PLANT_KPIS.gasExport.value}
        decimals={2}
        unit={PLANT_KPIS.gasExport.unit}
        delta={{ value: PLANT_KPIS.gasExport.value - PLANT_KPIS.gasExport.previous, decimals: 2, caption: 'vs yesterday' }}
        target={`Plan ${formatNumber(PLANT_KPIS.gasExport.target, 2)}`}
        sparkline={PLANT3D_EXPORT_TREND}
      />
      <Plant3dSection title="Areas" meta="Health score">
        <ul className="-mx-2.5 flex flex-col">
          {PLANT3D_LAYOUT.areas.map((area) => {
            const asset = findAsset(area.id);
            const status = PLANT3D_STATUSES[area.id];
            if (!asset) return null;
            return (
              <li key={area.id}>
                <button type="button" onClick={() => onSelect?.(area.id)} className={PLANT3D_ROW}>
                  <RingGauge label={`${area.name} health`} value={asset.healthScore} unit="" size={44} tone={PLANT3D_HEALTH[asset.health].tone} hideLabel />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-medium text-[var(--kit-text)]">{area.name}</span>
                    <TagId>{area.tag}</TagId>
                  </span>
                  {status?.tone && status.text ? <StatusPill tone={status.tone}>{status.text}</StatusPill> : <span className="text-xs text-[var(--kit-text-3)]">No alarms</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </Plant3dSection>
      <Plant3dSection title="Open alarms" meta={`${PLANT3D_OPEN_ALARMS.length} open`}>
        <Plant3dAlarmRows alarms={PLANT3D_OPEN_ALARMS.slice(0, 3)} onSelect={onSelect} />
      </Plant3dSection>
    </>
  );
}

function Plant3dAreaInspector({ areaId, onSelect }: { areaId: string; onSelect?: (id: string) => void }) {
  const area = PLANT3D_LAYOUT.areas.find((candidate) => candidate.id === areaId);
  const asset = findAsset(areaId);
  if (!area || !asset) return null;
  const units = area.equipment.flatMap((equipment) => {
    const unit = findAsset(equipment.id);
    return unit ? [unit] : [];
  });
  const alarms = plant3dAlarmsOf(plant3dAreaAssetIds(areaId));
  const running = units.filter((unit) => unit.state === 'running').length;

  return (
    <>
      <div className="flex items-center gap-4">
        <RingGauge label="Area health" value={asset.healthScore} unit="" size={88} tone={PLANT3D_HEALTH[asset.health].tone} hideLabel />
        <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-2">
          {[
            { label: 'Health', value: PLANT3D_HEALTH[asset.health].label },
            { label: 'Criticality', value: `Class ${asset.criticality}` },
            { label: 'Running', value: `${running} of ${units.length}` },
            { label: 'Open alarms', value: String(alarms.length) },
          ].map((item) => (
            <div key={item.label} className="flex flex-col">
              <dt className="text-xs text-[var(--kit-text-3)]">{item.label}</dt>
              <dd className="text-base font-semibold tabular-nums text-[var(--kit-text)]">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <Plant3dSection title="Equipment" meta={plant3dCount(units.length, 'unit')}>
        <ul className="-mx-2.5 flex flex-col">
          {units.map((unit) => (
            <li key={unit.id}>
              <button type="button" onClick={() => onSelect?.(unit.id)} className={PLANT3D_ROW}>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-medium text-[var(--kit-text)]">{unit.name}</span>
                  <TagId>{unit.tag}</TagId>
                </span>
                <span className="w-9 text-right text-sm font-medium tabular-nums text-[var(--kit-text-2)]">{unit.healthScore}</span>
                <StatusPill tone={PLANT3D_RUN[unit.state].tone}>{PLANT3D_RUN[unit.state].label}</StatusPill>
              </button>
            </li>
          ))}
        </ul>
      </Plant3dSection>
      <Plant3dSection title="Alarms in this area" meta={`${alarms.length} open`}>
        <Plant3dAlarmRows alarms={alarms.slice(0, 3)} onSelect={onSelect} />
      </Plant3dSection>
    </>
  );
}

function Plant3dEquipmentInspector({ asset, onSelectSensor }: { asset: Asset; onSelectSensor?: (sensorId: string) => void }) {
  const sensors = plant3dSensorsOf(asset.id);
  const alarms = plant3dAlarmsOf([asset.id]);
  const orders = WORK_ORDERS.filter((order) => order.assetId === asset.id && order.status !== 'done');

  return (
    <>
      <div className="flex items-center gap-4">
        <RingGauge label="Health score" value={asset.healthScore} unit="" size={88} tone={PLANT3D_HEALTH[asset.health].tone} hideLabel />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-xs text-[var(--kit-text-3)]">Health score, criticality {asset.criticality}</span>
          <div className="flex flex-wrap gap-1.5">
            <StatusPill tone={PLANT3D_RUN[asset.state].tone} size="lg">
              {PLANT3D_RUN[asset.state].label}
            </StatusPill>
            <StatusPill tone={PLANT3D_HEALTH[asset.health].tone} variant="outline" size="lg">
              {PLANT3D_HEALTH[asset.health].label}
            </StatusPill>
          </div>
        </div>
      </div>
      {alarms.length > 0 ? (
        <Plant3dSection title="Alarms" meta={`${alarms.length} open`}>
          <Plant3dAlarmRows alarms={alarms.slice(0, 2)} />
        </Plant3dSection>
      ) : null}
      <Plant3dSection title="Live readings" meta={sensors.length > 0 ? 'Pick one to pin it on the machine' : undefined}>
        {sensors.length === 0 ? (
          <p className="rounded-lg bg-[var(--kit-well)] px-3 py-2.5 text-sm text-[var(--kit-text-2)]">No instruments are mapped to this unit yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {sensors.slice(0, 4).map((sensor) => (
              <li key={sensor.id} className="flex items-end gap-2">
                {sensor.quality === 'bad' ? (
                  <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                    <span className="text-sm font-medium text-[var(--kit-text)]">{sensor.name}</span>
                    <StatusPill tone="neutral">Signal lost</StatusPill>
                  </div>
                ) : (
                  <Meter
                    className="min-w-0 flex-1"
                    label={sensor.name}
                    value={sensor.value}
                    min={sensor.rangeMin}
                    max={sensor.rangeMax}
                    unit={sensor.unit}
                    decimals={sensor.decimals}
                    high={sensor.highLimit}
                    tone={plant3dSensorTone(sensor)}
                    hideScale
                  />
                )}
                <Button variant="ghost" size="sm" aria-label={`Open the trend of ${sensor.name}`} onClick={() => onSelectSensor?.(sensor.id)}>
                  <IconChartLine /> Trend
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Plant3dSection>
      {orders.length > 0 ? (
        <Plant3dSection title="Work orders" meta={`${orders.length} open`}>
          <ul className="flex flex-col">
            {orders.map((order) => (
              <ListRow
                key={order.id}
                leading={
                  <IconChip tone="neutral" size="sm">
                    <IconTool />
                  </IconChip>
                }
                title={order.title}
                meta={
                  <>
                    <TagId>{order.id}</TagId>
                    <span>
                      {findPerson(order.assigneeId)?.name ?? 'Unassigned'} · due {formatDate(order.dueAt)}
                    </span>
                  </>
                }
                trailing={<StatusPill tone={PLANT3D_ORDER_STATUS[order.status].tone}>{PLANT3D_ORDER_STATUS[order.status].label}</StatusPill>}
              />
            ))}
          </ul>
        </Plant3dSection>
      ) : null}
    </>
  );
}

function Plant3dSensorInspector({ sensor, onBack }: { sensor: Sensor; onBack?: () => void }) {
  const asset = findAsset(sensor.assetId);
  const trend = plant3dTrend(sensor);
  const tone = plant3dSensorTone(sensor);
  const low = Math.min(...trend.values);
  const high = Math.max(...trend.values);
  const mean = trend.values.reduce((total, value) => total + value, 0) / trend.values.length;

  return (
    <>
      {onBack ? (
        <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 self-start">
          <IconArrowLeft /> Back to {asset?.tag ?? 'equipment'}
        </Button>
      ) : null}
      <Stat
        variant="plain"
        size="hero"
        label={sensor.name}
        value={sensor.quality === 'bad' ? 'No signal' : sensor.value}
        decimals={sensor.decimals}
        unit={sensor.quality === 'bad' ? undefined : sensor.unit}
        tone={tone}
        state={plant3dSensorWord(sensor)}
        stateIcon={tone === 'accent' ? undefined : <IconAlertTriangle />}
      />
      {sensor.quality === 'bad' ? (
        <p className="rounded-lg bg-[var(--kit-well)] px-3 py-2.5 text-sm text-[var(--kit-text-2)]">The transmitter stopped reporting 9 hours ago. A replacement is planned for 13 March.</p>
      ) : (
        <>
          <TrendLine
            label={`${sensor.name} over the last 24 hours with its limits`}
            series={[{ id: 'value', label: sensor.name, values: trend.values, tone: tone === 'accent' ? 'accent' : tone }]}
            labels={trend.labels}
            unit={sensor.unit}
            decimals={sensor.decimals}
            limits={plant3dLimits(sensor)}
            height={210}
            fill
            showLegend={false}
          />
          <dl className="grid grid-cols-3 gap-3 rounded-lg bg-[var(--kit-well)] px-3 py-2.5">
            {[
              { label: '24 h low', value: low },
              { label: '24 h average', value: mean },
              { label: '24 h high', value: high },
            ].map((item) => (
              <div key={item.label} className="flex flex-col">
                <dt className="text-xs text-[var(--kit-text-3)]">{item.label}</dt>
                <dd className="text-base font-semibold tabular-nums text-[var(--kit-text)]">{formatNumber(item.value, sensor.decimals)}</dd>
              </div>
            ))}
          </dl>
          <Meter label="Position in the instrument range" value={sensor.value} min={sensor.rangeMin} max={sensor.rangeMax} unit={sensor.unit} decimals={sensor.decimals} high={sensor.highLimit} target={{ value: sensor.highLimit, label: 'High limit' }} tone={tone} />
        </>
      )}
    </>
  );
}

/** The inspector card: its heading follows the drill level, its body is one of the four views above. */
function Plant3dInspector({ state, dispatch, onCollapse, className = '' }: { state: ExplorerState; dispatch?: (action: ExplorerAction) => void; onCollapse?: () => void; className?: string }) {
  const level = explorerLevel(state);
  const asset = state.equipmentId ? findAsset(state.equipmentId) : undefined;
  const area = state.areaId ? findAsset(state.areaId) : undefined;
  const sensor = state.sensorId ? PLANT3D_SENSORS.find((candidate) => candidate.id === state.sensorId) : undefined;
  const select = (id: string) => {
    const action = plant3dSelectAction(id);
    if (action) dispatch?.(action);
  };
  const heading =
    level === 'sensor' && sensor
      ? { title: sensor.tag, subtitle: asset?.name ?? 'Instrument' }
      : level !== 'plant' && asset
        ? { title: asset.name, subtitle: `${asset.tag} · ${area?.name ?? ''}` }
        : level === 'area' && area
          ? { title: area.name, subtitle: `${area.tag} · process area` }
          : { title: 'Nordkapp plant', subtitle: 'Gas processing · 16 units' };

  return (
    <Panel
      className={className}
      title={heading.title}
      subtitle={heading.subtitle}
      icon={
        <IconChip tone={level === 'plant' ? 'accent' : level === 'sensor' ? 'purple' : 'teal'}>
          {level === 'plant' ? <IconBuildingFactory2 /> : level === 'sensor' ? <IconChartLine /> : <IconFlame />}
        </IconChip>
      }
      actions={
        onCollapse ? (
          <Button variant="ghost" size="sm" onClick={onCollapse}>
            <IconLayoutSidebarRightCollapse /> Hide
          </Button>
        ) : undefined
      }
    >
      <div key={`${level}-${state.sensorId ?? state.equipmentId ?? state.areaId ?? 'plant'}`} className="@container -mr-2 min-h-0 flex-1 overflow-y-auto pr-2">
        <div className="flex flex-col gap-5 @2xl:grid @2xl:grid-cols-2 @2xl:items-start @2xl:gap-x-8">
          {level === 'sensor' && sensor ? (
            <Plant3dSensorInspector sensor={sensor} onBack={dispatch ? () => dispatch({ type: 'up' }) : undefined} />
          ) : level !== 'plant' && asset ? (
            <Plant3dEquipmentInspector asset={asset} onSelectSensor={(sensorId) => dispatch?.({ type: 'selectSensor', sensorId })} />
          ) : level === 'area' && state.areaId ? (
            <Plant3dAreaInspector areaId={state.areaId} onSelect={select} />
          ) : (
            <Plant3dPlantInspector onSelect={select} />
          )}
        </div>
      </div>
    </Panel>
  );
}

function Plant3dBreadcrumb({ state, dispatch }: { state: ExplorerState; dispatch: (action: ExplorerAction) => void }) {
  const crumbs = explorerBreadcrumb(state, PLANT3D_LAYOUT.id, plant3dLabelOf);
  return (
    <nav aria-label="Plant drill-down path" className={`flex min-w-0 items-center gap-1 py-1.5 pl-1.5 pr-3 ${PLANT3D_CARD}`}>
      <Button variant="ghost" size="sm" disabled={crumbs.length === 1} onClick={() => dispatch({ type: 'up' })} aria-label={crumbs.length === 1 ? 'Up one level (already at the plant)' : 'Up one level'}>
        <IconArrowLeft />
      </Button>
      <ol className="flex min-w-0 items-center gap-1 text-sm">
        {crumbs.map((crumb, index) => (
          <li key={crumb.id} className="flex min-w-0 items-center gap-1">
            {index > 0 ? <IconChevronRight aria-hidden="true" className="size-4 shrink-0 text-[var(--kit-text-3)]" /> : null}
            {crumb.action ? (
              <button
                type="button"
                onClick={() => {
                  if (crumb.action) dispatch(crumb.action);
                }}
                className={`whitespace-nowrap rounded-md px-1.5 py-0.5 text-[var(--kit-text-2)] hover:bg-[var(--kit-well)] hover:text-[var(--kit-text)] ${PLANT3D_FOCUS}`}
              >
                {crumb.label}
              </button>
            ) : (
              <span aria-current="location" className="whitespace-nowrap px-1.5 py-0.5 font-semibold tabular-nums text-[var(--kit-text)]">
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function Plant3dViewSwitch({ view, onChange }: { view: CameraView; onChange: (view: CameraView) => void }) {
  return (
    <SegmentedControl
      value={view}
      onValueChange={(value) => {
        if (plant3dIsView(value)) onChange(value);
      }}
    >
      <SegmentedControlList size="small" aria-label="Camera view">
        {PLANT3D_VIEWS.map((option) => (
          <SegmentedControlButton key={option.value} value={option.value}>
            {option.label}
          </SegmentedControlButton>
        ))}
      </SegmentedControlList>
    </SegmentedControl>
  );
}

/** Bottom dock: one card per area with its health score, the keyboard path into the scene. */
function Plant3dAreaDock({ areaId, onSelect }: { areaId: string | null; onSelect: (areaId: string) => void }) {
  return (
    <nav aria-label="Plant areas" className="grid w-full max-w-[43rem] grid-cols-4 gap-2">
      {PLANT3D_LAYOUT.areas.map((area) => {
        const asset = findAsset(area.id);
        const status = PLANT3D_STATUSES[area.id];
        const alarmCount = plant3dAlarmsOf(plant3dAreaAssetIds(area.id)).length;
        if (!asset) return null;
        return (
          <button
            key={area.id}
            type="button"
            aria-pressed={area.id === areaId}
            aria-label={`${area.name}, health ${asset.healthScore}, ${status?.text ?? 'no open alarms'}`}
            onClick={() => onSelect(area.id)}
            className={`flex min-w-0 flex-col gap-1.5 p-3 text-left hover:border-[var(--kit-rule-strong)] aria-pressed:border-[var(--kit-accent)] aria-pressed:ring-2 aria-pressed:ring-[color-mix(in_oklab,var(--kit-accent)_25%,transparent)] ${PLANT3D_CARD} ${PLANT3D_FOCUS}`}
          >
            <span className="hidden whitespace-nowrap text-sm font-medium text-[var(--kit-text)] @[40rem]:block">{area.name}</span>
            <span className="text-sm font-medium tabular-nums text-[var(--kit-text)] @[40rem]:hidden">{area.tag}</span>
            <span className="flex items-end justify-between gap-2">
              <span className="text-2xl font-semibold leading-none tabular-nums tracking-tight text-[var(--kit-text)]">{asset.healthScore}</span>
              <StatusPill tone={status?.tone ?? 'success'}>
                {status?.tone ? alarmCount : 'Clear'}
                {status?.tone ? <span className="hidden @[40rem]:inline">{alarmCount === 1 ? ' alarm' : ' alarms'}</span> : null}
              </StatusPill>
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function Plant3dFallbackList() {
  return (
    <ul className="flex flex-col rounded-lg border border-default bg-card-background px-3">
      {PLANT3D_LAYOUT.areas.map((area) => {
        const status = PLANT3D_STATUSES[area.id];
        return (
          <li key={area.id} className="flex items-center justify-between gap-3 border-b border-default py-2 text-sm last:border-b-0">
            <span className="flex min-w-0 items-baseline gap-2 text-base-foreground">
              {area.name} <TagId>{area.tag}</TagId>
            </span>
            <StatusPill tone={status?.tone ?? 'success'}>{status?.text ?? 'No open alarms'}</StatusPill>
          </li>
        );
      })}
    </ul>
  );
}

type Plant3dExplorerProps = {
  initial?: ExplorerState;
  /** `desk` docks the inspector beside the scene; `tablet` stacks it under the scene as a sheet. */
  layout?: 'desk' | 'tablet';
  initialView?: CameraView;
  still?: boolean;
};

function Plant3dExplorer({ initial = INITIAL_EXPLORER_STATE, layout = 'desk', initialView = 'perspective', still = false }: Plant3dExplorerProps) {
  // Archetype: scene-first — the plant fills the frame and everything else floats over it.
  // Interaction: orbit, click an area and a unit; the inspector follows the drill level and can
  //   be hidden to give the scene the whole frame.
  const [state, dispatch] = useReducer(explorerReducer, initial);
  const [view, setView] = useState<CameraView>(initialView);
  const [showLabels, setShowLabels] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const desk = layout === 'desk';

  const level = explorerLevel(state);
  const sensor = state.sensorId ? PLANT3D_SENSORS.find((candidate) => candidate.id === state.sensorId) : undefined;
  const crumbs = explorerBreadcrumb(state, PLANT3D_LAYOUT.id, plant3dLabelOf);
  const sensorTone = sensor ? plant3dSensorTone(sensor) : 'accent';

  const act = (action: ExplorerAction) => {
    dispatch(action);
    // Picking a unit or a reading is a question; the inspector is where the answer is.
    if (action.type === 'selectEquipment' || action.type === 'selectSensor') setInspectorOpen(true);
  };
  const select = (id: string) => {
    const action = plant3dSelectAction(id);
    if (action) act(action);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const typing = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement;
    if ((event.key === 'Escape' || (event.key === 'Backspace' && !typing)) && level !== 'plant') {
      event.preventDefault();
      dispatch({ type: 'up' });
    }
  };

  const marker: PlantSceneMarker | null =
    sensor && state.equipmentId
      ? {
          equipmentId: state.equipmentId,
          anchor: PLANT3D_SENSOR_ANCHORS[sensor.id] ?? [0, 1, 0],
          tag: sensor.tag,
          value: plant3dReading(sensor),
          tone: sensorTone === 'accent' ? undefined : sensorTone,
        }
      : null;
  const insets = desk ? { top: 112, bottom: 150, left: 0, right: inspectorOpen ? 392 : 0 } : { top: 76, bottom: inspectorOpen ? 440 : 48, left: 0, right: 0 };

  return (
    <div
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onPointerDownCapture={(event) => {
        // Orbit controls swallow the pointer event, so take focus by hand to keep Escape working.
        if (event.target instanceof HTMLCanvasElement) event.currentTarget.focus({ preventScroll: true });
      }}
      data-level={level}
      className={`relative w-full overflow-hidden rounded-2xl border border-[var(--kit-rule)] bg-[var(--kit-canvas-bg)] outline-none ${desk ? 'h-[48rem]' : 'h-[60rem]'} ${PLANT3D_SCENE_TYPE}`}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_40%_45%,color-mix(in_oklab,var(--kit-surface)_85%,transparent),transparent_70%)]" />
      <SceneCanvas label={`3D model of the Nordkapp gas plant, showing ${crumbs.map((crumb) => crumb.label).join(', ')}`} fallback={<Plant3dFallbackList />}>
        <StillScene still={still}>
          <PlantScene
            layout={PLANT3D_LAYOUT}
            statuses={PLANT3D_STATUSES}
            focusId={explorerFocusId(state, PLANT3D_LAYOUT.id)}
            view={view}
            activeAreaId={state.areaId}
            selectedId={state.equipmentId}
            onSelect={select}
            showLabels={showLabels}
            marker={marker}
            insets={insets}
          />
        </StillScene>
      </SceneCanvas>

      <div className={`pointer-events-none absolute inset-4 z-30 flex gap-4 ${desk ? '' : 'flex-col'}`}>
        <div className="@container flex min-h-0 min-w-0 flex-1 flex-col justify-between gap-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="pointer-events-auto min-w-0">
              <Plant3dBreadcrumb state={state} dispatch={dispatch} />
            </div>
            <div className={`pointer-events-auto flex shrink-0 items-center gap-3 py-1.5 pl-1.5 pr-3 ${PLANT3D_CARD}`}>
              <Plant3dViewSwitch view={view} onChange={setView} />
              <Switch label="Labels" checked={showLabels} onCheckedChange={(checked) => setShowLabels(checked)} />
              {inspectorOpen ? null : (
                <Button variant="outline" size="sm" onClick={() => setInspectorOpen(true)}>
                  <IconLayoutSidebarRightExpand /> Inspector
                </Button>
              )}
            </div>
          </div>
          <div className="pointer-events-none flex flex-col items-start gap-2">
            <div className="pointer-events-auto flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-[color-mix(in_oklab,var(--kit-surface)_82%,transparent)] px-2.5 py-1">
              <span className="text-xs font-medium text-[var(--kit-text-2)]">Rings</span>
              <Legend items={PLANT3D_LEGEND} />
            </div>
            {desk ? <span className="rounded-lg bg-[color-mix(in_oklab,var(--kit-surface)_82%,transparent)] px-2.5 py-1 text-xs font-medium text-[var(--kit-text-2)]">Health score by area</span> : null}
            {desk ? (
              <div className="pointer-events-auto w-full">
                <Plant3dAreaDock areaId={state.areaId} onSelect={(areaId) => act({ type: 'selectArea', areaId })} />
              </div>
            ) : null}
          </div>
        </div>
        {inspectorOpen ? (
          <Plant3dInspector
            state={state}
            dispatch={act}
            onCollapse={() => setInspectorOpen(false)}
            className={`pointer-events-auto shrink-0 motion-safe:transition-[opacity,translate] motion-safe:duration-300 motion-safe:starting:opacity-0 ${desk ? 'h-full w-[23rem] motion-safe:starting:translate-x-4' : 'h-[25rem] w-full motion-safe:starting:translate-y-4'}`}
          />
        ) : null}
      </div>
    </div>
  );
}

function Plant3dExplorerSignature() {
  return (
    <LookScope look="studio" className="w-full">
      <Plant3dExplorer />
    </LookScope>
  );
}

function Plant3dExplorerSensorDrill() {
  return (
    <LookScope look="studio" className="w-full">
      <Plant3dExplorer initial={{ areaId: 'nk-23', equipmentId: '23-ka-9101', sensorId: 'vt-92540' }} still />
    </LookScope>
  );
}

function Plant3dExplorerTablet() {
  return (
    <LookScope look="studio" className="mx-auto w-full max-w-[52rem]">
      <Plant3dExplorer initial={{ areaId: 'nk-23', equipmentId: '23-ka-9103', sensorId: null }} layout="tablet" initialView="isometric" still />
    </LookScope>
  );
}

function Plant3dPartFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <LookScope look="studio" className="w-full">
      <div className={`flex w-full flex-col rounded-2xl bg-[var(--kit-canvas-bg)] p-4 ${className}`}>{children}</div>
    </LookScope>
  );
}

function Plant3dExplorerPartPlant() {
  const [state, dispatch] = useReducer(explorerReducer, INITIAL_EXPLORER_STATE);
  return (
    <Plant3dPartFrame className="h-[40rem]">
      <Plant3dInspector state={state} dispatch={dispatch} className="h-full" />
    </Plant3dPartFrame>
  );
}

function Plant3dExplorerPartEquipment() {
  const [state, dispatch] = useReducer(explorerReducer, { areaId: 'nk-23', equipmentId: '23-ka-9101', sensorId: null });
  return (
    <Plant3dPartFrame className="h-[40rem]">
      <Plant3dInspector state={state} dispatch={dispatch} className="h-full" />
    </Plant3dPartFrame>
  );
}

function Plant3dExplorerPartSensor() {
  return (
    <Plant3dPartFrame className="h-[40rem]">
      <Plant3dInspector state={{ areaId: 'nk-23', equipmentId: '23-ka-9101', sensorId: 'tt-92532' }} className="h-full" />
    </Plant3dPartFrame>
  );
}

function Plant3dExplorerPartModel() {
  return (
    <Plant3dPartFrame className="h-[40rem] gap-3">
      <div className={`min-h-0 flex-1 overflow-hidden ${PLANT3D_CARD}`}>
        <SceneCanvas label="Compressor skid with a critical status ring, on a turntable stage">
          <StillScene>
            <TurntableStage subjectSize={EQUIPMENT_SIZES.compressor}>
              <CompressorSkid tone="critical" />
            </TurntableStage>
          </StillScene>
        </SceneCanvas>
      </div>
      <div className={`flex items-center justify-between gap-3 px-4 py-3 ${PLANT3D_CARD}`}>
        <span className="flex min-w-0 flex-col">
          <span className="text-sm font-semibold text-[var(--kit-text)]">Recompressor</span>
          <TagId>23-KA-9103</TagId>
        </span>
        <StatusPill tone="critical" size="lg" icon={<IconAlertOctagon />}>
          Tripped
        </StatusPill>
      </div>
    </Plant3dPartFrame>
  );
}

function Plant3dExplorerPartDock() {
  const [areaId, setAreaId] = useState<string | null>('nk-23');
  return (
    <Plant3dPartFrame className="h-64 items-center justify-center gap-4">
      <Plant3dAreaDock areaId={areaId} onSelect={(next) => setAreaId(next === areaId ? null : next)} />
      <p className="text-sm text-[var(--kit-text-2)]">{areaId ? `The camera frames ${plant3dLabelOf(areaId).toLowerCase()}.` : 'The camera frames the whole plant.'}</p>
    </Plant3dPartFrame>
  );
}

function Plant3dExplorerPartTank() {
  const [level, setLevel] = useState(62);
  const tone = level > 90 ? 'warning' : 'accent';
  return (
    <Plant3dPartFrame className="h-64 gap-3">
      <div className={`min-h-0 flex-1 overflow-hidden ${PLANT3D_CARD}`}>
        <SceneCanvas label={`Storage tank filled to ${level} percent`}>
          <StillScene>
            <TurntableStage subjectSize={EQUIPMENT_SIZES['storage-tank']}>
              <StorageTank fill={level / 100} tone={level > 90 ? 'warning' : undefined} />
            </TurntableStage>
          </StillScene>
        </SceneCanvas>
      </div>
      <div className="flex items-center gap-4">
        <span className="w-24 shrink-0 text-sm font-semibold tabular-nums text-[var(--kit-text)]" data-tone={tone}>
          Level {level} %
        </span>
        <Slider aria-label="Tank level" value={[level]} min={0} max={100} step={1} onValueChange={(value) => setLevel(value[0] ?? 0)} />
      </div>
    </Plant3dPartFrame>
  );
}

function Plant3dExplorerPartToolbar() {
  const [state, dispatch] = useReducer(explorerReducer, { areaId: 'nk-23', equipmentId: '23-ka-9101', sensorId: 'pt-92531' });
  const [view, setView] = useState<CameraView>('perspective');
  const [labels, setLabels] = useState(true);
  return (
    <Plant3dPartFrame className="gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Plant3dBreadcrumb state={state} dispatch={dispatch} />
        <div className={`flex items-center gap-3 py-1.5 pl-1.5 pr-3 ${PLANT3D_CARD}`}>
          <Plant3dViewSwitch view={view} onChange={setView} />
          <Switch label="Labels" checked={labels} onCheckedChange={(checked) => setLabels(checked)} />
          <Button variant="outline" size="sm">
            <IconLayoutSidebarRightExpand /> Inspector
          </Button>
        </div>
      </div>
      <Legend items={PLANT3D_LEGEND} />
    </Plant3dPartFrame>
  );
}

export default definePage({
  id: 'plant-3d-explorer',
  title: '3D plant explorer',
  summary:
    'The Nordkapp gas plant as a scene you fly through. The 3D plant fills the frame; a breadcrumb, a view toolbar and an area dock float over it, and a collapsible inspector follows you from the plant to an area, a machine and one instrument.',
  guidance: {
    use: [
      'When where something is matters as much as what it reads: walkdowns, isolation planning, incident review.',
      'With one inspector that changes with the drill level, so the scene stays the subject.',
      'With a keyboard path beside the canvas: the area dock, the breadcrumb and the inspector lists reach everything.',
      'When the inspector can be hidden, to give the scene the whole frame on a shared screen.',
    ],
    avoid: [
      'As a monitoring page: a table shows forty readings better than forty labels in space.',
      'Colouring whole machines by status. Use a ring and a word; steel stays neutral.',
      'Small or monospaced labels in the scene. They are read at a glance, from a distance.',
      'Panels that cover the selected unit: tell the scene how much room the overlays take.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description:
        'Drag to orbit, scroll to zoom. Click an area on the plot plan or in the dock, then a unit, then Trend on a reading: the camera flies in and the inspector follows. Escape or the arrow goes one level up. Hide collapses the inspector.',
      specimens: [
        {
          id: 'Plant3dExplorerSignature',
          title: 'Plant explorer',
          note: 'Pick it when people need to find equipment by where it stands and read its state without leaving the scene.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'three/SceneCanvas.tsx',
            'three/PlantScene.tsx',
            'three/plantLayout.ts',
            'three/explorerState.ts',
            'kit/Panel.tsx',
            'kit/Stat.tsx',
            'kit/RingGauge.tsx',
            'kit/Meter.tsx',
            'kit/ListRow.tsx',
            'kit/StatusPill.tsx',
            'kit/TrendLine.tsx',
            'kit/TagId.tsx',
            'kit/Legend.tsx',
            'looks/LookScope.tsx',
          ],
          Component: Plant3dExplorerSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Other screens',
      description: 'The deepest drill level on a desk, and the same product on a tablet where the inspector becomes a sheet under the scene. Both render a still frame.',
      specimens: [
        {
          id: 'Plant3dExplorerSensorDrill',
          title: 'Down to one instrument',
          note: 'Pick it as the end of the journey: the reading is pinned on the machine and its 24-hour trend sits beside it.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['three/PlantScene.tsx', 'three/explorerState.ts', 'three/scenes/StillScene.tsx', 'kit/TrendLine.tsx', 'kit/Stat.tsx', 'looks/LookScope.tsx'],
          Component: Plant3dExplorerSensorDrill,
        },
        {
          id: 'Plant3dExplorerTablet',
          title: 'Tablet, inspector as a sheet',
          note: 'Pick it for a field tablet: the scene keeps the top of the screen and the inspector lays its sections side by side below.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['three/PlantScene.tsx', 'three/explorerState.ts', 'three/scenes/StillScene.tsx', 'kit/Panel.tsx', 'kit/Meter.tsx', 'looks/LookScope.tsx'],
          Component: Plant3dExplorerTablet,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The inspector at three drill levels, a model on a stage, and the floating controls on their own.',
      specimens: [
        {
          id: 'Plant3dExplorerPartPlant',
          title: 'Inspector, plant level',
          note: 'Pick it as the resting state: one headline figure, the areas by health and the worst open alarms.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['kit/Panel.tsx', 'kit/Stat.tsx', 'kit/RingGauge.tsx', 'kit/ListRow.tsx', 'kit/StatusPill.tsx', 'three/explorerState.ts'],
          Component: Plant3dExplorerPartPlant,
        },
        {
          id: 'Plant3dExplorerPartEquipment',
          title: 'Inspector, equipment level',
          note: 'Pick it for a selected machine: health, state, its alarms and live readings against their limits.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['kit/Panel.tsx', 'kit/Meter.tsx', 'kit/RingGauge.tsx', 'kit/ListRow.tsx', 'kit/StatusPill.tsx'],
          Component: Plant3dExplorerPartEquipment,
        },
        {
          id: 'Plant3dExplorerPartSensor',
          title: 'Inspector, sensor level',
          note: 'Pick it for one reading: the value with its judgement in words, a day of trend with limits, and where it sits in its range.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['kit/Panel.tsx', 'kit/Stat.tsx', 'kit/TrendLine.tsx', 'kit/Meter.tsx'],
          Component: Plant3dExplorerPartSensor,
        },
        {
          id: 'Plant3dExplorerPartModel',
          title: 'Model with a status ring',
          note: 'Pick it to show one machine and its state outside the plant: the ring carries the tone, the caption the word.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['three/CompressorSkid.tsx', 'three/TurntableStage.tsx', 'three/scenes/StillScene.tsx', 'kit/StatusPill.tsx', 'kit/TagId.tsx'],
          Component: Plant3dExplorerPartModel,
        },
        {
          id: 'Plant3dExplorerPartDock',
          title: 'Area dock',
          note: 'Pick it as the keyboard path into a scene: one card per area with a health score and its alarm count.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['kit/StatusPill.tsx'],
          Component: Plant3dExplorerPartDock,
        },
        {
          id: 'Plant3dExplorerPartTank',
          title: 'Tank with a level',
          note: 'Pick it when a quantity is best understood as a filled volume: drag the level to see it.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/StorageTank.tsx', 'three/TurntableStage.tsx', 'three/scenes/StillScene.tsx'],
          Component: Plant3dExplorerPartTank,
        },
        {
          id: 'Plant3dExplorerPartToolbar',
          title: 'Breadcrumb, view toolbar and legend',
          note: 'Pick them as the only chrome a scene needs: where you are, how you look at it, and what the rings mean.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['three/explorerState.ts', 'kit/Legend.tsx'],
          Component: Plant3dExplorerPartToolbar,
        },
      ],
    },
  ],
});
