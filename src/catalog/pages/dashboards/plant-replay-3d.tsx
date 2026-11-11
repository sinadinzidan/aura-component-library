import { Button } from '@cognite/aura/components/button';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import { Slider } from '@cognite/aura/components/slider';
import { Switch } from '@cognite/aura/components/switch';
import { useState } from 'react';

import { stateAt } from '../../../library/experiences/journeys/replayState';
import type { ReplayCause } from '../../../library/experiences/journeys/replayState';
import { ReplayTimeline } from '../../../library/experiences/journeys/ReplayTimeline';
import type { ReplayMarker } from '../../../library/experiences/journeys/ReplayTimeline';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { CompressorSkid } from '../../../library/three/CompressorSkid';
import { FlareStack } from '../../../library/three/FlareStack';
import { HudPanel } from '../../../library/three/HudPanel';
import type { PlantLayout } from '../../../library/three/plantLayout';
import { EQUIPMENT_SIZES } from '../../../library/three/plantLayout';
import { FlareFlame } from '../../../library/three/plants/FlareFlame';
import {
  TRIP_DOMAINS,
  TRIP_IDS,
  TRIP_MINUTES,
  TRIP_TAGS_BY_VIEW,
  tripEvents,
  tripPhase,
  tripSceneAt,
  tripSignals,
} from '../../../library/three/plants/recompressorTrip';
import type { TripViewpoint } from '../../../library/three/plants/recompressorTrip';
import { ReplayEventLog } from '../../../library/three/plants/ReplayEventLog';
import { ReplayMiniTrend } from '../../../library/three/plants/ReplayMiniTrend';
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

const plantReplay3dMinute = (minute: number): number => PLANTREPLAY3D_FROM + minute * MINUTE;

const PLANTREPLAY3D_SIGNALS = tripSignals(PLANTREPLAY3D_FROM);
const PLANTREPLAY3D_EVENTS = tripEvents(PLANTREPLAY3D_FROM);
const PLANTREPLAY3D_REPLAY = { signals: PLANTREPLAY3D_SIGNALS, events: PLANTREPLAY3D_EVENTS, causes: [] as readonly ReplayCause[] };
const PLANTREPLAY3D_MARKERS: readonly ReplayMarker[] = PLANTREPLAY3D_EVENTS.slice(1).map((event) => ({ id: event.id, t: event.t, label: event.title, tone: event.tone }));

/** A compact Nordkapp plot plan: the compression area and what stands around it, in the explorer's coordinates. */
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
  'oil-pressure': { position: [-13.5, 4.2, -3.8], side: 'left' },
  'bearing-temperature': { position: [-13.5, 6.8, -3.8], side: 'left' },
  vibration: { position: [-4.5, 4.2, -0.5], side: 'right' },
  speed: { position: [-4.5, 6.8, -0.5], side: 'right' },
};

const PLANTREPLAY3D_VIEW_ORDER: readonly TripViewpoint[] = ['wide', 'machine', 'flare'];

const PLANTREPLAY3D_CARD = 'rounded-xl border border-default bg-card-background';
const PLANTREPLAY3D_GLASS = 'border border-default bg-[color-mix(in_oklab,var(--card-background)_78%,transparent)] backdrop-blur-md';
const PLANTREPLAY3D_FLARE_TIP: readonly [number, number, number] = [55, 30.85, -35];

function plantReplay3dIsView(value: unknown): value is TripViewpoint {
  return value === 'wide' || value === 'machine' || value === 'flare';
}

function plantReplay3dTarget(view: TripViewpoint) {
  return tourCameraTarget(PLANTREPLAY3D_VIEWS[view].stop);
}

function PlantReplay3dTags({ t, view }: { t: number; view: TripViewpoint }) {
  return (
    <>
      {TRIP_TAGS_BY_VIEW[view].flatMap((id) => {
        const signal = PLANTREPLAY3D_SIGNALS.find((candidate) => candidate.id === id);
        const place = PLANTREPLAY3D_TAG_POSITIONS[id];
        if (!signal || !place) return [];
        const reading = tagReadingAt(signal, t);
        return [
          <ValueTag3d
            key={id}
            position={place.position}
            label={reading.label}
            value={reading.text}
            tone={reading.tone}
            shape={reading.tone === 'critical' ? 'diamond' : reading.tone === 'warning' ? 'square' : 'dot'}
            side={place.side}
          />,
        ];
      })}
    </>
  );
}

function PlantReplay3dScene({ t, view, still }: { t: number; view: TripViewpoint; still: boolean }) {
  const scene = tripSceneAt(PLANTREPLAY3D_FROM, t);
  return (
    <StillScene still={still}>
      <ReplayPlantScene
        layout={PLANTREPLAY3D_LAYOUT}
        beacons={scene.beacons}
        pipes={scene.pipes}
        target={plantReplay3dTarget(view)}
        insets={{ top: 52, bottom: 8 }}
        labelled={view === 'wide' ? [TRIP_IDS.machine] : []}
      >
        {scene.flaring ? <FlareFlame position={PLANTREPLAY3D_FLARE_TIP} /> : null}
        <PlantReplay3dTags t={t} view={view} />
      </ReplayPlantScene>
    </StillScene>
  );
}

function PlantReplay3dFallbackList({ t }: { t: number }) {
  const state = stateAt(PLANTREPLAY3D_REPLAY, t);
  return (
    <ul className="flex flex-col gap-2 rounded-lg border border-default bg-card-background p-3">
      {state.readings.map((reading) => (
        <li key={reading.id} className="flex items-center justify-between gap-3 text-sm text-base-foreground">
          <span>{reading.label}</span>
          <span className="tabular-nums text-muted-foreground">{reading.value === null ? 'No data' : `${reading.value} ${reading.unit}`}</span>
        </li>
      ))}
    </ul>
  );
}

function PlantReplay3dTrends({ t }: { t: number }) {
  return (
    <div className="flex flex-col gap-3">
      {['vibration', 'oil-pressure', 'speed'].flatMap((id) => {
        const signal = PLANTREPLAY3D_SIGNALS.find((candidate) => candidate.id === id);
        if (!signal) return [];
        return [<ReplayMiniTrend key={id} signal={signal} from={PLANTREPLAY3D_FROM} to={PLANTREPLAY3D_TO} cursor={t} domain={TRIP_DOMAINS[id] ?? [0, 1]} />];
      })}
    </div>
  );
}

function PlantReplay3dExperience({ initialMinute = 40, still = false }: { initialMinute?: number; still?: boolean }) {
  // Archetype: a replay inside the scene. One playhead; the plant, the tags, the log and the
  //   trends are all pure functions of it, so scrubbing back puts the plant back.
  // Interaction: scrub or press Play (it stops at the end); click an event marker or a log row to
  //   jump. The camera cuts to the action unless Follow action is switched off.
  const [t, setT] = useState(plantReplay3dMinute(initialMinute));
  const [playing, setPlaying] = useState(false);
  const [following, setFollowing] = useState(true);
  const [held, setHeld] = useState<TripViewpoint>('wide');
  const scene = tripSceneAt(PLANTREPLAY3D_FROM, t);
  const view = following ? scene.viewpoint : held;
  const state = stateAt(PLANTREPLAY3D_REPLAY, t);
  const phase = tripPhase(state.eventIndex);

  const jump = (target: number) => {
    setPlaying(false);
    setT(target);
  };
  const follow = (next: boolean) => {
    // Switching it off keeps the camera where the action had taken it.
    if (!next) setHeld(scene.viewpoint);
    setFollowing(next);
  };

  return (
    <section aria-label="Incident replay in 3D, recompressor trip" className="flex h-[52rem] w-full flex-col gap-3 rounded-xl border border-default bg-base-background p-3">
      <div className="flex min-h-0 flex-1 gap-3">
        <div className="relative min-w-0 flex-1 overflow-hidden rounded-lg border border-default bg-muted-background">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,color-mix(in_oklab,var(--primary-background)_12%,transparent),transparent_65%)]" />
          <SceneCanvas
            label={`3D replay of the recompressor trip at ${formatTime(t)}: ${phase.label.toLowerCase()}, camera on ${PLANTREPLAY3D_VIEWS[view].label.toLowerCase()}`}
            fallback={<PlantReplay3dFallbackList t={t} />}
            camera={{ position: [60, 60, 100], fov: 40, far: 2000 }}
          >
            <PlantReplay3dScene t={t} view={view} still={still} />
          </SceneCanvas>
          <div className="pointer-events-none absolute inset-x-3 top-3 z-30 flex items-start justify-between gap-3">
            <div className={`pointer-events-auto flex flex-col gap-1 rounded-lg px-3 py-2 ${PLANTREPLAY3D_GLASS}`}>
              <span className="text-sm font-semibold text-base-foreground">Recompressor trip, 23-KA-9103</span>
              <StatusIndicator tone={phase.tone} shape={phase.tone === 'critical' ? 'diamond' : phase.tone === 'warning' ? 'square' : 'dot'} label={phase.label} detail={`at ${formatTime(t)}`} size="sm" />
            </div>
            <div className={`pointer-events-auto flex items-center gap-3 rounded-lg px-3 py-2 ${PLANTREPLAY3D_GLASS}`}>
              <span className="text-xs text-muted-foreground">Camera: {PLANTREPLAY3D_VIEWS[view].label}</span>
              <Switch label="Follow action" checked={following} onCheckedChange={(checked) => follow(checked)} />
            </div>
          </div>
        </div>

        <aside aria-label="Event log and trends" className="flex w-72 shrink-0 flex-col gap-3 overflow-y-auto">
          <section className={`${PLANTREPLAY3D_CARD} flex flex-col gap-2 p-3`}>
            <h4 className="text-sm font-semibold text-base-foreground">Event log</h4>
            <ReplayEventLog events={PLANTREPLAY3D_EVENTS} eventIndex={state.eventIndex} formatTime={formatTime} onJump={jump} label="Events of the incident" />
          </section>
          <section className={`${PLANTREPLAY3D_CARD} flex flex-col gap-2 p-3`}>
            <h4 className="text-sm font-semibold text-base-foreground">Trends to {formatTime(t)}</h4>
            <PlantReplay3dTrends t={t} />
          </section>
        </aside>
      </div>

      <div className={`${PLANTREPLAY3D_CARD} p-3`}>
        <ReplayTimeline
          from={PLANTREPLAY3D_FROM}
          to={PLANTREPLAY3D_TO}
          value={t}
          onValueChange={setT}
          playing={playing}
          onPlayingChange={setPlaying}
          markers={PLANTREPLAY3D_MARKERS}
          stepMs={MINUTE}
          stepLabel="1 min"
          ticks={PLANTREPLAY3D_TICKS}
          formatTime={formatTime}
          label="Replay of the recompressor trip"
        />
      </div>
    </section>
  );
}

function PlantReplay3dEmber() {
  return (
    <ThemeScope preset="ember" className="w-full">
      <PlantReplay3dExperience />
    </ThemeScope>
  );
}

function PlantReplay3dControlRoom() {
  return (
    <ThemeScope preset="control-room" className="w-full">
      <PlantReplay3dExperience initialMinute={TRIP_MINUTES.trip} still />
    </ThemeScope>
  );
}

function PlantReplay3dHologram() {
  return (
    <ThemeScope preset="hologram" className="w-full">
      <PlantReplay3dExperience initialMinute={TRIP_MINUTES.acknowledge + 2} still />
    </ThemeScope>
  );
}

function PlantReplay3dPartTimeline() {
  const [t, setT] = useState(plantReplay3dMinute(40));
  const [playing, setPlaying] = useState(false);
  return (
    <ThemeScope preset="ember" className="w-full">
      <div className={`${PLANTREPLAY3D_CARD} w-full p-4`}>
        <ReplayTimeline
          from={PLANTREPLAY3D_FROM}
          to={PLANTREPLAY3D_TO}
          value={t}
          onValueChange={setT}
          playing={playing}
          onPlayingChange={setPlaying}
          markers={PLANTREPLAY3D_MARKERS}
          stepMs={MINUTE}
          stepLabel="1 min"
          ticks={PLANTREPLAY3D_TICKS}
          formatTime={formatTime}
          label="Replay of the recompressor trip"
        />
      </div>
    </ThemeScope>
  );
}

function PlantReplay3dMinuteSlider({ minute, onChange }: { minute: number; onChange: (minute: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-xs tabular-nums text-muted-foreground">{formatTime(plantReplay3dMinute(minute))}</span>
      <Slider aria-label="Replay time" value={[minute]} min={0} max={60} step={1} onValueChange={(value) => onChange(value[0] ?? 0)} />
    </div>
  );
}

function PlantReplay3dPartLog() {
  const [minute, setMinute] = useState(47);
  const state = stateAt(PLANTREPLAY3D_REPLAY, plantReplay3dMinute(minute));
  return (
    <ThemeScope preset="ember" className="w-full">
      <div className={`${PLANTREPLAY3D_CARD} flex w-full flex-col gap-3 p-3`}>
        <ReplayEventLog events={PLANTREPLAY3D_EVENTS} eventIndex={state.eventIndex} formatTime={formatTime} onJump={(target) => setMinute(Math.round((target - PLANTREPLAY3D_FROM) / MINUTE))} />
        <PlantReplay3dMinuteSlider minute={minute} onChange={setMinute} />
      </div>
    </ThemeScope>
  );
}

function PlantReplay3dPartTrends() {
  const [minute, setMinute] = useState(46);
  return (
    <ThemeScope preset="ember" className="w-full">
      <div className={`${PLANTREPLAY3D_CARD} flex w-full flex-col gap-3 p-3`}>
        <PlantReplay3dTrends t={plantReplay3dMinute(minute)} />
        <PlantReplay3dMinuteSlider minute={minute} onChange={setMinute} />
      </div>
    </ThemeScope>
  );
}

function PlantReplay3dPartFlame() {
  const [burning, setBurning] = useState(true);
  return (
    <ThemeScope preset="ember" className="w-full">
      <div className="flex w-full flex-col gap-3 rounded-xl border border-default bg-base-background p-3">
        <div className="h-60 w-full">
          <SceneCanvas label={`Flare stack ${burning ? 'burning gas routed to it' : 'with only its pilot lit'}`}>
            <StillScene>
              <TurntableStage subjectSize={[10, 40, 10]} padding={1}>
                <FlareStack />
                {burning ? <FlareFlame position={[0, 30.85, 0]} /> : null}
              </TurntableStage>
            </StillScene>
          </SceneCanvas>
        </div>
        <Switch label={burning ? 'Gas routed to flare' : 'Pilot only'} checked={burning} onCheckedChange={(checked) => setBurning(checked)} />
      </div>
    </ThemeScope>
  );
}

function PlantReplay3dPartBeacon() {
  const [minute, setMinute] = useState(46);
  const t = plantReplay3dMinute(minute);
  const beacon = tripSceneAt(PLANTREPLAY3D_FROM, t).beacons[TRIP_IDS.machine] ?? {};
  return (
    <ThemeScope preset="ember" className="w-full">
      <div className="flex w-full flex-col gap-3 rounded-xl border border-default bg-base-background p-3">
        <div className="h-60 w-full">
          <SceneCanvas label={`Recompressor with status ring: ${beacon.text ?? 'normal'}`}>
            <StillScene>
              <TurntableStage subjectSize={EQUIPMENT_SIZES.compressor}>
                <CompressorSkid tone={beacon.tone} pulse={beacon.pulse} />
              </TurntableStage>
            </StillScene>
          </SceneCanvas>
        </div>
        <div className="flex items-center justify-between gap-3">
          <StatusIndicator tone={beacon.tone ?? 'success'} shape={beacon.shape ?? 'dot'} label={beacon.text ?? 'Running'} size="sm" />
        </div>
        <PlantReplay3dMinuteSlider minute={minute} onChange={setMinute} />
      </div>
    </ThemeScope>
  );
}

function PlantReplay3dPartTags() {
  const [minute, setMinute] = useState(46);
  const t = plantReplay3dMinute(minute);
  return (
    <ThemeScope preset="ember" className="w-full">
      <div className="flex w-full flex-col gap-3 rounded-xl border border-default bg-base-background p-3">
        <div className="h-60 w-full">
          <SceneCanvas label="Recompressor with floating readings at the playhead">
            <StillScene>
              <TurntableStage subjectSize={[26, 6, 6]} padding={1}>
                <CompressorSkid />
                <PlantReplay3dTags t={t} view="machine" />
              </TurntableStage>
            </StillScene>
          </SceneCanvas>
        </div>
        <PlantReplay3dMinuteSlider minute={minute} onChange={setMinute} />
      </div>
    </ThemeScope>
  );
}

function PlantReplay3dPartViewpoints() {
  const [view, setView] = useState<TripViewpoint>('machine');
  return (
    <ThemeScope preset="ember" className="w-full">
      <div className="flex w-full flex-col gap-3 rounded-xl border border-default bg-base-background p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedControl
            value={view}
            onValueChange={(next) => {
              if (plantReplay3dIsView(next)) setView(next);
            }}
          >
            <SegmentedControlList size="small" aria-label="Camera viewpoint">
              {PLANTREPLAY3D_VIEW_ORDER.map((id) => (
                <SegmentedControlButton key={id} value={id}>
                  {PLANTREPLAY3D_VIEWS[id].label}
                </SegmentedControlButton>
              ))}
            </SegmentedControlList>
          </SegmentedControl>
          <span className="text-xs text-muted-foreground">The three pre-set viewpoints the replay cuts between</span>
        </div>
        <div className="h-80 w-full overflow-hidden rounded-lg border border-default">
          <SceneCanvas label={`The plant at the moment of the trip, seen from the ${PLANTREPLAY3D_VIEWS[view].label.toLowerCase()} viewpoint`}>
            <PlantReplay3dScene t={plantReplay3dMinute(TRIP_MINUTES.acknowledge + 1)} view={view} still />
          </SceneCanvas>
        </div>
      </div>
    </ThemeScope>
  );
}

function PlantReplay3dPartHud() {
  return (
    <ThemeScope preset="ember" className="w-full">
      <div className="flex w-full justify-center rounded-xl border border-default bg-base-background p-4">
        <HudPanel title="Replay status" meta={formatTime(plantReplay3dMinute(46))} className="w-72">
          <StatusIndicator tone="critical" shape="diamond" label={tripPhase(3).label} detail={`at ${formatTime(plantReplay3dMinute(46))}`} size="sm" />
          <Button size="sm" variant="outline">
            Jump to the trip
          </Button>
        </HudPanel>
      </div>
    </ThemeScope>
  );
}

export default definePage({
  id: 'plant-replay-3d',
  title: 'Incident replay in 3D',
  summary:
    'The recompressor trip played back inside the plant itself. One playhead drives everything: status rings change tone at the right minute, the machine pulses when it trips, chevrons stop on its lines, the flare lights, and the camera cuts to wherever the action is.',
  guidance: {
    use: [
      'When people need to understand an incident in space: which machine, which lines, where the gas went.',
      'With a timeline of event markers and a log that follows it: the scene shows where, the log says what and when.',
      'With a camera that follows the action, and a switch to turn that off so people can look around.',
      'When every element is a pure function of the playhead: scrubbing back must put the plant back.',
    ],
    avoid: [
      'Auto-playing on load: playback starts when the user presses Play and stops at the end.',
      'Tags on every machine at once: show the readings that matter from the current viewpoint.',
      'Cuts that hide the cause: keep the machine in frame until the next event moves the story on.',
      'Motion under reduced motion: cuts become instant and pulses hold still.',
    ],
  },
  source,
  sections: [
    {
      id: 'experience',
      title: 'Experience',
      description:
        'Press Play, drag the slider, or click an event marker or a log entry to jump. The camera cuts between pre-set viewpoints as the story moves on; switch Follow action off to orbit freely with drag and scroll.',
      specimens: [
        {
          id: 'PlantReplay3dEmber',
          title: 'Incident replay in 3D',
          note: 'Pick it when an incident should be walked through in the place where it happened.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'three/SceneCanvas.tsx',
            'three/plants/ReplayPlantScene.tsx',
            'three/plants/replayScene.ts',
            'three/plants/recompressorTrip.ts',
            'three/plants/ReplayEventLog.tsx',
            'three/plants/ReplayMiniTrend.tsx',
            'three/plants/ValueTag3d.tsx',
            'three/plants/FlareFlame.tsx',
            'three/plants/tourState.ts',
            'experiences/journeys/ReplayTimeline.tsx',
            'experiences/journeys/replayState.ts',
            'industrial/StatusIndicator.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: PlantReplay3dEmber,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same replay in two more presets, frozen at the trip and just after the operator routes gas to flare.',
      specimens: [
        {
          id: 'PlantReplay3dControlRoom',
          title: 'Control room, at the trip',
          note: 'Pick it for a shift-handover wall: dense, neutral and legible at a distance.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['three/plants/ReplayPlantScene.tsx', 'three/plants/recompressorTrip.ts', 'three/scenes/StillScene.tsx', 'themes/ThemeScope.tsx'],
          Component: PlantReplay3dControlRoom,
        },
        {
          id: 'PlantReplay3dHologram',
          title: 'Hologram, gas on flare',
          note: 'Pick it for a review room where the story is told on a projected model.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['three/plants/ReplayPlantScene.tsx', 'three/plants/recompressorTrip.ts', 'three/scenes/StillScene.tsx', 'themes/ThemeScope.tsx'],
          Component: PlantReplay3dHologram,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The pieces of the replay on their own, each driven by a time you can move.',
      specimens: [
        {
          id: 'PlantReplay3dPartTimeline',
          title: 'Timeline with event markers',
          note: 'Pick it as the one control of a replay: markers for the moments that matter, a scrubber and bounded playback.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['experiences/journeys/ReplayTimeline.tsx'],
          Component: PlantReplay3dPartTimeline,
        },
        {
          id: 'PlantReplay3dPartLog',
          title: 'Event log',
          note: 'Pick it beside any scrubbed view: the current entry is highlighted, the rest are one click away.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/plants/ReplayEventLog.tsx', 'three/plants/recompressorTrip.ts'],
          Component: PlantReplay3dPartLog,
        },
        {
          id: 'PlantReplay3dPartTrends',
          title: 'Synchronized mini trends',
          note: 'Pick them for a narrow rail: each curve draws up to the playhead with its limits and the value now.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/plants/ReplayMiniTrend.tsx'],
          Component: PlantReplay3dPartTrends,
        },
        {
          id: 'PlantReplay3dPartFlame',
          title: 'Flare flame',
          note: 'Pick it to show gas routed to flare: a flame far larger than the pilot, still under reduced motion.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/plants/FlareFlame.tsx', 'three/FlareStack.tsx'],
          Component: PlantReplay3dPartFlame,
        },
        {
          id: 'PlantReplay3dPartBeacon',
          title: 'Status beacon over time',
          note: 'Pick it for a machine whose state changes: the ring follows the playhead and pulses only while news is unacknowledged.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['three/plants/recompressorTrip.ts', 'three/StatusBeacon.tsx', 'three/CompressorSkid.tsx'],
          Component: PlantReplay3dPartBeacon,
        },
        {
          id: 'PlantReplay3dPartTags',
          title: 'Floating value tags',
          note: 'Pick them for readings that belong to a place: glass cards with a leader line, tinted when a limit is passed.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['three/plants/ValueTag3d.tsx', 'three/plants/replayScene.ts'],
          Component: PlantReplay3dPartTags,
        },
        {
          id: 'PlantReplay3dPartViewpoints',
          title: 'Camera viewpoints',
          note: 'Pick pre-set viewpoints when the story has places: the replay cuts between them, and you can try each by hand.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['three/plants/ReplayPlantScene.tsx', 'three/plants/tourState.ts'],
          Component: PlantReplay3dPartViewpoints,
        },
        {
          id: 'PlantReplay3dPartHud',
          title: 'Replay status panel',
          note: 'Pick it for the headline state of the replay: the phase, the time and a way back to the key moment.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['three/HudPanel.tsx', 'industrial/StatusIndicator.tsx'],
          Component: PlantReplay3dPartHud,
        },
      ],
    },
  ],
});
