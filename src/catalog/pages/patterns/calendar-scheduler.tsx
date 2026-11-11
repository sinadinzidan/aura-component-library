import { ShortcutHint } from '../../../library/actions/ShortcutHint';
import { conflictsOf } from '../../../library/tools/scheduler/conflicts';
import type { ConflictRules, SchedEvent } from '../../../library/tools/scheduler/conflicts';
import { CREW_TONES } from '../../../library/tools/scheduler/crewTones';
import { EventBlock } from '../../../library/tools/scheduler/EventBlock';
import { EventDetailPanel } from '../../../library/tools/scheduler/EventDetailPanel';
import { EventForm } from '../../../library/tools/scheduler/EventForm';
import { SchedulerCalendar } from '../../../library/tools/scheduler/SchedulerCalendar';
import type { SchedulerCrew } from '../../../library/tools/scheduler/SchedulerCalendar';
import { longDayLabel, weekFrom } from '../../../library/tools/scheduler/timeMath';
import { definePage } from '../../types';

import source from './calendar-scheduler.tsx?raw';

/** Week 11 of 2026, Monday 9 to Sunday 15 March. The reference time is Thursday 12 March, 14:00. */
const WEEK = weekFrom('2026-03-09');
const NOW = { dayId: '2026-03-12', minute: 14 * 60 };
const THURSDAY = '2026-03-12';

const CREWS: readonly SchedulerCrew[] = [
  { id: 'mechanical', name: 'Mechanical' },
  { id: 'instrument', name: 'Instrument' },
  { id: 'operations', name: 'Operations' },
  { id: 'automation', name: 'Automation' },
];

const WORKDAYS = [1, 2, 3, 4, 5];

const RULES: ConflictRules = {
  hours: {
    mechanical: { weekdays: WORKDAYS, start: 7 * 60, end: 16 * 60 },
    instrument: { weekdays: WORKDAYS, start: 7 * 60, end: 16 * 60 },
    operations: { weekdays: [0, 1, 2, 3, 4, 5, 6], start: 6 * 60, end: 18 * 60 },
    automation: { weekdays: WORKDAYS, start: 8 * 60, end: 16 * 60 },
  },
  names: { mechanical: 'Mechanical', instrument: 'Instrument', operations: 'Operations', automation: 'Automation' },
};

const h = (hours: number, minutes = 0) => hours * 60 + minutes;

/** Maintenance jobs, meetings and permits for the plant week. Two clashes are on purpose. */
const WEEK_EVENTS: readonly SchedEvent[] = [
  { id: 'j1', title: 'Weekly planning meeting', dayId: '2026-03-09', resourceId: 'operations', start: h(7, 30), end: h(9), kind: 'meeting' },
  { id: 'j2', title: 'Standby start test, export pump B', dayId: '2026-03-09', resourceId: 'operations', start: h(10), end: h(14), kind: 'job', reference: '27-PA-2001B' },
  { id: 'j3', title: 'Partial stroke test', dayId: '2026-03-10', resourceId: 'operations', start: h(8), end: h(12), kind: 'job', reference: '20-XV-1105' },
  { id: 'j4', title: 'Calibrate level transmitter', dayId: '2026-03-10', resourceId: 'instrument', start: h(13), end: h(15), kind: 'job', reference: '20-LT-10012' },
  { id: 'j5', title: 'Cooling water outage', dayId: '2026-03-11', resourceId: 'operations', start: h(8), end: h(16), kind: 'permit', reference: 'NK-40' },
  { id: 'j6', title: 'Replace bearing temperature transmitter', dayId: '2026-03-11', resourceId: 'instrument', start: h(9), end: h(12), kind: 'job', reference: '40-TT-40015' },
  { id: 'j7', title: 'Inspect recompressor bearing', dayId: THURSDAY, resourceId: 'mechanical', start: h(8), end: h(14), kind: 'job', reference: '23-KA-9103' },
  { id: 'j8', title: 'Vibration survey, 1st stage', dayId: THURSDAY, resourceId: 'mechanical', start: h(12, 30), end: h(15), kind: 'job', reference: '23-KA-9101' },
  { id: 'j9', title: 'Upgrade turbine firmware', dayId: '2026-03-11', resourceId: 'automation', start: h(13), end: h(16), kind: 'job', reference: '23-GT-9001' },
  { id: 'j10', title: 'Shift handover', dayId: THURSDAY, resourceId: 'operations', start: h(15, 30), end: h(16, 30), kind: 'meeting' },
  { id: 'j11', title: 'Permit review', dayId: '2026-03-13', resourceId: 'operations', start: h(9), end: h(10, 30), kind: 'meeting', reference: 'PTW-2291' },
  { id: 'j12', title: 'Clean cooler tube bundle', dayId: '2026-03-13', resourceId: 'mechanical', start: h(11), end: h(16), kind: 'job', reference: '23-HA-9114' },
  { id: 'j13', title: 'Torque check, export pump A', dayId: '2026-03-13', resourceId: 'mechanical', start: h(16), end: h(17, 30), kind: 'job', reference: '27-PA-2001A' },
  { id: 'j14', title: 'Loop check, discharge pressure', dayId: '2026-03-14', resourceId: 'instrument', start: h(8), end: h(11), kind: 'job', reference: '23-PT-92531' },
  { id: 'p1', title: 'Permit PTW-2291, cold work', dayId: '2026-03-10', resourceId: 'operations', start: 0, end: 0, kind: 'permit', allDay: true, reference: 'PTW-2291' },
  { id: 'p2', title: 'Permit PTW-2297, confined space', dayId: THURSDAY, resourceId: 'operations', start: 0, end: 0, kind: 'permit', allDay: true, reference: 'PTW-2297' },
  { id: 'p3', title: 'Permit PTW-2301, hot work', dayId: '2026-03-13', resourceId: 'operations', start: 0, end: 0, kind: 'permit', allDay: true, reference: 'PTW-2301' },
];

const THURSDAY_EVENTS: readonly SchedEvent[] = WEEK_EVENTS.filter((event) => event.dayId === THURSDAY);

const LANE_EVENTS: readonly SchedEvent[] = [
  { id: 'l1', title: 'Inspect recompressor bearing', dayId: THURSDAY, resourceId: 'mechanical', start: h(8), end: h(14), kind: 'job', reference: '23-KA-9103' },
  { id: 'l2', title: 'Vibration survey, 1st stage', dayId: THURSDAY, resourceId: 'mechanical', start: h(12, 30), end: h(15), kind: 'job', reference: '23-KA-9101' },
  { id: 'l3', title: 'Lube oil sample', dayId: THURSDAY, resourceId: 'instrument', start: h(13), end: h(14), kind: 'job', reference: '23-KA-9102' },
  { id: 'l4', title: 'Shift handover', dayId: THURSDAY, resourceId: 'operations', start: h(15, 30), end: h(16, 30), kind: 'meeting' },
];

const SHIFT_EVENTS: readonly SchedEvent[] = [
  { id: 's1', title: 'Night round, compression', dayId: THURSDAY, resourceId: 'operations', start: h(1), end: h(3), kind: 'job', reference: 'NK-23' },
  { id: 's2', title: 'Shift handover', dayId: THURSDAY, resourceId: 'operations', start: h(5, 30), end: h(6, 30), kind: 'meeting' },
  { id: 's3', title: 'Standby start test, export pump B', dayId: THURSDAY, resourceId: 'operations', start: h(10), end: h(12), kind: 'job', reference: '27-PA-2001B' },
  { id: 's4', title: 'Shift handover', dayId: THURSDAY, resourceId: 'operations', start: h(17, 30), end: h(18, 30), kind: 'meeting' },
  { id: 's5', title: 'Night round, export', dayId: THURSDAY, resourceId: 'operations', start: h(22), end: h(23, 30), kind: 'job', reference: 'NK-27' },
];

const DAY_OPTIONS = WEEK.map((dayId) => ({ value: dayId, label: longDayLabel(dayId) }));
const CREW_OPTIONS = CREWS.map((crew) => ({ value: crew.id, label: crew.name }));

const HOURS_8_TO_18 = { startHour: 7, endHour: 18 } as const;

function CalSchedulerWeek() {
  return <SchedulerCalendar label="Maintenance week 11" events={WEEK_EVENTS} days={WEEK} crews={CREWS} rules={RULES} defaultCrewId="mechanical" now={NOW} focusDay={THURSDAY} {...HOURS_8_TO_18} className="h-160" />;
}

function CalSchedulerResource() {
  return <SchedulerCalendar label="Crews on Thursday 12 March" view="resource" events={WEEK_EVENTS} days={WEEK} crews={CREWS} rules={RULES} defaultCrewId="mechanical" now={NOW} focusDay={THURSDAY} {...HOURS_8_TO_18} className="h-160" />;
}

function CalSchedulerDay() {
  return <SchedulerCalendar label="Thursday 12 March" view="day" showViewSwitch={false} events={WEEK_EVENTS} days={WEEK} crews={CREWS} rules={RULES} defaultCrewId="mechanical" now={NOW} focusDay={THURSDAY} {...HOURS_8_TO_18} className="h-128" />;
}

function CalSchedulerQuickCreate() {
  return (
    <SchedulerCalendar
      label="Friday 13 March, new job"
      view="day"
      showViewSwitch={false}
      events={WEEK_EVENTS}
      days={WEEK}
      crews={CREWS}
      rules={RULES}
      defaultCrewId="mechanical"
      focusDay="2026-03-13"
      initialDraft={{ dayId: '2026-03-13', resourceId: 'mechanical', start: h(13), end: h(14, 30) }}
      {...HOURS_8_TO_18}
      className="h-128"
    />
  );
}

function CalSchedulerLanes() {
  return <SchedulerCalendar label="Overlapping jobs on Thursday" view="day" showViewSwitch={false} events={LANE_EVENTS} days={WEEK} crews={CREWS} rules={RULES} defaultCrewId="mechanical" focusDay={THURSDAY} startHour={7} endHour={17} className="h-112" />;
}

function CalSchedulerBlocks() {
  const job = WEEK_EVENTS[6];
  return (
    <div className="flex w-full max-w-64 flex-col gap-2">
      {CREWS.map((crew, index) => (
        <EventBlock key={crew.id} inline event={{ ...job, id: crew.id, resourceId: crew.id, title: `${crew.name} job` }} tone={CREW_TONES[index]} crewName={crew.name} resizable={false} lines={3} />
      ))}
      <EventBlock inline event={WEEK_EVENTS[4]} tone={CREW_TONES[0]} lines={3} resizable={false} />
      <EventBlock inline event={WEEK_EVENTS[0]} tone={CREW_TONES[0]} lines={2} resizable={false} />
      <EventBlock inline event={WEEK_EVENTS[7]} tone={CREW_TONES[0]} conflict="Mechanical is already booked" lines={4} resizable={false} />
      <EventBlock inline selected event={{ ...job, id: 'selected', title: 'Selected job' }} tone={CREW_TONES[1]} lines={3} resizable={false} />
    </div>
  );
}

function CalSchedulerEventForm() {
  return (
    <div className="w-full max-w-xs">
      <EventForm
        initial={{ title: 'Vibration check, 23-KA-9101', dayId: THURSDAY, resourceId: 'mechanical', start: h(11), end: h(12, 30) }}
        days={DAY_OPTIONS}
        crews={CREW_OPTIONS}
        conflictsFor={(values) => conflictsOf({ ...values, kind: 'job' }, WEEK_EVENTS, RULES)}
        onSubmit={() => undefined}
        onCancel={() => undefined}
      />
    </div>
  );
}

function CalSchedulerDetailPanel() {
  const job = WEEK_EVENTS[7];
  return (
    <div className="w-full max-w-xs rounded-lg border border-default">
      <EventDetailPanel event={job} crewName="Mechanical" conflicts={conflictsOf(job, WEEK_EVENTS, RULES)} onDelete={() => undefined} onClose={() => undefined} />
    </div>
  );
}

const REASON_CASES: readonly { title: string; event: SchedEvent }[] = [
  { title: 'Same crew, same time', event: { id: 'r1', title: 'Seal change, export pump A', dayId: THURSDAY, resourceId: 'mechanical', start: h(9), end: h(11), kind: 'job' } },
  { title: 'After working hours', event: { id: 'r2', title: 'Torque check, export pump A', dayId: '2026-03-13', resourceId: 'mechanical', start: h(16), end: h(17, 30), kind: 'job' } },
  { title: 'Day off', event: { id: 'r3', title: 'Loop check, discharge pressure', dayId: '2026-03-14', resourceId: 'instrument', start: h(8), end: h(11), kind: 'job' } },
];

function CalSchedulerConflictReasons() {
  return (
    <dl className="flex w-full max-w-xs flex-col gap-3 text-sm">
      {REASON_CASES.map((item) => (
        <div key={item.title} className="flex flex-col gap-0.5">
          <dt className="font-medium text-base-foreground">{item.title}</dt>
          {conflictsOf(item.event, WEEK_EVENTS, RULES).map((conflict) => (
            <dd key={conflict.message} className="text-xs text-warning-foreground-strong">
              {conflict.message}
            </dd>
          ))}
        </div>
      ))}
    </dl>
  );
}

const KEYS: readonly { keys: readonly string[]; action: string }[] = [
  { keys: ['Tab'], action: 'Focus the next job' },
  { keys: ['up'], action: 'Move a slot earlier' },
  { keys: ['down'], action: 'Move a slot later' },
  { keys: ['left'], action: 'Move to the previous column' },
  { keys: ['right'], action: 'Move to the next column' },
  { keys: ['shift', 'down'], action: 'Make it a slot longer' },
  { keys: ['shift', 'up'], action: 'Make it a slot shorter' },
  { keys: ['enter'], action: 'Open the details' },
  { keys: ['Delete'], action: 'Remove the job' },
  { keys: ['mod', 'Z'], action: 'Undo' },
];

function CalSchedulerKeyboard() {
  return (
    <dl className="flex w-full max-w-sm flex-col gap-2 text-sm">
      {KEYS.map((item) => (
        <div key={item.action} className="flex items-center justify-between gap-4">
          <dt className="text-medium-foreground">{item.action}</dt>
          <dd className="shrink-0">
            <ShortcutHint keys={item.keys} platform="other" />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function CalSchedulerFullDay() {
  return <SchedulerCalendar label="Operations, 24 hours" view="day" showViewSwitch={false} events={SHIFT_EVENTS} days={WEEK} crews={CREWS} rules={RULES} defaultCrewId="operations" focusDay={THURSDAY} now={NOW} startHour={0} endHour={24} hourUnits={9} className="h-128" />;
}

function CalSchedulerReadOnly() {
  return <SchedulerCalendar label="Thursday 12 March, read-only" view="day" showViewSwitch={false} readOnly events={THURSDAY_EVENTS} days={WEEK} crews={CREWS} rules={RULES} defaultCrewId="mechanical" focusDay={THURSDAY} now={NOW} {...HOURS_8_TO_18} className="h-112" />;
}

function CalSchedulerLoading() {
  return <SchedulerCalendar label="Thursday 12 March, loading" view="day" showViewSwitch={false} loading events={[]} days={WEEK} crews={CREWS} rules={RULES} defaultCrewId="mechanical" focusDay={THURSDAY} {...HOURS_8_TO_18} className="h-112" />;
}

function CalSchedulerEmpty() {
  return <SchedulerCalendar label="Saturday 14 March, nothing planned" view="day" showViewSwitch={false} events={[]} days={WEEK} crews={CREWS} rules={RULES} defaultCrewId="operations" focusDay="2026-03-14" {...HOURS_8_TO_18} className="h-112" />;
}

function CalSchedulerOpenDetail() {
  return <SchedulerCalendar label="Maintenance week 11, conflict open" events={WEEK_EVENTS} days={WEEK} crews={CREWS} rules={RULES} defaultCrewId="mechanical" now={NOW} focusDay={THURSDAY} initialOpenId="j8" {...HOURS_8_TO_18} className="h-160" />;
}

function CalSchedulerDense() {
  return <SchedulerCalendar label="Maintenance week 11, dense" events={WEEK_EVENTS} days={WEEK} crews={CREWS} rules={RULES} defaultCrewId="mechanical" now={NOW} focusDay={THURSDAY} startHour={7} endHour={18} hourUnits={8} className="h-112" />;
}

export default definePage({
  id: 'calendar-scheduler',
  title: 'Calendar scheduler',
  summary:
    'A week, day and crew calendar for planning maintenance work: drag on empty time to create a job, drag a job to move it, drag its edge to resize it, and see at once when a crew is double-booked or a job falls outside working hours.',
  guidance: {
    use: [
      'Snap to a fixed slot, show a ghost while dragging, and say why a job conflicts the moment it does.',
      'Give every drag a keyboard path and announce the result: a planner who cannot drag still has to plan.',
      'Let a clash be scheduled anyway; a double booking is sometimes the plan. Mark it, do not block it.',
      'Keep undo one press away. A move across a crowded week is easy to get wrong.',
    ],
    avoid: [
      'Hiding working hours: shade the time outside them so the limit is visible before the drop.',
      'Colour as the only sign of a conflict. Use the icon, the word and the reason.',
      'Deleting without undo, or confirming every delete; undo is the better safety net.',
      'Using it for dates far apart. Month and agenda views are for that.',
    ],
  },
  source,
  sections: [
    {
      id: 'working',
      title: 'Working schedulers',
      description: 'Drag on empty time, drag a job, drag its bottom edge. Focus a job and use the arrow keys, Enter and Delete. The Thursday clash and the Saturday loop check are on purpose.',
      specimens: [
        {
          id: 'CalSchedulerWeek',
          title: 'Week scheduler',
          note: 'Pick it to plan the week: jobs by day, overlaps in lanes, permits in the all-day row and the now line.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/scheduler/SchedulerCalendar.tsx', 'tools/scheduler/schedulerReducer.ts', 'tools/scheduler/geometry.ts', 'tools/scheduler/timeMath.ts', 'tools/scheduler/conflicts.ts', 'patterns/workflows/layoutEvents.ts'],
          Component: CalSchedulerWeek,
        },
        {
          id: 'CalSchedulerResource',
          title: 'Crews as columns',
          note: 'Switch to it when the question is who is free: one column per crew, and dropping a job on a column assigns that crew.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/scheduler/SchedulerCalendar.tsx', 'tools/scheduler/geometry.ts', 'tools/scheduler/conflicts.ts'],
          Component: CalSchedulerResource,
        },
        {
          id: 'CalSchedulerDay',
          title: 'Day view',
          note: 'Use one day when the week is too coarse and one shift needs minute-level planning.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/scheduler/SchedulerCalendar.tsx'],
          Component: CalSchedulerDay,
        },
        {
          id: 'CalSchedulerQuickCreate',
          title: 'Quick-create after a drag',
          note: 'A drag on empty time leaves a ghost and opens a short form beside it, with the clash shown before you save.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/scheduler/SchedulerCalendar.tsx', 'tools/scheduler/EventForm.tsx'],
          Component: CalSchedulerQuickCreate,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The blocks, forms and panels the scheduler is made of, and the rules behind the conflict marks.',
      specimens: [
        {
          id: 'CalSchedulerLanes',
          title: 'Overlapping jobs in lanes',
          note: 'Jobs that overlap share the column side by side, so none is hidden behind another.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['tools/scheduler/SchedulerCalendar.tsx', 'patterns/workflows/layoutEvents.ts'],
          Component: CalSchedulerLanes,
        },
        {
          id: 'CalSchedulerBlocks',
          title: 'Event blocks',
          note: 'Crew colour tells crews apart; permits are dashed, meetings are neutral, a clash adds an icon and a word.',
          origin: 'custom',
          size: 'sm',
          align: 'center',
          uses: ['tools/scheduler/EventBlock.tsx', 'tools/scheduler/crewTones.ts'],
          Component: CalSchedulerBlocks,
        },
        {
          id: 'CalSchedulerEventForm',
          title: 'New job form',
          note: 'The keyboard path for creating a job: the same fields as the quick-create, with the conflict shown live.',
          origin: 'custom',
          size: 'sm',
          align: 'center',
          uses: ['tools/scheduler/EventForm.tsx'],
          Component: CalSchedulerEventForm,
        },
        {
          id: 'CalSchedulerDetailPanel',
          title: 'Job detail panel',
          note: 'Show where, when and by whom, then every reason the job clashes, and the actions that apply.',
          origin: 'custom',
          size: 'sm',
          align: 'center',
          uses: ['tools/scheduler/EventDetailPanel.tsx'],
          Component: CalSchedulerDetailPanel,
        },
        {
          id: 'CalSchedulerConflictReasons',
          title: 'Conflict reasons',
          note: 'Name the rule that is broken and the thing it clashes with, in the planner’s words.',
          origin: 'custom',
          size: 'md',
          align: 'center',
          uses: ['tools/scheduler/conflicts.ts'],
          Component: CalSchedulerConflictReasons,
        },
        {
          id: 'CalSchedulerKeyboard',
          title: 'Keyboard reference',
          note: 'Put it in a help popover beside the calendar so every drag has a visible keyboard equivalent.',
          origin: 'custom',
          size: 'md',
          align: 'center',
          uses: ['actions/ShortcutHint.tsx'],
          Component: CalSchedulerKeyboard,
        },
        {
          id: 'CalSchedulerFullDay',
          title: 'Twenty-four hours',
          note: 'Show the whole day for crews that run shifts; the working-hours shading follows the crew.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/scheduler/SchedulerCalendar.tsx'],
          Component: CalSchedulerFullDay,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'A conflict open in the panel, a read-only plan, loading, an empty day and a dense week.',
      specimens: [
        {
          id: 'CalSchedulerOpenDetail',
          title: 'Conflict open in the panel',
          note: 'Selecting a job opens its panel beside the grid, with the reasons it clashes in words.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/scheduler/SchedulerCalendar.tsx', 'tools/scheduler/EventDetailPanel.tsx'],
          Component: CalSchedulerOpenDetail,
        },
        {
          id: 'CalSchedulerReadOnly',
          title: 'Read-only',
          note: 'Use it for a published or past plan: jobs open for reading, nothing drags, creates or deletes.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/scheduler/SchedulerCalendar.tsx'],
          Component: CalSchedulerReadOnly,
        },
        {
          id: 'CalSchedulerLoading',
          title: 'Loading',
          note: 'Keep the time grid and working hours in place and show a placeholder where jobs will land.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/scheduler/SchedulerCalendar.tsx'],
          Component: CalSchedulerLoading,
        },
        {
          id: 'CalSchedulerEmpty',
          title: 'Nothing planned',
          note: 'A day off shows as shaded time; creating a job there is allowed and marked as outside working hours.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/scheduler/SchedulerCalendar.tsx'],
          Component: CalSchedulerEmpty,
        },
        {
          id: 'CalSchedulerDense',
          title: 'Dense week',
          note: 'Shorter hours give a whole week in little height, for an overview rather than for editing.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/scheduler/SchedulerCalendar.tsx'],
          Component: CalSchedulerDense,
        },
      ],
    },
  ],
});
