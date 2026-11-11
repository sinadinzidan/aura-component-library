import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import {
  IconAlertTriangle,
  IconBell,
  IconCheck,
  IconClipboardCheck,
  IconFileText,
  IconFlame,
  IconMessage,
  IconPencil,
  IconPlayerPlay,
  IconTool,
} from '@cognite/aura/icons';
import { useState } from 'react';

import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { Timeline } from '../../../library/primitives/timeline/Timeline';
import { TimelineCollapse } from '../../../library/primitives/timeline/TimelineCollapse';
import { formatTimelineDuration, groupTimelineItems, splitTimelineMiddle } from '../../../library/primitives/timeline/timelineData';
import { TimelineGroup } from '../../../library/primitives/timeline/TimelineGroup';
import { TimelineItem } from '../../../library/primitives/timeline/TimelineItem';
import { TimelineSkeleton } from '../../../library/primitives/timeline/TimelineSkeleton';
import { PEOPLE } from '../../data/plant';
import { DAY, HOUR, MINUTE, REFERENCE_NOW, formatDate, formatTime } from '../../data/series';
import { definePage } from '../../types';

import source from './timeline.tsx?raw';

const at = (minutesAgo: number) => formatTime(REFERENCE_NOW - minutesAgo * MINUTE);

function TimelinePrimPlain() {
  return (
    <Timeline label="Alarm history">
      <TimelineItem title="Alarm raised" time={at(48)} description="Discharge temperature 146.3 °C above 145.0 °C" />
      <TimelineItem title="Acknowledged by Ingrid Haugen" time={at(41)} />
      <TimelineItem title="Work order WO-104482 created" time={at(33)} />
      <TimelineItem title="Alarm cleared" time={at(6)} />
    </Timeline>
  );
}

function TimelinePrimTimeStart() {
  return (
    <Timeline label="Alarm history, time first" layout="time-start">
      <TimelineItem title="Alarm raised" time={at(48)} description="Discharge temperature above limit" />
      <TimelineItem title="Acknowledged" time={at(41)} />
      <TimelineItem title="Work order created" time={at(33)} />
      <TimelineItem title="Alarm cleared" time={at(6)} />
    </Timeline>
  );
}

function TimelinePrimAlternate() {
  return (
    <Timeline label="Compressor start, alternating" layout="alternate">
      <TimelineItem title="Lube oil on" time={at(25)} />
      <TimelineItem title="Seal gas open" time={at(22)} />
      <TimelineItem title="Ignition" time={at(18)} />
      <TimelineItem title="At idle" time={at(12)} />
      <TimelineItem title="On load" time={at(4)} state="current" />
    </Timeline>
  );
}

function TimelinePrimHorizontal() {
  return (
    <Timeline label="Alarm life cycle" orientation="horizontal">
      <TimelineItem title="Raised" time={at(48)} tone="critical" shape="diamond" />
      <TimelineItem title="Acknowledged" time={at(41)} />
      <TimelineItem title="Work order created" time={at(33)} />
      <TimelineItem title="Cleared" time={at(6)} tone="success" />
    </Timeline>
  );
}

function TimelinePrimIcons() {
  return (
    <Timeline label="Work order events">
      <TimelineItem title="Created" time="10 Mar" icon={<IconFileText />} />
      <TimelineItem title="Planned" time="11 Mar" icon={<IconClipboardCheck />} />
      <TimelineItem title="Work started" time="12 Mar" icon={<IconTool />} state="current" />
      <TimelineItem title="Completed" time="Due 13 Mar" icon={<IconCheck />} state="pending" />
    </Timeline>
  );
}

function TimelinePrimAvatars() {
  return (
    <Timeline label="Handover notes">
      {PEOPLE.slice(0, 3).map((person, index) => (
        <TimelineItem
          key={person.id}
          title={person.name}
          time={at(120 - index * 45)}
          description={
            index === 0
              ? 'Handed over the recompressor trip'
              : index === 1
                ? 'Took over, bearing inspection ongoing'
                : 'Added vibration trend to the log'
          }
          avatar={<PersonAvatar name={person.name} initials={person.initials} sizes="xxsm" />}
        />
      ))}
    </Timeline>
  );
}

function TimelinePrimShapes() {
  return (
    <Timeline label="Status changes">
      <TimelineItem title="Running" time={at(300)} tone="success" shape="dot" />
      <TimelineItem title="High vibration alarm" time={at(120)} tone="warning" shape="square" />
      <TimelineItem title="Tripped" time={at(14)} tone="critical" shape="diamond" />
      <TimelineItem title="Awaiting inspection" time="Now" tone="info" shape="ring" state="current" />
    </Timeline>
  );
}

function TimelinePrimTones() {
  return (
    <Timeline label="Marker tones">
      <TimelineItem title="Neutral, a plain log entry" />
      <TimelineItem title="Info, a state change" tone="info" />
      <TimelineItem title="Success, completed" tone="success" icon={<IconCheck />} />
      <TimelineItem title="Warning, needs a look" tone="warning" icon={<IconAlertTriangle />} />
      <TimelineItem title="Critical, tripped" tone="critical" icon={<IconFlame />} />
    </Timeline>
  );
}

function TimelinePrimPending() {
  return (
    <Timeline label="Calibration plan">
      <TimelineItem title="Transmitter isolated" time={at(60)} />
      <TimelineItem title="As-found check" time={at(35)} state="current" description="Reading 3 points" />
      <TimelineItem title="Adjust and as-left check" state="pending" time="Next" />
      <TimelineItem title="Return to service" state="pending" time="After sign-off" />
    </Timeline>
  );
}

function TimelinePrimConnectors() {
  return (
    <Timeline label="Connector styles">
      <TimelineItem title="Solid line to the next event" />
      <TimelineItem title="Dashed line, outcome uncertain" connector="dashed" />
      <TimelineItem title="Last event before a gap" connector="none" />
      <TimelineItem title="Separate event with no line before it" />
    </Timeline>
  );
}

function TimelinePrimCompact() {
  return (
    <Timeline label="Operator log, compact" density="compact">
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <TimelineItem
          key={index}
          title={
            ['Separator level 54 %', 'Choke adjusted', 'Sample taken', 'Pump B started', 'Valve 20-XV-1105 tested', 'Round completed'][
              index
            ]
          }
          time={at(150 - index * 25)}
        />
      ))}
    </Timeline>
  );
}

function TimelinePrimComfortable() {
  return (
    <Timeline label="Decision log, comfortable" density="comfortable">
      <TimelineItem title="Reduce load on 23-KA-9101" time={at(90)} description="Discharge temperature trending up for two hours" />
      <TimelineItem title="Hold at 85 % load" time={at(60)} description="Temperature stable at 141 °C" />
      <TimelineItem title="Return to full load" time={at(10)} description="Cooler cleaned, outlet back at 38.9 °C" />
    </Timeline>
  );
}

const DAY_EVENTS = [
  { day: formatDate(REFERENCE_NOW), id: 'a', title: 'Work order WO-104482 started', time: at(40), person: 3 },
  { day: formatDate(REFERENCE_NOW), id: 'b', title: 'Permit approved', time: at(90), person: 4 },
  { day: formatDate(REFERENCE_NOW - DAY), id: 'c', title: 'Spare part reserved', time: formatTime(REFERENCE_NOW - DAY), person: 1 },
  {
    day: formatDate(REFERENCE_NOW - DAY),
    id: 'd',
    title: 'Work order WO-104482 created',
    time: formatTime(REFERENCE_NOW - DAY - 2 * HOUR),
    person: 1,
  },
  { day: formatDate(REFERENCE_NOW - 2 * DAY), id: 'e', title: 'Alarm acknowledged', time: formatTime(REFERENCE_NOW - 2 * DAY), person: 0 },
];

function TimelinePrimGrouped() {
  const groups = groupTimelineItems(DAY_EVENTS, (event) => event.day);
  return (
    <Timeline label="Activity by day">
      {groups.map((group) => (
        <TimelineGroup key={group.key} heading={group.key} meta={`${group.items.length} ${group.items.length === 1 ? 'event' : 'events'}`}>
          {group.items.map((event) => (
            <TimelineItem key={event.id} title={event.title} time={event.time} />
          ))}
        </TimelineGroup>
      ))}
    </Timeline>
  );
}

const HISTORY = [
  'Created',
  'Risk assessed',
  'Planned',
  'Scope approved',
  'Materials reserved',
  'Permit requested',
  'Permit approved',
  'Scaffolding ordered',
  'Scaffolding built',
  'Isolation applied',
  'Work started',
  'Bearing replaced',
];

function TimelinePrimCollapsed() {
  const { head, middle, tail } = splitTimelineMiddle(HISTORY, 1, 2);
  return (
    <Timeline label="Work order history">
      {head.map((title, index) => (
        <TimelineItem key={title} title={title} time={`${3 + index} Mar`} />
      ))}
      <TimelineCollapse count={middle.length}>
        {middle.map((title, index) => (
          <TimelineItem key={title} title={title} time={`${4 + index} Mar`} />
        ))}
      </TimelineCollapse>
      {tail.map((title, index) => (
        <TimelineItem key={title} title={title} time={`${11 + index} Mar`} />
      ))}
    </Timeline>
  );
}

function TimelinePrimDurations() {
  const phases = [
    { title: 'Isolation', start: 190, end: 170 },
    { title: 'Inspection', start: 170, end: 95 },
    { title: 'Repair', start: 95, end: 20 },
  ];
  return (
    <Timeline label="Maintenance phases" layout="time-start">
      {phases.map((phase) => (
        <TimelineItem
          key={phase.title}
          title={phase.title}
          time={at(phase.start)}
          duration={formatTimelineDuration((phase.start - phase.end) * MINUTE)}
        />
      ))}
      <TimelineItem title="Return to service" time={at(20)} state="current" />
    </Timeline>
  );
}

function TimelinePrimCards() {
  return (
    <Timeline label="Work order updates">
      <TimelineItem title="Technician comment" time={at(75)} avatar={<PersonAvatar name="Tomás Barros" initials="TB" sizes="xxsm" />}>
        <div className="rounded-lg bg-muted-background p-3 text-sm text-medium-foreground">
          Drive-end bearing shows scoring on the outer race. Replacement is needed; spare is on site.
        </div>
      </TimelineItem>
      <TimelineItem title="Fields changed" time={at(40)} icon={<IconPencil />}>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-lg bg-muted-background p-3 text-sm">
          <dt className="text-muted-foreground">Priority</dt>
          <dd>P2 to P1</dd>
          <dt className="text-muted-foreground">Estimate</dt>
          <dd className="tabular-nums">4 h to 8 h</dd>
        </dl>
      </TimelineItem>
    </Timeline>
  );
}

function TimelinePrimLoading() {
  return <TimelineSkeleton items={4} label="Loading incident timeline" />;
}

function TimelinePrimEmpty() {
  return (
    <div className="flex w-full flex-col items-center gap-1 py-6 text-center">
      <p className="text-sm font-medium text-base-foreground">No events yet</p>
      <p className="text-sm text-muted-foreground">Events appear here as the alarm is handled.</p>
    </div>
  );
}

function TimelinePrimHorizontalPending() {
  return (
    <Timeline label="Work order life cycle" orientation="horizontal">
      <TimelineItem title="Requested" time="10 Mar" />
      <TimelineItem title="Approved" time="11 Mar" />
      <TimelineItem title="In progress" time="12 Mar" state="current" />
      <TimelineItem title="Verified" time="Planned 14 Mar" state="pending" />
      <TimelineItem title="Closed" time="Planned 15 Mar" state="pending" />
    </Timeline>
  );
}

function TimelinePrimHorizontalDurations() {
  return (
    <Timeline label="Shutdown phases" orientation="horizontal">
      <TimelineItem title="Depressurise" time="09:00" duration="25 min" />
      <TimelineItem title="Drain" time="09:25" duration="1 h 10 min" tone="warning" shape="square" />
      <TimelineItem title="Purge" time="10:35" duration="40 min" />
      <TimelineItem title="Handover" time="11:15" />
    </Timeline>
  );
}

function TimelinePrimIncident() {
  return (
    <Timeline label="Incident timeline, recompressor trip" layout="time-start">
      <TimelineItem
        title="High vibration alarm"
        time={at(26)}
        tone="warning"
        shape="square"
        description="23-VT-92740 at 9.4 mm/s, limit 7.1"
      />
      <TimelineItem
        title="Recompressor tripped"
        time={at(14)}
        tone="critical"
        shape="diamond"
        description="High-high vibration, 11.6 mm/s against 11.0"
      >
        <Badge variant="error">Critical</Badge>
      </TimelineItem>
      <TimelineItem
        title="Acknowledged"
        time={at(12)}
        avatar={<PersonAvatar name="Ingrid Haugen" initials="IH" sizes="xxsm" />}
        description="Ingrid Haugen, control room"
      />
      <TimelineItem title="Standby compressor started" time={at(9)} icon={<IconPlayerPlay />} />
      <TimelineItem title="Work order WO-104482 created" time={at(5)} icon={<IconTool />} state="current" />
      <TimelineItem title="Inspection complete" state="pending" time="Next" />
    </Timeline>
  );
}

function TimelinePrimWorkOrder() {
  return (
    <div className="flex w-full flex-col gap-6">
      <Timeline label="WO-104482 life cycle" orientation="horizontal">
        <TimelineItem title="Created" time="10 Mar" />
        <TimelineItem title="Planned" time="11 Mar" />
        <TimelineItem title="In progress" time="12 Mar" state="current" description="35 % done" />
        <TimelineItem title="Verified" state="pending" time="Due 13 Mar" />
        <TimelineItem title="Closed" state="pending" />
      </Timeline>
    </div>
  );
}

function TimelinePrimActivityFeed() {
  const [shown, setShown] = useState(false);
  return (
    <div className="flex w-full flex-col gap-3">
      <Timeline label="Activity feed">
        <TimelineGroup heading="Today">
          <TimelineItem
            title="Tomás Barros commented on WO-104482"
            time={at(75)}
            avatar={<PersonAvatar name="Tomás Barros" initials="TB" sizes="xxsm" />}
          />
          <TimelineItem
            title="Magnus Solberg reserved a spare bearing"
            time={at(130)}
            avatar={<PersonAvatar name="Magnus Solberg" initials="MS" sizes="xxsm" />}
          />
        </TimelineGroup>
        <TimelineGroup heading="Yesterday">
          <TimelineItem
            title="Aisha Khan updated the vibration limit"
            time={formatTime(REFERENCE_NOW - DAY)}
            avatar={<PersonAvatar name="Aisha Khan" initials="AK" sizes="xxsm" />}
          />
          {shown ? (
            <TimelineItem
              title="Jonas Nyberg calibrated 20-LT-10012"
              time={formatTime(REFERENCE_NOW - DAY - 3 * HOUR)}
              avatar={<PersonAvatar name="Jonas Nyberg" initials="JN" sizes="xxsm" />}
            />
          ) : null}
        </TimelineGroup>
      </Timeline>
      {shown ? null : (
        <div>
          <Button variant="ghost" size="sm" onClick={() => setShown(true)}>
            <IconMessage /> Load earlier activity
          </Button>
        </div>
      )}
    </div>
  );
}

const SHIFT_EVENTS = [
  { hour: '06:00', time: '06:00', title: 'Shift handover', detail: 'Liv Wold to Ingrid Haugen', icon: <IconBell /> },
  { hour: '06:00', time: '06:20', title: 'Round 1 started', detail: 'Gas compression area' },
  { hour: '07:00', time: '07:05', title: 'Separator level deviation', detail: '71.2 % against 70.0 %', tone: 'warning' as const },
  { hour: '07:00', time: '07:40', title: 'Level back in range' },
  { hour: '08:00', time: '08:10', title: 'Standby pump test', detail: 'Export pump B, started OK' },
];

function TimelinePrimShift() {
  const groups = groupTimelineItems(SHIFT_EVENTS, (event) => event.hour);
  return (
    <Timeline label="Day shift events" layout="time-start" density="compact">
      {groups.map((group) => (
        <TimelineGroup key={group.key} heading={`${group.key} hour`}>
          {group.items.map((event) => (
            <TimelineItem
              key={event.title}
              title={event.title}
              time={event.time}
              description={event.detail}
              tone={event.tone}
              icon={event.icon}
            />
          ))}
        </TimelineGroup>
      ))}
    </Timeline>
  );
}

export default definePage({
  id: 'timeline',
  title: 'Timeline',
  summary:
    'Events in order on one line, vertical or horizontal. What happened is solid, where things stand is current, what has not happened yet is hollow on a dashed line.',
  guidance: {
    use: [
      'A timeline for events with a time, in the order they happened; the list is ordered and named.',
      'Neutral markers by default; a tone and a shape only for events that are themselves a state change.',
      'Group a long log by day or shift, and fold the middle behind "Show N earlier".',
      'Cards under an event for comments and changes, so the line stays readable.',
    ],
    avoid: [
      'Colour as the only sign of severity: pair tone with a shape and a word.',
      'A timeline for steps people move through; use a Stepper.',
      'Horizontal layout for more than six events, or events with long descriptions.',
      'Hiding that something is pending: it is hollow, dashed and read out as "not yet".',
    ],
  },
  source,
  sections: [
    {
      id: 'layouts',
      title: 'Layouts',
      description: 'Vertical with the time beside the title, in its own column or alternating, and horizontal.',
      specimens: [
        {
          id: 'TimelinePrimPlain',
          title: 'Plain',
          note: 'The default log: time at the end of the title row.',
          origin: 'custom',
          size: 'md',
          uses: ['primitives/timeline/Timeline.tsx', 'primitives/timeline/TimelineItem.tsx'],
          Component: TimelinePrimPlain,
        },
        {
          id: 'TimelinePrimTimeStart',
          title: 'Time on the left',
          note: 'Times in their own column so they scan down the page.',
          origin: 'custom',
          size: 'md',
          uses: ['primitives/timeline/Timeline.tsx', 'primitives/timeline/TimelineItem.tsx'],
          Component: TimelinePrimTimeStart,
        },
        {
          id: 'TimelinePrimAlternate',
          title: 'Alternating',
          note: 'Short events on both sides of the line, for a few steps with generous room.',
          origin: 'custom',
          size: 'md',
          uses: ['primitives/timeline/Timeline.tsx', 'primitives/timeline/TimelineItem.tsx'],
          Component: TimelinePrimAlternate,
        },
        {
          id: 'TimelinePrimHorizontal',
          title: 'Horizontal',
          note: 'A short life cycle that fits on one row: three to six events.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/timeline/Timeline.tsx', 'primitives/timeline/TimelineItem.tsx'],
          Component: TimelinePrimHorizontal,
        },
      ],
    },
    {
      id: 'markers',
      title: 'Markers, tones and connectors',
      description: 'Dot, icon, avatar or status shape; tone only where it means something.',
      specimens: [
        {
          id: 'TimelinePrimIcons',
          title: 'Icon markers',
          note: 'The kind of event in an icon tile; the current one is filled.',
          origin: 'custom',
          size: 'sm',
          uses: ['primitives/timeline/Timeline.tsx', 'primitives/timeline/TimelineItem.tsx'],
          Component: TimelinePrimIcons,
        },
        {
          id: 'TimelinePrimAvatars',
          title: 'Avatar markers',
          note: 'Who did it, when the person matters more than the kind of event.',
          origin: 'custom',
          size: 'md',
          uses: ['primitives/timeline/Timeline.tsx', 'primitives/timeline/TimelineItem.tsx', 'display/PersonAvatar.tsx'],
          Component: TimelinePrimAvatars,
        },
        {
          id: 'TimelinePrimShapes',
          title: 'Status shapes',
          note: 'Tone plus shape, so a state change reads without colour.',
          origin: 'custom',
          size: 'sm',
          uses: ['primitives/timeline/Timeline.tsx', 'primitives/timeline/TimelineItem.tsx'],
          Component: TimelinePrimShapes,
        },
        {
          id: 'TimelinePrimTones',
          title: 'Tones',
          note: 'Neutral, info, success, warning and critical markers, with icons for the strong ones.',
          origin: 'custom',
          size: 'md',
          uses: ['primitives/timeline/Timeline.tsx', 'primitives/timeline/TimelineItem.tsx'],
          Component: TimelinePrimTones,
        },
        {
          id: 'TimelinePrimConnectors',
          title: 'Connector styles',
          note: 'Solid by default, dashed where the outcome is uncertain, none for a gap.',
          origin: 'custom',
          size: 'md',
          uses: ['primitives/timeline/Timeline.tsx', 'primitives/timeline/TimelineItem.tsx'],
          Component: TimelinePrimConnectors,
        },
        {
          id: 'TimelinePrimPending',
          title: 'Current and pending',
          note: 'Where things stand, and what has not happened yet: hollow on a dashed line.',
          origin: 'custom',
          size: 'md',
          uses: ['primitives/timeline/Timeline.tsx', 'primitives/timeline/TimelineItem.tsx'],
          Component: TimelinePrimPending,
        },
      ],
    },
    {
      id: 'density',
      title: 'Density, groups and length',
      description: 'Rows as tight or loose as the screen needs, and long logs made short.',
      specimens: [
        {
          id: 'TimelinePrimCompact',
          title: 'Compact',
          note: 'An operator log with many one-line entries.',
          origin: 'custom',
          size: 'md',
          uses: ['primitives/timeline/Timeline.tsx', 'primitives/timeline/TimelineItem.tsx'],
          Component: TimelinePrimCompact,
        },
        {
          id: 'TimelinePrimComfortable',
          title: 'Comfortable',
          note: 'A decision log with a reason under each entry.',
          origin: 'custom',
          size: 'md',
          uses: ['primitives/timeline/Timeline.tsx', 'primitives/timeline/TimelineItem.tsx'],
          Component: TimelinePrimComfortable,
        },
        {
          id: 'TimelinePrimGrouped',
          title: 'Grouped by day',
          note: 'A heading per day with a count; the line breaks between days.',
          origin: 'custom',
          size: 'md',
          uses: ['primitives/timeline/Timeline.tsx', 'primitives/timeline/TimelineGroup.tsx', 'primitives/timeline/timelineData.ts'],
          Component: TimelinePrimGrouped,
        },
        {
          id: 'TimelinePrimCollapsed',
          title: 'Collapsible middle',
          note: 'First and latest events stay; the rest fold behind a count. Click to open.',
          origin: 'custom',
          size: 'md',
          uses: ['primitives/timeline/Timeline.tsx', 'primitives/timeline/TimelineCollapse.tsx', 'primitives/timeline/timelineData.ts'],
          Component: TimelinePrimCollapsed,
        },
        {
          id: 'TimelinePrimDurations',
          title: 'With durations',
          note: 'How long each phase took, under its time.',
          origin: 'custom',
          size: 'md',
          uses: ['primitives/timeline/Timeline.tsx', 'primitives/timeline/timelineData.ts'],
          Component: TimelinePrimDurations,
        },
        {
          id: 'TimelinePrimCards',
          title: 'Cards as content',
          note: 'Comments and field changes under an event, on a quiet surface.',
          origin: 'custom',
          size: 'md',
          uses: ['primitives/timeline/Timeline.tsx', 'primitives/timeline/TimelineItem.tsx', 'display/PersonAvatar.tsx'],
          Component: TimelinePrimCards,
        },
      ],
    },
    {
      id: 'states',
      title: 'Horizontal life cycles and states',
      description: 'The short row form, and loading and empty.',
      specimens: [
        {
          id: 'TimelinePrimHorizontalPending',
          title: 'Horizontal with pending',
          note: 'A work order life cycle: three happened, two are planned.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['primitives/timeline/Timeline.tsx', 'primitives/timeline/TimelineItem.tsx'],
          Component: TimelinePrimHorizontalPending,
        },
        {
          id: 'TimelinePrimHorizontalDurations',
          title: 'Horizontal with durations',
          note: 'Phases of a shutdown with how long each took.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/timeline/Timeline.tsx', 'primitives/timeline/TimelineItem.tsx'],
          Component: TimelinePrimHorizontalDurations,
        },
        {
          id: 'TimelinePrimLoading',
          title: 'Loading',
          note: 'Placeholders in the shape of events, on the base surface.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/timeline/TimelineSkeleton.tsx'],
          Component: TimelinePrimLoading,
        },
        {
          id: 'TimelinePrimEmpty',
          title: 'Empty',
          note: 'Say that nothing has happened yet and when events will appear.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: TimelinePrimEmpty,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'Timelines on plant screens.',
      specimens: [
        {
          id: 'TimelinePrimIncident',
          title: 'Incident timeline',
          note: 'A trip from first warning to follow-up: shapes for severity, an avatar for who acted, a pending step.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['primitives/timeline/Timeline.tsx', 'primitives/timeline/TimelineItem.tsx', 'display/PersonAvatar.tsx'],
          Component: TimelinePrimIncident,
        },
        {
          id: 'TimelinePrimWorkOrder',
          title: 'Work order life cycle',
          note: 'Where an order stands, with the planned steps still ahead.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/timeline/Timeline.tsx', 'primitives/timeline/TimelineItem.tsx'],
          Component: TimelinePrimWorkOrder,
        },
        {
          id: 'TimelinePrimActivityFeed',
          title: 'Activity feed',
          note: 'Who did what, by day, with a way to load earlier activity.',
          origin: 'custom',
          size: 'md',
          uses: ['primitives/timeline/Timeline.tsx', 'primitives/timeline/TimelineGroup.tsx', 'display/PersonAvatar.tsx'],
          Component: TimelinePrimActivityFeed,
        },
        {
          id: 'TimelinePrimShift',
          title: 'Shift events',
          note: 'Compact events grouped by hour, with the time column on the left.',
          origin: 'custom',
          size: 'md',
          uses: ['primitives/timeline/Timeline.tsx', 'primitives/timeline/TimelineGroup.tsx', 'primitives/timeline/timelineData.ts'],
          Component: TimelinePrimShift,
        },
      ],
    },
  ],
});
