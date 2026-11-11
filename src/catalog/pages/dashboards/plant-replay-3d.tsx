import { Button } from '@cognite/aura/components/button';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import { Switch } from '@cognite/aura/components/switch';
import {
  IconAlertOctagon,
  IconAlertTriangle,
  IconChevronLeft,
  IconChevronRight,
  IconCircleCheck,
  IconFlame,
  IconHistory,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlayerSkipBack,
  IconPlayerSkipForward,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { AppFrame } from '../../../library/kit/AppFrame';
import { Canvas } from '../../../library/kit/Canvas';
import { Meter } from '../../../library/kit/Meter';
import { Panel } from '../../../library/kit/Panel';
import { neighbourEvent, reachedIndex } from '../../../library/kit/plant-replay-3d/replayLanes';
import { ReplayScrubber, type ScrubberEvent, type ScrubberLane } from '../../../library/kit/plant-replay-3d/ReplayScrubber';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import type { Tone } from '../../../library/kit/tones';
import { TrendLine } from '../../../library/kit/TrendLine';
import { LookScope } from '../../../library/looks/LookScope';
import { CompressorSkid } from '../../../library/three/CompressorSkid';
import { usePlayback } from '../../../library/three/fields/usePlayback';
import { FlareStack } from '../../../library/three/FlareStack';
import type { PlantLayout } from '../../../library/three/plantLayout';
import { EQUIPMENT_SIZES } from '../../../library/three/plantLayout';
import { FlareFlame } from '../../../library/three/plants/FlareFlame';
import { TRIP_DOMAINS, TRIP_IDS, TRIP_MINUTES, TRIP_TAGS_BY_VIEW, tripEvents, tripPhase, tripSceneAt, tripSignals } from '../../../library/three/plants/recompressorTrip';
import type { TripViewpoint } from '../../../library/three/plants/recompressorTrip';
import { ReplayPlantScene } from '../../../library/three/plants/ReplayPlantScene';
import { tagReadingAt } from '../../../library/three/plants/replayScene';
import { tourCameraTarget } from '../../../library/three/plants/tourState';
import type { TourStop } from '../../../library/three/plants/tourState';
import { ValueTag3d } from '../../../library/three/plants/ValueTag3d';
import { SceneCanvas } from '../../../library/three/SceneCanvas';
import { StillScene } from '../../../library/three/scenes/StillScene';
import { TurntableStage } from '../../../library/three/TurntableStage';
import { MINUTE, REFERENCE_NOW, formatTime } from '../../data/series';
import { definePage } from '../../types';

import source from './plant-replay-3d.tsx?raw';

/** The hour around the recompressor trip of 12 March: 13:00 to 14:00 UTC. */
const PLANTREPLAY3D_FROM = REFERENCE_NOW - 60 * MINUTE;

const PLANTREPLAY3D_TO = REFERENCE_NOW;

const PLANTREPLAY3D_TICKS: readonly number[] = [0, 10, 20, 30, 40, 50, 60].map((minute) => PLANTREPLAY3D_FROM + minute * MINUTE);

const plantReplay3dTime = (minute: number): number => PLANTREPLAY3D_FROM + minute * MINUTE;

/** The playhead while playing, held to quarter minutes. */
const plantReplay3dQuantize = (minute: number): number => Math.floor(minute * 4) / 4;

const PLANTREPLAY3D_SIGNALS = tripSignals(PLANTREPLAY3D_FROM);

const PLANTREPLAY3D_EVENTS = tripEvents(PLANTREPLAY3D_FROM);

const PLANTREPLAY3D_MARKERS: readonly ScrubberEvent[] = PLANTREPLAY3D_EVENTS.slice(1).map((event) => ({ id: event.id, t: event.t, label: event.title, tone: event.tone }));

/** A compact Nordkapp plot plan: the compression area and what stands around it. */
const PLANTREPLAY3D_LAYOUT: PlantLayout = {
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
      equipment: [
        { id: '27-pa-2001a', kind: 'pump', tag: '27-PA-2001A', position: [34, 0, -16], scale: 1.3 },
        { id: '27-pa-2001b', kind: 'pump', tag: '27-PA-2001B', position: [34, 0, -6], scale: 1.3 },
      ],
    },
  ],
  scenery: [
    { id: 'scenery-rack', kind: 'pipe-rack', tag: 'Pipe rack', position: [-2, 0, 10], length: 100 },
    { id: 'scenery-flare', kind: 'flare', tag: 'Flare', position: [55, 0, -35] },
    { id: 'scenery-scrubber', kind: 'vertical-vessel', tag: 'Export scrubber', position: [43, 0, -18] },
    { id: 'scenery-tank-a', kind: 'storage-tank', tag: 'Condensate tank A', position: [11, 0, 28], fill: 0.62 },
    { id: 'scenery-control-room', kind: 'control-room', tag: 'Control room', position: [44, 0, 30] },
  ],
  pipes: [
    { id: 'inlet', flow: true, points: [[-64, 1, -18], [-43, 1, -18], [-43, 2.4, -18], [-41, 2.4, -18]] },
    { id: 'k12-feed', flow: true, radius: 0.2, points: [[-11.1, 4, -18], [-11.1, 5.2, -18], [-11.1, 5.2, -14], [6.8, 5.2, -14], [6.8, 5.2, -4], [6.8, 3.3, -3]] },
    { id: 'k3-suction', flow: true, radius: 0.2, points: [[-34, 3.8, -5], [-34, 5.6, -5], [-12.3, 5.6, -5], [-12.3, 5.6, -2], [-12.3, 4, -2]] },
    { id: 'k3-discharge', flow: true, radius: 0.2, points: [[-5.5, 4, -2], [-5.5, 6.2, -2], [7.6, 6.2, -2], [7.6, 3.4, -3]] },
    { id: 'export', flow: true, points: [[11.2, 3.3, -3], [11.2, 6.8, -3], [28, 6.8, -3], [28, 6.8, -16], [28, 1.3, -16], [31.6, 1.3, -16]] },
    { id: 'export-out', flow: true, points: [[32.5, 3, -16], [32.5, 4.2, -16], [47, 4.2, -16], [47, 1.2, -16], [64, 1.2, -16]] },
    { id: 'flare-header', radius: 0.22, points: [[-34, 5.6, -5], [-34, 9, -5], [-34, 9, -35], [52, 9, -35], [52, 1.4, -35], [53.4, 1.4, -35]] },
  ],
};

/** Where the camera stands for each cut. */
const PLANTREPLAY3D_VIEWS: Readonly<Record<TripViewpoint, { label: string; stop: TourStop }>> = {
  wide: { label: 'Whole plant', stop: { focus: [6, 4, -14], distance: 150, azimuth: 24, elevation: 32 } },
  machine: { label: 'Recompressor', stop: { focus: [-9, 3, -2], distance: 54, azimuth: 52, elevation: 34 } },
  flare: { label: 'Flare', stop: { focus: [22, 14, -22], distance: 118, azimuth: 330, elevation: 16 } },
};

const PLANTREPLAY3D_TAG_POSITIONS: Readonly<Record<string, { position: readonly [number, number, number]; side: 'left' | 'right' }>> = {
  'oil-pressure': { position: [-13.5, 2.6, -3.8], side: 'left' },
  'bearing-temperature': { position: [-13.5, 10.4, -3.8], side: 'left' },
  vibration: { position: [-4.5, 2.6, -0.5], side: 'right' },
  speed: { position: [-3, 10.4, -0.5], side: 'right' },
};

const PLANTREPLAY3D_FLARE_TIP: readonly [number, number, number] = [55, 30.85, -35];

/** Lets a kit frame of fixed height hand that height down to its content. */
const PLANTREPLAY3D_FRAME = 'grid-rows-[auto_minmax(0,1fr)] [&_.kit-frame-main]:min-h-0 [&_.kit-canvas]:min-h-0';

/** Scene labels come from the shared 3D library; here they are set in the UI sans like everything else. */
const PLANTREPLAY3D_SCENE = '[&_[data-slot=scene-label]_.font-mono]:font-sans [&_[data-slot=scene-label]_.font-mono]:tabular-nums';

const PLANTREPLAY3D_PHASE_FILL: Readonly<Record<string, string>> = {
  success: 'bg-success-foreground',
  warning: 'bg-warning-foreground',
  critical: 'bg-critical-foreground',
  info: 'bg-info-foreground',
  neutral: 'bg-medium-foreground',
};

const PLANTREPLAY3D_PIPE_STATE: Readonly<Record<string, { label: string; tone: Tone }>> = {
  flowing: { label: 'Flowing', tone: 'success' },
  stopped: { label: 'No flow', tone: 'critical' },
  idle: { label: 'Idle', tone: 'neutral' },
};

type PlantReplay3dCamera = TripViewpoint | 'auto';

function plantReplay3dIsCamera(value: unknown): value is PlantReplay3dCamera {
  return value === 'auto' || value === 'wide' || value === 'machine' || value === 'flare';
}

function plantReplay3dLanes(t: number, ids: readonly string[]): ScrubberLane[] {
  return ids.flatMap((id) => {
    const signal = PLANTREPLAY3D_SIGNALS.find((candidate) => candidate.id === id);
    if (!signal) return [];
    const reading = tagReadingAt(signal, t);
    return [{ id, label: signal.label, valueText: reading.text, tone: reading.tone, points: signal.points, domain: TRIP_DOMAINS[id] ?? [0, 1], limit: signal.limits.high ?? signal.limits.low }];
  });
}

function PlantReplay3dPhaseIcon({ tone }: { tone: string }) {
  if (tone === 'critical') return <IconAlertOctagon aria-hidden="true" className="size-6" />;
  if (tone === 'warning') return <IconAlertTriangle aria-hidden="true" className="size-6" />;
  return <IconCircleCheck aria-hidden="true" className="size-6" />;
}

/** The state of the incident at the playhead: a filled block with the phase, the clock and what just happened. */
function PlantReplay3dPhaseStrip({ t, children }: { t: number; children?: ReactNode }) {
  const index = reachedIndex(PLANTREPLAY3D_EVENTS, t);
  const phase = tripPhase(index);
  const event = PLANTREPLAY3D_EVENTS[Math.max(index, 0)];
  const minute = Math.round((t - PLANTREPLAY3D_FROM) / MINUTE);

  return (
    <div className="flex items-stretch bg-base-background">
      <div className={`flex w-64 shrink-0 items-center gap-3 px-4 py-3 text-base-background ${PLANTREPLAY3D_PHASE_FILL[phase.tone] ?? PLANTREPLAY3D_PHASE_FILL.neutral}`}>
        <PlantReplay3dPhaseIcon tone={phase.tone} />
        <span className="text-xl font-semibold leading-6">{phase.label}</span>
      </div>
      <div className="flex shrink-0 flex-col justify-center border-r border-[var(--kit-rule)] px-5">
        <span className="text-3xl font-medium leading-8 tabular-nums text-base-foreground">{formatTime(t)}</span>
        <span className="text-xs text-muted-foreground">Minute {minute} of 60</span>
      </div>
      <p className="flex min-w-0 flex-1 flex-col justify-center px-5 py-2 text-sm">
        <span className="font-semibold text-base-foreground">{event?.title}</span>
        <span className="text-medium-foreground">{event?.detail}</span>
      </p>
      {children ? <div className="flex shrink-0 items-center gap-4 border-l border-[var(--kit-rule)] px-4">{children}</div> : null}
    </div>
  );
}

function PlantReplay3dTags({ t, view }: { t: number; view: TripViewpoint }) {
  return (
    <>
      {TRIP_TAGS_BY_VIEW[view].flatMap((id) => {
        const signal = PLANTREPLAY3D_SIGNALS.find((candidate) => candidate.id === id);
        const place = PLANTREPLAY3D_TAG_POSITIONS[id];
        if (!signal || !place) return [];
        const reading = tagReadingAt(signal, t);
        return [<ValueTag3d key={id} position={place.position} label={reading.label} value={reading.text} tone={reading.tone} shape={reading.tone === 'critical' ? 'diamond' : reading.tone === 'warning' ? 'square' : 'dot'} side={place.side} />];
      })}
    </>
  );
}

function PlantReplay3dFallback({ t }: { t: number }) {
  return (
    <ul className="flex flex-col gap-2 bg-base-background p-3">
      {PLANTREPLAY3D_SIGNALS.map((signal) => (
        <li key={signal.id} className="flex items-center justify-between gap-3 text-sm text-base-foreground">
          <span>{signal.label}</span>
          <span className="tabular-nums text-medium-foreground">{tagReadingAt(signal, t).text}</span>
        </li>
      ))}
    </ul>
  );
}

/** The plant at the playhead. `view` is the camera cut; `still` freezes pulses, flame and flights. */
function PlantReplay3dScene({ t, view, still, caption = true }: { t: number; view: TripViewpoint; still: boolean; caption?: boolean }) {
  const scene = tripSceneAt(PLANTREPLAY3D_FROM, t);
  const phase = tripPhase(reachedIndex(PLANTREPLAY3D_EVENTS, t));

  return (
    <div className={`relative size-full min-h-0 bg-[radial-gradient(ellipse_at_50%_40%,color-mix(in_oklab,var(--kit-accent)_14%,transparent),transparent_70%)] ${PLANTREPLAY3D_SCENE}`}>
      <SceneCanvas
        label={`3D replay of the recompressor trip at ${formatTime(t)}: ${phase.label.toLowerCase()}, camera on ${PLANTREPLAY3D_VIEWS[view].label.toLowerCase()}`}
        fallback={<PlantReplay3dFallback t={t} />}
        camera={{ position: [60, 60, 100], fov: 40, far: 2000 }}
      >
        <StillScene still={still}>
          <ReplayPlantScene
            layout={PLANTREPLAY3D_LAYOUT}
            beacons={scene.beacons}
            pipes={scene.pipes}
            target={tourCameraTarget(PLANTREPLAY3D_VIEWS[view].stop)}
            insets={{ top: 40, bottom: 8 }}
            labelled={view === 'wide' ? [TRIP_IDS.machine] : []}
          >
            {scene.flaring ? <FlareFlame position={PLANTREPLAY3D_FLARE_TIP} /> : null}
            <PlantReplay3dTags t={t} view={view} />
          </ReplayPlantScene>
        </StillScene>
      </SceneCanvas>
      {caption ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
          <span className="bg-base-background px-2 py-1 font-medium text-base-foreground">Camera · {PLANTREPLAY3D_VIEWS[view].label}</span>
          <span className="bg-base-background px-2 py-1 text-medium-foreground">Drag to orbit · scroll to zoom</span>
        </div>
      ) : null}
    </div>
  );
}

/** The numbered sequence of events. Reached rows are full strength; the latest one is marked. */
function PlantReplay3dEventList({ t, onJump, details = 'near' }: { t: number; onJump: (t: number) => void; details?: 'near' | 'all' }) {
  const current = reachedIndex(PLANTREPLAY3D_EVENTS, t);

  return (
    <ol aria-label="Sequence of events" className="flex flex-col">
      {PLANTREPLAY3D_EVENTS.map((event, index) => {
        const reached = index <= current;
        const active = index === current;
        const tone: Tone = event.tone === 'neutral' ? 'accent' : event.tone;
        return (
          <li key={event.id} className="border-b border-[var(--kit-rule)] last:border-b-0">
            <button
              type="button"
              aria-current={active ? 'step' : undefined}
              onClick={() => onJump(event.t)}
              style={{ boxShadow: active ? `inset 4px 0 0 var(--kit-line-${tone})` : undefined }}
              className={`flex w-full cursor-pointer items-start gap-3 px-3.5 py-2.5 text-left outline-none hover:bg-[var(--kit-well)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring-default)] ${active ? 'bg-[var(--kit-well)]' : ''} ${reached ? '' : 'opacity-55'}`}
            >
              <span
                aria-hidden="true"
                style={{ borderColor: `var(--kit-line-${tone})`, background: reached ? `var(--kit-line-${tone})` : undefined, color: reached ? 'var(--kit-halo)' : `var(--kit-line-${tone})` }}
                className="mt-0.5 flex size-6 shrink-0 items-center justify-center border-2 text-xs font-bold tabular-nums leading-none"
              >
                {index === 0 ? <IconCircleCheck className="size-3.5" /> : index}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-semibold text-base-foreground">{event.title}</span>
                  <span className="shrink-0 text-sm tabular-nums text-medium-foreground">{formatTime(event.t)}</span>
                </span>
                {details === 'all' || active || index === current + 1 ? <span className="text-sm text-medium-foreground">{event.detail}</span> : null}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/** What the scene is showing, as words: machines, lines and the flare at the playhead. A strip under the scene, or rows in a panel. */
function PlantReplay3dPlantState({ t, layout = 'rows' }: { t: number; layout?: 'rows' | 'strip' }) {
  const scene = tripSceneAt(PLANTREPLAY3D_FROM, t);
  const machine = scene.beacons[TRIP_IDS.machine];
  const neighbour = scene.beacons[TRIP_IDS.neighbour];
  const rows: readonly { id: string; name: string; tag?: string; label: string; tone: Tone }[] = [
    { id: 'machine', name: 'Recompressor', tag: '23-KA-9103', label: machine?.text ?? 'Running', tone: machine?.tone ?? 'success' },
    { id: 'neighbour', name: 'Stage 2', tag: '23-KA-9102', label: neighbour?.text ?? 'Running', tone: neighbour?.tone ?? 'success' },
    { id: 'suction', name: 'Suction line', ...(PLANTREPLAY3D_PIPE_STATE[scene.pipes[TRIP_IDS.suction] ?? 'flowing'] ?? PLANTREPLAY3D_PIPE_STATE.flowing) },
    { id: 'discharge', name: 'Discharge line', ...(PLANTREPLAY3D_PIPE_STATE[scene.pipes[TRIP_IDS.discharge] ?? 'flowing'] ?? PLANTREPLAY3D_PIPE_STATE.flowing) },
    { id: 'flare', name: 'Flare', label: scene.flaring ? 'Burning gas' : 'Pilot only', tone: scene.flaring ? 'warning' : 'neutral' },
  ];

  if (layout === 'strip') {
    return (
      <ul aria-label={`Plant state at ${formatTime(t)}`} className="flex gap-px">
        {rows.map((row) => (
          <li key={row.id} className="flex min-w-0 flex-1 flex-col items-start gap-1.5 bg-base-background px-3.5 py-2.5">
            <span className="flex w-full items-baseline gap-2 text-sm">
              <span className="truncate text-base-foreground">{row.name}</span>
              {row.tag ? <TagId className="shrink-0">{row.tag}</TagId> : null}
            </span>
            <StatusPill tone={row.tone} icon={row.id === 'flare' ? <IconFlame /> : undefined}>
              {row.label}
            </StatusPill>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="flex flex-1 flex-col">
      {rows.map((row) => (
        <li key={row.id} className="flex flex-1 items-center justify-between gap-3 border-b border-[var(--kit-rule)] px-3.5 py-2 last:border-b-0">
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm text-base-foreground">{row.name}</span>
            {row.tag ? <TagId>{row.tag}</TagId> : null}
          </span>
          <StatusPill tone={row.tone} icon={row.id === 'flare' ? <IconFlame /> : undefined}>
            {row.label}
          </StatusPill>
        </li>
      ))}
    </ul>
  );
}

function PlantReplay3dTransport({ t, playing, onPlaying, onSeek }: { t: number; playing: boolean; onPlaying: (playing: boolean) => void; onSeek: (t: number) => void }) {
  const previous = neighbourEvent(PLANTREPLAY3D_EVENTS, t, -1);
  const next = neighbourEvent(PLANTREPLAY3D_EVENTS, t, 1);
  const clamp = (value: number) => Math.min(Math.max(value, PLANTREPLAY3D_FROM), PLANTREPLAY3D_TO);
  const atEnd = t >= PLANTREPLAY3D_TO;

  return (
    <div className="flex items-center gap-1.5">
      <Button variant="outline" size="icon-sm" disabled={!previous} aria-label={previous ? `Previous event, ${previous.title}` : 'Previous event, none before this point'} onClick={() => previous && onSeek(previous.t)}>
        <IconPlayerSkipBack />
      </Button>
      <Button variant="outline" size="icon-sm" disabled={t <= PLANTREPLAY3D_FROM} aria-label="Back one minute" onClick={() => onSeek(clamp(t - MINUTE))}>
        <IconChevronLeft />
      </Button>
      <Button size="sm" className="w-24" onClick={() => (atEnd && !playing ? (onSeek(PLANTREPLAY3D_FROM), onPlaying(true)) : onPlaying(!playing))}>
        {playing ? <IconPlayerPause /> : <IconPlayerPlay />} {playing ? 'Pause' : atEnd ? 'Replay' : 'Play'}
      </Button>
      <Button variant="outline" size="icon-sm" disabled={atEnd} aria-label="Forward one minute" onClick={() => onSeek(clamp(t + MINUTE))}>
        <IconChevronRight />
      </Button>
      <Button variant="outline" size="icon-sm" disabled={!next} aria-label={next ? `Next event, ${next.title}` : 'Next event, none after this point'} onClick={() => next && onSeek(next.t)}>
        <IconPlayerSkipForward />
      </Button>
    </div>
  );
}

function PlantReplay3dCameraSwitch({ value, onChange }: { value: PlantReplay3dCamera; onChange: (value: PlantReplay3dCamera) => void }) {
  return (
    <SegmentedControl
      value={value}
      onValueChange={(next) => {
        if (plantReplay3dIsCamera(next)) onChange(next);
      }}
    >
      <SegmentedControlList size="small" aria-label="Camera">
        <SegmentedControlButton value="auto">Follow action</SegmentedControlButton>
        <SegmentedControlButton value="wide">Plant</SegmentedControlButton>
        <SegmentedControlButton value="machine">Machine</SegmentedControlButton>
        <SegmentedControlButton value="flare">Flare</SegmentedControlButton>
      </SegmentedControlList>
    </SegmentedControl>
  );
}

function PlantReplay3dLegend() {
  return (
    <ul aria-label="Timeline key" className="flex items-center gap-4 text-xs text-medium-foreground">
      <li className="flex items-center gap-1.5">
        <span aria-hidden="true" className="h-0.5 w-5 bg-[var(--kit-line-accent)]" /> Reading
      </li>
      <li className="flex items-center gap-1.5">
        <span aria-hidden="true" className="w-5 border-t-2 border-dashed border-[color:var(--kit-line-warning)]" /> Alarm limit
      </li>
      <li className="flex items-center gap-1.5">
        <span aria-hidden="true" className="size-3 border-2 border-[color:var(--kit-line-critical)]" /> Event
      </li>
    </ul>
  );
}

function PlantReplay3dConsole({ initialMinute = 40, still = false }: { initialMinute?: number; still?: boolean }) {
  // Archetype: scene + timeline scrubber. One playhead; the plant, its tags, the event list, the
  //   plant state and the lanes are all pure functions of it, so scrubbing back puts the plant back.
  // Interaction: drag the lanes, use the transport, click a numbered marker or an event row. The
  //   camera follows the action unless a fixed cut is chosen. Play stops by itself at 14:00.
  const [minute, setMinute] = useState(initialMinute);
  const [playing, setPlaying] = useState(false);
  const [camera, setCamera] = useState<PlantReplay3dCamera>('auto');
  const t = plantReplay3dTime(minute);
  const view = camera === 'auto' ? tripSceneAt(PLANTREPLAY3D_FROM, t).viewpoint : camera;

  // Playback moves the playhead in quarter-minute steps: smooth enough to read, and the scene,
  // the tags and the lanes re-render eight times a second instead of on every animation frame.
  usePlayback({ running: playing, rate: 2, value: minute, max: 60, onValue: (value) => setMinute(plantReplay3dQuantize(value)), onEnd: () => setPlaying(false) });

  const seek = (target: number) => {
    setPlaying(false);
    setMinute((target - PLANTREPLAY3D_FROM) / MINUTE);
  };

  return (
    <AppFrame
      className={`h-[54rem] ${PLANTREPLAY3D_FRAME}`}
      brand={{ name: 'Nordkapp', detail: 'Incident review', mark: <IconHistory /> }}
      nav={[
        { id: 'replay', label: 'Replay' },
        { id: 'alarms', label: 'Alarm journal', badge: '5' },
        { id: 'report', label: 'Report' },
      ]}
      current="replay"
      padding="none"
      tools={
        <>
          <span>INC-2026-0312 · Recompressor trip</span>
          <span className="font-medium tabular-nums">12 Mar 2026</span>
        </>
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-px">
        <PlantReplay3dPhaseStrip t={t}>
          <PlantReplay3dCameraSwitch value={camera} onChange={setCamera} />
        </PlantReplay3dPhaseStrip>

        <div className="flex min-h-0 flex-1 gap-px">
          <div className="flex min-w-0 flex-1 flex-col gap-px">
            <div className="min-h-0 flex-1 bg-base-background">
              {/* A paused replay is a still: flow, pulses and camera flights only run while it plays. */}
              <PlantReplay3dScene t={t} view={view} still={still || !playing} />
            </div>
            <PlantReplay3dPlantState t={t} layout="strip" />
          </div>
          <Panel className="w-[21.5rem] shrink-0 overflow-y-auto" title="Sequence of events" subtitle="6 entries · click to jump" padding="none">
            <PlantReplay3dEventList t={t} onJump={seek} />
          </Panel>
        </div>

        <Panel className="h-auto shrink-0" title="Timeline" subtitle="13:00 to 14:00 UTC · drag to scrub" padding="none" actions={<PlantReplay3dLegend />}>
          <div className="flex items-center gap-4 border-b border-[var(--kit-rule)] px-4 py-2">
            <PlantReplay3dTransport t={t} playing={playing} onPlaying={setPlaying} onSeek={seek} />
            <span className="text-sm text-medium-foreground">{playing ? 'Playing at 2 minutes per second' : 'Paused'}</span>
          </div>
          <ReplayScrubber
            label="Replay time"
            from={PLANTREPLAY3D_FROM}
            to={PLANTREPLAY3D_TO}
            value={t}
            onValueChange={seek}
            stepMs={MINUTE}
            lanes={plantReplay3dLanes(t, ['vibration', 'oil-pressure', 'bearing-temperature', 'speed'])}
            events={PLANTREPLAY3D_MARKERS}
            ticks={PLANTREPLAY3D_TICKS}
            formatTime={formatTime}
            className="pt-2"
          />
        </Panel>
      </div>
    </AppFrame>
  );
}

function PlantReplay3dSignature() {
  return (
    <LookScope look="console">
      <PlantReplay3dConsole />
    </LookScope>
  );
}

const PLANTREPLAY3D_EVENT_VIEW: Readonly<Record<string, TripViewpoint>> = { normal: 'wide', warning: 'machine', alarm: 'machine', trip: 'machine', acknowledge: 'flare', restart: 'machine' };

const PLANTREPLAY3D_METER_RANGE: Readonly<Record<string, { min: number; max: number }>> = {
  'oil-pressure': { min: 1, max: 2.8 },
  'bearing-temperature': { min: 70, max: 120 },
  vibration: { min: 0, max: 13 },
  speed: { min: 0, max: 11000 },
};

/** Four readings at one moment as meters with their alarm zones. */
function PlantReplay3dMeters({ t }: { t: number }) {
  return (
    <div className="flex flex-col gap-5">
      {PLANTREPLAY3D_SIGNALS.map((signal) => {
        const reading = tagReadingAt(signal, t);
        const range = PLANTREPLAY3D_METER_RANGE[signal.id] ?? { min: 0, max: 1 };
        return (
          <Meter
            key={signal.id}
            label={signal.label}
            value={reading.value ?? range.min}
            min={range.min}
            max={range.max}
            unit={signal.unit}
            decimals={signal.decimals}
            high={signal.limits.high}
            low={signal.limits.low}
            tone={reading.tone === 'neutral' ? 'accent' : reading.tone}
          />
        );
      })}
    </div>
  );
}

function PlantReplay3dSequence() {
  // A different screen of the same product: the debrief. No scrubber — the reviewer steps from
  // event to event, and the scene, the vibration trend and the meters show that moment.
  const [index, setIndex] = useState(3);
  const event = PLANTREPLAY3D_EVENTS[index] ?? PLANTREPLAY3D_EVENTS[0];
  const t = event?.t ?? PLANTREPLAY3D_FROM;
  const previous = PLANTREPLAY3D_EVENTS[index - 1];
  const vibration = PLANTREPLAY3D_SIGNALS.find((signal) => signal.id === 'vibration');
  const shown = vibration ? vibration.points.filter((_, position) => position % 2 === 0) : [];

  return (
    <LookScope look="console">
      <AppFrame
        className={`h-[52rem] ${PLANTREPLAY3D_FRAME}`}
        brand={{ name: 'Nordkapp', detail: 'Incident review', mark: <IconHistory /> }}
        nav={[
          { id: 'replay', label: 'Replay' },
          { id: 'debrief', label: 'Debrief' },
          { id: 'report', label: 'Report' },
        ]}
        current="debrief"
        padding="none"
        tools={<span>INC-2026-0312 · Recompressor trip</span>}
      >
        <div className="flex h-full min-h-0 gap-px">
          <Panel className="w-80 shrink-0 overflow-y-auto" title="Sequence of events" subtitle="Step through the hour" padding="none">
            <PlantReplay3dEventList t={t} details="all" onJump={(target) => setIndex(Math.max(reachedIndex(PLANTREPLAY3D_EVENTS, target), 0))} />
            <div className="mt-auto flex items-center justify-between gap-2 border-t border-[var(--kit-rule)] p-3">
              <Button variant="outline" size="sm" disabled={index === 0} onClick={() => setIndex(index - 1)}>
                <IconChevronLeft /> Previous
              </Button>
              <span className="text-sm tabular-nums text-medium-foreground">
                {index + 1} of {PLANTREPLAY3D_EVENTS.length}
              </span>
              <Button variant="outline" size="sm" disabled={index === PLANTREPLAY3D_EVENTS.length - 1} onClick={() => setIndex(index + 1)}>
                Next <IconChevronRight />
              </Button>
            </div>
          </Panel>
          <div className="flex min-w-0 flex-1 flex-col gap-px">
            <PlantReplay3dPhaseStrip t={t} />
            <div className="flex min-h-0 flex-1 gap-px">
              <div className="flex min-w-0 flex-1 flex-col gap-px">
                <div className="min-h-0 flex-1 bg-base-background">
                  <PlantReplay3dScene t={t} view={PLANTREPLAY3D_EVENT_VIEW[event?.id ?? 'normal'] ?? 'wide'} still />
                </div>
                <Panel className="h-auto shrink-0" title="Drive-end vibration" subtitle="mm/s · 13:00 to 14:00 · high 7.1 · trip 11.0">
                  <TrendLine
                    label="Drive-end vibration over the hour of the incident against its high and trip limits"
                    labels={shown.map((point) => formatTime(point.t))}
                    unit="mm/s"
                    decimals={1}
                    height={150}
                    yDomain={[0, 13]}
                    showLegend={false}
                    highlightLast={false}
                    series={[{ id: 'vibration', label: 'Vibration', values: shown.map((point) => point.v), tone: 'accent' }]}
                    limits={[
                      { value: 7.1, label: 'High', tone: 'warning' },
                      { value: 11, label: 'Trip', tone: 'critical' },
                    ]}
                  />
                </Panel>
              </div>
              <div className="flex w-72 shrink-0 flex-col gap-px">
                <Panel className="h-auto shrink-0" title="Readings" subtitle={previous ? `${Math.round((t - previous.t) / MINUTE)} min after ${previous.title.toLowerCase()}` : 'at the start of the hour'}>
                  <PlantReplay3dMeters t={t} />
                </Panel>
                <Panel className="min-h-0 flex-1" title="Plant state" subtitle={`at ${formatTime(t)}`} padding="none">
                  <PlantReplay3dPlantState t={t} />
                </Panel>
              </div>
            </div>
          </div>
        </div>
      </AppFrame>
    </LookScope>
  );
}

function PlantReplay3dTablet() {
  // The field tablet: one column at tablet width. Scene on top, a two-lane scrubber under it and
  // the four readings as large figures for a technician standing at the machine.
  const [minute, setMinute] = useState<number>(TRIP_MINUTES.trip);
  const t = plantReplay3dTime(minute);
  const seek = (target: number) => setMinute((target - PLANTREPLAY3D_FROM) / MINUTE);

  return (
    <LookScope look="console">
      <Canvas padding="none" className="flex justify-center py-6">
        <div className="flex w-full max-w-[46rem] flex-col gap-px border border-[var(--kit-rule)]">
          <PlantReplay3dPhaseStrip t={t} />
          <div className="h-80 bg-base-background">
            <PlantReplay3dScene t={t} view="machine" still />
          </div>
          <Panel className="h-auto" title="Timeline" subtitle="Drag to scrub" padding="none">
            <ReplayScrubber
              label="Replay time on the tablet"
              from={PLANTREPLAY3D_FROM}
              to={PLANTREPLAY3D_TO}
              value={t}
              onValueChange={seek}
              stepMs={MINUTE}
              lanes={plantReplay3dLanes(t, ['vibration', 'oil-pressure'])}
              events={PLANTREPLAY3D_MARKERS}
              ticks={PLANTREPLAY3D_TICKS.filter((_, index) => index % 2 === 0)}
              formatTime={formatTime}
              className="pt-2"
            />
          </Panel>
          <div className="grid grid-cols-2 gap-px">
            {PLANTREPLAY3D_SIGNALS.map((signal) => {
              const reading = tagReadingAt(signal, t);
              return (
                <div key={signal.id} className="flex flex-col gap-1 bg-base-background px-4 py-3">
                  <span className="text-sm text-medium-foreground">{signal.label}</span>
                  <span className="text-3xl font-medium tabular-nums" style={{ color: reading.tone === 'neutral' ? undefined : `var(--kit-line-${reading.tone})` }}>
                    {reading.text}
                  </span>
                  <TagId>{signal.tag}</TagId>
                </div>
              );
            })}
          </div>
        </div>
      </Canvas>
    </LookScope>
  );
}

function PlantReplay3dPartScrubber() {
  const [minute, setMinute] = useState(40);
  const [playing, setPlaying] = useState(false);
  const t = plantReplay3dTime(minute);

  usePlayback({ running: playing, rate: 2, value: minute, max: 60, onValue: (value) => setMinute(plantReplay3dQuantize(value)), onEnd: () => setPlaying(false) });

  const seek = (target: number) => {
    setPlaying(false);
    setMinute((target - PLANTREPLAY3D_FROM) / MINUTE);
  };

  return (
    <LookScope look="console">
      <Canvas padding="none">
        <Panel title="Timeline" subtitle="13:00 to 14:00 UTC · drag to scrub" padding="none" actions={<PlantReplay3dLegend />}>
          <div className="flex items-center gap-4 border-b border-[var(--kit-rule)] px-4 py-2">
            <PlantReplay3dTransport t={t} playing={playing} onPlaying={setPlaying} onSeek={seek} />
            <span className="text-sm text-medium-foreground">{playing ? 'Playing at 2 minutes per second' : 'Paused'}</span>
          </div>
          <ReplayScrubber
            label="Replay time, scrubber on its own"
            from={PLANTREPLAY3D_FROM}
            to={PLANTREPLAY3D_TO}
            value={t}
            onValueChange={seek}
            stepMs={MINUTE}
            lanes={plantReplay3dLanes(t, ['vibration', 'oil-pressure', 'bearing-temperature', 'speed'])}
            events={PLANTREPLAY3D_MARKERS}
            ticks={PLANTREPLAY3D_TICKS}
            formatTime={formatTime}
            className="pt-2"
          />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function PlantReplay3dPartPhases() {
  return (
    <LookScope look="console">
      <Canvas padding="none" className="flex flex-col gap-px">
        <PlantReplay3dPhaseStrip t={plantReplay3dTime(12)} />
        <PlantReplay3dPhaseStrip t={plantReplay3dTime(36)} />
        <PlantReplay3dPhaseStrip t={plantReplay3dTime(TRIP_MINUTES.trip)} />
      </Canvas>
    </LookScope>
  );
}

function PlantReplay3dPartEvents() {
  const [t, setT] = useState(plantReplay3dTime(TRIP_MINUTES.alarm + 3));

  return (
    <LookScope look="console">
      <Canvas padding="none" className="h-[27rem]">
        <Panel className="h-full overflow-y-auto" title="Sequence of events" subtitle={`Playhead at ${formatTime(t)}`} padding="none">
          <PlantReplay3dEventList t={t} onJump={setT} />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

const PLANTREPLAY3D_MOMENTS: readonly { id: string; label: string; minute: number }[] = [
  { id: 'before', label: 'Before', minute: 12 },
  { id: 'alarm', label: 'In alarm', minute: 40 },
  { id: 'trip', label: 'Trip', minute: TRIP_MINUTES.trip },
  { id: 'flare', label: 'On flare', minute: 52 },
];

function PlantReplay3dMomentSwitch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <SegmentedControl value={value} onValueChange={(next) => onChange(String(next))}>
      <SegmentedControlList size="small" aria-label="Moment of the incident">
        {PLANTREPLAY3D_MOMENTS.map((moment) => (
          <SegmentedControlButton key={moment.id} value={moment.id}>
            {moment.label}
          </SegmentedControlButton>
        ))}
      </SegmentedControlList>
    </SegmentedControl>
  );
}

function plantReplay3dMomentTime(id: string): number {
  return plantReplay3dTime(PLANTREPLAY3D_MOMENTS.find((moment) => moment.id === id)?.minute ?? 0);
}

function PlantReplay3dPartState() {
  const [moment, setMoment] = useState('trip');
  const t = plantReplay3dMomentTime(moment);

  return (
    <LookScope look="console">
      <Canvas padding="none" className="h-[27rem]">
        <Panel className="h-full" title="Plant state" subtitle={`at ${formatTime(t)}`} padding="none">
          <div className="border-b border-[var(--kit-rule)] px-3.5 py-2.5">
            <PlantReplay3dMomentSwitch value={moment} onChange={setMoment} />
          </div>
          <PlantReplay3dPlantState t={t} />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function PlantReplay3dPartMeters() {
  const [moment, setMoment] = useState('alarm');
  const t = plantReplay3dMomentTime(moment);

  return (
    <LookScope look="console">
      <Canvas padding="none" className="h-[27rem]">
        <Panel className="h-full" title="Readings" subtitle={`at ${formatTime(t)}`}>
          <div className="flex flex-1 flex-col justify-between gap-4">
            <PlantReplay3dMomentSwitch value={moment} onChange={setMoment} />
            <PlantReplay3dMeters t={t} />
          </div>
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function PlantReplay3dPartMachine() {
  const [moment, setMoment] = useState('trip');
  const t = plantReplay3dMomentTime(moment);
  const beacon = tripSceneAt(PLANTREPLAY3D_FROM, t).beacons[TRIP_IDS.machine] ?? {};

  return (
    <LookScope look="console">
      <Canvas padding="none">
        <Panel title="Recompressor" subtitle="23-KA-9103" padding="none" actions={<PlantReplay3dMomentSwitch value={moment} onChange={setMoment} />}>
          <div className="h-64 w-full">
            <SceneCanvas label={`Recompressor with its status ring: ${beacon.text ?? 'running'}`}>
              <StillScene>
                <TurntableStage subjectSize={EQUIPMENT_SIZES.compressor}>
                  <CompressorSkid tone={beacon.tone} pulse={beacon.pulse} />
                </TurntableStage>
              </StillScene>
            </SceneCanvas>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-[var(--kit-rule)] px-3.5 py-2.5">
            <span className="text-sm text-medium-foreground">Status ring at {formatTime(t)}</span>
            <StatusPill tone={beacon.tone ?? 'success'}>{beacon.text ?? 'Running'}</StatusPill>
          </div>
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function PlantReplay3dPartFlare() {
  const [burning, setBurning] = useState(true);

  return (
    <LookScope look="console">
      <Canvas padding="none">
        <Panel title="Flare" subtitle="Lit when gas is routed to it" padding="none" actions={<Switch label="Gas routed to flare" checked={burning} onCheckedChange={(checked) => setBurning(checked)} />}>
          <div className="h-64 w-full">
            <SceneCanvas label={`Flare stack ${burning ? 'burning gas routed to it' : 'with only its pilot lit'}`}>
              <StillScene>
                <TurntableStage subjectSize={[10, 40, 10]} padding={1}>
                  <FlareStack />
                  {burning ? <FlareFlame position={[0, 30.85, 0]} /> : null}
                </TurntableStage>
              </StillScene>
            </SceneCanvas>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-[var(--kit-rule)] px-3.5 py-2.5">
            <span className="text-sm text-medium-foreground">Flare state</span>
            <StatusPill tone={burning ? 'warning' : 'neutral'} icon={<IconFlame />}>
              {burning ? 'Burning routed gas' : 'Pilot only'}
            </StatusPill>
          </div>
        </Panel>
      </Canvas>
    </LookScope>
  );
}

export default definePage({
  id: 'plant-replay-3d',
  title: 'Incident replay in 3D',
  summary:
    'An operator console that replays a compressor trip inside the plant model: one playhead drives the 3D scene, the readings pinned to the machine, the sequence of events and a lane-per-signal timeline.',
  guidance: {
    use: [
      'For incident reviews, where the order of events and where they happened matter as much as the values.',
      'Keep one playhead: scene, tags, event list and lanes must all be functions of it, so scrubbing back restores the plant.',
      'Number the events once and reuse the numbers on the timeline and in the list.',
    ],
    avoid: [
      'Playback that loops or runs without a stop: play ends at the end of the window.',
      'Showing state in the scene only: every ring and flame is repeated as a word in the plant state panel.',
      'Moving the camera on every scrub step — cut only when the action moves, and let the user hold a view.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Drag the lanes or press Play; click a numbered marker or an event row to jump. Drag the scene to orbit, scroll to zoom, and pick a fixed camera to stop it following the action.',
      specimens: [
        {
          id: 'PlantReplay3dSignature',
          title: 'Replay console',
          note: 'Pick it when a team reviews an incident together and needs the plant, the readings and the clock on one screen.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/plant-replay-3d/ReplayScrubber.tsx', 'kit/plant-replay-3d/replayLanes.ts', 'kit/AppFrame.tsx', 'kit/Panel.tsx', 'kit/StatusPill.tsx', 'three/plants/ReplayPlantScene.tsx', 'three/plants/ValueTag3d.tsx', 'three/SceneCanvas.tsx'],
          Component: PlantReplay3dSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Other screens',
      description: 'The same incident as a debrief that steps event by event, and as a single column for a tablet at the machine.',
      specimens: [
        {
          id: 'PlantReplay3dSequence',
          title: 'Debrief, event by event',
          note: 'Pick it for the written review: step through the events and read the scene, the trend and the meters at each one.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/TrendLine.tsx', 'kit/Meter.tsx', 'kit/Panel.tsx', 'three/plants/ReplayPlantScene.tsx'],
          Component: PlantReplay3dSequence,
        },
        {
          id: 'PlantReplay3dTablet',
          title: 'Tablet at the machine',
          note: 'Pick it for a technician in the field: one column, two lanes and the four readings as large figures.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/plant-replay-3d/ReplayScrubber.tsx', 'kit/TagId.tsx', 'three/plants/ReplayPlantScene.tsx'],
          Component: PlantReplay3dTablet,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The panels of the console on their own.',
      specimens: [
        {
          id: 'PlantReplay3dPartScrubber',
          title: 'Timeline scrubber',
          note: 'Pick it for any replay: a lane per signal with its limit, numbered events and a playhead you can drag or step.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/plant-replay-3d/ReplayScrubber.tsx', 'kit/plant-replay-3d/replayLanes.ts', 'three/fields/usePlayback.ts'],
          Component: PlantReplay3dPartScrubber,
        },
        {
          id: 'PlantReplay3dPartPhases',
          title: 'Phase strip',
          note: 'Pick it as the first line of an incident screen: the phase as a filled block, the clock and the latest event in a sentence.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          Component: PlantReplay3dPartPhases,
        },
        {
          id: 'PlantReplay3dPartEvents',
          title: 'Sequence of events',
          note: 'Pick it beside a replay: reached events are full strength, the latest is marked and each row jumps the playhead.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/plant-replay-3d/replayLanes.ts'],
          Component: PlantReplay3dPartEvents,
        },
        {
          id: 'PlantReplay3dPartState',
          title: 'Plant state',
          note: 'Pick it to say in words what the scene shows in rings, chevrons and flame.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/StatusPill.tsx', 'kit/TagId.tsx'],
          Component: PlantReplay3dPartState,
        },
        {
          id: 'PlantReplay3dPartMeters',
          title: 'Readings at a moment',
          note: 'Pick it when the position of a reading inside its alarm zones matters more than its history.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Meter.tsx', 'kit/Panel.tsx'],
          Component: PlantReplay3dPartMeters,
        },
        {
          id: 'PlantReplay3dPartMachine',
          title: 'Machine with status ring',
          note: 'Pick it to show one machine and how its ring changes through the incident.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['three/CompressorSkid.tsx', 'three/TurntableStage.tsx', 'kit/StatusPill.tsx'],
          Component: PlantReplay3dPartMachine,
        },
        {
          id: 'PlantReplay3dPartFlare',
          title: 'Flare stack',
          note: 'Pick it where routing gas to flare is part of the story; the flame is always paired with the state in words.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['three/FlareStack.tsx', 'three/plants/FlareFlame.tsx', 'three/TurntableStage.tsx'],
          Component: PlantReplay3dPartFlare,
        },
      ],
    },
  ],
});
