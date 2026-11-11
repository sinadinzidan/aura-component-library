import { Switch } from '@cognite/aura/components/switch';
import {
  IconAlertOctagon,
  IconAlertTriangle,
  IconCheck,
  IconCircleCheck,
  IconClock,
  IconPlayerPause,
  IconX,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { AppFrame } from '../../../library/kit/AppFrame';
import { Canvas } from '../../../library/kit/Canvas';
import { Panel } from '../../../library/kit/Panel';
import {
  arcSpans,
  clockAngle,
  elapsedShare,
  formatClock,
  formatDuration,
  formatElapsed,
  type MissionWindow,
} from '../../../library/kit/radial-mission-control/mission';
import { arcBand, arcLine, polarPoint } from '../../../library/kit/radial-mission-control/polar';
import { StatusPill } from '../../../library/kit/StatusPill';
import type { Tone } from '../../../library/kit/tones';
import { LookScope } from '../../../library/looks/LookScope';
import { definePage } from '../../types';

import source from './radial-mission-control.tsx?raw';

type RmcState = 'nominal' | 'watch' | 'fault' | 'standby';

type RmcCheck = { label: string; state: 'done' | 'open' | 'failed' };

type RmcSubsystem = {
  id: string;
  name: string;
  /** One word for the arc. */
  short: string;
  state: RmcState;
  figure: string;
  figureLabel: string;
  note: string;
  checks: readonly RmcCheck[];
};

type RmcMilestone = { id: string; minute: number; title: string; tone: Tone };

/** Day shift, 06:00 to 18:00, read at 14:00. */
const RMC_SHIFT: MissionWindow = { start: 360, end: 1080, now: 840 };

const RMC_STATE: Record<RmcState, { word: string; tone: Tone; poll: string }> = {
  nominal: { word: 'Nominal', tone: 'success', poll: 'Go' },
  watch: { word: 'Watch', tone: 'warning', poll: 'Hold' },
  fault: { word: 'Fault', tone: 'critical', poll: 'No go' },
  standby: { word: 'Standby', tone: 'info', poll: 'Go' },
};

const RMC_SUBSYSTEMS: readonly RmcSubsystem[] = [
  {
    id: 'recompressor',
    name: 'Recompressor',
    short: 'Recompressor',
    state: 'fault',
    figure: '11.6 mm/s',
    figureLabel: 'Vibration at trip',
    note: 'Tripped on high vibration at 13:46. Bearing inspection is in progress, due 20:00.',
    checks: [
      { label: 'Machine isolated and depressurised', state: 'done' },
      { label: 'Work permit issued', state: 'done' },
      { label: 'Drive-end bearing inspected', state: 'open' },
      { label: 'Vibration probe verified', state: 'open' },
      { label: 'Cleared for restart', state: 'failed' },
    ],
  },
  {
    id: 'inlet',
    name: 'Inlet and separation',
    short: 'Inlet',
    state: 'nominal',
    figure: '54.3 %',
    figureLabel: 'Separator level',
    note: 'Level and pressure inside limits since 06:00.',
    checks: [
      { label: 'Separator level in band', state: 'done' },
      { label: 'Shutdown valve stroke test', state: 'done' },
      { label: 'Test separator lined up', state: 'done' },
      { label: 'Sand monitor reading logged', state: 'done' },
    ],
  },
  {
    id: 'export',
    name: 'Gas export',
    short: 'Export',
    state: 'nominal',
    figure: '4.38 MSm³/d',
    figureLabel: 'Export rate',
    note: 'Running 0.12 under the 4.50 plan because of the reduced compression capacity.',
    checks: [
      { label: 'Export pump A running', state: 'done' },
      { label: 'Metering station verified', state: 'done' },
      { label: 'Pig received at terminal', state: 'done' },
      { label: 'Pump B standby start test', state: 'open' },
    ],
  },
  {
    id: 'cooling',
    name: 'Cooling water',
    short: 'Cooling',
    state: 'nominal',
    figure: '38.9 °C',
    figureLabel: 'Cooler outlet',
    note: 'One pump is out for a transmitter change; the duty pump covers the load.',
    checks: [
      { label: 'Duty pump running', state: 'done' },
      { label: 'Supply header pressure in band', state: 'done' },
      { label: 'Bearing transmitter replaced', state: 'open' },
    ],
  },
  {
    id: 'power',
    name: 'Power generation',
    short: 'Power',
    state: 'nominal',
    figure: '31.4 MW',
    figureLabel: 'Load',
    note: 'Two of three generators online with 9 MW spinning reserve.',
    checks: [
      { label: 'Generators A and B online', state: 'done' },
      { label: 'Spinning reserve above 6 MW', state: 'done' },
      { label: 'Fuel gas pressure in band', state: 'done' },
      { label: 'Emergency generator test logged', state: 'done' },
    ],
  },
  {
    id: 'flare',
    name: 'Flare and relief',
    short: 'Flare',
    state: 'standby',
    figure: '12.4 kSm³/d',
    figureLabel: 'Flaring',
    note: 'Pilots lit, no relief load since the trip was vented at 13:52.',
    checks: [
      { label: 'Pilots confirmed lit', state: 'done' },
      { label: 'Knock-out drum level low', state: 'done' },
      { label: 'Purge gas flow confirmed', state: 'done' },
    ],
  },
  {
    id: 'safety',
    name: 'Safety systems',
    short: 'Safety',
    state: 'nominal',
    figure: '0',
    figureLabel: 'Overrides active',
    note: 'No inhibits or overrides. Fire and gas detection fully available.',
    checks: [
      { label: 'Fire and gas detection healthy', state: 'done' },
      { label: 'No overrides or inhibits', state: 'done' },
      { label: 'Deluge valves in auto', state: 'done' },
      { label: 'Muster drill recorded', state: 'done' },
    ],
  },
  {
    id: 'compression',
    name: 'Gas compression',
    short: 'Compression',
    state: 'watch',
    figure: '146.3 °C',
    figureLabel: 'Discharge temperature',
    note: '1st stage is 1.3 °C over its high limit while it carries the recompressor load.',
    checks: [
      { label: 'Anti-surge controllers in auto', state: 'done' },
      { label: 'Lube oil pressure confirmed', state: 'done' },
      { label: 'Discharge temperature under 145 °C', state: 'failed' },
      { label: 'Drive-end vibration survey', state: 'open' },
      { label: 'Interstage cooler outlet under 40 °C', state: 'open' },
    ],
  },
];

const RMC_MILESTONES: readonly RmcMilestone[] = [
  { id: 'handover-in', minute: 360, title: 'Handover from night shift', tone: 'success' },
  { id: 'pig', minute: 510, title: 'Pig launched on the export line', tone: 'success' },
  { id: 'separator', minute: 675, title: 'Test separator lined up', tone: 'success' },
  { id: 'trip', minute: 826, title: 'Recompressor tripped', tone: 'critical' },
  { id: 'permit', minute: 960, title: 'Permit meeting', tone: 'info' },
  { id: 'poll', minute: 1050, title: 'Restart go or no-go poll', tone: 'info' },
  { id: 'handover-out', minute: 1080, title: 'Handover to night shift', tone: 'neutral' },
];

const RMC_NEXT = RMC_MILESTONES.find((milestone) => milestone.minute > RMC_SHIFT.now) ?? RMC_MILESTONES[0];

const RMC_HOUR_MARKS = [540, 720, 900];

const RMC_CHECK_TONE: Record<RmcCheck['state'], Tone> = { done: 'success', open: 'neutral', failed: 'critical' };

const RMC_CHECK_WORD: Record<RmcCheck['state'], string> = { done: 'Done', open: 'Open', failed: 'Failed' };

function rmcSubsystem(id: string): RmcSubsystem {
  return RMC_SUBSYSTEMS.find((subsystem) => subsystem.id === id) ?? RMC_SUBSYSTEMS[0];
}

function rmcDone(subsystem: RmcSubsystem): number {
  return subsystem.checks.filter((check) => check.state === 'done').length;
}

function RmcStateIcon({ state, className }: { state: RmcState; className?: string }) {
  if (state === 'fault') return <IconAlertOctagon className={className} aria-hidden="true" />;
  if (state === 'watch') return <IconAlertTriangle className={className} aria-hidden="true" />;
  if (state === 'standby') return <IconPlayerPause className={className} aria-hidden="true" />;
  return <IconCircleCheck className={className} aria-hidden="true" />;
}

function RmcCheckIcon({ state }: { state: RmcCheck['state'] }) {
  if (state === 'done') return <IconCheck className="size-4 shrink-0" aria-hidden="true" />;
  if (state === 'failed') return <IconX className="size-4 shrink-0" aria-hidden="true" />;
  return <IconClock className="size-4 shrink-0" aria-hidden="true" />;
}

type RmcDialProps = {
  /** Id of the picked subsystem. */
  selected: string;
  onSelect?: (id: string) => void;
  /** Draw the outer clock ring with its milestones. */
  clock?: boolean;
  /** Draw the subsystem arcs and the check ring of the picked one. */
  arcs?: boolean;
  /** Write the subsystem names on the arcs; turn off under about 420 px. */
  labels?: boolean;
  /** Pulse the arcs that are in fault. */
  pulse?: boolean;
  /** Centre of the dial. */
  children?: ReactNode;
};

/** The mission dial: shift clock outside, one arc per subsystem, the picked subsystem's checks inside. */
function RmcDial({ selected, onSelect, clock = true, arcs = true, labels = true, pulse = false, children }: RmcDialProps) {
  const spans = arcSpans(RMC_SUBSYSTEMS.length, 2.4);
  const current = rmcSubsystem(selected);
  const checkSpans = arcSpans(current.checks.length, 5);
  const elapsed = elapsedShare(RMC_SHIFT) * 360;
  const now = polarPoint(320, 320, 302, elapsed);
  const percent = (value: number) => `${(value / 640) * 100}%`;
  return (
    <div className="relative mx-auto aspect-square w-full">
      <svg viewBox="0 0 640 640" className="absolute inset-0 size-full" aria-hidden="true">
        {clock ? (
          <g fill="none">
            <circle cx="320" cy="320" r="302" strokeWidth="26" style={{ stroke: 'var(--kit-surface)' }} />
            <path d={arcLine(320, 320, 302, 0, elapsed)} strokeWidth="26" style={{ stroke: 'var(--kit-text)' }} />
            {Array.from({ length: 12 }, (_, hour) => {
              const from = polarPoint(320, 320, 285, hour * 30);
              const to = polarPoint(320, 320, 278, hour * 30);
              return <line key={hour} x1={from.x} y1={from.y} x2={to.x} y2={to.y} strokeWidth="2" style={{ stroke: 'var(--kit-text-3)' }} />;
            })}
            {RMC_MILESTONES.filter((milestone) => milestone.minute > RMC_SHIFT.start && milestone.minute < RMC_SHIFT.end).map((milestone) => {
              const point = polarPoint(320, 320, 302, clockAngle(milestone.minute, RMC_SHIFT));
              return (
                <circle
                  key={milestone.id}
                  data-tone={milestone.tone}
                  cx={point.x}
                  cy={point.y}
                  r="9"
                  strokeWidth="4"
                  style={{ fill: 'var(--t-vivid)', stroke: 'var(--kit-canvas-bg)' }}
                />
              );
            })}
            <line x1="320" y1="2" x2="320" y2="34" strokeWidth="6" style={{ stroke: 'var(--kit-canvas-bg)' }} />
            <circle cx={now.x} cy={now.y} r="14" strokeWidth="5" style={{ fill: 'var(--kit-canvas-bg)', stroke: 'var(--kit-text)' }} />
          </g>
        ) : null}
        {arcs ? (
          <g>
            {RMC_SUBSYSTEMS.map((subsystem, index) => {
              const span = spans[index];
              const picked = subsystem.id === selected;
              return (
                <path
                  key={subsystem.id}
                  data-tone={RMC_STATE[subsystem.state].tone}
                  d={arcBand(320, 320, picked ? 272 : 264, picked ? 182 : 190, span.start, span.end)}
                  strokeWidth={picked ? 4 : 0}
                  className={`cursor-pointer ${pulse && subsystem.state === 'fault' ? 'motion-safe:animate-pulse' : ''}`}
                  style={{ fill: 'var(--t-vivid)', stroke: 'var(--kit-text)', opacity: picked ? 1 : 0.82 }}
                  onClick={() => onSelect?.(subsystem.id)}
                />
              );
            })}
            {current.checks.map((check, index) => (
              <path
                key={check.label}
                data-tone={RMC_CHECK_TONE[check.state]}
                d={arcLine(320, 320, 168, checkSpans[index].start, checkSpans[index].end)}
                fill="none"
                strokeWidth="10"
                style={{ stroke: check.state === 'open' ? 'var(--kit-surface)' : 'var(--t-vivid)' }}
              />
            ))}
          </g>
        ) : null}
      </svg>
      {clock
        ? RMC_HOUR_MARKS.map((minute) => {
            const angle = clockAngle(minute, RMC_SHIFT);
            const point = polarPoint(320, 320, 302, angle);
            const turn = angle === 90 ? 'rotate-90' : angle === 270 ? '-rotate-90' : '';
            return (
              <span
                key={minute}
                className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-xs leading-none font-bold tabular-nums ${turn} ${
                  minute <= RMC_SHIFT.now ? 'text-[var(--kit-canvas-bg)]' : 'text-[var(--kit-text)]'
                }`}
                style={{ left: percent(point.x), top: percent(point.y) }}
              >
                {formatClock(minute)}
              </span>
            );
          })
        : null}
      {arcs
        ? RMC_SUBSYSTEMS.map((subsystem, index) => {
            const point = polarPoint(320, 320, 227, spans[index].mid);
            return (
              <span
                key={subsystem.id}
                data-tone={RMC_STATE[subsystem.state].tone}
                className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 text-xs leading-none font-bold text-[var(--t-on-vivid)]"
                style={{ left: percent(point.x), top: percent(point.y) }}
              >
                <RmcStateIcon state={subsystem.state} className="size-5" />
                {labels ? subsystem.short : null}
              </span>
            );
          })
        : null}
      <div className="absolute inset-[26%] flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

/** Centre of the dial: the picked subsystem's state as the largest word on the screen. */
function RmcDialCenter({ subsystem, compact = false }: { subsystem: RmcSubsystem; compact?: boolean }) {
  const state = RMC_STATE[subsystem.state];
  return (
    <div data-tone={state.tone} className="flex flex-col items-center gap-1">
      <p className={`font-semibold text-[var(--kit-text-2)] ${compact ? 'text-xs' : 'text-base'}`}>{subsystem.name}</p>
      <p className={`leading-none font-extrabold tracking-tight text-[var(--t-line)] ${compact ? 'text-3xl' : 'text-5xl'}`}>{state.word}</p>
      {compact ? null : (
        <p className="mt-2 text-xl font-bold tabular-nums">
          {subsystem.figure} <span className="text-sm font-medium text-[var(--kit-text-2)]">{subsystem.figureLabel}</span>
        </p>
      )}
      <p className={`font-medium text-[var(--kit-text-2)] tabular-nums ${compact ? 'text-xs' : 'mt-1 text-sm'}`}>
        {rmcDone(subsystem)} of {subsystem.checks.length} checks done
      </p>
    </div>
  );
}

/** Centre of a dial that only shows the clock. */
function RmcClockCenter() {
  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-sm font-semibold text-[var(--kit-text-2)]">Day shift</p>
      <p className="text-4xl leading-none font-extrabold tracking-tight tabular-nums">{formatElapsed(RMC_SHIFT)}</p>
      <p className="text-xs font-medium text-[var(--kit-text-2)]">{formatDuration(RMC_SHIFT.end - RMC_SHIFT.now)} left</p>
    </div>
  );
}

/** The keyboard path to the arcs: one button per subsystem, filled with its state. */
function RmcPicker({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  return (
    <div role="group" aria-label="Subsystems" className="flex flex-wrap justify-center gap-2">
      {RMC_SUBSYSTEMS.map((subsystem) => {
        const picked = subsystem.id === selected;
        return (
          <button
            key={subsystem.id}
            type="button"
            data-tone={RMC_STATE[subsystem.state].tone}
            aria-pressed={picked}
            onClick={() => onSelect(subsystem.id)}
            className={`flex items-center gap-2 rounded-[var(--kit-radius-sm)] px-3 py-2 text-sm font-bold outline-offset-2 focus-visible:outline-2 focus-visible:outline-[var(--kit-text)] ${
              picked ? 'bg-[var(--t-vivid)] text-[var(--t-on-vivid)]' : 'bg-[var(--kit-surface)] text-[var(--kit-text)]'
            }`}
          >
            <span aria-hidden="true" className={`size-3 shrink-0 rounded-sm ${picked ? 'bg-[var(--t-on-vivid)]' : 'bg-[var(--t-vivid)]'}`} />
            {subsystem.short}
          </button>
        );
      })}
    </div>
  );
}

/** The shift clock as a tile: elapsed time large, what is left underneath. */
function RmcClockTile() {
  const share = elapsedShare(RMC_SHIFT);
  return (
    <Panel>
      <p className="text-base font-bold">Mission clock</p>
      <p className="mt-3 text-4xl leading-none font-extrabold tracking-tight tabular-nums">{formatElapsed(RMC_SHIFT)}</p>
      <div className="mt-4 h-3 overflow-hidden rounded-sm bg-[var(--kit-track)]" role="img" aria-label="Day shift, 8 of 12 hours elapsed">
        <div className="h-full bg-[var(--kit-text)]" style={{ width: `${share * 100}%` }} />
      </div>
      <p className="mt-2 text-sm font-medium text-[var(--kit-text-2)] tabular-nums">
        Day shift, {formatClock(RMC_SHIFT.start)} to {formatClock(RMC_SHIFT.end)}
        <span className="block">{formatDuration(RMC_SHIFT.end - RMC_SHIFT.now)} to handover</span>
      </p>
    </Panel>
  );
}

/** One subsystem as a state tile: the whole tile takes the colour of its state. */
function RmcStateTile({ subsystem, className }: { subsystem: RmcSubsystem; className?: string }) {
  const state = RMC_STATE[subsystem.state];
  return (
    <Panel tone={state.tone} className={className}>
      <div className="flex flex-1 flex-col gap-3">
        <p className="text-base font-bold">{subsystem.name}</p>
        <p className="flex items-center gap-2 text-4xl leading-none font-extrabold tracking-tight">
          <RmcStateIcon state={subsystem.state} className="size-9 shrink-0" />
          {state.word}
        </p>
        <p className="text-2xl leading-tight font-bold tabular-nums">
          {subsystem.figure}
          <span className="block text-sm font-semibold">{subsystem.figureLabel}</span>
        </p>
        <p className="text-sm leading-snug font-medium">{subsystem.note}</p>
      </div>
    </Panel>
  );
}

/** The checks of one subsystem, each row filled with its result. */
function RmcChecks({ subsystem, className }: { subsystem: RmcSubsystem; className?: string }) {
  return (
    <Panel title="Checks" subtitle={`${rmcDone(subsystem)} of ${subsystem.checks.length} done`} className={className}>
      <ul className="flex flex-1 flex-col gap-1.5">
        {subsystem.checks.map((check) => (
          <li
            key={check.label}
            data-tone={RMC_CHECK_TONE[check.state]}
            className={`flex flex-1 items-center gap-2.5 rounded-[var(--kit-radius-sm)] px-3 py-2 text-sm leading-snug font-semibold ${
              check.state === 'open' ? 'bg-[var(--kit-track)]' : 'bg-[var(--t-vivid)] text-[var(--t-on-vivid)]'
            }`}
          >
            <RmcCheckIcon state={check.state} />
            <span className="min-w-0 flex-1">{check.label}</span>
            <span className="shrink-0 font-bold">{RMC_CHECK_WORD[check.state]}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/** What happens next, with the time to it as the figure. */
function RmcNextTile() {
  return (
    <Panel tone="info">
      <p className="text-base font-bold">Next milestone</p>
      <p className="mt-3 text-4xl leading-none font-extrabold tracking-tight tabular-nums">{formatDuration(RMC_NEXT.minute - RMC_SHIFT.now)}</p>
      <p className="mt-3 text-lg leading-tight font-bold">{RMC_NEXT.title}</p>
      <p className="text-sm font-semibold tabular-nums">At {formatClock(RMC_NEXT.minute)} in the control room</p>
    </Panel>
  );
}

/** The shift as a list: what happened and what is still to come. */
function RmcTimeline({ className }: { className?: string }) {
  return (
    <Panel title="Shift timeline" subtitle="Milestones on the clock ring" className={className}>
      <ol className="flex flex-1 flex-col justify-between gap-1">
        {RMC_MILESTONES.map((milestone) => {
          const past = milestone.minute <= RMC_SHIFT.now;
          return (
            <li key={milestone.id} data-tone={milestone.tone} className="flex items-center gap-3 border-l-4 border-[var(--t-vivid)] py-1 pl-3">
              <span className="w-11 shrink-0 text-sm font-bold tabular-nums">{formatClock(milestone.minute)}</span>
              <span className={`min-w-0 flex-1 text-sm leading-snug font-semibold ${past ? 'text-[var(--kit-text-2)]' : ''}`}>{milestone.title}</span>
              {past ? <IconCheck className="size-4 shrink-0 text-[var(--kit-text-2)]" aria-label="Passed" /> : null}
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

/** The restart poll: every subsystem answers go, hold or no go. */
function RmcPoll({ selected, className }: { selected?: string; className?: string }) {
  const go = RMC_SUBSYSTEMS.filter((subsystem) => RMC_STATE[subsystem.state].poll === 'Go').length;
  return (
    <Panel title="Restart poll" subtitle={`${go} go · ${RMC_SUBSYSTEMS.length - go} not ready`} className={className}>
      <ul className="grid flex-1 grid-cols-2 gap-1.5">
        {RMC_SUBSYSTEMS.map((subsystem) => {
          const state = RMC_STATE[subsystem.state];
          return (
            <li
              key={subsystem.id}
              data-tone={state.poll === 'Go' ? 'success' : state.tone}
              className={`flex flex-col justify-center rounded-[var(--kit-radius-sm)] bg-[var(--t-vivid)] px-3 py-1.5 text-[var(--t-on-vivid)] ${
                subsystem.id === selected ? 'outline-2 outline-offset-1 outline-[var(--kit-text)]' : ''
              }`}
            >
              <span className="text-xs font-semibold">{subsystem.short}</span>
              <span className="text-base leading-tight font-extrabold">{state.poll}</span>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

function RmcPills() {
  return (
    <>
      <StatusPill tone="critical" size="lg">
        1 fault
      </StatusPill>
      <StatusPill tone="warning" size="lg">
        1 watch
      </StatusPill>
      <StatusPill tone="success" size="lg">
        5 nominal
      </StatusPill>
    </>
  );
}

function RadialMissionControlSignature() {
  const [selected, setSelected] = useState('recompressor');
  const [pulse, setPulse] = useState(false);
  const subsystem = rmcSubsystem(selected);
  return (
    <LookScope look="signal">
      <AppFrame
        brand={{ name: 'Nordkapp' }}
        title="Mission control"
        subtitle="Day shift · Thursday 12 March · 14:00 UTC"
        status={<RmcPills />}
        actions={<Switch label="Pulse faults" checked={pulse} onCheckedChange={setPulse} />}
      >
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] gap-[var(--kit-gap)]">
          <div className="grid grid-rows-[auto_1fr_auto] gap-[var(--kit-gap)]">
            <RmcClockTile />
            <RmcStateTile subsystem={subsystem} />
            <RmcPoll selected={selected} />
          </div>
          <div className="flex flex-col justify-between gap-3 px-3 py-1">
            <RmcDial selected={selected} onSelect={setSelected} pulse={pulse}>
              <RmcDialCenter subsystem={subsystem} />
            </RmcDial>
            <RmcPicker selected={selected} onSelect={setSelected} />
          </div>
          <div className="grid grid-rows-[auto_1fr] gap-[var(--kit-gap)]">
            <RmcNextTile />
            <RmcChecks subsystem={subsystem} />
          </div>
        </div>
      </AppFrame>
    </LookScope>
  );
}

function RadialMissionControlSubsystem() {
  const [selected, setSelected] = useState('compression');
  const subsystem = rmcSubsystem(selected);
  const state = RMC_STATE[subsystem.state];
  return (
    <LookScope look="signal">
      <Canvas>
        <div className="grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-[var(--kit-gap)]">
          <div className="flex flex-col justify-center gap-4 p-3">
            <RmcDial selected={selected} onSelect={setSelected} clock={false} labels={false}>
              <RmcDialCenter subsystem={subsystem} compact />
            </RmcDial>
            <p className="text-center text-sm font-medium text-[var(--kit-text-2)]">Pick an arc to change subsystem</p>
          </div>
          <div className="flex flex-col gap-[var(--kit-gap)]">
            <Panel tone={state.tone}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-base font-bold">{subsystem.name}</p>
                  <p className="mt-1 flex items-center gap-3 text-6xl leading-none font-extrabold tracking-tighter">
                    <RmcStateIcon state={subsystem.state} className="size-12 shrink-0" />
                    {state.word}
                  </p>
                </div>
                <p className="text-right text-3xl leading-tight font-extrabold tabular-nums">
                  {subsystem.figure}
                  <span className="block text-sm font-semibold">{subsystem.figureLabel}</span>
                </p>
              </div>
              <p className="mt-3 text-base font-medium">{subsystem.note}</p>
            </Panel>
            <ul className="grid flex-1 grid-cols-2 gap-[var(--kit-gap)]">
              {subsystem.checks.map((check, index) => (
                <li
                  key={check.label}
                  data-tone={RMC_CHECK_TONE[check.state]}
                  className={`flex flex-col justify-between gap-2 rounded-[var(--kit-radius)] p-4 ${
                    check.state === 'open' ? 'bg-[var(--kit-surface)]' : 'bg-[var(--t-vivid)] text-[var(--t-on-vivid)]'
                  } ${index === subsystem.checks.length - 1 && subsystem.checks.length % 2 === 1 ? 'col-span-2' : ''}`}
                >
                  <span className="flex items-center gap-2 text-2xl leading-none font-extrabold">
                    <RmcCheckIcon state={check.state} />
                    {RMC_CHECK_WORD[check.state]}
                  </span>
                  <span className="text-sm leading-snug font-semibold">{check.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Canvas>
    </LookScope>
  );
}

function RadialMissionControlCompact() {
  const [selected, setSelected] = useState('export');
  const subsystem = rmcSubsystem(selected);
  return (
    <LookScope look="signal">
      <Canvas>
        <div className="flex flex-col gap-3 p-2">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-lg font-extrabold">Nordkapp</p>
            <p className="text-sm font-semibold text-[var(--kit-text-2)] tabular-nums">{formatElapsed(RMC_SHIFT)}</p>
          </div>
          <RmcDial selected={selected} onSelect={setSelected} labels={false}>
            <RmcDialCenter subsystem={subsystem} compact />
          </RmcDial>
          <RmcPickerCompact selected={selected} onSelect={setSelected} />
        </div>
      </Canvas>
    </LookScope>
  );
}

/** Previous and next for a screen too narrow for eight buttons. */
function RmcPickerCompact({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  const index = RMC_SUBSYSTEMS.findIndex((subsystem) => subsystem.id === selected);
  const step = (offset: number) => onSelect(RMC_SUBSYSTEMS[(index + offset + RMC_SUBSYSTEMS.length) % RMC_SUBSYSTEMS.length].id);
  const subsystem = rmcSubsystem(selected);
  const button = 'rounded-[var(--kit-radius-sm)] bg-[var(--kit-surface)] px-3 py-2 text-sm font-bold outline-offset-2 focus-visible:outline-2 focus-visible:outline-[var(--kit-text)]';
  return (
    <div className="flex items-stretch gap-2">
      <button type="button" className={button} onClick={() => step(-1)}>
        Previous
      </button>
      <p
        data-tone={RMC_STATE[subsystem.state].tone}
        aria-live="polite"
        className="flex min-w-0 flex-1 items-center justify-center rounded-[var(--kit-radius-sm)] bg-[var(--t-vivid)] px-2 text-center text-sm font-bold text-[var(--t-on-vivid)]"
      >
        {subsystem.short}
      </p>
      <button type="button" className={button} onClick={() => step(1)}>
        Next
      </button>
    </div>
  );
}

function RadialMissionControlClockRing() {
  return (
    <LookScope look="signal" className="w-full">
      <Canvas>
        <div className="p-4">
          <RmcDial selected="inlet" arcs={false}>
            <RmcClockCenter />
          </RmcDial>
        </div>
      </Canvas>
    </LookScope>
  );
}

function RadialMissionControlArcs() {
  const [selected, setSelected] = useState('compression');
  return (
    <LookScope look="signal" className="w-full">
      <Canvas>
        <div className="p-4">
          <RmcDial selected={selected} onSelect={setSelected} clock={false} labels={false}>
            <RmcDialCenter subsystem={rmcSubsystem(selected)} compact />
          </RmcDial>
        </div>
      </Canvas>
    </LookScope>
  );
}

function RadialMissionControlStateTile() {
  return (
    <LookScope look="signal" className="w-full">
      <Canvas className="flex h-full flex-col gap-[var(--kit-gap)]">
        <RmcStateTile subsystem={rmcSubsystem('recompressor')} className="flex-1" />
        <RmcClockTile />
      </Canvas>
    </LookScope>
  );
}

function RadialMissionControlChecks() {
  return (
    <LookScope look="signal" className="w-full">
      <Canvas className="flex h-full flex-col">
        <RmcChecks subsystem={rmcSubsystem('compression')} className="flex-1" />
      </Canvas>
    </LookScope>
  );
}

function RadialMissionControlTimeline() {
  return (
    <LookScope look="signal" className="w-full">
      <Canvas className="flex h-full flex-col gap-[var(--kit-gap)]">
        <RmcNextTile />
        <RmcTimeline className="flex-1" />
      </Canvas>
    </LookScope>
  );
}

function RadialMissionControlPoll() {
  const [selected, setSelected] = useState('recompressor');
  return (
    <LookScope look="signal" className="w-full">
      <Canvas className="flex h-full flex-col gap-[var(--kit-gap)]">
        <RmcPoll selected={selected} className="flex-1" />
        <RmcPickerCompact selected={selected} onSelect={setSelected} />
      </Canvas>
    </LookScope>
  );
}

export default definePage({
  id: 'radial-mission-control',
  title: 'Radial mission control',
  summary:
    'A shift run like a mission: one dial with the clock on the outside, a state-filled arc per subsystem and the picked subsystem in the middle, flanked by signal tiles.',
  guidance: {
    use: [
      'When time left and readiness matter together: a restart, a turnaround, a shift with a deadline.',
      'For six to ten subsystems; each arc must stay wide enough to carry its icon and name.',
      'On a wall screen or a supervisor desk where state has to read from across the room.',
    ],
    avoid: [
      'More than ten arcs, or arcs sized by a value: equal arcs keep the ring readable.',
      'Colour as the only signal: every arc has an icon and the centre spells the state.',
      'Running the fault pulse by default: it is a switch, off until someone asks for it.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Pick an arc or a subsystem button: the centre, the state tile, the checks and the inner ring follow.',
      specimens: [
        {
          id: 'RadialMissionControlSignature',
          title: 'Mission dial',
          note: 'Pick it when a supervisor has to see time left and subsystem readiness in one glance.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/radial-mission-control/polar.ts', 'kit/radial-mission-control/mission.ts', 'kit/AppFrame.tsx', 'kit/Panel.tsx', 'looks/LookScope.tsx'],
          Component: RadialMissionControlSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Variations',
      description: 'Other screens of the same product: one subsystem opened up, and the dial alone for a narrow display.',
      specimens: [
        {
          id: 'RadialMissionControlSubsystem',
          title: 'Subsystem readiness',
          note: 'Pick it as the drill-in: the arcs become the navigation and every check is a tile with its result as a word.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          bleed: true,
          uses: ['kit/radial-mission-control/polar.ts', 'kit/Panel.tsx', 'kit/Canvas.tsx'],
          Component: RadialMissionControlSubsystem,
        },
        {
          id: 'RadialMissionControlCompact',
          title: 'Dial only',
          note: 'Pick it for a tablet by the door or a side display: the dial, the state in the middle and two buttons.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/radial-mission-control/polar.ts', 'kit/radial-mission-control/mission.ts', 'kit/Canvas.tsx'],
          Component: RadialMissionControlCompact,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The rings and tiles on their own.',
      specimens: [
        {
          id: 'RadialMissionControlClockRing',
          title: 'Clock ring',
          note: 'Pick it to show a time window as one turn with milestones as markers and the present as an open dot.',
          origin: 'custom',
          align: 'stretch',
          bleed: true,
          uses: ['kit/radial-mission-control/mission.ts', 'kit/radial-mission-control/polar.ts'],
          Component: RadialMissionControlClockRing,
        },
        {
          id: 'RadialMissionControlArcs',
          title: 'Subsystem arcs',
          note: 'Pick it as a selector when the items are peers and their state is the first thing to read.',
          origin: 'custom',
          align: 'stretch',
          bleed: true,
          uses: ['kit/radial-mission-control/polar.ts'],
          Component: RadialMissionControlArcs,
        },
        {
          id: 'RadialMissionControlStateTile',
          title: 'State and clock tiles',
          note: 'Pick them for the two facts that lead the screen: what state the picked thing is in and how much time is left.',
          origin: 'custom',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx'],
          Component: RadialMissionControlStateTile,
        },
        {
          id: 'RadialMissionControlChecks',
          title: 'Check list',
          note: 'Pick it for readiness checks where each row carries its result as a fill and a word.',
          origin: 'custom',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx'],
          Component: RadialMissionControlChecks,
        },
        {
          id: 'RadialMissionControlTimeline',
          title: 'Next milestone and timeline',
          note: 'Pick it beside a clock ring so the markers on the ring have names and times.',
          origin: 'custom',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/radial-mission-control/mission.ts'],
          Component: RadialMissionControlTimeline,
        },
        {
          id: 'RadialMissionControlPoll',
          title: 'Go or no-go poll',
          note: 'Pick it before a restart or a start-up, when every subsystem has to answer and one hold stops the count.',
          origin: 'custom',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx'],
          Component: RadialMissionControlPoll,
        },
      ],
    },
  ],
});
