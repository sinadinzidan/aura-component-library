import { Button } from '@cognite/aura/components/button';
import {
  IconActivity,
  IconAlertTriangle,
  IconArrowsSplit,
  IconComponents,
  IconEngine,
  IconEye,
  IconGauge,
  IconRefresh,
  IconSlice,
  IconStack2,
  IconTool,
} from '@cognite/aura/icons';
import { useThree } from '@react-three/fiber';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { IconChip } from '../../../library/kit/IconChip';
import { Meter } from '../../../library/kit/Meter';
import { Panel } from '../../../library/kit/Panel';
import { ScenePin } from '../../../library/kit/scene/ScenePin';
import { SceneStage } from '../../../library/kit/scene/SceneStage';
import { ToggleChip } from '../../../library/kit/scene/ToggleChip';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import { formatNumber, type StatusTone } from '../../../library/kit/tones';
import { TrendArea } from '../../../library/kit/TrendArea';
import type { TrendLimit } from '../../../library/kit/TrendLine';
import { LookScope } from '../../../library/looks/LookScope';
import { CameraRig } from '../../../library/three/CameraRig';
import { addVec3, boundsCenter, boundsRadius, distanceToFit, normalizeVec3, scaleVec3 } from '../../../library/three/cameraTargets';
import type { Bounds, CameraTarget, Vec3 } from '../../../library/three/cameraTargets';
import { Ground } from '../../../library/three/Ground';
import { assemblyLeafIds, findAssembly } from '../../../library/three/models/assemblyTree';
import { BarrelCasing } from '../../../library/three/models/BarrelCasing';
import { BearingHousing } from '../../../library/three/models/BearingHousing';
import { CompressorTrain } from '../../../library/three/models/CompressorTrain';
import {
  COMPRESSOR_TRAIN_BOUNDS,
  COMPRESSOR_TRAIN_EXPLODE,
  COMPRESSOR_TRAIN_TREE,
  TRAIN_ASSEMBLY_IDS,
  TRAIN_MEASUREMENT_POINTS,
} from '../../../library/three/models/compressorTrainLayout';
import type { TrainMeasurementPoint } from '../../../library/three/models/compressorTrainLayout';
import { explodeOffset, explodedBounds } from '../../../library/three/models/explodeOffsets';
import { RotorBundle } from '../../../library/three/models/RotorBundle';
import { StillScene } from '../../../library/three/models/StillScene';
import { SceneCanvas } from '../../../library/three/SceneCanvas';
import { SceneLights } from '../../../library/three/SceneLights';
import { TurntableStage } from '../../../library/three/TurntableStage';
import { ViewInsets } from '../../../library/three/ViewInsets';
import { ALARMS, SENSORS, findAsset } from '../../data/plant';
import type { Alarm, Sensor } from '../../data/plant';
import { MINUTE, REFERENCE_NOW, formatAgo, formatTime, makeSeries } from '../../data/series';
import { definePage } from '../../types';

import source from './compressor-digital-twin.tsx?raw';

const CTWIN_ASSET_ID = '23-ka-9101';

/** The lube oil header has no tag in the shared plant data; this one follows the same tag style. */
const CTWIN_LUBE_OIL: Sensor = {
  id: 'pt-92560',
  tag: '23-PT-92560',
  name: 'Lube oil pressure',
  assetId: CTWIN_ASSET_ID,
  unit: 'barg',
  value: 2.4,
  lowLimit: 1.8,
  highLimit: 3.2,
  rangeMin: 0,
  rangeMax: 4,
  decimals: 1,
  quality: 'good',
  seed: 71,
};

type CtwinLayerId = 'drive-train' | 'compressor' | 'auxiliaries' | 'structure';

type CtwinLayers = Record<CtwinLayerId, boolean>;

const CTWIN_LAYERS: readonly { id: CtwinLayerId; label: string; icon: ReactNode }[] = [
  { id: 'drive-train', label: 'Drive train', icon: <IconEngine /> },
  { id: 'compressor', label: 'Compressor', icon: <IconComponents /> },
  { id: 'auxiliaries', label: 'Auxiliaries', icon: <IconTool /> },
  { id: 'structure', label: 'Structure', icon: <IconStack2 /> },
];

const CTWIN_ALL_LAYERS: CtwinLayers = { 'drive-train': true, compressor: true, auxiliaries: true, structure: true };

type CtwinReading = {
  sensor: Sensor;
  point: TrainMeasurementPoint;
  /** Where the instrument is mounted, in words. */
  where: string;
  /** Where the pinned card sits relative to its point, in px. */
  offset: readonly [number, number];
  tone: StatusTone;
  /** The judgement in a word. */
  state: string;
  alarm?: Alarm;
};

const CTWIN_POINTS: readonly { sensorId: string; point: TrainMeasurementPoint; where: string; offset: readonly [number, number] }[] = [
  { sensorId: 'pt-92530', point: TRAIN_MEASUREMENT_POINTS.suctionPressure, where: 'Suction nozzle, flange tapping', offset: [-56, -84] },
  { sensorId: 'pt-92531', point: TRAIN_MEASUREMENT_POINTS.dischargePressure, where: 'Discharge nozzle, flange tapping', offset: [36, -96] },
  { sensorId: 'tt-92532', point: TRAIN_MEASUREMENT_POINTS.dischargeTemperature, where: 'Discharge nozzle, thermowell', offset: [-84, 76] },
  { sensorId: 'vt-92540', point: TRAIN_MEASUREMENT_POINTS.driveEndVibration, where: 'Drive-end bearing housing, radial probe', offset: [-20, 150] },
  { sensorId: 'st-92501', point: TRAIN_MEASUREMENT_POINTS.shaftSpeed, where: 'Coupling guard, keyphasor', offset: [84, -70] },
  { sensorId: 'pt-92560', point: TRAIN_MEASUREMENT_POINTS.lubeOilPressure, where: 'Lube oil supply header', offset: [56, 64] },
];

function ctwinReading(entry: (typeof CTWIN_POINTS)[number]): CtwinReading[] {
  const sensor = [...SENSORS, CTWIN_LUBE_OIL].find((candidate) => candidate.id === entry.sensorId);
  if (!sensor) return [];
  const alarm = ALARMS.find((candidate) => candidate.sensorTag === sensor.tag && (candidate.state === 'active' || candidate.state === 'acknowledged'));
  const overTrip = sensor.highHighLimit !== undefined && sensor.value >= sensor.highHighLimit;
  const tone: StatusTone = overTrip ? 'critical' : alarm || sensor.value >= sensor.highLimit ? 'warning' : 'neutral';
  const state = overTrip ? 'Trip limit' : alarm ? (alarm.state === 'active' ? 'In alarm' : 'Near limit') : 'Normal';
  return [{ sensor, point: entry.point, where: entry.where, offset: entry.offset, tone, state, alarm }];
}

const CTWIN_READINGS: readonly CtwinReading[] = CTWIN_POINTS.flatMap(ctwinReading);

function ctwinValue(sensor: Sensor): string {
  return formatNumber(sensor.value, sensor.decimals);
}

/** Last 24 hours for a tag, ending exactly on its current value. */
function ctwinTrend(sensor: Sensor): { values: number[]; labels: string[] } {
  const span = sensor.highLimit - sensor.lowLimit;
  const raw = makeSeries({ seed: sensor.seed, points: 49, base: sensor.value, amplitude: span * 0.05, noise: span * 0.025, cycles: 1.5, stepMs: 30 * MINUTE, decimals: sensor.decimals + 1 });
  const shift = sensor.value - raw[raw.length - 1].v;
  const factor = 10 ** sensor.decimals;
  return {
    values: raw.map((point) => Math.round(Math.min(sensor.rangeMax, Math.max(sensor.rangeMin, point.v + shift)) * factor) / factor),
    labels: raw.map((_, index) => formatTime(REFERENCE_NOW - (raw.length - 1 - index) * 30 * MINUTE)),
  };
}

function ctwinLimits(sensor: Sensor): TrendLimit[] {
  const limits: TrendLimit[] = [{ value: sensor.highLimit, label: 'High', tone: 'warning' }];
  if (sensor.highHighLimit !== undefined && sensor.highHighLimit - sensor.value < (sensor.highLimit - sensor.lowLimit) * 0.6) {
    limits.push({ value: sensor.highHighLimit, label: 'Trip', tone: 'critical' });
  }
  return limits;
}

/** The sub-assemblies that stay solid for a set of layers; `null` when nothing is hidden. */
function ctwinActiveIds(layers: CtwinLayers): string[] | null {
  if (CTWIN_LAYERS.every((layer) => layers[layer.id])) return null;
  return CTWIN_LAYERS.filter((layer) => layers[layer.id]).flatMap((layer) => assemblyLeafIds(COMPRESSOR_TRAIN_TREE, layer.id));
}

function ctwinPartCount(layerId: CtwinLayerId): number {
  return assemblyLeafIds(COMPRESSOR_TRAIN_TREE, layerId).length;
}

/** From the front and a little towards the driver, so the shaft runs across the screen. */
const CTWIN_VIEW_DIRECTION: Vec3 = [0.3, 0.46, 0.84];

function ctwinCamera(bounds: Bounds, zoom: number, aspect: number): CameraTarget {
  const lookAt = boundsCenter(bounds);
  const distance = distanceToFit(boundsRadius(bounds), 40, aspect) * zoom;
  return { position: addVec3(lookAt, scaleVec3(normalizeVec3(CTWIN_VIEW_DIRECTION), distance)), lookAt };
}

/** Frames the train for the shape of the canvas it is in, so a narrow stage pulls the camera back instead of cropping the machine. */
function CtwinCameraRig({ bounds, zoom }: { bounds: Bounds; zoom: number }) {
  const size = useThree((state) => state.size);
  const aspect = size.height > 0 ? Math.round(Math.min(1.1, Math.max(0.5, size.width / size.height)) * 20) / 20 : 1;
  // The pinned readouts need room beside the machine, and a tall stage has less of it.
  const margin = 1 + Math.max(0, 1 - aspect) * 0.8;

  return <CameraRig target={ctwinCamera(bounds, zoom * margin, aspect)} minDistance={5} maxDistance={90} />;
}

type CtwinView = { layers: CtwinLayers; readouts: boolean; sectionCut: boolean; exploded: boolean; sensorId: string };

const CTWIN_INITIAL: CtwinView = { layers: CTWIN_ALL_LAYERS, readouts: true, sectionCut: false, exploded: false, sensorId: 'tt-92532' };

type CtwinSceneProps = {
  view: CtwinView;
  onSelectSensor: (sensorId: string) => void;
  /** Pixels the overlays cover on each edge, so the machine is framed in the free part. */
  insets?: { top?: number; right?: number; bottom?: number; left?: number };
  zoom?: number;
  still?: boolean;
};

function CtwinScene({ view, onSelectSensor, insets = {}, zoom = 0.92, still = false }: CtwinSceneProps) {
  const amount = view.exploded ? 0.85 : 0;
  const activeIds = ctwinActiveIds(view.layers);
  const bounds = explodedBounds(COMPRESSOR_TRAIN_BOUNDS, COMPRESSOR_TRAIN_EXPLODE, amount);
  const shown = TRAIN_ASSEMBLY_IDS.length - (activeIds ? TRAIN_ASSEMBLY_IDS.length - activeIds.length : 0);

  return (
    <SceneCanvas
      label={`3D model of compressor train 23-KA-9101, ${view.exploded ? 'exploded along the shaft' : 'assembled'}${view.sectionCut ? ', casing sectioned' : ''}, ${shown} of ${TRAIN_ASSEMBLY_IDS.length} sub-assemblies solid, with ${CTWIN_READINGS.length} live readouts pinned to their measurement points`}
      fallback={<CtwinFallbackList />}
    >
      <StillScene still={still}>
        <SceneLights />
        {bounds ? <CtwinCameraRig bounds={bounds} zoom={zoom} /> : null}
        <ViewInsets top={insets.top ?? 0} right={insets.right ?? 0} bottom={insets.bottom ?? 0} left={insets.left ?? 0} />
        <Ground size={[56, 32]} cell={2} majorEvery={4} center={[1, 0]} />
        <CompressorTrain explode={amount} sectionCut={view.sectionCut} activeIds={activeIds} />
        {view.readouts
          ? CTWIN_READINGS.map((reading) => (
              <ScenePin
                key={reading.sensor.id}
                position={addVec3(reading.point.position, explodeOffset(COMPRESSOR_TRAIN_EXPLODE[reading.point.assemblyId], amount))}
                label={reading.sensor.name}
                value={ctwinValue(reading.sensor)}
                unit={reading.sensor.unit}
                state={reading.tone === 'neutral' ? undefined : reading.state}
                tone={reading.tone}
                offset={reading.offset}
                selected={reading.sensor.id === view.sensorId}
                dimmed={activeIds !== null && !activeIds.includes(reading.point.assemblyId)}
                onSelect={() => onSelectSensor(reading.sensor.id)}
              />
            ))
          : null}
      </StillScene>
    </SceneCanvas>
  );
}

function CtwinFallbackList() {
  return (
    <ul className="flex flex-col gap-2 rounded-xl border border-default bg-card-background p-4">
      {CTWIN_READINGS.map((reading) => (
        <li key={reading.sensor.id} className="flex items-baseline justify-between gap-4 text-sm">
          <span className="text-base-foreground">{reading.sensor.name}</span>
          <span className="font-medium tabular-nums text-base-foreground">
            {ctwinValue(reading.sensor)} {reading.sensor.unit}
          </span>
        </li>
      ))}
    </ul>
  );
}

function CtwinTitle() {
  const asset = findAsset(CTWIN_ASSET_ID);
  return (
    <div className="pointer-events-auto flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <IconChip tone="accent" size="lg">
          <IconEngine />
        </IconChip>
        <div className="flex flex-col">
          <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--kit-text)]">{asset?.name ?? 'Compressor'}</h2>
          <p className="text-sm text-[color:var(--kit-text-2)]">
            <TagId>{asset?.tag ?? '23-KA-9101'}</TagId> · Digital twin · live 14:00 UTC
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill tone="success" icon={<IconActivity />}>
          Running
        </StatusPill>
        <StatusPill tone="warning" icon={<IconAlertTriangle />}>
          Health {asset?.healthScore ?? 72} · watch
        </StatusPill>
      </div>
    </div>
  );
}

type CtwinDockProps = {
  view: CtwinView;
  onChange: (view: CtwinView) => void;
};

/** The floating layer dock: which assemblies stay solid, and how the machine is opened up. */
function CtwinDock({ view, onChange }: CtwinDockProps) {
  return (
    <div
      role="group"
      aria-label="Scene layers"
      className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-2 rounded-[var(--kit-radius)] border border-[color:var(--kit-rule)] bg-[color-mix(in_oklab,var(--card-background)_72%,transparent)] p-2 shadow-[0_18px_40px_-20px_var(--opacity-black-60)] backdrop-blur-xl"
    >
      {CTWIN_LAYERS.map((layer) => (
        <ToggleChip
          key={layer.id}
          icon={layer.icon}
          count={String(ctwinPartCount(layer.id))}
          pressed={view.layers[layer.id]}
          onPressedChange={(pressed) => onChange({ ...view, layers: { ...view.layers, [layer.id]: pressed } })}
        >
          {layer.label}
        </ToggleChip>
      ))}
      <span aria-hidden="true" className="basis-full" />
      <ToggleChip tone="teal" icon={<IconEye />} pressed={view.readouts} onPressedChange={(readouts) => onChange({ ...view, readouts })}>
        Readouts
      </ToggleChip>
      <ToggleChip tone="purple" icon={<IconSlice />} pressed={view.sectionCut} onPressedChange={(sectionCut) => onChange({ ...view, sectionCut })}>
        Section cut
      </ToggleChip>
      <ToggleChip tone="purple" icon={<IconArrowsSplit />} pressed={view.exploded} onPressedChange={(exploded) => onChange({ ...view, exploded })}>
        Exploded
      </ToggleChip>
    </div>
  );
}

function CtwinStateIcon({ tone }: { tone: StatusTone }) {
  return tone === 'neutral' ? <IconActivity /> : <IconAlertTriangle />;
}

/** The selected readout in full: figure, state, position in its band, 24-hour trend and mounting. */
function CtwinInspector({ reading, trendHeight = 170, className }: { reading: CtwinReading; trendHeight?: number; className?: string }) {
  const { sensor } = reading;
  const trend = ctwinTrend(sensor);
  const tone = reading.tone === 'neutral' ? 'accent' : reading.tone;

  return (
    <Panel
      className={className}
      title={sensor.name}
      subtitle={`${sensor.tag} · ${reading.where}`}
      tone={reading.tone === 'neutral' ? 'neutral' : reading.tone}
      icon={
        <IconChip tone={tone}>
          <IconGauge />
        </IconChip>
      }
    >
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <p className="flex items-baseline gap-2">
            <span className="text-5xl font-semibold tracking-tight tabular-nums text-[color:var(--kit-text)]">{ctwinValue(sensor)}</span>
            <span className="text-base text-[color:var(--kit-text-2)]">{sensor.unit}</span>
          </p>
          <StatusPill tone={reading.tone === 'neutral' ? 'success' : reading.tone} icon={<CtwinStateIcon tone={reading.tone} />}>
            {reading.state}
          </StatusPill>
        </div>
        {reading.alarm ? (
          <p className="text-sm text-[color:var(--kit-text-2)]">
            {reading.alarm.message}: peaked at <span className="font-medium tabular-nums text-[color:var(--kit-text)]">{reading.alarm.value}</span> against a limit of{' '}
            <span className="tabular-nums">{reading.alarm.limit}</span>, {formatAgo(reading.alarm.raisedAt)}.
          </p>
        ) : (
          <p className="text-sm text-[color:var(--kit-text-2)]">
            Inside its operating band of {formatNumber(sensor.lowLimit, sensor.decimals)} to {formatNumber(sensor.highLimit, sensor.decimals)} {sensor.unit} for the last 24 hours.
          </p>
        )}
        <Meter
          label="Position in operating range"
          value={sensor.value}
          min={sensor.rangeMin}
          max={sensor.rangeMax}
          unit={sensor.unit}
          decimals={sensor.decimals}
          high={sensor.highLimit}
          low={sensor.lowLimit > sensor.rangeMin ? sensor.lowLimit : undefined}
          target={{ value: sensor.highLimit, label: 'High limit' }}
          tone={tone}
        />
        <TrendArea
          label={`${sensor.name} over the last 24 hours, now ${ctwinValue(sensor)} ${sensor.unit}`}
          labels={trend.labels}
          series={[{ id: sensor.id, label: 'Last 24 h', values: trend.values, tone }]}
          limits={ctwinLimits(sensor)}
          unit={sensor.unit}
          decimals={sensor.decimals}
          height={trendHeight}
          showLegend={false}
        />
      </div>
    </Panel>
  );
}

/** The same readouts as the pins, as buttons: the keyboard path into the scene. */
function CtwinReadoutList({ selectedId, onSelect, columns = 2 }: { selectedId: string; onSelect: (sensorId: string) => void; columns?: 1 | 2 }) {
  return (
    <ul aria-label="Live readouts" className={`grid gap-2 ${columns === 2 ? 'grid-cols-2' : 'flex-1 grid-cols-1'}`}>
      {CTWIN_READINGS.map((reading) => {
        const selected = reading.sensor.id === selectedId;
        const abnormal = reading.tone !== 'neutral';
        return (
          <li key={reading.sensor.id} className="min-w-0">
            <button
              type="button"
              data-tone={reading.tone}
              aria-pressed={selected}
              onClick={() => onSelect(reading.sensor.id)}
              className="flex h-full w-full flex-col gap-0.5 rounded-[var(--kit-radius-sm)] border border-[color:var(--kit-rule)] bg-[var(--kit-well)] px-3 py-2 text-left hover:border-[color:var(--kit-rule-strong)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring-default)] aria-pressed:border-[var(--primary-background)] aria-pressed:bg-[color-mix(in_oklab,var(--primary-background)_16%,transparent)]"
            >
              <span className="truncate text-xs font-medium text-[color:var(--kit-text-2)]">{reading.sensor.name}</span>
              <span className="flex items-baseline gap-1">
                <span className={`text-lg font-semibold tabular-nums ${abnormal ? 'text-[color:var(--t-line)]' : 'text-[color:var(--kit-text)]'}`}>{ctwinValue(reading.sensor)}</span>
                <span className="text-xs text-[color:var(--kit-text-3)]">{reading.sensor.unit}</span>
              </span>
              <span className={`text-xs font-medium ${abnormal ? 'text-[color:var(--t-line)]' : 'text-[color:var(--kit-text-3)]'}`}>
                {reading.state}
                {columns === 1 ? <span className="font-normal text-[color:var(--kit-text-3)]"> · {reading.sensor.tag} · {reading.where}</span> : null}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function ctwinReadingFor(sensorId: string): CtwinReading {
  return CTWIN_READINGS.find((reading) => reading.sensor.id === sensorId) ?? CTWIN_READINGS[0];
}

function CtwinStageFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-[var(--kit-radius)] border border-[color:var(--kit-rule)] bg-[var(--kit-surface)] shadow-[var(--kit-panel-shadow)] ${className}`}>{children}</div>
  );
}

function CtwinTwin({ initial = CTWIN_INITIAL, still = false }: { initial?: CtwinView; still?: boolean }) {
  const [view, setView] = useState<CtwinView>(initial);
  const reading = ctwinReadingFor(view.sensorId);
  const hidden = CTWIN_LAYERS.filter((layer) => !view.layers[layer.id]).length;

  return (
    <LookScope look="glass">
      <Canvas className="h-[52rem]">
        <div className="grid h-full grid-cols-[minmax(0,1fr)_22rem] gap-[var(--kit-gap)]">
          <CtwinStageFrame className="h-full">
            <SceneStage
              className="h-full"
              onEscape={() => setView({ ...view, layers: CTWIN_ALL_LAYERS, sectionCut: false, exploded: false })}
              overlay={
                <div className="flex h-full flex-col justify-between p-5">
                  <div className="flex items-start justify-between gap-4">
                    <CtwinTitle />
                    <div className="pointer-events-auto flex flex-col items-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setView({ ...CTWIN_INITIAL, sensorId: view.sensorId })}>
                        <IconRefresh /> Reset view
                      </Button>
                      <p className="text-right text-xs text-[color:var(--kit-text-2)]">
                        {hidden === 0 ? 'All 11 sub-assemblies solid' : `${hidden} of 4 layers ghosted`}
                        <br />
                        Drag to orbit · scroll to zoom
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <CtwinDock view={view} onChange={setView} />
                  </div>
                </div>
              }
            >
              <CtwinScene view={view} onSelectSensor={(sensorId) => setView({ ...view, sensorId })} insets={{ top: 100, bottom: 110, left: 96 }} still={still} />
            </SceneStage>
          </CtwinStageFrame>

          <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-[var(--kit-gap)]">
            <CtwinInspector key={reading.sensor.id} reading={reading} />
            <Panel title="Live readouts" subtitle="The same six points as the pins" padding="tight">
              <CtwinReadoutList selectedId={view.sensorId} onSelect={(sensorId) => setView({ ...view, sensorId })} />
            </Panel>
          </div>
        </div>
      </Canvas>
    </LookScope>
  );
}

function CompressorTwinSignature() {
  return <CtwinTwin />;
}

type CtwinTravelRow = { id: string; name: string; axis: string; travel: number; from: string };

const CTWIN_TRAVEL: readonly CtwinTravelRow[] = TRAIN_ASSEMBLY_IDS.filter((id) => COMPRESSOR_TRAIN_EXPLODE[id].distance > 0).map((id) => {
  const spec = COMPRESSOR_TRAIN_EXPLODE[id];
  const axis = spec.direction[0] !== 0 ? 'Along the shaft' : spec.direction[1] !== 0 ? 'Down' : 'Sideways';
  return { id, name: findAssembly(COMPRESSOR_TRAIN_TREE, id)?.name ?? id, axis, travel: spec.distance, from: spec.start ? 'after the bearing' : '' };
});

const CTWIN_TRAVEL_COLUMNS: readonly DataTableColumn<CtwinTravelRow>[] = [
  { id: 'name', header: 'Sub-assembly', cell: (row) => <span className="font-medium">{row.name}</span>, nowrap: true },
  { id: 'axis', header: 'Pulls', cell: (row) => (row.from ? `${row.axis}, ${row.from}` : row.axis), muted: true },
  { id: 'travel', header: 'Clearance', cell: (row) => `${formatNumber(row.travel, 1)} m`, numeric: true, nowrap: true },
];

/** A second screen of the same twin: the machine opened for a bundle pull, with the lift plan. */
function CompressorTwinService() {
  const [view, setView] = useState<CtwinView>({ layers: { ...CTWIN_ALL_LAYERS, auxiliaries: false, structure: false }, readouts: false, sectionCut: true, exploded: true, sensorId: 'vt-92540' });

  return (
    <LookScope look="glass">
      <Canvas className="h-[49rem]">
        <div className="grid h-full grid-cols-[25rem_minmax(0,1fr)] gap-[var(--kit-gap)]">
          <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-[var(--kit-gap)]">
            <Panel
              title="Bundle pull, planned"
              subtitle="Work order WO-104482 · window 16–18 March"
              tone="accent"
              icon={
                <IconChip tone="accent">
                  <IconTool />
                </IconChip>
              }
            >
              <p className="text-sm text-[color:var(--kit-text-2)]">
                The rotor leaves through the non-drive end once that bearing has cleared the shaft. Auxiliaries and the base frame stay in place and are ghosted here.
              </p>
              <dl className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { label: 'Heaviest lift', value: '4.2', unit: 't' },
                  { label: 'Laydown', value: '6.3', unit: 'm' },
                  { label: 'Parts out', value: '6', unit: 'of 11' },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col">
                    <dt className="text-xs text-[color:var(--kit-text-3)]">{item.label}</dt>
                    <dd className="flex items-baseline gap-1">
                      <span className="text-2xl font-semibold tabular-nums text-[color:var(--kit-text)]">{item.value}</span>
                      <span className="text-xs text-[color:var(--kit-text-2)]">{item.unit}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </Panel>
            <Panel title="Pull sequence" subtitle="Clearance each part needs" padding="none">
              <DataTable label="Clearance each sub-assembly needs when the train is opened" columns={CTWIN_TRAVEL_COLUMNS} rows={CTWIN_TRAVEL} rowKey={(row) => row.id} density="compact" flush />
            </Panel>
          </div>
          <CtwinStageFrame className="h-full">
            <SceneStage
              className="h-full"
              overlay={
                <div className="flex h-full flex-col justify-between p-5">
                  <div className="flex items-start justify-between gap-3">
                    <StatusPill tone="info" size="lg" icon={<IconArrowsSplit />}>
                      Exploded · casing sectioned
                    </StatusPill>
                    <p className="text-sm text-[color:var(--kit-text-2)]">
                      <TagId>23-KA-9101</TagId> · service view
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <CtwinDock view={view} onChange={setView} />
                  </div>
                </div>
              }
            >
              <CtwinScene view={view} onSelectSensor={(sensorId) => setView({ ...view, sensorId })} insets={{ top: 60, bottom: 84 }} zoom={0.98} still />
            </SceneStage>
          </CtwinStageFrame>
        </div>
      </Canvas>
    </LookScope>
  );
}

/** The twin on a tablet in the compressor hall: scene on top, the selected readout as a sheet. */
function CompressorTwinTablet() {
  const [view, setView] = useState<CtwinView>({ ...CTWIN_INITIAL, layers: { ...CTWIN_ALL_LAYERS, auxiliaries: false }, sensorId: 'vt-92540' });
  const reading = ctwinReadingFor(view.sensorId);

  return (
    <LookScope look="glass" className="mx-auto w-full max-w-[48rem]">
      <Canvas className="flex h-[70rem] flex-col gap-[var(--kit-gap)]">
        <CtwinStageFrame className="min-h-0 flex-1">
          <SceneStage
            className="h-full"
            overlay={
              <div className="p-4">
                <CtwinTitle />
              </div>
            }
          >
            <CtwinScene view={view} onSelectSensor={(sensorId) => setView({ ...view, sensorId })} insets={{ top: 110, bottom: 40 }} zoom={1.02} still />
          </SceneStage>
        </CtwinStageFrame>
        <div className="flex shrink-0 justify-center">
          <CtwinDock view={view} onChange={setView} />
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-[var(--kit-gap)]">
          <CtwinInspector key={reading.sensor.id} reading={reading} trendHeight={150} />
          <Panel title="Live readouts" padding="tight">
            <CtwinReadoutList selectedId={view.sensorId} onSelect={(sensorId) => setView({ ...view, sensorId })} />
          </Panel>
        </div>
      </Canvas>
    </LookScope>
  );
}

function CtwinPartStage({ label, children, footer }: { label: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <LookScope look="glass" className="w-full">
      <Canvas className="flex h-[28rem] flex-col gap-3">
        <CtwinStageFrame className="min-h-0 flex-1">
          <SceneStage className="h-full">
            <SceneCanvas label={label}>
              <StillScene>{children}</StillScene>
            </SceneCanvas>
          </SceneStage>
        </CtwinStageFrame>
        {footer}
      </Canvas>
    </LookScope>
  );
}

function CompressorTwinPartPin() {
  const [selected, setSelected] = useState('vibration');

  return (
    <CtwinPartStage label="Bearing housing with two pinned readouts, one near its limit">
      <TurntableStage subjectSize={[1.6, 2.6, 1.6]} padding={2.1}>
        <group position={[1.8, -0.6, 0]}>
          <BearingHousing x={-1.8} />
          <ScenePin position={[-1.8, 3.15, 0.25]} label="Drive-end vibration" value="6.8" unit="mm/s" state="Near limit" tone="warning" offset={[40, -44]} selected={selected === 'vibration'} onSelect={() => setSelected('vibration')} />
          <ScenePin position={[-1.8, 1.5, 0.45]} label="Bearing temperature" value="71.4" unit="°C" offset={[-40, 40]} selected={selected === 'temperature'} onSelect={() => setSelected('temperature')} />
        </group>
      </TurntableStage>
    </CtwinPartStage>
  );
}

function CompressorTwinPartDock() {
  const [view, setView] = useState<CtwinView>({ ...CTWIN_INITIAL, layers: { ...CTWIN_ALL_LAYERS, structure: false }, sectionCut: true });
  const active = ctwinActiveIds(view.layers);

  return (
    <LookScope look="glass" className="w-full">
      <Canvas className="flex h-[28rem] flex-col items-center justify-center gap-5">
        <CtwinDock view={view} onChange={setView} />
        <p className="text-sm text-[color:var(--kit-text-2)]">
          {active === null ? 'All 11 sub-assemblies solid' : `${active.length} of 11 sub-assemblies solid, the rest ghosted`}
          {view.sectionCut ? ' · casing sectioned' : ''}
          {view.exploded ? ' · exploded' : ''}
        </p>
      </Canvas>
    </LookScope>
  );
}

function CompressorTwinPartInspector() {
  return (
    <LookScope look="glass" className="w-full">
      <Canvas className="flex h-[36rem] flex-col">
        <CtwinInspector reading={ctwinReadingFor('tt-92532')} />
      </Canvas>
    </LookScope>
  );
}

function CompressorTwinPartReadouts() {
  const [sensorId, setSensorId] = useState('vt-92540');

  return (
    <LookScope look="glass" className="w-full">
      <Canvas className="flex h-[36rem] flex-col">
        <Panel title="Live readouts" subtitle="Updated 14:00 UTC" padding="tight">
          <CtwinReadoutList selectedId={sensorId} onSelect={setSensorId} columns={1} />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function CompressorTwinPartRotor() {
  return (
    <CtwinPartStage label="Compressor rotor with five shrouded impellers and a balance piston">
      <TurntableStage subjectSize={[6.4, 2.2, 2.2]} padding={0.9}>
        <group position={[4.45, -1.2, 0]}>
          <RotorBundle />
        </group>
      </TurntableStage>
    </CtwinPartStage>
  );
}

function CompressorTwinPartSection() {
  const [cut, setCut] = useState(true);

  return (
    <CtwinPartStage
      label={`Barrel casing ${cut ? 'sectioned on its horizontal joint, showing the rotor and diaphragms' : 'closed'}`}
      footer={
        <div className="flex justify-center">
          <ToggleChip tone="purple" icon={<IconSlice />} pressed={cut} onPressedChange={setCut}>
            Section cut
          </ToggleChip>
        </div>
      }
    >
      <TurntableStage subjectSize={[5.2, 4.6, 3.2]} padding={0.9}>
        <group position={[4.5, -0.6, 0]}>
          <BarrelCasing sectionCut={cut} />
          <RotorBundle />
        </group>
      </TurntableStage>
    </CtwinPartStage>
  );
}

function CompressorTwinPartFallback() {
  return (
    <LookScope look="glass" className="w-full">
      <Canvas className="h-[28rem]">
        <CtwinStageFrame className="h-full">
          <SceneCanvas label="3D model of compressor train 23-KA-9101" forceFallback fallback={<CtwinFallbackList />}>
            <CompressorTrain />
          </SceneCanvas>
        </CtwinStageFrame>
      </Canvas>
    </LookScope>
  );
}

export default definePage({
  id: 'compressor-digital-twin',
  title: 'Compressor digital twin',
  summary:
    'One machine as the whole screen: a centrifugal compressor train in 3D with its live readings pinned to the points where they are measured. Layer chips ghost assemblies, cut the casing open or pull the train apart, and picking a readout opens its band and trend beside the scene.',
  guidance: {
    use: [
      'When the question is about one machine: which bearing, which nozzle a reading belongs to.',
      'With readings pinned on the model and the same readings as a list beside it, so the scene is never the only way in.',
      'With layers that combine: ghost what is in the way instead of hiding it, so the machine keeps its shape.',
      'On a dark glass surface for a showpiece or a review screen; steel stays grey and only abnormal readings take colour.',
    ],
    avoid: [
      'A plant overview: use the 3D plant explorer when the location between machines matters.',
      'Opening exploded. Start assembled; exploding and sectioning are for finding a part, then put it back.',
      'Colouring parts by health. State lives on the pinned readouts and in the inspector, always with a word.',
      'More than six or seven pins at once. Past that they hide the machine; group them behind a layer.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description:
        'Drag to orbit, scroll to zoom. The dock at the bottom toggles layers: switch off Auxiliaries or Structure to ghost them, cut the casing or explode the train. Click a pinned readout, or pick it in the list, to open it on the right. Escape puts the machine back together.',
      specimens: [
        {
          id: 'CompressorTwinSignature',
          title: 'Compressor digital twin',
          note: 'Pick it when engineers need to tie a live reading to the exact part of the machine it comes from.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: [
            'kit/scene/SceneStage.tsx',
            'kit/scene/ScenePin.tsx',
            'kit/scene/ToggleChip.tsx',
            'kit/Panel.tsx',
            'kit/Meter.tsx',
            'kit/TrendArea.tsx',
            'kit/StatusPill.tsx',
            'looks/LookScope.tsx',
            'three/models/CompressorTrain.tsx',
            'three/models/compressorTrainLayout.ts',
            'three/models/explodeOffsets.ts',
            'three/SceneCanvas.tsx',
            'three/CameraRig.tsx',
          ],
          Component: CompressorTwinSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Other screens',
      description: 'Two more screens of the same product: the machine opened up for a planned bundle pull, and the twin on a tablet in the compressor hall.',
      specimens: [
        {
          id: 'CompressorTwinService',
          title: 'Service view',
          note: 'Pick it for planning an overhaul: the train exploded and sectioned, with the pull sequence and clearances beside it.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/scene/SceneStage.tsx', 'kit/scene/ToggleChip.tsx', 'kit/DataTable.tsx', 'kit/Panel.tsx', 'three/models/CompressorTrain.tsx', 'three/models/explodeOffsets.ts'],
          Component: CompressorTwinService,
        },
        {
          id: 'CompressorTwinTablet',
          title: 'Tablet, in the hall',
          note: 'Pick it for a technician standing at the machine: scene on top, the selected readout and the list below, the dock wrapped.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['kit/scene/SceneStage.tsx', 'kit/scene/ScenePin.tsx', 'kit/scene/ToggleChip.tsx', 'kit/Panel.tsx', 'kit/TrendArea.tsx', 'three/models/CompressorTrain.tsx'],
          Component: CompressorTwinTablet,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The pieces around and inside the scene, each on its own.',
      specimens: [
        {
          id: 'CompressorTwinPartInspector',
          title: 'Readout inspector',
          note: 'Pick it as the detail side of a pinned readout: figure, state, position in the band and the 24-hour trend with limits.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/Meter.tsx', 'kit/TrendArea.tsx', 'kit/StatusPill.tsx'],
          Component: CompressorTwinPartInspector,
        },
        {
          id: 'CompressorTwinPartReadouts',
          title: 'Readout list',
          note: 'Pick it as the keyboard path into a scene: the same points as the pins, as buttons with value and state.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/TagId.tsx'],
          Component: CompressorTwinPartReadouts,
        },
        {
          id: 'CompressorTwinPartPin',
          title: 'Pinned readout',
          note: 'Pick a pinned readout when a number only makes sense at the place it is measured; an abnormal one takes its status colour and a word.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/scene/ScenePin.tsx', 'kit/scene/SceneStage.tsx', 'three/models/BearingHousing.tsx', 'three/TurntableStage.tsx'],
          Component: CompressorTwinPartPin,
        },
        {
          id: 'CompressorTwinPartDock',
          title: 'Layer dock',
          note: 'Pick toggle chips when layers combine; each shows how many parts it holds and the line under it says what the scene now shows.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/scene/ToggleChip.tsx'],
          Component: CompressorTwinPartDock,
        },
        {
          id: 'CompressorTwinPartRotor',
          title: 'Rotor bundle',
          note: 'Pick it to show what turns inside a casing: shaft, impellers, balance piston and journals.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['three/models/RotorBundle.tsx', 'three/TurntableStage.tsx', 'kit/scene/SceneStage.tsx'],
          Component: CompressorTwinPartRotor,
        },
        {
          id: 'CompressorTwinPartSection',
          title: 'Section cut',
          note: 'Pick it when the internals matter: the casing opens on its joint and the nozzles stay as ghosts.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['three/models/BarrelCasing.tsx', 'three/models/RotorBundle.tsx', 'kit/scene/ToggleChip.tsx'],
          Component: CompressorTwinPartSection,
        },
        {
          id: 'CompressorTwinPartFallback',
          title: 'Without WebGL',
          note: 'Pick a fallback that lists the same readings, so the twin still answers where 3D cannot render.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['three/SceneCanvas.tsx', 'three/webgl.ts'],
          Component: CompressorTwinPartFallback,
        },
      ],
    },
  ],
});
