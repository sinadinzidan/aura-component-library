import { Button } from '@cognite/aura/components/button';
import { Slider } from '@cognite/aura/components/slider';
import {
  IconAlertOctagon,
  IconAlertTriangle,
  IconChevronLeft,
  IconChevronRight,
  IconCircleCheck,
  IconHistory,
  IconListDetails,
  IconPlayerSkipBack,
  IconPlayerSkipForward,
  IconReport,
  IconTimeline,
} from '@cognite/aura/icons';
import { useId, useState } from 'react';
import type { MouseEvent } from 'react';

import { AppFrame, type AppFrameNavItem } from '../../../library/kit/AppFrame';
import { Bars } from '../../../library/kit/Bars';
import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { Grid } from '../../../library/kit/Grid';
import { ListRow } from '../../../library/kit/ListRow';
import { Meter } from '../../../library/kit/Meter';
import { Panel } from '../../../library/kit/Panel';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import { formatNumber, type Tone } from '../../../library/kit/tones';
import { LookScope } from '../../../library/looks/LookScope';
import { definePage } from '../../types';

import source from './incident-replay.tsx?raw';

type IrLane = 'alarm' | 'protection' | 'operator' | 'field';

type IrEvent = {
  id: string;
  /** Minutes after 13:30 UTC. */
  t: number;
  lane: IrLane;
  title: string;
  detail: string;
  actor: string;
  tone: Tone;
  /** Short label drawn above or below the marker; neighbours alternate so labels never meet. */
  tag?: string;
  side?: 'up' | 'down';
  /** Which edge of the label sits on the marker, for events near the ends of the axis. */
  anchor?: 'start' | 'end';
};

type IrCurve = readonly (readonly [number, number])[];

const IR_SPAN = 30;

const IR_LANES: readonly { id: IrLane; label: string; caption: string }[] = [
  { id: 'alarm', label: 'Alarms', caption: 'Raised and cleared' },
  { id: 'protection', label: 'Protection', caption: 'Automatic actions' },
  { id: 'operator', label: 'Operator', caption: 'Control room' },
  { id: 'field', label: 'Field', caption: 'On the skid' },
];

const IR_LANE_LABEL: Record<IrLane, string> = { alarm: 'Alarm', protection: 'Protection', operator: 'Operator', field: 'Field' };

const IR_EVENTS: readonly IrEvent[] = [
  { id: 'e1', t: 2, lane: 'alarm', title: 'Drive-end vibration high', detail: '7.3 mm/s against a limit of 7.1 mm/s on 23-VT-92740.', actor: 'Alarm system', tone: 'warning', tag: 'Vibration high', side: 'up', anchor: 'start' },
  { id: 'e2', t: 3.5, lane: 'operator', title: 'Alarm acknowledged', detail: 'Vibration alarm acknowledged from console 2.', actor: 'Ingrid Haugen', tone: 'info', tag: 'Acknowledged', side: 'up' },
  { id: 'e3', t: 6, lane: 'operator', title: 'Speed reduced to 96 %', detail: 'Set point lowered from 100 % to bring the vibration down.', actor: 'Ingrid Haugen', tone: 'info', tag: 'Speed 96 %', side: 'down' },
  { id: 'e4', t: 9, lane: 'alarm', title: 'Discharge temperature high', detail: '146.3 °C against a limit of 145.0 °C on 23-TT-92532.', actor: 'Alarm system', tone: 'warning', tag: 'Temperature high', side: 'down' },
  { id: 'e5', t: 11, lane: 'operator', title: 'Rotating equipment engineer called', detail: 'Asked for a decision on a controlled stop.', actor: 'Ingrid Haugen', tone: 'info', tag: 'Engineer called', side: 'up' },
  { id: 'e6', t: 14.5, lane: 'alarm', title: 'Drive-end vibration high-high', detail: '11.6 mm/s against a trip limit of 11.0 mm/s. Two-second trip delay started.', actor: 'Alarm system', tone: 'critical', tag: 'High-high', side: 'up' },
  { id: 'e7', t: 16, lane: 'protection', title: 'Recompressor tripped', detail: 'First-out: vibration high-high on 23-VT-92740. Driver stopped.', actor: 'Machine protection', tone: 'critical', tag: 'Trip', side: 'up' },
  { id: 'e8', t: 16.6, lane: 'protection', title: 'Anti-surge valve opened', detail: '23-FV-9120 driven fully open by the surge controller.', actor: 'Surge controller', tone: 'warning' },
  { id: 'e9', t: 17.2, lane: 'protection', title: 'Discharge valve closed', detail: '23-XV-9131 closed on the trip signal, travel time 4.2 s.', actor: 'Safety system', tone: 'warning', tag: 'Valves to safe state', side: 'down' },
  { id: 'e10', t: 17.8, lane: 'alarm', title: 'Export pressure low', detail: '148 barg against a limit of 150 barg on the export header.', actor: 'Alarm system', tone: 'warning', tag: 'Export pressure low', side: 'down' },
  { id: 'e11', t: 19, lane: 'operator', title: 'Export held at 4.38 MSm³/d', detail: 'Load moved to the first and second stage; export set point lowered.', actor: 'Ingrid Haugen', tone: 'info', tag: 'Export lowered', side: 'down' },
  { id: 'e12', t: 21, lane: 'field', title: 'Technician sent to the skid', detail: 'Local check of the drive-end bearing housing requested.', actor: 'Liv Wold', tone: 'info', tag: 'Dispatched', side: 'up' },
  { id: 'e13', t: 24.5, lane: 'operator', title: 'Work order WO-104482 raised', detail: 'Inspect recompressor drive-end bearing, priority 1.', actor: 'Magnus Solberg', tone: 'info', tag: 'Work order', side: 'up' },
  { id: 'e14', t: 26.5, lane: 'field', title: 'Bearing housing hot, oil discoloured', detail: 'Housing at 94 °C by hand-held reading; sample taken.', actor: 'Tomás Barros', tone: 'warning', tag: 'Local finding', side: 'down' },
  { id: 'e15', t: 29, lane: 'alarm', title: 'Vibration alarms cleared', detail: 'Machine at rest, all vibration alarms returned to normal.', actor: 'Alarm system', tone: 'success', tag: 'Cleared', side: 'up', anchor: 'end' },
];

const IR_VIBRATION: IrCurve = [[0, 5.8], [2, 7.3], [6, 8.4], [7.5, 7.6], [9, 7.9], [12, 9.4], [14.5, 11.6], [16, 12.4], [16.6, 6], [18, 1.2], [20, 0.4], [30, 0.3]];

const IR_TEMPERATURE: IrCurve = [[0, 138.2], [6, 142.5], [9, 146.3], [16, 149.1], [20, 121], [30, 88.4]];

const IR_SPEED: IrCurve = [[0, 100], [6, 100], [6.5, 96], [16, 96], [17.5, 12], [19, 0], [30, 0]];

const IR_EXPORT: IrCurve = [[0, 4.52], [16, 4.5], [18, 4.21], [19, 4.24], [24, 4.38], [30, 4.38]];

const IR_HIGH = 7.1;

const IR_TRIP = 11;

const IR_NAV: AppFrameNavItem[] = [
  { id: 'replay', label: 'Replay', icon: <IconHistory /> },
  { id: 'sequence', label: 'Sequence of events', icon: <IconListDetails /> },
  { id: 'trends', label: 'Trends', icon: <IconTimeline /> },
  { id: 'report', label: 'Report', icon: <IconReport /> },
];

/** Value of a piecewise-linear curve at a time. */
function irAt(curve: IrCurve, t: number): number {
  const next = curve.findIndex(([time]) => time >= t);
  if (next <= 0) return curve[next === 0 ? 0 : curve.length - 1][1];
  const [t0, v0] = curve[next - 1];
  const [t1, v1] = curve[next];
  return v0 + ((v1 - v0) * (t - t0)) / (t1 - t0);
}

/** "13:46:30" for a number of minutes after 13:30. */
function irClock(t: number, seconds = true): string {
  const total = Math.round(t * 60);
  const minutes = 30 + Math.floor(total / 60);
  const hh = 13 + Math.floor(minutes / 60);
  const mm = String(minutes % 60).padStart(2, '0');
  return seconds ? `${hh}:${mm}:${String(total % 60).padStart(2, '0')}` : `${hh}:${mm}`;
}

function irSpan(minutes: number): string {
  const total = Math.round(Math.abs(minutes) * 60);
  return total >= 60 ? `${Math.floor(total / 60)} min ${String(total % 60).padStart(2, '0')} s` : `${total} s`;
}

function irPhase(t: number): { word: string; tone: Tone; note: string } {
  if (t < 2) return { word: 'Normal', tone: 'success', note: 'All three stages running at full speed.' };
  if (t < 14.5) return { word: 'Alarm', tone: 'warning', note: 'Vibration above the high limit and climbing.' };
  if (t < 16) return { word: 'Pre-trip', tone: 'critical', note: 'Vibration above the trip limit, delay timer running.' };
  if (t < 21) return { word: 'Tripped', tone: 'critical', note: 'Recompressor stopped by machine protection.' };
  return { word: 'Recovering', tone: 'info', note: 'Export steady on two stages, bearing under inspection.' };
}

function irPast(t: number): IrEvent[] {
  return IR_EVENTS.filter((event) => event.t <= t);
}

/** The event the playhead has most recently passed. */
function irLatest(t: number): IrEvent | undefined {
  const past = irPast(t);
  return past[past.length - 1];
}

function irLeft(t: number): string {
  return `${(t / IR_SPAN) * 100}%`;
}

function IrEventIcon({ tone }: { tone: Tone }) {
  if (tone === 'critical') return <IconAlertOctagon />;
  if (tone === 'warning') return <IconAlertTriangle />;
  if (tone === 'success') return <IconCircleCheck />;
  return <IconChevronRight />;
}

type IrPlayhead = { minute: number; seek: (t: number) => void; nudge: (delta: number) => void; jump: (direction: 1 | -1) => void };

/** The playhead and the ways to move it: seek, nudge by a minute, jump to the next or previous event. */
function useIrPlayhead(initial: number): IrPlayhead {
  const [minute, setMinute] = useState(initial);
  const seek = (t: number) => setMinute(Math.min(IR_SPAN, Math.max(0, Math.round(t * 2) / 2)));
  return {
    minute,
    seek,
    nudge: (delta) => seek(minute + delta),
    jump: (direction) => {
      const target = direction === 1 ? IR_EVENTS.find((event) => event.t > minute) : [...IR_EVENTS].reverse().find((event) => event.t < minute);
      setMinute(target ? target.t : direction === 1 ? IR_SPAN : 0);
    },
  };
}

function IrHeader({ minute }: { minute: number }) {
  const phase = irPhase(minute);
  return (
    <header className="flex items-stretch bg-[var(--kit-surface)]">
      <div data-tone="critical" className="flex items-center gap-2.5 bg-[var(--t-solid)] px-4 text-[var(--t-on-solid)] [&>svg]:size-5">
        <IconHistory aria-hidden="true" />
        <span className="text-base font-semibold whitespace-nowrap">Incident 26-031</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center px-4 py-2.5">
        <h2 className="text-base font-semibold text-[var(--kit-text)]">Recompressor trip on high vibration</h2>
        <p className="text-sm text-[var(--kit-text-2)]">Nordkapp · Thursday 12 March · replay window 13:30 to 14:00 UTC</p>
      </div>
      <div className="flex flex-col justify-center border-l border-[var(--kit-rule)] px-5 text-right">
        <span className="text-xs text-[var(--kit-text-2)]">Playhead, UTC</span>
        <span className="text-3xl leading-tight font-medium text-[var(--kit-text)] tabular-nums">{irClock(minute)}</span>
      </div>
      <div data-tone={phase.tone} className="flex w-44 flex-col justify-center bg-[var(--t-solid)] px-4 text-[var(--t-on-solid)]">
        <span className="text-xs font-medium">Train state</span>
        <span className="text-2xl leading-tight font-semibold">{phase.word}</span>
      </div>
    </header>
  );
}

function IrTransport({ playhead }: { playhead: IrPlayhead }) {
  const { minute, seek, nudge, jump } = playhead;
  const trip = 16 - minute;
  return (
    <div className="flex items-center gap-4 bg-[var(--kit-surface)] px-4 py-2.5">
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="sm" onClick={() => jump(-1)}>
          <IconPlayerSkipBack /> Previous event
        </Button>
        <Button variant="outline" size="icon-sm" aria-label="Back one minute" onClick={() => nudge(-1)}>
          <IconChevronLeft />
        </Button>
        <Button variant="outline" size="icon-sm" aria-label="Forward one minute" onClick={() => nudge(1)}>
          <IconChevronRight />
        </Button>
        <Button size="sm" onClick={() => jump(1)}>
          Next event <IconPlayerSkipForward />
        </Button>
      </div>
      <span className="text-sm text-[var(--kit-text-2)] tabular-nums">13:30</span>
      <Slider className="min-w-0 flex-1" value={[minute]} min={0} max={IR_SPAN} step={0.5} onValueChange={(next) => seek(next[0] ?? 0)} aria-label="Playhead position in minutes after 13:30" />
      <span className="text-sm text-[var(--kit-text-2)] tabular-nums">14:00</span>
      <span className="w-40 text-right text-sm font-medium whitespace-nowrap text-[var(--kit-text)] tabular-nums">
        {trip > 0 ? `${irSpan(trip)} to trip` : trip === 0 ? 'At the trip' : `${irSpan(trip)} after trip`}
      </span>
    </div>
  );
}

const IR_TRACK = 'absolute inset-y-0 right-4 left-[7.5rem]';

/** The vibration trend that explains the trip: bright up to the playhead, faint after it. */
function IrProcessLane({ minute }: { minute: number }) {
  const clip = useId().replace(/:/g, '');
  const top = 14;
  const path = IR_VIBRATION.map(([t, value], index) => `${index === 0 ? 'M' : 'L'} ${t} ${top - value}`).join(' ');
  const now = irAt(IR_VIBRATION, minute);
  const tone: Tone = now >= IR_TRIP ? 'critical' : now >= IR_HIGH ? 'warning' : 'accent';
  return (
    <div className="relative h-44 border-b border-[var(--kit-rule)]">
      <div className="absolute inset-y-0 left-0 flex w-[7.5rem] flex-col justify-center px-4">
        <span className="text-sm font-semibold text-[var(--kit-text)]">Vibration</span>
        <span className="text-xs text-[var(--kit-text-2)]">Drive end, mm/s</span>
      </div>
      <div className={IR_TRACK}>
        <svg viewBox={`0 0 ${IR_SPAN} ${top}`} preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 size-full overflow-visible">
          <defs>
            <clipPath id={clip}>
              <rect x="0" y="0" width={minute} height={top} />
            </clipPath>
          </defs>
          <rect x="0" y="0" width={IR_SPAN} height={top - IR_TRIP} fill="var(--kit-line-critical)" fillOpacity="0.12" />
          <line x1="0" x2={IR_SPAN} y1={top - IR_TRIP} y2={top - IR_TRIP} stroke="var(--kit-line-critical)" strokeWidth="1.25" strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
          <line x1="0" x2={IR_SPAN} y1={top - IR_HIGH} y2={top - IR_HIGH} stroke="var(--kit-line-warning)" strokeWidth="1.25" strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
          <path d={path} fill="none" stroke="var(--kit-text-3)" strokeOpacity="0.55" strokeWidth="1.5" strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
          <path d={`${path} L ${IR_SPAN} ${top} L 0 ${top} Z`} fill="var(--kit-line-accent)" fillOpacity="0.14" clipPath={`url(#${clip})`} />
          <path d={path} fill="none" stroke="var(--kit-line-accent)" strokeWidth="2.25" vectorEffect="non-scaling-stroke" clipPath={`url(#${clip})`} />
        </svg>
        <span className="absolute right-0 -translate-y-full pb-0.5 text-xs font-medium text-[var(--kit-line-critical)]" style={{ top: `${((top - IR_TRIP) / top) * 100}%` }}>
          Trip 11.0
        </span>
        <span className="absolute right-0 -translate-y-full pb-0.5 text-xs font-medium text-[var(--kit-line-warning)]" style={{ top: `${((top - IR_HIGH) / top) * 100}%` }}>
          High 7.1
        </span>
        <span
          data-tone={tone}
          className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--kit-surface)] bg-[var(--t-line)]"
          style={{ left: irLeft(minute), top: `${((top - now) / top) * 100}%` }}
        />
        <span
          data-tone={tone}
          className={`absolute -translate-y-1/2 bg-[var(--t-solid)] px-1.5 py-0.5 text-sm font-semibold whitespace-nowrap text-[var(--t-on-solid)] tabular-nums ${minute > 22 ? '-translate-x-full' : ''}`}
          style={{ left: `calc(${irLeft(minute)} + ${minute > 22 ? -12 : 12}px)`, top: `${Math.max(12, ((top - now) / top) * 100)}%` }}
        >
          {formatNumber(now, 1)} mm/s
        </span>
      </div>
    </div>
  );
}

function IrMarker({ event, minute, onSeek }: { event: IrEvent; minute: number; onSeek: (t: number) => void }) {
  const past = event.t <= minute;
  const current = irLatest(minute)?.id === event.id;
  return (
    <button
      type="button"
      aria-label={`${irClock(event.t)} ${event.title}`}
      title={`${irClock(event.t)} · ${event.title}`}
      onClick={(click) => {
        click.stopPropagation();
        onSeek(event.t);
      }}
      data-tone={event.tone}
      style={{ left: irLeft(event.t) }}
      className="group absolute top-1/2 z-10 flex size-0 cursor-pointer items-center justify-center outline-none"
    >
      <span
        className={`size-3.5 shrink-0 border-2 border-[var(--t-line)] group-hover:scale-125 group-focus-visible:ring-2 group-focus-visible:ring-[var(--kit-text)] ${past ? 'bg-[var(--t-line)]' : 'bg-[var(--kit-surface)]'} ${
          current ? 'ring-2 ring-[var(--kit-text)] ring-offset-2 ring-offset-[var(--kit-surface)]' : ''
        }`}
      />
      {event.tag ? (
        <span
          className={`absolute text-xs whitespace-nowrap ${event.side === 'down' ? 'top-3.5' : 'bottom-3.5'} ${
            event.anchor === 'start' ? '-left-2' : event.anchor === 'end' ? '-right-2' : 'left-1/2 -translate-x-1/2'
          } ${past ? 'font-medium text-[var(--kit-text)]' : 'text-[var(--kit-text-3)]'}`}
        >
          {event.tag}
        </span>
      ) : null}
    </button>
  );
}

/** Process trend and four event lanes on one time axis, with the playhead through all of them. */
function IrLanes({ playhead }: { playhead: IrPlayhead }) {
  const { minute, seek } = playhead;
  const scrub = (click: MouseEvent<HTMLDivElement>) => {
    const box = click.currentTarget.getBoundingClientRect();
    seek(((click.clientX - box.left) / box.width) * IR_SPAN);
  };
  return (
    <div className="relative flex flex-1 flex-col">
      <IrProcessLane minute={minute} />
      {IR_LANES.map((lane) => (
        <div key={lane.id} className="relative min-h-[4.5rem] flex-1 border-b border-[var(--kit-rule)] even:bg-[var(--kit-well)]">
          <div className="absolute inset-y-0 left-0 flex w-[7.5rem] flex-col justify-center px-4">
            <span className="text-sm font-semibold text-[var(--kit-text)]">{lane.label}</span>
            <span className="text-xs text-[var(--kit-text-2)]">{lane.caption}</span>
          </div>
          <div className={IR_TRACK}>
            <span className="absolute inset-x-0 top-1/2 border-t border-[var(--kit-rule)]" />
            {IR_EVENTS.filter((event) => event.lane === lane.id).map((event) => (
              <IrMarker key={event.id} event={event} minute={minute} onSeek={seek} />
            ))}
          </div>
        </div>
      ))}
      <div className="relative h-8">
        <div className={IR_TRACK}>
          {[0, 5, 10, 15, 20, 25, 30].map((tick) => (
            <span key={tick} className={`absolute top-2 text-xs text-[var(--kit-text-2)] tabular-nums ${tick === 0 ? '' : tick === IR_SPAN ? '-translate-x-full' : '-translate-x-1/2'}`} style={{ left: irLeft(tick) }}>
              {irClock(tick, false)}
            </span>
          ))}
        </div>
      </div>
      <div className={`${IR_TRACK} cursor-col-resize`} onClick={scrub} role="presentation">
        {[5, 10, 15, 20, 25].map((tick) => (
          <span key={tick} className="absolute inset-y-0 border-l border-dotted border-[var(--kit-rule)]" style={{ left: irLeft(tick) }} />
        ))}
        <span className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-[var(--kit-text)]" style={{ left: irLeft(minute) }} />
        <span
          className="pointer-events-none absolute top-0 -translate-x-1/2 bg-[var(--kit-text)] px-1.5 text-xs font-semibold text-[var(--kit-surface)] tabular-nums"
          style={{ left: irLeft(minute) }}
        >
          {irClock(minute)}
        </span>
      </div>
    </div>
  );
}

/** The spine: the two events behind the playhead and the two ahead of it. */
function IrEventCards({ playhead }: { playhead: IrPlayhead }) {
  const { minute, seek } = playhead;
  const past = irPast(minute).slice(-2);
  const ahead = IR_EVENTS.filter((event) => event.t > minute).slice(0, 4 - past.length);
  const cards = [...past, ...ahead];
  const currentId = irLatest(minute)?.id;
  return (
    <ol className="grid flex-1 grid-cols-4 gap-px bg-[var(--kit-rule)]">
      {cards.map((event) => {
        const happened = event.t <= minute;
        return (
          <li key={event.id} className="flex bg-[var(--kit-surface)]">
            <button
              type="button"
              onClick={() => seek(event.t)}
              data-tone={event.tone}
              className={`flex w-full cursor-pointer flex-col gap-1.5 border-t-4 p-3.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--kit-text)] focus-visible:ring-inset ${
                happened ? 'border-[var(--t-line)]' : 'border-transparent'
              } ${event.id === currentId ? 'bg-[color-mix(in_oklab,var(--t-line)_16%,transparent)]' : ''}`}
            >
              <span className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                <span className={`text-xl font-medium tabular-nums ${happened ? 'text-[var(--kit-text)]' : 'text-[var(--kit-text-3)]'}`}>{irClock(event.t)}</span>
                {happened ? (
                  <StatusPill tone={event.tone} icon={<IrEventIcon tone={event.tone} />}>
                    {IR_LANE_LABEL[event.lane]}
                  </StatusPill>
                ) : (
                  <span className="text-xs whitespace-nowrap text-[var(--kit-text-2)] tabular-nums">in {irSpan(event.t - minute)}</span>
                )}
              </span>
              <span className={`text-sm font-semibold ${happened ? 'text-[var(--kit-text)]' : 'text-[var(--kit-text-2)]'}`}>{event.title}</span>
              <span className={`text-sm ${happened ? 'text-[var(--kit-text-2)]' : 'text-[var(--kit-text-3)]'}`}>{event.detail}</span>
              <span className="mt-auto pt-1 text-xs text-[var(--kit-text-2)]">{event.actor}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function irReadingTone(value: number, high: number, trip: number): Tone {
  return value >= trip ? 'critical' : value >= high ? 'warning' : 'neutral';
}

function IrReading({ label, value, unit, caption, tone = 'neutral' }: { label: string; value: string; unit: string; caption: string; tone?: Tone }) {
  return (
    <div data-tone={tone} className="min-w-0">
      <dt className="text-xs text-[var(--kit-text-2)]">{label}</dt>
      <dd className="mt-1">
        <span className={`text-2xl leading-tight font-medium tabular-nums ${tone === 'neutral' ? 'text-[var(--kit-text)]' : 'text-[var(--t-line)]'}`}>{value}</span>
        <span className="ml-1 text-xs text-[var(--kit-text-2)]">{unit}</span>
        <span className="block text-xs text-[var(--kit-text-2)]">{caption}</span>
      </dd>
    </div>
  );
}

function IrReadings({ minute }: { minute: number }) {
  const vibration = irAt(IR_VIBRATION, minute);
  const temperature = irAt(IR_TEMPERATURE, minute);
  return (
    <div className="flex flex-1 flex-col justify-between gap-4">
      <Meter
        label="Drive-end vibration"
        value={vibration}
        max={14}
        unit="mm/s"
        decimals={1}
        high={IR_HIGH}
        target={{ value: IR_TRIP, label: 'Trip' }}
        tone={irReadingTone(vibration, IR_HIGH, IR_TRIP) === 'neutral' ? 'accent' : irReadingTone(vibration, IR_HIGH, IR_TRIP)}
      />
      <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
        <IrReading label="Discharge temperature" value={formatNumber(temperature, 1)} unit="°C" caption="High 145.0" tone={irReadingTone(temperature, 145, 155)} />
        <IrReading label="Shaft speed" value={formatNumber(irAt(IR_SPEED, minute), 0)} unit="%" caption="Set point 100" />
        <IrReading label="Gas export" value={formatNumber(irAt(IR_EXPORT, minute), 2)} unit="MSm³/d" caption="Plan 4.50" />
        <IrReading label="Events so far" value={String(irPast(minute).length)} unit={`of ${IR_EVENTS.length}`} caption="in the window" />
      </dl>
    </div>
  );
}

function irTrain(minute: number): { name: string; tag: string; word: string; tone: Tone }[] {
  return [
    { name: 'Recompressor', tag: '23-KA-9103', word: minute >= 16 ? 'Tripped' : minute >= 6 ? 'Running 96 %' : 'Running', tone: minute >= 16 ? 'critical' : minute >= 2 ? 'warning' : 'success' },
    { name: 'Anti-surge valve', tag: '23-FV-9120', word: minute >= 16.6 ? 'Open' : 'Closed', tone: minute >= 16.6 ? 'warning' : 'neutral' },
    { name: 'Discharge valve', tag: '23-XV-9131', word: minute >= 17.2 ? 'Closed' : 'Open', tone: minute >= 17.2 ? 'warning' : 'neutral' },
    { name: '1st stage compressor', tag: '23-KA-9101', word: minute >= 19 ? 'Running, loaded' : 'Running', tone: 'success' },
    { name: '2nd stage compressor', tag: '23-KA-9102', word: minute >= 19 ? 'Running, loaded' : 'Running', tone: 'success' },
  ];
}

function IrTrain({ minute }: { minute: number }) {
  return (
    <ul>
      {irTrain(minute).map((unit) => (
        <ListRow key={unit.tag} tone={unit.tone} title={unit.name} meta={<TagId>{unit.tag}</TagId>} trailing={<StatusPill tone={unit.tone}>{unit.word}</StatusPill>} />
      ))}
    </ul>
  );
}

function irStanding(minute: number): IrEvent[] {
  const cleared = minute >= 29;
  return IR_EVENTS.filter((event) => event.lane === 'alarm' && event.t <= minute && event.tone !== 'success' && !(cleared && event.title.includes('vibration')));
}

function IrStanding({ minute }: { minute: number }) {
  const standing = irStanding(minute);
  if (standing.length === 0) {
    return <p className="p-3.5 text-sm text-[var(--kit-text-2)]">No standing alarms on the train at {irClock(minute, false)}.</p>;
  }
  return (
    <ul>
      {standing.map((alarm) => (
        <ListRow
          key={alarm.id}
          tone={alarm.tone}
          leading={<StatusPill tone={alarm.tone}>{alarm.tone === 'critical' ? 'Critical' : 'High'}</StatusPill>}
          title={alarm.title}
          trailing={irClock(alarm.t, false)}
        />
      ))}
    </ul>
  );
}

function IncidentReplaySignature() {
  const playhead = useIrPlayhead(14.5);
  const { minute } = playhead;
  return (
    <LookScope look="console">
      <Canvas padding="none" className="flex min-h-[860px] flex-col gap-px">
        <IrHeader minute={minute} />
        <IrTransport playhead={playhead} />
        <div className="grid flex-1 grid-cols-[18rem_minmax(0,1fr)] gap-px">
          <div className="flex flex-col gap-px">
            <Panel className="h-auto" title="Readings" subtitle={`at ${irClock(minute)}`}>
              <IrReadings minute={minute} />
            </Panel>
            <Panel className="h-auto" title="Train" subtitle="Equipment state" padding="none">
              <IrTrain minute={minute} />
            </Panel>
            <Panel className="h-auto flex-1" title="Standing alarms" subtitle={`${irStanding(minute).length} open`} padding="none" tone={irStanding(minute).some((alarm) => alarm.tone === 'critical') ? 'critical' : 'neutral'}>
              <IrStanding minute={minute} />
            </Panel>
          </div>
          <div className="flex min-w-0 flex-col gap-px">
            <Panel className="h-auto flex-1" title="Timeline" subtitle="Click a marker or anywhere on the lanes to move the playhead" padding="none">
              <IrLanes playhead={playhead} />
            </Panel>
            <Panel className="h-auto" title="Around the playhead" subtitle="Last two events and what comes next" padding="none">
              <IrEventCards playhead={playhead} />
            </Panel>
          </div>
        </div>
      </Canvas>
    </LookScope>
  );
}

type IrSequenceRow = IrEvent & { offset: string };

const IR_SEQUENCE: readonly IrSequenceRow[] = IR_EVENTS.map((event) => ({
  ...event,
  offset: event.t === 16 ? 'First-out' : `${event.t < 16 ? '−' : '+'}${irSpan(event.t - 16)}`,
}));

const IR_SEQUENCE_COLUMNS: DataTableColumn<IrSequenceRow>[] = [
  { id: 'time', header: 'Time, UTC', nowrap: true, numeric: true, cell: (row) => irClock(row.t) },
  { id: 'offset', header: 'From trip', nowrap: true, numeric: true, cell: (row) => row.offset },
  { id: 'source', header: 'Source', nowrap: true, cell: (row) => <StatusPill tone={row.tone}>{IR_LANE_LABEL[row.lane]}</StatusPill> },
  { id: 'event', header: 'Event', cell: (row) => row.title },
  { id: 'actor', header: 'By', nowrap: true, muted: true, cell: (row) => row.actor },
];

const IR_COMPARE = ['Vibration, mm/s', 'Temperature, °C ÷ 10', 'Speed, % ÷ 10', 'Export, MSm³/d'];

function IncidentReplaySequence() {
  return (
    <LookScope look="console">
      <AppFrame
        brand={{ name: 'Incident 26-031', detail: 'Recompressor trip', mark: <IconHistory /> }}
        nav={IR_NAV}
        current="sequence"
        padding="none"
        tools={<span className="font-medium tabular-nums">First-out 13:46:00 UTC</span>}
      >
        <Grid>
          <div className="col-span-12 flex items-stretch bg-[var(--kit-surface)]">
            <div data-tone="critical" className="flex items-center gap-3 bg-[var(--t-solid)] px-4 py-3 text-[var(--t-on-solid)] [&>svg]:size-6">
              <IconAlertOctagon aria-hidden="true" />
              <span className="text-xl font-semibold whitespace-nowrap">First-out: vibration high-high</span>
            </div>
            <p className="flex flex-1 items-center px-4 text-sm text-[var(--kit-text-2)]">
              23-VT-92740 crossed 11.0 mm/s at 13:44:30. Protection tripped the driver 90 s later and had the train in a safe state within 72 s.
            </p>
          </div>
          <Panel className="col-span-8 row-span-2" title="Sequence of events" subtitle="13:32 to 13:59, time-stamped at the source" padding="none">
            <DataTable
              label="Sequence of events around the trip"
              flush
              columns={IR_SEQUENCE_COLUMNS}
              rows={IR_SEQUENCE}
              rowKey={(row) => row.id}
              rowTone={(row) => (row.t === 16 ? 'critical' : row.tone === 'info' ? undefined : row.tone)}
            />
          </Panel>
          <Panel className="col-span-4" title="Before and after" subtitle="1 min before the trip against 3 min after">
            <Bars
              label="Four readings one minute before the trip and three minutes after it"
              orientation="horizontal"
              categories={IR_COMPARE}
              series={[
                { id: 'before', label: '13:45', values: [12.1, 14.9, 9.6, 4.5], tone: 'critical' },
                { id: 'after', label: '13:49', values: [0.8, 13.5, 0, 4.24], tone: 'accent' },
              ]}
              decimals={1}
              showValues
              height={250}
            />
          </Panel>
          <Panel className="col-span-4" title="Protection timing" subtitle="Against the design response">
            <div className="flex flex-1 flex-col justify-between gap-5">
              <Meter label="Trip delay after high-high" value={90} max={120} unit="s" target={{ value: 2, label: 'Design' }} high={10} tone="critical" />
              <Meter label="Discharge valve travel" value={4.2} max={10} unit="s" decimals={1} target={{ value: 6, label: 'Limit' }} high={6} tone="success" />
              <Meter label="Anti-surge valve to open" value={0.6} max={3} unit="s" decimals={1} target={{ value: 2, label: 'Limit' }} high={2} tone="success" />
            </div>
          </Panel>
        </Grid>
      </AppFrame>
    </LookScope>
  );
}

const IR_PHASES: readonly { title: string; span: string; from: number; to: number; tone: Tone }[] = [
  { title: 'Build-up', span: '13:32 to 13:44', from: 0, to: 14.4, tone: 'warning' },
  { title: 'Trip', span: '13:44 to 13:48', from: 14.5, to: 18, tone: 'critical' },
  { title: 'Recovery', span: '13:49 to 14:00', from: 18.1, to: 30, tone: 'info' },
];

function IncidentReplayDebrief() {
  const [selected, setSelected] = useState('e7');
  return (
    <LookScope look="console">
      <Canvas padding="none">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-px">
          <header className="bg-[var(--kit-surface)] px-5 py-4">
            <p className="text-sm text-[var(--kit-text-2)]">Debrief · Incident 26-031 · day shift</p>
            <h2 className="text-2xl font-semibold text-[var(--kit-text)]">Fourteen minutes of warning, one trip</h2>
          </header>
          {IR_PHASES.map((phase) => (
            <section key={phase.title} aria-label={phase.title} className="bg-[var(--kit-surface)]">
              <div data-tone={phase.tone} className="flex items-baseline justify-between bg-[var(--t-solid)] px-5 py-2 text-[var(--t-on-solid)]">
                <h3 className="text-base font-semibold">{phase.title}</h3>
                <span className="text-sm font-medium tabular-nums">{phase.span}</span>
              </div>
              <ol className="relative px-5 py-3">
                <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-[var(--kit-rule)]" />
                {IR_EVENTS.filter((event) => event.t >= phase.from && event.t <= phase.to).map((event, index) => (
                  <li key={event.id} className={`relative flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'} ${index === 0 ? '' : '-mt-10'}`}>
                    <span data-tone={event.tone} className="absolute top-5 left-1/2 size-3.5 -translate-x-1/2 border-2 border-[var(--t-line)] bg-[var(--t-line)]" />
                    <button
                      type="button"
                      aria-pressed={event.id === selected}
                      onClick={() => setSelected(event.id)}
                      data-tone={event.tone}
                      className={`my-1.5 flex w-[calc(50%-1.75rem)] cursor-pointer flex-col gap-1 border-l-4 border-[var(--t-line)] p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--kit-text)] ${
                        event.id === selected ? 'bg-[color-mix(in_oklab,var(--t-line)_18%,transparent)]' : 'bg-[var(--kit-well)]'
                      }`}
                    >
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="text-lg font-medium text-[var(--kit-text)] tabular-nums">{irClock(event.t)}</span>
                        <span className="text-xs text-[var(--kit-text-2)]">{IR_LANE_LABEL[event.lane]}</span>
                      </span>
                      <span className="text-sm font-semibold text-[var(--kit-text)]">{event.title}</span>
                      {event.id === selected ? <span className="text-sm text-[var(--kit-text-2)]">{event.detail}</span> : null}
                      <span className="text-xs text-[var(--kit-text-2)]">{event.actor}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </Canvas>
    </LookScope>
  );
}

function IncidentReplayPartLanes() {
  const playhead = useIrPlayhead(19);
  return (
    <LookScope look="console">
      <Canvas padding="none">
        <Panel title="Timeline" subtitle="Process trend over four event lanes" padding="none">
          <IrLanes playhead={playhead} />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function IncidentReplayPartTransport() {
  const playhead = useIrPlayhead(9);
  return (
    <LookScope look="console">
      <Canvas padding="none" className="flex flex-col gap-px">
        <IrHeader minute={playhead.minute} />
        <IrTransport playhead={playhead} />
      </Canvas>
    </LookScope>
  );
}

function IncidentReplayPartCards() {
  const playhead = useIrPlayhead(16.6);
  return (
    <LookScope look="console">
      <Canvas padding="none">
        <Panel title="Around the playhead" subtitle={`at ${irClock(playhead.minute)}`} padding="none">
          <IrEventCards playhead={playhead} />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function IncidentReplayPartReadings() {
  return (
    <LookScope look="console">
      <Canvas padding="none">
        <Panel title="Readings" subtitle="at 13:45:00">
          <IrReadings minute={15} />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function IncidentReplayPartTrain() {
  return (
    <LookScope look="console">
      <Canvas padding="none">
        <Panel title="Train" subtitle="at 13:48:00" padding="none">
          <IrTrain minute={18} />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function IncidentReplayPartStanding() {
  return (
    <LookScope look="console">
      <Canvas padding="none">
        <Panel title="Standing alarms" subtitle="at 13:48:00" padding="none" tone="critical">
          <IrStanding minute={18} />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

export default definePage({
  id: 'incident-replay',
  title: 'Incident replay',
  summary:
    'A replay console for one trip: the vibration trend and four event lanes share a time axis, a playhead runs through all of them, and every panel shows the plant as it was at that second.',
  guidance: {
    use: [
      'For investigations and debriefs, where the order of alarms, automatic actions and human actions is the question.',
      'One time axis for trend and events, so cause and effect line up vertically.',
      'Step by event as well as by time: people move from one thing that happened to the next.',
    ],
    avoid: [
      'Live monitoring: a replay is deliberately frozen and must never be mistaken for now.',
      'Playing on a timer by default; the investigator sets the pace.',
      'Hiding future events completely: show them faint so the reader sees what is coming.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'The full console. Drag the scrubber, step by event, or click the lanes; readings, train state and alarms follow the playhead.',
      specimens: [
        {
          id: 'IncidentReplaySignature',
          title: 'Replay console',
          note: 'Pick it for the investigation screen after a trip, where the team needs to agree on what happened in which order.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Canvas.tsx', 'kit/Panel.tsx', 'kit/Meter.tsx', 'kit/ListRow.tsx', 'kit/StatusPill.tsx', 'looks/LookScope.tsx'],
          Component: IncidentReplaySignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Variations',
      description: 'Other screens of the same product: the sequence-of-events record, and a vertical debrief for a tablet.',
      specimens: [
        {
          id: 'IncidentReplaySequence',
          title: 'Sequence of events',
          note: 'Pick it for the formal record: every event around the first-out with its offset from the trip and the protection timing.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/AppFrame.tsx', 'kit/DataTable.tsx', 'kit/Bars.tsx', 'kit/Meter.tsx', 'kit/Panel.tsx'],
          Component: IncidentReplaySequence,
        },
        {
          id: 'IncidentReplayDebrief',
          title: 'Debrief spine',
          note: 'Pick it for a shift debrief on a tablet: the same events down a vertical spine, grouped into build-up, trip and recovery.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Canvas.tsx'],
          Component: IncidentReplayDebrief,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The pieces of the console on their own, each frozen at a different moment.',
      specimens: [
        {
          id: 'IncidentReplayPartTransport',
          title: 'Header and transport',
          note: 'Pick it as the top of any replay: the incident, the playhead clock, the state at that time and the step controls.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          Component: IncidentReplayPartTransport,
        },
        {
          id: 'IncidentReplayPartLanes',
          title: 'Lanes with playhead',
          note: 'Pick it to line up a process trend with what the alarm system, protection, operator and field crew did.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx'],
          Component: IncidentReplayPartLanes,
        },
        {
          id: 'IncidentReplayPartCards',
          title: 'Event cards',
          note: 'Pick them under a timeline to read the events nearest the playhead in full, with the next ones faint.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/StatusPill.tsx'],
          Component: IncidentReplayPartCards,
        },
        {
          id: 'IncidentReplayPartReadings',
          title: 'Readings at the playhead',
          note: 'Pick it to show the few values that explain the event, coloured against their limits at that moment.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/Meter.tsx'],
          Component: IncidentReplayPartReadings,
        },
        {
          id: 'IncidentReplayPartTrain',
          title: 'Train state',
          note: 'Pick it to list equipment and valve positions as status blocks that flip as the playhead passes each action.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/ListRow.tsx', 'kit/StatusPill.tsx', 'kit/TagId.tsx'],
          Component: IncidentReplayPartTrain,
        },
        {
          id: 'IncidentReplayPartStanding',
          title: 'Standing alarms',
          note: 'Pick it for the alarm list as it stood at the playhead, not as it stands now.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/ListRow.tsx', 'kit/StatusPill.tsx'],
          Component: IncidentReplayPartStanding,
        },
      ],
    },
  ],
});
