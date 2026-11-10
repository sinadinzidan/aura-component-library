import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardHeaderCenter, CardTitle } from '@cognite/aura/components/card';
import { Input } from '@cognite/aura/components/input';
import { Popover, PopoverContent, PopoverTrigger } from '@cognite/aura/components/popover';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import {
  IconAlertTriangle,
  IconCalendarEvent,
  IconChevronLeft,
  IconChevronRight,
  IconMoon,
  IconRepeat,
  IconSun,
  IconSunset,
  IconTool,
  IconWorld,
} from '@cognite/aura/icons';
import { useState } from 'react';

import { MetadataList } from '../../../library/display/MetadataList';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { FormField } from '../../../library/forms/FormField';
import { IconAction } from '../../../library/patterns/collections/IconAction';
import { FormActions } from '../../../library/patterns/data-entry/FormActions';
import { OptionSelect } from '../../../library/patterns/data-entry/OptionSelect';
import { PropertyList } from '../../../library/patterns/structure/PropertyList';
import { AgendaList } from '../../../library/patterns/workflows/AgendaList';
import type { AgendaDay } from '../../../library/patterns/workflows/AgendaList';
import { conflictingIds, formatMinutes } from '../../../library/patterns/workflows/layoutEvents';
import { monthCells } from '../../../library/patterns/workflows/monthCells';
import { MonthGrid } from '../../../library/patterns/workflows/MonthGrid';
import type { MonthEntry } from '../../../library/patterns/workflows/MonthGrid';
import { TimeSlotPicker } from '../../../library/patterns/workflows/TimeSlotPicker';
import { WeekGrid } from '../../../library/patterns/workflows/WeekGrid';
import type { WeekGridEvent } from '../../../library/patterns/workflows/WeekGrid';
import { PEOPLE, findPerson } from '../../data/plant';
import { definePage } from '../../types';

import source from './scheduling-and-calendars.tsx?raw';

/** Week 11 of 2026. The reference time is Thursday 12 March, 14:00 UTC. */
const WEEK_DAYS = [
  { id: 'mon', label: 'Mon 9' },
  { id: 'tue', label: 'Tue 10' },
  { id: 'wed', label: 'Wed 11' },
  { id: 'thu', label: 'Thu 12', today: true },
  { id: 'fri', label: 'Fri 13' },
];

const NOW = { dayId: 'thu', minute: 14 * 60 };

type PlanEvent = WeekGridEvent & { crew: string; ownerId: string; reference?: string };

const h = (hours: number, minutes = 0) => hours * 60 + minutes;

const WEEK_EVENTS: readonly PlanEvent[] = [
  { id: 'e1', dayId: 'mon', start: h(7, 30), end: h(9), title: 'Weekly planning meeting', detail: 'Control room', crew: 'Operations', ownerId: 'ms' },
  { id: 'e2', dayId: 'mon', start: h(10), end: h(14), title: 'Standby start test, export pump B', detail: '27-PA-2001B', crew: 'Operations', ownerId: 'ih', reference: 'WO-104458' },
  { id: 'e3', dayId: 'tue', start: h(8), end: h(12), title: 'Partial stroke test', detail: '20-XV-1105', crew: 'Operations', ownerId: 'tb', reference: 'WO-104431' },
  { id: 'e4', dayId: 'tue', start: h(13), end: h(15), title: 'Calibrate level transmitter', detail: '20-LT-10012', crew: 'Instrument', ownerId: 'jn', reference: 'WO-104440' },
  { id: 'e5', dayId: 'wed', start: h(8), end: h(16), title: 'Cooling water outage', detail: 'NK-40', kind: 'window', crew: 'Operations', ownerId: 'lw' },
  { id: 'e6', dayId: 'wed', start: h(9), end: h(12), title: 'Replace temperature transmitter', detail: '40-TT-40015', crew: 'Instrument', ownerId: 'jn', reference: 'WO-104479' },
  { id: 'e7', dayId: 'thu', start: h(8), end: h(14), title: 'Inspect drive-end bearing', detail: '23-KA-9103', crew: 'Mechanical', ownerId: 'tb', reference: 'WO-104482', conflict: true },
  { id: 'e8', dayId: 'thu', start: h(12, 30), end: h(15), title: 'Vibration survey', detail: '23-KA-9101', crew: 'Mechanical', ownerId: 'tb', reference: 'WO-104466', conflict: true },
  { id: 'e9', dayId: 'thu', start: h(15, 30), end: h(16, 30), title: 'Shift handover', detail: 'Control room', crew: 'Operations', ownerId: 'lw' },
  { id: 'e10', dayId: 'fri', start: h(9), end: h(10, 30), title: 'Permit review', detail: 'PTW-2291', crew: 'Operations', ownerId: 'lw' },
  { id: 'e11', dayId: 'fri', start: h(11), end: h(16), title: 'Clean cooler tube bundle', detail: '23-HA-9114', crew: 'Mechanical', ownerId: 'ms', reference: 'WO-104471' },
];

const DAY_NAMES: Record<string, string> = {
  mon: 'Monday 9 March',
  tue: 'Tuesday 10 March',
  wed: 'Wednesday 11 March',
  thu: 'Thursday 12 March',
  fri: 'Friday 13 March',
  sat: 'Saturday 14 March',
};

function eventsOn(dayId: string): PlanEvent[] {
  return WEEK_EVENTS.filter((event) => event.dayId === dayId).sort((a, b) => a.start - b.start);
}

function agendaDay(dayId: string, note?: string): AgendaDay {
  return {
    id: dayId,
    label: DAY_NAMES[dayId] ?? dayId,
    note,
    events: eventsOn(dayId).map((event) => {
      const owner = findPerson(event.ownerId);
      return {
        id: event.id,
        start: formatMinutes(event.start),
        end: formatMinutes(event.end),
        title: event.title,
        detail: (
          <>
            <span className="font-mono">{event.detail}</span> · {event.crew}
          </>
        ),
        conflict: event.conflict,
        trailing: owner ? <PersonAvatar name={owner.name} initials={owner.initials} colorKey={owner.id} sizes="xsm" /> : undefined,
      };
    }),
  };
}

const MARCH = monthCells(2026, 2);

/** Planned jobs per day in March 2026. */
const MARCH_ENTRIES: Readonly<Record<string, MonthEntry>> = {
  '2026-03-02': { count: 2 },
  '2026-03-03': { count: 1 },
  '2026-03-05': { count: 3 },
  '2026-03-06': { count: 1 },
  '2026-03-09': { count: 2 },
  '2026-03-10': { count: 2 },
  '2026-03-11': { count: 2 },
  '2026-03-12': { count: 3, flagged: true },
  '2026-03-13': { count: 2 },
  '2026-03-16': { count: 5 },
  '2026-03-17': { count: 4 },
  '2026-03-18': { count: 1 },
  '2026-03-24': { count: 6, flagged: true },
  '2026-03-25': { count: 2 },
  '2026-03-27': { count: 1 },
  '2026-03-30': { count: 2 },
};

const TODAY_KEY = '2026-03-12';

const JOBS = { one: 'job', other: 'jobs' };

function ScheduleCalAgendaByDay() {
  return <AgendaList days={[agendaDay('thu', 'Today'), agendaDay('fri', 'Tomorrow')]} />;
}

function ScheduleCalUpcomingCard() {
  const next = [
    { id: 'e9', when: 'in 1 h 30 min', title: 'Shift handover', detail: 'Control room' },
    { id: 'e10', when: 'Tomorrow 09:00', title: 'Permit review', detail: 'PTW-2291' },
    { id: 'e11', when: 'Tomorrow 11:00', title: 'Clean cooler tube bundle', detail: '23-HA-9114' },
  ];
  return (
    <Card className="w-full max-w-xs">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle as="h3">Upcoming</CardTitle>
          <CardDescription>Next three for your crew</CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardContent>
        <ul className="flex w-full flex-col gap-3">
          {next.map((event) => (
            <li key={event.id} className="flex flex-col gap-0.5">
              <span className="text-xs tabular-nums text-muted-foreground">{event.when}</span>
              <span className="text-sm font-medium text-base-foreground">{event.title}</span>
              <span className="font-mono text-xs text-muted-foreground">{event.detail}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function ScheduleCalEmptyDay() {
  return (
    <div className="w-full max-w-xs">
      <AgendaList days={[agendaDay('sat')]} emptyText="No planned work. The plant runs with the standing weekend crew." />
    </div>
  );
}

function ScheduleCalRecurringSummary() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <span className="flex items-center gap-2 text-sm font-medium text-base-foreground">
        <IconRepeat aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        Every 4 weeks on Monday
      </span>
      <p className="text-sm text-muted-foreground">Standby start test, export pump B. 10:00–14:00, until the end of 2026.</p>
      <MetadataList
        items={[
          { label: 'Last done', value: '9 Feb' },
          { label: 'Next', value: '6 Apr' },
          { label: 'Remaining', value: '10 occurrences' },
        ]}
      />
    </div>
  );
}

function ScheduleCalTimezoneNote() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-base-foreground">Shift handover</span>
        <span className="text-sm tabular-nums text-base-foreground">Thu 12 Mar, 16:30–17:30</span>
        <span className="text-xs tabular-nums text-muted-foreground">15:30–16:30 UTC</span>
      </div>
      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <IconWorld aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
        Times are shown in plant time, Europe/Oslo (UTC+1). Your device is set to UTC.
      </p>
    </div>
  );
}

function ScheduleCalWeekGrid() {
  return <WeekGrid label="Maintenance plan, week 11" days={WEEK_DAYS} events={WEEK_EVENTS} startHour={7} endHour={17} now={NOW} />;
}

function ScheduleCalDayView() {
  return (
    <WeekGrid
      label="Thursday 12 March"
      days={WEEK_DAYS.slice(3, 4)}
      events={WEEK_EVENTS.filter((event) => event.id !== 'e8').map((event) => ({ ...event, conflict: false }))}
      startHour={7}
      endHour={17}
      now={NOW}
    />
  );
}

function ScheduleCalOverlaps() {
  const events: readonly WeekGridEvent[] = [
    { id: 'a', dayId: 'thu', start: h(8), end: h(12), title: 'Inspect drive-end bearing', detail: 'Mechanical' },
    { id: 'b', dayId: 'thu', start: h(9), end: h(11), title: 'Scaffolding inspection', detail: 'Operations' },
    { id: 'c', dayId: 'thu', start: h(10), end: h(13), title: 'Loop check, 23-PT-92531', detail: 'Instrument' },
    { id: 'd', dayId: 'thu', start: h(11, 30), end: h(12, 30), title: 'Lifting plan review', detail: 'Operations' },
    { id: 'e', dayId: 'thu', start: h(14), end: h(15), title: 'Toolbox talk', detail: 'All crews' },
  ];
  return <WeekGrid label="Overlapping jobs on Thursday 12 March" days={WEEK_DAYS.slice(3, 4)} events={events} startHour={8} endHour={16} />;
}

function ScheduleCalMaintenanceWindow() {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-dashed border-emphasized text-muted-foreground">
          <IconTool aria-hidden="true" className="size-4" />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm font-medium text-base-foreground">Cooling water outage</span>
          <span className="text-xs tabular-nums text-muted-foreground">Wed 11 Mar, 08:00–16:00 · 8 h · NK-40 isolated</span>
        </div>
      </div>
      <WeekGrid
        label="Maintenance window on Wednesday 11 March"
        days={WEEK_DAYS.slice(2, 3)}
        events={WEEK_EVENTS.filter((event) => event.dayId === 'wed')}
        startHour={7}
        endHour={17}
        hourUnits={8}
      />
    </div>
  );
}

function ScheduleCalConflict() {
  const thursday = eventsOn('thu');
  const clashing = conflictingIds(thursday);
  const [first, second] = thursday.filter((event) => clashing.includes(event.id));
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-start gap-2 rounded-lg bg-warning-background p-3 text-sm text-warning-foreground">
        <IconAlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <p>
          <span className="font-medium">Conflict.</span> {findPerson(first?.ownerId ?? null)?.name} is on both jobs between{' '}
          <span className="tabular-nums">
            {formatMinutes(second?.start ?? 0)} and {formatMinutes(first?.end ?? 0)}
          </span>
          . Move one job or assign another technician.
        </p>
      </div>
      <WeekGrid
        label="Conflicting jobs on Thursday 12 March"
        days={WEEK_DAYS.slice(3, 4)}
        events={thursday.map((event) => ({ ...event, conflict: clashing.includes(event.id) }))}
        startHour={8}
        endHour={17}
        hourUnits={8}
      />
    </div>
  );
}

function ScheduleCalMonthDots() {
  return (
    <div className="w-full max-w-xs">
      <MonthGrid label="March 2026" weeks={MARCH} entries={MARCH_ENTRIES} todayKey={TODAY_KEY} noun={JOBS} />
    </div>
  );
}

function ScheduleCalMonthCounts() {
  return (
    <div className="w-full max-w-xs">
      <MonthGrid label="March 2026, job counts" weeks={MARCH} entries={MARCH_ENTRIES} todayKey={TODAY_KEY} display="count" noun={JOBS} />
    </div>
  );
}

function ScheduleCalMonthSelect() {
  const [selected, setSelected] = useState('2026-03-24');
  const entry = MARCH_ENTRIES[selected];
  const count = entry?.count ?? 0;
  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <MonthGrid label="March 2026, pick a day" weeks={MARCH} entries={MARCH_ENTRIES} todayKey={TODAY_KEY} selectedKey={selected} onSelect={setSelected} noun={JOBS} />
      <p aria-live="polite" className="text-sm text-muted-foreground">
        <span className="font-medium tabular-nums text-base-foreground">{Number(selected.slice(8))} March</span>:{' '}
        {count === 0 ? 'no jobs planned' : `${count} ${count === 1 ? 'job' : 'jobs'} planned`}
        {entry?.flagged ? ', one conflict' : ''}.
      </p>
    </div>
  );
}

type CrewBar = { id: string; start: number; end: number; text: string; tentative?: boolean };

const CREW_ROWS: readonly { crew: string; people: number; load: number; bars: readonly CrewBar[] }[] = [
  {
    crew: 'Mechanical',
    people: 3,
    load: 92,
    bars: [
      { id: 'm1', start: 0, end: 1.5, text: 'Seal replacement' },
      { id: 'm2', start: 3, end: 4, text: 'Bearing' },
      { id: 'm3', start: 4, end: 5, text: 'Cooler bundle' },
    ],
  },
  {
    crew: 'Instrument',
    people: 2,
    load: 55,
    bars: [
      { id: 'i1', start: 1, end: 2, text: 'LT cal.' },
      { id: 'i2', start: 2, end: 3, text: 'TT swap' },
      { id: 'i3', start: 5, end: 7, text: 'Firmware prep', tentative: true },
    ],
  },
  {
    crew: 'Operations',
    people: 4,
    load: 70,
    bars: [
      { id: 'o1', start: 0, end: 1, text: 'Start test' },
      { id: 'o2', start: 1, end: 2, text: 'Stroke test' },
      { id: 'o3', start: 2, end: 3, text: 'Outage' },
    ],
  },
];

const FULL_WEEK = ['Mon 9', 'Tue 10', 'Wed 11', 'Thu 12', 'Fri 13', 'Sat 14', 'Sun 15'];

/** Thursday 14:00, in day columns from Monday. */
const WEEK_NOW = 3 + 14 / 24;

function ScheduleCalResourceRows() {
  const columns = { gridTemplateColumns: `repeat(${FULL_WEEK.length}, minmax(0, 1fr))` };
  const percent = (value: number) => `${Math.round((value / FULL_WEEK.length) * 10000) / 100}%`;
  return (
    <div role="group" aria-label="Crew load, week 11" className="grid w-full min-w-0 grid-cols-[minmax(7rem,9rem)_minmax(0,1fr)] gap-x-4">
      <span />
      <div aria-hidden="true" className="grid pb-2" style={columns}>
        {FULL_WEEK.map((day) => (
          <span key={day} className="truncate text-xs tabular-nums text-muted-foreground">
            {day}
          </span>
        ))}
      </div>
      {CREW_ROWS.map((row) => (
        <div key={row.crew} className="col-span-2 grid grid-cols-subgrid items-center border-t border-default py-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-medium text-base-foreground">{row.crew}</span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {row.people} people · {row.load}% booked
            </span>
          </div>
          <ul aria-label={`${row.crew} jobs`} className="relative h-7">
            <li aria-hidden="true" className="absolute inset-0 grid" style={columns}>
              {FULL_WEEK.map((day, index) => (
                <span key={day} className={index > 0 ? 'border-l border-default' : undefined} />
              ))}
            </li>
            {row.bars.map((bar) => (
              <li
                key={bar.id}
                className={`absolute inset-y-0.5 flex items-center overflow-hidden rounded-md px-2 ${bar.tentative ? 'border border-dashed border-emphasized' : 'bg-chart-1-200'}`}
                style={{ left: percent(bar.start), width: percent(bar.end - bar.start) }}
              >
                <span className="truncate text-xs font-medium text-base-foreground">
                  {bar.text}
                  {bar.tentative ? <span className="sr-only">, tentative</span> : null}
                </span>
              </li>
            ))}
            <li aria-hidden="true" className="absolute -inset-y-2 w-px bg-base-foreground" style={{ left: percent(WEEK_NOW) }} />
          </ul>
        </div>
      ))}
    </div>
  );
}

const SHIFTS = [
  { id: 'day', code: 'D', name: 'Day', hours: '07:00–15:00', Icon: IconSun, lead: 'lw' },
  { id: 'evening', code: 'E', name: 'Evening', hours: '15:00–23:00', Icon: IconSunset, lead: 'ih' },
  { id: 'night', code: 'N', name: 'Night', hours: '23:00–07:00', Icon: IconMoon, lead: 'ms' },
] as const;

function ScheduleCalShiftPattern() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <ol aria-label="Shift pattern" className="grid grid-cols-3 gap-1">
        {SHIFTS.map(({ id, name, hours, Icon }) => {
          const current = id === 'day';
          return (
            <li
              key={id}
              aria-current={current ? 'time' : undefined}
              className={`flex flex-col gap-1 rounded-lg p-2 ${current ? 'bg-medium-background' : 'bg-muted-background'}`}
            >
              <span className={`flex items-center gap-1.5 text-sm ${current ? 'font-semibold text-base-foreground' : 'text-medium-foreground'}`}>
                <Icon aria-hidden="true" className="size-4 shrink-0" />
                {name}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">{hours}</span>
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-base-foreground">Day shift is on.</span> Handover to evening in 1 h.
      </p>
    </div>
  );
}

type ShiftCode = 'D' | 'E' | 'N' | 'off';

const SHIFT_BADGE = {
  D: { variant: 'decorative-6', label: 'Day' },
  E: { variant: 'decorative-5', label: 'Evening' },
  N: { variant: 'decorative-2', label: 'Night' },
} as const;

const ROSTER: readonly { personId: string; codes: readonly ShiftCode[] }[] = [
  { personId: 'lw', codes: ['D', 'D', 'D', 'D', 'D', 'off', 'off'] },
  { personId: 'ih', codes: ['E', 'E', 'E', 'E', 'off', 'off', 'D'] },
  { personId: 'ms', codes: ['N', 'N', 'off', 'off', 'E', 'E', 'E'] },
  { personId: 'tb', codes: ['D', 'D', 'D', 'D', 'off', 'off', 'N'] },
  { personId: 'jn', codes: ['off', 'off', 'D', 'D', 'D', 'N', 'N'] },
];

const ROSTER_TH = 'px-2 py-2 text-center text-xs font-medium tabular-nums text-muted-foreground';

function ScheduleCalShiftRoster() {
  return (
    <div className="flex w-full flex-col gap-3">
      <table aria-label="Shift roster, week 11" className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-default">
            <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">
              Person
            </th>
            {FULL_WEEK.map((day, index) => (
              <th key={day} scope="col" aria-current={index === 3 ? 'date' : undefined} className={`${ROSTER_TH} ${index === 3 ? 'text-base-foreground' : ''}`}>
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROSTER.map((row) => {
            const person = findPerson(row.personId);
            return (
              <tr key={row.personId} className="border-b border-default">
                <th scope="row" className="px-2 py-2 text-left font-normal">
                  <span className="flex flex-col">
                    <span className="text-sm text-base-foreground">{person?.name}</span>
                    <span className="text-xs text-muted-foreground">{person?.role}</span>
                  </span>
                </th>
                {row.codes.map((code, index) => (
                  <td key={FULL_WEEK[index]} className="px-2 py-2 text-center">
                    {code === 'off' ? (
                      <span className="text-xs text-muted-foreground">
                        <span aria-hidden="true">–</span>
                        <span className="sr-only">Off</span>
                      </span>
                    ) : (
                      <Badge variant={SHIFT_BADGE[code].variant} aria-label={SHIFT_BADGE[code].label}>
                        {code}
                      </Badge>
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <ul aria-label="Legend" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {SHIFTS.map(({ id, code, name, hours }) => (
          <li key={id} className="flex items-center gap-1.5 tabular-nums">
            <Badge variant={SHIFT_BADGE[code].variant}>{code}</Badge>
            {name} {hours}
          </li>
        ))}
        <li>– Off</li>
      </ul>
    </div>
  );
}

function ScheduleCalShiftNow() {
  const lead = findPerson('lw');
  return (
    <Card className="w-full max-w-xs">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle as="h3">Day shift</CardTitle>
          <CardDescription>07:00–15:00 · 1 h left</CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          {lead ? <PersonAvatar name={lead.name} initials={lead.initials} colorKey={lead.id} /> : null}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-base-foreground">{lead?.name}</span>
            <span className="text-xs text-muted-foreground">{lead?.role}</span>
          </div>
        </div>
        <MetadataList
          items={[
            { label: 'On shift', value: '9 people' },
            { label: 'Open permits', value: '3' },
            { label: 'Handover', value: '15:00, control room' },
          ]}
        />
      </CardContent>
    </Card>
  );
}

const SLOTS = [
  { id: '07', label: '07:00' },
  { id: '08', label: '08:00', unavailable: 'booked' },
  { id: '09', label: '09:00', unavailable: 'booked' },
  { id: '10', label: '10:00' },
  { id: '11', label: '11:00' },
  { id: '12', label: '12:00' },
  { id: '13', label: '13:00', unavailable: 'booked' },
  { id: '14', label: '14:00' },
  { id: '15', label: '15:00' },
  { id: '16', label: '16:00' },
];

function ScheduleCalAvailabilityPicker() {
  const [value, setValue] = useState<string[]>(['10', '11', '14']);
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-base-foreground">When can the scaffolding crew start?</span>
        <span className="text-xs text-muted-foreground">Friday 13 March. Pick every hour that works.</span>
      </div>
      <TimeSlotPicker
        label="Available start times, Friday 13 March"
        slots={SLOTS}
        value={value}
        onValueChange={setValue}
        unavailableNote="Greyed hours are already booked for the crew."
      />
      <p aria-live="polite" className="text-xs tabular-nums text-muted-foreground">
        {value.length === 0 ? 'No hours picked yet.' : `${value.length} of 7 free hours picked.`}
      </p>
    </div>
  );
}

const DURATION_OPTIONS = [
  { value: '60', label: '1 hour' },
  { value: '120', label: '2 hours' },
  { value: '240', label: '4 hours' },
  { value: '480', label: 'Full shift (8 hours)' },
];

const CREW_OPTIONS = [
  { value: 'Mechanical', label: 'Mechanical' },
  { value: 'Instrument', label: 'Instrument' },
  { value: 'Operations', label: 'Operations' },
];

function ScheduleCalQuickCreate() {
  const [title, setTitle] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  return (
    <form
      noValidate
      className="flex w-full max-w-md flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setAttempted(true);
        if (title.trim() === '') return;
        setCreated(title.trim());
        setTitle('');
        setAttempted(false);
      }}
    >
      <FormField label="Job" required error={attempted && title.trim() === '' ? 'Name the job to schedule it.' : undefined}>
        {(control) => <Input {...control} placeholder="Lubricate export pump couplings" value={title} onChange={(event) => setTitle(event.target.value)} />}
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Starts" helper="Fri 13 Mar, plant time">
          {(control) => <Input {...control} type="time" defaultValue="10:00" />}
        </FormField>
        <FormField label="Duration">{(control) => <OptionSelect {...control} options={DURATION_OPTIONS} defaultValue="120" />}</FormField>
      </div>
      <FormField label="Crew">{(control) => <OptionSelect {...control} options={CREW_OPTIONS} defaultValue="Mechanical" />}</FormField>
      <FormActions status={<span aria-live="polite">{created ? `Scheduled "${created}".` : null}</span>}>
        <Button type="submit">Schedule job</Button>
      </FormActions>
    </form>
  );
}

function ScheduleCalEventPopover() {
  const event = WEEK_EVENTS[6];
  const owner = findPerson(event.ownerId);
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline">
            <IconCalendarEvent aria-hidden="true" /> {event.title}
          </Button>
        }
      />
      <PopoverContent align="center" className="w-80 max-w-[calc(100vw-2rem)]">
        <div className="flex w-full flex-col gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-base-foreground">{event.title}</span>
            <span className="text-xs tabular-nums text-muted-foreground">
              Thu 12 Mar, {formatMinutes(event.start)}–{formatMinutes(event.end)}
            </span>
          </div>
          <MetadataList
            items={[
              { label: 'Work order', value: <span className="font-mono">{event.reference}</span> },
              { label: 'Equipment', value: <span className="font-mono">{event.detail}</span> },
              { label: 'Crew', value: event.crew },
              { label: 'Lead', value: owner?.name },
            ]}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm">
              Reschedule
            </Button>
            <Button variant="secondary" size="sm">
              Open work order
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const WEEK_LABELS = ['2–8 March', '9–15 March', '16–22 March'];

function ScheduleCalDateNavigator() {
  const [index, setIndex] = useState(1);
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" disabled={index === 1} onClick={() => setIndex(1)}>
        This week
      </Button>
      <div className="flex items-center">
        <IconAction label="Previous week" disabled={index === 0} onClick={() => setIndex(index - 1)}>
          <IconChevronLeft />
        </IconAction>
        <IconAction label="Next week" disabled={index === WEEK_LABELS.length - 1} onClick={() => setIndex(index + 1)}>
          <IconChevronRight />
        </IconAction>
      </div>
      <span aria-live="polite" className="flex flex-col">
        <span className="text-sm font-medium tabular-nums text-base-foreground">{WEEK_LABELS[index]}</span>
        <span className="text-xs tabular-nums text-muted-foreground">Week {10 + index}, 2026</span>
      </span>
    </div>
  );
}

function ScheduleCalViewSwitch() {
  const [view, setView] = useState('week');
  const summary: Record<string, string> = {
    day: 'Thursday 12 March · 3 jobs',
    week: '9–15 March · 11 jobs',
    month: 'March 2026 · 39 jobs',
  };
  return (
    <div className="flex flex-col items-center gap-3">
      <SegmentedControl value={view} onValueChange={(value) => setView(String(value))}>
        <SegmentedControlList aria-label="Calendar view">
          <SegmentedControlButton value="day" tabContent="label-only">
            Day
          </SegmentedControlButton>
          <SegmentedControlButton value="week" tabContent="label-only">
            Week
          </SegmentedControlButton>
          <SegmentedControlButton value="month" tabContent="label-only">
            Month
          </SegmentedControlButton>
        </SegmentedControlList>
      </SegmentedControl>
      <p aria-live="polite" className="text-sm tabular-nums text-muted-foreground">
        {summary[view]}
      </p>
    </div>
  );
}

function ScheduleCalWeekPlanner() {
  const [selectedId, setSelectedId] = useState<string | undefined>('e8');
  const event = WEEK_EVENTS.find((candidate) => candidate.id === selectedId);
  const owner = event ? findPerson(event.ownerId) : undefined;
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <h3 className="text-base font-semibold text-base-foreground">Maintenance plan</h3>
          <span className="text-xs tabular-nums text-muted-foreground">Week 11, 9–13 March · 11 jobs · 1 conflict</span>
        </div>
        <Button size="sm">Schedule job</Button>
      </div>
      <WeekGrid
        label="Maintenance plan, week 11. Select a job for details."
        days={WEEK_DAYS}
        events={WEEK_EVENTS}
        startHour={7}
        endHour={17}
        now={NOW}
        onSelect={setSelectedId}
        selectedId={selectedId}
      />
      <div aria-live="polite" className="rounded-xl border border-default p-4">
        {event ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <h4 className="text-sm font-semibold text-base-foreground">{event.title}</h4>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {DAY_NAMES[event.dayId]}, {formatMinutes(event.start)}–{formatMinutes(event.end)}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedId(undefined)}>
                  Close
                </Button>
                <Button variant="secondary" size="sm">
                  Reschedule
                </Button>
              </div>
            </div>
            {event.conflict ? (
              <p className="flex items-start gap-1.5 text-sm text-warning-foreground-strong">
                <IconAlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <span>
                  <span className="font-medium">Conflict.</span> {owner?.name} is booked on two jobs between 12:30 and 14:00.
                </span>
              </p>
            ) : null}
            <PropertyList
              layout="stacked"
              columns={3}
              items={[
                { label: 'Work order', value: event.reference ? <span className="font-mono">{event.reference}</span> : undefined },
                { label: event.kind === 'window' ? 'System' : 'Where', value: <span className="font-mono">{event.detail}</span> },
                { label: 'Crew and lead', value: `${event.crew} · ${owner?.name}` },
              ]}
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Select a job in the grid to see its details.</p>
        )}
      </div>
    </div>
  );
}

const SELECTED_DAY_ID: Record<string, string> = {
  '2026-03-09': 'mon',
  '2026-03-10': 'tue',
  '2026-03-11': 'wed',
  '2026-03-12': 'thu',
  '2026-03-13': 'fri',
};

function ScheduleCalMonthPlanner() {
  const [selected, setSelected] = useState(TODAY_KEY);
  const dayId = SELECTED_DAY_ID[selected];
  const count = MARCH_ENTRIES[selected]?.count ?? 0;
  const dayNumber = Number(selected.slice(8));
  return (
    <div className="grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] items-start gap-8">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-base-foreground">March 2026</h3>
          <span className="text-xs tabular-nums text-muted-foreground">39 jobs · {PEOPLE.length} people</span>
        </div>
        <MonthGrid label="March 2026" weeks={MARCH} entries={MARCH_ENTRIES} todayKey={TODAY_KEY} selectedKey={selected} onSelect={setSelected} noun={JOBS} />
      </div>
      <div aria-live="polite">
        {dayId ? (
          <AgendaList days={[agendaDay(dayId, selected === TODAY_KEY ? 'Today' : undefined)]} />
        ) : (
          <AgendaList
            days={[{ id: selected, label: `${dayNumber} March`, events: [] }]}
            emptyText={count === 0 ? 'No planned work on this day.' : `${count} ${count === 1 ? 'job' : 'jobs'} planned. Details open in the week view.`}
          />
        )}
      </div>
    </div>
  );
}

export default definePage({
  id: 'scheduling-and-calendars',
  title: 'Scheduling and calendars',
  summary:
    'Work placed in time: agendas for what is next, grids for how a day or week fits together, month views for how busy it gets, and the small pieces around them.',
  guidance: {
    use: [
      'An agenda when the question is "what is next"; a grid when it is "what fits where".',
      'One fixed time zone per view, named on the page when viewers sit elsewhere.',
      'A label and an icon on every conflict, with who or what is double-booked.',
      'A line for an empty day, so free time reads as free rather than missing.',
    ],
    avoid: [
      'Colouring events by status and by crew at once; pick one meaning for colour.',
      'A month grid for more than a count per day. Details belong in the day or week.',
      'Hiding booked slots in a picker; disable them and say why.',
      'A grid that only works by dragging. Offer a form or a reschedule action.',
    ],
  },
  source,
  sections: [
    {
      id: 'lists',
      title: 'Agenda and lists',
      description: 'Time as a list, and the short notes that go with a scheduled event.',
      specimens: [
        {
          id: 'ScheduleCalAgendaByDay',
          title: 'Agenda by day',
          note: 'Narrow panels and "what is next" views: events under their day, in time order, conflicts labelled.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['patterns/workflows/AgendaList.tsx', 'display/PersonAvatar.tsx'],
          Component: ScheduleCalAgendaByDay,
        },
        {
          id: 'ScheduleCalUpcomingCard',
          title: 'Upcoming card',
          note: 'A dashboard corner that answers "what do I have next" in three lines.',
          origin: 'custom',
          align: 'stretch',
          Component: ScheduleCalUpcomingCard,
        },
        {
          id: 'ScheduleCalEmptyDay',
          title: 'Empty day',
          note: 'Keep a free day in the list and say what it means for the plant.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/workflows/AgendaList.tsx'],
          Component: ScheduleCalEmptyDay,
        },
        {
          id: 'ScheduleCalRecurringSummary',
          title: 'Recurring rule summary',
          note: 'A repeating job: the rule in plain words, then the last and next occurrence.',
          origin: 'custom',
          align: 'stretch',
          uses: ['display/MetadataList.tsx'],
          Component: ScheduleCalRecurringSummary,
        },
        {
          id: 'ScheduleCalTimezoneNote',
          title: 'Time zone note',
          note: 'Viewers outside the plant time zone: show plant time first and name the zone.',
          origin: 'custom',
          align: 'stretch',
          Component: ScheduleCalTimezoneNote,
        },
      ],
    },
    {
      id: 'grids',
      title: 'Time grids',
      description: 'Hours down the side, events as blocks. Overlaps share the column through a tested layout helper.',
      specimens: [
        {
          id: 'ScheduleCalWeekGrid',
          title: 'Week grid',
          note: 'Planning a working week: one column per day, a line for now, a dashed block for a reserved window.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/workflows/WeekGrid.tsx', 'patterns/workflows/layoutEvents.ts'],
          Component: ScheduleCalWeekGrid,
        },
        {
          id: 'ScheduleCalDayView',
          title: 'Day view with now line',
          note: 'A shift at a glance: what is running, what is next and where the clock stands.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/workflows/WeekGrid.tsx'],
          Component: ScheduleCalDayView,
        },
        {
          id: 'ScheduleCalOverlaps',
          title: 'Overlapping events',
          note: 'Parallel jobs split the column into lanes and get the width back once a lane frees up.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/workflows/WeekGrid.tsx', 'patterns/workflows/layoutEvents.ts'],
          Component: ScheduleCalOverlaps,
        },
        {
          id: 'ScheduleCalMaintenanceWindow',
          title: 'Maintenance window',
          note: 'A reserved period that jobs are planned into: dashed and unfilled, so it reads as a frame, not a job.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/workflows/WeekGrid.tsx'],
          Component: ScheduleCalMaintenanceWindow,
        },
        {
          id: 'ScheduleCalConflict',
          title: 'Conflict',
          note: 'A double booking: icon and word on both blocks, and one sentence on who clashes and what to do.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/workflows/WeekGrid.tsx', 'patterns/workflows/layoutEvents.ts'],
          Component: ScheduleCalConflict,
        },
      ],
    },
    {
      id: 'month',
      title: 'Month',
      description: 'How busy each day is. The month shows load, not detail.',
      specimens: [
        {
          id: 'ScheduleCalMonthDots',
          title: 'Month with dots',
          note: 'A glance at which days carry work; up to three dots, then a number.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/workflows/MonthGrid.tsx', 'patterns/workflows/monthCells.ts'],
          Component: ScheduleCalMonthDots,
        },
        {
          id: 'ScheduleCalMonthCounts',
          title: 'Month with counts',
          note: 'When the number per day matters, for example to level the load.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/workflows/MonthGrid.tsx', 'patterns/workflows/monthCells.ts'],
          Component: ScheduleCalMonthCounts,
        },
        {
          id: 'ScheduleCalMonthSelect',
          title: 'Selectable month',
          note: 'The month as a date picker for a plan: pick a day to see what it holds.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/workflows/MonthGrid.tsx', 'patterns/workflows/monthCells.ts'],
          Component: ScheduleCalMonthSelect,
        },
      ],
    },
    {
      id: 'resources',
      title: 'Resources and shifts',
      description: 'Time from the point of view of crews and the people on shift.',
      specimens: [
        {
          id: 'ScheduleCalResourceRows',
          title: 'Resource rows',
          note: 'Crews down, days across: see who is booked, who has room and what is only pencilled in.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          Component: ScheduleCalResourceRows,
        },
        {
          id: 'ScheduleCalShiftPattern',
          title: 'Shift pattern strip',
          note: 'The three shifts of a day, with the one on duty set apart by weight and tone.',
          origin: 'custom',
          align: 'stretch',
          Component: ScheduleCalShiftPattern,
        },
        {
          id: 'ScheduleCalShiftRoster',
          title: 'Shift roster',
          note: 'Who works which shift this week; a letter per shift keeps it readable without colour.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          Component: ScheduleCalShiftRoster,
        },
        {
          id: 'ScheduleCalShiftNow',
          title: 'Current shift card',
          note: 'The shift on duty: its lead, its size and when it hands over.',
          origin: 'custom',
          align: 'stretch',
          uses: ['display/PersonAvatar.tsx', 'display/MetadataList.tsx'],
          Component: ScheduleCalShiftNow,
        },
      ],
    },
    {
      id: 'create-and-inspect',
      title: 'Create and inspect',
      description: 'Picking a time, creating an event and moving around the calendar.',
      specimens: [
        {
          id: 'ScheduleCalAvailabilityPicker',
          title: 'Availability picker',
          note: 'Collect the hours that work; booked hours stay in the grid, disabled and explained.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/workflows/TimeSlotPicker.tsx'],
          Component: ScheduleCalAvailabilityPicker,
        },
        {
          id: 'ScheduleCalQuickCreate',
          title: 'Quick create form',
          note: 'Four fields to put a job on the plan; everything else can be filled in on the work order.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/FormField.tsx', 'patterns/data-entry/OptionSelect.tsx', 'patterns/data-entry/FormActions.tsx'],
          Component: ScheduleCalQuickCreate,
        },
        {
          id: 'ScheduleCalEventPopover',
          title: 'Event detail popover',
          note: 'Details of one event without leaving the calendar. Click to open.',
          origin: 'custom',
          uses: ['display/MetadataList.tsx'],
          Component: ScheduleCalEventPopover,
        },
        {
          id: 'ScheduleCalDateNavigator',
          title: 'Date navigator',
          note: 'Step through weeks, with a way straight back to the current one.',
          origin: 'custom',
          uses: ['patterns/collections/IconAction.tsx'],
          Component: ScheduleCalDateNavigator,
        },
        {
          id: 'ScheduleCalViewSwitch',
          title: 'View switch',
          note: 'Day, week and month of the same plan; the range and count follow the view.',
          origin: 'custom',
          Component: ScheduleCalViewSwitch,
        },
      ],
    },
    {
      id: 'full-views',
      title: 'Full views',
      description: 'Complete planning views for week 11 at Nordkapp.',
      specimens: [
        {
          id: 'ScheduleCalWeekPlanner',
          title: 'Week planner',
          note: 'The planner view: select a job in the grid and read or reschedule it under the week.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/workflows/WeekGrid.tsx', 'patterns/structure/PropertyList.tsx'],
          Component: ScheduleCalWeekPlanner,
        },
        {
          id: 'ScheduleCalMonthPlanner',
          title: 'Month with day agenda',
          note: 'Load for the month on the left, the selected day as an agenda on the right.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/workflows/MonthGrid.tsx', 'patterns/workflows/AgendaList.tsx', 'patterns/workflows/monthCells.ts'],
          Component: ScheduleCalMonthPlanner,
        },
      ],
    },
  ],
});
