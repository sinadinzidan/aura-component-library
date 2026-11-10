import { Button } from '@cognite/aura/components/button';
import { Slider } from '@cognite/aura/components/slider';
import { Switch } from '@cognite/aura/components/switch';
import { IconArrowLeft } from '@cognite/aura/icons';
import { useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

import { summarize } from '../../../library/industrial/charts/stats';
import { TrendChart } from '../../../library/industrial/charts/TrendChart';
import type { TrendLimit } from '../../../library/industrial/charts/TrendChart';
import { RangeIndicator } from '../../../library/industrial/RangeIndicator';
import { formatLimit, formatReading, healthStatus, runStateStatus, severityStatus, toneFromLimits } from '../../../library/industrial/status';
import type { Tone } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { CameraRig } from '../../../library/three/CameraRig';
import { addVec3, boundsCenter, boundsRadius, distanceToFit, normalizeVec3, scaleVec3 } from '../../../library/three/cameraTargets';
import type { Bounds, CameraTarget, Vec3 } from '../../../library/three/cameraTargets';
import { Ground } from '../../../library/three/Ground';
import { assemblyLeafIds, findAssembly, isAssemblyActive } from '../../../library/three/models/assemblyTree';
import type { AssemblyNode } from '../../../library/three/models/assemblyTree';
import { BarrelCasing } from '../../../library/three/models/BarrelCasing';
import { BearingHousing } from '../../../library/three/models/BearingHousing';
import { CompressorTrain } from '../../../library/three/models/CompressorTrain';
import type { CompressorTrainHotspot } from '../../../library/three/models/CompressorTrain';
import {
  COMPRESSOR_TRAIN_BOUNDS,
  COMPRESSOR_TRAIN_EXPLODE,
  COMPRESSOR_TRAIN_TREE,
  TRAIN_ASSEMBLY_IDS,
  TRAIN_MEASUREMENT_POINTS,
} from '../../../library/three/models/compressorTrainLayout';
import type { TrainMeasurementPoint } from '../../../library/three/models/compressorTrainLayout';
import { explodeOffset, explodeProgress, explodedBounds } from '../../../library/three/models/explodeOffsets';
import { Hotspot } from '../../../library/three/models/Hotspot';
import { LubeOilSkid } from '../../../library/three/models/LubeOilSkid';
import { RotorBundle } from '../../../library/three/models/RotorBundle';
import { StillScene } from '../../../library/three/models/StillScene';
import { SceneCanvas } from '../../../library/three/SceneCanvas';
import { SceneLights } from '../../../library/three/SceneLights';
import { TurntableStage } from '../../../library/three/TurntableStage';
import { ALARMS, SENSORS, findAsset } from '../../data/plant';
import type { Alarm, Sensor } from '../../data/plant';
import { MINUTE, formatAgo, makeSeries } from '../../data/series';
import type { SeriesPoint } from '../../data/series';
import { definePage } from '../../types';

import source from './compressor-digital-twin.tsx?raw';

const COMPTWIN3D_ASSET_ID = '23-ka-9101';

/** The lube oil header has no tag in the shared plant data; this one follows the same tag style. */
const COMPTWIN3D_LUBE_OIL_SENSOR: Sensor = {
  id: 'pt-92560',
  tag: '23-PT-92560',
  name: 'Lube oil header pressure',
  assetId: COMPTWIN3D_ASSET_ID,
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

/** Which sensor sits at which measurement point, in the order the hotspots are numbered. */
const COMPTWIN3D_POINTS: readonly { sensorId: string; point: TrainMeasurementPoint; where: string }[] = [
  { sensorId: 'vt-92540', point: TRAIN_MEASUREMENT_POINTS.driveEndVibration, where: 'Drive-end bearing housing, radial probe' },
  { sensorId: 'tt-92532', point: TRAIN_MEASUREMENT_POINTS.dischargeTemperature, where: 'Discharge nozzle, thermowell' },
  { sensorId: 'pt-92531', point: TRAIN_MEASUREMENT_POINTS.dischargePressure, where: 'Discharge nozzle flange tapping' },
  { sensorId: 'pt-92530', point: TRAIN_MEASUREMENT_POINTS.suctionPressure, where: 'Suction nozzle flange tapping' },
  { sensorId: 'st-92501', point: TRAIN_MEASUREMENT_POINTS.shaftSpeed, where: 'Coupling guard, keyphasor' },
  { sensorId: 'pt-92560', point: TRAIN_MEASUREMENT_POINTS.lubeOilPressure, where: 'Lube oil supply header' },
];

const COMPTWIN3D_SENSORS: readonly Sensor[] = [...SENSORS, COMPTWIN3D_LUBE_OIL_SENSOR];

type CompTwin3dReading = {
  index: number;
  sensor: Sensor;
  point: TrainMeasurementPoint;
  where: string;
  tone: Tone;
  /** The open alarm on this tag, when there is one. */
  alarm?: Alarm;
};

function compTwin3dReading(entry: (typeof COMPTWIN3D_POINTS)[number], position: number): CompTwin3dReading[] {
  const sensor = COMPTWIN3D_SENSORS.find((candidate) => candidate.id === entry.sensorId);
  if (!sensor) return [];
  const alarm = ALARMS.find((candidate) => candidate.sensorTag === sensor.tag && candidate.state !== 'cleared');
  const limitTone = toneFromLimits(sensor.value, { low: sensor.lowLimit, high: sensor.highLimit, highHigh: sensor.highHighLimit });
  const tone = alarm && limitTone === 'neutral' ? severityStatus(alarm.severity).tone : limitTone;
  return [{ index: position + 1, sensor, point: entry.point, where: entry.where, tone, alarm }];
}

const COMPTWIN3D_READINGS: readonly CompTwin3dReading[] = COMPTWIN3D_POINTS.flatMap(compTwin3dReading);

const COMPTWIN3D_HOTSPOTS: readonly CompressorTrainHotspot[] = COMPTWIN3D_READINGS.map((reading) => ({
  id: reading.sensor.id,
  index: reading.index,
  assemblyId: reading.point.assemblyId,
  position: reading.point.position,
  tag: reading.sensor.tag,
  value: formatReading(reading.sensor.value, reading.sensor.unit, reading.sensor.decimals),
  tone: reading.tone === 'neutral' ? undefined : reading.tone,
  pulse: reading.alarm?.state === 'active',
}));

const COMPTWIN3D_FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring-default)]';

const COMPTWIN3D_ROW = `flex w-full items-center gap-2 rounded-md px-2 py-1 text-left hover:bg-secondary-background aria-pressed:bg-secondary-background ${COMPTWIN3D_FOCUS}`;

/** Last 24 hours for a tag, ending exactly on its current value. */
function compTwin3dTrend(sensor: Sensor): SeriesPoint[] {
  const span = sensor.highLimit - sensor.lowLimit;
  const raw = makeSeries({
    seed: sensor.seed,
    points: 48,
    base: sensor.value,
    amplitude: span * 0.05,
    noise: span * 0.025,
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

function compTwin3dLimits(sensor: Sensor): TrendLimit[] {
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

/** From the front and a little towards the driver, so the shaft runs across the screen. */
const COMPTWIN3D_VIEW_DIRECTION: Vec3 = [0.28, 0.5, 0.82];

/** The camera pose that fits a box into the tall, narrow scene between the two panels. */
function compTwin3dCamera(bounds: Bounds, padding: number): CameraTarget {
  const lookAt = boundsCenter(bounds);
  const distance = distanceToFit(boundsRadius(bounds), 40, 0.95) * padding;
  return { position: addVec3(lookAt, scaleVec3(normalizeVec3(COMPTWIN3D_VIEW_DIRECTION), distance)), lookAt };
}

function compTwin3dAssemblyName(id: string): string {
  return findAssembly(COMPRESSOR_TRAIN_TREE, id)?.name ?? id;
}

function compTwin3dReadingStatus(reading: CompTwin3dReading): { tone: Tone; label: string; shape: 'dot' | 'square' | 'diamond' } {
  if (reading.alarm) {
    const severity = severityStatus(reading.alarm.severity);
    return { tone: reading.tone, shape: severity.shape === 'ring' ? 'dot' : severity.shape, label: reading.alarm.state === 'active' ? 'In alarm' : 'Alarm acknowledged' };
  }
  if (reading.tone !== 'neutral') return { tone: reading.tone, shape: 'square', label: 'Outside limits' };
  return { tone: 'success', shape: 'dot', label: 'Within limits' };
}

function CompTwin3dNumber({ reading, selected = false }: { reading: CompTwin3dReading; selected?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-5 shrink-0 items-center justify-center rounded-full border font-mono text-xs tabular-nums text-base-foreground ${
        selected ? 'border-[var(--primary-background)]' : reading.tone === 'warning' ? 'border-warning-foreground-strong' : reading.tone === 'critical' ? 'border-critical-foreground-strong' : 'border-emphasized'
      }`}
    >
      {reading.index}
    </span>
  );
}

function CompTwin3dPanel({ title, meta, actions, children, className = '' }: { title: string; meta?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section aria-label={title} className={`flex min-h-0 min-w-0 flex-col bg-card-background ${className}`}>
      <header className="flex h-10 shrink-0 items-center gap-2 border-b border-default px-3">
        <h3 className="min-w-0 flex-1 truncate text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</h3>
        {meta ? <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{meta}</span> : null}
        {actions}
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">{children}</div>
    </section>
  );
}

function CompTwin3dTree({
  selectedId,
  onSelect,
  onHover,
}: {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onHover?: (id: string | null) => void;
}) {
  const row = (node: AssemblyNode, nested: boolean) => (
    <button
      type="button"
      aria-pressed={node.id === selectedId}
      onClick={() => onSelect(node.id === selectedId ? null : node.id)}
      onMouseEnter={() => onHover?.(node.id)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(node.id)}
      onBlur={() => onHover?.(null)}
      className={`${COMPTWIN3D_ROW} ${nested ? 'pl-5' : ''}`}
    >
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={`text-sm text-base-foreground ${nested ? '' : 'font-medium'}`}>{node.name}</span>
        {node.detail ? <span className="text-xs text-muted-foreground">{node.detail}</span> : null}
      </span>
      {nested ? (
        <span className="flex shrink-0 gap-1">
          {COMPTWIN3D_READINGS.filter((reading) => reading.point.assemblyId === node.id).map((reading) => (
            <CompTwin3dNumber key={reading.sensor.id} reading={reading} />
          ))}
        </span>
      ) : (
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{assemblyLeafIds(node, node.id).length}</span>
      )}
    </button>
  );

  return (
    <ul aria-label="Assemblies of the compressor train" className="flex flex-col gap-1.5">
      {(COMPRESSOR_TRAIN_TREE.children ?? []).map((group) => (
        <li key={group.id} className="flex flex-col">
          {row(group, false)}
          <ul className="flex flex-col">
            {(group.children ?? []).map((part) => (
              <li key={part.id}>{row(part, true)}</li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function CompTwin3dReadingList({ selectedId, onSelect }: { selectedId?: string | null; onSelect: (sensorId: string) => void }) {
  return (
    <ul aria-label="Measurement points" className="flex flex-col">
      {COMPTWIN3D_READINGS.map((reading) => (
        <li key={reading.sensor.id}>
          <button
            type="button"
            aria-pressed={reading.sensor.id === selectedId}
            aria-label={`Hotspot ${reading.index}, ${reading.sensor.name}, ${formatReading(reading.sensor.value, reading.sensor.unit, reading.sensor.decimals)}, ${compTwin3dReadingStatus(reading).label.toLowerCase()}`}
            onClick={() => onSelect(reading.sensor.id)}
            className={`${COMPTWIN3D_ROW} items-start`}
          >
            <CompTwin3dNumber reading={reading} selected={reading.sensor.id === selectedId} />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-sm text-base-foreground">{reading.sensor.name}</span>
              <span className="font-mono text-xs text-muted-foreground">{reading.sensor.tag}</span>
              {reading.alarm ? <StatusIndicator {...compTwin3dReadingStatus(reading)} size="sm" /> : null}
            </span>
            <ValueReadout value={reading.sensor.value} unit={reading.sensor.unit} decimals={reading.sensor.decimals} size="xs" tone={reading.tone} className="shrink-0 pt-0.5" />
          </button>
        </li>
      ))}
    </ul>
  );
}

function CompTwin3dSensorDetail({ reading, onBack, onShowPart }: { reading: CompTwin3dReading; onBack?: () => void; onShowPart?: (assemblyId: string) => void }) {
  const { sensor } = reading;
  const points = compTwin3dTrend(sensor);
  const stats = summarize(points.map((point) => point.v));
  const status = compTwin3dReadingStatus(reading);

  return (
    <>
      {onBack ? (
        <div>
          <Button variant="ghost" size="sm" onClick={onBack}>
            <IconArrowLeft /> All measurement points
          </Button>
        </div>
      ) : null}
      <div className="flex items-start gap-2">
        <CompTwin3dNumber reading={reading} selected />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-base-foreground">{sensor.name}</p>
          <p className="font-mono text-xs text-muted-foreground">{sensor.tag}</p>
        </div>
      </div>
      <div className="flex items-end justify-between gap-3">
        <ValueReadout value={sensor.value} unit={sensor.unit} decimals={sensor.decimals} size="lg" tone={reading.tone} />
        <StatusIndicator {...status} size="sm" pulse={reading.alarm?.state === 'active'} className="shrink-0 pb-0.5" />
      </div>
      {reading.alarm ? (
        <p className="text-sm text-medium-foreground">
          {reading.alarm.message}: peaked at <span className="tabular-nums">{reading.alarm.value}</span> against a limit of{' '}
          <span className="tabular-nums">{reading.alarm.limit}</span>, {formatAgo(reading.alarm.raisedAt)}.
        </p>
      ) : null}

      <RangeIndicator
        label="Position in operating band"
        value={sensor.value}
        min={sensor.rangeMin}
        max={sensor.rangeMax}
        limits={{ low: sensor.lowLimit > sensor.rangeMin ? sensor.lowLimit : undefined, high: sensor.highLimit, highHigh: sensor.highHighLimit }}
        unit={sensor.unit}
        decimals={sensor.decimals}
        tone={reading.tone}
        showHeader={false}
        className="w-full"
      />

      <TrendChart
        label={`${sensor.name} over the last 24 hours, now ${formatReading(sensor.value, sensor.unit, sensor.decimals)}`}
        series={[{ key: sensor.id, label: sensor.name, points }]}
        limits={compTwin3dLimits(sensor)}
        unit={sensor.unit}
        decimals={sensor.decimals}
        maxTicks={3}
        showLast
        heightClassName="h-40"
        className="w-full"
      />

      {stats ? (
        <dl className="grid grid-cols-3 gap-2">
          {[
            { label: 'Min 24 h', value: stats.min },
            { label: 'Mean 24 h', value: stats.mean },
            { label: 'Max 24 h', value: stats.max },
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

      <dl className="flex flex-col gap-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="shrink-0 text-muted-foreground">Operating band</dt>
          <dd className="text-right tabular-nums text-base-foreground">
            {formatLimit(sensor.lowLimit, sensor.decimals)} to {formatReading(sensor.highLimit, sensor.unit, Number.isInteger(sensor.highLimit) ? 0 : sensor.decimals)}
          </dd>
        </div>
        {sensor.highHighLimit !== undefined ? (
          <div className="flex justify-between gap-3">
            <dt className="shrink-0 text-muted-foreground">Trip limit</dt>
            <dd className="text-right tabular-nums text-base-foreground">
              {formatReading(sensor.highHighLimit, sensor.unit, Number.isInteger(sensor.highHighLimit) ? 0 : sensor.decimals)}
            </dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-3">
          <dt className="shrink-0 text-muted-foreground">Mounted on</dt>
          <dd className="text-right text-base-foreground">{reading.where}</dd>
        </div>
      </dl>

      {onShowPart ? (
        <div>
          <Button variant="outline" size="sm" onClick={() => onShowPart(reading.point.assemblyId)}>
            Isolate {compTwin3dAssemblyName(reading.point.assemblyId).toLowerCase()}
          </Button>
        </div>
      ) : null}
    </>
  );
}

function CompTwin3dFallback() {
  return (
    <ul className="flex flex-col gap-2 rounded-lg border border-default bg-card-background p-3">
      {COMPTWIN3D_READINGS.map((reading) => (
        <li key={reading.sensor.id} className="flex items-center justify-between gap-3 text-sm">
          <span className="flex min-w-0 items-center gap-2">
            <CompTwin3dNumber reading={reading} />
            <span className="min-w-0 truncate text-base-foreground">{reading.sensor.name}</span>
          </span>
          <ValueReadout value={reading.sensor.value} unit={reading.sensor.unit} decimals={reading.sensor.decimals} size="xs" tone={reading.tone} className="shrink-0" />
        </li>
      ))}
    </ul>
  );
}

type CompTwin3dInitial = { explode?: number; sectionCut?: boolean; assemblyId?: string | null; sensorId?: string | null };

function CompTwin3dTwin({ initial = {}, still = false }: { initial?: CompTwin3dInitial; still?: boolean }) {
  const [explode, setExplode] = useState(initial.explode ?? 0);
  const [sectionCut, setSectionCut] = useState(initial.sectionCut ?? false);
  const [assemblyId, setAssemblyId] = useState<string | null>(initial.assemblyId ?? null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [sensorId, setSensorId] = useState<string | null>(initial.sensorId ?? null);

  const asset = findAsset(COMPTWIN3D_ASSET_ID);
  const reading = COMPTWIN3D_READINGS.find((candidate) => candidate.sensor.id === sensorId);
  const amount = explode / 100;
  const activeIds = assemblyId === null ? null : TRAIN_ASSEMBLY_IDS.filter((id) => isAssemblyActive(COMPRESSOR_TRAIN_TREE, assemblyId, id));
  const hoveredIds = hoveredId ? assemblyLeafIds(COMPRESSOR_TRAIN_TREE, hoveredId) : [];
  // Two framings, not one per slider step: the camera flies once when the train starts to come apart.
  const bounds = explodedBounds(COMPRESSOR_TRAIN_BOUNDS, COMPRESSOR_TRAIN_EXPLODE, explode > 4 ? 1 : 0);
  const target = bounds ? compTwin3dCamera(bounds, explode > 4 ? 1 : 0.9) : null;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape') return;
    if (sensorId !== null) setSensorId(null);
    else if (assemblyId !== null) setAssemblyId(null);
    else return;
    event.preventDefault();
  };

  if (!asset) return null;

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
      <header className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-b border-default bg-card-background px-4 py-2.5">
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="font-mono text-sm font-medium text-base-foreground">{asset.tag}</span>
          <span className="truncate text-sm text-medium-foreground">{asset.name}, digital twin</span>
        </div>
        <StatusIndicator {...runStateStatus(asset.state)} size="sm" />
        <StatusIndicator {...healthStatus(asset.health)} label={`Health ${asset.healthScore}`} detail={healthStatus(asset.health).label.toLowerCase()} size="sm" />
        <span className="ml-auto text-xs text-muted-foreground">
          {assemblyId ? `Isolated: ${compTwin3dAssemblyName(assemblyId)}` : 'All assemblies shown'}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setExplode(0);
            setSectionCut(false);
            setAssemblyId(null);
            setSensorId(null);
          }}
        >
          Reset view
        </Button>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[14rem_minmax(0,1fr)_19rem]">
        <CompTwin3dPanel
          title="Assemblies"
          className="border-r border-default"
          actions={
            assemblyId ? (
              <Button variant="ghost" size="sm" onClick={() => setAssemblyId(null)}>
                Show all
              </Button>
            ) : null
          }
        >
          <CompTwin3dTree selectedId={assemblyId} onSelect={setAssemblyId} onHover={setHoveredId} />
        </CompTwin3dPanel>

        <div className="flex min-h-0 min-w-0 flex-col">
          <div className="relative min-h-0 flex-1 bg-[radial-gradient(ellipse_at_50%_45%,color-mix(in_oklab,var(--primary-background)_9%,transparent),transparent_70%)]">
            <SceneCanvas
              label={`3D model of compressor train ${asset.tag}, ${explode === 0 ? 'assembled' : `exploded ${explode} percent`}${sectionCut ? ', casing sectioned' : ''}, with ${COMPTWIN3D_READINGS.length} numbered measurement points`}
              fallback={<CompTwin3dFallback />}
            >
              <StillScene still={still}>
                <SceneLights />
                {target ? <CameraRig target={target} minDistance={5} maxDistance={90} /> : null}
                <Ground size={[56, 32]} cell={2} majorEvery={4} center={[1, 0]} />
                <CompressorTrain
                  explode={amount}
                  sectionCut={sectionCut}
                  activeIds={activeIds}
                  hoveredIds={hoveredIds}
                  selectedIds={assemblyId ? assemblyLeafIds(COMPRESSOR_TRAIN_TREE, assemblyId) : []}
                  onSelect={(id) => setAssemblyId(id === assemblyId ? null : id)}
                  onHoverChange={setHoveredId}
                  hotspots={COMPTWIN3D_HOTSPOTS}
                  selectedHotspotId={sensorId}
                  onSelectHotspot={setSensorId}
                />
              </StillScene>
            </SceneCanvas>
          </div>
          <div className="flex shrink-0 items-center gap-5 border-t border-default bg-card-background px-4 py-2.5">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="shrink-0 text-sm text-base-foreground">Explode</span>
              <Slider aria-label="Explode the train along the shaft" value={[explode]} min={0} max={100} step={1} onValueChange={(value) => setExplode(value[0] ?? 0)} />
              <span className="w-10 shrink-0 text-right text-sm tabular-nums text-muted-foreground">{explode}%</span>
            </div>
            <Switch label="Section cut" checked={sectionCut} onCheckedChange={(checked) => setSectionCut(checked)} />
          </div>
        </div>

        <CompTwin3dPanel title={reading ? 'Reading' : 'Measurement points'} meta={reading ? undefined : COMPTWIN3D_READINGS.length} className="border-l border-default">
          {reading ? (
            <CompTwin3dSensorDetail
              key={reading.sensor.id}
              reading={reading}
              onBack={() => setSensorId(null)}
              onShowPart={(id) => setAssemblyId(id)}
            />
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Numbers match the hotspots on the machine. Open one for its reading, limits and trend.</p>
              <CompTwin3dReadingList selectedId={sensorId} onSelect={setSensorId} />
            </>
          )}
        </CompTwin3dPanel>
      </div>
    </div>
  );
}

function CompTwin3dTwinBlueprint() {
  return (
    <ThemeScope preset="blueprint" className="w-full">
      <CompTwin3dTwin />
    </ThemeScope>
  );
}

function CompTwin3dTwinHologram() {
  return (
    <ThemeScope preset="hologram" className="w-full">
      <CompTwin3dTwin still initial={{ explode: 100, sectionCut: true, assemblyId: 'rotor' }} />
    </ThemeScope>
  );
}

function CompTwin3dTwinControlRoom() {
  return (
    <ThemeScope preset="control-room" className="w-full">
      <CompTwin3dTwin still initial={{ sensorId: 'tt-92532' }} />
    </ThemeScope>
  );
}

function CompTwin3dStage({ label, children, heightClass = 'h-72' }: { label: string; children: ReactNode; heightClass?: string }) {
  return (
    <div className={`${heightClass} w-full overflow-hidden rounded-xl border border-default bg-base-background`}>
      <SceneCanvas label={label}>
        <StillScene>{children}</StillScene>
      </SceneCanvas>
    </div>
  );
}

function CompTwin3dPartRotor() {
  return (
    <ThemeScope preset="blueprint" className="w-full">
      <CompTwin3dStage label="Compressor rotor with five shrouded impellers and a balance piston">
        <TurntableStage subjectSize={[6.4, 2.2, 2.2]} padding={0.9}>
          <group position={[4.45, -1.2, 0]}>
            <RotorBundle />
          </group>
        </TurntableStage>
      </CompTwin3dStage>
    </ThemeScope>
  );
}

function CompTwin3dPartLubeSkid() {
  return (
    <ThemeScope preset="blueprint" className="w-full">
      <CompTwin3dStage label="Lube oil skid with reservoir, cooler, two pumps and duplex filters">
        <TurntableStage subjectSize={[4.8, 2.5, 2]} padding={1}>
          <group position={[-5.8, 0, -4.3]}>
            <LubeOilSkid />
          </group>
        </TurntableStage>
      </CompTwin3dStage>
    </ThemeScope>
  );
}

function CompTwin3dPartHotspots() {
  const [selected, setSelected] = useState<number | null>(1);

  return (
    <ThemeScope preset="blueprint" className="w-full">
      <CompTwin3dStage label="Bearing housing with two numbered hotspots, one selected and one in warning">
        <TurntableStage subjectSize={[1.6, 2.6, 1.6]} padding={1.5}>
          <group position={[1.8, -0.6, 0]}>
            <BearingHousing x={-1.8} />
            <Hotspot position={[-1.8, 3.15, 0.25]} index={1} tag="23-VT-92540" value="6.8 mm/s" tone="warning" selected={selected === 1} onSelect={() => setSelected(selected === 1 ? null : 1)} />
            <Hotspot position={[-1.8, 1.5, 0.45]} index={2} tag="23-TT-92544" value="71.4 °C" selected={selected === 2} onSelect={() => setSelected(selected === 2 ? null : 2)} />
          </group>
        </TurntableStage>
      </CompTwin3dStage>
    </ThemeScope>
  );
}

function CompTwin3dPartSectionCut() {
  const [cut, setCut] = useState(true);

  return (
    <ThemeScope preset="blueprint" className="w-full">
      <div className="flex w-full flex-col gap-3 rounded-xl border border-default bg-base-background p-3">
        <div className="flex justify-end">
          <Switch label="Section cut" checked={cut} onCheckedChange={(checked) => setCut(checked)} />
        </div>
        <CompTwin3dStage label={`Barrel casing ${cut ? 'sectioned on its horizontal joint, showing the rotor and diaphragms' : 'closed'}`}>
          <TurntableStage subjectSize={[5.2, 4.6, 3.2]} padding={0.9}>
            <group position={[4.5, -0.6, 0]}>
              <BarrelCasing sectionCut={cut} />
              <RotorBundle />
            </group>
          </TurntableStage>
        </CompTwin3dStage>
      </div>
    </ThemeScope>
  );
}

function CompTwin3dPartExplode() {
  const [explode, setExplode] = useState(45);
  const amount = explode / 100;

  return (
    <ThemeScope preset="blueprint" className="w-full">
      <div className="flex w-full flex-col gap-4 rounded-xl border border-default bg-card-background p-4">
        <div className="flex items-center gap-3">
          <span className="shrink-0 text-sm text-base-foreground">Explode</span>
          <Slider aria-label="Explode amount" value={[explode]} min={0} max={100} step={1} onValueChange={(value) => setExplode(value[0] ?? 0)} />
          <span className="w-10 shrink-0 text-right text-sm tabular-nums text-muted-foreground">{explode}%</span>
        </div>
        <table className="w-full text-sm">
          <caption className="sr-only">Travel of each sub-assembly at the chosen explode amount</caption>
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th scope="col" className="pb-1.5 font-medium">
                Sub-assembly
              </th>
              <th scope="col" className="pb-1.5 font-medium">
                Axis
              </th>
              <th scope="col" className="w-28 pb-1.5 font-medium">
                Progress
              </th>
              <th scope="col" className="pb-1.5 text-right font-medium">
                Travel
              </th>
            </tr>
          </thead>
          <tbody>
            {TRAIN_ASSEMBLY_IDS.filter((id) => COMPRESSOR_TRAIN_EXPLODE[id].distance > 0).map((id) => {
              const spec = COMPRESSOR_TRAIN_EXPLODE[id];
              const [x, y, z] = explodeOffset(spec, amount);
              const progress = explodeProgress(amount, spec.start);
              const axis = spec.direction[0] !== 0 ? 'Shaft' : spec.direction[1] !== 0 ? 'Down' : 'Sideways';
              return (
                <tr key={id} className="border-t border-default">
                  <td className="py-1.5 text-base-foreground">{compTwin3dAssemblyName(id)}</td>
                  <td className="py-1.5 text-muted-foreground">{axis}</td>
                  <td className="py-1.5">
                    <span className="block h-1.5 w-24 overflow-hidden rounded-full bg-medium-background" aria-hidden="true">
                      <span className="block h-full rounded-full bg-chart-1-450" style={{ width: `${Math.round(progress * 100)}%` }} />
                    </span>
                  </td>
                  <td className="py-1.5 text-right tabular-nums text-base-foreground">{formatReading(Math.hypot(x, y, z), 'm', 1)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="text-xs text-muted-foreground">The rotor waits until 30% so the non-drive-end bearing clears the shaft first.</p>
      </div>
    </ThemeScope>
  );
}

function CompTwin3dPartTree() {
  const [selectedId, setSelectedId] = useState<string | null>('compressor');
  const isolated = selectedId ? assemblyLeafIds(COMPRESSOR_TRAIN_TREE, selectedId) : [];

  return (
    <ThemeScope preset="blueprint" className="w-full">
      <div className="flex h-[44rem] w-full justify-center rounded-xl border border-default bg-base-background p-4">
        <div className="flex min-h-0 w-64 flex-col overflow-hidden rounded-lg border border-default">
          <CompTwin3dPanel title="Assemblies" meta={selectedId ? `${isolated.length} isolated` : 'All shown'} className="flex-1">
            <CompTwin3dTree selectedId={selectedId} onSelect={setSelectedId} />
          </CompTwin3dPanel>
        </div>
      </div>
    </ThemeScope>
  );
}

function CompTwin3dPartInspector() {
  const [sensorId, setSensorId] = useState<string | null>('tt-92532');
  const reading = COMPTWIN3D_READINGS.find((candidate) => candidate.sensor.id === sensorId);

  return (
    <ThemeScope preset="blueprint" className="w-full">
      <div className="flex h-[44rem] w-full justify-center rounded-xl border border-default bg-base-background p-4">
        <div className="flex min-h-0 w-80 flex-col overflow-hidden rounded-lg border border-default">
          <CompTwin3dPanel title={reading ? 'Reading' : 'Measurement points'} className="flex-1">
            {reading ? <CompTwin3dSensorDetail key={reading.sensor.id} reading={reading} onBack={() => setSensorId(null)} /> : <CompTwin3dReadingList onSelect={setSensorId} />}
          </CompTwin3dPanel>
        </div>
      </div>
    </ThemeScope>
  );
}

function CompTwin3dPartFallback() {
  return (
    <ThemeScope preset="blueprint" className="w-full">
      <div className="h-96 w-full overflow-hidden rounded-xl border border-default">
        <SceneCanvas label="3D model of compressor train 23-KA-9101" forceFallback fallback={<CompTwin3dFallback />}>
          <CompressorTrain />
        </SceneCanvas>
      </div>
    </ThemeScope>
  );
}

export default definePage({
  id: 'compressor-digital-twin',
  title: 'Compressor digital twin',
  summary:
    'One machine in detail: a centrifugal compressor train you can pull apart along its shaft, cut open and read. A parts tree isolates assemblies, numbered hotspots sit where the instruments really are, and each opens its live reading, limits and trend.',
  guidance: {
    use: [
      'When the question is about one machine: which part, which bearing, which nozzle a reading belongs to.',
      'With numbers that tie the scene to the panels: the same digit on the hotspot, in the tree and in the list.',
      'With docked panels and a wide scene, so the machine never hides behind its own controls.',
      'On a light surface for engineering work: steel stays grey and only abnormal readings take colour.',
    ],
    avoid: [
      'A plant overview: use the 3D plant explorer when location between machines matters.',
      'Exploding by default. Start assembled; the explode slider is for finding a part, then put it back.',
      'Colouring parts by health. Parts are isolated by ghosting the rest; state lives on hotspots and in panels.',
      'Hotspots without a list beside the canvas: the scene is one image to a screen reader.',
    ],
  },
  source,
  sections: [
    {
      id: 'experience',
      title: 'Experience',
      description:
        'Drag to orbit, scroll to zoom. Move the Explode slider to pull the train apart along the shaft; the rotor follows the bearing out of the casing. Hover or select an assembly in the tree to light and isolate it, click a numbered hotspot for its reading, and switch on Section cut to open the casing. Escape steps back.',
      specimens: [
        {
          id: 'CompTwin3dTwinBlueprint',
          title: 'Compressor digital twin',
          note: 'Pick it when engineers need to connect a reading to the exact part of the machine it comes from.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'three/models/CompressorTrain.tsx',
            'three/models/compressorTrainLayout.ts',
            'three/models/assemblyTree.ts',
            'three/models/explodeOffsets.ts',
            'three/models/ExplodeGroup.tsx',
            'three/models/Hotspot.tsx',
            'three/models/BarrelCasing.tsx',
            'three/models/SectionCut.tsx',
            'three/models/RotorBundle.tsx',
            'three/models/StillScene.tsx',
            'three/SceneCanvas.tsx',
            'three/CameraRig.tsx',
            'industrial/charts/TrendChart.tsx',
            'industrial/RangeIndicator.tsx',
            'industrial/ValueReadout.tsx',
            'industrial/StatusIndicator.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: CompTwin3dTwinBlueprint,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same twin in two dark presets, each opened in a different state and held still. Steel, ghosting and hotspots are resolved from tokens.',
      specimens: [
        {
          id: 'CompTwin3dTwinHologram',
          title: 'Hologram, exploded and sectioned',
          note: 'Pick it for a review screen in a dark room, opened with the rotor pulled out of the casing and isolated.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['three/models/CompressorTrain.tsx', 'three/models/StillScene.tsx', 'three/SceneCanvas.tsx', 'themes/ThemeScope.tsx'],
          Component: CompTwin3dTwinHologram,
        },
        {
          id: 'CompTwin3dTwinControlRoom',
          title: 'Control room, on one reading',
          note: 'Pick it next to operator displays, opened on the reading that is in alarm.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['three/models/CompressorTrain.tsx', 'three/models/Hotspot.tsx', 'three/models/StillScene.tsx', 'three/SceneCanvas.tsx', 'themes/ThemeScope.tsx'],
          Component: CompTwin3dTwinControlRoom,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'Sub-assemblies on a turntable you can drag, and the panels and controls around the scene.',
      specimens: [
        {
          id: 'CompTwin3dPartRotor',
          title: 'Rotor bundle',
          note: 'Pick it to show what turns inside a casing: shaft, impellers, balance piston and journals.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/models/RotorBundle.tsx', 'three/models/AxialCylinder.tsx', 'three/TurntableStage.tsx', 'three/models/StillScene.tsx'],
          Component: CompTwin3dPartRotor,
        },
        {
          id: 'CompTwin3dPartLubeSkid',
          title: 'Lube oil skid',
          note: 'Pick it for the auxiliary a compressor cannot run without, when oil pressure or temperature is the topic.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/models/LubeOilSkid.tsx', 'three/TurntableStage.tsx', 'three/models/StillScene.tsx'],
          Component: CompTwin3dPartLubeSkid,
        },
        {
          id: 'CompTwin3dPartHotspots',
          title: 'Numbered hotspots',
          note: 'Pick numbered hotspots when several instruments sit close together; the selected one widens to show its tag and reading.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/models/Hotspot.tsx', 'three/SensorMarker.tsx', 'three/models/BearingHousing.tsx', 'three/TurntableStage.tsx'],
          Component: CompTwin3dPartHotspots,
        },
        {
          id: 'CompTwin3dPartSectionCut',
          title: 'Section cut',
          note: 'Pick it when the internals matter: the casing opens on its joint and the nozzles stay as ghosts.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['three/models/BarrelCasing.tsx', 'three/models/SectionCut.tsx', 'three/models/RotorBundle.tsx', 'three/TurntableStage.tsx'],
          Component: CompTwin3dPartSectionCut,
        },
        {
          id: 'CompTwin3dPartExplode',
          title: 'Explode control',
          note: 'Pick a staged explode when parts must leave in order; the table shows what the slider does to each one.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['three/models/explodeOffsets.ts', 'three/models/compressorTrainLayout.ts'],
          Component: CompTwin3dPartExplode,
        },
        {
          id: 'CompTwin3dPartTree',
          title: 'Parts tree',
          note: 'Pick it as the keyboard path into a model: groups isolate several parts, leaves one, and digits show where the hotspots are.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['three/models/assemblyTree.ts', 'three/models/compressorTrainLayout.ts'],
          Component: CompTwin3dPartTree,
        },
        {
          id: 'CompTwin3dPartInspector',
          title: 'Reading inspector',
          note: 'Pick it as the detail side of a hotspot: value, alarm, position in the band, trend and where it is mounted.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx', 'industrial/RangeIndicator.tsx', 'industrial/ValueReadout.tsx', 'industrial/StatusIndicator.tsx'],
          Component: CompTwin3dPartInspector,
        },
        {
          id: 'CompTwin3dPartFallback',
          title: 'Without WebGL',
          note: 'Pick a fallback that lists the same numbered readings, so the twin still answers where 3D cannot render.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['three/SceneCanvas.tsx', 'three/webgl.ts', 'industrial/ValueReadout.tsx'],
          Component: CompTwin3dPartFallback,
        },
      ],
    },
  ],
});
