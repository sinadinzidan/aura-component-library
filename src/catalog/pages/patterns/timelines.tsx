import { Badge } from '@cognite/aura/components/badge';
import { Card, CardContent, CardDescription, CardHeader, CardHeaderCenter, CardTitle } from '@cognite/aura/components/card';
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from '@cognite/aura/components/empty-state';
import {
  IconAlertTriangle,
  IconBolt,
  IconClipboardCheck,
  IconEye,
  IconFlag,
  IconLock,
  IconMessage,
  IconPlayerPlay,
  IconTimeline,
  IconTool,
  IconUserCheck,
} from '@cognite/aura/icons';

import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { DurationBars } from '../../../library/patterns/collaboration/DurationBars';
import { PropertyList } from '../../../library/patterns/structure/PropertyList';
import { SectionHeader } from '../../../library/patterns/structure/SectionHeader';
import { Step } from '../../../library/primitives/stepper/Step';
import { Stepper } from '../../../library/primitives/stepper/Stepper';
import { Timeline } from '../../../library/primitives/timeline/Timeline';
import { TimelineCollapse } from '../../../library/primitives/timeline/TimelineCollapse';
import { TimelineGroup } from '../../../library/primitives/timeline/TimelineGroup';
import { TimelineItem } from '../../../library/primitives/timeline/TimelineItem';
import { TimelineSkeleton } from '../../../library/primitives/timeline/TimelineSkeleton';
import { ALARMS, WORK_ORDERS } from '../../data/plant';
import { MINUTE, REFERENCE_NOW, formatTime } from '../../data/series';
import { definePage } from '../../types';

import source from './timelines.tsx?raw';

const TIMELINE_PATTERN_TRIP = ALARMS[0];
const TIMELINE_PATTERN_ORDER = WORK_ORDERS[0];

/** Minutes before the reference time, so every specimen tells the same 13:31–14:00 story. */
const timelinePatternAt = (minutesAgo: number) => REFERENCE_NOW - minutesAgo * MINUTE;
const timelinePatternTime = (minutesAgo: number) => formatTime(timelinePatternAt(minutesAgo));

const TIMELINE_PATTERN_ORDER_STEPS = [
  { id: 'requested', label: 'Requested', detail: `${timelinePatternTime(11)} · Ingrid Haugen` },
  { id: 'approved', label: 'Approved', detail: `${timelinePatternTime(8)} · Liv Wold` },
  { id: 'progress', label: 'In progress', detail: `${timelinePatternTime(2)} · Tomás Barros` },
  { id: 'done', label: 'Done', detail: 'Due 20:00' },
];

const TIMELINE_PATTERN_PHASES = [
  { id: 'detect', label: 'Detect', start: timelinePatternAt(29), end: timelinePatternAt(22) },
  { id: 'respond', label: 'Respond', start: timelinePatternAt(22), end: timelinePatternAt(14) },
  { id: 'isolate', label: 'Isolate', start: timelinePatternAt(14), end: timelinePatternAt(2) },
  { id: 'repair', label: 'Repair', start: timelinePatternAt(2) },
];

const TIMELINE_PATTERN_EARLIER = [
  { id: 'e1', time: '09:12', title: 'Vibration trending up, 5.2 mm/s' },
  { id: 'e2', time: '10:05', title: 'Advisory raised by condition monitoring' },
  { id: 'e3', time: '10:40', title: 'Aisha Khan opened the spectrum' },
  { id: 'e4', time: '11:20', title: 'Comment: 1× peak on the drive end' },
  { id: 'e5', time: '11:58', title: 'Balance check requested' },
  { id: 'e6', time: '12:30', title: 'Vibration 6.4 mm/s' },
  { id: 'e7', time: '13:05', title: 'Suction pressure dip, 11.2 barg' },
  { id: 'e8', time: '13:20', title: 'Anti-surge valve opened to 12%' },
];

function TimelinePatternDots() {
  return (
    <Timeline label="Alarm history">
      <TimelineItem title="Vibration high alarm raised" time={timelinePatternTime(29)} />
      <TimelineItem title="Acknowledged by Ingrid Haugen" time={timelinePatternTime(22)} />
      <TimelineItem title="Load reduced to 80%" time={timelinePatternTime(18)} />
      <TimelineItem title="Recompressor tripped" time={timelinePatternTime(14)} />
    </Timeline>
  );
}

function TimelinePatternIcons() {
  return (
    <Timeline label="Work order events">
      <TimelineItem icon={<IconAlertTriangle />} title="Alarm raised" time={timelinePatternTime(14)} />
      <TimelineItem icon={<IconTool />} title="Work order created" time={timelinePatternTime(11)} />
      <TimelineItem icon={<IconUserCheck />} title="Assigned to Tomás Barros" time={timelinePatternTime(5)} />
      <TimelineItem icon={<IconMessage />} title="Comment from Liv Wold" time={timelinePatternTime(3)} />
    </Timeline>
  );
}

function TimelinePatternTimeStart() {
  return (
    <Timeline label="Operator log" layout="time-start">
      <TimelineItem time={timelinePatternTime(29)} title="Vibration high" description="23-VT-92740 · 7.4 mm/s" />
      <TimelineItem time={timelinePatternTime(22)} title="Acknowledged" description="Ingrid Haugen" />
      <TimelineItem time={timelinePatternTime(18)} title="Load reduced" description="100% to 80%" />
      <TimelineItem time={timelinePatternTime(14)} title="Tripped" description="23-VT-92740 · 11.6 mm/s" />
    </Timeline>
  );
}

function TimelinePatternGroupedByDay() {
  return (
    <div className="w-full max-w-lg">
      <Timeline label="History of the interstage cooler" layout="time-start">
        <TimelineGroup heading="Today" meta="2 events">
          <TimelineItem time="09:05" title="Cooler outlet temperature high" description="23-TT-91141 · 40.8 °C, limit 40.0 °C" />
          <TimelineItem time="09:20" title="Acknowledged by Ingrid Haugen" />
        </TimelineGroup>
        <TimelineGroup heading="Yesterday" meta="2 events">
          <TimelineItem time="16:12" title="Tube bundle cleaning moved to week 12" description="WO-104471 · Magnus Solberg" />
          <TimelineItem time="08:30" title="Scaffolding booked" />
        </TimelineGroup>
        <TimelineGroup heading="9 Mar" meta="1 event">
          <TimelineItem time="14:45" title="Fouling factor above threshold" description="Raised by the heat exchanger monitor" />
        </TimelineGroup>
      </Timeline>
    </div>
  );
}

function TimelinePatternStates() {
  return (
    <div className="w-full max-w-lg">
      <Timeline label="Return to service">
        <TimelineItem icon={<IconLock />} title="Isolated and locked out" time={timelinePatternTime(2)} />
        <TimelineItem
          icon={<IconEye />}
          state="current"
          title="Bearing inspection"
          time="Now"
          description="Step 4 of 9 · Tomás Barros"
        />
        <TimelineItem icon={<IconClipboardCheck />} state="pending" title="Balance check" time="Tomorrow 08:00" description="Vendor on site" />
        <TimelineItem icon={<IconPlayerPlay />} state="pending" title="Restart and run-in" time="Not scheduled" />
      </Timeline>
    </div>
  );
}

function TimelinePatternMilestones() {
  return (
    <div className="w-full max-w-lg">
      <Stepper label="Turbine firmware upgrade milestones" current={2} markers="dot" labelPlacement="below" connector="dashed">
        <Step label="Scope frozen" description="14 Feb" />
        <Step label="Factory test" description="4 Mar" />
        <Step label="Outage window" description="24 Mar" />
        <Step label="Site test" description="26 Mar" />
        <Step label="Handover" description="2 Apr" />
      </Stepper>
    </div>
  );
}

function TimelinePatternStatusSteps() {
  return (
    <div className="w-full max-w-lg">
      <Stepper label={`Status of ${TIMELINE_PATTERN_ORDER.id}`} current={2} labelPlacement="below" connector="dashed">
        {TIMELINE_PATTERN_ORDER_STEPS.map((step) => (
          <Step key={step.id} label={step.label} description={step.detail} />
        ))}
      </Stepper>
    </div>
  );
}

function TimelinePatternMilestoneLate() {
  return (
    <div className="w-full max-w-lg">
      <Stepper label="Standby start test milestones" labelPlacement="below" connector="dashed">
        <Step label="Planned" description="2 Mar" state="complete" />
        <Step
          label="Test run"
          state="warning"
          description={<span className="font-medium text-warning-foreground-strong">4 d late</span>}
        />
        <Step label="Report" description="Was 10 Mar" />
        <Step label="Closed" />
      </Stepper>
    </div>
  );
}

function TimelinePatternAlarmLifeCycle() {
  return (
    <div className="w-full max-w-lg">
      <Timeline label="Life cycle of alarm alm-4809" orientation="horizontal">
        <TimelineItem title="Raised" time="12:00" tone="warning" shape="diamond" description="6.8 mm/s" />
        <TimelineItem title="Acknowledged" time="12:04" description="Ingrid Haugen" />
        <TimelineItem title="Cleared" state="pending" description="Pending" />
      </Timeline>
    </div>
  );
}

function TimelinePatternMiniTracks() {
  const orders = [
    { order: WORK_ORDERS[0], current: 2 },
    { order: WORK_ORDERS[1], current: 1 },
    { order: WORK_ORDERS[5], current: 4 },
  ];
  const stages = ['Requested', 'Approved', 'In progress', 'Done'];

  return (
    <ul aria-label="Work orders with status" className="flex w-full max-w-lg flex-col gap-4">
      {orders.map(({ order, current }) => (
        <li key={order.id} className="flex flex-col gap-2">
          <span className="flex items-baseline gap-2 text-sm">
            <span className="font-mono text-xs text-muted-foreground">{order.id}</span>
            <span className="min-w-0 truncate text-base-foreground">{order.title}</span>
          </span>
          <Stepper label={`Status of ${order.id}`} current={current} size="sm" markers="dot" labelPlacement="below" connector="dashed">
            {stages.map((stage) => (
              <Step key={stage} label={stage} />
            ))}
          </Stepper>
        </li>
      ))}
    </ul>
  );
}

function TimelinePatternDurations() {
  return (
    <div className="w-full max-w-lg">
      <DurationBars
        label="Time in each phase of the recompressor trip"
        phases={TIMELINE_PATTERN_PHASES}
        now={REFERENCE_NOW}
        scaleStart={timelinePatternTime(29)}
        scaleEnd={formatTime(REFERENCE_NOW)}
      />
    </div>
  );
}

function TimelinePatternCards() {
  return (
    <div className="w-full max-w-lg">
      <Timeline label="Work order updates">
        <TimelineItem icon={<IconTool />} title="Work order created" time={timelinePatternTime(11)}>
          <div className="flex flex-col gap-1 rounded-xl border border-default p-3">
            <span className="font-mono text-xs text-muted-foreground">{TIMELINE_PATTERN_ORDER.id}</span>
            <span className="text-sm font-medium text-base-foreground">{TIMELINE_PATTERN_ORDER.title}</span>
            <span className="text-xs text-muted-foreground">Corrective · estimated {TIMELINE_PATTERN_ORDER.estimatedHours} hours</span>
          </div>
        </TimelineItem>
        <TimelineItem icon={<IconMessage />} title="Liv Wold commented" time={timelinePatternTime(3)}>
          <div className="rounded-xl border border-default p-3 text-sm text-base-foreground">
            Restart is on hold until the balance check is signed off. Do not reset the trip.
          </div>
        </TimelineItem>
        <TimelineItem icon={<IconUserCheck />} title="Tomás Barros started work" time={timelinePatternTime(2)} />
      </Timeline>
    </div>
  );
}

function TimelinePatternTones() {
  return (
    <div className="w-full max-w-lg">
      <Timeline label="Recompressor state changes" layout="time-start">
        <TimelineItem time={timelinePatternTime(29)} tone="warning" icon={<IconAlertTriangle />} title="High alarm" description="Vibration 7.4 mm/s, limit 7.1 mm/s" />
        <TimelineItem time={timelinePatternTime(22)} title="Acknowledged" description="Ingrid Haugen" />
        <TimelineItem time={timelinePatternTime(14)} tone="critical" icon={<IconBolt />} title="Tripped" description="Vibration 11.6 mm/s, trip limit 11.0 mm/s" />
        <TimelineItem time={timelinePatternTime(2)} title="Isolated" description="Lock-out applied by Tomás Barros" />
        <TimelineItem state="pending" title="Back in service" />
      </Timeline>
    </div>
  );
}

function TimelinePatternAlternating() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <Timeline label="Recompressor 23-KA-9103, major events" layout="alternate">
        <TimelineItem icon={<IconFlag />} time="Nov 2019" title="Commissioned" description="First gas through the recompression train" />
        <TimelineItem icon={<IconTool />} time="Jun 2022" title="First major overhaul" description="Dry gas seals and both journal bearings replaced" />
        <TimelineItem icon={<IconClipboardCheck />} time="Sep 2024" title="Control system upgrade" description="Anti-surge controller moved to the new platform" />
        <TimelineItem icon={<IconBolt />} tone="critical" time="12 Mar 2026" title="Trip on high vibration" description="11.6 mm/s at the drive end" />
        <TimelineItem icon={<IconPlayerPlay />} state="pending" time="Not scheduled" title="Return to service" />
      </Timeline>
    </div>
  );
}

function TimelinePatternCompactCard() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle as="h4">Latest events</CardTitle>
          <CardDescription>Recompressor · today</CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardContent>
        <div className="w-full">
          <Timeline label="Latest recompressor events">
            <TimelineItem title="Isolated" time={timelinePatternTime(2)} />
            <TimelineItem title="Work order raised" time={timelinePatternTime(11)} />
            <TimelineItem title="Tripped" time={timelinePatternTime(14)} tone="critical" />
          </Timeline>
        </div>
      </CardContent>
    </Card>
  );
}

function TimelinePatternCollapsed() {
  return (
    <Timeline label="Events leading to the trip" layout="time-start">
      <TimelineItem time="08:40" title="Recompressor started" />
      <TimelineCollapse showLabel={(count) => `Show ${count} earlier events`} hideLabel={(count) => `Hide ${count} earlier events`}>
        {TIMELINE_PATTERN_EARLIER.map((event) => (
          <TimelineItem key={event.id} time={event.time} title={event.title} />
        ))}
      </TimelineCollapse>
      <TimelineItem time={timelinePatternTime(29)} title="Vibration high alarm" />
      <TimelineItem time={timelinePatternTime(14)} title="Tripped" tone="critical" />
    </Timeline>
  );
}

function TimelinePatternLoading() {
  return <TimelineSkeleton items={4} />;
}

function TimelinePatternEmpty() {
  return (
    <EmptyState>
      <EmptyStateIcon>
        <IconTimeline />
      </EmptyStateIcon>
      <EmptyStateTitle as="h4">No events in this period</EmptyStateTitle>
      <EmptyStateDescription>Export pump A ran without alarms or state changes for the last 7 days.</EmptyStateDescription>
    </EmptyState>
  );
}

function TimelinePatternPlanned() {
  return (
    <div className="w-full max-w-lg">
      <Timeline label="Planned work on the interstage cooler" layout="time-start">
        <TimelineItem state="pending" time="16 Mar" title="Scaffolding up" description="Contractor · 4 hours" />
        <TimelineItem state="pending" time="17 Mar" title="Isolate and drain" description="Permit PTW-2304 required" />
        <TimelineItem state="pending" time="17 Mar" title="Clean tube bundle" description="WO-104471 · 16 hours" />
        <TimelineItem state="pending" time="19 Mar" title="Pressure test and return" />
      </Timeline>
    </div>
  );
}

function TimelinePatternWithPeople() {
  const steps = [
    { id: 'a', name: 'Ingrid Haugen', personId: 'ih', text: 'requested the work order', time: timelinePatternTime(11) },
    { id: 'b', name: 'Liv Wold', personId: 'lw', text: 'approved and raised it to P1', time: timelinePatternTime(8) },
    { id: 'c', name: 'Magnus Solberg', personId: 'ms', text: 'assigned Tomás Barros', time: timelinePatternTime(5) },
    { id: 'd', name: 'Tomás Barros', personId: 'tb', text: 'started work', time: timelinePatternTime(2) },
  ];

  return (
    <div className="w-full max-w-lg">
      <Timeline label="Who did what on the work order">
        {steps.map((step) => (
          <TimelineItem
            key={step.id}
            time={step.time}
            avatar={<PersonAvatar name={step.name} colorKey={step.personId} sizes="xxsm" />}
            title={
              <>
                <span className="font-medium">{step.name}</span> {step.text}
              </>
            }
          />
        ))}
      </Timeline>
    </div>
  );
}

function TimelinePatternIncident() {
  return (
    <div className="flex w-full flex-col gap-4">
      <SectionHeader
        title={TIMELINE_PATTERN_TRIP.message}
        overline="Incident · alm-4812"
        as="h3"
        actions={<Badge variant="error">Ongoing</Badge>}
      />
      <Timeline label="Incident timeline" layout="time-start">
        <TimelineItem time={timelinePatternTime(29)} tone="warning" icon={<IconAlertTriangle />} title="Drive-end vibration high" description="23-VT-92740 reached 7.4 mm/s. Limit 7.1 mm/s." />
        <TimelineItem time={timelinePatternTime(22)} icon={<IconUserCheck />} title="Acknowledged by Ingrid Haugen" />
        <TimelineItem time={timelinePatternTime(18)} icon={<IconTool />} title="Load reduced to 80%" description="Vibration held at 7.0 mm/s for 3 minutes, then rose again." />
        <TimelineItem time={timelinePatternTime(14)} tone="critical" icon={<IconBolt />} title="Recompressor tripped" description={`${TIMELINE_PATTERN_TRIP.sensorTag} reached ${TIMELINE_PATTERN_TRIP.value}. Trip limit ${TIMELINE_PATTERN_TRIP.limit}.`} />
        <TimelineItem time={timelinePatternTime(11)} icon={<IconTool />} title={`${TIMELINE_PATTERN_ORDER.id} raised`} description={TIMELINE_PATTERN_ORDER.title} />
        <TimelineItem time={timelinePatternTime(8)} icon={<IconFlag />} title="Priority raised to P1 by Liv Wold" />
        <TimelineItem time={timelinePatternTime(2)} icon={<IconLock />} state="current" title="Isolated, inspection in progress" description="Tomás Barros on site. Step 4 of 9." />
        <TimelineItem icon={<IconClipboardCheck />} state="pending" title="Balance check" description="Vendor booked for tomorrow 08:00" />
        <TimelineItem icon={<IconPlayerPlay />} state="pending" title="Restart" />
      </Timeline>
    </div>
  );
}

function TimelinePatternIncidentSummary() {
  return (
    <div className="flex w-full flex-col gap-4">
      <PropertyList
        layout="stacked"
        items={[
          { label: 'Started', value: `12 Mar ${timelinePatternTime(29)}` },
          { label: 'Time to trip', value: '15 min' },
          { label: 'Out of service', value: '14 min so far' },
          { label: 'Production impact', value: '0.4 MSm³/d deferred' },
          { label: 'Incident lead', value: 'Liv Wold' },
        ]}
      />
    </div>
  );
}

function TimelinePatternWorkOrderLifeCycle() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle as="h4">{TIMELINE_PATTERN_ORDER.title}</CardTitle>
          <CardDescription>
            <span className="font-mono">{TIMELINE_PATTERN_ORDER.id}</span> · Life cycle
          </CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardContent>
        <div className="flex w-full flex-col gap-8">
          <Stepper label={`Status of ${TIMELINE_PATTERN_ORDER.id}`} current={3} labelPlacement="below" connector="dashed">
            <Step label="Requested" description={timelinePatternTime(11)} />
            <Step label="Approved" description={timelinePatternTime(8)} />
            <Step label="Planned" description={timelinePatternTime(5)} />
            <Step label="In progress" description={`Since ${timelinePatternTime(2)}`} />
            <Step label="Done" description="Due 20:00" />
            <Step label="Closed" />
          </Stepper>
          <div className="grid w-full gap-8 lg:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-3">
              <h5 className="text-sm font-medium text-base-foreground">Events</h5>
              <Timeline label={`Events on ${TIMELINE_PATTERN_ORDER.id}`} layout="time-start">
                <TimelineItem time={timelinePatternTime(11)} title="Requested by Ingrid Haugen" description="From alarm alm-4812" />
                <TimelineItem time={timelinePatternTime(8)} title="Approved by Liv Wold" description="Priority P2 to P1" />
                <TimelineItem time={timelinePatternTime(5)} title="Planned by Magnus Solberg" description="Assigned to Tomás Barros · 8 hours" />
                <TimelineItem time={timelinePatternTime(2)} state="current" title="Work started" description="Step 4 of 9" />
                <TimelineItem state="pending" title="Technical sign-off" description="Aisha Khan" />
              </Timeline>
            </div>
            <div className="flex min-w-0 flex-col gap-3">
              <h5 className="text-sm font-medium text-base-foreground">Time in each status</h5>
              <DurationBars
                label={`Time ${TIMELINE_PATTERN_ORDER.id} spent in each status`}
                now={REFERENCE_NOW}
                phases={[
                  { id: 'requested', label: 'Requested', start: timelinePatternAt(11), end: timelinePatternAt(8) },
                  { id: 'approved', label: 'Approved', start: timelinePatternAt(8), end: timelinePatternAt(5) },
                  { id: 'planned', label: 'Planned', start: timelinePatternAt(5), end: timelinePatternAt(2) },
                  { id: 'progress', label: 'In progress', start: timelinePatternAt(2) },
                ]}
                scaleStart={timelinePatternTime(11)}
                scaleEnd={formatTime(REFERENCE_NOW)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default definePage({
  id: 'timelines',
  title: 'Timelines',
  summary:
    'A timeline puts events on a line so order, gaps and the present are visible at a glance. Vertical for logs and histories, horizontal for a short life cycle, bars when the time between events is the point.',
  guidance: {
    use: [
      'Vertical for anything longer than six events or with detail per event.',
      'Horizontal for a fixed, short life cycle where position shows progress.',
      'Solid for what happened, a marked current step, hollow and dashed for what has not.',
      'Colour a marker only when the event is a judged state change, such as a trip.',
    ],
    avoid: [
      'A different colour per event type. Use icons for type and keep markers neutral.',
      'A timeline for unordered items. That is a list.',
      'Hiding the middle of a long history without saying how many events are folded.',
      'Alternating sides in narrow panels, where each side gets too little room.',
    ],
  },
  source,
  sections: [
    {
      id: 'vertical',
      title: 'Vertical',
      description: 'The log form: one event per row, read top to bottom.',
      specimens: [
        {
          id: 'TimelinePatternDots',
          title: 'Dots and connectors',
          note: 'The plainest history: every event is the same kind of thing.',
          origin: 'custom',
          align: 'stretch',
          uses: ['primitives/timeline/Timeline.tsx', 'primitives/timeline/TimelineItem.tsx'],
          Component: TimelinePatternDots,
        },
        {
          id: 'TimelinePatternIcons',
          title: 'Icon per event type',
          note: 'When a feed mixes alarms, work and comments and readers scan for one kind.',
          origin: 'custom',
          align: 'stretch',
          uses: ['primitives/timeline/Timeline.tsx', 'primitives/timeline/TimelineItem.tsx'],
          Component: TimelinePatternIcons,
        },
        {
          id: 'TimelinePatternTimeStart',
          title: 'Time on the left',
          note: 'Operator logs and incident reviews, where people look an event up by its time.',
          origin: 'custom',
          align: 'stretch',
          uses: ['primitives/timeline/Timeline.tsx', 'primitives/timeline/TimelineItem.tsx'],
          Component: TimelinePatternTimeStart,
        },
        {
          id: 'TimelinePatternGroupedByDay',
          title: 'Grouped by day',
          note: 'A history across days: the heading carries the date, the rows only the time.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/timeline/Timeline.tsx', 'primitives/timeline/TimelineItem.tsx', 'primitives/timeline/TimelineGroup.tsx'],
          Component: TimelinePatternGroupedByDay,
        },
        {
          id: 'TimelinePatternStates',
          title: 'Done, current and pending',
          note: 'A plan in motion: what is finished, where things stand and what is still ahead.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/timeline/Timeline.tsx', 'primitives/timeline/TimelineItem.tsx'],
          Component: TimelinePatternStates,
        },
      ],
    },
    {
      id: 'horizontal',
      title: 'Horizontal',
      description: 'A short life cycle on one row, and durations on a shared scale.',
      specimens: [
        {
          id: 'TimelinePatternMilestones',
          title: 'Milestones',
          note: 'Project dates on one line; small markers because the dates are the content.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/stepper/Stepper.tsx', 'primitives/stepper/Step.tsx'],
          Component: TimelinePatternMilestones,
        },
        {
          id: 'TimelinePatternStatusSteps',
          title: 'Status steps',
          note: 'A record moving through fixed statuses, with who moved it and when.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/stepper/Stepper.tsx', 'primitives/stepper/Step.tsx'],
          Component: TimelinePatternStatusSteps,
        },
        {
          id: 'TimelinePatternMilestoneLate',
          title: 'Late milestone',
          note: 'When the current step has slipped: the delay is written and marked on that step only.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/stepper/Stepper.tsx', 'primitives/stepper/Step.tsx'],
          Component: TimelinePatternMilestoneLate,
        },
        {
          id: 'TimelinePatternAlarmLifeCycle',
          title: 'Alarm life cycle',
          note: 'Raised, acknowledged, cleared: the existing operations timeline covers the three-step case.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/timeline/Timeline.tsx', 'primitives/timeline/TimelineItem.tsx'],
          Component: TimelinePatternAlarmLifeCycle,
        },
        {
          id: 'TimelinePatternMiniTracks',
          title: 'Status track per row',
          note: 'Comparing where several records are in the same life cycle.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/stepper/Stepper.tsx', 'primitives/stepper/Step.tsx'],
          Component: TimelinePatternMiniTracks,
        },
        {
          id: 'TimelinePatternDurations',
          title: 'Durations as bars',
          note: 'When how long each phase took matters more than the moment it started.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/DurationBars.tsx', 'patterns/collaboration/durationLayout.ts'],
          Component: TimelinePatternDurations,
        },
      ],
    },
    {
      id: 'content',
      title: 'Rich content',
      description: 'Events that carry more than a line of text.',
      specimens: [
        {
          id: 'TimelinePatternCards',
          title: 'With cards',
          note: 'Events that bring an object with them: the work order that was created, the comment that was made.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/timeline/Timeline.tsx', 'primitives/timeline/TimelineItem.tsx'],
          Component: TimelinePatternCards,
        },
        {
          id: 'TimelinePatternTones',
          title: 'Judged state changes',
          note: 'Only the alarm and the trip carry colour; everything else stays neutral so they stand out.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/timeline/Timeline.tsx', 'primitives/timeline/TimelineItem.tsx'],
          Component: TimelinePatternTones,
        },
        {
          id: 'TimelinePatternAlternating',
          title: 'Alternating sides',
          note: 'A sparse history over years on a wide page, where each event deserves some room.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['primitives/timeline/Timeline.tsx', 'primitives/timeline/TimelineItem.tsx'],
          Component: TimelinePatternAlternating,
        },
        {
          id: 'TimelinePatternCompactCard',
          title: 'Compact, in a card',
          note: 'The last three events on an asset card or a dashboard tile.',
          origin: 'custom',
          align: 'stretch',
          uses: ['primitives/timeline/Timeline.tsx', 'primitives/timeline/TimelineItem.tsx'],
          Component: TimelinePatternCompactCard,
        },
      ],
    },
    {
      id: 'length-and-states',
      title: 'Length and states',
      description: 'Long histories, plans that have not started, and the timeline with nothing to show.',
      specimens: [
        {
          id: 'TimelinePatternCollapsed',
          title: 'Collapsed middle',
          note: 'Keeps the start and the latest events in view. Press the button to unfold the rest.',
          origin: 'custom',
          align: 'stretch',
          uses: ['primitives/timeline/Timeline.tsx', 'primitives/timeline/TimelineItem.tsx', 'primitives/timeline/TimelineCollapse.tsx'],
          Component: TimelinePatternCollapsed,
        },
        {
          id: 'TimelinePatternLoading',
          title: 'Loading',
          note: 'While events load: markers and lines of text in the shape of the timeline.',
          origin: 'custom',
          align: 'stretch',
          uses: ['primitives/timeline/TimelineSkeleton.tsx'],
          Component: TimelinePatternLoading,
        },
        {
          id: 'TimelinePatternEmpty',
          title: 'Empty',
          note: 'A quiet period is information: say what was looked at and for how long.',
          origin: 'custom',
          Component: TimelinePatternEmpty,
        },
        {
          id: 'TimelinePatternPlanned',
          title: 'All in the future',
          note: 'A plan nobody has started: every step hollow, on a dashed line, with its date.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/timeline/Timeline.tsx', 'primitives/timeline/TimelineItem.tsx'],
          Component: TimelinePatternPlanned,
        },
        {
          id: 'TimelinePatternWithPeople',
          title: 'With people',
          note: 'When who acted is the point, such as an approval chain.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/timeline/Timeline.tsx', 'primitives/timeline/TimelineItem.tsx', 'display/PersonAvatar.tsx'],
          Component: TimelinePatternWithPeople,
        },
      ],
    },
    {
      id: 'blocks',
      title: 'Full blocks',
      description: 'An incident and a work order, told from start to now.',
      specimens: [
        {
          id: 'TimelinePatternIncident',
          title: 'Incident timeline',
          note: 'The review view of an ongoing incident: what led to it, where it stands and what is next.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['primitives/timeline/Timeline.tsx', 'primitives/timeline/TimelineItem.tsx', 'patterns/structure/SectionHeader.tsx'],
          Component: TimelinePatternIncident,
        },
        {
          id: 'TimelinePatternIncidentSummary',
          title: 'Incident facts',
          note: 'Beside an incident timeline: the durations and the impact people otherwise count by hand.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/structure/PropertyList.tsx'],
          Component: TimelinePatternIncidentSummary,
        },
        {
          id: 'TimelinePatternWorkOrderLifeCycle',
          title: 'Work order life cycle',
          note: 'Status track, event log and time per status together on a work order page.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: [
            'primitives/stepper/Stepper.tsx',
            'primitives/stepper/Step.tsx',
            'primitives/timeline/Timeline.tsx',
            'primitives/timeline/TimelineItem.tsx',
            'patterns/collaboration/DurationBars.tsx',
          ],
          Component: TimelinePatternWorkOrderLifeCycle,
        },
      ],
    },
  ],
});
