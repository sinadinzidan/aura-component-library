import {
  CheckboxGroup,
  CheckboxItem,
  CheckboxItemControl,
  CheckboxItemDescription,
  CheckboxItemLabel,
} from '@cognite/aura/components/checkbox';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import { useState } from 'react';

import { DashboardFrame } from '../../../library/dashboards/DashboardFrame';
import { DashboardPanel } from '../../../library/dashboards/DashboardPanel';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { StatusBadge } from '../../../library/display/StatusBadge';
import type { Tone } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { LogCategoryBadge } from '../../../library/industrial/workflows/LogCategoryBadge';
import { SignOffBlock } from '../../../library/industrial/workflows/SignOffBlock';
import type { LogCategory } from '../../../library/industrial/workflows/workflow';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { ALARMS, PLANT_KPIS, WORK_ORDERS, findAsset, findPerson } from '../../data/plant';
import { formatDate } from '../../data/series';
import { definePage } from '../../types';

import source from './shift-handover.tsx?raw';

type ShiftCrewMember = { name: string; role: string };

const SHIFT_OUTGOING: readonly ShiftCrewMember[] = [
  { name: 'Liv Wold', role: 'Shift supervisor' },
  { name: 'Ingrid Haugen', role: 'Control room operator' },
  { name: 'Tomás Barros', role: 'Mechanical technician' },
];

const SHIFT_INCOMING: readonly ShiftCrewMember[] = [
  { name: 'Sigrid Aune', role: 'Shift supervisor' },
  { name: 'Henrik Dahl', role: 'Control room operator' },
  { name: 'Jonas Nyberg', role: 'Instrument technician' },
];

const SHIFT_OPEN_ALARMS = ALARMS.filter((alarm) => alarm.state === 'active' || alarm.state === 'acknowledged');

const SHIFT_ORDERS = WORK_ORDERS.filter((order) => order.assigneeId !== null && order.status !== 'done');

type ShiftFigure = { label: string; value: number; unit?: string; decimals: number; tone: Tone; note: string };

const SHIFT_FIGURES: readonly ShiftFigure[] = [
  { label: 'Production against plan', value: (PLANT_KPIS.gasExport.value / PLANT_KPIS.gasExport.target) * 100, unit: '%', decimals: 0, tone: 'warning', note: '4.38 of 4.50 MSm³/d' },
  { label: 'Open alarms', value: SHIFT_OPEN_ALARMS.length, decimals: 0, tone: 'critical', note: '1 critical, unacknowledged' },
  { label: 'Work in progress', value: SHIFT_ORDERS.length, decimals: 0, tone: 'neutral', note: '1 waiting for parts' },
  { label: 'Permits active', value: 3, decimals: 0, tone: 'neutral', note: '1 hot work, ends 16:00' },
];

type ShiftCarryKind = 'open-item' | 'out-of-service' | 'line-up' | 'override' | 'work-order';

const SHIFT_CARRY: Record<ShiftCarryKind, { label: string; tone: Tone; shape: 'dot' | 'ring' | 'square' | 'diamond' }> = {
  'open-item': { label: 'Open item', tone: 'info', shape: 'ring' },
  'out-of-service': { label: 'Out of service', tone: 'neutral', shape: 'square' },
  'line-up': { label: 'Abnormal line-up', tone: 'warning', shape: 'diamond' },
  override: { label: 'Override', tone: 'warning', shape: 'ring' },
  'work-order': { label: 'Work order', tone: 'neutral', shape: 'dot' },
};

type ShiftEvent = {
  id: string;
  time: string;
  category: LogCategory;
  author: string;
  /** What the outgoing shift did or saw. */
  text: string;
  /** What it leaves for the incoming shift, when it leaves anything. */
  carry?: { kind: ShiftCarryKind; text: string; reference: string };
};

const SHIFT_EVENTS: readonly ShiftEvent[] = [
  {
    id: 'instruction',
    time: '06:10',
    category: 'safety',
    author: 'Liv Wold',
    text: 'Standing instruction renewed: keep 1st stage discharge temperature under 145 °C.',
    carry: { kind: 'open-item', text: 'Reduce load if the high alarm stands for 30 minutes.', reference: '23-TT-92532' },
  },
  {
    id: 'pump',
    time: '07:30',
    category: 'maintenance',
    author: 'Tomás Barros',
    text: 'Cooling water pump taken out for the transmitter replacement. Isolation in place and verified.',
    carry: { kind: 'out-of-service', text: 'Isolated under permit PTW-2291 until 13 Mar. Standby cover from the fire water ring.', reference: '40-PA-4001' },
  },
  {
    id: 'well-test',
    time: '09:15',
    category: 'operations',
    author: 'Ingrid Haugen',
    text: 'Test separator lined up to well N-4 for the weekly well test.',
    carry: { kind: 'line-up', text: 'Return to standby when the test ends at 18:00.', reference: '20-VA-1002' },
  },
  {
    id: 'flaring',
    time: '10:40',
    category: 'environment',
    author: 'Ingrid Haugen',
    text: 'Flared 12.4 kSm³ during the cooler changeover, inside the daily consent of 15. Nothing to carry over.',
  },
  {
    id: 'calibration',
    time: '11:20',
    category: 'maintenance',
    author: 'Jonas Nyberg',
    text: 'Separator level transmitter calibrated and returned to service. WO-104440 closed.',
  },
  {
    id: 'trip',
    time: '13:46',
    category: 'operations',
    author: 'Ingrid Haugen',
    text: 'Recompressor tripped on drive-end vibration. Unit isolated and depressurised; export reduced to 4.38 MSm³/d.',
    carry: { kind: 'work-order', text: 'Bearing inspection is 35% done. Do not restart before it is closed.', reference: 'WO-104482' },
  },
  {
    id: 'bypass',
    time: '13:52',
    category: 'safety',
    author: 'Liv Wold',
    text: 'Bearing temperature interlock on the recompressor bypassed for the inspection.',
    carry: { kind: 'override', text: 'The bypass expires at 18:00. Remove it or renew it with the supervisor.', reference: '23-TT-92741' },
  },
];

type ShiftCategoryFilter = 'all' | LogCategory;

const SHIFT_FILTERS: readonly { value: ShiftCategoryFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'operations', label: 'Operations' },
  { value: 'safety', label: 'Safety' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'environment', label: 'Environment' },
];

function shiftFilterOf(value: unknown): ShiftCategoryFilter {
  return SHIFT_FILTERS.find((filter) => filter.value === value)?.value ?? 'all';
}

type ShiftOpenItem = { id: string; label: string; reference: string };

const SHIFT_OPEN_ITEMS: readonly ShiftOpenItem[] = [
  { id: 'bypass', label: 'Remove or renew the interlock bypass before 18:00', reference: '23-TT-92741 · recompressor' },
  { id: 'restart', label: 'Hold the recompressor until the bearing inspection is closed', reference: 'WO-104482 · 23-KA-9103' },
  { id: 'well-test', label: 'Return the test separator to standby after the well test', reference: '20-VA-1002 · well N-4' },
  { id: 'load', label: 'Reduce load if discharge temperature high stands for 30 minutes', reference: '23-TT-92532 · 1st stage compressor' },
  { id: 'standby-test', label: 'Run the overdue standby start test on export pump B', reference: 'WO-104458 · 27-PA-2001B' },
];

type ShiftAbnormal = { tag: string; name: string; kind: ShiftCarryKind; detail: string };

const SHIFT_ABNORMAL: readonly ShiftAbnormal[] = [
  { tag: '23-KA-9103', name: 'Recompressor', kind: 'out-of-service', detail: 'Tripped 13:46, isolated and depressurised' },
  { tag: '40-PA-4001', name: 'Cooling water pump', kind: 'out-of-service', detail: 'Maintenance under PTW-2291 until 13 Mar' },
  { tag: '20-VA-1002', name: 'Test separator', kind: 'line-up', detail: 'On well N-4 until 18:00' },
  { tag: '23-TT-92741', name: 'Bearing temperature interlock', kind: 'override', detail: 'Bypassed until 18:00' },
];

function ShiftCrew({ title, crew, align }: { title: string; crew: readonly ShiftCrewMember[]; align: 'start' | 'end' }) {
  return (
    <div className={`flex min-w-0 flex-col gap-3 ${align === 'end' ? 'xl:items-end' : ''}`}>
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <ul className="flex flex-col gap-2">
        {crew.map((member) => (
          <li key={member.name} className="flex min-w-0 items-center gap-2">
            <PersonAvatar name={member.name} sizes="xsm" />
            <div className="flex min-w-0 flex-col">
              <span className="text-sm font-medium text-base-foreground">{member.name}</span>
              <span className="text-xs text-muted-foreground">{member.role}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ShiftSummaryPanel() {
  return (
    <DashboardPanel title="Day shift to evening shift" description="12 March 2026 · 06:00 to 14:00 UTC · handover at 14:00">
      <div className="grid w-full grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,3fr)_minmax(0,1fr)]">
        <ShiftCrew title="Outgoing crew" crew={SHIFT_OUTGOING} align="start" />
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
          {SHIFT_FIGURES.map((figure) => (
            <div key={figure.label} className="flex min-w-0 flex-col gap-2 border-l border-default pl-3">
              <dt className="text-xs text-muted-foreground">{figure.label}</dt>
              <dd className="flex flex-col gap-2">
                <ValueReadout value={figure.value} unit={figure.unit} decimals={figure.decimals} size="lg" tone={figure.tone} />
                <span className="text-xs tabular-nums text-muted-foreground">{figure.note}</span>
              </dd>
            </div>
          ))}
        </dl>
        <ShiftCrew title="Incoming crew" crew={SHIFT_INCOMING} align="start" />
      </div>
    </DashboardPanel>
  );
}

function ShiftFilter({ value, onChange }: { value: ShiftCategoryFilter; onChange: (value: ShiftCategoryFilter) => void }) {
  return (
    <SegmentedControl value={value} onValueChange={(next) => onChange(shiftFilterOf(next))}>
      <SegmentedControlList size="small" aria-label="Category shown on the timeline">
        {SHIFT_FILTERS.map((filter) => (
          <SegmentedControlButton key={filter.value} value={filter.value}>
            {filter.label}
          </SegmentedControlButton>
        ))}
      </SegmentedControlList>
    </SegmentedControl>
  );
}

function ShiftSpinePanel({ category }: { category: ShiftCategoryFilter }) {
  const events = SHIFT_EVENTS.filter((event) => category === 'all' || event.category === category);
  const carried = events.filter((event) => event.carry !== undefined).length;
  const row = 'grid grid-cols-[4rem_minmax(0,1fr)] gap-x-3 md:grid-cols-[minmax(0,1fr)_4rem_minmax(0,1fr)]';

  return (
    <DashboardPanel
      title="Shift timeline"
      description={`${events.length} ${events.length === 1 ? 'entry' : 'entries'} · ${carried} carried over to the evening shift`}
    >
      <div aria-hidden="true" className={`${row} hidden text-xs font-medium text-muted-foreground md:grid`}>
        <span className="text-right">Day shift did</span>
        <span className="text-center">Time</span>
        <span>Evening shift takes over</span>
      </div>
      <ol aria-label="Events of the shift, oldest first" className="flex w-full flex-col">
        {events.map((event, index) => {
          const carry = event.carry;
          const isLast = index === events.length - 1;
          return (
            <li key={event.id} className={row}>
              <div className="col-start-2 pb-3 md:col-start-1 md:row-start-1">
                <div className="flex flex-col gap-2 rounded-lg bg-base-background p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <LogCategoryBadge category={event.category} />
                    <span className="text-xs text-muted-foreground">{event.author}</span>
                  </div>
                  <p className="text-sm text-base-foreground">{event.text}</p>
                </div>
              </div>
              <div className="col-start-1 row-span-2 row-start-1 flex flex-col items-center gap-1 md:col-start-2 md:row-span-1">
                <time className="pt-3 text-xs font-medium tabular-nums text-base-foreground">{event.time}</time>
                {isLast ? null : <span aria-hidden="true" className="w-px flex-1 bg-chart-neutral-300" />}
              </div>
              <div className="col-start-2 pb-3 md:col-start-3 md:row-start-1">
                {carry ? (
                  <div className="flex flex-col gap-2 rounded-lg border border-default p-3">
                    <StatusIndicator {...SHIFT_CARRY[carry.kind]} size="sm" />
                    <p className="text-sm text-base-foreground">{carry.text}</p>
                    <p className="font-mono text-xs text-muted-foreground">{carry.reference}</p>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </DashboardPanel>
  );
}

function ShiftOpenItemsPanel({ checked, onToggle }: { checked: readonly string[]; onToggle: (id: string, checked: boolean) => void }) {
  return (
    <DashboardPanel
      title="Open items"
      description={`Carried over · ${checked.length} of ${SHIFT_OPEN_ITEMS.length} read and understood`}
    >
      <CheckboxGroup aria-label="Open items carried over to the evening shift">
        {SHIFT_OPEN_ITEMS.map((item) => (
          <CheckboxItem key={item.id}>
            <CheckboxItemControl checked={checked.includes(item.id)} onCheckedChange={(next) => onToggle(item.id, next)} />
            <CheckboxItemLabel>{item.label}</CheckboxItemLabel>
            <CheckboxItemDescription>{item.reference}</CheckboxItemDescription>
          </CheckboxItem>
        ))}
      </CheckboxGroup>
    </DashboardPanel>
  );
}

function ShiftAbnormalPanel() {
  return (
    <DashboardPanel title="Out of service and line-ups" description="Equipment not in its normal state">
      <ul className="flex w-full flex-col gap-3">
        {SHIFT_ABNORMAL.map((item) => (
          <li key={item.tag} className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <span className="text-sm text-base-foreground">{item.name}</span>
              <StatusIndicator {...SHIFT_CARRY[item.kind]} size="sm" />
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="font-mono">{item.tag}</span> · {item.detail}
            </p>
          </li>
        ))}
      </ul>
    </DashboardPanel>
  );
}

function ShiftSignOffPanel({ ready, accepted, onAccept }: { ready: boolean; accepted: boolean; onAccept: () => void }) {
  return (
    <DashboardPanel
      title="Sign-off"
      description={accepted ? 'Handover accepted at 14:00' : 'Signing as Sigrid Aune'}
      footnote={
        accepted
          ? 'The evening shift now holds the plant.'
          : ready
            ? 'All open items are ticked. The handover can be accepted.'
            : 'Tick every open item to enable the sign-off.'
      }
    >
      <SignOffBlock
        label="Sign-off, day shift to evening shift"
        signers={[
          { id: 'outgoing', role: 'Outgoing shift supervisor', name: 'Liv Wold', state: 'signed', at: '13:58' },
          { id: 'incoming', role: 'Incoming shift supervisor', name: 'Sigrid Aune', state: accepted ? 'signed' : 'pending', at: '14:00' },
          { id: 'operator', role: 'Incoming control room operator', name: 'Henrik Dahl', state: 'pending' },
        ]}
        currentSignerId="incoming"
        onSign={ready ? onAccept : undefined}
        signLabel="Accept handover"
      />
    </DashboardPanel>
  );
}

function ShiftOrdersPanel() {
  return (
    <DashboardPanel title="Work orders in progress" description="Started, waiting or planned for the evening shift">
      <table className="w-full table-fixed text-left text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th scope="col" className="pb-2 pr-3 font-medium">
              Work order
            </th>
            <th scope="col" className="w-32 pb-2 pr-3 font-medium">
              Status
            </th>
            <th scope="col" className="w-20 pb-2 pr-3 text-right font-medium">
              Progress
            </th>
            <th scope="col" className="hidden w-40 pb-2 pr-3 font-medium md:table-cell">
              Owner
            </th>
            <th scope="col" className="w-20 pb-2 text-right font-medium">
              Due
            </th>
          </tr>
        </thead>
        <tbody>
          {SHIFT_ORDERS.map((order) => (
            <tr key={order.id} className="border-t border-default align-top">
              <td className="py-2 pr-3">
                <p className="line-clamp-2 text-base-foreground">{order.title}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {order.id} · {findAsset(order.assetId)?.tag}
                </p>
              </td>
              <td className="py-2 pr-3">
                <StatusBadge status={order.status} />
              </td>
              <td className="py-2 pr-3 text-right tabular-nums text-base-foreground">{order.progress}%</td>
              <td className="hidden py-2 pr-3 text-medium-foreground md:table-cell">{findPerson(order.assigneeId)?.name}</td>
              <td className="whitespace-nowrap py-2 text-right tabular-nums text-medium-foreground">{formatDate(order.dueAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </DashboardPanel>
  );
}

/**
 * Archetype: timeline spine — the shift's events run down a central line, with what the outgoing
 * shift did hanging off the left and what the incoming shift inherits hanging off the right.
 * Dominant element: the spine.
 * Interaction: the category filter in the toolbar changes which events the spine shows; ticking
 * every open item unlocks the sign-off, and accepting it changes the handover state in the header.
 */
function ShiftDashboard() {
  const [category, setCategory] = useState<ShiftCategoryFilter>('all');
  const [checked, setChecked] = useState<readonly string[]>(['load']);
  const [accepted, setAccepted] = useState(false);
  const toggle = (id: string, next: boolean) => setChecked((current) => (next ? [...current.filter((entry) => entry !== id), id] : current.filter((entry) => entry !== id)));

  return (
    <DashboardFrame
      title="Shift handover"
      subtitle="Nordkapp control room · 12 March 2026, 14:00 UTC"
      status={
        accepted ? (
          <StatusIndicator tone="success" label="Accepted" detail="14:00" />
        ) : (
          <StatusIndicator tone="info" shape="ring" label="Awaiting acceptance" />
        )
      }
      toolbar={
        <>
          <span className="text-sm text-muted-foreground">Timeline shows</span>
          <ShiftFilter value={category} onChange={setCategory} />
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <ShiftSummaryPanel />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col [&>*]:flex-1">
            <ShiftSpinePanel category={category} />
          </div>
          <div className="flex min-w-0 flex-col gap-4 [&>*:last-child]:flex-1">
            <ShiftOpenItemsPanel checked={checked} onToggle={toggle} />
            <ShiftAbnormalPanel />
            <ShiftSignOffPanel ready={checked.length === SHIFT_OPEN_ITEMS.length} accepted={accepted} onAccept={() => setAccepted(true)} />
          </div>
        </div>
        <ShiftOrdersPanel />
      </div>
    </DashboardFrame>
  );
}

function ShiftHandoverBoardSignature() {
  return (
    <ThemeScope preset="amber-shift" className="w-full">
      <ShiftDashboard />
    </ThemeScope>
  );
}

function ShiftHandoverBoardAura() {
  return (
    <ThemeScope preset="aura" className="w-full">
      <ShiftDashboard />
    </ThemeScope>
  );
}

function ShiftHandoverBoardField() {
  return (
    <ThemeScope preset="field" className="w-full">
      <ShiftDashboard />
    </ThemeScope>
  );
}

function ShiftHandoverBoardEditorial() {
  return (
    <ThemeScope preset="editorial" className="w-full">
      <ShiftDashboard />
    </ThemeScope>
  );
}

function ShiftHandoverBoardSummary() {
  return <ShiftSummaryPanel />;
}

function ShiftHandoverBoardSpine() {
  const [category, setCategory] = useState<ShiftCategoryFilter>('all');
  return (
    <div className="flex w-full flex-col gap-3">
      <ShiftFilter value={category} onChange={setCategory} />
      <ShiftSpinePanel category={category} />
    </div>
  );
}

function ShiftHandoverBoardOpenItems() {
  const [checked, setChecked] = useState<readonly string[]>(['load', 'well-test']);
  return (
    <ShiftOpenItemsPanel
      checked={checked}
      onToggle={(id, next) => setChecked((current) => (next ? [...current, id] : current.filter((entry) => entry !== id)))}
    />
  );
}

function ShiftHandoverBoardAbnormal() {
  return <ShiftAbnormalPanel />;
}

function ShiftHandoverBoardSignOff() {
  const [accepted, setAccepted] = useState(false);
  return <ShiftSignOffPanel ready accepted={accepted} onAccept={() => setAccepted(true)} />;
}

function ShiftHandoverBoardOrders() {
  return <ShiftOrdersPanel />;
}

export default definePage({
  id: 'shift-handover',
  title: 'Shift handover',
  summary:
    'What the incoming shift must know before it takes the plant: the events of the shift in order, what each one leaves behind, the equipment that is not in its normal state, and a sign-off that only opens once every open item has been read.',
  guidance: {
    use: [
      'At the shift change, read together by the outgoing and the incoming supervisor.',
      'Tell the shift as a sequence: each event on the spine shows what was done and what it leaves.',
      'Make acceptance explicit: open items are ticked one by one before the sign-off unlocks.',
      'Filter the spine by category when one discipline reads its own part.',
    ],
    avoid: [
      'Live trends and gauges — the handover is a record of the shift, not a console.',
      'Burying carried-over items in free text; each one is its own card and its own tick.',
      'Letting the handover be accepted with unread items.',
      'More than a shift of history. Earlier events belong in the shift log.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description:
        'Shown in the Amber shift theme: warm accents on dark surfaces for the evening change. Events run down a central spine; filter them, tick the open items, then accept.',
      specimens: [
        {
          id: 'ShiftHandoverBoardSignature',
          title: 'Shift handover',
          note: 'Pick it for the shift change in a control room, where acceptance has to be explicit and recorded.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'dashboards/DashboardFrame.tsx',
            'dashboards/DashboardPanel.tsx',
            'display/PersonAvatar.tsx',
            'display/StatusBadge.tsx',
            'industrial/StatusIndicator.tsx',
            'industrial/ValueReadout.tsx',
            'industrial/workflows/LogCategoryBadge.tsx',
            'industrial/workflows/SignOffBlock.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: ShiftHandoverBoardSignature,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same handover, unchanged, in three more presets.',
      specimens: [
        {
          id: 'ShiftHandoverBoardAura',
          title: 'Aura',
          note: 'Pick it for the morning handover in daylight, or when the handover is printed and filed.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: ShiftHandoverBoardAura,
        },
        {
          id: 'ShiftHandoverBoardField',
          title: 'Field',
          note: 'Pick it when the handover is walked through on a tablet in the plant: larger targets, stronger contrast.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: ShiftHandoverBoardField,
        },
        {
          id: 'ShiftHandoverBoardEditorial',
          title: 'Editorial',
          note: 'Pick it when the handover is read as a document by management the next morning.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: ShiftHandoverBoardEditorial,
        },
      ],
    },
    {
      id: 'panels',
      title: 'Panels',
      description: 'Each part on its own, ready to drop into another dashboard.',
      specimens: [
        {
          id: 'ShiftHandoverBoardSummary',
          title: 'Shift summary',
          note: 'Pick it as the header band: who hands over to whom, and the four figures that frame the shift.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'display/PersonAvatar.tsx', 'industrial/ValueReadout.tsx'],
          Component: ShiftHandoverBoardSummary,
        },
        {
          id: 'ShiftHandoverBoardSpine',
          title: 'Timeline spine',
          note: 'Pick it when each event has a consequence: what happened on one side, what it leaves on the other.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/StatusIndicator.tsx', 'industrial/workflows/LogCategoryBadge.tsx'],
          Component: ShiftHandoverBoardSpine,
        },
        {
          id: 'ShiftHandoverBoardOpenItems',
          title: 'Open items checklist',
          note: 'Pick it when carried-over items must each be read and ticked by the person taking over.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx'],
          Component: ShiftHandoverBoardOpenItems,
        },
        {
          id: 'ShiftHandoverBoardAbnormal',
          title: 'Out of service and line-ups',
          note: 'Pick it to list everything that is not in its normal state: isolations, line-ups and overrides.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/StatusIndicator.tsx'],
          Component: ShiftHandoverBoardAbnormal,
        },
        {
          id: 'ShiftHandoverBoardSignOff',
          title: 'Sign-off',
          note: 'Pick it to close a handover or a round: one row per role, and a button only for the person signing.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'industrial/workflows/SignOffBlock.tsx'],
          Component: ShiftHandoverBoardSignOff,
        },
        {
          id: 'ShiftHandoverBoardOrders',
          title: 'Work orders in progress',
          note: 'Pick it to hand over the jobs that are open on the plant, with progress and owner.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx', 'display/StatusBadge.tsx'],
          Component: ShiftHandoverBoardOrders,
        },
      ],
    },
  ],
});
