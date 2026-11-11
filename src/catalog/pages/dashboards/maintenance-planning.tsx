import { Button } from '@cognite/aura/components/button';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import {
  IconAlertTriangle,
  IconArrowBackUp,
  IconCalendarEvent,
  IconCalendarPlus,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconCircleCheck,
  IconClipboardList,
  IconInbox,
  IconPackage,
  IconSend,
  IconTool,
  IconUsers,
} from '@cognite/aura/icons';
import { useState } from 'react';

import { AppFrame, type AppFrameNavItem } from '../../../library/kit/AppFrame';
import { Bars } from '../../../library/kit/Bars';
import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { Grid } from '../../../library/kit/Grid';
import { IconChip } from '../../../library/kit/IconChip';
import { Legend, type LegendItem } from '../../../library/kit/Legend';
import { ListRow } from '../../../library/kit/ListRow';
import { CrewTimeline, type TimelineColumn, type TimelineItem } from '../../../library/kit/maintenance-planning/CrewTimeline';
import {
  canMove,
  columnHours,
  firstFreeColumn,
  laneLoad,
  loadState,
  moveOrder,
  placeOrder,
} from '../../../library/kit/maintenance-planning/schedule';
import { Meter } from '../../../library/kit/Meter';
import { Panel } from '../../../library/kit/Panel';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import type { Tone } from '../../../library/kit/tones';
import { LookScope } from '../../../library/looks/LookScope';
import { definePage } from '../../types';

import source from './maintenance-planning.tsx?raw';

type MpType = 'corrective' | 'preventive' | 'inspection' | 'modification';

type MpOrder = TimelineItem & {
  tag: string;
  asset: string;
  type: MpType;
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  /** Why it is where it is: the planner's note. */
  note: string;
  /** Days until due; negative when overdue. */
  dueIn: number;
  /** Days the order has waited since it was raised. */
  age: number;
};

type MpCrew = { id: string; name: string; detail: string; capacity: number[] };

const MP_DAYS: TimelineColumn[] = [
  { id: 'mon', label: 'Mon 9' },
  { id: 'tue', label: 'Tue 10' },
  { id: 'wed', label: 'Wed 11' },
  { id: 'thu', label: 'Thu 12', detail: 'Today' },
  { id: 'fri', label: 'Fri 13' },
  { id: 'sat', label: 'Sat 14', quiet: true },
  { id: 'sun', label: 'Sun 15', quiet: true },
];

const MP_TODAY = 3;

const MP_CREWS: MpCrew[] = [
  { id: 'mech', name: 'Mechanical', detail: '3 technicians', capacity: [24, 24, 24, 24, 24, 8, 8] },
  { id: 'inst', name: 'Instrument', detail: '2 technicians', capacity: [16, 16, 16, 16, 16, 4, 4] },
  { id: 'rot', name: 'Rotating equipment', detail: '2 specialists', capacity: [16, 16, 16, 16, 16, 8, 8] },
  { id: 'con', name: 'Contractors', detail: 'Scaffold and insulation', capacity: [32, 32, 32, 32, 32, 0, 0] },
];

const MP_TYPE_TONE: Record<MpType, Tone> = { corrective: 'pink', preventive: 'blue', inspection: 'teal', modification: 'amber' };

const MP_TYPE_LABEL: Record<MpType, string> = {
  corrective: 'Corrective',
  preventive: 'Preventive',
  inspection: 'Inspection',
  modification: 'Modification',
};

const MP_PRIORITY_TONE: Record<MpOrder['priority'], Tone> = { P1: 'critical', P2: 'warning', P3: 'info', P4: 'neutral' };

const MP_LEGEND: LegendItem[] = [
  { label: 'Corrective', tone: 'pink' },
  { label: 'Preventive', tone: 'blue' },
  { label: 'Inspection', tone: 'teal' },
  { label: 'Modification', tone: 'amber' },
];

function mpOrder(
  id: string,
  laneId: string,
  type: MpType,
  priority: MpOrder['priority'],
  start: number | null,
  span: number,
  hours: number,
  title: string,
  tag: string,
  asset: string,
  note: string,
  dueIn: number,
  age: number,
  done = false
): MpOrder {
  return { id, laneId, type, priority, start, span, hours, title, tag, asset, note, dueIn, age, done, tone: MP_TYPE_TONE[type], flag: priority, meta: span > 1 ? `· ${hours} h · ${tag}` : `· ${hours} h` };
}

const MP_ORDERS: MpOrder[] = [
  mpOrder('WO-104502', 'mech', 'preventive', 'P3', 0, 2, 20, 'Seal oil filter change', '23-KA-9102', '2nd stage compressor', 'Filters staged at the compressor deck.', 3, 12, true),
  mpOrder('WO-104431', 'mech', 'inspection', 'P2', 2, 1, 8, 'Stroke test', '20-XV-1105', 'Inlet shutdown valve', 'Needs a 20 minute production window.', 1, 9, true),
  mpOrder('WO-104482', 'mech', 'corrective', 'P1', 3, 1, 20, 'Bearing inspection', '23-KA-9103', 'Recompressor', 'Raised after the vibration trip at 13:46. Bearing kit is on site.', 0, 0),
  mpOrder('WO-104510', 'mech', 'corrective', 'P1', 4, 1, 14, 'Coupling alignment', '23-KA-9103', 'Recompressor', 'Follows the bearing inspection; laser kit booked.', 1, 0),
  mpOrder('WO-104471', 'mech', 'preventive', 'P2', 4, 2, 16, 'Cooler bundle clean', '23-HA-9114', 'Interstage cooler', 'Waits for the scaffold; cooler outlet is running 0.8 °C high.', 4, 21),
  mpOrder('WO-104515', 'inst', 'preventive', 'P2', 0, 3, 30, 'Gas detector function test', 'NK-23', 'Gas compression', 'Twelve detectors, inhibit plan approved.', 2, 18, true),
  mpOrder('WO-104521', 'inst', 'inspection', 'P2', 3, 2, 28, 'ESD loop check', '20-XV-1105', 'Inlet shutdown valve', 'Combined with the stroke test results.', 3, 6),
  mpOrder('WO-104479', 'inst', 'corrective', 'P2', 4, 1, 3, 'Transmitter swap', '40-TT-40015', 'Cooling water pump', 'Signal lost since 05:00; spare in stores.', 1, 1),
  mpOrder('WO-104533', 'rot', 'preventive', 'P3', 0, 1, 6, 'Lube oil sampling', '23-KA-9101', '1st stage compressor', 'Quarterly sample round, lab slot Tuesday.', 5, 14, true),
  mpOrder('WO-104530', 'rot', 'inspection', 'P2', 1, 2, 24, 'Turbine borescope', '23-GT-9001', 'Compressor gas turbine', 'Hot section, 4 000 hour interval.', 2, 30, true),
  mpOrder('WO-104537', 'rot', 'corrective', 'P2', 3, 3, 30, 'Dry gas seal check', '23-KA-9101', '1st stage compressor', 'Seal vent flow is drifting up; do it while the recompressor is down.', 4, 5),
  mpOrder('WO-104544', 'con', 'corrective', 'P3', 0, 2, 44, 'Insulation repair', '27-PL-2040', 'Export line', 'Corrosion under insulation finding from February.', 6, 34, true),
  mpOrder('WO-104541', 'con', 'preventive', 'P2', 2, 2, 40, 'Scaffold for cooler', '23-HA-9114', 'Interstage cooler', 'Must stand before the bundle clean on Friday.', 2, 21),
  mpOrder('WO-104548', 'con', 'modification', 'P4', 3, 2, 36, 'Deck coating', 'NK-27', 'Gas export', 'Weather window holds until Saturday.', 9, 48),
  mpOrder('WO-104466', 'rot', 'inspection', 'P2', null, 1, 4, 'Vibration survey', '23-KA-9101', '1st stage compressor', 'Drive-end vibration is 0.3 mm/s under its limit.', 2, 3),
  mpOrder('WO-104458', 'mech', 'preventive', 'P3', null, 1, 2, 'Standby start test', '27-PA-2001B', 'Export pump B', 'Four days overdue; needs the control room to line up the pump.', -4, 34),
  mpOrder('WO-104552', 'mech', 'corrective', 'P2', null, 2, 12, 'Relief valve swap', '20-PSV-1011', 'Inlet separator', 'Certified spare arrives Wednesday.', 5, 8),
  mpOrder('WO-104419', 'rot', 'modification', 'P4', null, 2, 24, 'Control firmware upgrade', '23-GT-9001', 'Compressor gas turbine', 'Vendor engineer available from week 12.', 12, 27),
];

const MP_NAV: AppFrameNavItem[] = [
  { id: 'schedule', label: 'Schedule', icon: <IconCalendarEvent /> },
  { id: 'backlog', label: 'Backlog', icon: <IconInbox />, badge: '4' },
  { id: 'crews', label: 'Crews', icon: <IconUsers /> },
  { id: 'materials', label: 'Materials', icon: <IconPackage /> },
];

const MP_LOAD_TONE: Record<ReturnType<typeof loadState>, Tone> = { free: 'success', tight: 'warning', over: 'critical' };

function mpCrew(id: string): MpCrew {
  return MP_CREWS.find((crew) => crew.id === id) ?? MP_CREWS[0];
}

function mpWhen(order: MpOrder): string {
  if (order.start === null) return 'Not scheduled';
  const first = MP_DAYS[order.start].label;
  return order.span === 1 ? first : `${first} to ${MP_DAYS[order.start + order.span - 1].label}`;
}

function mpDue(order: MpOrder): string {
  if (order.dueIn < 0) return `Overdue ${-order.dueIn} d`;
  return order.dueIn === 0 ? 'Due today' : `Due in ${order.dueIn} d`;
}

function mpTotals(orders: readonly MpOrder[]) {
  const perDay = columnHours(orders, MP_DAYS.length);
  const capacity = MP_DAYS.map((_, day) => MP_CREWS.reduce((sum, crew) => sum + crew.capacity[day], 0));
  const columnLoad = perDay.map((planned, day) => ({ planned, capacity: capacity[day] }));
  return {
    columnLoad,
    planned: Math.round(perDay.reduce((sum, hours) => sum + hours, 0)),
    capacity: capacity.reduce((sum, hours) => sum + hours, 0),
    backlog: orders.filter((order) => order.start === null),
    overDays: MP_CREWS.reduce(
      (count, crew) => count + columnHours(orders, MP_DAYS.length, crew.id).filter((hours, day) => hours > crew.capacity[day]).length,
      0
    ),
  };
}

/** The plan a planner edits: orders, the selected one and the three moves. */
function useMpPlan(initialSelected: string | null = 'WO-104482') {
  const [orders, setOrders] = useState<MpOrder[]>(MP_ORDERS);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelected);
  const selected = orders.find((order) => order.id === selectedId) ?? null;

  return {
    orders,
    selected,
    select: setSelectedId,
    move: (id: string, delta: number) => setOrders((current) => moveOrder(current, id, delta, MP_DAYS.length)),
    unschedule: (id: string) => setOrders((current) => placeOrder(current, id, null, MP_DAYS.length)),
    schedule: (id: string) =>
      setOrders((current) => {
        const order = current.find((candidate) => candidate.id === id);
        if (!order) return current;
        return placeOrder(current, id, firstFreeColumn(current, order, mpCrew(order.laneId).capacity, MP_TODAY), MP_DAYS.length);
      }),
  };
}

type MpPlan = ReturnType<typeof useMpPlan>;

function MpTimeline({ plan, crews = MP_CREWS, histogram = true }: { plan: MpPlan; crews?: readonly MpCrew[]; histogram?: boolean }) {
  return (
    <CrewTimeline
      label="Work orders by crew, week 11"
      columns={MP_DAYS}
      lanes={crews.map((crew) => ({ id: crew.id, name: crew.name, detail: crew.detail, capacity: crew.capacity, load: laneLoad(plan.orders, crew.id, crew.capacity) }))}
      items={plan.orders}
      now={{ column: MP_TODAY, fraction: 0.58, label: '14:00' }}
      selectedId={plan.selected?.id}
      onSelect={plan.select}
      columnLoad={histogram ? mpTotals(plan.orders).columnLoad : undefined}
      laneWidth={184}
    />
  );
}

function MpFact({ label, children }: { label: string; children: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-medium-foreground">{label}</dt>
      <dd className="text-sm font-medium text-base-foreground tabular-nums">{children}</dd>
    </div>
  );
}

function MpOrderSheet({ plan }: { plan: MpPlan }) {
  const order = plan.selected;
  if (!order) {
    return (
      <div className="flex flex-1 flex-col justify-center gap-1">
        <p className="text-base font-semibold text-base-foreground">No order selected</p>
        <p className="text-sm text-medium-foreground">Pick a bar on the timeline or an order in the backlog to move it.</p>
      </div>
    );
  }
  const crew = mpCrew(order.laneId);
  const scheduled = order.start !== null;
  const earlier = canMove(order, -1, MP_DAYS.length);
  const later = canMove(order, 1, MP_DAYS.length);
  const day = order.start ?? MP_TODAY;
  const dayHours = columnHours(plan.orders, MP_DAYS.length, crew.id)[day];
  const dayState = loadState({ planned: dayHours, capacity: crew.capacity[day] });

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill tone={MP_TYPE_TONE[order.type]}>{MP_TYPE_LABEL[order.type]}</StatusPill>
        <StatusPill tone={MP_PRIORITY_TONE[order.priority]} variant="outline">
          Priority {order.priority.slice(1)}
        </StatusPill>
        {order.done ? (
          <StatusPill tone="success" icon={<IconCircleCheck />}>
            Done
          </StatusPill>
        ) : null}
        <TagId>{order.id}</TagId>
      </div>
      <div>
        <p className="text-xl font-semibold tracking-tight text-base-foreground">{order.title}</p>
        <p className="mt-0.5 text-sm text-medium-foreground">
          {order.asset} · <TagId>{order.tag}</TagId>
        </p>
      </div>
      <p className="text-sm text-base-foreground">{order.note}</p>
      <dl className="grid grid-cols-4 gap-4 border-y border-default py-3">
        <MpFact label="Crew">{crew.name}</MpFact>
        <MpFact label="When">{mpWhen(order)}</MpFact>
        <MpFact label="Work">{`${order.hours} h`}</MpFact>
        <MpFact label="Due">{mpDue(order)}</MpFact>
      </dl>
      <div className="mt-auto flex flex-col gap-2">
        {scheduled ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" disabled={!earlier} onClick={() => plan.move(order.id, -1)}>
              <IconChevronLeft /> Day earlier
            </Button>
            <Button variant="outline" size="sm" disabled={!later} onClick={() => plan.move(order.id, 1)}>
              Day later <IconChevronRight />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => plan.unschedule(order.id)}>
              <IconArrowBackUp /> Send to backlog
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => plan.schedule(order.id)}>
              <IconCalendarPlus /> Schedule in first free slot
            </Button>
          </div>
        )}
        <p className="text-sm text-medium-foreground" data-tone={MP_LOAD_TONE[dayState]}>
          {scheduled ? (
            <>
              {crew.name} on {MP_DAYS[day].label}:{' '}
              <span className="font-semibold text-(--t-ink) tabular-nums">
                {dayHours} of {crew.capacity[day]} h planned{dayState === 'over' ? ', over capacity' : ''}
              </span>
              {!earlier ? ' · already on the first day of the week' : !later ? ' · already at the end of the week' : ''}
            </>
          ) : (
            `Waiting ${order.age} days. The first slot with room for ${crew.name.toLowerCase()} is used.`
          )}
        </p>
      </div>
    </div>
  );
}

function MpBacklogCards({ plan, layout = 'rows' }: { plan: MpPlan; layout?: 'rows' | 'cards' }) {
  const backlog = plan.orders.filter((order) => order.start === null);
  if (backlog.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-default p-6 text-center">
        <p className="text-base font-semibold text-base-foreground">Backlog is empty</p>
        <p className="text-sm text-medium-foreground">Every order for this week has a crew and a day.</p>
      </div>
    );
  }
  return (
    <ul className="flex flex-1 flex-col gap-2.5">
      {backlog.map((order) => {
        const selected = plan.selected?.id === order.id;
        return (
          <li
            key={order.id}
            data-tone={MP_TYPE_TONE[order.type]}
            className={`flex flex-1 items-center gap-4 rounded-xl border border-l-4 bg-base-background px-3.5 py-2.5 ${selected ? 'border-(--t-line) ring-2 ring-(--t-line)' : 'border-default border-l-(--t-line)'}`}
          >
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => plan.select(order.id)}
              className={`min-w-0 flex-1 cursor-pointer rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-(--kit-text) ${layout === 'rows' ? 'grid grid-cols-[minmax(0,1.5fr)_minmax(0,1.1fr)_auto] items-center gap-4' : 'flex flex-col gap-0.5'}`}
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-base-foreground">{order.title}</span>
                <span className="block text-xs text-medium-foreground tabular-nums">
                  {order.asset} · {order.tag}
                </span>
              </span>
              <span className="min-w-0 text-xs tabular-nums">
                <span className="block font-semibold text-base-foreground">
                  {order.priority} · {order.hours} h
                </span>
                <span className="block text-medium-foreground">{mpCrew(order.laneId).name}</span>
              </span>
              <span className={`text-xs font-semibold whitespace-nowrap tabular-nums ${order.dueIn < 0 ? 'text-critical-foreground-strong' : 'text-medium-foreground'}`}>{mpDue(order)}</span>
            </button>
            <Button variant="outline" size="sm" aria-label={`Schedule ${order.title}`} onClick={() => plan.schedule(order.id)}>
              <IconCalendarPlus /> Schedule
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

function MpWeekSwitch() {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-medium-foreground">Planner</span>
      <span className="text-sm font-medium text-base-foreground">Magnus Solberg</span>
    </div>
  );
}

function MaintenancePlanningSignature() {
  const plan = useMpPlan();
  const [open, setOpen] = useState(true);
  const totals = mpTotals(plan.orders);
  const backlogHours = totals.backlog.reduce((sum, order) => sum + order.hours, 0);

  return (
    <LookScope look="studio">
      <AppFrame
        variant="topbar"
        brand={{ name: 'Nordkapp', detail: 'Maintenance', mark: <IconTool /> }}
        nav={MP_NAV.map((item) => (item.id === 'backlog' ? { ...item, badge: String(totals.backlog.length) } : item))}
        current="schedule"
        tools={<MpWeekSwitch />}
        title="Week 11 · 9 to 15 March"
        subtitle={`${totals.planned} of ${totals.capacity} crew hours planned, ${totals.backlog.length} orders waiting in the backlog, ${totals.overDays === 0 ? 'no crew over capacity' : `${totals.overDays} crew ${totals.overDays === 1 ? 'day' : 'days'} over capacity`}.`}
        status={
          totals.overDays > 0 ? (
            <StatusPill tone="warning" size="lg" icon={<IconAlertTriangle />}>
              {totals.overDays} crew {totals.overDays === 1 ? 'day' : 'days'} over
            </StatusPill>
          ) : (
            <StatusPill tone="success" size="lg" icon={<IconCircleCheck />}>
              Plan fits
            </StatusPill>
          )
        }
        actions={
          <Button size="sm">
            <IconSend /> Publish plan
          </Button>
        }
        padding="none"
      >
        <div className="flex min-h-[820px] flex-col">
          <div className="flex-1 px-6 pt-2 pb-6">
            <Panel title="Crew schedule" subtitle="Select an order to move it" actions={<Legend items={MP_LEGEND} />} className="h-full">
              <MpTimeline plan={plan} />
            </Panel>
          </div>
          <section aria-label="Backlog drawer" className="rounded-t-3xl border-t border-default bg-base-background shadow-[0_-18px_36px_-24px_var(--effect-shadow-xl)]">
            <header className="flex items-center gap-3 px-6 py-3">
              <IconChip tone="amber" size="sm">
                <IconInbox />
              </IconChip>
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-base-foreground">Backlog</p>
                <p className="text-sm text-medium-foreground tabular-nums">
                  {totals.backlog.length} orders waiting · {backlogHours} h of work
                </p>
              </div>
              <Button variant="ghost" size="sm" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
                {open ? <IconChevronDown /> : <IconChevronUp />} {open ? 'Hide drawer' : 'Show drawer'}
              </Button>
            </header>
            {open ? (
              <div className="grid grid-cols-12 gap-6 border-t border-default px-6 py-5">
                <div className="col-span-5 flex flex-col border-r border-default pr-6">
                  <MpOrderSheet plan={plan} />
                </div>
                <div className="col-span-7 flex flex-col">
                  <MpBacklogCards plan={plan} />
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </AppFrame>
    </LookScope>
  );
}

type MpBacklogRow = { id: string; title: string; tag: string; type: MpType; priority: MpOrder['priority']; hours: number; age: number; dueIn: number; ready: boolean };

const MP_BACKLOG_ROWS: MpBacklogRow[] = [
  { id: 'WO-104458', title: 'Standby start test, export pump B', tag: '27-PA-2001B', type: 'preventive', priority: 'P3', hours: 2, age: 34, dueIn: -4, ready: true },
  { id: 'WO-104466', title: 'Vibration survey, 1st stage compressor', tag: '23-KA-9101', type: 'inspection', priority: 'P2', hours: 4, age: 3, dueIn: 2, ready: true },
  { id: 'WO-104552', title: 'Relief valve swap, inlet separator', tag: '20-PSV-1011', type: 'corrective', priority: 'P2', hours: 12, age: 8, dueIn: 5, ready: false },
  { id: 'WO-104419', title: 'Control firmware upgrade, gas turbine', tag: '23-GT-9001', type: 'modification', priority: 'P4', hours: 24, age: 27, dueIn: 12, ready: false },
  { id: 'WO-104561', title: 'Replace flare tip pilot thermocouple', tag: '43-TT-4302', type: 'corrective', priority: 'P1', hours: 6, age: 1, dueIn: 1, ready: true },
  { id: 'WO-104388', title: 'Recoat cooling water pump baseplate', tag: '40-PA-4001', type: 'preventive', priority: 'P4', hours: 10, age: 96, dueIn: -11, ready: true },
  { id: 'WO-104570', title: 'Thickness survey, export line dead leg', tag: '27-PL-2044', type: 'inspection', priority: 'P2', hours: 8, age: 15, dueIn: 9, ready: true },
  { id: 'WO-104575', title: 'Renew test separator level bridle', tag: '20-VA-1002', type: 'modification', priority: 'P3', hours: 20, age: 41, dueIn: 20, ready: false },
];

const MP_BACKLOG_COLUMNS: DataTableColumn<MpBacklogRow>[] = [
  {
    id: 'order',
    header: 'Order',
    cell: (row) => (
      <div>
        <p className="font-medium">{row.title}</p>
        <p className="text-xs opacity-80">
          Priority {row.priority.slice(1)} · <TagId>{row.id}</TagId> · <TagId>{row.tag}</TagId>
        </p>
      </div>
    ),
    width: 'w-[46%]',
  },
  { id: 'type', header: 'Type', cell: (row) => <StatusPill tone={MP_TYPE_TONE[row.type]}>{MP_TYPE_LABEL[row.type]}</StatusPill>, nowrap: true },
  { id: 'hours', header: 'Work', cell: (row) => `${row.hours} h`, numeric: true, nowrap: true },
  {
    id: 'due',
    header: 'Due',
    cell: (row) => (row.dueIn < 0 ? <StatusPill tone="critical">Overdue {-row.dueIn} d</StatusPill> : `In ${row.dueIn} d`),
    nowrap: true,
  },
  {
    id: 'ready',
    header: 'Materials',
    cell: (row) => (row.ready ? <StatusPill tone="success" icon={<IconCircleCheck />}>Ready</StatusPill> : <StatusPill tone="neutral">Waiting</StatusPill>),
    nowrap: true,
  },
];

const MP_AGE_BUCKETS = ['Under 8 d', '8 to 30 d', '31 to 90 d', 'Over 90 d'];

function MaintenancePlanningBacklog() {
  const [filter, setFilter] = useState('all');
  const rows = MP_BACKLOG_ROWS.filter((row) => (filter === 'overdue' ? row.dueIn < 0 : filter === 'ready' ? row.ready : true)).sort(
    (a, b) => a.priority.localeCompare(b.priority) || a.dueIn - b.dueIn
  );
  const hours = rows.reduce((sum, row) => sum + row.hours, 0);

  return (
    <LookScope look="studio">
      <AppFrame
        variant="topbar"
        brand={{ name: 'Nordkapp', detail: 'Maintenance', mark: <IconTool /> }}
        nav={MP_NAV.map((item) => (item.id === 'backlog' ? { ...item, badge: '8' } : item))}
        current="backlog"
        title="Backlog triage"
        subtitle="Eight orders without a day, 86 hours of work. Two are overdue."
        actions={
          <SegmentedControl value={filter} onValueChange={(next) => setFilter(String(next))}>
            <SegmentedControlList size="small" aria-label="Backlog filter">
              <SegmentedControlButton value="all">All</SegmentedControlButton>
              <SegmentedControlButton value="overdue">Overdue</SegmentedControlButton>
              <SegmentedControlButton value="ready">Ready to schedule</SegmentedControlButton>
            </SegmentedControlList>
          </SegmentedControl>
        }
      >
        <Grid>
          <Panel
            className="col-span-8"
            padding="none"
            title="Waiting orders"
            subtitle={`${rows.length} orders · ${hours} h · highest priority first`}
            icon={
              <IconChip tone="amber">
                <IconInbox />
              </IconChip>
            }
          >
            <DataTable label="Backlog orders" columns={MP_BACKLOG_COLUMNS} rows={rows} rowKey={(row) => row.id} rowTone={(row) => MP_PRIORITY_TONE[row.priority]} flush />
          </Panel>
          <div className="col-span-4 flex flex-col gap-4">
            <Panel title="Backlog by age" subtitle="Hours of work, by order type">
              <Bars
                label="Backlog hours by age bucket and order type"
                orientation="horizontal"
                stacked
                categories={MP_AGE_BUCKETS}
                series={[
                  { id: 'corrective', label: 'Corrective', values: [6, 12, 0, 0], tone: 'pink' },
                  { id: 'preventive', label: 'Preventive', values: [0, 0, 2, 10], tone: 'blue' },
                  { id: 'inspection', label: 'Inspection', values: [4, 8, 0, 0], tone: 'teal' },
                  { id: 'modification', label: 'Modification', values: [0, 24, 20, 0], tone: 'amber' },
                ]}
                unit="h"
                height={210}
              />
            </Panel>
            <Panel title="Room next week" subtitle="Week 12, hours already planned" className="flex-1">
              <div className="flex flex-1 flex-col justify-between gap-4">
                <Meter label="Mechanical" value={74} max={120} unit="h" tone="success" hideScale />
                <Meter label="Instrument" value={78} max={80} unit="h" tone="warning" hideScale />
                <Meter label="Rotating equipment" value={40} max={80} unit="h" tone="success" hideScale />
                <Meter label="Contractors" value={96} max={160} unit="h" tone="success" hideScale />
              </div>
            </Panel>
          </div>
        </Grid>
      </AppFrame>
    </LookScope>
  );
}

const MP_HOURS: TimelineColumn[] = [
  { id: 'h07', label: '07' },
  { id: 'h08', label: '08' },
  { id: 'h09', label: '09' },
  { id: 'h10', label: '10' },
  { id: 'h11', label: '11' },
  { id: 'h12', label: '12', quiet: true },
  { id: 'h13', label: '13' },
  { id: 'h14', label: '14' },
  { id: 'h15', label: '15' },
  { id: 'h16', label: '16' },
  { id: 'h17', label: '17' },
  { id: 'h18', label: '18' },
];

const MP_DAY_JOBS: TimelineItem[] = [
  { id: 'd1', laneId: 'tb', start: 0, span: 2, hours: 2, title: 'Test report', meta: 'XV-1105', tone: 'teal', done: true },
  { id: 'd2', laneId: 'tb', start: 2, span: 3, hours: 3, title: 'Cooler isolation', meta: '23-HA-9114', tone: 'blue', done: true },
  { id: 'd3', laneId: 'tb', start: 7, span: 5, hours: 5, title: 'Bearing inspection', meta: '23-KA-9103 · P1', tone: 'pink' },
  { id: 'd4', laneId: 'jn', start: 0, span: 4, hours: 4, title: 'Gas detector tests', meta: 'NK-23 · 4 left', tone: 'blue', done: true },
  { id: 'd5', laneId: 'jn', start: 6, span: 3, hours: 3, title: 'ESD loop check', meta: '20-XV-1105', tone: 'teal' },
  { id: 'd6', laneId: 'jn', start: 9, span: 3, hours: 3, title: 'Vibration probes', meta: '23-KA-9103', tone: 'pink' },
  { id: 'd7', laneId: 'ak', start: 1, span: 4, hours: 4, title: 'Borescope review', meta: '23-GT-9001', tone: 'teal', done: true },
  { id: 'd8', laneId: 'ak', start: 7, span: 4, hours: 4, title: 'Trip diagnosis', meta: '23-KA-9103 · P1', tone: 'pink' },
  { id: 'd9', laneId: 'sc', start: 0, span: 5, hours: 20, title: 'Scaffold, cooler east side', meta: '23-HA-9114 · 4 people', tone: 'blue', done: true },
  { id: 'd10', laneId: 'sc', start: 6, span: 5, hours: 20, title: 'Deck coating, bay 2', meta: 'NK-27 · 4 people', tone: 'amber' },
];

function MaintenancePlanningDayPlan() {
  const [selectedId, setSelectedId] = useState('d3');
  const job = MP_DAY_JOBS.find((item) => item.id === selectedId) ?? MP_DAY_JOBS[0];
  const done = MP_DAY_JOBS.filter((item) => item.done).length;

  return (
    <LookScope look="studio" className="mx-auto w-full max-w-[880px]">
      <Canvas className="flex flex-col gap-4 rounded-3xl">
        <header className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-medium-foreground">Day plan · tablet</p>
            <p className="text-3xl font-semibold tracking-tight text-base-foreground">Thursday 12 March</p>
            <p className="mt-1 text-sm text-medium-foreground tabular-nums">
              {done} of {MP_DAY_JOBS.length} jobs done · next toolbox talk 15:00
            </p>
          </div>
          <StatusPill tone="critical" size="lg">
            1 priority 1 job running
          </StatusPill>
        </header>
        <Panel padding="tight">
          <CrewTimeline
            label="Jobs per technician, Thursday 12 March"
            columns={MP_HOURS}
            lanes={[
              { id: 'tb', name: 'Tomás Barros', detail: 'Mechanical' },
              { id: 'jn', name: 'Jonas Nyberg', detail: 'Instrument' },
              { id: 'ak', name: 'Aisha Khan', detail: 'Rotating' },
              { id: 'sc', name: 'Scaffold team', detail: 'Contractor' },
            ]}
            items={MP_DAY_JOBS}
            now={{ column: 7, fraction: 0, label: '14:00' }}
            selectedId={selectedId}
            onSelect={setSelectedId}
            laneWidth={132}
            barHeight={48}
          />
        </Panel>
        <div className="grid grid-cols-2 gap-4">
          <Panel title={job.title} subtitle={`${job.meta ?? ''} · ${MP_HOURS[job.start ?? 0].label}:00 to ${Number(MP_HOURS[job.start ?? 0].label) + job.span}:00`} tone={job.tone}>
            <ul>
              <ListRow leading={<IconChip tone="success" size="sm"><IconCircleCheck /></IconChip>} title="Work permit" meta="Cold work, valid until 19:00" trailing="Signed" />
              <ListRow leading={<IconChip tone="success" size="sm"><IconCircleCheck /></IconChip>} title="Isolation" meta="Locked and tagged by operations" trailing="Verified" />
              <ListRow leading={<IconChip tone="warning" size="sm"><IconPackage /></IconChip>} title="Parts" meta="Bearing kit, 2 of 3 items at the job" trailing="1 in stores" />
            </ul>
          </Panel>
          <Panel title="Hand back today" subtitle="Equipment returning to operations">
            <ul>
              <ListRow tone="success" title="Inlet shutdown valve" meta={<TagId>20-XV-1105</TagId>} trailing="09:10" />
              <ListRow tone="success" title="Gas detectors, compression" meta={<TagId>NK-23</TagId>} trailing="11:05" />
              <ListRow tone="warning" title="Recompressor" meta={<TagId>23-KA-9103</TagId>} trailing="Est. 20:00" />
            </ul>
          </Panel>
        </div>
      </Canvas>
    </LookScope>
  );
}

function MaintenancePlanningLanes() {
  const plan = useMpPlan('WO-104537');
  return (
    <LookScope look="studio">
      <Canvas>
        <Panel title="Two crews" subtitle="Bars stack when orders overlap; the load bar follows every move" actions={<Legend items={MP_LEGEND} />}>
          <MpTimeline plan={plan} crews={MP_CREWS.slice(0, 2)} histogram={false} />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function MaintenancePlanningOrderSheet() {
  const plan = useMpPlan('WO-104471');
  return (
    <LookScope look="studio">
      <Canvas>
        <Panel title="Selected order" subtitle="Reschedule with buttons, no dragging" icon={<IconChip tone="blue"><IconClipboardList /></IconChip>}>
          <MpOrderSheet plan={plan} />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function MaintenancePlanningBacklogCards() {
  const plan = useMpPlan('WO-104458');
  return (
    <LookScope look="studio">
      <Canvas>
        <Panel title="Backlog" subtitle="Schedule puts an order in the first slot with room" icon={<IconChip tone="amber"><IconInbox /></IconChip>}>
          <MpBacklogCards plan={plan} layout="cards" />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function MaintenancePlanningCrewLoad() {
  return (
    <LookScope look="studio">
      <Canvas>
        <Panel title="Crew load" subtitle="Week 11, planned against capacity" icon={<IconChip tone="teal"><IconUsers /></IconChip>}>
          <div className="flex flex-1 flex-col justify-between gap-5">
            {MP_CREWS.map((crew) => {
              const load = laneLoad(MP_ORDERS, crew.id, crew.capacity);
              return <Meter key={crew.id} label={crew.name} value={load.planned} max={load.capacity} unit="h" tone={MP_LOAD_TONE[loadState(load)]} target={{ value: load.capacity * 0.85, label: 'Tight from' }} />;
            })}
          </div>
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function MaintenancePlanningDayLoad() {
  const types: MpType[] = ['corrective', 'preventive', 'inspection', 'modification'];
  return (
    <LookScope look="studio">
      <Canvas>
        <Panel title="Hours per day" subtitle="Week 11 by order type, against weekday capacity">
          <Bars
            label="Planned hours per day by order type against capacity"
            categories={MP_DAYS.map((day) => day.label)}
            stacked
            series={types.map((type) => ({
              id: type,
              label: MP_TYPE_LABEL[type],
              tone: MP_TYPE_TONE[type],
              values: columnHours(MP_ORDERS.filter((order) => order.type === type), MP_DAYS.length),
            }))}
            unit="h"
            height={260}
            limit={{ value: 88, label: 'Weekday capacity', tone: 'neutral' }}
          />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

export default definePage({
  id: 'maintenance-planning',
  title: 'Maintenance planning',
  summary:
    'A planner’s week: work orders by crew on a timeline with load bars, a backlog drawer, and button-driven rescheduling that updates every load figure.',
  guidance: {
    use: [
      'When the question is “does the week fit?” — lead with the timeline, not with counts.',
      'Show load where the decision is made: per crew beside the lane, per day under it.',
      'Offer reschedule buttons next to the selected order so the plan works without drag and drop.',
    ],
    avoid: [
      'A row of KPI tiles above the calendar; say the totals in one sentence in the header.',
      'Colouring bars by status and type at once — type owns the colour, state gets a word or a tick.',
      'Hiding unscheduled work on another page; keep the backlog one click from the week.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'The week timeline in the studio look, with the backlog drawer open.',
      specimens: [
        {
          id: 'MaintenancePlanningSignature',
          title: 'Week schedule',
          note: 'Pick it as the planner’s home screen: select an order, move it a day, and watch crew and day load follow.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['kit/maintenance-planning/CrewTimeline.tsx', 'kit/maintenance-planning/schedule.ts', 'kit/AppFrame.tsx', 'kit/Panel.tsx', 'looks/LookScope.tsx'],
          Component: MaintenancePlanningSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Other screens',
      description: 'The backlog as a triage table, and the same timeline turned into a day plan for a tablet.',
      specimens: [
        {
          id: 'MaintenancePlanningBacklog',
          title: 'Backlog triage',
          note: 'Pick it for the weekly backlog meeting, where orders are ranked before they get a day.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['kit/DataTable.tsx', 'kit/Bars.tsx', 'kit/Meter.tsx', 'kit/AppFrame.tsx'],
          Component: MaintenancePlanningBacklog,
        },
        {
          id: 'MaintenancePlanningDayPlan',
          title: 'Day plan on a tablet',
          note: 'Pick it for the supervisor walking the site: hours instead of days, people instead of crews.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['kit/maintenance-planning/CrewTimeline.tsx', 'kit/ListRow.tsx', 'kit/Panel.tsx'],
          Component: MaintenancePlanningDayPlan,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The panels of the planner on their own.',
      specimens: [
        {
          id: 'MaintenancePlanningLanes',
          title: 'Crew lanes',
          note: 'Use the timeline alone when a page only needs to show who works on what, when.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['kit/maintenance-planning/CrewTimeline.tsx'],
          Component: MaintenancePlanningLanes,
        },
        {
          id: 'MaintenancePlanningOrderSheet',
          title: 'Order sheet',
          note: 'Use it wherever one work order is selected and can be moved.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['kit/maintenance-planning/schedule.ts', 'kit/StatusPill.tsx'],
          Component: MaintenancePlanningOrderSheet,
        },
        {
          id: 'MaintenancePlanningBacklogCards',
          title: 'Backlog cards',
          note: 'Use them for a short list of unscheduled work with one action each.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['kit/maintenance-planning/schedule.ts', 'kit/Panel.tsx'],
          Component: MaintenancePlanningBacklogCards,
        },
        {
          id: 'MaintenancePlanningCrewLoad',
          title: 'Crew load',
          note: 'Use it when capacity matters more than the individual orders.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['kit/Meter.tsx', 'kit/maintenance-planning/schedule.ts'],
          Component: MaintenancePlanningCrewLoad,
        },
        {
          id: 'MaintenancePlanningDayLoad',
          title: 'Hours per day',
          note: 'Use it to show what kind of work fills each day of the week.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['kit/Bars.tsx', 'kit/maintenance-planning/schedule.ts'],
          Component: MaintenancePlanningDayLoad,
        },
      ],
    },
  ],
});
