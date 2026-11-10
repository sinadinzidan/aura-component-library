import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardHeaderCenter, CardTitle } from '@cognite/aura/components/card';
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from '@cognite/aura/components/empty-state';
import { Skeleton } from '@cognite/aura/components/skeleton';
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
import { useState } from 'react';

import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { EventTimeline } from '../../../library/industrial/operations/EventTimeline';
import { DurationBars } from '../../../library/patterns/collaboration/DurationBars';
import { MilestoneTrack } from '../../../library/patterns/collaboration/MilestoneTrack';
import type { Milestone } from '../../../library/patterns/collaboration/MilestoneTrack';
import { Timeline } from '../../../library/patterns/collaboration/Timeline';
import { TimelineGap } from '../../../library/patterns/collaboration/TimelineGap';
import { TimelineItem } from '../../../library/patterns/collaboration/TimelineItem';
import { PropertyList } from '../../../library/patterns/structure/PropertyList';
import { SectionHeader } from '../../../library/patterns/structure/SectionHeader';
import { ALARMS, WORK_ORDERS } from '../../data/plant';
import { MINUTE, REFERENCE_NOW, formatTime } from '../../data/series';
import { definePage } from '../../types';

import source from './timelines.tsx?raw';

const TIMELINE_PATTERN_TRIP = ALARMS[0];
const TIMELINE_PATTERN_ORDER = WORK_ORDERS[0];

/** Minutes before the reference time, so every specimen tells the same 13:31–14:00 story. */
const timelinePatternAt = (minutesAgo: number) => REFERENCE_NOW - minutesAgo * MINUTE;
const timelinePatternTime = (minutesAgo: number) => formatTime(timelinePatternAt(minutesAgo));

const TIMELINE_PATTERN_ORDER_STEPS: readonly Milestone[] = [
  { id: 'requested', label: 'Requested', detail: `${timelinePatternTime(11)} · Ingrid Haugen`, state: 'done' },
  { id: 'approved', label: 'Approved', detail: `${timelinePatternTime(8)} · Liv Wold`, state: 'done' },
  { id: 'progress', label: 'In progress', detail: `${timelinePatternTime(2)} · Tomás Barros`, state: 'current' },
  { id: 'done', label: 'Done', detail: 'Due 20:00', state: 'pending' },
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
      <TimelineItem marker={<IconAlertTriangle />} title="Alarm raised" time={timelinePatternTime(14)} />
      <TimelineItem marker={<IconTool />} title="Work order created" time={timelinePatternTime(11)} />
      <TimelineItem marker={<IconUserCheck />} title="Assigned to Tomás Barros" time={timelinePatternTime(5)} />
      <TimelineItem marker={<IconMessage />} title="Comment from Liv Wold" time={timelinePatternTime(3)} />
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
        <TimelineItem heading="Today" time="09:05" title="Cooler outlet temperature high" description="23-TT-91141 · 40.8 °C, limit 40.0 °C" />
        <TimelineItem time="09:20" title="Acknowledged by Ingrid Haugen" />
        <TimelineItem heading="Yesterday" time="16:12" title="Tube bundle cleaning moved to week 12" description="WO-104471 · Magnus Solberg" />
        <TimelineItem time="08:30" title="Scaffolding booked" />
        <TimelineItem heading="9 Mar" time="14:45" title="Fouling factor above threshold" description="Raised by the heat exchanger monitor" />
      </Timeline>
    </div>
  );
}

function TimelinePatternStates() {
  return (
    <div className="w-full max-w-lg">
      <Timeline label="Return to service">
        <TimelineItem marker={<IconLock />} title="Isolated and locked out" time={timelinePatternTime(2)} />
        <TimelineItem
          marker={<IconEye />}
          state="current"
          title="Bearing inspection"
          time="Now"
          description="Step 4 of 9 · Tomás Barros"
        />
        <TimelineItem marker={<IconClipboardCheck />} state="pending" title="Balance check" time="Tomorrow 08:00" description="Vendor on site" />
        <TimelineItem marker={<IconPlayerPlay />} state="pending" title="Restart and run-in" time="Not scheduled" />
      </Timeline>
    </div>
  );
}

function TimelinePatternMilestones() {
  return (
    <div className="w-full max-w-lg">
      <MilestoneTrack
        label="Turbine firmware upgrade milestones"
        markers="dot"
        milestones={[
          { id: 'scope', label: 'Scope frozen', detail: '14 Feb', state: 'done' },
          { id: 'fat', label: 'Factory test', detail: '4 Mar', state: 'done' },
          { id: 'window', label: 'Outage window', detail: '24 Mar', state: 'current' },
          { id: 'sat', label: 'Site test', detail: '26 Mar', state: 'pending' },
          { id: 'handover', label: 'Handover', detail: '2 Apr', state: 'pending' },
        ]}
      />
    </div>
  );
}

function TimelinePatternStatusSteps() {
  return (
    <div className="w-full max-w-lg">
      <MilestoneTrack label={`Status of ${TIMELINE_PATTERN_ORDER.id}`} milestones={TIMELINE_PATTERN_ORDER_STEPS} />
    </div>
  );
}

function TimelinePatternMilestoneLate() {
  return (
    <div className="w-full max-w-lg">
      <MilestoneTrack
        label="Standby start test milestones"
        milestones={[
          { id: 'planned', label: 'Planned', detail: '2 Mar', state: 'done' },
          {
            id: 'test',
            label: 'Test run',
            detail: (
              <span className="flex items-center gap-1 font-medium text-warning-foreground-strong">
                <IconAlertTriangle aria-hidden="true" className="size-3.5" />4 d late
              </span>
            ),
            state: 'current',
          },
          { id: 'report', label: 'Report', detail: 'Was 10 Mar', state: 'pending' },
          { id: 'closed', label: 'Closed', state: 'pending' },
        ]}
      />
    </div>
  );
}

function TimelinePatternAlarmLifeCycle() {
  return (
    <div className="w-full max-w-lg">
      <EventTimeline
        label="Life cycle of alarm alm-4809"
        orientation="horizontal"
        events={[
          { id: 'raised', title: 'Raised', time: '12:00', tone: 'warning', shape: 'diamond', detail: '6.8 mm/s' },
          { id: 'ack', title: 'Acknowledged', time: '12:04', detail: 'Ingrid Haugen' },
          { id: 'cleared', title: 'Cleared', pending: true },
        ]}
      />
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
          <MilestoneTrack
            label={`Status of ${order.id}`}
            markers="dot"
            milestones={stages.map((stage, index) => ({
              id: stage,
              label: stage,
              state: index < current ? 'done' : index === current ? 'current' : 'pending',
            }))}
          />
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
        <TimelineItem marker={<IconTool />} title="Work order created" time={timelinePatternTime(11)}>
          <div className="flex flex-col gap-1 rounded-xl border border-default p-3">
            <span className="font-mono text-xs text-muted-foreground">{TIMELINE_PATTERN_ORDER.id}</span>
            <span className="text-sm font-medium text-base-foreground">{TIMELINE_PATTERN_ORDER.title}</span>
            <span className="text-xs text-muted-foreground">Corrective · estimated {TIMELINE_PATTERN_ORDER.estimatedHours} hours</span>
          </div>
        </TimelineItem>
        <TimelineItem marker={<IconMessage />} title="Liv Wold commented" time={timelinePatternTime(3)}>
          <div className="rounded-xl border border-default p-3 text-sm text-base-foreground">
            Restart is on hold until the balance check is signed off. Do not reset the trip.
          </div>
        </TimelineItem>
        <TimelineItem marker={<IconUserCheck />} title="Tomás Barros started work" time={timelinePatternTime(2)} />
      </Timeline>
    </div>
  );
}

function TimelinePatternTones() {
  return (
    <div className="w-full max-w-lg">
      <Timeline label="Recompressor state changes" layout="time-start">
        <TimelineItem time={timelinePatternTime(29)} tone="warning" marker={<IconAlertTriangle />} title="High alarm" description="Vibration 7.4 mm/s, limit 7.1 mm/s" />
        <TimelineItem time={timelinePatternTime(22)} title="Acknowledged" description="Ingrid Haugen" />
        <TimelineItem time={timelinePatternTime(14)} tone="critical" marker={<IconBolt />} title="Tripped" description="Vibration 11.6 mm/s, trip limit 11.0 mm/s" />
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
        <TimelineItem marker={<IconFlag />} time="Nov 2019" title="Commissioned" description="First gas through the recompression train" />
        <TimelineItem marker={<IconTool />} time="Jun 2022" title="First major overhaul" description="Dry gas seals and both journal bearings replaced" />
        <TimelineItem marker={<IconClipboardCheck />} time="Sep 2024" title="Control system upgrade" description="Anti-surge controller moved to the new platform" />
        <TimelineItem marker={<IconBolt />} tone="critical" time="12 Mar 2026" title="Trip on high vibration" description="11.6 mm/s at the drive end" />
        <TimelineItem marker={<IconPlayerPlay />} state="pending" time="Not scheduled" title="Return to service" />
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
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex w-full flex-col gap-2">
      <Timeline label="Events leading to the trip" layout="time-start">
        <TimelineItem time="08:40" title="Recompressor started" />
        {expanded ? (
          TIMELINE_PATTERN_EARLIER.map((event) => <TimelineItem key={event.id} time={event.time} title={event.title} />)
        ) : (
          <TimelineGap count={TIMELINE_PATTERN_EARLIER.length} onExpand={() => setExpanded(true)} />
        )}
        <TimelineItem time={timelinePatternTime(29)} title="Vibration high alarm" />
        <TimelineItem time={timelinePatternTime(14)} title="Tripped" tone="critical" />
      </Timeline>
      {expanded ? (
        <div>
          <Button variant="ghost" size="sm" onClick={() => setExpanded(false)}>
            Hide earlier events
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function TimelinePatternLoading() {
  return (
    <div role="status" aria-label="Loading timeline" className="flex w-full flex-col gap-5">
      {['w-3/5', 'w-2/5', 'w-1/2', 'w-1/3'].map((width) => (
        <div key={width} className="flex items-start gap-3">
          <Skeleton className="size-6 shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col gap-2 pt-1">
            <Skeleton className={`h-3.5 ${width}`} />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
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
            title={
              <span className="flex items-center gap-2">
                <PersonAvatar name={step.name} colorKey={step.personId} sizes="xxsm" />
                <span>
                  <span className="font-medium">{step.name}</span> {step.text}
                </span>
              </span>
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
        <TimelineItem time={timelinePatternTime(29)} tone="warning" marker={<IconAlertTriangle />} title="Drive-end vibration high" description="23-VT-92740 reached 7.4 mm/s. Limit 7.1 mm/s." />
        <TimelineItem time={timelinePatternTime(22)} marker={<IconUserCheck />} title="Acknowledged by Ingrid Haugen" />
        <TimelineItem time={timelinePatternTime(18)} marker={<IconTool />} title="Load reduced to 80%" description="Vibration held at 7.0 mm/s for 3 minutes, then rose again." />
        <TimelineItem time={timelinePatternTime(14)} tone="critical" marker={<IconBolt />} title="Recompressor tripped" description={`${TIMELINE_PATTERN_TRIP.sensorTag} reached ${TIMELINE_PATTERN_TRIP.value}. Trip limit ${TIMELINE_PATTERN_TRIP.limit}.`} />
        <TimelineItem time={timelinePatternTime(11)} marker={<IconTool />} title={`${TIMELINE_PATTERN_ORDER.id} raised`} description={TIMELINE_PATTERN_ORDER.title} />
        <TimelineItem time={timelinePatternTime(8)} marker={<IconFlag />} title="Priority raised to P1 by Liv Wold" />
        <TimelineItem time={timelinePatternTime(2)} marker={<IconLock />} state="current" title="Isolated, inspection in progress" description="Tomás Barros on site. Step 4 of 9." />
        <TimelineItem marker={<IconClipboardCheck />} state="pending" title="Balance check" description="Vendor booked for tomorrow 08:00" />
        <TimelineItem marker={<IconPlayerPlay />} state="pending" title="Restart" />
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
          <MilestoneTrack
            label={`Status of ${TIMELINE_PATTERN_ORDER.id}`}
            milestones={[
              { id: 'requested', label: 'Requested', detail: timelinePatternTime(11), state: 'done' },
              { id: 'approved', label: 'Approved', detail: timelinePatternTime(8), state: 'done' },
              { id: 'planned', label: 'Planned', detail: timelinePatternTime(5), state: 'done' },
              { id: 'progress', label: 'In progress', detail: `Since ${timelinePatternTime(2)}`, state: 'current' },
              { id: 'done', label: 'Done', detail: 'Due 20:00', state: 'pending' },
              { id: 'closed', label: 'Closed', state: 'pending' },
            ]}
          />
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
          uses: ['patterns/collaboration/Timeline.tsx', 'patterns/collaboration/TimelineItem.tsx'],
          Component: TimelinePatternDots,
        },
        {
          id: 'TimelinePatternIcons',
          title: 'Icon per event type',
          note: 'When a feed mixes alarms, work and comments and readers scan for one kind.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/collaboration/Timeline.tsx', 'patterns/collaboration/TimelineItem.tsx'],
          Component: TimelinePatternIcons,
        },
        {
          id: 'TimelinePatternTimeStart',
          title: 'Time on the left',
          note: 'Operator logs and incident reviews, where people look an event up by its time.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/collaboration/Timeline.tsx', 'patterns/collaboration/TimelineItem.tsx'],
          Component: TimelinePatternTimeStart,
        },
        {
          id: 'TimelinePatternGroupedByDay',
          title: 'Grouped by day',
          note: 'A history across days: the heading carries the date, the rows only the time.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/Timeline.tsx', 'patterns/collaboration/TimelineItem.tsx'],
          Component: TimelinePatternGroupedByDay,
        },
        {
          id: 'TimelinePatternStates',
          title: 'Done, current and pending',
          note: 'A plan in motion: what is finished, where things stand and what is still ahead.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/Timeline.tsx', 'patterns/collaboration/TimelineItem.tsx'],
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
          uses: ['patterns/collaboration/MilestoneTrack.tsx'],
          Component: TimelinePatternMilestones,
        },
        {
          id: 'TimelinePatternStatusSteps',
          title: 'Status steps',
          note: 'A record moving through fixed statuses, with who moved it and when.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/MilestoneTrack.tsx'],
          Component: TimelinePatternStatusSteps,
        },
        {
          id: 'TimelinePatternMilestoneLate',
          title: 'Late milestone',
          note: 'When the current step has slipped: the delay is written and marked on that step only.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/MilestoneTrack.tsx'],
          Component: TimelinePatternMilestoneLate,
        },
        {
          id: 'TimelinePatternAlarmLifeCycle',
          title: 'Alarm life cycle',
          note: 'Raised, acknowledged, cleared: the existing operations timeline covers the three-step case.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/operations/EventTimeline.tsx'],
          Component: TimelinePatternAlarmLifeCycle,
        },
        {
          id: 'TimelinePatternMiniTracks',
          title: 'Status track per row',
          note: 'Comparing where several records are in the same life cycle.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/MilestoneTrack.tsx'],
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
          uses: ['patterns/collaboration/Timeline.tsx', 'patterns/collaboration/TimelineItem.tsx'],
          Component: TimelinePatternCards,
        },
        {
          id: 'TimelinePatternTones',
          title: 'Judged state changes',
          note: 'Only the alarm and the trip carry colour; everything else stays neutral so they stand out.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/Timeline.tsx', 'patterns/collaboration/TimelineItem.tsx'],
          Component: TimelinePatternTones,
        },
        {
          id: 'TimelinePatternAlternating',
          title: 'Alternating sides',
          note: 'A sparse history over years on a wide page, where each event deserves some room.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['patterns/collaboration/Timeline.tsx', 'patterns/collaboration/TimelineItem.tsx'],
          Component: TimelinePatternAlternating,
        },
        {
          id: 'TimelinePatternCompactCard',
          title: 'Compact, in a card',
          note: 'The last three events on an asset card or a dashboard tile.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/collaboration/Timeline.tsx', 'patterns/collaboration/TimelineItem.tsx'],
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
          uses: ['patterns/collaboration/Timeline.tsx', 'patterns/collaboration/TimelineItem.tsx', 'patterns/collaboration/TimelineGap.tsx'],
          Component: TimelinePatternCollapsed,
        },
        {
          id: 'TimelinePatternLoading',
          title: 'Loading',
          note: 'While events load: markers and lines of text in the shape of the timeline.',
          origin: 'custom',
          align: 'stretch',
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
          uses: ['patterns/collaboration/Timeline.tsx', 'patterns/collaboration/TimelineItem.tsx'],
          Component: TimelinePatternPlanned,
        },
        {
          id: 'TimelinePatternWithPeople',
          title: 'With people',
          note: 'When who acted is the point, such as an approval chain.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/Timeline.tsx', 'patterns/collaboration/TimelineItem.tsx', 'display/PersonAvatar.tsx'],
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
          uses: ['patterns/collaboration/Timeline.tsx', 'patterns/collaboration/TimelineItem.tsx', 'patterns/structure/SectionHeader.tsx'],
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
            'patterns/collaboration/MilestoneTrack.tsx',
            'patterns/collaboration/Timeline.tsx',
            'patterns/collaboration/TimelineItem.tsx',
            'patterns/collaboration/DurationBars.tsx',
          ],
          Component: TimelinePatternWorkOrderLifeCycle,
        },
      ],
    },
  ],
});
