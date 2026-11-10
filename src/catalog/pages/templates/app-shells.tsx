import { Avatar, AvatarIcon } from '@cognite/aura/components/avatar';
import { Button } from '@cognite/aura/components/button';
import { Input } from '@cognite/aura/components/input';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import { Tabs, TabsList, TabsTrigger } from '@cognite/aura/components/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { TopbarAction } from '@cognite/aura/components/topbar';
import {
  IconBell,
  IconBuildingFactory2,
  IconClipboardList,
  IconLayoutDashboard,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconPlus,
  IconSend,
  IconSitemap,
  IconSparkles,
  IconTool,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';

import { ChatThread } from '../../../library/ai/ChatThread';
import type { ChatMessage } from '../../../library/ai/ChatThread';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { StatusBadge } from '../../../library/display/StatusBadge';
import { AlarmList } from '../../../library/industrial/operations/AlarmList';
import { AssetTree } from '../../../library/industrial/operations/AssetTree';
import { indexAssetTree } from '../../../library/industrial/operations/assetTree';
import { PriorityBadge } from '../../../library/industrial/operations/PriorityBadge';
import { SeverityBadge } from '../../../library/industrial/operations/SeverityBadge';
import { Sparkline } from '../../../library/industrial/Sparkline';
import { formatValue, healthStatus, qualityStatus, runStateStatus, toneFromLimits } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { DataTable } from '../../../library/patterns/collections/DataTable';
import type { DataTableColumn } from '../../../library/patterns/collections/DataTable';
import { StatRow } from '../../../library/patterns/collections/StatRow';
import { OptionSelect } from '../../../library/patterns/data-entry/OptionSelect';
import { AssistantPanel } from '../../../library/patterns/product/AssistantPanel';
import { PageHeader } from '../../../library/patterns/structure/PageHeader';
import { PropertyList } from '../../../library/patterns/structure/PropertyList';
import { SectionHeader } from '../../../library/patterns/structure/SectionHeader';
import { Sidebar } from '../../../library/patterns/structure/Sidebar';
import { SidebarNav } from '../../../library/patterns/structure/SidebarNav';
import type { SidebarNavGroup } from '../../../library/patterns/structure/SidebarNav';
import { SidePanel } from '../../../library/patterns/structure/SidePanel';
import { AppShell } from '../../../library/templates/AppShell';
import { AppTopbar } from '../../../library/templates/AppTopbar';
import { BottomNav } from '../../../library/templates/BottomNav';
import type { BottomNavItem } from '../../../library/templates/BottomNav';
import { ContentContainer } from '../../../library/templates/ContentContainer';
import { ShellStatusBar } from '../../../library/templates/ShellStatusBar';
import { TemplateFrame } from '../../../library/templates/TemplateFrame';
import { ALARMS, ASSETS, PEOPLE, PLANT_KPIS, SENSORS, WORK_ORDERS, findAsset, findPerson, sensorsOf } from '../../data/plant';
import type { Asset, Sensor, WorkOrder } from '../../data/plant';
import { formatAgo, formatDate, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './app-shells.tsx?raw';

type ShellTone = 'light' | 'dark';

const SHELL_OPERATOR = PEOPLE[0];
const SHELL_OPEN_ALARMS = ALARMS.filter((alarm) => alarm.state === 'active' || alarm.state === 'acknowledged');
const SHELL_OPEN_ORDERS = WORK_ORDERS.filter((order) => order.status !== 'done');
const SHELL_EQUIPMENT = ASSETS.filter((asset) => !['site', 'area', 'system'].includes(asset.type));
const SHELL_COMPRESSORS = ASSETS.filter((asset) => asset.type === 'compressor');
const SHELL_COMPRESSOR = findAsset('23-ka-9101') ?? ASSETS[0];
const SHELL_TREE = indexAssetTree(ASSETS);

/** The four places every shell on this page navigates between. */
const SHELL_GROUPS: readonly SidebarNavGroup[] = [
  {
    id: 'operate',
    label: 'Operate',
    items: [
      { id: 'overview', label: 'Overview', icon: <IconLayoutDashboard /> },
      { id: 'alarms', label: 'Alarms', icon: <IconBell />, count: SHELL_OPEN_ALARMS.length },
      { id: 'assets', label: 'Assets', icon: <IconSitemap /> },
    ],
  },
  {
    id: 'maintain',
    label: 'Maintain',
    items: [{ id: 'work-orders', label: 'Work orders', icon: <IconTool />, count: SHELL_OPEN_ORDERS.length }],
  },
];

const SHELL_VIEWS: Record<string, { title: string; group: string; description: string }> = {
  overview: { title: 'Overview', group: 'Operate', description: 'How Nordkapp is running right now, and what needs attention.' },
  alarms: { title: 'Alarms', group: 'Operate', description: 'Active and acknowledged alarms, most severe first.' },
  assets: { title: 'Assets', group: 'Operate', description: 'Run state and condition of every main unit.' },
  'work-orders': { title: 'Work orders', group: 'Maintain', description: 'Open and planned jobs, by due date.' },
};

const SHELL_ORDER_COLUMNS: readonly DataTableColumn<WorkOrder>[] = [
  {
    id: 'order',
    header: 'Work order',
    cell: (order) => (
      <div className="min-w-0">
        <p className="text-base-foreground">{order.title}</p>
        <p className="font-mono text-xs text-muted-foreground">
          {order.id} · {findAsset(order.assetId)?.tag}
        </p>
      </div>
    ),
    sortValue: (order) => order.id,
  },
  { id: 'priority', header: 'Priority', cell: (order) => <PriorityBadge priority={order.priority} />, sortValue: (order) => order.priority, width: 'w-24' },
  { id: 'status', header: 'Status', cell: (order) => <StatusBadge status={order.status} />, width: 'w-36' },
  { id: 'due', header: 'Due', align: 'end', cell: (order) => formatDate(order.dueAt), sortValue: (order) => order.dueAt, width: 'w-24' },
];

const SHELL_ASSET_COLUMNS: readonly DataTableColumn<Asset>[] = [
  {
    id: 'asset',
    header: 'Asset',
    cell: (asset) => (
      <div className="min-w-0">
        <p className="text-base-foreground">{asset.name}</p>
        <p className="font-mono text-xs text-muted-foreground">{asset.tag}</p>
      </div>
    ),
    sortValue: (asset) => asset.name,
  },
  { id: 'state', header: 'State', cell: (asset) => <StatusIndicator {...runStateStatus(asset.state)} size="sm" />, width: 'w-36' },
  { id: 'health', header: 'Condition', cell: (asset) => <StatusIndicator {...healthStatus(asset.health)} size="sm" />, width: 'w-28' },
  { id: 'score', header: 'Score', align: 'end', cell: (asset) => asset.healthScore, sortValue: (asset) => asset.healthScore, width: 'w-20' },
];

const SHELL_SENSOR_COLUMNS: readonly DataTableColumn<Sensor>[] = [
  {
    id: 'sensor',
    header: 'Measurement',
    cell: (sensor) => (
      <div className="min-w-0">
        <p className="text-base-foreground">{sensor.name}</p>
        <p className="font-mono text-xs text-muted-foreground">{sensor.tag}</p>
      </div>
    ),
  },
  {
    id: 'value',
    header: 'Value',
    align: 'end',
    cell: (sensor) => (
      <ValueReadout
        value={sensor.quality === 'bad' ? null : sensor.value}
        unit={sensor.unit}
        decimals={sensor.decimals}
        size="xs"
        tone={toneFromLimits(sensor.value, { low: sensor.lowLimit, high: sensor.highLimit, highHigh: sensor.highHighLimit })}
      />
    ),
    width: 'w-36',
  },
  {
    id: 'limits',
    header: 'Limits',
    align: 'end',
    cell: (sensor) => `${formatValue(sensor.lowLimit, sensor.decimals)} to ${formatValue(sensor.highLimit, sensor.decimals)}`,
    width: 'w-36',
  },
  { id: 'quality', header: 'Signal', cell: (sensor) => <StatusIndicator {...qualityStatus(sensor.quality)} size="sm" />, width: 'w-28' },
];

const SHELL_ASSISTANT_THREAD: readonly ChatMessage[] = [
  { id: 'q1', role: 'user', text: 'Which open work orders touch gas compression?' },
  {
    id: 'a1',
    role: 'assistant',
    text: 'Three: **WO-104482** on the recompressor (P1, in progress), **WO-104471** on the interstage cooler (waiting for parts) and **WO-104466**, the vibration survey on the 1st stage compressor, which is not assigned yet.',
  },
];

const SHELL_MOBILE_ITEMS: readonly BottomNavItem[] = [
  { id: 'overview', label: 'Overview', icon: <IconLayoutDashboard /> },
  { id: 'alarms', label: 'Alarms', icon: <IconBell />, count: SHELL_OPEN_ALARMS.length },
  { id: 'assets', label: 'Assets', icon: <IconSitemap /> },
  { id: 'work-orders', label: 'Work', icon: <IconClipboardList /> },
];

const shellAssetName = (alarm: { assetId: string }) => findAsset(alarm.assetId)?.name;

/** The product mark and name that top a sidebar. */
function ShellBrand({ tone = 'light', collapsed = false }: { tone?: ShellTone; collapsed?: boolean }) {
  return (
    <div className={`flex min-h-9 items-center gap-2 ${collapsed ? 'justify-center' : 'px-2'}`}>
      <Avatar variant="overflow" sizes="xsm" aria-hidden="true">
        <AvatarIcon>
          <IconBuildingFactory2 />
        </AvatarIcon>
      </Avatar>
      {collapsed ? null : (
        <span className="flex min-w-0 flex-col">
          <span className={`truncate text-sm font-semibold ${tone === 'dark' ? 'text-popover-foreground-fixed-dark' : 'text-base-foreground'}`}>
            Plant operations
          </span>
          <span className={`truncate text-xs ${tone === 'dark' ? 'text-muted-foreground-fixed-dark' : 'text-muted-foreground'}`}>Nordkapp</span>
        </span>
      )}
    </div>
  );
}

/** The signed-in person at the foot of a sidebar. */
function ShellUser({ tone = 'light' }: { tone?: ShellTone }) {
  return (
    <div className="flex items-center gap-2 p-2">
      <PersonAvatar name={SHELL_OPERATOR.name} sizes="xsm" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={`truncate text-sm font-medium ${tone === 'dark' ? 'text-popover-foreground-fixed-dark' : 'text-base-foreground'}`}>
          {SHELL_OPERATOR.name}
        </span>
        <span className={`truncate text-xs ${tone === 'dark' ? 'text-muted-foreground-fixed-dark' : 'text-muted-foreground'}`}>
          {SHELL_OPERATOR.role}
        </span>
      </span>
    </div>
  );
}

/** A named, tooltipped icon button for the top bar's system controls. */
function ShellTopbarAction({ label, children, pressed, onClick }: { label: string; children: ReactNode; pressed?: boolean; onClick?: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <TopbarAction variant={pressed ? 'secondary' : 'ghost'} size="icon-sm" aria-label={label} aria-pressed={pressed} onClick={onClick}>
            {children}
          </TopbarAction>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/** The body of one of the four views, without its header. */
function ShellViewBody({ view, dense = false }: { view: string; dense?: boolean }) {
  if (view === 'alarms') {
    return <AlarmList alarms={SHELL_OPEN_ALARMS} label="Open alarms" formatAge={formatAgo} getAssetName={shellAssetName} density="compact" />;
  }
  if (view === 'assets') {
    return (
      <DataTable
        label="Equipment"
        columns={dense ? SHELL_ASSET_COLUMNS.slice(0, 2) : SHELL_ASSET_COLUMNS}
        rows={SHELL_EQUIPMENT}
        getRowId={(asset) => asset.id}
        density={dense ? 'dense' : 'default'}
      />
    );
  }
  if (view === 'work-orders') {
    return (
      <DataTable
        label="Open work orders"
        columns={dense ? [SHELL_ORDER_COLUMNS[0], SHELL_ORDER_COLUMNS[1]] : SHELL_ORDER_COLUMNS}
        rows={SHELL_OPEN_ORDERS}
        getRowId={(order) => order.id}
        defaultSort={{ columnId: 'due', direction: 'asc' }}
      />
    );
  }
  return (
    <>
      <StatRow
        label="Plant summary"
        dividers={!dense}
        stats={[
          { id: 'availability', label: 'Availability', value: formatValue(PLANT_KPIS.availability.value, 1), unit: '%' },
          { id: 'export', label: 'Gas export', value: formatValue(PLANT_KPIS.gasExport.value, 2), unit: dense ? undefined : 'MSm³/d' },
          { id: 'alarms', label: 'Open alarms', value: SHELL_OPEN_ALARMS.length },
          ...(dense ? [] : [{ id: 'orders', label: 'Open work orders', value: PLANT_KPIS.openWorkOrders.value }]),
        ]}
      />
      <div className="flex flex-col gap-3">
        <SectionHeader title="Needs attention" count={SHELL_OPEN_ALARMS.length} size="sm" as="h2" />
        <AlarmList alarms={SHELL_OPEN_ALARMS.slice(0, 3)} label="Most severe alarms" formatAge={formatAgo} getAssetName={shellAssetName} density="compact" />
      </div>
    </>
  );
}

/** A whole page for a view: the content column, a header and the body. */
function ShellPage({ view, width = 'wide', heading = true }: { view: string; width?: 'wide' | 'detail'; heading?: boolean }) {
  const meta = SHELL_VIEWS[view] ?? SHELL_VIEWS.overview;

  return (
    <ContentContainer width={width}>
      {heading ? (
        <PageHeader
          title={meta.title}
          description={meta.description}
          actions={
            view === 'work-orders' ? (
              <Button>
                <IconPlus /> Create work order
              </Button>
            ) : undefined
          }
        />
      ) : null}
      <ShellViewBody view={view} />
    </ContentContainer>
  );
}

/** One asset as a pane: state, condition and its live readings with a trend each. */
function ShellAssetPane({ asset }: { asset: Asset }) {
  const sensors = sensorsOf(asset.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <StatusIndicator {...runStateStatus(asset.state)} />
        <StatusIndicator {...healthStatus(asset.health)} detail={`score ${asset.healthScore}`} />
      </div>
      {sensors.length === 0 ? (
        <p className="text-sm text-muted-foreground">No live measurements are mapped to this asset yet.</p>
      ) : (
        <ul className="flex flex-col">
          {sensors.map((sensor) => (
            <li key={sensor.id} className="flex items-center gap-4 border-b border-default py-3 last:border-b-0">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-base-foreground">{sensor.name}</p>
                <p className="font-mono text-xs text-muted-foreground">{sensor.tag}</p>
              </div>
              <div className="w-20 shrink-0">
                <Sparkline
                  values={makeValues({ seed: sensor.seed, points: 24, base: sensor.value, amplitude: sensor.value * 0.02, noise: sensor.value * 0.01 })}
                  label={`${sensor.name}, last 24 hours`}
                  unit={sensor.unit}
                  decimals={sensor.decimals}
                  height={24}
                />
              </div>
              <div className="flex w-28 shrink-0 justify-end">
                <ValueReadout value={sensor.value} unit={sensor.unit} decimals={sensor.decimals} size="xs" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ShellTemplateSidebarLight() {
  const [view, setView] = useState('overview');

  return (
    <TemplateFrame title="Plant operations · Nordkapp" address={`/${view}`}>
      <AppShell
        contentLabel={SHELL_VIEWS[view].title}
        sidebar={
          <Sidebar label="Sidebar" header={<ShellBrand />} footer={<ShellUser />}>
            <SidebarNav label="Main" groups={SHELL_GROUPS} activeId={view} onSelect={setView} />
          </Sidebar>
        }
      >
        <ShellPage view={view} />
      </AppShell>
    </TemplateFrame>
  );
}

function ShellTemplateSidebarDark() {
  const [view, setView] = useState('work-orders');
  const meta = SHELL_VIEWS[view];

  return (
    <TemplateFrame title="Plant operations · Nordkapp" address={`/${view}`}>
      <AppShell
        contentLabel={meta.title}
        sidebar={
          <Sidebar label="Sidebar" tone="dark" header={<ShellBrand tone="dark" />} footer={<ShellUser tone="dark" />}>
            <SidebarNav label="Main" tone="dark" groups={SHELL_GROUPS} activeId={view} onSelect={setView} />
          </Sidebar>
        }
        topbar={
          <AppTopbar
            icon={<IconBuildingFactory2 />}
            trail={[
              { id: 'group', label: meta.group },
              { id: 'page', label: meta.title },
            ]}
            actions={
              <ShellTopbarAction label="Notifications">
                <IconBell />
              </ShellTopbarAction>
            }
          />
        }
      >
        <ShellPage view={view} />
      </AppShell>
    </TemplateFrame>
  );
}

function ShellTemplateIconRail() {
  const [view, setView] = useState('assets');
  const [collapsed, setCollapsed] = useState(true);
  const toggleLabel = collapsed ? 'Expand sidebar' : 'Collapse sidebar';

  return (
    <TemplateFrame title="Plant operations · Nordkapp" address={`/${view}`}>
      <AppShell
        contentLabel={SHELL_VIEWS[view].title}
        sidebar={
          <Sidebar
            label="Sidebar"
            collapsed={collapsed}
            header={<ShellBrand collapsed={collapsed} />}
            footer={
              <div className={`flex ${collapsed ? 'justify-center' : 'justify-end'}`}>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button variant="ghost" size="icon-sm" aria-label={toggleLabel} aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)}>
                        {collapsed ? <IconLayoutSidebarLeftExpand /> : <IconLayoutSidebarLeftCollapse />}
                      </Button>
                    }
                  />
                  <TooltipContent side="right">{toggleLabel}</TooltipContent>
                </Tooltip>
              </div>
            }
          >
            <SidebarNav label="Main" groups={SHELL_GROUPS} activeId={view} onSelect={setView} collapsed={collapsed} />
          </Sidebar>
        }
      >
        <ShellPage view={view} />
      </AppShell>
    </TemplateFrame>
  );
}

function ShellTemplateTopbarOnly() {
  const [view, setView] = useState('overview');

  return (
    <TemplateFrame title="Plant operations · Nordkapp" address={`/${view}`}>
      <AppShell
        contentLabel={SHELL_VIEWS[view].title}
        topbarSpan="window"
        topbar={
          <AppTopbar
            icon={<IconBuildingFactory2 />}
            trail={[{ id: 'app', label: 'Plant operations' }]}
            userName={SHELL_OPERATOR.name}
            center={
              <Tabs
                value={view}
                onValueChange={(next) => {
                  if (typeof next === 'string') setView(next);
                }}
              >
                <TabsList size="small" aria-label="Main">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="alarms">Alarms</TabsTrigger>
                  <TabsTrigger value="assets">Assets</TabsTrigger>
                  <TabsTrigger value="work-orders">Work orders</TabsTrigger>
                </TabsList>
              </Tabs>
            }
            actions={
              <ShellTopbarAction label="Notifications">
                <IconBell />
              </ShellTopbarAction>
            }
          />
        }
      >
        <ShellPage view={view} width="detail" />
      </AppShell>
    </TemplateFrame>
  );
}

function ShellTemplateTopbarTabs() {
  const [tab, setTab] = useState('readings');
  const asset = SHELL_COMPRESSOR;
  const alarms = SHELL_OPEN_ALARMS.filter((alarm) => alarm.assetId === asset.id);
  const orders = WORK_ORDERS.filter((order) => order.assetId === asset.id);

  return (
    <TemplateFrame title={`${asset.name} · Plant operations`} address={`/assets/${asset.id}/${tab}`}>
      <AppShell
        contentLabel={asset.name}
        topbarSpan="window"
        topbar={
          <AppTopbar
            icon={<IconBuildingFactory2 />}
            trail={[
              { id: 'app', label: 'Plant operations' },
              { id: 'assets', label: 'Assets' },
              { id: 'area', label: 'Gas compression' },
              { id: 'asset', label: asset.name },
            ]}
            userName={SHELL_OPERATOR.name}
          />
        }
        subbar={
          <div className="flex flex-col gap-3 px-6 pt-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="text-xl font-semibold text-base-foreground">{asset.name}</h1>
              <span className="font-mono text-sm text-muted-foreground">{asset.tag}</span>
              <StatusBadge status={asset.state} />
            </div>
            <Tabs
              value={tab}
              onValueChange={(next) => {
                if (typeof next === 'string') setTab(next);
              }}
            >
              <TabsList aria-label={`${asset.name} sections`}>
                <TabsTrigger value="readings">Readings</TabsTrigger>
                <TabsTrigger value="alarms" badge={alarms.length}>
                  Alarms
                </TabsTrigger>
                <TabsTrigger value="work-orders" badge={orders.length}>
                  Work orders
                </TabsTrigger>
                <TabsTrigger value="properties">Properties</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        }
      >
        <ContentContainer>
          {tab === 'readings' ? (
            <DataTable label="Live readings" columns={SHELL_SENSOR_COLUMNS} rows={sensorsOf(asset.id)} getRowId={(sensor) => sensor.id} />
          ) : null}
          {tab === 'alarms' ? (
            <AlarmList alarms={alarms} label={`Alarms on ${asset.name}`} formatAge={formatAgo} density="compact" />
          ) : null}
          {tab === 'work-orders' ? (
            <DataTable label={`Work orders on ${asset.name}`} columns={SHELL_ORDER_COLUMNS} rows={orders} getRowId={(order) => order.id} />
          ) : null}
          {tab === 'properties' ? (
            <div className="max-w-xl">
              <PropertyList
                items={[
                  { label: 'Functional location', value: <span className="font-mono">{asset.tag}</span> },
                  { label: 'Type', value: 'Centrifugal compressor' },
                  { label: 'Area', value: 'Gas compression' },
                  { label: 'Criticality', value: asset.criticality },
                  { label: 'Condition score', value: asset.healthScore },
                  { label: 'Commissioned', value: '14 Jun 2011' },
                ]}
              />
            </div>
          ) : null}
        </ContentContainer>
      </AppShell>
    </TemplateFrame>
  );
}

function ShellTemplateThreePanel() {
  const [selectedId, setSelectedId] = useState('23-ka-9101');
  const asset = findAsset(selectedId) ?? SHELL_COMPRESSOR;
  const sensors = sensorsOf(asset.id);
  const children = ASSETS.filter((candidate) => candidate.parentId === asset.id);

  return (
    <TemplateFrame title="Asset explorer · Nordkapp" address={`/explorer/${asset.id}`}>
      <AppShell
        contentLabel={asset.name}
        topbarSpan="window"
        topbar={
          <AppTopbar
            icon={<IconBuildingFactory2 />}
            trail={[
              { id: 'app', label: 'Plant operations' },
              { id: 'explorer', label: 'Asset explorer' },
            ]}
            userName={SHELL_OPERATOR.name}
          />
        }
        sidebar={
          <nav aria-label="Asset hierarchy" className="flex w-64 flex-col gap-2 overflow-y-auto border-r border-default p-3">
            <p className="px-1 text-xs font-medium text-muted-foreground">Hierarchy</p>
            <AssetTree
              nodes={SHELL_TREE}
              showState
              selectedId={selectedId}
              onSelect={setSelectedId}
              defaultExpandedItems={['nk', 'nk-23']}
            />
          </nav>
        }
        inspector={
          <aside aria-label="Properties" className="flex w-64 flex-col gap-4 overflow-y-auto border-l border-default p-4">
            <h2 className="text-sm font-semibold text-base-foreground">Properties</h2>
            <PropertyList
              layout="stacked"
              dense
              items={[
                { label: 'Functional location', value: <span className="font-mono">{asset.tag}</span> },
                { label: 'Type', value: <span className="capitalize">{asset.type}</span> },
                { label: 'Criticality', value: asset.criticality },
                { label: 'Run state', value: <StatusIndicator {...runStateStatus(asset.state)} size="sm" /> },
                { label: 'Condition', value: <StatusIndicator {...healthStatus(asset.health)} size="sm" detail={String(asset.healthScore)} /> },
                { label: 'Parent', value: findAsset(asset.parentId ?? '')?.name },
              ]}
            />
          </aside>
        }
      >
        <ContentContainer padding="compact">
          <PageHeader
            size="compact"
            title={asset.name}
            status={<span className="font-mono text-sm text-muted-foreground">{asset.tag}</span>}
            description={sensors.length > 0 ? `${sensors.length} live measurements` : `${children.length} units below this node`}
          />
          {sensors.length > 0 ? (
            <DataTable label="Live readings" columns={SHELL_SENSOR_COLUMNS.slice(0, 3)} rows={sensors} getRowId={(sensor) => sensor.id} density="dense" />
          ) : (
            <DataTable
              label="Units below"
              columns={SHELL_ASSET_COLUMNS.slice(0, 3)}
              rows={children}
              getRowId={(child) => child.id}
              density="dense"
              empty={<p className="text-center text-sm text-muted-foreground">Nothing is mapped below this node.</p>}
            />
          )}
        </ContentContainer>
      </AppShell>
    </TemplateFrame>
  );
}

function ShellTemplateSplitScreen() {
  const [leftId, setLeftId] = useState('23-ka-9101');
  const [rightId, setRightId] = useState('23-ka-9102');
  const options = SHELL_COMPRESSORS.map((asset) => ({ value: asset.id, label: `${asset.tag} ${asset.name}` }));
  const panes = [
    { id: 'left', label: 'Left pane', assetId: leftId, onChange: setLeftId },
    { id: 'right', label: 'Right pane', assetId: rightId, onChange: setRightId },
  ];

  return (
    <TemplateFrame title="Compare equipment · Nordkapp" address="/compare">
      <AppShell
        contentLabel="Compare equipment"
        scroll={false}
        topbarSpan="window"
        topbar={
          <AppTopbar
            icon={<IconBuildingFactory2 />}
            trail={[
              { id: 'app', label: 'Plant operations' },
              { id: 'compare', label: 'Compare equipment' },
            ]}
            userName={SHELL_OPERATOR.name}
          />
        }
      >
        <div className="grid min-h-0 flex-1 grid-cols-2 divide-x divide-default">
          {panes.map((pane) => (
            <section key={pane.id} aria-label={pane.label} className="flex min-h-0 min-w-0 flex-col gap-6 overflow-y-auto p-6">
              <OptionSelect aria-label={`Equipment in the ${pane.label.toLowerCase()}`} options={options} value={pane.assetId} onValueChange={pane.onChange} />
              <ShellAssetPane asset={findAsset(pane.assetId) ?? SHELL_COMPRESSOR} />
            </section>
          ))}
        </div>
      </AppShell>
    </TemplateFrame>
  );
}

function ShellTemplateInspector() {
  const [view, setView] = useState('work-orders');
  const [selectedId, setSelectedId] = useState<string | null>(SHELL_OPEN_ORDERS[0].id);
  const order = SHELL_OPEN_ORDERS.find((candidate) => candidate.id === selectedId);
  const columns: readonly DataTableColumn<WorkOrder>[] = [
    {
      id: 'order',
      header: 'Work order',
      cell: (row) => (
        <button
          type="button"
          aria-label={`Inspect ${row.id}`}
          onClick={() => setSelectedId(row.id)}
          className="flex min-w-0 flex-col rounded-md text-left outline-none focus-visible:shadow-focus-ring"
        >
          <span className="text-base-foreground">{row.title}</span>
          <span className="font-mono text-xs text-muted-foreground">{row.id}</span>
        </button>
      ),
    },
    SHELL_ORDER_COLUMNS[1],
  ];

  return (
    <TemplateFrame title="Work orders · Plant operations" address="/work-orders">
      <AppShell
        contentLabel={SHELL_VIEWS[view].title}
        sidebar={
          <Sidebar label="Sidebar" collapsed header={<ShellBrand collapsed />}>
            <SidebarNav label="Main" groups={SHELL_GROUPS} activeId={view} onSelect={setView} collapsed />
          </Sidebar>
        }
        inspector={
          order && view === 'work-orders' ? (
            <div className="w-80">
              <SidePanel
                frame="edge"
                title={order.id}
                description={order.title}
                status={<StatusBadge status={order.status} />}
                onClose={() => setSelectedId(null)}
                closeLabel="Close inspector"
                footer={<Button variant="secondary">Open work order</Button>}
              >
                <PropertyList
                  items={[
                    { label: 'Asset', value: findAsset(order.assetId)?.name },
                    { label: 'Tag', value: <span className="font-mono">{findAsset(order.assetId)?.tag}</span> },
                    { label: 'Priority', value: <PriorityBadge priority={order.priority} showMeaning /> },
                    { label: 'Assignee', value: findPerson(order.assigneeId)?.name },
                    { label: 'Due', value: formatDate(order.dueAt) },
                    { label: 'Estimate', value: `${order.estimatedHours} h` },
                    { label: 'Progress', value: `${order.progress} %` },
                  ]}
                />
              </SidePanel>
            </div>
          ) : undefined
        }
      >
        {view === 'work-orders' ? (
          <ContentContainer>
            <PageHeader title="Work orders" description="Select a job to inspect it without leaving the list." />
            <DataTable
              label="Open work orders"
              columns={columns}
              rows={SHELL_OPEN_ORDERS}
              getRowId={(row) => row.id}
              currentRowId={selectedId ?? undefined}
            />
          </ContentContainer>
        ) : (
          <ShellPage view={view} />
        )}
      </AppShell>
    </TemplateFrame>
  );
}

function ShellTemplateStatusBar() {
  const [mode, setMode] = useState('live');
  const badSignals = SENSORS.filter((sensor) => sensor.quality !== 'good').length;

  return (
    <TemplateFrame title="Control room console · Nordkapp" address="/console">
      <AppShell
        contentLabel="Console"
        topbarSpan="window"
        topbar={
          <AppTopbar
            icon={<IconBuildingFactory2 />}
            trail={[{ id: 'console', label: 'Control room console' }]}
            center={
              <SegmentedControl
                value={mode}
                onValueChange={(next) => {
                  if (typeof next === 'string') setMode(next);
                }}
              >
                <SegmentedControlList size="small" aria-label="Data mode">
                  <SegmentedControlButton value="live">Live</SegmentedControlButton>
                  <SegmentedControlButton value="replay">Replay</SegmentedControlButton>
                </SegmentedControlList>
              </SegmentedControl>
            }
            userName={SHELL_OPERATOR.name}
          />
        }
        statusBar={
          <ShellStatusBar
            label="Console status"
            items={[
              { id: 'historian', label: 'Historian', value: 'Connected', tone: 'success' },
              { id: 'opc', label: 'OPC UA', value: 'Connected', tone: 'success' },
              { id: 'quality', label: 'Signal quality', value: `${badSignals} of ${SENSORS.length} tags degraded`, tone: 'warning' },
              { id: 'mode', label: 'Mode', value: mode === 'live' ? 'Live, 5 s refresh' : 'Replay, last 24 h' },
            ]}
            endItems={[
              { id: 'shift', label: 'Shift', value: 'Day' },
              { id: 'clock', label: 'UTC', value: '14:00:05' },
            ]}
          />
        }
      >
        <div className="@container flex flex-col gap-6 p-4">
          <div className="grid grid-cols-1 gap-6 @3xl:grid-cols-2">
            <section className="flex min-w-0 flex-col gap-2">
              <SectionHeader title="Alarms" count={SHELL_OPEN_ALARMS.length} size="sm" divider />
              <ul className="flex flex-col">
                {SHELL_OPEN_ALARMS.map((alarm) => (
                  <li key={alarm.id} className="flex items-center gap-3 border-b border-default py-1.5 text-sm last:border-b-0">
                    <span className="w-20 shrink-0">
                      <SeverityBadge severity={alarm.severity} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base-foreground">{alarm.message}</span>
                      <span className="block font-mono text-xs text-muted-foreground">{alarm.sensorTag}</span>
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{formatAgo(alarm.raisedAt)}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="flex min-w-0 flex-col gap-2">
              <SectionHeader title="Process values" count={SENSORS.length} size="sm" divider />
              <DataTable label="Process values" columns={[SHELL_SENSOR_COLUMNS[0], SHELL_SENSOR_COLUMNS[1]]} rows={SENSORS.slice(0, 6)} getRowId={(sensor) => sensor.id} density="dense" />
            </section>
          </div>
        </div>
      </AppShell>
    </TemplateFrame>
  );
}

function ShellTemplateAssistant() {
  const [view, setView] = useState('work-orders');
  const [open, setOpen] = useState(true);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<readonly ChatMessage[]>(SHELL_ASSISTANT_THREAD);

  const send = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const turn = messages.length;
    setMessages([
      ...messages,
      { id: `q${turn}`, role: 'user', text },
      { id: `a${turn}`, role: 'assistant', text: `This page lists ${SHELL_OPEN_ORDERS.length} open work orders. The most urgent is **WO-104482**, due in 6 hours.` },
    ]);
    setDraft('');
  };

  return (
    <TemplateFrame title="Work orders · Plant operations" address={`/${view}`}>
      <AppShell
        contentLabel={SHELL_VIEWS[view].title}
        topbarSpan="window"
        topbar={
          <AppTopbar
            icon={<IconBuildingFactory2 />}
            trail={[
              { id: 'app', label: 'Plant operations' },
              { id: 'page', label: SHELL_VIEWS[view].title },
            ]}
            actions={
              <ShellTopbarAction label={open ? 'Hide assistant' : 'Show assistant'} pressed={open} onClick={() => setOpen(!open)}>
                <IconSparkles />
              </ShellTopbarAction>
            }
            userName={SHELL_OPERATOR.name}
          />
        }
        sidebar={
          <Sidebar label="Sidebar" collapsed>
            <SidebarNav label="Main" groups={SHELL_GROUPS} activeId={view} onSelect={setView} collapsed />
          </Sidebar>
        }
        inspector={
          open ? (
            <div className="w-80">
              <AssistantPanel
                title="Plant assistant"
                context={`Reading ${SHELL_VIEWS[view].title.toLowerCase()}. It cannot change anything.`}
                icon={<IconSparkles />}
                footer={
                  <form onSubmit={send} className="flex items-center gap-2">
                    <Input aria-label="Ask the assistant" placeholder="Ask about this page" value={draft} onChange={(event) => setDraft(event.target.value)} />
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button type="submit" size="icon" aria-label="Send question">
                            <IconSend />
                          </Button>
                        }
                      />
                      <TooltipContent>Send question</TooltipContent>
                    </Tooltip>
                  </form>
                }
              >
                <ChatThread messages={messages} hideActions label="Assistant conversation" />
              </AssistantPanel>
            </div>
          ) : undefined
        }
      >
        <ShellPage view={view} />
      </AppShell>
    </TemplateFrame>
  );
}

function ShellTemplateMobile() {
  const [view, setView] = useState('overview');

  return (
    <TemplateFrame title="Plant operations" width="mobile">
      <AppShell
        contentLabel={SHELL_VIEWS[view].title}
        topbar={
          <AppTopbar
            icon={<IconBuildingFactory2 />}
            trail={[{ id: 'page', label: SHELL_VIEWS[view].title }]}
            actions={
              <ShellTopbarAction label="Notifications">
                <IconBell />
              </ShellTopbarAction>
            }
            userName={SHELL_OPERATOR.name}
          />
        }
        bottomBar={<BottomNav label="Main" items={SHELL_MOBILE_ITEMS} activeId={view} onSelect={setView} />}
      >
        <ContentContainer padding="compact">
          <ShellViewBody view={view} dense />
        </ContentContainer>
      </AppShell>
    </TemplateFrame>
  );
}

export default definePage({
  id: 'app-shells',
  title: 'App shells',
  summary:
    'The frame around every screen of an application: where navigation lives, which regions stay put and which one scrolls. Eleven shells assembled from the same slots, each working with the same four views.',
  guidance: {
    use: [
      'Pick the shell first, then the page layout that goes inside it.',
      'A sidebar for three or more top-level sections; a top bar alone for one to four.',
      'Keep chrome fixed and let only the content scroll.',
      'One primary navigation per screen; a second level goes in tabs or a tree.',
    ],
    avoid: [
      'Repeating global navigation inside the content area.',
      'A right panel that is open by default on narrow screens: toggle it.',
      'Page actions in the top bar; they belong in the page header.',
      'Mixing a dark sidebar with a dark top bar and a light page: one chrome tone per app.',
    ],
  },
  source,
  sections: [
    {
      id: 'sidebar',
      title: 'Sidebar shells',
      description: 'Persistent navigation on the left, for apps with three or more sections.',
      specimens: [
        {
          id: 'ShellTemplateSidebarLight',
          title: 'Sidebar and content',
          note: 'Pick it as the default for a multi-page app whose pages each bring their own header.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates/TemplateFrame.tsx',
            'templates/AppShell.tsx',
            'templates/ContentContainer.tsx',
            'patterns/structure/Sidebar.tsx',
            'patterns/structure/SidebarNav.tsx',
            'patterns/structure/PageHeader.tsx',
            'patterns/collections/StatRow.tsx',
            'industrial/operations/AlarmList.tsx',
          ],
          Component: ShellTemplateSidebarLight,
        },
        {
          id: 'ShellTemplateSidebarDark',
          title: 'Dark sidebar with top bar',
          note: 'Pick it when navigation should recede behind the work and a breadcrumb has to stay in view.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates/TemplateFrame.tsx',
            'templates/AppShell.tsx',
            'templates/AppTopbar.tsx',
            'templates/ContentContainer.tsx',
            'patterns/structure/Sidebar.tsx',
            'patterns/structure/SidebarNav.tsx',
            'patterns/collections/DataTable.tsx',
          ],
          Component: ShellTemplateSidebarDark,
        },
        {
          id: 'ShellTemplateIconRail',
          title: 'Collapsed icon rail',
          note: 'Pick it when the page needs the width, such as tables and trends, and people know the icons.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates/TemplateFrame.tsx',
            'templates/AppShell.tsx',
            'templates/ContentContainer.tsx',
            'patterns/structure/Sidebar.tsx',
            'patterns/structure/SidebarNav.tsx',
            'patterns/collections/DataTable.tsx',
          ],
          Component: ShellTemplateIconRail,
        },
      ],
    },
    {
      id: 'topbar',
      title: 'Top bar shells',
      description: 'Navigation in the bar across the top, for small apps and for record pages.',
      specimens: [
        {
          id: 'ShellTemplateTopbarOnly',
          title: 'Top bar with centred content',
          note: 'Pick it for an app with up to four sections, where the page is one readable column.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['templates/TemplateFrame.tsx', 'templates/AppShell.tsx', 'templates/AppTopbar.tsx', 'templates/ContentContainer.tsx'],
          Component: ShellTemplateTopbarOnly,
        },
        {
          id: 'ShellTemplateTopbarTabs',
          title: 'Top bar with secondary tabs',
          note: 'Pick it for a record with several facets: the title and tabs stay put while each tab scrolls.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates/TemplateFrame.tsx',
            'templates/AppShell.tsx',
            'templates/AppTopbar.tsx',
            'templates/ContentContainer.tsx',
            'patterns/collections/DataTable.tsx',
            'patterns/structure/PropertyList.tsx',
            'industrial/ValueReadout.tsx',
          ],
          Component: ShellTemplateTopbarTabs,
        },
      ],
    },
    {
      id: 'panels',
      title: 'Multi-panel shells',
      description: 'Two or three regions that scroll on their own.',
      specimens: [
        {
          id: 'ShellTemplateThreePanel',
          title: 'Three panel',
          note: 'Pick it for exploring a hierarchy: tree on the left, the node in the middle, its properties on the right.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates/TemplateFrame.tsx',
            'templates/AppShell.tsx',
            'templates/AppTopbar.tsx',
            'industrial/operations/AssetTree.tsx',
            'patterns/structure/PropertyList.tsx',
            'patterns/collections/DataTable.tsx',
          ],
          Component: ShellTemplateThreePanel,
        },
        {
          id: 'ShellTemplateSplitScreen',
          title: 'Split screen',
          note: 'Pick it to compare two things with equal weight, or for an editor beside its preview.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates/TemplateFrame.tsx',
            'templates/AppShell.tsx',
            'templates/AppTopbar.tsx',
            'patterns/data-entry/OptionSelect.tsx',
            'industrial/Sparkline.tsx',
            'industrial/ValueReadout.tsx',
          ],
          Component: ShellTemplateSplitScreen,
        },
        {
          id: 'ShellTemplateInspector',
          title: 'Content with right inspector',
          note: 'Pick it when people check many records in a row and should not lose their place in the list.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates/TemplateFrame.tsx',
            'templates/AppShell.tsx',
            'patterns/structure/SidePanel.tsx',
            'patterns/structure/PropertyList.tsx',
            'patterns/collections/DataTable.tsx',
          ],
          Component: ShellTemplateInspector,
        },
      ],
    },
    {
      id: 'docked',
      title: 'Shells with docked regions',
      description: 'A strip or a panel that belongs to the app, not to one page.',
      specimens: [
        {
          id: 'ShellTemplateStatusBar',
          title: 'Console with status bar',
          note: 'Pick it for a control-room screen where connection state and data freshness must always be visible.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates/TemplateFrame.tsx',
            'templates/AppShell.tsx',
            'templates/AppTopbar.tsx',
            'templates/ShellStatusBar.tsx',
            'industrial/operations/SeverityBadge.tsx',
            'patterns/collections/DataTable.tsx',
          ],
          Component: ShellTemplateStatusBar,
        },
        {
          id: 'ShellTemplateAssistant',
          title: 'Docked assistant panel',
          note: 'Pick it when an assistant should read the page beside it; the top bar toggles the panel.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates/TemplateFrame.tsx',
            'templates/AppShell.tsx',
            'templates/AppTopbar.tsx',
            'patterns/product/AssistantPanel.tsx',
            'ai/ChatThread.tsx',
          ],
          Component: ShellTemplateAssistant,
        },
      ],
    },
    {
      id: 'small-screens',
      title: 'Small screens',
      description: 'What the sidebar becomes below tablet width.',
      specimens: [
        {
          id: 'ShellTemplateMobile',
          title: 'Mobile with bottom navigation',
          note: 'Pick it on phones when the app has three to five primary sections: the sidebar becomes a bottom bar.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['templates/TemplateFrame.tsx', 'templates/AppShell.tsx', 'templates/AppTopbar.tsx', 'templates/BottomNav.tsx'],
          Component: ShellTemplateMobile,
        },
      ],
    },
  ],
});
