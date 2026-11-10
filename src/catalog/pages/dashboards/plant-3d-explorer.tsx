import { Button } from '@cognite/aura/components/button';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import { Slider } from '@cognite/aura/components/slider';
import { Switch } from '@cognite/aura/components/switch';
import { IconArrowLeft, IconBell, IconPlus } from '@cognite/aura/icons';
import { useReducer, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

import { summarize } from '../../../library/industrial/charts/stats';
import { TrendChart } from '../../../library/industrial/charts/TrendChart';
import type { TrendLimit } from '../../../library/industrial/charts/TrendChart';
import { RadialGauge } from '../../../library/industrial/RadialGauge';
import { Sparkline } from '../../../library/industrial/Sparkline';
import {
  formatLimit,
  formatReading,
  healthStatus,
  qualityStatus,
  runStateStatus,
  severityStatus,
  toneFromLimits,
} from '../../../library/industrial/status';
import type { Tone } from '../../../library/industrial/status';
import { StatusDot } from '../../../library/industrial/StatusDot';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { TrendDelta } from '../../../library/industrial/TrendDelta';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import type { CameraView, Vec3 } from '../../../library/three/cameraTargets';
import { CompressorSkid } from '../../../library/three/CompressorSkid';
import { DrillBreadcrumb } from '../../../library/three/DrillBreadcrumb';
import {
  INITIAL_EXPLORER_STATE,
  explorerBreadcrumb,
  explorerFocusId,
  explorerLevel,
  explorerReducer,
} from '../../../library/three/explorerState';
import type { ExplorerAction, ExplorerState } from '../../../library/three/explorerState';
import { FlareStack } from '../../../library/three/FlareStack';
import { HorizontalVessel } from '../../../library/three/HorizontalVessel';
import { HudPanel } from '../../../library/three/HudPanel';
import { EQUIPMENT_SIZES, findNode } from '../../../library/three/plantLayout';
import type { PlantLayout } from '../../../library/three/plantLayout';
import { PlantScene } from '../../../library/three/PlantScene';
import type { PlantNodeStatus, PlantSceneMarker } from '../../../library/three/PlantScene';
import { SceneCanvas } from '../../../library/three/SceneCanvas';
import { SceneLegend } from '../../../library/three/SceneLegend';
import type { SceneLegendItem } from '../../../library/three/SceneLegend';
import { StorageTank } from '../../../library/three/StorageTank';
import { TurntableStage } from '../../../library/three/TurntableStage';
import { ALARMS, PLANT_KPIS, SENSORS, WORK_ORDERS, findAsset } from '../../data/plant';
import type { Alarm, Asset, Sensor } from '../../data/plant';
import { MINUTE, formatAgo, formatDate, makeSeries } from '../../data/series';
import type { SeriesPoint } from '../../data/series';
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

const PLANT3D_SEVERITY_RANK = { critical: 0, high: 1, medium: 2, low: 3 } as const;

const PLANT3D_OPEN_ALARMS: readonly Alarm[] = ALARMS.filter((alarm) => alarm.state === 'active' || alarm.state === 'acknowledged').sort(
  (a, b) => PLANT3D_SEVERITY_RANK[a.severity] - PLANT3D_SEVERITY_RANK[b.severity]
);

const PLANT3D_ORDER_STATUS = {
  open: 'Open',
  planned: 'Planned',
  'in-progress': 'In progress',
  waiting: 'Waiting',
  done: 'Done',
} as const;

const PLANT3D_LEGEND: readonly SceneLegendItem[] = [
  { kind: 'status', label: 'Tripped', tone: 'critical' },
  { kind: 'status', label: 'Warning', tone: 'warning' },
  { kind: 'status', label: 'Advisory', tone: 'info' },
  { kind: 'status', label: 'Standby', tone: 'neutral' },
  { kind: 'selection', label: 'Selected' },
  { kind: 'flow', label: 'Flow' },
];

const PLANT3D_VIEWS: readonly { value: CameraView; label: string }[] = [
  { value: 'perspective', label: 'Perspective' },
  { value: 'top', label: 'Top' },
  { value: 'isometric', label: 'Isometric' },
];

const PLANT3D_GLASS = 'border border-default bg-[color-mix(in_oklab,var(--card-background)_78%,transparent)] backdrop-blur-md';

const PLANT3D_FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring-default)]';

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
  if (asset.state !== 'running') return { tone: 'neutral', shape: 'ring', text: runStateStatus(asset.state).label };
  const alarms = plant3dAlarmsOf([asset.id]);
  if (alarms.length === 0) return undefined;
  const worst = severityStatus(alarms[0].severity);
  return { tone: worst.tone, shape: worst.shape, text: plant3dCount(alarms.length, 'alarm') };
}

function plant3dAreaStatus(areaId: string): PlantNodeStatus {
  const alarms = plant3dAlarmsOf(plant3dAreaAssetIds(areaId));
  // Normal is quiet: an area without alarms shows only its name.
  if (alarms.length === 0) return {};
  const worst = severityStatus(alarms[0].severity);
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

function plant3dSensorTone(sensor: Sensor): Tone {
  if (sensor.quality === 'bad') return 'neutral';
  return toneFromLimits(sensor.value, { low: sensor.lowLimit, high: sensor.highLimit, highHigh: sensor.highHighLimit });
}

function plant3dSensorValue(sensor: Sensor): number | null {
  return sensor.quality === 'bad' ? null : sensor.value;
}

/** Last 24 hours for a tag, ending exactly on its current value. */
function plant3dTrend(sensor: Sensor): SeriesPoint[] {
  if (sensor.quality === 'bad') return [];
  const span = sensor.highLimit - sensor.lowLimit;
  const raw = makeSeries({
    seed: sensor.seed,
    points: 48,
    base: sensor.value,
    amplitude: sensor.value === 0 ? 0 : span * 0.05,
    noise: sensor.value === 0 ? 0 : span * 0.025,
    cycles: 1.5,
    stepMs: 30 * MINUTE,
    decimals: sensor.decimals + 1,
  });
  const shift = sensor.value - raw[raw.length - 1].v;
  const factor = 10 ** sensor.decimals;
  return raw.map((point) => ({
    t: point.t,
    v: Math.round(Math.min(sensor.rangeMax, Math.max(sensor.rangeMin, point.v + shift)) * factor) / factor,
  }));
}

function plant3dLimits(sensor: Sensor): TrendLimit[] {
  const limits: TrendLimit[] = [];
  if (sensor.highHighLimit !== undefined) {
    limits.push({ value: sensor.highHighLimit, label: `Trip ${formatLimit(sensor.highHighLimit, sensor.decimals)}`, tone: 'critical' });
  }
  limits.push({ value: sensor.highLimit, label: `High ${formatLimit(sensor.highLimit, sensor.decimals)}`, tone: 'warning' });
  if (sensor.lowLimit > sensor.rangeMin) {
    limits.push({ value: sensor.lowLimit, label: `Low ${formatLimit(sensor.lowLimit, sensor.decimals)}`, tone: 'warning' });
  }
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

function Plant3dKpi({ label, value, unit, decimals, previous, goodDirection }: { label: string; value: number; unit: string; decimals: number; previous: number; goodDirection: 'up' | 'down' }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <ValueReadout value={value} unit={unit} decimals={decimals} size="sm" />
      <TrendDelta value={value} reference={previous} decimals={decimals} goodDirection={goodDirection} size="sm" />
    </div>
  );
}

function Plant3dAlarmList({ alarms, onSelect }: { alarms: readonly Alarm[]; onSelect?: (assetId: string) => void }) {
  if (alarms.length === 0) return <p className="text-sm text-muted-foreground">No open alarms.</p>;
  return (
    <ul className="flex flex-col gap-1">
      {alarms.map((alarm) => {
        const body = (
          <>
            <span className="flex items-center justify-between gap-2">
              <StatusIndicator {...severityStatus(alarm.severity)} size="sm" detail={alarm.state === 'acknowledged' ? 'acknowledged' : undefined} />
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{formatAgo(alarm.raisedAt)}</span>
            </span>
            <span className="text-sm text-base-foreground">{alarm.message}</span>
            <span className="flex flex-wrap gap-x-1.5 text-xs text-muted-foreground">
              <span className="whitespace-nowrap font-mono">{alarm.sensorTag}</span>
              <span className="whitespace-nowrap tabular-nums">
                {alarm.value} · limit {alarm.limit}
              </span>
            </span>
          </>
        );
        return (
          <li key={alarm.id}>
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(alarm.assetId)}
                className={`-mx-1.5 flex w-[calc(100%+0.75rem)] flex-col gap-0.5 rounded-md px-1.5 py-1.5 text-left hover:bg-secondary-background ${PLANT3D_FOCUS}`}
              >
                {body}
              </button>
            ) : (
              <div className="flex flex-col gap-0.5 py-1.5">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Plant3dPlantHud({ onSelectAsset }: { onSelectAsset?: (assetId: string) => void }) {
  return (
    <>
      <HudPanel title="Plant status" meta="14:00 UTC" className="shrink-0">
        <div className="flex flex-col gap-0.5">
          <StatusIndicator tone="warning" shape="square" label="Reduced capacity" size="sm" />
          <span className="text-xs text-muted-foreground">Recompressor tripped 14 min ago</span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-3">
          <Plant3dKpi label="Availability" value={PLANT_KPIS.availability.value} unit="%" decimals={1} previous={PLANT_KPIS.availability.previous} goodDirection="up" />
          <Plant3dKpi label="Gas export" value={PLANT_KPIS.gasExport.value} unit="MSm³/d" decimals={2} previous={PLANT_KPIS.gasExport.previous} goodDirection="up" />
          <Plant3dKpi label="Flaring" value={PLANT_KPIS.flaring.value} unit="kSm³/d" decimals={1} previous={PLANT_KPIS.flaring.previous} goodDirection="down" />
          <Plant3dKpi label="Energy intensity" value={PLANT_KPIS.energyIntensity.value} unit="kWh/boe" decimals={1} previous={PLANT_KPIS.energyIntensity.previous} goodDirection="down" />
        </div>
      </HudPanel>
      <HudPanel title="Open alarms" meta={PLANT3D_OPEN_ALARMS.length}>
        <Plant3dAlarmList alarms={PLANT3D_OPEN_ALARMS} onSelect={onSelectAsset} />
      </HudPanel>
    </>
  );
}

function Plant3dAreaHud({ areaId, selectedId, onSelectAsset }: { areaId: string; selectedId: string | null; onSelectAsset: (assetId: string) => void }) {
  const area = PLANT3D_LAYOUT.areas.find((candidate) => candidate.id === areaId);
  const asset = findAsset(areaId);
  if (!area || !asset) return null;
  const alarms = plant3dAlarmsOf(plant3dAreaAssetIds(areaId));

  return (
    <>
      <HudPanel title={area.name} meta={<span className="font-mono">{area.tag}</span>} className="shrink-0">
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Health score</span>
            <ValueReadout value={asset.healthScore} unit="/ 100" size="md" tone={asset.health === 'good' ? 'neutral' : healthStatus(asset.health).tone} />
          </div>
          <StatusIndicator {...healthStatus(asset.health)} size="sm" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Units</span>
          <ul className="flex flex-col gap-0.5">
            {area.equipment.map((equipment) => {
              const unit = findAsset(equipment.id);
              if (!unit) return null;
              return (
                <li key={equipment.id}>
                  <button
                    type="button"
                    aria-pressed={equipment.id === selectedId}
                    onClick={() => onSelectAsset(equipment.id)}
                    className={`-mx-1.5 flex w-[calc(100%+0.75rem)] items-center justify-between gap-2 rounded-md px-1.5 py-1.5 text-left hover:bg-secondary-background aria-pressed:bg-secondary-background ${PLANT3D_FOCUS}`}
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="font-mono text-xs text-base-foreground">{unit.tag}</span>
                      <span className="truncate text-xs text-muted-foreground">{unit.name}</span>
                    </span>
                    <StatusIndicator {...runStateStatus(unit.state)} size="sm" className="shrink-0" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </HudPanel>
      <HudPanel title="Open alarms" meta={alarms.length}>
        <Plant3dAlarmList alarms={alarms} onSelect={onSelectAsset} />
      </HudPanel>
    </>
  );
}

function Plant3dReadingRow({ sensor, onSelect }: { sensor: Sensor; onSelect?: (sensorId: string) => void }) {
  const tone = plant3dSensorTone(sensor);
  const values = plant3dTrend(sensor).map((point) => point.v);
  const body = (
    <>
      <span className="flex items-start justify-between gap-2">
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm text-base-foreground">{sensor.name}</span>
          <span className="font-mono text-xs text-muted-foreground">{sensor.tag}</span>
        </span>
        {sensor.quality === 'bad' ? (
          <StatusIndicator {...qualityStatus('bad')} label="Bad quality" size="sm" className="shrink-0" />
        ) : (
          <ValueReadout value={sensor.value} unit={sensor.unit} decimals={sensor.decimals} size="sm" tone={tone} className="shrink-0" />
        )}
      </span>
      <Sparkline
        values={values}
        label={`${sensor.name}, last 24 hours`}
        unit={sensor.unit}
        decimals={sensor.decimals}
        height={24}
        tone={tone}
        limit={tone === 'neutral' ? undefined : sensor.highLimit}
        limitTone={tone === 'critical' ? 'critical' : 'warning'}
        showLast
      />
    </>
  );

  if (!onSelect) return <div className="flex flex-col gap-1 py-1.5">{body}</div>;
  return (
    <button
      type="button"
      onClick={() => onSelect(sensor.id)}
      aria-label={`Open ${sensor.name} ${sensor.tag}`}
      className={`-mx-1.5 flex w-[calc(100%+0.75rem)] flex-col gap-1 rounded-md px-1.5 py-1.5 text-left hover:bg-secondary-background ${PLANT3D_FOCUS}`}
    >
      {body}
    </button>
  );
}

function Plant3dEquipmentInspector({ asset, onSelectSensor }: { asset: Asset; onSelectSensor?: (sensorId: string) => void }) {
  const sensors = plant3dSensorsOf(asset.id);
  const dials = sensors.filter((sensor) => sensor.quality !== 'bad').slice(0, 2);
  const alarms = plant3dAlarmsOf([asset.id]);
  const orders = WORK_ORDERS.filter((order) => order.assetId === asset.id && order.status !== 'done');

  return (
    <>
      <div className="flex flex-col gap-2">
        <div>
          <p className="font-mono text-sm font-medium text-base-foreground">{asset.tag}</p>
          <p className="text-sm text-medium-foreground">{asset.name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <StatusIndicator {...runStateStatus(asset.state)} size="sm" pulse={asset.state === 'tripped'} />
          <StatusIndicator {...healthStatus(asset.health)} label={`Health ${asset.healthScore}`} detail={healthStatus(asset.health).label.toLowerCase()} size="sm" />
          <span className="text-xs text-muted-foreground">Criticality {asset.criticality}</span>
        </div>
      </div>

      {dials.length === 2 ? (
        <div className="grid grid-cols-2 gap-2">
          {dials.map((sensor) => (
            <div key={sensor.id} className="flex justify-center">
              <RadialGauge
                label={sensor.name}
                value={sensor.value}
                min={sensor.rangeMin}
                max={sensor.rangeMax}
                unit={sensor.unit}
                decimals={sensor.decimals}
                limits={{ low: sensor.lowLimit, high: sensor.highLimit, highHigh: sensor.highHighLimit }}
                size="sm"
              />
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">Live readings</span>
        {sensors.length === 0 ? (
          <p className="text-sm text-muted-foreground">No instruments are mapped to this unit yet.</p>
        ) : (
          <ul className="flex flex-col">
            {sensors.map((sensor) => (
              <li key={sensor.id}>
                <Plant3dReadingRow sensor={sensor} onSelect={onSelectSensor} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">Open alarms</span>
        <Plant3dAlarmList alarms={alarms} />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">Work orders</span>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open work orders.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {orders.map((order) => (
              <li key={order.id} className="flex flex-col gap-0.5">
                <span className="text-sm text-base-foreground">{order.title}</span>
                <span className="text-xs text-muted-foreground">
                  <span className="font-mono">{order.id}</span> · {order.priority} · {PLANT3D_ORDER_STATUS[order.status]} · due {formatDate(order.dueAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {alarms.some((alarm) => alarm.state === 'active') ? (
          <Button size="sm">
            <IconBell /> Acknowledge alarm
          </Button>
        ) : null}
        <Button size="sm" variant="outline">
          <IconPlus /> Create work order
        </Button>
      </div>
    </>
  );
}

function Plant3dSensorInspector({ sensor, onBack }: { sensor: Sensor; onBack?: () => void }) {
  const tone = plant3dSensorTone(sensor);
  const points = plant3dTrend(sensor);
  const stats = summarize(points.map((point) => point.v));
  const events = ALARMS.filter((alarm) => alarm.sensorTag === sensor.tag);
  const reading = formatReading(plant3dSensorValue(sensor), sensor.unit, sensor.decimals);

  return (
    <>
      {onBack ? (
        <div>
          <Button variant="ghost" size="sm" onClick={onBack}>
            <IconArrowLeft /> All readings
          </Button>
        </div>
      ) : null}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-sm font-medium text-base-foreground">{sensor.tag}</p>
          <p className="text-sm text-medium-foreground">{sensor.name}</p>
        </div>
        <ValueReadout value={plant3dSensorValue(sensor)} unit={sensor.unit} decimals={sensor.decimals} size="md" tone={tone} className="shrink-0" />
      </div>
      <StatusIndicator {...qualityStatus(sensor.quality)} label={`Signal ${qualityStatus(sensor.quality).label.toLowerCase()}`} size="sm" />

      {points.length > 0 ? (
        <TrendChart
          label={`${sensor.name} over the last 24 hours, now ${reading}`}
          series={[{ key: sensor.id, label: sensor.name, points }]}
          limits={plant3dLimits(sensor)}
          unit={sensor.unit}
          decimals={sensor.decimals}
          maxTicks={3}
          showLast
          heightClassName="h-44"
          className="w-full"
        />
      ) : (
        <p className="text-sm text-muted-foreground">No data in the last 24 hours. The transmitter reports bad quality.</p>
      )}

      {stats ? (
        <dl className="grid grid-cols-3 gap-2">
          {[
            { label: 'Min', value: stats.min },
            { label: 'Mean', value: stats.mean },
            { label: 'Max', value: stats.max },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col gap-0.5">
              <dt className="text-xs text-muted-foreground">{stat.label}</dt>
              <dd>
                <ValueReadout value={stat.value} decimals={sensor.decimals} size="xs" />
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      <dl className="flex flex-col gap-1 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Operating band</dt>
          <dd className="tabular-nums text-base-foreground">
            {formatLimit(sensor.lowLimit, sensor.decimals)} to {formatReading(sensor.highLimit, sensor.unit, Number.isInteger(sensor.highLimit) ? 0 : sensor.decimals)}
          </dd>
        </div>
        {sensor.highHighLimit !== undefined ? (
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Trip limit</dt>
            <dd className="tabular-nums text-base-foreground">{formatReading(sensor.highHighLimit, sensor.unit, Number.isInteger(sensor.highHighLimit) ? 0 : sensor.decimals)}</dd>
          </div>
        ) : null}
      </dl>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">Events on this tag</span>
        {events.length === 0 ? <p className="text-sm text-muted-foreground">No alarms in the last 7 days.</p> : <Plant3dAlarmList alarms={events} />}
      </div>
    </>
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

function Plant3dFallbackList() {
  return (
    <ul className="flex flex-col gap-2 rounded-lg border border-default bg-card-background p-3">
      {PLANT3D_LAYOUT.areas.map((area) => {
        const status = PLANT3D_STATUSES[area.id];
        return (
          <li key={area.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-base-foreground">
              <span className="font-mono text-xs text-muted-foreground">{area.tag}</span> {area.name}
            </span>
            <StatusIndicator tone={status?.tone ?? 'neutral'} shape={status?.shape ?? 'ring'} label={status?.text ?? 'No open alarms'} size="sm" className="shrink-0" />
          </li>
        );
      })}
    </ul>
  );
}

function Plant3dExplorer({ initial = INITIAL_EXPLORER_STATE }: { initial?: ExplorerState }) {
  const [state, dispatch] = useReducer(explorerReducer, initial);
  const [view, setView] = useState<CameraView>('perspective');
  const [showLabels, setShowLabels] = useState(true);

  const level = explorerLevel(state);
  const asset = state.equipmentId ? findAsset(state.equipmentId) : undefined;
  const sensor = state.sensorId ? PLANT3D_SENSORS.find((candidate) => candidate.id === state.sensorId) : undefined;
  const crumbs = explorerBreadcrumb(state, PLANT3D_LAYOUT.id, plant3dLabelOf);

  const select = (id: string) => {
    const action = plant3dSelectAction(id);
    if (action) dispatch(action);
  };
  const navigate = (id: string) => {
    const action = crumbs.find((crumb) => crumb.id === id)?.action;
    if (action) dispatch(action);
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
          value: sensor.quality === 'bad' ? 'Bad quality' : formatReading(sensor.value, sensor.unit, sensor.decimals),
          tone: plant3dSensorTone(sensor) === 'neutral' ? undefined : plant3dSensorTone(sensor),
        }
      : null;

  return (
    <div
      tabIndex={-1}
      onKeyDown={onKeyDown}
      data-level={level}
      className="relative h-[46rem] w-full overflow-hidden rounded-xl border border-default bg-base-background outline-none"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,color-mix(in_oklab,var(--primary-background)_12%,transparent),transparent_65%)]"
      />
      <SceneCanvas
        label={`3D model of the Nordkapp gas plant, showing ${crumbs.map((crumb) => crumb.label).join(', ')}`}
        fallback={<Plant3dFallbackList />}
      >
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
          insets={{ top: 56, bottom: 60, left: 280, right: asset ? 344 : 0 }}
        />
      </SceneCanvas>

      <div className="pointer-events-none absolute inset-3 z-30 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <DrillBreadcrumb
            crumbs={crumbs.map((crumb) => ({ id: crumb.id, label: crumb.label }))}
            onNavigate={navigate}
            onUp={() => dispatch({ type: 'up' })}
            label="Plant drill-down path"
            className="pointer-events-auto"
          />
          <div className={`pointer-events-auto flex shrink-0 items-center gap-3 rounded-lg px-2 py-1 ${PLANT3D_GLASS}`}>
            <Plant3dViewSwitch view={view} onChange={setView} />
            <Switch label="Labels" checked={showLabels} onCheckedChange={(checked) => setShowLabels(checked)} />
          </div>
        </div>

        <div className="flex min-h-0 flex-1 justify-between gap-3">
          <div className="pointer-events-auto flex min-h-0 w-64 shrink-0 flex-col gap-3 self-start max-h-full">
            {state.areaId ? <Plant3dAreaHud areaId={state.areaId} selectedId={state.equipmentId} onSelectAsset={select} /> : <Plant3dPlantHud onSelectAsset={select} />}
          </div>
          {asset ? (
            <HudPanel
              key={asset.id}
              title={sensor ? 'Sensor' : 'Equipment'}
              actions={
                <Button variant="ghost" size="sm" onClick={() => dispatch({ type: 'selectArea', areaId: asset.parentId ?? PLANT3D_LAYOUT.id })}>
                  Close
                </Button>
              }
              className="pointer-events-auto w-80 shrink-0 self-start max-h-full motion-safe:transition-[opacity,translate] motion-safe:duration-300 motion-safe:starting:translate-x-4 motion-safe:starting:opacity-0"
            >
              {sensor ? (
                <Plant3dSensorInspector sensor={sensor} onBack={() => dispatch({ type: 'up' })} />
              ) : (
                <Plant3dEquipmentInspector asset={asset} onSelectSensor={(sensorId) => dispatch({ type: 'selectSensor', sensorId })} />
              )}
            </HudPanel>
          ) : null}
        </div>

        <div className="flex items-end justify-between gap-3">
          <nav aria-label="Plant areas" className="pointer-events-auto flex max-w-full shrink-0 flex-wrap gap-2">
            {PLANT3D_LAYOUT.areas.map((area) => {
              const status = PLANT3D_STATUSES[area.id];
              const alarmCount = plant3dAlarmsOf(plant3dAreaAssetIds(area.id)).length;
              return (
                <button
                  key={area.id}
                  type="button"
                  aria-label={`${area.name}, ${status?.text ?? 'no open alarms'}`}
                  aria-pressed={area.id === state.areaId}
                  onClick={() => dispatch({ type: 'selectArea', areaId: area.id })}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-base-foreground hover:border-emphasized aria-pressed:border-[var(--primary-background)] ${PLANT3D_GLASS} ${PLANT3D_FOCUS}`}
                >
                  {status?.tone ? <StatusDot tone={status.tone} shape={status.shape} size="sm" /> : null}
                  <span className="whitespace-nowrap">{area.name}</span>
                  {alarmCount > 0 ? (
                    <span className="flex items-center gap-0.5 text-xs tabular-nums text-muted-foreground">
                      <IconBell aria-hidden="true" className="size-3" />
                      {alarmCount}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
          <div className={`pointer-events-auto min-w-0 max-w-sm rounded-lg px-3 py-2 ${PLANT3D_GLASS}`}>
            <SceneLegend items={PLANT3D_LEGEND} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Plant3dExplorerHologram() {
  return (
    <ThemeScope preset="hologram" className="w-full">
      <Plant3dExplorer />
    </ThemeScope>
  );
}

function Plant3dExplorerTron() {
  return (
    <ThemeScope preset="tron" className="w-full">
      <Plant3dExplorer initial={{ areaId: 'nk-23', equipmentId: null, sensorId: null }} />
    </ThemeScope>
  );
}

function Plant3dExplorerAuraDark() {
  return (
    <ThemeScope preset="aura-dark" className="w-full">
      <Plant3dExplorer initial={{ areaId: 'nk-23', equipmentId: '23-ka-9101', sensorId: null }} />
    </ThemeScope>
  );
}

function Plant3dExplorerBlueprint() {
  return (
    <ThemeScope preset="blueprint" className="w-full">
      <Plant3dExplorer />
    </ThemeScope>
  );
}

function Plant3dStage({ label, children }: { label: string; children: ReactNode }) {
  return (
    <ThemeScope preset="hologram" className="w-full">
      <div className="h-72 w-full overflow-hidden rounded-xl border border-default bg-base-background">
        <SceneCanvas label={label}>{children}</SceneCanvas>
      </div>
    </ThemeScope>
  );
}

function Plant3dPartVessel() {
  return (
    <Plant3dStage label="Horizontal separator vessel on a turntable stage">
      <TurntableStage subjectSize={EQUIPMENT_SIZES['horizontal-vessel']}>
        <HorizontalVessel />
      </TurntableStage>
    </Plant3dStage>
  );
}

function Plant3dPartCompressor() {
  return (
    <Plant3dStage label="Compressor skid with a pulsing critical status ring">
      <TurntableStage subjectSize={EQUIPMENT_SIZES.compressor}>
        <CompressorSkid tone="critical" pulse />
      </TurntableStage>
    </Plant3dStage>
  );
}

function Plant3dPartFlare() {
  return (
    <Plant3dStage label="Flare stack with a lit pilot flame">
      <TurntableStage subjectSize={EQUIPMENT_SIZES.flare} padding={1}>
        <FlareStack />
      </TurntableStage>
    </Plant3dStage>
  );
}

function Plant3dPartTank() {
  const [level, setLevel] = useState(62);

  return (
    <ThemeScope preset="hologram" className="w-full">
      <div className="flex w-full flex-col gap-3 rounded-xl border border-default bg-base-background p-3">
        <div className="h-72 w-full">
          <SceneCanvas label={`Storage tank filled to ${level} percent`}>
            <TurntableStage subjectSize={EQUIPMENT_SIZES['storage-tank']}>
              <StorageTank fill={level / 100} tone={level > 85 ? 'warning' : undefined} />
            </TurntableStage>
          </SceneCanvas>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex w-28 shrink-0 flex-col">
            <span className="text-xs text-muted-foreground">Tank level</span>
            <ValueReadout value={level} unit="%" size="sm" tone={level > 85 ? 'warning' : 'neutral'} />
          </div>
          <Slider aria-label="Tank level" value={[level]} min={0} max={100} step={1} onValueChange={(value) => setLevel(value[0] ?? 0)} />
        </div>
      </div>
    </ThemeScope>
  );
}

function Plant3dPartViewSwitch() {
  const [view, setView] = useState<CameraView>('isometric');

  return (
    <ThemeScope preset="hologram" className="w-full">
      <div className="flex w-full flex-col gap-3 rounded-xl border border-default bg-base-background p-3">
        <div className="flex justify-end">
          <Plant3dViewSwitch view={view} onChange={setView} />
        </div>
        <div className="h-72 w-full">
          <SceneCanvas label={`Compressor skid in the ${view} view`}>
            <TurntableStage subjectSize={EQUIPMENT_SIZES.compressor} view={view}>
              <CompressorSkid />
            </TurntableStage>
          </SceneCanvas>
        </div>
      </div>
    </ThemeScope>
  );
}

function Plant3dPartBreadcrumb() {
  const [state, dispatch] = useReducer(explorerReducer, { areaId: 'nk-23', equipmentId: '23-ka-9101', sensorId: 'pt-92531' });
  const crumbs = explorerBreadcrumb(state, PLANT3D_LAYOUT.id, plant3dLabelOf);

  return (
    <ThemeScope preset="hologram" className="w-full">
      <div className="flex w-full flex-col items-start gap-3 rounded-xl border border-default bg-base-background p-4">
        <DrillBreadcrumb
          crumbs={crumbs.map((crumb) => ({ id: crumb.id, label: crumb.label }))}
          onNavigate={(id) => {
            const action = crumbs.find((crumb) => crumb.id === id)?.action;
            if (action) dispatch(action);
          }}
          onUp={() => dispatch({ type: 'up' })}
        />
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Level: {explorerLevel(state)}</span>
          <Button variant="outline" size="sm" onClick={() => dispatch({ type: 'selectEquipment', areaId: 'nk-23', equipmentId: '23-ka-9101' })}>
            Drill to compressor
          </Button>
          <Button variant="outline" size="sm" onClick={() => dispatch({ type: 'selectSensor', sensorId: 'pt-92531' })}>
            Drill to sensor
          </Button>
        </div>
      </div>
    </ThemeScope>
  );
}

function Plant3dPartLegend() {
  return (
    <ThemeScope preset="hologram" className="w-full">
      <div className="flex w-full justify-center rounded-xl border border-default bg-base-background p-4">
        <SceneLegend
          orientation="vertical"
          items={[
            { kind: 'status', label: 'Tripped or critical alarm', tone: 'critical' },
            { kind: 'status', label: 'Warning or maintenance', tone: 'warning' },
            { kind: 'status', label: 'Advisory alarm', tone: 'info' },
            { kind: 'status', label: 'Standby or stopped', tone: 'neutral' },
            { kind: 'area', label: 'Area boundary' },
            { kind: 'selection', label: 'Selected unit' },
            { kind: 'flow', label: 'Flow direction' },
          ]}
        />
      </div>
    </ThemeScope>
  );
}

function Plant3dPartHud() {
  return (
    <ThemeScope preset="hologram" className="w-full">
      <div className="flex h-[37rem] w-full justify-center rounded-xl border border-default bg-base-background bg-[radial-gradient(ellipse_at_50%_40%,color-mix(in_oklab,var(--primary-background)_18%,transparent),transparent_70%)] p-4">
        <div className="flex max-h-full min-h-0 w-64 flex-col gap-3 self-start">
          <Plant3dPlantHud />
        </div>
      </div>
    </ThemeScope>
  );
}

function Plant3dPartInspector() {
  const [sensorId, setSensorId] = useState<string | null>(null);
  const asset = findAsset('23-ka-9101');
  const sensor = PLANT3D_SENSORS.find((candidate) => candidate.id === sensorId);
  if (!asset) return null;

  return (
    <ThemeScope preset="hologram" className="w-full">
      <div className="flex h-[37rem] w-full justify-center rounded-xl border border-default bg-base-background bg-[radial-gradient(ellipse_at_50%_40%,color-mix(in_oklab,var(--primary-background)_18%,transparent),transparent_70%)] p-4">
        <HudPanel title={sensor ? 'Sensor' : 'Equipment'} className="w-80 self-start max-h-full">
          {sensor ? <Plant3dSensorInspector sensor={sensor} onBack={() => setSensorId(null)} /> : <Plant3dEquipmentInspector asset={asset} onSelectSensor={setSensorId} />}
        </HudPanel>
      </div>
    </ThemeScope>
  );
}

function Plant3dPartFallback() {
  return (
    <ThemeScope preset="hologram" className="w-full">
      <div className="h-80 w-full overflow-hidden rounded-xl border border-default">
        <SceneCanvas label="3D model of the Nordkapp gas plant" forceFallback fallback={<Plant3dFallbackList />}>
          <PlantScene layout={PLANT3D_LAYOUT} />
        </SceneCanvas>
      </div>
    </ThemeScope>
  );
}

export default definePage({
  id: 'plant-3d-explorer',
  title: '3D plant explorer',
  summary:
    'A gas plant you can fly through: start above the whole site, fly into an area, frame one machine and end on a single transmitter. Each altitude shows what matters there, and the panels around the scene always say where you are.',
  guidance: {
    use: [
      'When location is part of the question: where the trip is, what stands next to it, which line feeds it.',
      'As a way into detail screens: the scene finds the machine, the inspector shows its numbers.',
      'With a keyboard path beside the canvas: area buttons, the unit list and the breadcrumb reach every level.',
      'Keep machines neutral and let rings, labels and panels carry state.',
    ],
    avoid: [
      'Replacing a table or trend with 3D. Numbers still belong in the panels.',
      'Colouring whole machines by status: it hides shape and fails without colour vision.',
      'Labels on everything at once. Show areas from afar and units only inside the area in focus.',
      'Motion that never stops. Flights, pulses and flames hold still under reduced motion.',
    ],
  },
  source,
  sections: [
    {
      id: 'experience',
      title: 'Experience',
      description:
        'Drag to orbit, scroll to zoom, right-drag to pan. Click an area to fly in, a unit to inspect it, and a reading to find its transmitter on the machine. Escape or the arrow goes up one level.',
      specimens: [
        {
          id: 'Plant3dExplorerHologram',
          title: '3D plant explorer',
          note: 'Pick it when people need to get from the state of the whole plant to one reading without losing their bearings.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'three/SceneCanvas.tsx',
            'three/PlantScene.tsx',
            'three/plantLayout.ts',
            'three/explorerState.ts',
            'three/DrillBreadcrumb.tsx',
            'three/HudPanel.tsx',
            'three/SceneLegend.tsx',
            'industrial/ValueReadout.tsx',
            'industrial/StatusIndicator.tsx',
            'industrial/RadialGauge.tsx',
            'industrial/Sparkline.tsx',
            'industrial/charts/TrendChart.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: Plant3dExplorerHologram,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same explorer in three more presets, each opened at a different depth. Scene colours are resolved from tokens, so the plant follows the theme.',
      specimens: [
        {
          id: 'Plant3dExplorerTron',
          title: 'Tron, at area level',
          note: 'Pick it for a command-centre wall: cyan lines, sharp corners and monospaced type.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['three/SceneCanvas.tsx', 'three/PlantScene.tsx', 'three/useTokenColors.ts', 'themes/ThemeScope.tsx'],
          Component: Plant3dExplorerTron,
        },
        {
          id: 'Plant3dExplorerAuraDark',
          title: 'Aura dark, at equipment level',
          note: 'Pick it inside a standard dark Aura app, where the scene should not out-shout the product around it.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['three/SceneCanvas.tsx', 'three/PlantScene.tsx', 'three/useTokenColors.ts', 'themes/ThemeScope.tsx'],
          Component: Plant3dExplorerAuraDark,
        },
        {
          id: 'Plant3dExplorerBlueprint',
          title: 'Blueprint, in a light theme',
          note: 'Pick it for engineering tools used in daylight: a pale plot plan with dark steel and blue accents.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['three/SceneCanvas.tsx', 'three/PlantScene.tsx', 'three/useTokenColors.ts', 'themes/ThemeScope.tsx'],
          Component: Plant3dExplorerBlueprint,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The pieces on their own: equipment models on a turntable you can drag, and the panels that sit over the scene.',
      specimens: [
        {
          id: 'Plant3dPartVessel',
          title: 'Horizontal vessel',
          note: 'Pick it for separators, drums and scrubbers that lie on saddles.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/HorizontalVessel.tsx', 'three/TurntableStage.tsx', 'three/SceneCanvas.tsx'],
          Component: Plant3dPartVessel,
        },
        {
          id: 'Plant3dPartCompressor',
          title: 'Compressor skid, tripped',
          note: 'Pick the status ring to show an abnormal state while the machine itself stays steel.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/CompressorSkid.tsx', 'three/StatusBeacon.tsx', 'three/TurntableStage.tsx', 'three/SceneCanvas.tsx'],
          Component: Plant3dPartCompressor,
        },
        {
          id: 'Plant3dPartFlare',
          title: 'Flare stack',
          note: 'Pick it as the landmark of a plant scene; the flame holds still under reduced motion.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/FlareStack.tsx', 'three/TurntableStage.tsx', 'three/SceneCanvas.tsx'],
          Component: Plant3dPartFlare,
        },
        {
          id: 'Plant3dPartTank',
          title: 'Storage tank with level',
          note: 'Pick it when how full a tank is should be readable from the model itself.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['three/StorageTank.tsx', 'three/TurntableStage.tsx', 'three/SceneCanvas.tsx', 'industrial/ValueReadout.tsx'],
          Component: Plant3dPartTank,
        },
        {
          id: 'Plant3dPartViewSwitch',
          title: 'View switch',
          note: 'Pick it to offer fixed camera presets next to free orbiting: perspective, plan and isometric.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['three/cameraTargets.ts', 'three/CameraRig.tsx', 'three/TurntableStage.tsx', 'three/CompressorSkid.tsx'],
          Component: Plant3dPartViewSwitch,
        },
        {
          id: 'Plant3dPartBreadcrumb',
          title: 'Drill-down breadcrumb',
          note: 'Pick it for any drill-down: it shows every level above and makes going up one click.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['three/DrillBreadcrumb.tsx', 'three/explorerState.ts'],
          Component: Plant3dPartBreadcrumb,
        },
        {
          id: 'Plant3dPartLegend',
          title: 'Scene legend',
          note: 'Pick it whenever a scene encodes state: marks in 3D have no tooltip to explain them.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/SceneLegend.tsx'],
          Component: Plant3dPartLegend,
        },
        {
          id: 'Plant3dPartHud',
          title: 'Plant HUD',
          note: 'Pick glass panels for figures that float over a scene and must not hide it completely.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['three/HudPanel.tsx', 'industrial/ValueReadout.tsx', 'industrial/TrendDelta.tsx', 'industrial/StatusIndicator.tsx'],
          Component: Plant3dPartHud,
        },
        {
          id: 'Plant3dPartInspector',
          title: 'Equipment inspector',
          note: 'Pick it as the detail side of a scene: state, readings you can open, alarms, work orders and actions.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['three/HudPanel.tsx', 'industrial/RadialGauge.tsx', 'industrial/Sparkline.tsx', 'industrial/charts/TrendChart.tsx'],
          Component: Plant3dPartInspector,
        },
        {
          id: 'Plant3dPartFallback',
          title: 'Without WebGL',
          note: 'Pick a fallback that lists the same items, so the screen still works where 3D cannot render.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['three/SceneCanvas.tsx', 'three/webgl.ts', 'industrial/StatusIndicator.tsx'],
          Component: Plant3dPartFallback,
        },
      ],
    },
  ],
});
