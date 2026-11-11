import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { Input } from '@cognite/aura/components/input';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import { Skeleton } from '@cognite/aura/components/skeleton';
import {
  IconBell,
  IconBuildingFactory2,
  IconChevronRight,
  IconDotsVertical,
  IconFilter,
  IconHistory,
  IconInbox,
  IconMenu2,
  IconPlus,
  IconSearch,
  IconSettings,
  IconShare,
  IconTool,
} from '@cognite/aura/icons';
import { useEffect, useReducer, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { DeviceFrame } from '../../../library/industrial/analytics/DeviceFrame';
import { healthStatus, severityStatus } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { IconAction } from '../../../library/patterns/collections/IconAction';
import { BottomNav } from '../../../library/templates/BottomNav';
import { ActionSheet } from '../../../library/tools/mobile/ActionSheet';
import { BottomSheet } from '../../../library/tools/mobile/BottomSheet';
import { sheetReducer } from '../../../library/tools/mobile/bottomSheet';
import { LargeTitleScreen } from '../../../library/tools/mobile/LargeTitleScreen';
import { MobileAppBar } from '../../../library/tools/mobile/MobileAppBar';
import { MobileDrawer } from '../../../library/tools/mobile/MobileDrawer';
import { MobileStack } from '../../../library/tools/mobile/MobileStack';
import { createNavState, currentEntry, navReducer, previousEntry } from '../../../library/tools/mobile/navStack';
import type { NavRoots, StackEntry } from '../../../library/tools/mobile/navStack';
import { OfflineBanner } from '../../../library/tools/mobile/OfflineBanner';
import { RefreshRow } from '../../../library/tools/mobile/RefreshRow';
import { TwoPaneLayout } from '../../../library/tools/mobile/TwoPaneLayout';
import { ALARMS, ASSETS, WORK_ORDERS, findAsset, findPerson } from '../../data/plant';
import type { Alarm, Asset, WorkOrder } from '../../data/plant';
import { DAY, REFERENCE_NOW, formatAgo, formatDateTime } from '../../data/series';
import { definePage } from '../../types';

import source from './mobile-navigation.tsx?raw';

const ACTIVE_ALARMS = ALARMS.filter((alarm) => alarm.state === 'active' || alarm.state === 'acknowledged');
const EQUIPMENT: readonly Asset[] = ASSETS.filter((asset) => asset.parentId !== null && !ASSETS.some((other) => other.parentId === asset.id));
const OPEN_ORDERS: readonly WorkOrder[] = WORK_ORDERS.filter((order) => order.status !== 'done');

/** Older orders, so the large-title list is long enough to scroll. */
const EARLIER_ORDERS: readonly WorkOrder[] = [
  { id: 'WO-104402', title: 'Replace cooling water pump coupling', assetId: '40-pa-4001', type: 'corrective', priority: 'P3', status: 'done', assigneeId: 'tb', dueAt: REFERENCE_NOW - 6 * DAY, estimatedHours: 6, progress: 100 },
  { id: 'WO-104395', title: 'Lubricate export pump bearings', assetId: '27-pa-2001a', type: 'preventive', priority: 'P4', status: 'done', assigneeId: 'tb', dueAt: REFERENCE_NOW - 8 * DAY, estimatedHours: 1, progress: 100 },
  { id: 'WO-104388', title: 'Inspect interstage cooler tubes', assetId: '23-ha-9114', type: 'inspection', priority: 'P3', status: 'done', assigneeId: 'ms', dueAt: REFERENCE_NOW - 9 * DAY, estimatedHours: 3, progress: 100 },
  { id: 'WO-104371', title: 'Calibrate suction pressure transmitter', assetId: '23-ka-9101', type: 'preventive', priority: 'P3', status: 'done', assigneeId: 'jn', dueAt: REFERENCE_NOW - 12 * DAY, estimatedHours: 2, progress: 100 },
  { id: 'WO-104360', title: 'Test emergency shutdown loop, export', assetId: '27-pa-2001a', type: 'inspection', priority: 'P2', status: 'done', assigneeId: 'jn', dueAt: REFERENCE_NOW - 14 * DAY, estimatedHours: 4, progress: 100 },
];

const ROOTS: NavRoots = {
  alarms: { screen: 'alarms', title: 'Alarms' },
  work: { screen: 'orders', title: 'Work orders' },
  assets: { screen: 'assets', title: 'Assets' },
};

const TAB_ITEMS = [
  { id: 'alarms', label: 'Alarms', icon: <IconBell />, count: ACTIVE_ALARMS.length },
  { id: 'work', label: 'Work', icon: <IconTool /> },
  { id: 'assets', label: 'Assets', icon: <IconBuildingFactory2 /> },
] as const;

const PRIORITY_TEXT: Record<WorkOrder['priority'], string> = { P1: 'Urgent', P2: 'High', P3: 'Normal', P4: 'Low' };
const STATUS_TEXT: Record<WorkOrder['status'], string> = { open: 'Open', planned: 'Planned', 'in-progress': 'In progress', waiting: 'Waiting', done: 'Done' };

type RowProps = { title: string; detail?: string; mono?: string; trailing?: ReactNode; onOpen?: () => void };

/** A list row at touch size: title, a line of detail, something on the right, a chevron when it opens. */
function MobileNavRow({ title, detail, mono, trailing, onOpen }: RowProps) {
  const content = (
    <>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
        <span className="truncate text-sm font-medium text-base-foreground">{title}</span>
        {detail || mono ? (
          <span className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
            {mono ? <span className="shrink-0 font-mono">{mono}</span> : null}
            {detail ? <span className="truncate">{detail}</span> : null}
          </span>
        ) : null}
      </span>
      {trailing ? <span className="shrink-0">{trailing}</span> : null}
      {onOpen ? <IconChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" /> : null}
    </>
  );
  return onOpen ? (
    <button type="button" onClick={onOpen} className="flex min-h-14 w-full items-center gap-3 border-b border-default px-4 py-2 outline-none focus-visible:shadow-focus-ring">
      {content}
    </button>
  ) : (
    <div className="flex min-h-14 w-full items-center gap-3 border-b border-default px-4 py-2">{content}</div>
  );
}

function orderRows(orders: readonly WorkOrder[], onOpen?: (order: WorkOrder) => void) {
  return orders.map((order) => (
    <MobileNavRow key={order.id} title={order.title} mono={order.id} detail={`${PRIORITY_TEXT[order.priority]} · ${STATUS_TEXT[order.status]}`} onOpen={onOpen ? () => onOpen(order) : undefined} />
  ));
}

function alarmRows(alarms: readonly Alarm[]) {
  return alarms.map((alarm) => (
    <MobileNavRow key={alarm.id} title={alarm.message} mono={alarm.sensorTag} detail={formatAgo(alarm.raisedAt)} trailing={<StatusIndicator {...severityStatus(alarm.severity)} size="sm" />} />
  ));
}

function assetRows(assets: readonly Asset[], onOpen?: (asset: Asset) => void) {
  return assets.map((asset) => (
    <MobileNavRow key={asset.id} title={asset.name} mono={asset.tag} trailing={<StatusIndicator {...healthStatus(asset.health)} size="sm" />} onOpen={onOpen ? () => onOpen(asset) : undefined} />
  ));
}

function DetailFields({ rows }: { rows: readonly { label: string; value: string; mono?: boolean }[] }) {
  return (
    <dl className="flex flex-col px-4">
      {rows.map((row) => (
        <div key={row.label} className="flex items-baseline justify-between gap-4 border-b border-default py-3 text-sm">
          <dt className="text-muted-foreground">{row.label}</dt>
          <dd className={`min-w-0 text-right text-base-foreground ${row.mono ? 'font-mono text-xs' : ''}`}>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function orderDetailRows(order: WorkOrder) {
  const asset = findAsset(order.assetId);
  const person = findPerson(order.assigneeId);
  return [
    { label: 'Priority', value: `${order.priority} · ${PRIORITY_TEXT[order.priority]}` },
    { label: 'Status', value: STATUS_TEXT[order.status] },
    { label: 'Asset', value: asset ? asset.tag : order.assetId, mono: true },
    { label: 'Assigned to', value: person ? person.name : 'Unassigned' },
    { label: 'Due', value: formatDateTime(order.dueAt) },
    { label: 'Estimate', value: `${order.estimatedHours} h` },
  ];
}

function assetDetailRows(asset: Asset) {
  return [
    { label: 'Tag', value: asset.tag, mono: true },
    { label: 'Type', value: asset.type.charAt(0).toUpperCase() + asset.type.slice(1) },
    { label: 'Health score', value: String(asset.healthScore) },
    { label: 'Criticality', value: asset.criticality },
  ];
}

function PhoneBody({ children }: { children: ReactNode }) {
  return <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>;
}

function Phone({ label, children, footer, header, connection }: { label: string; children: ReactNode; footer?: ReactNode; header?: ReactNode; connection?: 'online' | 'offline' }) {
  return (
    <DeviceFrame label={label} className="h-160" footer={footer} header={header} connection={connection}>
      <PhoneBody>{children}</PhoneBody>
    </DeviceFrame>
  );
}

function stackScreen(entry: StackEntry, go: { push: (screen: string, title: string, params?: Record<string, string>) => void; back: () => void; backLabel?: string }) {
  if (entry.screen === 'order') {
    const order = WORK_ORDERS.find((candidate) => candidate.id === entry.params?.id);
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <MobileAppBar title={entry.title} backLabel={go.backLabel} onBack={go.back} />
        <div className="min-h-0 flex-1 overflow-y-auto">
          {order ? (
            <>
              <h3 className="px-4 pb-2 pt-1 text-base font-semibold text-base-foreground">{order.title}</h3>
              <DetailFields rows={orderDetailRows(order)} />
              <div className="p-4">
                <Button variant="secondary" className="w-full" onClick={() => go.push('asset', findAsset(order.assetId)?.tag ?? 'Asset', { id: order.assetId })}>
                  Open asset
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    );
  }
  if (entry.screen === 'asset') {
    const asset = findAsset(entry.params?.id ?? '');
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <MobileAppBar title={entry.title} backLabel={go.backLabel} onBack={go.back} />
        <div className="min-h-0 flex-1 overflow-y-auto">
          {asset ? (
            <>
              <h3 className="px-4 pb-2 pt-1 text-base font-semibold text-base-foreground">{asset.name}</h3>
              <DetailFields rows={assetDetailRows(asset)} />
            </>
          ) : null}
        </div>
      </div>
    );
  }
  return null;
}

function useStackApp(activeTab = 'work') {
  const [state, dispatch] = useReducer((current: ReturnType<typeof createNavState>, action: Parameters<typeof navReducer>[1]) => navReducer(current, action, ROOTS), undefined, () => createNavState(ROOTS, activeTab));
  const entry = currentEntry(state);
  const previous = previousEntry(state);
  const go = {
    push: (screen: string, title: string, params?: Record<string, string>) => dispatch({ type: 'push', screen, title, params }),
    back: () => dispatch({ type: 'pop' }),
    backLabel: previous ? `Back to ${previous.title}` : 'Back',
  };
  return { state, dispatch, entry, go, previous };
}

function rootScreen(entry: StackEntry, go: ReturnType<typeof useStackApp>['go']) {
  const title = entry.title;
  const list = entry.screen === 'alarms' ? alarmRows(ACTIVE_ALARMS) : entry.screen === 'assets' ? assetRows(EQUIPMENT, (asset) => go.push('asset', asset.tag, { id: asset.id })) : orderRows(OPEN_ORDERS, (order) => go.push('order', order.id, { id: order.id }));
  return (
    <LargeTitleScreen title={title}>
      <div className="flex flex-col">{list}</div>
    </LargeTitleScreen>
  );
}

function MobileNavTabApp() {
  const { state, dispatch, entry, go } = useStackApp('work');
  if (!entry) return null;
  return (
    <Phone
      label="Plant companion with a tab bar"
      footer={<BottomNav label="Main" items={TAB_ITEMS} activeId={state.activeTab} onSelect={(tab) => dispatch({ type: 'selectTab', tab })} />}
    >
      <MobileStack entry={entry} direction={state.direction} render={(current) => stackScreen(current, go) ?? rootScreen(current, go)} />
    </Phone>
  );
}

function MobileNavStack() {
  const { state, dispatch, entry, go } = useStackApp('work');
  if (!entry) return null;
  const depth = state.stacks[state.activeTab].length;
  return (
    <Phone label="Navigation stack, three levels deep">
      <MobileStack entry={entry} direction={state.direction} render={(current) => stackScreen(current, go) ?? rootScreen(current, go)} />
      <div className="flex items-center justify-between gap-2 border-t border-default px-4 py-2 text-xs text-muted-foreground">
        <span aria-live="polite">Screen {depth} of the stack</span>
        <Button variant="ghost" size="sm" disabled={depth < 2} onClick={() => dispatch({ type: 'popToRoot' })}>
          Back to start
        </Button>
      </div>
    </Phone>
  );
}

function MobileNavFlow() {
  const FLOW: NavRoots = { flow: { screen: 'choose', title: 'Report a problem' } };
  const [state, dispatch] = useReducer((current: ReturnType<typeof createNavState>, action: Parameters<typeof navReducer>[1]) => navReducer(current, action, FLOW), undefined, () => createNavState(FLOW, 'flow'));
  const [assetId, setAssetId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const entry = currentEntry(state);
  const previous = previousEntry(state);
  if (!entry) return null;
  const asset = findAsset(assetId ?? '');
  const back = (
    <MobileAppBar title={entry.title} backLabel={previous ? `Back to ${previous.title}` : undefined} onBack={previous ? () => dispatch({ type: 'pop' }) : undefined} />
  );
  return (
    <Phone label="Report a problem, three screens">
      <MobileStack
        entry={entry}
        direction={state.direction}
        render={(current) => {
          if (current.screen === 'choose') {
            return (
              <div className="flex min-h-0 flex-1 flex-col">
                {back}
                <p className="px-4 pb-2 text-sm text-medium-foreground">Which asset has the problem?</p>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  {assetRows(EQUIPMENT.slice(0, 7), (picked) => {
                    setAssetId(picked.id);
                    dispatch({ type: 'push', screen: 'describe', title: 'Describe it' });
                  })}
                </div>
              </div>
            );
          }
          if (current.screen === 'describe') {
            return (
              <div className="flex min-h-0 flex-1 flex-col">
                {back}
                <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 py-2">
                  <p className="text-sm text-medium-foreground">
                    <span className="font-mono text-xs">{asset?.tag}</span> {asset?.name}
                  </p>
                  <label htmlFor="mobile-nav-note" className="text-xs text-muted-foreground">
                    What did you see?
                  </label>
                  <Input id="mobile-nav-note" value={note} placeholder="Oil mist from the drive-end seal" onChange={(event) => setNote(event.target.value)} />
                </div>
                <div className="border-t border-default p-3">
                  <Button className="w-full" size="lg" disabled={note.trim() === ''} onClick={() => dispatch({ type: 'push', screen: 'confirm', title: 'Check and send' })}>
                    Continue
                  </Button>
                  {note.trim() === '' ? <p className="pt-2 text-center text-xs text-muted-foreground">Describe the problem to continue.</p> : null}
                </div>
              </div>
            );
          }
          return (
            <div className="flex min-h-0 flex-1 flex-col">
              {back}
              <DetailFields rows={[{ label: 'Asset', value: asset?.tag ?? '', mono: true }, { label: 'Problem', value: note.trim() }, { label: 'Reported by', value: 'Tomás Barros' }]} />
              <div className="mt-auto flex flex-col gap-2 border-t border-default p-3">
                <Button size="lg" className="w-full" onClick={() => dispatch({ type: 'reset' })}>
                  Send report
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => dispatch({ type: 'popToRoot' })}>
                  Start over
                </Button>
              </div>
            </div>
          );
        }}
      />
    </Phone>
  );
}

function MobileNavAppBar() {
  const [pressed, setPressed] = useState<string | null>(null);
  const order = OPEN_ORDERS[0];
  return (
    <Phone label="Top app bar with back and two actions">
      <MobileAppBar
        title={order.id}
        subtitle={findAsset(order.assetId)?.tag}
        backLabel="Back to Work orders"
        onBack={() => setPressed('Back')}
        actions={[
          { id: 'share', label: 'Share work order', icon: <IconShare />, onClick: () => setPressed('Share') },
          { id: 'more', label: 'More actions', icon: <IconDotsVertical />, onClick: () => setPressed('More') },
        ]}
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <h3 className="px-4 pb-2 pt-1 text-base font-semibold text-base-foreground">{order.title}</h3>
        <DetailFields rows={orderDetailRows(order)} />
      </div>
      <p aria-live="polite" className="border-t border-default px-4 py-2 text-xs text-muted-foreground">
        {pressed ? `${pressed} pressed.` : 'Every icon has a name and a tooltip.'}
      </p>
    </Phone>
  );
}

function MobileNavLargeTitle() {
  return (
    <Phone label="Large title that collapses on scroll">
      <LargeTitleScreen title="Work orders" actions={<IconAction label="Search work orders" size="icon"><IconSearch /></IconAction>}>
        <div className="flex flex-col">{orderRows([...WORK_ORDERS, ...EARLIER_ORDERS])}</div>
      </LargeTitleScreen>
    </Phone>
  );
}

function MobileNavSegmentedTabs() {
  const [view, setView] = useState('open');
  const orders = view === 'open' ? OPEN_ORDERS.filter((order) => order.status === 'open' || order.status === 'in-progress') : view === 'planned' ? OPEN_ORDERS.filter((order) => order.status === 'planned' || order.status === 'waiting') : WORK_ORDERS.filter((order) => order.status === 'done');
  return (
    <Phone label="Segmented tabs at the top of a list">
      <MobileAppBar title="Work orders" />
      <div className="px-4 pb-3">
        <SegmentedControl value={view} onValueChange={(value) => setView(String(value))}>
          <SegmentedControlList aria-label="Work order state" className="w-full">
            <SegmentedControlButton value="open" tabContent="label-only">
              Open
            </SegmentedControlButton>
            <SegmentedControlButton value="planned" tabContent="label-only">
              Planned
            </SegmentedControlButton>
            <SegmentedControlButton value="done" tabContent="label-only">
              Done
            </SegmentedControlButton>
          </SegmentedControlList>
        </SegmentedControl>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{orderRows(orders)}</div>
    </Phone>
  );
}

function MobileNavBottomSheet() {
  const [snap, dispatch] = useReducer(sheetReducer, 'closed');
  const [priority, setPriority] = useState('all');
  const shown = priority === 'all' ? OPEN_ORDERS : OPEN_ORDERS.filter((order) => order.priority === priority);
  return (
    <Phone label="Bottom sheet that opens at half height">
      <MobileAppBar title="Work orders" actions={[{ id: 'filter', label: 'Filter work orders', icon: <IconFilter />, onClick: () => dispatch({ type: 'open' }) }]} />
      <p className="px-4 pb-2 text-xs tabular-nums text-muted-foreground">
        {shown.length} {shown.length === 1 ? 'order' : 'orders'}
        {priority === 'all' ? '' : `, priority ${priority}`}
      </p>
      <div className="min-h-0 flex-1 overflow-y-auto">{orderRows(shown)}</div>
      <BottomSheet
        snap={snap}
        title="Filter work orders"
        onSnapChange={(next) => dispatch({ type: 'snapTo', snap: next })}
        footer={
          <Button size="lg" className="w-full" onClick={() => dispatch({ type: 'close' })}>
            Show {shown.length} {shown.length === 1 ? 'order' : 'orders'}
          </Button>
        }
      >
        <fieldset className="flex flex-col gap-1">
          <legend className="pb-2 text-xs text-muted-foreground">Priority</legend>
          {['all', 'P1', 'P2', 'P3'].map((value) => (
            <label key={value} className="flex min-h-12 items-center gap-3 text-sm text-base-foreground">
              <input type="radio" name="mobile-nav-priority" checked={priority === value} onChange={() => setPriority(value)} className="size-4" />
              {value === 'all' ? 'All priorities' : `${value} · ${PRIORITY_TEXT[value as WorkOrder['priority']]}`}
            </label>
          ))}
        </fieldset>
        <p className="pt-3 text-xs text-muted-foreground">Drag the handle, or use Up and Down on it. Down from half closes the sheet.</p>
      </BottomSheet>
    </Phone>
  );
}

function MobileNavActionSheet() {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const order = OPEN_ORDERS[1];
  return (
    <Phone label="Action sheet for one work order">
      <MobileAppBar title="Work orders" />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <MobileNavRow title={order.title} mono={order.id} detail={`${PRIORITY_TEXT[order.priority]} · ${STATUS_TEXT[order.status]}`} trailing={<IconAction label={`Actions for ${order.id}`} size="icon" onClick={() => setOpen(true)}><IconDotsVertical /></IconAction>} />
        {orderRows(OPEN_ORDERS.slice(2, 5))}
      </div>
      <p aria-live="polite" className="border-t border-default px-4 py-2 text-xs text-muted-foreground">
        {done ?? 'Open the actions on the first row.'}
      </p>
      <ActionSheet
        open={open}
        onClose={() => setOpen(false)}
        title={order.id}
        actions={[
          { id: 'assign', label: 'Assign to me', onSelect: () => setDone('Assigned to you.') },
          { id: 'share', label: 'Share link', onSelect: () => setDone('Link copied.') },
          { id: 'cancel-order', label: 'Cancel work order', destructive: true, onSelect: () => setDone('Work order cancelled.') },
        ]}
      />
    </Phone>
  );
}

function MobileNavDrawer() {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState('work');
  const names: Record<string, string> = { work: 'Work orders', alarms: 'Alarms', assets: 'Assets', history: 'History', settings: 'Settings' };
  return (
    <Phone label="Drawer menu">
      <MobileAppBar title={names[section]} leading={<IconAction label="Open menu" size="icon" onClick={() => setOpen(true)}><IconMenu2 /></IconAction>} />
      <div className="min-h-0 flex-1 overflow-y-auto">{section === 'alarms' ? alarmRows(ACTIVE_ALARMS) : section === 'assets' ? assetRows(EQUIPMENT) : section === 'work' ? orderRows(OPEN_ORDERS) : <p className="px-4 py-6 text-sm text-muted-foreground">Nothing here in this demo.</p>}</div>
      <MobileDrawer
        open={open}
        onClose={() => setOpen(false)}
        label="Main menu"
        activeId={section}
        onSelect={setSection}
        header={
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-semibold text-base-foreground">Nordkapp plant</p>
            <p className="text-xs text-muted-foreground">Tomás Barros</p>
          </div>
        }
        items={[
          { id: 'work', label: 'Work orders', icon: <IconTool />, detail: String(OPEN_ORDERS.length) },
          { id: 'alarms', label: 'Alarms', icon: <IconBell />, detail: String(ACTIVE_ALARMS.length) },
          { id: 'assets', label: 'Assets', icon: <IconBuildingFactory2 /> },
          { id: 'history', label: 'History', icon: <IconHistory /> },
          { id: 'settings', label: 'Settings', icon: <IconSettings /> },
        ]}
      />
    </Phone>
  );
}

function MobileNavFab() {
  const [created, setCreated] = useState(0);
  return (
    <Phone label="List with a floating action button">
      <MobileAppBar title="Work orders" />
      <div className="min-h-0 flex-1 overflow-y-auto pb-20">{orderRows(OPEN_ORDERS)}</div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-end gap-2 p-4">
        <p aria-live="polite" className="pointer-events-auto rounded-lg bg-medium-background px-3 py-1 text-xs tabular-nums text-medium-foreground">
          {created === 0 ? 'No new work orders yet' : `${created} draft ${created === 1 ? 'order' : 'orders'} started`}
        </p>
        <Button size="lg" className="pointer-events-auto" onClick={() => setCreated((count) => count + 1)}>
          <IconPlus /> New work order
        </Button>
      </div>
    </Phone>
  );
}

const RECENT = ['23-KA-9101', 'WO-104482', 'Export pump B'];

function MobileNavSearch() {
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<readonly string[]>(RECENT);
  const text = query.trim().toLowerCase();
  const results = text === '' ? [] : EQUIPMENT.filter((asset) => `${asset.tag} ${asset.name}`.toLowerCase().includes(text));
  return (
    <Phone label="Search screen with recent items">
      <div className="flex flex-col gap-3 px-4 pb-3 pt-2">
        <div className="relative">
          <IconSearch aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search assets and work orders" placeholder="Search assets and work orders" className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {text === '' ? (
          <section aria-label="Recent searches">
            <div className="flex items-center justify-between px-4 pb-1">
              <h3 className="text-xs font-medium text-muted-foreground">Recent</h3>
              {recent.length > 0 ? (
                <Button variant="ghost" size="sm" onClick={() => setRecent([])}>
                  Clear recent
                </Button>
              ) : null}
            </div>
            {recent.length === 0 ? <p className="px-4 py-6 text-sm text-muted-foreground">Searches you make appear here.</p> : null}
            {recent.map((item) => (
              <button key={item} type="button" onClick={() => setQuery(item)} className="flex min-h-12 w-full items-center gap-3 px-4 text-left text-sm text-base-foreground outline-none focus-visible:shadow-focus-ring">
                <IconHistory aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{item}</span>
              </button>
            ))}
          </section>
        ) : results.length > 0 ? (
          <section aria-label="Results">{assetRows(results)}</section>
        ) : (
          <p className="px-4 py-6 text-sm text-muted-foreground">No assets match “{query.trim()}”. Check the tag or try the name.</p>
        )}
      </div>
    </Phone>
  );
}

function MobileNavRefresh() {
  const [refreshing, setRefreshing] = useState(false);
  const [updated, setUpdated] = useState('Updated 14:00');
  const timer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    []
  );
  const refresh = () => {
    setRefreshing(true);
    timer.current = window.setTimeout(() => {
      setRefreshing(false);
      setUpdated('Updated 14:01');
    }, 900);
  };
  return (
    <Phone label="List with a refresh row">
      <MobileAppBar title="Alarms" />
      <RefreshRow status={updated} refreshing={refreshing} onRefresh={refresh} />
      <div className="min-h-0 flex-1 overflow-y-auto">{alarmRows(ACTIVE_ALARMS)}</div>
    </Phone>
  );
}

function MobileNavOffline() {
  const [retries, setRetries] = useState(0);
  return (
    <Phone
      label="Work orders while offline"
      connection="offline"
      header={
        <OfflineBanner action={<Button variant="ghost" size="sm" onClick={() => setRetries((count) => count + 1)}>Retry</Button>}>
          Showing orders saved on this device. Changes are sent when you are back online.
        </OfflineBanner>
      }
    >
      <MobileAppBar title="Work orders" />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {OPEN_ORDERS.slice(0, 4).map((order, index) => (
          <MobileNavRow key={order.id} title={order.title} mono={order.id} detail={index === 0 ? 'Waiting to send' : `${PRIORITY_TEXT[order.priority]} · ${STATUS_TEXT[order.status]}`} trailing={index === 0 ? <Badge variant="warning">Not sent</Badge> : undefined} />
        ))}
      </div>
      <p aria-live="polite" className="border-t border-default px-4 py-2 text-xs text-muted-foreground">
        {retries === 0 ? 'Last sync 13:42' : `Still offline after ${retries} ${retries === 1 ? 'try' : 'tries'}.`}
      </p>
    </Phone>
  );
}

function MobileNavEmptyTab() {
  const [state, dispatch] = useReducer((current: ReturnType<typeof createNavState>, action: Parameters<typeof navReducer>[1]) => navReducer(current, action, ROOTS), undefined, () => createNavState(ROOTS, 'alarms'));
  return (
    <Phone label="An empty tab" footer={<BottomNav label="Main" items={[{ ...TAB_ITEMS[0], count: undefined }, TAB_ITEMS[1], TAB_ITEMS[2]]} activeId={state.activeTab} onSelect={(tab) => dispatch({ type: 'selectTab', tab })} />}>
      <MobileAppBar title={state.activeTab === 'alarms' ? 'Alarms' : state.activeTab === 'work' ? 'Work orders' : 'Assets'} />
      {state.activeTab === 'alarms' ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
          <IconInbox aria-hidden="true" className="size-10 text-muted-foreground" />
          <h3 className="text-base font-semibold text-base-foreground">No active alarms</h3>
          <p className="text-sm text-muted-foreground">Alarms that need you appear here as they are raised. Cleared alarms are in History.</p>
          <Button variant="secondary" onClick={() => dispatch({ type: 'selectTab', tab: 'work' })}>
            Go to work orders
          </Button>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">{state.activeTab === 'work' ? orderRows(OPEN_ORDERS) : assetRows(EQUIPMENT)}</div>
      )}
    </Phone>
  );
}

function MobileNavLoading() {
  return (
    <Phone label="Work orders while loading">
      <MobileAppBar title="Work orders" />
      <div aria-busy="true" aria-label="Loading work orders" role="status" className="flex flex-col">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex min-h-14 flex-col justify-center gap-2 border-b border-default px-4 py-2">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        ))}
      </div>
    </Phone>
  );
}

function MobileNavSamePhone() {
  const { state, entry, go } = useStackApp('work');
  if (!entry) return null;
  return (
    <Phone label="The same list and detail on a phone">
      <MobileStack entry={entry} direction={state.direction} render={(current) => stackScreen(current, go) ?? rootScreen(current, go)} />
    </Phone>
  );
}

function MobileNavTablet() {
  const [orderId, setOrderId] = useState(OPEN_ORDERS[0].id);
  const order = WORK_ORDERS.find((candidate) => candidate.id === orderId) ?? OPEN_ORDERS[0];
  const asset = findAsset(order.assetId);
  return (
    <DeviceFrame label="The same list and detail on a tablet" device="tablet" className="h-128" height="screen">
      <TwoPaneLayout
        primaryLabel="Work orders"
        secondaryLabel="Work order details"
        primary={
          <>
            <MobileAppBar title="Work orders" />
            <div className="min-h-0 flex-1 overflow-y-auto">
              {OPEN_ORDERS.map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  aria-current={candidate.id === orderId ? 'true' : undefined}
                  onClick={() => setOrderId(candidate.id)}
                  className={`flex min-h-14 w-full flex-col justify-center gap-0.5 border-b border-default px-4 py-2 text-left outline-none focus-visible:shadow-focus-ring ${candidate.id === orderId ? 'bg-medium-background' : ''}`}
                >
                  <span className="truncate text-sm font-medium text-base-foreground">{candidate.title}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    <span className="font-mono">{candidate.id}</span> {`· ${PRIORITY_TEXT[candidate.priority]} · ${STATUS_TEXT[candidate.status]}`}
                  </span>
                </button>
              ))}
            </div>
          </>
        }
        secondary={
          <>
            <MobileAppBar title={order.id} subtitle={asset?.tag} />
            <div className="min-h-0 flex-1 overflow-y-auto">
              <h3 className="px-4 pb-2 pt-1 text-base font-semibold text-base-foreground">{order.title}</h3>
              <DetailFields rows={orderDetailRows(order)} />
            </div>
          </>
        }
      />
    </DeviceFrame>
  );
}

const SPEC_USES = ['tools/mobile/navStack.ts', 'tools/mobile/MobileStack.tsx', 'industrial/analytics/DeviceFrame.tsx'];

export default definePage({
  id: 'mobile-navigation',
  title: 'Mobile navigation',
  summary:
    'Phone patterns for a field app, each shown in a device frame and working: a tab bar and a navigation stack with a real back path, collapsing large titles, bottom and action sheets, a drawer, search, refresh, offline and empty states, and the same stack adapted to a tablet.',
  guidance: {
    use: [
      'Three to five tabs at the bottom, each with its own stack, so switching tabs never loses your place.',
      'Name the back button after where it goes. A bare arrow hides the structure.',
      'Make every gesture also a visible control: a drag handle that works with Up and Down, a refresh row instead of pull to refresh.',
      'Keep touch targets at least 44 px, and put the primary action within thumb reach.',
    ],
    avoid: [
      'Hamburger menus for primary destinations; a drawer is for what does not fit the tab bar.',
      'More than two icon actions in the bar; move the rest into an action sheet.',
      'Animating screens when the user prefers reduced motion. The transitions here switch off.',
      'Stacking sheets. One overlay at a time, closed by its scrim, Escape or a button.',
    ],
  },
  source,
  sections: [
    {
      id: 'structure',
      title: 'Structure',
      description: 'Tab bars, stacks and flows. Open an order, open its asset, then use Back; switch tab and come back to the same place.',
      specimens: [
        {
          id: 'MobileNavTabApp',
          title: 'Tab bar with badge',
          note: 'Pick it for the top level of an app: three destinations, a count on the one that needs attention, a stack in each.',
          origin: 'custom',
          size: 'sm',
          align: 'center',
          uses: [...SPEC_USES, 'templates/BottomNav.tsx', 'tools/mobile/LargeTitleScreen.tsx', 'tools/mobile/MobileAppBar.tsx'],
          Component: MobileNavTabApp,
        },
        {
          id: 'MobileNavStack',
          title: 'Navigation stack',
          note: 'Each push slides a screen in from the right and Back slides it out; with reduced motion it just appears.',
          origin: 'custom',
          size: 'sm',
          align: 'center',
          uses: SPEC_USES,
          Component: MobileNavStack,
        },
        {
          id: 'MobileNavFlow',
          title: 'Multi-screen flow',
          note: 'A short task as three pushed screens, with no stepper: the title and the button say where you are.',
          origin: 'custom',
          size: 'sm',
          align: 'center',
          uses: SPEC_USES,
          Component: MobileNavFlow,
        },
      ],
    },
    {
      id: 'headers',
      title: 'Headers and tabs',
      description: 'What sits at the top of a screen.',
      specimens: [
        {
          id: 'MobileNavAppBar',
          title: 'Top app bar',
          note: 'Back on the left named for its destination, the title centred, at most two actions on the right.',
          origin: 'custom',
          size: 'sm',
          align: 'center',
          uses: ['tools/mobile/MobileAppBar.tsx', 'industrial/analytics/DeviceFrame.tsx'],
          Component: MobileNavAppBar,
        },
        {
          id: 'MobileNavLargeTitle',
          title: 'Large title',
          note: 'Scroll the list: the large title moves into the bar once half of it has gone, and the bar gets its divider.',
          origin: 'custom',
          size: 'sm',
          align: 'center',
          uses: ['tools/mobile/LargeTitleScreen.tsx', 'tools/mobile/largeTitle.ts', 'industrial/analytics/DeviceFrame.tsx'],
          Component: MobileNavLargeTitle,
        },
        {
          id: 'MobileNavSegmentedTabs',
          title: 'Segmented top tabs',
          note: 'Switch between views of one list with a tap; nothing swipes, so it works for every hand and input.',
          origin: 'custom',
          size: 'sm',
          align: 'center',
          uses: ['tools/mobile/MobileAppBar.tsx', 'industrial/analytics/DeviceFrame.tsx'],
          Component: MobileNavSegmentedTabs,
        },
      ],
    },
    {
      id: 'overlays',
      title: 'Sheets and menus',
      description: 'Overlays start closed behind a labelled control. Open them, then close with the scrim, Escape or a button.',
      specimens: [
        {
          id: 'MobileNavBottomSheet',
          title: 'Bottom sheet',
          note: 'For a choice that needs more room than a menu: it opens half way, the handle drags or steps to full height.',
          origin: 'custom',
          size: 'sm',
          align: 'center',
          uses: ['tools/mobile/BottomSheet.tsx', 'tools/mobile/bottomSheet.ts', 'industrial/analytics/DeviceFrame.tsx'],
          Component: MobileNavBottomSheet,
        },
        {
          id: 'MobileNavActionSheet',
          title: 'Action sheet',
          note: 'For the few things you can do to one item, with the destructive one marked and Cancel last.',
          origin: 'custom',
          size: 'sm',
          align: 'center',
          uses: ['tools/mobile/ActionSheet.tsx', 'industrial/analytics/DeviceFrame.tsx'],
          Component: MobileNavActionSheet,
        },
        {
          id: 'MobileNavDrawer',
          title: 'Drawer menu',
          note: 'For destinations that do not fit the tab bar, with counts and the current place marked.',
          origin: 'custom',
          size: 'sm',
          align: 'center',
          uses: ['tools/mobile/MobileDrawer.tsx', 'industrial/analytics/DeviceFrame.tsx'],
          Component: MobileNavDrawer,
        },
      ],
    },
    {
      id: 'content',
      title: 'Lists and states',
      description: 'The main action, finding things, keeping data fresh, and the states that are not the happy path.',
      specimens: [
        {
          id: 'MobileNavFab',
          title: 'Floating action button',
          note: 'One primary action that is always in thumb reach, labelled in words rather than a bare plus.',
          origin: 'custom',
          size: 'sm',
          align: 'center',
          uses: ['industrial/analytics/DeviceFrame.tsx'],
          Component: MobileNavFab,
        },
        {
          id: 'MobileNavSearch',
          title: 'Search with recent items',
          note: 'Before the first keystroke show what was searched last; after it, show matches or say there are none.',
          origin: 'custom',
          size: 'sm',
          align: 'center',
          uses: ['industrial/analytics/DeviceFrame.tsx'],
          Component: MobileNavSearch,
        },
        {
          id: 'MobileNavRefresh',
          title: 'Refresh row',
          note: 'A visible row with the age of the data and a button, instead of a pull gesture that not everyone can make.',
          origin: 'custom',
          size: 'sm',
          align: 'center',
          uses: ['tools/mobile/RefreshRow.tsx', 'industrial/analytics/DeviceFrame.tsx'],
          Component: MobileNavRefresh,
        },
        {
          id: 'MobileNavOffline',
          title: 'Offline banner',
          note: 'Say that the device is offline, what is shown instead, and which changes are waiting to be sent.',
          origin: 'custom',
          size: 'sm',
          align: 'center',
          uses: ['tools/mobile/OfflineBanner.tsx', 'industrial/analytics/DeviceFrame.tsx'],
          Component: MobileNavOffline,
        },
        {
          id: 'MobileNavEmptyTab',
          title: 'Empty tab',
          note: 'Explain why the tab is empty, where the content will come from, and offer the nearest useful place.',
          origin: 'custom',
          size: 'sm',
          align: 'center',
          uses: ['templates/BottomNav.tsx', 'industrial/analytics/DeviceFrame.tsx'],
          Component: MobileNavEmptyTab,
        },
        {
          id: 'MobileNavLoading',
          title: 'Loading list',
          note: 'Keep the bar and the row rhythm and show placeholders where the rows will be.',
          origin: 'custom',
          size: 'sm',
          align: 'center',
          uses: ['industrial/analytics/DeviceFrame.tsx'],
          Component: MobileNavLoading,
        },
      ],
    },
    {
      id: 'tablet',
      title: 'Tablet adaptation',
      description: 'The same list and detail screens, pushed on a phone and side by side on a tablet.',
      specimens: [
        {
          id: 'MobileNavSamePhone',
          title: 'On a phone',
          note: 'The list is the whole screen and the detail is pushed over it, with Back to return.',
          origin: 'custom',
          size: 'sm',
          align: 'center',
          uses: SPEC_USES,
          Component: MobileNavSamePhone,
        },
        {
          id: 'MobileNavTablet',
          title: 'On a tablet',
          note: 'Keep the list on the left and open the detail beside it, so there is no back button and no lost place.',
          origin: 'custom',
          size: 'lg',
          align: 'center',
          uses: ['tools/mobile/TwoPaneLayout.tsx', 'tools/mobile/MobileAppBar.tsx', 'industrial/analytics/DeviceFrame.tsx'],
          Component: MobileNavTablet,
        },
      ],
    },
  ],
});
