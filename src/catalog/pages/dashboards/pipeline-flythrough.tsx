import { Button } from '@cognite/aura/components/button';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import { Slider } from '@cognite/aura/components/slider';
import { IconChevronLeft, IconChevronRight, IconPlayerPause, IconPlayerPlay } from '@cognite/aura/icons';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { axisTicks, climbBetween, stretchAt } from '../../../library/kit/pipeline-flythrough/chainage';
import { ChainageProfile, type ChainageMark } from '../../../library/kit/pipeline-flythrough/ChainageProfile';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import type { Tone } from '../../../library/kit/tones';
import { LookScope } from '../../../library/looks/LookScope';
import { waveFronts } from '../../../library/three/fields/hydraulicGradient';
import {
  PIPELINE_ANOMALIES,
  PIPELINE_LEAK,
  PIPELINE_MAOP,
  PIPELINE_STATIONS,
  PIPELINE_TOTAL_KM,
  anomalySeverity,
  buildPipelineRoute,
  elevationAt,
  elevationProfile,
  leakIsolation,
  scenarioPressureAt,
  scenarioProfile,
  stationValves,
} from '../../../library/three/fields/pipelineData';
import type { AnomalySeverity, LeakStage, PipelineStation, PipelineStationKind } from '../../../library/three/fields/pipelineData';
import { PipelineScene } from '../../../library/three/fields/PipelineScene';
import { nearestStation, stationStep } from '../../../library/three/fields/routeSpline';
import { StationModel } from '../../../library/three/fields/StationModel';
import { usePlayback } from '../../../library/three/fields/usePlayback';
import { SceneCanvas } from '../../../library/three/SceneCanvas';
import { StillScene } from '../../../library/three/scenes/StillScene';
import { TurntableStage } from '../../../library/three/TurntableStage';
import { definePage } from '../../types';

import source from './pipeline-flythrough.tsx?raw';

const PIPELINEFLY_ROUTE = buildPipelineRoute();

const PIPELINEFLY_ELEVATION = elevationProfile(1);

const PIPELINEFLY_STATION_MARKS = PIPELINE_STATIONS.map((station) => ({ id: station.id, label: station.short, kp: station.kp }));

const PIPELINEFLY_SEVERITY_TONE: Readonly<Record<AnomalySeverity, Tone>> = { critical: 'critical', high: 'critical', medium: 'warning', low: 'info' };

const PIPELINEFLY_SEVERITY_LABEL: Readonly<Record<AnomalySeverity, string>> = { critical: 'Critical', high: 'Severe', medium: 'Moderate', low: 'Minor' };

const PIPELINEFLY_MARKS: readonly ChainageMark[] = PIPELINE_ANOMALIES.map((anomaly) => ({
  id: anomaly.id,
  kp: anomaly.kp,
  tone: PIPELINEFLY_SEVERITY_TONE[anomalySeverity(anomaly)],
  label: `${anomaly.type} at kilometre ${anomaly.kp}, ${anomaly.depth} percent of the wall`,
}));

const PIPELINEFLY_STAGES: readonly { id: LeakStage; label: string; detail: string }[] = [
  { id: 'off', label: 'Normal operation', detail: 'The line runs at 14.2 MSm³/d. Pressure falls half a bar per kilometre and the compressor station puts 21 bar back.' },
  { id: 'detected', label: 'Leak detected', detail: 'A pressure wave leaves kilometre 58.4 in both directions. The leak detection system raises the alarm when it passes two transmitters.' },
  { id: 'isolated', label: 'Segment isolated', detail: 'Block valves BV-02 and BV-03 close. Eighteen kilometres of line are shut in and settle at 61 barg while the rest keeps its pressure.' },
];

const PIPELINEFLY_KIND_LABEL: Readonly<Record<PipelineStationKind, string>> = {
  launcher: 'Pig launcher',
  valve: 'Block valve station',
  crossing: 'Crossing',
  compressor: 'Compressor station',
  metering: 'Metering station',
  terminal: 'Terminal',
};

const PIPELINEFLY_STATION_SIZE: Readonly<Record<PipelineStationKind, readonly [number, number, number]>> = {
  launcher: [18, 5, 14],
  valve: [14, 5, 12],
  crossing: [14, 5, 12],
  compressor: [30, 6, 24],
  metering: [22, 5, 16],
  terminal: [40, 8, 34],
};

/** Scene labels come from the shared 3D library; here they are set in the UI sans like everything else. */
const PIPELINEFLY_SCENE = '[&_[data-slot=scene-label]_.font-mono]:font-sans [&_[data-slot=scene-label]_.font-mono]:tabular-nums';

const PIPELINEFLY_FOCUS = 'outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-default)]';

function pipelineFlyIsMode(value: unknown): value is 'rail' | 'overview' {
  return value === 'rail' || value === 'overview';
}

function pipelineFlyPoints(points: readonly { kp: number; pressure: number }[]): { kp: number; value: number }[] {
  return points.map((point) => ({ kp: point.kp, value: point.pressure }));
}

function pipelineFlyClamp(kp: number): number {
  return Math.min(PIPELINE_TOTAL_KM, Math.max(0, kp));
}

/** Where the reader is, as a sentence: at a station, or between two with the distance to the next. */
function pipelineFlyPlace(kp: number): string {
  const station = nearestStation(PIPELINE_STATIONS, kp);
  if (station && Math.abs(station.kp - kp) < 0.5) return `At ${station.name}.`;
  const stretch = stretchAt(PIPELINE_STATIONS, kp);
  if (!stretch) return 'On the export line.';
  return `Between ${stretch.from.short} and ${stretch.to.short}, ${(stretch.to.kp - kp).toFixed(1)} km before ${stretch.to.name}.`;
}

/** A typographic figure: a small label over a very large number with its unit. */
function PipelineFlyFigure({ label, value, unit, note, tone }: { label: string; value: string; unit: string; note?: string; tone?: Tone }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 border-t border-[var(--kit-rule)] py-3 first:border-t-0 first:pt-0">
      <dt className="text-sm text-[var(--kit-text-2)]">{label}</dt>
      <dd className="flex items-baseline gap-2">
        <span className="text-4xl font-medium leading-none tracking-tight tabular-nums" style={{ color: tone ? `var(--kit-line-${tone})` : undefined }}>
          {value}
        </span>
        <span className="text-sm text-[var(--kit-text-2)]">{unit}</span>
      </dd>
      {note ? <dd className="text-sm text-[var(--kit-text-3)]">{note}</dd> : null}
    </div>
  );
}

/** The opening of the report: the kilometre as the headline figure, where that is, and three figures beside it. */
function PipelineFlyHeadline({ kp, stage = 'off' }: { kp: number; stage?: LeakStage }) {
  const pressure = scenarioPressureAt(stage, kp);
  const margin = PIPELINE_MAOP - pressure;

  return (
    <div className="grid grid-cols-12 gap-x-10 gap-y-6">
      <div className="col-span-12 flex min-w-0 flex-col gap-3 lg:col-span-7">
        <p className="text-sm font-medium text-[var(--kit-text-2)]">Kilometre</p>
        <p className="flex items-baseline gap-4">
          <span className="text-[7.5rem] font-medium leading-[0.85] tracking-[-0.05em] tabular-nums">{kp.toFixed(1)}</span>
          <span className="text-xl text-[var(--kit-text-2)]">of {PIPELINE_TOTAL_KM}</span>
        </p>
        <h2 className="max-w-[34rem] text-2xl font-medium leading-8 tracking-tight">{pipelineFlyPlace(kp)}</h2>
      </div>
      <dl className="col-span-12 grid grid-cols-3 gap-x-8 self-end max-lg:[&>div]:border-t-0 max-lg:[&>div]:pt-0 lg:col-span-5 lg:grid-cols-1 lg:border-l lg:border-[var(--kit-rule)] lg:pl-10">
        <PipelineFlyFigure label="Ground" value={String(Math.round(elevationAt(kp)))} unit="m above sea level" />
        <PipelineFlyFigure label="Line pressure" value={pressure.toFixed(1)} unit="barg" tone={stage === 'off' ? undefined : 'warning'} />
        <PipelineFlyFigure label="Margin to allowable" value={margin.toFixed(1)} unit="bar" tone={margin < 12 ? 'warning' : undefined} />
      </dl>
    </div>
  );
}

function PipelineFlyFallback() {
  return (
    <ul className="flex flex-col gap-1.5 p-3 text-sm">
      {PIPELINE_STATIONS.map((station) => (
        <li key={station.id} className="flex items-center justify-between gap-3">
          <span className="truncate">{station.name}</span>
          <span className="tabular-nums text-[var(--kit-text-2)]">km {station.kp}</span>
        </li>
      ))}
    </ul>
  );
}

/** A numbered figure: the picture between two rules with its caption underneath, the way a report sets one. */
function PipelineFlyPlate({ number, caption, aside, children }: { number: number; caption: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <figure className="m-0 flex min-w-0 flex-col">
      <div className="border-y border-[var(--kit-rule-strong)]">{children}</div>
      <figcaption className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 pt-2.5 text-sm text-[var(--kit-text-2)]">
        <span>
          <span className="font-semibold text-[var(--kit-text)]">Fig. {number}</span> — {caption}
        </span>
        {aside}
      </figcaption>
    </figure>
  );
}

function PipelineFlySceneBand({
  kp,
  mode,
  stage = 'off',
  anomalyId = null,
  onSelectAnomaly,
  still,
  className = 'h-[21rem]',
}: {
  kp: number;
  mode: 'rail' | 'overview';
  stage?: LeakStage;
  anomalyId?: string | null;
  onSelectAnomaly?: (id: string) => void;
  still: boolean;
  className?: string;
}) {
  const station = nearestStation(PIPELINE_STATIONS, kp);

  return (
    <div className={`w-full bg-[linear-gradient(to_bottom,color-mix(in_oklab,var(--kit-line-sky)_16%,transparent),transparent_70%)] ${className} ${PIPELINEFLY_SCENE}`}>
      <SceneCanvas
        label={`3D view of the ${PIPELINE_TOTAL_KM} kilometre export pipeline, camera ${mode === 'rail' ? 'riding above the pipe' : 'in overview'} at kilometre ${kp.toFixed(1)}${station ? `, nearest station ${station.name}` : ''}`}
        fallback={<PipelineFlyFallback />}
      >
        <StillScene still={still}>
          <PipelineScene
            route={PIPELINEFLY_ROUTE}
            cameraKp={kp}
            mode={mode}
            pigKp={null}
            leakStage={stage}
            anomalies={PIPELINE_ANOMALIES}
            selectedAnomalyId={anomalyId}
            onSelectAnomaly={onSelectAnomaly}
            selectedStationId={station?.id ?? null}
          />
        </StillScene>
      </SceneCanvas>
    </div>
  );
}

/** The slider that flies the camera, with station steps and play. It sits under the profile and shares its gutters. */
function PipelineFlyTransport({ kp, running, onSeek, onToggle }: { kp: number; running: boolean; onSeek: (kp: number) => void; onToggle: () => void }) {
  const previous = stationStep(PIPELINE_STATIONS, kp, -1);
  const next = stationStep(PIPELINE_STATIONS, kp, 1);
  const atEnd = kp >= PIPELINE_TOTAL_KM;

  return (
    <div className="flex flex-col gap-3">
      <div className="mx-12">
        <Slider aria-label="Distance along the pipeline in kilometres" value={[kp]} min={0} max={PIPELINE_TOTAL_KM} step={0.1} onValueChange={(value) => onSeek(pipelineFlyClamp(value[0] ?? 0))} />
      </div>
      <div className="mx-12 flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => previous && onSeek(previous.kp)} disabled={!previous} aria-label={previous ? `Previous station, ${previous.name}` : 'Previous station, none before this point'}>
          <IconChevronLeft /> {previous ? previous.short : 'Start'}
        </Button>
        <Button size="sm" className="w-28" onClick={() => (atEnd && !running ? (onSeek(0), onToggle()) : onToggle())} aria-label={running ? 'Pause travel' : 'Travel along the line'}>
          {running ? <IconPlayerPause /> : <IconPlayerPlay />} {running ? 'Pause' : atEnd ? 'Restart' : 'Travel'}
        </Button>
        <Button variant="outline" size="sm" onClick={() => next && onSeek(next.kp)} disabled={!next} aria-label={next ? `Next station, ${next.name}` : 'Next station, none after this point'}>
          {next ? next.short : 'End'} <IconChevronRight />
        </Button>
        <span className="ml-auto text-sm text-[var(--kit-text-2)]">Drag the slider, click the profile, or use the arrow keys on the slider.</span>
      </div>
    </div>
  );
}

function PipelineFlyModeSwitch({ mode, onChange }: { mode: 'rail' | 'overview'; onChange: (mode: 'rail' | 'overview') => void }) {
  return (
    <SegmentedControl
      value={mode}
      onValueChange={(value) => {
        if (pipelineFlyIsMode(value)) onChange(value);
      }}
    >
      <SegmentedControlList size="small" aria-label="Camera">
        <SegmentedControlButton value="rail">Above the pipe</SegmentedControlButton>
        <SegmentedControlButton value="overview">Whole route</SegmentedControlButton>
      </SegmentedControlList>
    </SegmentedControl>
  );
}

/** A column of the report: a numbered heading over a rule, then prose and figures. */
function PipelineFlyColumn({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-3 border-t border-[var(--kit-rule-strong)] pt-3">
      <h3 className="flex items-baseline gap-2.5 text-lg font-medium tracking-tight">
        <span className="text-[var(--kit-text-3)]">{number}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function PipelineFlyFacts({ rows }: { rows: readonly { label: string; value: string }[] }) {
  return (
    <dl className="flex flex-col">
      {rows.map((row) => (
        <div key={row.label} className="flex items-baseline justify-between gap-4 border-b border-[var(--kit-rule)] py-2 last:border-b-0">
          <dt className="text-sm text-[var(--kit-text-2)]">{row.label}</dt>
          <dd className="text-sm font-medium tabular-nums">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function PipelineFlyStretch({ kp }: { kp: number }) {
  const stretch = stretchAt(PIPELINE_STATIONS, kp);
  if (!stretch) return null;
  const climb = climbBetween(elevationAt, stretch.from.kp, stretch.to.kp);
  const done = ((kp - stretch.from.kp) / (stretch.to.kp - stretch.from.kp)) * 100;

  return (
    <>
      <p className="text-sm leading-6 text-[var(--kit-text-2)]">
        From <span className="font-medium text-[var(--kit-text)]">{stretch.from.name}</span> to <span className="font-medium text-[var(--kit-text)]">{stretch.to.name}</span>. The line climbs {climb.up} m and drops {climb.down} m on the way.
      </p>
      <div aria-hidden="true" className="relative h-1 bg-[var(--kit-track)]">
        <span className="absolute inset-y-0 left-0 bg-[var(--kit-text)]" style={{ width: `${Math.min(100, Math.max(0, done)).toFixed(1)}%` }} />
      </div>
      <PipelineFlyFacts
        rows={[
          { label: 'Length of the stretch', value: `${(stretch.to.kp - stretch.from.kp).toFixed(0)} km` },
          { label: `Behind you, to ${stretch.from.short}`, value: `${(kp - stretch.from.kp).toFixed(1)} km` },
          { label: `Ahead, to ${stretch.to.short}`, value: `${(stretch.to.kp - kp).toFixed(1)} km` },
        ]}
      />
    </>
  );
}

function PipelineFlyStation({ station, stage = 'off' }: { station: PipelineStation; stage?: LeakStage }) {
  const valves = stationValves(station, stage);

  return (
    <>
      <p className="text-sm leading-6 text-[var(--kit-text-2)]">
        <span className="font-medium text-[var(--kit-text)]">{station.name}</span> at kilometre {station.kp}, {Math.round(elevationAt(station.kp))} m above sea level.
      </p>
      <PipelineFlyFacts
        rows={[
          { label: 'Pressure', value: `${scenarioPressureAt(stage, station.kp).toFixed(1)} barg` },
          { label: 'Gas temperature', value: `${station.temperature} °C` },
          { label: 'Flow', value: `${station.flow.toFixed(1)} MSm³/d` },
          ...station.facts.map((fact) => ({ label: fact.label, value: `${fact.value.toFixed(fact.decimals ?? 0)} ${fact.unit}` })),
        ]}
      />
      {valves.length > 0 ? (
        <ul aria-label="Valves" className="flex flex-col gap-1.5">
          {valves.map((valve) => (
            <li key={valve.tag} className="flex items-center justify-between gap-3">
              <TagId>{valve.tag}</TagId>
              <StatusPill tone={valve.position === 'open' ? 'success' : 'neutral'}>{valve.position === 'open' ? 'Open' : 'Closed'}</StatusPill>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

/** The findings of the last inspection run, nearest to the reader first. Each row moves the camera there. */
function PipelineFlyFindings({ kp, selectedId, onSelect, limit = 4 }: { kp: number; selectedId: string | null; onSelect: (id: string) => void; limit?: number }) {
  const nearest = [...PIPELINE_ANOMALIES].sort((a, b) => Math.abs(a.kp - kp) - Math.abs(b.kp - kp)).slice(0, limit);

  return (
    <ul className="flex flex-col">
      {nearest.map((anomaly) => {
        const severity = anomalySeverity(anomaly);
        const selected = anomaly.id === selectedId;
        return (
          <li key={anomaly.id} className="border-b border-[var(--kit-rule)] last:border-b-0">
            <button type="button" aria-pressed={selected} onClick={() => onSelect(anomaly.id)} className={`flex w-full cursor-pointer items-start justify-between gap-3 py-2 text-left ${PIPELINEFLY_FOCUS} ${selected ? 'bg-[var(--kit-well)]' : 'hover:bg-[var(--kit-well)]'}`}>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-medium">{anomaly.type}</span>
                <span className="text-sm text-[var(--kit-text-2)]">
                  {anomaly.depth}% of the wall · {anomaly.length} mm long · at {anomaly.clock} o’clock
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-sm font-medium tabular-nums">km {anomaly.kp}</span>
                <StatusPill tone={PIPELINEFLY_SEVERITY_TONE[severity]}>{PIPELINEFLY_SEVERITY_LABEL[severity]}</StatusPill>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function PipelineFlyMasthead({ section }: { section: string }) {
  return (
    <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b-2 border-[var(--kit-text)] pb-3 text-sm">
      <p>
        <span className="font-semibold">Nordkapp export line</span>
        <span className="text-[var(--kit-text-2)]"> · {section}</span>
      </p>
      <p className="text-[var(--kit-text-2)]">84 km · 36 in · in-line inspection of 4 March 2026</p>
    </header>
  );
}

function PipelineFlyReport({ initialKp = 25, still = false }: { initialKp?: number; still?: boolean }) {
  // Archetype: a route survey set as a report. The kilometre is the headline figure; the 3D view
  //   and the chainage profile are two numbered figures under it; three columns of text close it.
  // Interaction: one slider flies the camera along the line. The headline, both figures and all
  //   three columns are functions of the kilometre. Travel plays to the terminal and stops.
  const [kp, setKp] = useState(initialKp);
  const [mode, setMode] = useState<'rail' | 'overview'>('rail');
  const [running, setRunning] = useState(false);
  const [anomalyId, setAnomalyId] = useState<string | null>(null);
  const pressure = useMemo(() => pipelineFlyPoints(scenarioProfile('off')), []);
  const station = nearestStation(PIPELINE_STATIONS, kp);

  usePlayback({ running, rate: 2.6, value: kp, max: PIPELINE_TOTAL_KM, onValue: setKp, onEnd: () => setRunning(false) });

  const seek = (next: number) => setKp(pipelineFlyClamp(next));
  const selectAnomaly = (id: string) => {
    const anomaly = PIPELINE_ANOMALIES.find((candidate) => candidate.id === id);
    setAnomalyId(id === anomalyId ? null : id);
    if (anomaly && id !== anomalyId) {
      setRunning(false);
      seek(anomaly.kp);
    }
  };

  return (
    <Canvas className="flex flex-col gap-8">
      <PipelineFlyMasthead section="Route survey" />
      <PipelineFlyHeadline kp={kp} />

      <PipelineFlyPlate number={1} caption={mode === 'rail' ? `The view from above the pipe at kilometre ${kp.toFixed(1)}, looking towards the terminal.` : `The whole route from landfall to the terminal; the marker stands at kilometre ${kp.toFixed(1)}.`} aside={<PipelineFlyModeSwitch mode={mode} onChange={setMode} />}>
        <PipelineFlySceneBand kp={kp} mode={mode} anomalyId={anomalyId} onSelectAnomaly={selectAnomaly} still={still} />
      </PipelineFlyPlate>

      <figure className="m-0 flex min-w-0 flex-col gap-2">
        <ChainageProfile
          label={`Section of the pipeline: ground elevation and line pressure over ${PIPELINE_TOTAL_KM} kilometres, with the reader at kilometre ${kp.toFixed(1)}`}
          totalKm={PIPELINE_TOTAL_KM}
          elevation={PIPELINEFLY_ELEVATION}
          pressure={pressure}
          maop={PIPELINE_MAOP}
          cursorKp={kp}
          stations={PIPELINEFLY_STATION_MARKS}
          marks={PIPELINEFLY_MARKS}
          selectedMarkId={anomalyId}
          onSelectMark={selectAnomaly}
          onSeek={(next) => {
            setRunning(false);
            seek(next);
          }}
          height={230}
        />
        <PipelineFlyTransport
          kp={kp}
          running={running}
          onSeek={(next) => {
            setRunning(false);
            seek(next);
          }}
          onToggle={() => setRunning(!running)}
        />
        <figcaption className="border-t border-[var(--kit-rule)] pt-2.5 text-sm text-[var(--kit-text-2)]">
          <span className="font-semibold text-[var(--kit-text)]">Fig. 2</span> — The line in section. The silhouette is the ground in metres, the line above it the pressure in barg; diamonds mark the eight findings of the inspection run.
        </figcaption>
      </figure>

      <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-3">
        <PipelineFlyColumn number="01" title="This stretch">
          <PipelineFlyStretch kp={kp} />
        </PipelineFlyColumn>
        <PipelineFlyColumn number="02" title="Nearest station">
          {station ? <PipelineFlyStation station={station} /> : null}
        </PipelineFlyColumn>
        <PipelineFlyColumn number="03" title="Findings near here">
          <PipelineFlyFindings kp={kp} selectedId={anomalyId} onSelect={selectAnomaly} limit={3} />
        </PipelineFlyColumn>
      </div>
    </Canvas>
  );
}

function PipelineFlySignature() {
  return (
    <LookScope look="editorial">
      <PipelineFlyReport />
    </LookScope>
  );
}

type PipelineFlyValveRow = { tag: string; station: string; kp: number; position: 'open' | 'closed' };

function PipelineFlyLeak() {
  // A different screen of the same report: the leak response. Text and steps lead on the left;
  // the whole route and the pressure section on the right show what each step did to the line.
  const [stage, setStage] = useState<LeakStage>('detected');
  const pair = leakIsolation();
  const fronts = waveFronts(PIPELINE_LEAK, PIPELINE_TOTAL_KM);
  const rows: PipelineFlyValveRow[] = PIPELINE_STATIONS.filter((station) => station.kind === 'valve').flatMap((station) => stationValves(station, stage).map((valve) => ({ tag: valve.tag, station: station.short, kp: station.kp, position: valve.position })));
  const columns: DataTableColumn<PipelineFlyValveRow>[] = [
    { id: 'tag', header: 'Valve', cell: (row) => <TagId>{row.tag}</TagId>, nowrap: true },
    { id: 'kp', header: 'km', cell: (row) => row.kp, numeric: true },
    { id: 'position', header: 'Position', cell: (row) => <StatusPill tone={row.position === 'open' ? 'success' : 'warning'}>{row.position === 'open' ? 'Open' : 'Closed'}</StatusPill>, align: 'end' },
  ];
  const band =
    stage === 'detected'
      ? { from: fronts[0], to: fronts[1], label: 'Pressure wave', tone: 'warning' as const }
      : stage === 'isolated' && pair
        ? { from: pair.upstream.kp, to: pair.downstream.kp, label: 'Shut in', tone: 'warning' as const }
        : null;

  return (
    <LookScope look="editorial">
      <Canvas className="flex flex-col gap-8">
        <PipelineFlyMasthead section="Leak response drill" />
        <div className="grid grid-cols-12 gap-x-10 gap-y-8">
          <div className="col-span-12 flex min-w-0 flex-col gap-6 lg:col-span-5">
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-[var(--kit-text-2)]">Kilometre</p>
              <p className="text-[6rem] font-medium leading-[0.85] tracking-[-0.05em] tabular-nums">{PIPELINE_LEAK.kp}</p>
              <h2 className="text-2xl font-medium leading-8 tracking-tight">
                {stage === 'off' ? 'Before the leak: the line as it runs every day.' : stage === 'detected' ? 'A leak takes twenty bar out of the line.' : 'Eighteen kilometres are shut in between two block valves.'}
              </h2>
            </div>
            <ol aria-label="Steps of the drill" className="flex flex-col border-t border-[var(--kit-rule-strong)]">
              {PIPELINEFLY_STAGES.map((entry, index) => {
                const active = entry.id === stage;
                return (
                  <li key={entry.id} className="border-b border-[var(--kit-rule)]">
                    <button type="button" aria-current={active ? 'step' : undefined} onClick={() => setStage(entry.id)} className={`flex w-full cursor-pointer items-baseline gap-4 py-3 text-left ${PIPELINEFLY_FOCUS} ${active ? '' : 'text-[var(--kit-text-2)] hover:text-[var(--kit-text)]'}`}>
                      <span className={`w-10 shrink-0 text-3xl font-medium leading-none tabular-nums ${active ? '' : 'text-[var(--kit-text-3)]'}`}>{index + 1}</span>
                      <span className="flex min-w-0 flex-col gap-1">
                        <span className="text-lg font-medium leading-6">{entry.label}</span>
                        {active ? <span className="text-sm leading-6 text-[var(--kit-text-2)]">{entry.detail}</span> : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <DataTable label="Block valves along the line" columns={columns} rows={rows.filter((row) => row.tag.includes('XV'))} rowKey={(row) => row.tag} rowTone={(row) => (row.position === 'closed' ? 'warning' : undefined)} />
          </div>
          <div className="col-span-12 flex min-w-0 flex-col gap-8 lg:col-span-7">
            <PipelineFlyPlate number={1} caption="The whole route. The marker stands at the leak, between block valve stations 2 and 3.">
              <PipelineFlySceneBand kp={PIPELINE_LEAK.kp} mode="overview" stage={stage} still className="h-72" />
            </PipelineFlyPlate>
            <figure className="m-0 flex min-w-0 flex-col gap-2">
              <ChainageProfile
                label={`Pressure along the pipeline during the leak drill: ${PIPELINEFLY_STAGES.find((entry) => entry.id === stage)?.label ?? ''}`}
                totalKm={PIPELINE_TOTAL_KM}
                elevation={PIPELINEFLY_ELEVATION}
                pressure={pipelineFlyPoints(scenarioProfile(stage))}
                basePressure={stage === 'off' ? undefined : pipelineFlyPoints(scenarioProfile('off'))}
                maop={PIPELINE_MAOP}
                cursorKp={PIPELINE_LEAK.kp}
                stations={PIPELINEFLY_STATION_MARKS}
                band={band}
                height={220}
              />
              <figcaption className="border-t border-[var(--kit-rule)] pt-2.5 text-sm text-[var(--kit-text-2)]">
                <span className="font-semibold text-[var(--kit-text)]">Fig. 2</span> — Line pressure now, solid, against normal operation, dashed. The cursor stands at the leak.
              </figcaption>
            </figure>
          </div>
        </div>
      </Canvas>
    </LookScope>
  );
}

function PipelineFlyStationSheet() {
  // A third screen: the station sheet. An index of the nine stations across the top; the picked
  // one is set as a data sheet beside its model on a stage.
  const [id, setId] = useState('cs-01');
  const station = PIPELINE_STATIONS.find((candidate) => candidate.id === id) ?? PIPELINE_STATIONS[0];
  if (!station) return null;
  const upstream = stationStep(PIPELINE_STATIONS, station.kp, -1);
  const downstream = stationStep(PIPELINE_STATIONS, station.kp, 1);

  return (
    <LookScope look="editorial">
      <Canvas className="flex flex-col gap-8">
        <PipelineFlyMasthead section="Station sheets" />
        <nav aria-label="Stations along the line">
          <ol className="grid grid-cols-9 border-b border-[var(--kit-rule)]">
            {PIPELINE_STATIONS.map((entry) => {
              const active = entry.id === id;
              return (
                <li key={entry.id} className="min-w-0">
                  <button type="button" aria-current={active ? 'page' : undefined} onClick={() => setId(entry.id)} className={`flex w-full cursor-pointer flex-col gap-0.5 border-b-2 py-2 text-left ${PIPELINEFLY_FOCUS} ${active ? 'border-[var(--kit-text)]' : 'border-transparent text-[var(--kit-text-2)] hover:text-[var(--kit-text)]'}`}>
                    <span className="text-xs tabular-nums text-[var(--kit-text-3)]">km {entry.kp}</span>
                    <span className="truncate text-sm font-medium">{entry.short}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
        <div className="grid grid-cols-12 gap-x-10 gap-y-8">
          <div className="col-span-12 flex min-w-0 flex-col gap-5 lg:col-span-5">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-[var(--kit-text-2)]">
                {PIPELINEFLY_KIND_LABEL[station.kind]} · kilometre {station.kp}
              </p>
              <h2 className="text-5xl font-medium leading-[1.05] tracking-tight">{station.name}</h2>
            </div>
            <dl className="grid grid-cols-3 gap-x-6 border-t border-[var(--kit-rule-strong)] pt-4 [&>div]:border-t-0 [&>div]:py-0">
              <PipelineFlyFigure label="Pressure" value={scenarioPressureAt('off', station.kp).toFixed(1)} unit="barg" />
              <PipelineFlyFigure label="Ground" value={String(Math.round(elevationAt(station.kp)))} unit="m" />
              <PipelineFlyFigure label="Gas" value={String(station.temperature)} unit="°C" />
            </dl>
            <PipelineFlyStation station={station} />
            <p className="text-sm leading-6 text-[var(--kit-text-2)]">
              {upstream ? `${(station.kp - upstream.kp).toFixed(0)} km downstream of ${upstream.name}` : 'The start of the line'}
              {downstream ? `, ${(downstream.kp - station.kp).toFixed(0)} km upstream of ${downstream.name}.` : ', the end of the line.'}
            </p>
          </div>
          <div className="col-span-12 flex min-w-0 flex-col gap-8 lg:col-span-7">
            <PipelineFlyPlate number={1} caption={`${station.name} as modelled, seen from the south-east.`}>
              <div className="h-80 w-full bg-[linear-gradient(to_bottom,color-mix(in_oklab,var(--kit-line-sky)_16%,transparent),transparent_70%)]">
                <SceneCanvas label={`3D model of ${station.name}`}>
                  <StillScene>
                    <TurntableStage subjectSize={PIPELINEFLY_STATION_SIZE[station.kind]} padding={0.95}>
                      <StationModel kind={station.kind} />
                    </TurntableStage>
                  </StillScene>
                </SceneCanvas>
              </div>
            </PipelineFlyPlate>
            <PipelineFlyColumn number="02" title="Findings nearest this station">
              <PipelineFlyFindings kp={station.kp} selectedId={null} onSelect={() => undefined} limit={2} />
            </PipelineFlyColumn>
          </div>
        </div>
      </Canvas>
    </LookScope>
  );
}

function PipelineFlyPartProfile() {
  const [kp, setKp] = useState(30);
  const [markId, setMarkId] = useState<string | null>('a-3');

  return (
    <LookScope look="editorial">
      <Canvas className="flex flex-col gap-2">
        <ChainageProfile
          label="Section of the pipeline, on its own"
          totalKm={PIPELINE_TOTAL_KM}
          elevation={PIPELINEFLY_ELEVATION}
          pressure={pipelineFlyPoints(scenarioProfile('off'))}
          maop={PIPELINE_MAOP}
          cursorKp={kp}
          stations={PIPELINEFLY_STATION_MARKS}
          marks={PIPELINEFLY_MARKS}
          selectedMarkId={markId}
          onSelectMark={(id) => setMarkId(id === markId ? null : id)}
          onSeek={setKp}
          height={220}
        />
        <div className="mx-12">
          <Slider aria-label="Cursor position in kilometres" value={[kp]} min={0} max={PIPELINE_TOTAL_KM} step={0.1} onValueChange={(value) => setKp(pipelineFlyClamp(value[0] ?? 0))} />
        </div>
      </Canvas>
    </LookScope>
  );
}

function PipelineFlyPartHeadline() {
  const [kp, setKp] = useState(52);

  return (
    <LookScope look="editorial">
      <Canvas className="flex flex-col gap-6">
        <PipelineFlyHeadline kp={kp} />
        <div className="flex flex-wrap gap-2">
          {axisTicks(12, 72, 20).map((value) => (
            <Button key={value} variant={value === kp ? 'default' : 'outline'} size="sm" onClick={() => setKp(value)}>
              km {value}
            </Button>
          ))}
        </div>
      </Canvas>
    </LookScope>
  );
}

function PipelineFlyPartRoute() {
  return (
    <LookScope look="editorial">
      <Canvas>
        <PipelineFlyPlate number={1} caption="The whole route across the terrain, with stations and kilometre posts.">
          <PipelineFlySceneBand kp={42} mode="overview" still className="h-72" />
        </PipelineFlyPlate>
      </Canvas>
    </LookScope>
  );
}

function PipelineFlyPartStation() {
  const station = PIPELINE_STATIONS.find((candidate) => candidate.id === 'bv-02');

  return (
    <LookScope look="editorial">
      <Canvas>
        <PipelineFlyColumn number="02" title="Nearest station">
          {station ? <PipelineFlyStation station={station} /> : null}
        </PipelineFlyColumn>
      </Canvas>
    </LookScope>
  );
}

function PipelineFlyPartFindings() {
  const [id, setId] = useState<string | null>('a-5');

  return (
    <LookScope look="editorial">
      <Canvas>
        <PipelineFlyColumn number="03" title="Findings near kilometre 56">
          <PipelineFlyFindings kp={56} selectedId={id} onSelect={(next) => setId(next === id ? null : next)} limit={4} />
        </PipelineFlyColumn>
      </Canvas>
    </LookScope>
  );
}

function PipelineFlyPartStretch() {
  return (
    <LookScope look="editorial">
      <Canvas>
        <PipelineFlyColumn number="01" title="This stretch">
          <PipelineFlyStretch kp={44} />
        </PipelineFlyColumn>
      </Canvas>
    </LookScope>
  );
}

export default definePage({
  id: 'pipeline-flythrough',
  title: 'Pipeline fly-through',
  summary:
    'An 84 km export pipeline set as a route survey: the kilometre is the headline, a 3D view from above the pipe and the line in section are its two figures, and one slider flies the reader from landfall to the terminal.',
  guidance: {
    use: [
      'For linear assets — pipelines, cables, roads — where “where along it” is the question behind every other one.',
      'Let one position drive everything: the headline, the 3D view, the cursor on the section and the text columns.',
      'Use the section for comparison along the line and the 3D view for what it looks like on the ground.',
    ],
    avoid: [
      'A camera the reader has to steer; on a line there is only forwards and back.',
      'Travel that loops: it runs to the end of the line and stops.',
      'Findings shown only as markers — list the nearest ones in words with their size and position.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Drag the slider under the section, click the section, or step station by station; Travel plays to the terminal and stops. Click a diamond or a finding to go to it. Switch the camera to see the whole route.',
      specimens: [
        {
          id: 'PipelineFlySignature',
          title: 'Route survey',
          note: 'Pick it when a linear asset is read from one end to the other and the position along it leads every figure.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: [
            'kit/pipeline-flythrough/ChainageProfile.tsx',
            'kit/pipeline-flythrough/chainage.ts',
            'kit/Canvas.tsx',
            'kit/StatusPill.tsx',
            'kit/TagId.tsx',
            'three/fields/PipelineScene.tsx',
            'three/fields/usePlayback.ts',
            'three/SceneCanvas.tsx',
          ],
          Component: PipelineFlySignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Other screens',
      description: 'The same line as a leak response drill, where the text leads and the figures follow, and as a sheet per station.',
      specimens: [
        {
          id: 'PipelineFlyLeak',
          title: 'Leak response drill',
          note: 'Pick it to walk a team through a scenario in steps, with the pressure before and after in one section.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/pipeline-flythrough/ChainageProfile.tsx', 'kit/DataTable.tsx', 'three/fields/PipelineScene.tsx', 'three/fields/hydraulicGradient.ts'],
          Component: PipelineFlyLeak,
        },
        {
          id: 'PipelineFlyStationSheet',
          title: 'Station sheet',
          note: 'Pick it as the reference page for one station: its figures, valves and model, with the line as an index across the top.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['three/fields/StationModel.tsx', 'three/TurntableStage.tsx', 'kit/StatusPill.tsx', 'kit/TagId.tsx'],
          Component: PipelineFlyStationSheet,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The figures and columns of the survey on their own.',
      specimens: [
        {
          id: 'PipelineFlyPartProfile',
          title: 'Chainage profile',
          note: 'Pick it for any route: ground and pressure over distance, stations as rules, findings as markers and a cursor to drag.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/pipeline-flythrough/ChainageProfile.tsx', 'kit/pipeline-flythrough/chainage.ts', 'three/fields/profileGeometry.ts'],
          Component: PipelineFlyPartProfile,
        },
        {
          id: 'PipelineFlyPartHeadline',
          title: 'Kilometre headline',
          note: 'Pick it to open a page about a position: the figure very large, the place as a sentence, three figures beside it.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          Component: PipelineFlyPartHeadline,
        },
        {
          id: 'PipelineFlyPartRoute',
          title: 'Route overview',
          note: 'Pick it as a numbered figure when the reader needs the whole line before the detail.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['three/fields/PipelineScene.tsx', 'three/SceneCanvas.tsx'],
          Component: PipelineFlyPartRoute,
        },
        {
          id: 'PipelineFlyPartStretch',
          title: 'Stretch column',
          note: 'Pick it to say where the reader is between two stations, in a sentence and three distances.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/pipeline-flythrough/chainage.ts'],
          Component: PipelineFlyPartStretch,
        },
        {
          id: 'PipelineFlyPartStation',
          title: 'Station column',
          note: 'Pick it for the facts of one station: pressure, temperature, flow and the position of each valve in words.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/StatusPill.tsx', 'kit/TagId.tsx'],
          Component: PipelineFlyPartStation,
        },
        {
          id: 'PipelineFlyPartFindings',
          title: 'Findings column',
          note: 'Pick it to list inspection findings nearest a position, each with its size, clock position and severity.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/StatusPill.tsx'],
          Component: PipelineFlyPartFindings,
        },
      ],
    },
  ],
});
