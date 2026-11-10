import { useState } from 'react';

import { CausalChain } from '../../../library/experiences/journeys/CausalChain';
import type { CausalLink } from '../../../library/experiences/journeys/CausalChain';
import { stateAt, timeFraction } from '../../../library/experiences/journeys/replayState';
import type { ReplayCause, ReplayEvent, ReplayPoint, ReplaySignal, ReplayState } from '../../../library/experiences/journeys/replayState';
import { ReplayTimeline } from '../../../library/experiences/journeys/ReplayTimeline';
import type { ReplayMarker } from '../../../library/experiences/journeys/ReplayTimeline';
import { ReplayTrend } from '../../../library/experiences/journeys/ReplayTrend';
import { TONE_VALUE_TEXT, formatDelta, formatReading, runStateStatus } from '../../../library/industrial/status';
import type { Tone } from '../../../library/industrial/status';
import { StatusDot } from '../../../library/industrial/StatusDot';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { MINUTE, REFERENCE_NOW, createRandom, formatTime } from '../../data/series';
import { definePage } from '../../types';

import source from './incident-replay.tsx?raw';

/** The hour around the recompressor trip of 12 March: 13:00 to 14:00 UTC, one sample a minute. */
const REPLAY_FROM = REFERENCE_NOW - 60 * MINUTE;
const REPLAY_TO = REFERENCE_NOW;
const REPLAY_TICKS: readonly number[] = [0, 10, 20, 30, 40, 50, 60].map((minute) => REPLAY_FROM + minute * MINUTE);

const replayMinute = (minute: number): number => REPLAY_FROM + minute * MINUTE;

/** A deterministic one-minute series through the given (minute, value) knots, with seeded noise. */
function replaySeries(seed: number, noise: number, decimals: number, knots: readonly (readonly [number, number])[]): ReplayPoint[] {
  const random = createRandom(seed);
  const factor = 10 ** decimals;
  return Array.from({ length: 61 }, (_, minute) => {
    const nextIndex = knots.findIndex(([at]) => at >= minute);
    const [m1, v1] = knots[nextIndex === -1 ? knots.length - 1 : nextIndex] ?? [60, 0];
    const [m0, v0] = knots[Math.max(nextIndex - 1, 0)] ?? [0, v1];
    const base = m1 === m0 ? v1 : v0 + ((v1 - v0) * (minute - m0)) / (m1 - m0);
    // A stopped machine reads a steady zero, so noise scales away near it; knots are exact, so
    // the values quoted in the event log are the values on the chart.
    const onKnot = knots.some(([at]) => at === minute);
    const jitter = onKnot ? 0 : (random() - 0.5) * 2 * noise * Math.min(Math.abs(base) / (noise * 20 || 1), 1);
    return { t: replayMinute(minute), v: Math.round(Math.max(base + jitter, 0) * factor) / factor };
  });
}

const REPLAY_SIGNALS: readonly ReplaySignal[] = [
  {
    id: 'oil-pressure',
    label: 'Lube oil pressure',
    tag: '23-PT-92720',
    unit: 'barg',
    decimals: 2,
    limits: { low: 1.8, lowLow: 1.2 },
    points: replaySeries(81, 0.012, 2, [[0, 2.4], [5, 2.4], [22, 1.78], [34, 1.62], [46, 1.48], [49, 1.55], [60, 1.55]]),
  },
  {
    id: 'bearing-temperature',
    label: 'Bearing temperature',
    tag: '23-TT-92745',
    unit: '°C',
    decimals: 1,
    limits: { high: 95, highHigh: 115 },
    points: replaySeries(82, 0.35, 1, [[0, 78], [20, 79], [28, 86], [34, 93.5], [40, 99.5], [46, 106], [50, 101], [60, 88]]),
  },
  {
    id: 'vibration',
    label: 'Drive-end vibration',
    tag: '23-VT-92740',
    unit: 'mm/s',
    decimals: 1,
    limits: { high: 7.1, highHigh: 11 },
    points: replaySeries(83, 0.09, 1, [[0, 4.2], [18, 4.4], [26, 5.6], [34, 7.3], [40, 8.9], [45, 10.6], [46, 11.6], [47, 6], [49, 0.4], [54, 0.3], [55, 1.2], [56, 4.8], [57, 0.6], [60, 0.3]]),
  },
  {
    id: 'speed',
    label: 'Shaft speed',
    tag: '23-ST-92701',
    unit: 'rpm',
    decimals: 0,
    limits: {},
    points: replaySeries(84, 14, 0, [[0, 9620], [46, 9600], [47, 4200], [49, 0], [54, 0], [55, 600], [56, 2350], [57, 300], [58, 0], [60, 0]]),
  },
];

const REPLAY_DOMAINS: Record<string, readonly [number, number]> = {
  'oil-pressure': [1, 2.8],
  'bearing-temperature': [70, 120],
  vibration: [0, 13],
  speed: [0, 11000],
};

const REPLAY_EVENTS: readonly ReplayEvent[] = [
  { id: 'normal', t: replayMinute(0), title: 'Normal operation', detail: 'Recompressor running at 9,620 rpm with every reading inside its band.', tone: 'neutral' },
  { id: 'warning', t: replayMinute(22), title: 'First warning', detail: 'Lube oil pressure low: 1.78 barg against a 1.80 barg limit.', tone: 'warning' },
  { id: 'alarm', t: replayMinute(34), title: 'High alarm', detail: 'Drive-end vibration high: 7.3 mm/s against a 7.1 mm/s limit.', tone: 'warning' },
  { id: 'trip', t: replayMinute(46), title: 'Trip', detail: 'Recompressor tripped on high-high vibration: 11.6 mm/s, limit 11.0 mm/s.', tone: 'critical' },
  { id: 'acknowledge', t: replayMinute(49), title: 'Acknowledged', detail: 'Ingrid Haugen acknowledged the trip and routed flash gas to flare.', tone: 'neutral' },
  { id: 'restart', t: replayMinute(55), title: 'Restart attempt', detail: 'Restart aborted at 2,350 rpm when vibration climbed again.', tone: 'info' },
];

const REPLAY_MARKERS: readonly ReplayMarker[] = REPLAY_EVENTS.slice(1).map((event) => ({ id: event.id, t: event.t, label: event.title, tone: event.tone }));

const REPLAY_CAUSES: readonly ReplayCause[] = [
  { id: 'filter', t: replayMinute(5), title: 'Lube oil filter clogs', detail: 'Oil pressure starts to fall from 2.40 barg.' },
  { id: 'pressure', t: replayMinute(22), title: 'Oil pressure goes low', detail: 'Supply drops under the 1.80 barg limit.' },
  { id: 'bearing', t: replayMinute(28), title: 'Bearing runs hot', detail: 'A thinner oil film; the bearing passes 86 °C.' },
  { id: 'vibration', t: replayMinute(34), title: 'Vibration rises', detail: 'Drive-end vibration passes 7.1 mm/s.' },
  { id: 'trip', t: replayMinute(46), title: 'Protective trip', detail: 'High-high vibration stops the machine.' },
  { id: 'restart', t: replayMinute(55), title: 'Restart fails', detail: 'The cause is still there; gas stays on flare.' },
];

const REPLAY_LINKS: readonly CausalLink[] = REPLAY_CAUSES.map((cause) => ({
  id: cause.id,
  time: formatTime(cause.t),
  title: cause.title,
  detail: cause.detail,
}));

const REPLAY = { signals: REPLAY_SIGNALS, events: REPLAY_EVENTS, causes: REPLAY_CAUSES };

/** What the screen calls the situation after each event. */
const REPLAY_PHASES: readonly { label: string; tone: Tone }[] = [
  { label: 'Normal operation', tone: 'success' },
  { label: 'Degrading', tone: 'warning' },
  { label: 'In alarm', tone: 'warning' },
  { label: 'Tripped', tone: 'critical' },
  { label: 'Tripped, acknowledged', tone: 'critical' },
  { label: 'Restart failed', tone: 'critical' },
];

const REPLAY_ALARM_TEXT = { normal: 'Normal', warning: 'Alarm', trip: 'Trip limit' } as const;

const REPLAY_CARD = 'rounded-xl border border-default bg-card-background p-4';
const REPLAY_HEADING = 'text-sm font-semibold text-base-foreground';

function replayPhase(state: ReplayState): { label: string; tone: Tone } {
  return REPLAY_PHASES[Math.max(state.eventIndex, 0)] ?? REPLAY_PHASES[0];
}

function IncidentReplayTrends({ t }: { t: number }) {
  const eventTimes = REPLAY_MARKERS.map((marker) => marker.t);

  return (
    <div className={`${REPLAY_CARD} flex min-w-0 flex-col gap-3`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h4 className={REPLAY_HEADING}>Trends up to {formatTime(t)}</h4>
        <p className="text-xs text-muted-foreground">Dashed lines are limits · faint lines are events already passed</p>
      </div>
      {REPLAY_SIGNALS.map((signal) => (
        <ReplayTrend
          key={signal.id}
          signal={signal}
          from={REPLAY_FROM}
          to={REPLAY_TO}
          cursor={t}
          domain={REPLAY_DOMAINS[signal.id] ?? [0, 1]}
          eventTimes={eventTimes}
          className="flex-1"
        />
      ))}
      <div aria-hidden className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_minmax(0,6.5rem)] gap-3">
        <span />
        <div className="relative h-4 text-xs text-muted-foreground tabular-nums">
          {[0, 15, 30, 45, 60].map((minute) => (
            <span
              key={minute}
              className={`absolute whitespace-nowrap ${minute === 0 ? '' : minute === 60 ? '-translate-x-full' : '-translate-x-1/2'}`}
              style={{ left: `${timeFraction(replayMinute(minute), REPLAY_FROM, REPLAY_TO) * 100}%` }}
            >
              {formatTime(replayMinute(minute))}
            </span>
          ))}
        </div>
        <span />
      </div>
    </div>
  );
}

function IncidentReplayStatePanel({ state }: { state: ReplayState }) {
  const phase = replayPhase(state);
  // The trip is event 3; from then on the machine is down, restart attempt included.
  const machine = runStateStatus(state.eventIndex >= 3 ? 'tripped' : 'running');

  return (
    <div className={`${REPLAY_CARD} flex min-w-0 flex-col gap-3`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h4 className={REPLAY_HEADING}>State at {formatTime(state.t)}</h4>
        <StatusIndicator tone={phase.tone} label={phase.label} shape={phase.tone === 'critical' ? 'diamond' : phase.tone === 'warning' ? 'square' : 'dot'} size="sm" />
      </div>
      <div className="flex items-center justify-between gap-3 border-b border-default pb-3">
        <span className="min-w-0">
          <span className="block text-sm text-base-foreground">Recompressor</span>
          <span className="block font-mono text-xs text-muted-foreground">23-KA-9103</span>
        </span>
        <StatusIndicator {...machine} size="sm" />
      </div>
      <ul className="flex flex-col gap-3">
        {state.readings.map((reading) => (
          <li key={reading.id} className="flex items-start justify-between gap-3">
            <span className="min-w-0">
              <span className="block text-sm text-base-foreground">{reading.label}</span>
              <span className="block text-xs text-muted-foreground tabular-nums">
                {reading.change === null ? 'No earlier sample' : `${formatDelta(reading.change, reading.decimals)} in 5 min`}
              </span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-0.5">
              <span className={`text-sm font-semibold whitespace-nowrap tabular-nums ${TONE_VALUE_TEXT[reading.tone]}`}>
                {formatReading(reading.value, reading.unit, reading.decimals)}
              </span>
              {reading.alarm === 'normal' ? (
                <span className="text-xs text-muted-foreground">Normal</span>
              ) : (
                <StatusIndicator tone={reading.tone} label={REPLAY_ALARM_TEXT[reading.alarm]} shape={reading.alarm === 'trip' ? 'diamond' : 'square'} size="sm" />
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function IncidentReplayLog({ eventIndex, onJump }: { eventIndex: number; onJump?: (t: number) => void }) {
  return (
    <div className={`${REPLAY_CARD} flex min-w-0 flex-col gap-2`}>
      <h4 className={REPLAY_HEADING}>Event log</h4>
      <ol aria-label="Events of the incident" className="flex flex-col">
        {REPLAY_EVENTS.map((event, index) => {
          const isCurrent = index === eventIndex;
          const reached = index <= eventIndex;
          const body = (
            <>
              <span className={`w-10 shrink-0 font-mono text-xs leading-5 tabular-nums ${reached ? 'text-medium-foreground' : 'text-muted-foreground'}`}>{formatTime(event.t)}</span>
              <span className="flex h-5 shrink-0 items-center">
                <StatusDot tone={reached ? event.tone : 'neutral'} shape={reached ? (event.tone === 'critical' ? 'diamond' : event.tone === 'warning' ? 'square' : 'dot') : 'ring'} size="sm" />
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className={`block text-sm ${isCurrent ? 'font-semibold text-base-foreground' : reached ? 'text-base-foreground' : 'text-muted-foreground'}`}>
                  {event.title}
                  {reached ? '' : ' · not yet'}
                </span>
                {isCurrent && event.detail ? <span className="mt-0.5 block text-xs text-medium-foreground">{event.detail}</span> : null}
              </span>
            </>
          );
          const rowClass = `flex w-full items-start gap-2 rounded-md border-l-2 px-2 py-1.5 ${
            isCurrent ? 'border-[color:var(--primary-background)] bg-muted-background' : 'border-transparent'
          }`;
          return (
            <li key={event.id} aria-current={isCurrent ? 'step' : undefined}>
              {onJump ? (
                <button
                  type="button"
                  aria-label={`Go to ${formatTime(event.t)}, ${event.title}`}
                  onClick={() => onJump(event.t)}
                  className={`${rowClass} cursor-pointer outline-none hover:bg-muted-background focus-visible:ring-2 focus-visible:ring-[color:var(--ring-default)]`}
                >
                  {body}
                </button>
              ) : (
                <div className={rowClass}>{body}</div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function IncidentReplayChain({ revealed }: { revealed: number }) {
  return (
    <div className={`${REPLAY_CARD} flex min-w-0 flex-col gap-3`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h4 className={REPLAY_HEADING}>What led to what</h4>
        <p className="text-xs text-muted-foreground tabular-nums">
          {revealed} of {REPLAY_LINKS.length} links evident at this time
        </p>
      </div>
      <CausalChain links={REPLAY_LINKS} revealed={revealed} label="Causal chain of the recompressor trip" />
    </div>
  );
}

function IncidentReplayExperience() {
  // Archetype: a scrubbed replay — one master timeline on top and everything under it is a
  //   function of the playhead. Nothing on the screen has state of its own.
  // Dominant element: the master timeline with its event markers and playhead, and the stack of
  //   synchronized trends that draw up to that moment.
  // Interaction: scrubbing. Drag the slider, step one minute, press Play (it stops at the end), or
  //   click an event marker or a log entry; trends, the state panel, the log highlight and the
  //   causal chain all follow.
  const [t, setT] = useState(replayMinute(30));
  const [playing, setPlaying] = useState(false);
  const state = stateAt(REPLAY, t);
  const phase = replayPhase(state);

  const jump = (target: number) => {
    setPlaying(false);
    setT(target);
  };

  return (
    <section aria-label="Incident replay, recompressor trip" className="flex min-h-[44rem] w-full flex-col gap-4 rounded-xl bg-base-background p-6 text-base-foreground">
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="text-2xl font-semibold text-base-foreground">Recompressor trip</h3>
            <StatusIndicator tone={phase.tone} label={phase.label} variant="badge" detail={`at ${formatTime(t)}`} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-mono">23-KA-9103</span> · Nordkapp gas compression · replay of 12 March, 13:00 to 14:00 UTC
          </p>
        </div>
      </header>

      <div className={REPLAY_CARD}>
        <ReplayTimeline
          from={REPLAY_FROM}
          to={REPLAY_TO}
          value={t}
          onValueChange={setT}
          playing={playing}
          onPlayingChange={setPlaying}
          markers={REPLAY_MARKERS}
          stepMs={MINUTE}
          stepLabel="1 min"
          ticks={REPLAY_TICKS}
          formatTime={formatTime}
          label="Replay of the recompressor trip"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="flex min-w-0 flex-col xl:col-span-8 [&>*]:flex-1">
          <IncidentReplayTrends t={t} />
        </div>
        <div className="flex min-w-0 flex-col gap-4 xl:col-span-4">
          <IncidentReplayStatePanel state={state} />
          <IncidentReplayLog eventIndex={state.eventIndex} onJump={jump} />
        </div>
      </div>

      <IncidentReplayChain revealed={state.revealedCauses} />
    </section>
  );
}

function IncidentReplaySignature() {
  return (
    <ThemeScope preset="ember" className="w-full">
      <IncidentReplayExperience />
    </ThemeScope>
  );
}

function IncidentReplayControlRoom() {
  return (
    <ThemeScope preset="control-room" className="w-full">
      <IncidentReplayExperience />
    </ThemeScope>
  );
}

function IncidentReplayAura() {
  return (
    <ThemeScope preset="aura" className="w-full">
      <IncidentReplayExperience />
    </ThemeScope>
  );
}

function IncidentReplayPartTimeline() {
  const [t, setT] = useState(replayMinute(40));
  const [playing, setPlaying] = useState(false);

  return (
    <ReplayTimeline
      from={REPLAY_FROM}
      to={REPLAY_TO}
      value={t}
      onValueChange={setT}
      playing={playing}
      onPlayingChange={setPlaying}
      markers={REPLAY_MARKERS}
      stepMs={MINUTE}
      stepLabel="1 min"
      ticks={REPLAY_TICKS}
      formatTime={formatTime}
      label="Replay of the recompressor trip"
    />
  );
}

function IncidentReplayPartTrends() {
  return <IncidentReplayTrends t={replayMinute(42)} />;
}

function IncidentReplayPartState() {
  return <IncidentReplayStatePanel state={stateAt(REPLAY, replayMinute(46))} />;
}

function IncidentReplayPartLog() {
  return <IncidentReplayLog eventIndex={stateAt(REPLAY, replayMinute(50)).eventIndex} />;
}

function IncidentReplayPartSingleTrend() {
  return (
    <div className={`${REPLAY_CARD} w-full`}>
      <ReplayTrend signal={REPLAY_SIGNALS[2]} from={REPLAY_FROM} to={REPLAY_TO} cursor={replayMinute(46)} domain={[0, 13]} eventTimes={[replayMinute(34)]} />
    </div>
  );
}

function IncidentReplayPartChain() {
  return <IncidentReplayChain revealed={stateAt(REPLAY, replayMinute(36)).revealedCauses} />;
}

function IncidentReplayPartChainComplete() {
  return <IncidentReplayChain revealed={REPLAY_LINKS.length} />;
}

export default definePage({
  id: 'incident-replay',
  title: 'Incident replay',
  summary:
    'A replay of the recompressor trip, driven by one time scrubber. Move the playhead and the trends draw up to that minute, the state panel shows the readings and alarms as they were, the log highlights the current entry and the causal chain fills in link by link.',
  guidance: {
    use: [
      'For incident reviews and shift debriefs, where the order of events is the argument.',
      'When several signals have to be read against the same moment in time.',
      'Derive everything from the playhead with pure functions, so scrubbing back is exact.',
      'Start playback only on request and stop it at the end of the period.',
    ],
    avoid: [
      'Live monitoring. A replay is about the past; say the period in the header.',
      'Charts with their own zoom or time range; one timeline rules the screen.',
      'Revealing the root cause before the playhead reaches the evidence for it.',
      'Autoplay, loops or motion the user did not start.',
    ],
  },
  source,
  sections: [
    {
      id: 'experience',
      title: 'Experience',
      description:
        'Shown in the Ember theme. Drag the slider, step a minute at a time, press Play, or click an event on the timeline or in the log; every panel follows the playhead.',
      specimens: [
        {
          id: 'IncidentReplaySignature',
          title: 'Incident replay',
          note: 'Pick it to walk a team through an incident minute by minute, with cause and effect building up as it happened.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'experiences/journeys/ReplayTimeline.tsx',
            'experiences/journeys/ReplayTrend.tsx',
            'experiences/journeys/CausalChain.tsx',
            'experiences/journeys/replayState.ts',
            'industrial/StatusIndicator.tsx',
            'industrial/StatusDot.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: IncidentReplaySignature,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same replay, unchanged, in an operator-console preset and in the default theme.',
      specimens: [
        {
          id: 'IncidentReplayControlRoom',
          title: 'Control room',
          note: 'Pick it when the replay runs on the console where the incident happened: dark, compact and sharp.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: IncidentReplayControlRoom,
        },
        {
          id: 'IncidentReplayAura',
          title: 'Aura',
          note: 'Pick it for an incident report read at a desk, where the replay sits among ordinary pages.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: IncidentReplayAura,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'Each part on its own. All of them take the playhead as a prop and keep no state.',
      specimens: [
        {
          id: 'IncidentReplayPartTimeline',
          title: 'Master timeline',
          note: 'Pick it as the single time control of a replay: markers to jump to, a scrubber and bounded playback.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['experiences/journeys/ReplayTimeline.tsx', 'experiences/journeys/replayState.ts'],
          Component: IncidentReplayPartTimeline,
        },
        {
          id: 'IncidentReplayPartTrends',
          title: 'Synchronized trends',
          note: 'Pick it to read several signals against one moment; each row draws only what had happened by then.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          surface: 'muted',
          uses: ['experiences/journeys/ReplayTrend.tsx', 'experiences/journeys/replayState.ts'],
          Component: IncidentReplayPartTrends,
        },
        {
          id: 'IncidentReplayPartState',
          title: 'State at a time',
          note: 'Pick it beside the trends to answer what the operator saw at that minute: values, alarm states and rate of change.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          surface: 'muted',
          uses: ['experiences/journeys/replayState.ts', 'industrial/StatusIndicator.tsx'],
          Component: IncidentReplayPartState,
        },
        {
          id: 'IncidentReplayPartSingleTrend',
          title: 'Single trend row',
          note: 'Pick one row when only one signal explains the event; it carries its own limits, value and alarm state.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          surface: 'muted',
          uses: ['experiences/journeys/ReplayTrend.tsx'],
          Component: IncidentReplayPartSingleTrend,
        },
        {
          id: 'IncidentReplayPartLog',
          title: 'Annotated event log',
          note: 'Pick it to keep the written record in step with the charts; the current entry opens, later ones wait.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          surface: 'muted',
          uses: ['industrial/StatusDot.tsx'],
          Component: IncidentReplayPartLog,
        },
        {
          id: 'IncidentReplayPartChain',
          title: 'Causal chain, filling in',
          note: 'Pick it mid-replay: known links are solid, the latest is outlined and the rest stay as placeholders.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['experiences/journeys/CausalChain.tsx'],
          Component: IncidentReplayPartChain,
        },
        {
          id: 'IncidentReplayPartChainComplete',
          title: 'Causal chain, complete',
          note: 'Pick it for the summary of a closed investigation, when the whole chain from cause to outcome is known.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['experiences/journeys/CausalChain.tsx'],
          Component: IncidentReplayPartChainComplete,
        },
      ],
    },
  ],
});
