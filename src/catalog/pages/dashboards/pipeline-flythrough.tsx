import { Button } from '@cognite/aura/components/button';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import { Slider } from '@cognite/aura/components/slider';
import { IconChevronLeft, IconChevronRight, IconPlayerPause, IconPlayerPlay, IconRoute } from '@cognite/aura/icons';
import { useMemo, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

import { valvePositionStatus } from '../../../library/industrial/diagrams/symbolState';
import { severityStatus } from '../../../library/industrial/status';
import type { Tone } from '../../../library/industrial/status';
import { StatusDot } from '../../../library/industrial/StatusDot';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { waveFronts } from '../../../library/three/fields/hydraulicGradient';
import { PIPELINE_ANOMALIES, PIPELINE_LEAK, PIPELINE_MAOP, PIPELINE_STATIONS, PIPELINE_TOTAL_KM, anomalySeverity, buildPipelineRoute, elevationAt, elevationProfile, leakIsolation, nextLeakStage, scenarioPressureAt, scenarioProfile, stationValves } from '../../../library/three/fields/pipelineData';
import type { LeakStage, PipelineAnomaly, PipelineStation } from '../../../library/three/fields/pipelineData';
import { PipelineScene } from '../../../library/three/fields/PipelineScene';
import { ProfileStrip } from '../../../library/three/fields/ProfileStrip';
import { nearestStation, stationStep } from '../../../library/three/fields/routeSpline';
import { StationModel } from '../../../library/three/fields/StationModel';
import { usePlayback } from '../../../library/three/fields/usePlayback';
import { HudPanel } from '../../../library/three/HudPanel';
import { SceneCanvas } from '../../../library/three/SceneCanvas';
import { SceneLegend } from '../../../library/three/SceneLegend';
import { StillScene } from '../../../library/three/scenes/StillScene';
import { TurntableStage } from '../../../library/three/TurntableStage';
import { definePage } from '../../types';

import source from './pipeline-flythrough.tsx?raw';

const PIPELINEFLY_ROUTE = buildPipelineRoute();
const PIPELINEFLY_ELEVATION = elevationProfile(1);
const PIPELINEFLY_STATION_MARKS = PIPELINE_STATIONS.map((station) => ({ id: station.id, label: station.short, kp: station.kp }));
const PIPELINEFLY_SEVERITY_TONE: Readonly<Record<ReturnType<typeof anomalySeverity>, Tone>> = { critical: 'critical', high: 'critical', medium: 'warning', low: 'info' };
const PIPELINEFLY_ANOMALY_MARKS = PIPELINE_ANOMALIES.map((anomaly) => ({ id: anomaly.id, kp: anomaly.kp, tone: PIPELINEFLY_SEVERITY_TONE[anomalySeverity(anomaly)] }));

const PIPELINEFLY_GLASS = 'border border-default bg-[color-mix(in_oklab,var(--card-background)_78%,transparent)] backdrop-blur-md';
const PIPELINEFLY_FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring-default)]';

const PIPELINEFLY_LEGEND = [
  { kind: 'status', label: 'Severe finding', tone: 'critical', shape: 'diamond' },
  { kind: 'status', label: 'Moderate finding', tone: 'warning', shape: 'square' },
  { kind: 'status', label: 'Minor finding', tone: 'info', shape: 'dot' },
  { kind: 'selection', label: 'Camera and pig' },
] as const;

const PIPELINEFLY_LEAK_TEXT: Readonly<Record<LeakStage, string>> = {
  off: 'Normal operation',
  detected: 'Leak detected, pressure wave moving',
  isolated: 'Segment isolated between block valves',
};

const PIPELINEFLY_LEAK_BUTTON: Readonly<Record<LeakStage, string>> = {
  off: 'Simulate leak',
  detected: 'Isolate segment',
  isolated: 'Reset scenario',
};

type PipelineFlyInitial = { kp?: number; mode?: 'rail' | 'overview'; leak?: LeakStage; anomalyId?: string | null };

function pipelineFlyIsMode(value: unknown): value is 'rail' | 'overview' {
  return value === 'rail' || value === 'overview';
}

function pipelineFlyPoints(points: readonly { kp: number; pressure: number }[]): { kp: number; value: number }[] {
  return points.map((point) => ({ kp: point.kp, value: point.pressure }));
}

function pipelineFlyClamp(kp: number): number {
  return Math.min(PIPELINE_TOTAL_KM, Math.max(0, kp));
}

function PipelineFlyReading({ label, value, unit, decimals = 0, tone }: { label: string; value: number; unit: string; decimals?: number; tone?: Tone }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <ValueReadout value={value} unit={unit} decimals={decimals} size="sm" tone={tone ?? 'neutral'} />
    </div>
  );
}

function PipelineFlyStationCard({ station, kp, stage }: { station: PipelineStation; kp: number; stage: LeakStage }) {
  const pressure = scenarioPressureAt(stage, station.kp);
  const valves = stationValves(station, stage);
  const away = Math.abs(station.kp - kp);

  return (
    <HudPanel title="Nearest station" meta={<span className="font-mono">KP {station.kp}</span>} className="w-full shrink-0">
      <div>
        <p className="text-sm font-medium text-base-foreground">{station.name}</p>
        <p className="text-xs tabular-nums text-muted-foreground">{away < 0.05 ? 'You are here' : `${away.toFixed(1)} km ${station.kp > kp ? 'ahead' : 'behind'}`}</p>
      </div>
      <dl className="grid grid-cols-3 gap-x-3 gap-y-3">
        <PipelineFlyReading label="Pressure" value={pressure} unit="barg" decimals={1} tone={pressure > PIPELINE_MAOP ? 'critical' : 'neutral'} />
        <PipelineFlyReading label="Temperature" value={station.temperature} unit="°C" />
        <PipelineFlyReading label="Flow" value={station.flow} unit="MSm³/d" decimals={1} />
        {station.facts.map((fact) => (
          <PipelineFlyReading key={fact.label} label={fact.label} value={fact.value} unit={fact.unit} decimals={fact.decimals ?? 0} />
        ))}
      </dl>
      {valves.length > 0 ? (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">Valves</span>
          <ul className="flex flex-col gap-0.5">
            {valves.map((valve) => (
              <li key={valve.tag} className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs text-base-foreground">{valve.tag}</span>
                <StatusIndicator {...valvePositionStatus(valve.position)} size="sm" />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No valves at this crossing.</p>
      )}
    </HudPanel>
  );
}

function PipelineFlyFindings({ selectedId, onSelect }: { selectedId: string | null; onSelect: (id: string) => void }) {
  const selected = PIPELINE_ANOMALIES.find((anomaly) => anomaly.id === selectedId);

  return (
    <HudPanel title="Last inspection" meta={`${PIPELINE_ANOMALIES.length} findings`} className="w-full min-h-0 shrink">
      {selected ? <PipelineFlyAnomalyDetail anomaly={selected} /> : null}
      <ul className="flex flex-col">
        {PIPELINE_ANOMALIES.map((anomaly) => {
          const severity = anomalySeverity(anomaly);
          const status = severityStatus(severity);
          return (
            <li key={anomaly.id}>
              <button
                type="button"
                aria-pressed={anomaly.id === selectedId}
                onClick={() => onSelect(anomaly.id)}
                className={`-mx-1.5 flex w-[calc(100%+0.75rem)] items-center justify-between gap-2 rounded-md px-1.5 py-1 text-left hover:bg-secondary-background aria-pressed:bg-secondary-background ${PIPELINEFLY_FOCUS}`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <StatusDot tone={PIPELINEFLY_SEVERITY_TONE[severity]} shape={status.shape} size="sm" />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-xs text-base-foreground">{anomaly.type}</span>
                    <span className="text-xs text-muted-foreground">{status.label}</span>
                  </span>
                </span>
                <span className="shrink-0 font-mono text-xs tabular-nums text-medium-foreground">KP {anomaly.kp}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </HudPanel>
  );
}

function PipelineFlyAnomalyDetail({ anomaly }: { anomaly: PipelineAnomaly }) {
  const status = severityStatus(anomalySeverity(anomaly));

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-default p-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-base-foreground">{anomaly.type}</span>
        <StatusIndicator {...status} size="sm" />
      </div>
      <dl className="grid grid-cols-3 gap-2">
        <PipelineFlyReading label="Depth" value={anomaly.depth} unit="% wall" decimals={anomaly.depth % 1 === 0 ? 0 : 1} />
        <PipelineFlyReading label="Length" value={anomaly.length} unit="mm" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Clock position</span>
          <span className="text-sm font-medium tabular-nums text-base-foreground">{anomaly.clock}</span>
        </div>
      </dl>
      <p className="text-xs tabular-nums text-muted-foreground">Kilometre {anomaly.kp}, {Math.round(elevationAt(anomaly.kp))} m above sea level</p>
    </div>
  );
}

function PipelineFlyTransport({
  kp,
  running,
  onSeek,
  onToggle,
  onStep,
}: {
  kp: number;
  running: boolean;
  onSeek: (kp: number) => void;
  onToggle: () => void;
  onStep: (direction: 1 | -1) => void;
}) {
  const previous = stationStep(PIPELINE_STATIONS, kp, -1);
  const next = stationStep(PIPELINE_STATIONS, kp, 1);

  return (
    <div className={`pointer-events-auto flex items-center gap-3 rounded-lg px-3 py-2 ${PIPELINEFLY_GLASS}`}>
      <Button variant="outline" size="sm" onClick={() => onStep(-1)} disabled={!previous} aria-label={previous ? `Previous station, ${previous.short}` : 'Previous station, none before this point'}>
        <IconChevronLeft /> Previous
      </Button>
      <Button size="sm" onClick={onToggle} aria-label={running ? 'Pause travel' : 'Play travel along the line'}>
        {running ? <IconPlayerPause /> : <IconPlayerPlay />} {running ? 'Pause' : 'Play'}
      </Button>
      <Button variant="outline" size="sm" onClick={() => onStep(1)} disabled={!next} aria-label={next ? `Next station, ${next.short}` : 'Next station, none after this point'}>
        Next <IconChevronRight />
      </Button>
      <div className="flex min-w-48 flex-1 items-center gap-3">
        <Slider aria-label="Distance along the pipeline in kilometres" value={[kp]} min={0} max={PIPELINE_TOTAL_KM} step={0.1} onValueChange={(value) => onSeek(pipelineFlyClamp(value[0] ?? 0))} />
        <span className="w-16 shrink-0 text-right text-xs tabular-nums text-medium-foreground">KP {kp.toFixed(1)}</span>
      </div>
    </div>
  );
}

function PipelineFlyReadouts({ kp, stage, pigKp }: { kp: number; stage: LeakStage; pigKp: number }) {
  const pressure = scenarioPressureAt(stage, kp);
  const margin = PIPELINE_MAOP - pressure;

  return (
    <dl className="flex flex-wrap items-end gap-x-6 gap-y-2">
      <PipelineFlyReading label="Camera at" value={kp} unit="km" decimals={1} />
      <PipelineFlyReading label="Ground" value={Math.round(elevationAt(kp))} unit="m" />
      <PipelineFlyReading label="Pressure here" value={pressure} unit="barg" decimals={1} tone={stage === 'off' ? 'neutral' : 'warning'} />
      <PipelineFlyReading label="Margin to MAOP" value={margin} unit="bar" decimals={1} />
      <PipelineFlyReading label="ILI pig at" value={pigKp} unit="km" decimals={1} />
      <div className="ml-auto flex flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">Scenario</span>
        <StatusIndicator tone={stage === 'off' ? 'neutral' : 'warning'} shape={stage === 'off' ? 'ring' : 'diamond'} label={PIPELINEFLY_LEAK_TEXT[stage]} size="sm" />
      </div>
    </dl>
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
      <SegmentedControlList size="small" aria-label="Camera mode">
        <SegmentedControlButton value="rail">On the rail</SegmentedControlButton>
        <SegmentedControlButton value="overview">Overview</SegmentedControlButton>
      </SegmentedControlList>
    </SegmentedControl>
  );
}

function PipelineFlyFallback() {
  return (
    <ul className="flex flex-col gap-1.5 rounded-lg border border-default bg-card-background p-3 text-sm">
      {PIPELINE_STATIONS.map((station) => (
        <li key={station.id} className="flex items-center justify-between gap-3">
          <span className="truncate">{station.name}</span>
          <span className="font-mono text-xs text-muted-foreground">KP {station.kp}</span>
        </li>
      ))}
    </ul>
  );
}

function PipelineFlyField({ initial = {}, still = false }: { initial?: PipelineFlyInitial; still?: boolean }) {
  const [kp, setKp] = useState(initial.kp ?? 4);
  const [mode, setMode] = useState<'rail' | 'overview'>(initial.mode ?? 'rail');
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState<LeakStage>(initial.leak ?? 'off');
  const [anomalyId, setAnomalyId] = useState<string | null>(initial.anomalyId ?? null);
  const [pigKp, setPigKp] = useState(46.5);
  const [pigRunning, setPigRunning] = useState(false);

  usePlayback({ running, rate: 2.6, value: kp, max: PIPELINE_TOTAL_KM, onValue: setKp, onEnd: () => setRunning(false) });
  usePlayback({ running: pigRunning, rate: 5, value: pigKp, max: PIPELINE_TOTAL_KM, onValue: setPigKp, onEnd: () => setPigRunning(false) });

  const station = nearestStation(PIPELINE_STATIONS, kp);
  const profile = useMemo(() => scenarioProfile(stage), [stage]);
  const base = useMemo(() => scenarioProfile('off'), []);
  const pair = leakIsolation();
  const seek = (next: number) => {
    setKp(pipelineFlyClamp(next));
  };
  const step = (direction: 1 | -1) => {
    const target = stationStep(PIPELINE_STATIONS, kp, direction);
    if (target) seek(target.kp);
  };
  const selectAnomaly = (id: string) => {
    setAnomalyId(id === anomalyId ? null : id);
    const anomaly = PIPELINE_ANOMALIES.find((candidate) => candidate.id === id);
    if (anomaly && id !== anomalyId) seek(anomaly.kp);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && anomalyId !== null) {
      event.preventDefault();
      setAnomalyId(null);
    }
  };

  return (
    <div tabIndex={-1} onKeyDown={onKeyDown} className="flex h-[46rem] w-full flex-col overflow-hidden rounded-xl border border-default bg-base-background outline-none">
      <div className="relative min-h-0 flex-1 bg-[linear-gradient(to_bottom,color-mix(in_oklab,var(--primary-background)_12%,transparent),transparent_60%)]">
        <SceneCanvas
          label={`3D fly-through of an ${PIPELINE_TOTAL_KM} kilometre export pipeline from landfall to the terminal, camera ${mode === 'rail' ? 'riding above the pipe' : 'in overview'} at kilometre ${kp.toFixed(1)}${station ? `, nearest station ${station.name}` : ''}`}
          fallback={<PipelineFlyFallback />}
        >
          <StillScene still={still}>
            <PipelineScene
              route={PIPELINEFLY_ROUTE}
              cameraKp={kp}
              mode={mode}
              pigKp={pigKp}
              leakStage={stage}
              anomalies={PIPELINE_ANOMALIES}
              selectedAnomalyId={anomalyId}
              onSelectAnomaly={selectAnomaly}
              selectedStationId={station?.id ?? null}
              insets={{ right: 304, bottom: 64 }}
            />
          </StillScene>
        </SceneCanvas>

        <div className="pointer-events-none absolute inset-3 z-30 flex gap-3">
          <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
            <div className="flex flex-wrap items-start gap-3">
              <div className={`pointer-events-auto rounded-lg px-2 py-1 ${PIPELINEFLY_GLASS}`}>
                <PipelineFlyModeSwitch mode={mode} onChange={setMode} />
              </div>
              <div className={`pointer-events-auto flex items-center gap-2 rounded-lg px-2 py-1 ${PIPELINEFLY_GLASS}`}>
                <Button variant="outline" size="sm" onClick={() => setStage(nextLeakStage(stage))}>
                  {PIPELINEFLY_LEAK_BUTTON[stage]}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPigKp(0);
                    setPigRunning(true);
                  }}
                >
                  <IconRoute /> Launch pig
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className={`pointer-events-auto self-start rounded-lg px-3 py-2 ${PIPELINEFLY_GLASS}`}>
                <SceneLegend items={PIPELINEFLY_LEGEND} />
              </div>
              <PipelineFlyTransport kp={kp} running={running} onSeek={seek} onToggle={() => setRunning(!running)} onStep={step} />
            </div>
          </div>
          <div className="pointer-events-auto flex min-h-0 w-72 shrink-0 flex-col gap-3 self-start max-h-full">
            {station ? <PipelineFlyStationCard station={station} kp={kp} stage={stage} /> : null}
            <PipelineFlyFindings selectedId={anomalyId} onSelect={selectAnomaly} />
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-3 border-t border-default bg-card-background px-4 py-3">
        <ProfileStrip
          label="Elevation and pressure profile of the pipeline. Click or drag to move the camera to that kilometre; arrow keys step one kilometre."
          totalKm={PIPELINE_TOTAL_KM}
          elevation={PIPELINEFLY_ELEVATION}
          pressure={pipelineFlyPoints(profile)}
          basePressure={stage === 'off' ? undefined : pipelineFlyPoints(base)}
          maop={PIPELINE_MAOP}
          cameraKp={kp}
          pigKp={pigKp}
          stations={PIPELINEFLY_STATION_MARKS}
          anomalies={PIPELINEFLY_ANOMALY_MARKS}
          selectedAnomalyId={anomalyId}
          leak={stage === 'off' ? null : { kp: PIPELINE_LEAK.kp, fronts: waveFronts(PIPELINE_LEAK, PIPELINE_TOTAL_KM) }}
          isolated={stage === 'isolated' && pair ? [pair.upstream.kp, pair.downstream.kp] : null}
          onSeek={seek}
        />
        <PipelineFlyReadouts kp={kp} stage={stage} pigKp={pigKp} />
      </div>
    </div>
  );
}

function PipelineFlyFieldAuraDark() {
  return (
    <ThemeScope preset="aura-dark" className="w-full">
      <PipelineFlyField />
    </ThemeScope>
  );
}

function PipelineFlyFieldEmber() {
  return (
    <ThemeScope preset="ember" className="w-full">
      <PipelineFlyField still initial={{ kp: 56, leak: 'detected' }} />
    </ThemeScope>
  );
}

function PipelineFlyFieldBlueprint() {
  return (
    <ThemeScope preset="blueprint" className="w-full">
      <PipelineFlyField still initial={{ kp: 36, mode: 'overview', anomalyId: 'a-4' }} />
    </ThemeScope>
  );
}

function PipelineFlyStage({ label, children, className = 'h-72' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <ThemeScope preset="aura-dark" className="w-full">
      <div className={`${className} w-full overflow-hidden rounded-xl border border-default bg-base-background`}>
        <SceneCanvas label={label}>
          <StillScene>{children}</StillScene>
        </SceneCanvas>
      </div>
    </ThemeScope>
  );
}

function PipelineFlyPartCompressor() {
  return (
    <PipelineFlyStage label="Compressor station with two skids and a control kiosk beside a pipeline">
      <TurntableStage subjectSize={[30, 6, 24]} padding={0.95}>
        <StationModel kind="compressor" />
      </TurntableStage>
    </PipelineFlyStage>
  );
}

function PipelineFlyPartTerminal() {
  return (
    <PipelineFlyStage label="Terminal with a pig receiver, two storage tanks and a control room">
      <TurntableStage subjectSize={[40, 8, 34]} padding={0.95}>
        <StationModel kind="terminal" />
      </TurntableStage>
    </PipelineFlyStage>
  );
}

function PipelineFlyPartBlockValve() {
  return (
    <PipelineFlyStage label="Block valve station with an actuated valve and an instrument kiosk">
      <TurntableStage subjectSize={[14, 5, 12]} padding={1}>
        <StationModel kind="valve" />
      </TurntableStage>
    </PipelineFlyStage>
  );
}

function PipelineFlyPartCorridor() {
  return (
    <PipelineFlyStage label="Overview of the whole export pipeline across low-poly terrain" className="h-80">
      <PipelineScene route={PIPELINEFLY_ROUTE} cameraKp={42} mode="overview" labels={false} pigKp={46.5} />
    </PipelineFlyStage>
  );
}

function PipelineFlyPartProfile() {
  const [kp, setKp] = useState(30);
  const [stage, setStage] = useState<LeakStage>('off');
  const pair = leakIsolation();

  return (
    <ThemeScope preset="aura-dark" className="w-full">
      <div className="flex w-full flex-col gap-3 rounded-xl border border-default bg-card-background p-4">
        <ProfileStrip
          label="Elevation and pressure profile of the pipeline"
          totalKm={PIPELINE_TOTAL_KM}
          elevation={PIPELINEFLY_ELEVATION}
          pressure={pipelineFlyPoints(scenarioProfile(stage))}
          basePressure={stage === 'off' ? undefined : pipelineFlyPoints(scenarioProfile('off'))}
          maop={PIPELINE_MAOP}
          cameraKp={kp}
          pigKp={46.5}
          stations={PIPELINEFLY_STATION_MARKS}
          anomalies={PIPELINEFLY_ANOMALY_MARKS}
          leak={stage === 'off' ? null : { kp: PIPELINE_LEAK.kp, fronts: waveFronts(PIPELINE_LEAK, PIPELINE_TOTAL_KM) }}
          isolated={stage === 'isolated' && pair ? [pair.upstream.kp, pair.downstream.kp] : null}
          onSeek={setKp}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PipelineFlyReading label="Cursor" value={kp} unit="km" decimals={1} />
          <Button variant="outline" size="sm" onClick={() => setStage(nextLeakStage(stage))}>
            {PIPELINEFLY_LEAK_BUTTON[stage]}
          </Button>
        </div>
      </div>
    </ThemeScope>
  );
}

function PipelineFlyPartStationCard() {
  const station = PIPELINE_STATIONS.find((candidate) => candidate.id === 'bv-02');
  const [stage, setStage] = useState<LeakStage>('off');

  return (
    <ThemeScope preset="aura-dark" className="w-full">
      <div className="flex w-full flex-col items-center gap-3 rounded-xl border border-default bg-base-background p-4">
        {station ? <PipelineFlyStationCard station={station} kp={50} stage={stage} /> : null}
        <Button variant="outline" size="sm" onClick={() => setStage(nextLeakStage(stage))}>
          {PIPELINEFLY_LEAK_BUTTON[stage]}
        </Button>
      </div>
    </ThemeScope>
  );
}

function PipelineFlyPartFindings() {
  const [id, setId] = useState<string | null>('a-5');

  return (
    <ThemeScope preset="aura-dark" className="w-full">
      <div className="flex h-[30rem] w-full justify-center rounded-xl border border-default bg-base-background p-4">
        <div className="flex max-h-full w-72 flex-col">
          <PipelineFlyFindings selectedId={id} onSelect={(next) => setId(next === id ? null : next)} />
        </div>
      </div>
    </ThemeScope>
  );
}

function PipelineFlyPartTransport() {
  const [kp, setKp] = useState(24);
  const [running, setRunning] = useState(false);

  usePlayback({ running, rate: 2.6, value: kp, max: PIPELINE_TOTAL_KM, onValue: setKp, onEnd: () => setRunning(false) });

  return (
    <ThemeScope preset="aura-dark" className="w-full">
      <div className="flex w-full items-center justify-center overflow-x-auto rounded-xl border border-default bg-base-background p-4">
        <PipelineFlyTransport
          kp={kp}
          running={running}
          onSeek={setKp}
          onToggle={() => setRunning(!running)}
          onStep={(direction) => {
            const target = stationStep(PIPELINE_STATIONS, kp, direction);
            if (target) setKp(target.kp);
          }}
        />
      </div>
    </ThemeScope>
  );
}

export default definePage({
  id: 'pipeline-flythrough',
  title: 'Pipeline fly-through',
  summary:
    'An 84 km export pipeline you travel along: the camera rides a rail above the pipe from landfall to the terminal, a profile strip underneath shows the ground, the pressure gradient against its limit and the inspection findings, and a leak scenario shows the wave and the shut-in segment.',
  guidance: {
    use: [
      'For linear assets, where the question is where along the line: pipelines, cables, roads and rail.',
      'With a profile strip under the scene. It shows the whole route at once; the 3D shows one place.',
      'Beside previous and next buttons for stations, so a keyboard or touch user does not have to scrub.',
      'To rehearse a scenario: the leak runs in two steps the operator advances, never on a timer.',
    ],
    avoid: [
      'Free-flying cameras on a long line. A rail keeps the pipe in view and the position meaningful.',
      'Autoplay. Travel and the pig run start from a button and stop at the end of the line.',
      'Drawing the stations to scale along the line. Compress distance and let the profile carry the kilometres.',
      'Showing findings only as pins. The strip and the list reach the same findings without pointing at a small marker.',
    ],
  },
  source,
  sections: [
    {
      id: 'experience',
      title: 'Experience',
      description:
        'Press play, drag the distance slider, or click or drag along the profile to move the camera. Previous and next jump between stations. Click a pin, or a finding in the list, for its depth, length and clock position. Simulate leak shows the pressure wave; the next press isolates the segment between two block valves.',
      specimens: [
        {
          id: 'PipelineFlyFieldAuraDark',
          title: 'Pipeline fly-through',
          note: 'Pick it for linear assets where people travel the line station by station and need the whole route in view at once.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'three/fields/PipelineScene.tsx',
            'three/fields/PipelineCorridor.tsx',
            'three/fields/RailCamera.tsx',
            'three/fields/StationModel.tsx',
            'three/fields/ProfileStrip.tsx',
            'three/fields/routeSpline.ts',
            'three/fields/corridorTerrain.ts',
            'three/fields/hydraulicGradient.ts',
            'three/fields/pipelineData.ts',
            'three/fields/profileGeometry.ts',
            'three/fields/usePlayback.ts',
            'three/HudPanel.tsx',
            'industrial/StatusIndicator.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: PipelineFlyFieldAuraDark,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same fly-through in an amber dark preset with a leak under way, and in a light blueprint preset in overview with one finding open.',
      specimens: [
        {
          id: 'PipelineFlyFieldEmber',
          title: 'Ember, leak detected',
          note: 'Pick it for a high-contrast control room where an abnormal state must stand out against black.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['three/fields/PipelineScene.tsx', 'three/scenes/StillScene.tsx', 'themes/ThemeScope.tsx'],
          Component: PipelineFlyFieldEmber,
        },
        {
          id: 'PipelineFlyFieldBlueprint',
          title: 'Blueprint, overview',
          note: 'Pick it for route planning in daylight: a pale map with the whole line and its findings.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['three/fields/PipelineScene.tsx', 'three/scenes/StillScene.tsx', 'themes/ThemeScope.tsx'],
          Component: PipelineFlyFieldBlueprint,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'Stations on a turntable, the whole corridor, and the panels around the canvas.',
      specimens: [
        {
          id: 'PipelineFlyPartCompressor',
          title: 'Compressor station',
          note: 'Pick it for the station that adds pressure: two skids either side of the line and a control kiosk.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/fields/StationModel.tsx', 'three/TurntableStage.tsx'],
          Component: PipelineFlyPartCompressor,
        },
        {
          id: 'PipelineFlyPartTerminal',
          title: 'Terminal and pig receiver',
          note: 'Pick it for the end of the line: receiver barrel, tanks and a control room.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/fields/StationModel.tsx', 'three/TurntableStage.tsx'],
          Component: PipelineFlyPartTerminal,
        },
        {
          id: 'PipelineFlyPartBlockValve',
          title: 'Block valve station',
          note: 'Pick it where a segment can be shut in: an actuated valve and a kiosk on a small pad.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/fields/StationModel.tsx', 'three/TurntableStage.tsx'],
          Component: PipelineFlyPartBlockValve,
        },
        {
          id: 'PipelineFlyPartCorridor',
          title: 'Corridor overview',
          note: 'Pick it for the whole route at a glance, with the pig marked where it is.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['three/fields/PipelineScene.tsx', 'three/fields/PipelineCorridor.tsx', 'three/fields/corridorTerrain.ts'],
          Component: PipelineFlyPartCorridor,
        },
        {
          id: 'PipelineFlyPartProfile',
          title: 'Elevation and pressure profile',
          note: 'Pick it to show a whole line in one strip and to seek by clicking it. The button plays the leak.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['three/fields/ProfileStrip.tsx', 'three/fields/profileGeometry.ts', 'three/fields/hydraulicGradient.ts'],
          Component: PipelineFlyPartProfile,
        },
        {
          id: 'PipelineFlyPartStationCard',
          title: 'Station card',
          note: 'Pick it for the readings and valve states of one station; the button shows the valves closing in a leak.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/HudPanel.tsx', 'industrial/diagrams/symbolState.ts', 'industrial/StatusIndicator.tsx'],
          Component: PipelineFlyPartStationCard,
        },
        {
          id: 'PipelineFlyPartFindings',
          title: 'Inspection findings',
          note: 'Pick it for the keyboard path to the pins: every finding is a button, and one opens its depth, length and clock position.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/HudPanel.tsx', 'industrial/StatusIndicator.tsx'],
          Component: PipelineFlyPartFindings,
        },
        {
          id: 'PipelineFlyPartTransport',
          title: 'Transport bar',
          note: 'Pick it to drive a rail camera: previous and next station, play and pause, and a distance slider.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['three/fields/usePlayback.ts', 'three/fields/routeSpline.ts'],
          Component: PipelineFlyPartTransport,
        },
      ],
    },
  ],
});
