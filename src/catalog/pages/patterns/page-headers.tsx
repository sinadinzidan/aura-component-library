import { Avatar, AvatarIcon } from '@cognite/aura/components/avatar';
import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@cognite/aura/components/dropdown-menu';
import { Progress } from '@cognite/aura/components/progress';
import { Search } from '@cognite/aura/components/search';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import { Skeleton } from '@cognite/aura/components/skeleton';
import { Tabs, TabsLabel, TabsList, TabsTrigger } from '@cognite/aura/components/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import {
  IconArrowLeft,
  IconCalendar,
  IconChevronDown,
  IconDatabase,
  IconDots,
  IconDownload,
  IconEngine,
  IconLayoutGrid,
  IconList,
  IconLock,
  IconPencil,
  IconPlayerPlay,
  IconPlus,
  IconRefresh,
  IconRoute,
  IconShare,
  IconStar,
  IconTable,
  IconTimeline,
  IconTool,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { MetadataList } from '../../../library/display/MetadataList';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { StatusBadge } from '../../../library/display/StatusBadge';
import { healthStatus, severityStatus } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { TrendDelta } from '../../../library/industrial/TrendDelta';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { CollapsingBreadcrumb } from '../../../library/navigation/CollapsingBreadcrumb';
import type { BreadcrumbTrailItem } from '../../../library/navigation/CollapsingBreadcrumb';
import { PageHeader } from '../../../library/patterns/structure/PageHeader';
import { ALARMS, ASSETS, PEOPLE, PLANT_KPIS, WORK_ORDERS } from '../../data/plant';
import { HOUR, MINUTE, REFERENCE_NOW, formatAgo, formatDate, formatDateTime } from '../../data/series';
import { definePage } from '../../types';

import source from './page-headers.tsx?raw';

const COMPRESSOR = ASSETS.find((asset) => asset.id === '23-ka-9101') ?? ASSETS[0];
const RECOMPRESSOR = ASSETS.find((asset) => asset.id === '23-ka-9103') ?? ASSETS[0];
const ORDER = WORK_ORDERS[0];
const OPERATOR = PEOPLE[0];
const PLANNER = PEOPLE[1];
const ENGINEER = PEOPLE[2];
const TECHNICIAN = PEOPLE[3];
const OPEN_ORDERS = WORK_ORDERS.filter((order) => order.status !== 'done');
const ALARM = ALARMS[1];
const ACTIVE_ALARMS = ALARMS.filter((alarm) => alarm.state === 'active');

const ASSET_TRAIL: readonly BreadcrumbTrailItem[] = [
  { id: 'assets', label: 'Assets', href: '/assets' },
  { id: 'nk-23', label: 'Gas compression', href: '/assets/nk-23' },
  { id: '23-ka-9101', label: COMPRESSOR.name },
];

const ORDER_TRAIL: readonly BreadcrumbTrailItem[] = [
  { id: 'maintenance', label: 'Maintenance', href: '/maintenance' },
  { id: 'work-orders', label: 'Work orders', href: '/maintenance/work-orders' },
  { id: 'order', label: ORDER.id },
];

const STATUS_FILTERS = ['Open', 'Planned', 'In progress', 'Waiting'];

/** Keeps the demo on the page: the trail items are real links in a product. */
const stay = () => undefined;

/** An icon-only header action with its tooltip. */
function PageHeaderIconAction({ label, onClick, children }: { label: string; onClick?: () => void; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="ghost" size="icon" aria-label={label} onClick={onClick}>
            {children}
          </Button>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/** The overflow menu that ends an action row: everything that is not worth a button. */
function PageHeaderMoreMenu({ label, children }: { label: string; children: ReactNode }) {
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" aria-label={label}>
                  <IconDots />
                </Button>
              }
            />
          }
        />
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end">{children}</DropdownMenuContent>
    </DropdownMenu>
  );
}

/** A square record icon that anchors a record header. */
function PageHeaderRecordIcon({ children }: { children: ReactNode }) {
  return (
    <Avatar variant="overflow" aria-hidden="true">
      <AvatarIcon>{children}</AvatarIcon>
    </Avatar>
  );
}

/** One figure of a KPI strip: label, value and change, separated from its neighbour by a rule. */
function PageHeaderStat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 border-l border-default pl-4 first:border-l-0 first:pl-0">
      <span className="truncate text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function PageHeaderTitleAndDescription() {
  return (
    <PageHeader
      title="Work orders"
      description="Corrective, preventive and inspection work for the Nordkapp plant, planned and in progress."
    />
  );
}

function PageHeaderWithActions() {
  return (
    <PageHeader
      title="Work orders"
      description={`${OPEN_ORDERS.length} open across 4 areas`}
      actions={
        <>
          <Button variant="secondary">
            <IconDownload /> Export list
          </Button>
          <Button>
            <IconPlus /> Create work order
          </Button>
          <PageHeaderMoreMenu label="More work order actions">
            <DropdownMenuItem>Import from file</DropdownMenuItem>
            <DropdownMenuItem>Manage templates</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View archived work orders</DropdownMenuItem>
          </PageHeaderMoreMenu>
        </>
      }
    />
  );
}

function PageHeaderWithBreadcrumb() {
  return (
    <PageHeader
      breadcrumb={<CollapsingBreadcrumb items={ASSET_TRAIL} onNavigate={stay} />}
      title={COMPRESSOR.name}
      description="Low-pressure stage of compression train 1, driven by the compressor gas turbine."
    />
  );
}

function PageHeaderWithBack() {
  return (
    <PageHeader
      leading={
        <PageHeaderIconAction label="Back to work orders">
          <IconArrowLeft />
        </PageHeaderIconAction>
      }
      title="Create work order"
      description="Describe the job and pick the asset. You can plan and assign it afterwards."
    />
  );
}

function PageHeaderWithStatus() {
  return (
    <PageHeader
      title={RECOMPRESSOR.name}
      status={<StatusBadge status={RECOMPRESSOR.state} />}
      description={`${RECOMPRESSOR.tag} · Tripped on high vibration at 13:46. Isolated for bearing inspection.`}
      actions={<Button variant="secondary">View alarm</Button>}
    />
  );
}

function PageHeaderWithMetadata() {
  return (
    <PageHeader
      title={COMPRESSOR.name}
      status={<StatusBadge status={COMPRESSOR.state} />}
      meta={
        <MetadataList
          layout="inline"
          items={[
            { label: 'Tag', value: COMPRESSOR.tag },
            { label: 'Criticality', value: COMPRESSOR.criticality },
            { label: 'Area', value: 'Gas compression' },
            { label: 'Health', value: `${COMPRESSOR.healthScore} / 100` },
          ]}
        />
      }
    />
  );
}

function PageHeaderWithOwner() {
  return (
    <PageHeader
      leading={<PersonAvatar name={PLANNER.name} />}
      title="Turnaround plan 2026"
      meta={
        <p className="text-sm text-muted-foreground">
          Owned by <span className="font-medium text-base-foreground">{PLANNER.name}</span> · {PLANNER.role} · Edited{' '}
          {formatAgo(REFERENCE_NOW - 3 * HOUR)}
        </p>
      }
      actions={
        <Button variant="secondary">
          <IconShare /> Share plan
        </Button>
      }
    />
  );
}

function PageHeaderLastUpdated() {
  const [refreshes, setRefreshes] = useState(0);
  const updated = refreshes === 0 ? formatAgo(REFERENCE_NOW - 4 * MINUTE) : 'just now';

  return (
    <PageHeader
      title="Active alarms"
      description={`${ACTIVE_ALARMS.length} active, 2 acknowledged`}
      actions={
        <>
          <span role="status" className="text-sm text-muted-foreground">
            Updated {updated}
          </span>
          <PageHeaderIconAction label="Refresh alarms" onClick={() => setRefreshes((count) => count + 1)}>
            <IconRefresh />
          </PageHeaderIconAction>
        </>
      }
    />
  );
}

function PageHeaderWithTabs() {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <PageHeader
        title={COMPRESSOR.name}
        description={COMPRESSOR.tag}
        actions={<Button>Create work order</Button>}
        tabs={
          <TabsList size="default" showSeparator className="w-full">
            <TabsTrigger value="overview">
              <TabsLabel>Overview</TabsLabel>
            </TabsTrigger>
            <TabsTrigger value="sensors" badge="6">
              <TabsLabel>Sensors</TabsLabel>
            </TabsTrigger>
            <TabsTrigger value="alarms" badge="2">
              <TabsLabel>Alarms</TabsLabel>
            </TabsTrigger>
            <TabsTrigger value="work-orders" badge="1">
              <TabsLabel>Work orders</TabsLabel>
            </TabsTrigger>
            <TabsTrigger value="documents">
              <TabsLabel>Documents</TabsLabel>
            </TabsTrigger>
          </TabsList>
        }
      />
    </Tabs>
  );
}

function PageHeaderSegmentedView() {
  return (
    <PageHeader
      title="Assets"
      description="16 assets in 4 areas"
      divider
      actions={
        <SegmentedControl defaultValue="list">
          <SegmentedControlList aria-label="Asset view">
            <SegmentedControlButton value="list">
              <IconList /> List
            </SegmentedControlButton>
            <SegmentedControlButton value="grid">
              <IconLayoutGrid /> Grid
            </SegmentedControlButton>
            <SegmentedControlButton value="table">
              <IconTable /> Table
            </SegmentedControlButton>
          </SegmentedControlList>
        </SegmentedControl>
      }
    />
  );
}

function PageHeaderSearchAndFilters() {
  const [statuses, setStatuses] = useState<readonly string[]>(['Open', 'In progress']);
  const toggle = (status: string) =>
    setStatuses((current) => (current.includes(status) ? current.filter((value) => value !== status) : [...current, status]));

  return (
    <PageHeader
      title="Work orders"
      description={`${OPEN_ORDERS.length} open across 4 areas`}
      divider
      actions={
        <Button>
          <IconPlus /> Create work order
        </Button>
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <Search aria-label="Search work orders" placeholder="Search by title, ID or asset" className="w-full max-w-xs" />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline">
                Status <Badge variant="secondary">{statuses.length}</Badge> <IconChevronDown />
              </Button>
            }
          />
          <DropdownMenuContent>
            {STATUS_FILTERS.map((status) => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={statuses.includes(status)}
                closeOnClick={false}
                onCheckedChange={() => toggle(status)}
              >
                {status}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline">
          Priority <IconChevronDown />
        </Button>
        <Button variant="outline">
          <IconCalendar /> Due this week
        </Button>
        <Button variant="ghost" onClick={() => setStatuses([])}>
          Clear filters
        </Button>
      </div>
    </PageHeader>
  );
}

function PageHeaderCompact() {
  return (
    <PageHeader
      size="compact"
      as="h2"
      title="Shift handover"
      meta={<p className="text-xs text-muted-foreground">Day shift · {formatDate(REFERENCE_NOW)}</p>}
      actions={
        <Button size="sm" variant="secondary">
          Add note
        </Button>
      }
    />
  );
}

function PageHeaderAsset() {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <PageHeader
        breadcrumb={<CollapsingBreadcrumb items={ASSET_TRAIL} onNavigate={stay} />}
        leading={
          <PageHeaderRecordIcon>
            <IconEngine />
          </PageHeaderRecordIcon>
        }
        title={COMPRESSOR.name}
        status={<StatusBadge status={COMPRESSOR.state} />}
        meta={
          <MetadataList
            layout="inline"
            items={[
              { label: 'Tag', value: COMPRESSOR.tag },
              { label: 'Criticality', value: COMPRESSOR.criticality },
              { label: 'Health', value: <StatusIndicator {...healthStatus(COMPRESSOR.health)} detail={`${COMPRESSOR.healthScore} / 100`} /> },
              { label: 'Last inspection', value: formatDate(REFERENCE_NOW - 41 * 24 * HOUR) },
            ]}
          />
        }
        actions={
          <>
            <PageHeaderIconAction label="Add to favourites">
              <IconStar />
            </PageHeaderIconAction>
            <Button variant="secondary">
              <IconTimeline /> Open trend
            </Button>
            <Button>
              <IconTool /> Create work order
            </Button>
            <PageHeaderMoreMenu label={`More actions for ${COMPRESSOR.tag}`}>
              <DropdownMenuItem>Copy link to asset</DropdownMenuItem>
              <DropdownMenuItem>Show in hierarchy</DropdownMenuItem>
              <DropdownMenuItem>Export readings</DropdownMenuItem>
            </PageHeaderMoreMenu>
          </>
        }
        tabs={
          <TabsList size="default" showSeparator className="w-full">
            <TabsTrigger value="overview">
              <TabsLabel>Overview</TabsLabel>
            </TabsTrigger>
            <TabsTrigger value="sensors" badge="6">
              <TabsLabel>Sensors</TabsLabel>
            </TabsTrigger>
            <TabsTrigger value="alarms" badge="2">
              <TabsLabel>Alarms</TabsLabel>
            </TabsTrigger>
            <TabsTrigger value="maintenance">
              <TabsLabel>Maintenance</TabsLabel>
            </TabsTrigger>
            <TabsTrigger value="documents">
              <TabsLabel>Documents</TabsLabel>
            </TabsTrigger>
          </TabsList>
        }
      />
    </Tabs>
  );
}

function PageHeaderWorkOrder() {
  return (
    <PageHeader
      breadcrumb={<CollapsingBreadcrumb items={ORDER_TRAIL} onNavigate={stay} />}
      title={ORDER.title}
      status={<StatusBadge status={ORDER.status} />}
      meta={
        <MetadataList
          layout="inline"
          items={[
            { label: 'Priority', value: ORDER.priority },
            { label: 'Asset', value: RECOMPRESSOR.tag },
            { label: 'Assignee', value: TECHNICIAN.name },
            { label: 'Due', value: formatDateTime(ORDER.dueAt) },
          ]}
        />
      }
      actions={
        <>
          <Button variant="secondary">Reassign</Button>
          <Button>Complete work order</Button>
        </>
      }
    />
  );
}

function PageHeaderPipeline() {
  return (
    <PageHeader
      leading={
        <PageHeaderRecordIcon>
          <IconRoute />
        </PageHeaderRecordIcon>
      }
      title="Work order sync"
      status={<Badge variant="success">Healthy</Badge>}
      meta={
        <MetadataList
          layout="inline"
          items={[
            { label: 'Schedule', value: 'Every 15 min' },
            { label: 'Last run', value: formatAgo(REFERENCE_NOW - 6 * MINUTE) },
            { label: 'Rows', value: <span className="tabular-nums">1,284</span> },
          ]}
        />
      }
      actions={
        <>
          <Button variant="secondary">
            <IconPlayerPlay /> Run now
          </Button>
          <PageHeaderMoreMenu label="More pipeline actions">
            <DropdownMenuItem>Edit schedule</DropdownMenuItem>
            <DropdownMenuItem>View run history</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Delete pipeline</DropdownMenuItem>
          </PageHeaderMoreMenu>
        </>
      }
    />
  );
}

function PageHeaderDataSet() {
  return (
    <PageHeader
      leading={
        <PageHeaderRecordIcon>
          <IconDatabase />
        </PageHeaderRecordIcon>
      }
      title="Nordkapp process historian"
      status={<Badge variant="archived">Write-protected</Badge>}
      description="Time series from the plant historian, refreshed every minute. Source of truth for process values."
      meta={
        <MetadataList
          layout="inline"
          items={[
            { label: 'Time series', value: <span className="tabular-nums">4,812</span> },
            { label: 'Owner', value: ENGINEER.name },
          ]}
        />
      }
    />
  );
}

function PageHeaderPerson() {
  return (
    <PageHeader
      leading={<PersonAvatar name={OPERATOR.name} />}
      title={OPERATOR.name}
      status={<Badge variant="success">On shift</Badge>}
      description={`${OPERATOR.role} · Nordkapp control room`}
      actions={
        <>
          <Button variant="secondary">Send message</Button>
          <PageHeaderMoreMenu label={`More actions for ${OPERATOR.name}`}>
            <DropdownMenuItem>View shift schedule</DropdownMenuItem>
            <DropdownMenuItem>Edit permissions</DropdownMenuItem>
          </PageHeaderMoreMenu>
        </>
      }
    />
  );
}

function PageHeaderAlarm() {
  return (
    <PageHeader
      title={ALARM.message}
      meta={
        <MetadataList
          layout="inline"
          items={[
            { label: 'Severity', value: <StatusIndicator {...severityStatus(ALARM.severity)} /> },
            { label: 'Tag', value: ALARM.sensorTag },
            { label: 'Value', value: <span className="tabular-nums">{ALARM.value}</span> },
            { label: 'Limit', value: <span className="tabular-nums">{ALARM.limit}</span> },
            { label: 'Raised', value: formatAgo(ALARM.raisedAt) },
          ]}
        />
      }
      actions={<Button>Acknowledge</Button>}
    />
  );
}

function PageHeaderEditing() {
  const [editing, setEditing] = useState(true);

  return (
    <PageHeader
      title="Compression overview"
      status={editing ? <Badge variant="warning">Editing</Badge> : null}
      meta={
        <p className="text-sm text-muted-foreground">
          {editing ? '3 unsaved changes · Draft kept until you save or discard' : `Saved ${formatDateTime(REFERENCE_NOW)}`}
        </p>
      }
      divider
      actions={
        editing ? (
          <>
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Discard changes
            </Button>
            <Button onClick={() => setEditing(false)}>Save dashboard</Button>
          </>
        ) : (
          <Button variant="secondary" onClick={() => setEditing(true)}>
            <IconPencil /> Edit dashboard
          </Button>
        )
      }
    />
  );
}

function PageHeaderReadOnly() {
  return (
    <PageHeader
      title="Alarm limits"
      status={
        <Badge variant="archived">
          <IconLock aria-hidden="true" /> Read-only
        </Badge>
      }
      description="Gas compression limits are managed in the safety system. Ask a shift supervisor to request a change."
      actions={
        <Tooltip>
          <TooltipTrigger
            render={
              <span tabIndex={0} className="rounded-lg outline-none focus-visible:shadow-focus-ring">
                <Button variant="secondary" disabled>
                  <IconPencil /> Edit limits
                </Button>
              </span>
            }
          />
          <TooltipContent>Only shift supervisors can edit alarm limits</TooltipContent>
        </Tooltip>
      }
    />
  );
}

function PageHeaderLongTitle() {
  return (
    <PageHeader
      breadcrumb={<CollapsingBreadcrumb items={ORDER_TRAIL} onNavigate={stay} />}
      title="Replace drive-end bearing and realign coupling on recompressor after high vibration trip"
      status={<StatusBadge status="planned" />}
      actions={<Button>Start work</Button>}
    />
  );
}

function PageHeaderLoading() {
  return (
    <div aria-busy="true" aria-label="Loading asset" className="flex w-full flex-col gap-4">
      <Skeleton className="h-4 w-48" />
      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>
    </div>
  );
}

function PageHeaderWizardStep() {
  return (
    <PageHeader
      leading={
        <PageHeaderIconAction label="Back to data source">
          <IconArrowLeft />
        </PageHeaderIconAction>
      }
      title="Map columns"
      description="Match the columns in the file to work order fields."
      actions={<span className="text-sm text-muted-foreground tabular-nums">Step 2 of 4</span>}
    >
      <Progress value={50} size="sm" aria-label="Import progress, step 2 of 4" />
    </PageHeader>
  );
}

function PageHeaderSticky() {
  return (
    <div className="h-72 w-full overflow-y-auto rounded-xl border border-default">
      <div className="sticky top-0 z-10 border-b border-default bg-base-background px-4 py-3">
        <PageHeader
          size="compact"
          as="h2"
          title={COMPRESSOR.name}
          status={<StatusBadge status={COMPRESSOR.state} />}
          actions={
            <>
              <Button size="sm" variant="secondary">
                Open trend
              </Button>
              <Button size="sm">Create work order</Button>
            </>
          }
        />
      </div>
      <ul className="flex flex-col gap-4 p-4">
        {WORK_ORDERS.map((order) => (
          <li key={order.id} className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-base-foreground">{order.title}</p>
              <p className="text-xs text-muted-foreground">
                {order.id} · Due {formatDate(order.dueAt)}
              </p>
            </div>
            <StatusBadge status={order.status} outline />
          </li>
        ))}
      </ul>
    </div>
  );
}

function PageHeaderKpiStrip() {
  const kpi = PLANT_KPIS;

  return (
    <PageHeader
      title="Nordkapp plant"
      status={<StatusBadge status="running" />}
      description="Gas processing, Norwegian Sea. Two of three compression trains in operation."
      divider
      actions={
        <>
          <Button variant="secondary">
            <IconCalendar /> Last 24 hours <IconChevronDown />
          </Button>
          <Button>Open handover</Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-4">
        <PageHeaderStat label="Availability">
          <ValueReadout value={kpi.availability.value} unit="%" decimals={1} />
          <TrendDelta value={kpi.availability.value} reference={kpi.availability.previous} goodDirection="up" decimals={1} caption="vs last week" size="sm" />
        </PageHeaderStat>
        <PageHeaderStat label="Gas export">
          <ValueReadout value={kpi.gasExport.value} unit={kpi.gasExport.unit} decimals={2} />
          <TrendDelta value={kpi.gasExport.value} reference={kpi.gasExport.previous} goodDirection="up" decimals={2} caption="vs yesterday" size="sm" />
        </PageHeaderStat>
        <PageHeaderStat label="Active alarms">
          <ValueReadout value={kpi.activeAlarms.value} />
          <TrendDelta value={kpi.activeAlarms.value} reference={kpi.activeAlarms.previous} goodDirection="down" decimals={0} caption="vs yesterday" size="sm" />
        </PageHeaderStat>
        <PageHeaderStat label="Open work orders">
          <ValueReadout value={kpi.openWorkOrders.value} />
          <TrendDelta value={kpi.openWorkOrders.value} reference={kpi.openWorkOrders.previous} goodDirection="down" decimals={0} caption="vs last week" size="sm" />
        </PageHeaderStat>
      </div>
    </PageHeader>
  );
}

function PageHeaderDashboard() {
  const [refreshes, setRefreshes] = useState(0);

  return (
    <Tabs defaultValue="process" className="w-full">
      <PageHeader
        breadcrumb={
          <CollapsingBreadcrumb
            items={[
              { id: 'dashboards', label: 'Dashboards', href: '/dashboards' },
              { id: 'compression', label: 'Compression overview' },
            ]}
            onNavigate={stay}
          />
        }
        title="Compression overview"
        meta={
          <p className="text-sm text-muted-foreground">
            Owned by <span className="font-medium text-base-foreground">{ENGINEER.name}</span> · Shared with Operations
          </p>
        }
        actions={
          <>
            <span role="status" className="text-sm text-muted-foreground">
              Updated {refreshes === 0 ? formatAgo(REFERENCE_NOW - 2 * MINUTE) : 'just now'}
            </span>
            <PageHeaderIconAction label="Refresh dashboard" onClick={() => setRefreshes((count) => count + 1)}>
              <IconRefresh />
            </PageHeaderIconAction>
            <Button variant="secondary">
              <IconCalendar /> Last 24 hours <IconChevronDown />
            </Button>
            <Button variant="secondary">
              <IconShare /> Share
            </Button>
            <Button>
              <IconPencil /> Edit dashboard
            </Button>
          </>
        }
        tabs={
          <TabsList size="default" showSeparator className="w-full">
            <TabsTrigger value="process">
              <TabsLabel>Process</TabsLabel>
            </TabsTrigger>
            <TabsTrigger value="condition">
              <TabsLabel>Condition</TabsLabel>
            </TabsTrigger>
            <TabsTrigger value="energy">
              <TabsLabel>Energy</TabsLabel>
            </TabsTrigger>
          </TabsList>
        }
      />
    </Tabs>
  );
}

export default definePage({
  id: 'page-headers',
  title: 'Page headers',
  summary:
    'The top of a page: where you are, what you are looking at and what you can do, in that order. One skeleton with slots covers list pages, record pages, dashboards and editors.',
  guidance: {
    use: [
      'Once per page, above the content, with the title as the page heading.',
      'One primary action at most; everything rare goes in the overflow menu.',
      'Status as one badge on the title line; facts as a quiet metadata row.',
      'Tabs or a view switch as the last row, so the header stays put while views change.',
    ],
    avoid: [
      'A breadcrumb and a back button together. Pick the one that matches the navigation.',
      'Repeating global navigation, or app-wide actions, inside the header.',
      'More than five metadata facts. Move the rest to a properties panel.',
      'Filters that only apply to one table. Put those in that table’s toolbar.',
    ],
  },
  source,
  sections: [
    {
      id: 'basics',
      title: 'Basics',
      description: 'A title, then one addition at a time.',
      specimens: [
        {
          id: 'PageHeaderTitleAndDescription',
          title: 'Title and description',
          note: 'The default for a top-level list page where the title alone does not say what is listed.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/PageHeader.tsx'],
          Component: PageHeaderTitleAndDescription,
        },
        {
          id: 'PageHeaderWithBreadcrumb',
          title: 'With breadcrumb',
          note: 'For a page inside a hierarchy, when the shell topbar does not already show the trail.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/PageHeader.tsx', 'navigation/CollapsingBreadcrumb.tsx'],
          Component: PageHeaderWithBreadcrumb,
        },
        {
          id: 'PageHeaderWithActions',
          title: 'With actions',
          note: 'When the page has one main thing to do, one or two secondary actions and a few rare ones.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['patterns/structure/PageHeader.tsx'],
          Component: PageHeaderWithActions,
        },
        {
          id: 'PageHeaderWithBack',
          title: 'With back navigation',
          note: 'For a task that was entered from one place and returns to it, such as a create form.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['patterns/structure/PageHeader.tsx'],
          Component: PageHeaderWithBack,
        },
      ],
    },
    {
      id: 'status-and-metadata',
      title: 'Status and metadata',
      description: 'What state the thing is in, who owns it and how fresh it is.',
      specimens: [
        {
          id: 'PageHeaderWithStatus',
          title: 'With status badge',
          note: 'When the state of the record changes what people do next.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/PageHeader.tsx', 'display/StatusBadge.tsx'],
          Component: PageHeaderWithStatus,
        },
        {
          id: 'PageHeaderWithMetadata',
          title: 'With metadata row',
          note: 'For the three to five facts people check before reading anything else.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/PageHeader.tsx', 'display/MetadataList.tsx', 'display/StatusBadge.tsx'],
          Component: PageHeaderWithMetadata,
        },
        {
          id: 'PageHeaderWithOwner',
          title: 'With owner',
          note: 'For documents and plans, where who owns it and when it changed matter more than a status.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/PageHeader.tsx', 'display/PersonAvatar.tsx'],
          Component: PageHeaderWithOwner,
        },
        {
          id: 'PageHeaderLastUpdated',
          title: 'Last updated and refresh',
          note: 'For live lists that do not stream, so people can see how old the data is and reload it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/PageHeader.tsx'],
          Component: PageHeaderLastUpdated,
        },
      ],
    },
    {
      id: 'views-and-filters',
      title: 'Views and filters',
      description: 'Controls that change what the whole page shows close the header.',
      specimens: [
        {
          id: 'PageHeaderWithTabs',
          title: 'With tabs',
          note: 'When the page has several sub-pages about the same record.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/PageHeader.tsx'],
          Component: PageHeaderWithTabs,
        },
        {
          id: 'PageHeaderSegmentedView',
          title: 'With view switch',
          note: 'When the same items can be shown in two or three layouts.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/PageHeader.tsx'],
          Component: PageHeaderSegmentedView,
        },
        {
          id: 'PageHeaderSearchAndFilters',
          title: 'With search and filters',
          note: 'For a list page where search and filters apply to everything below the header.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['patterns/structure/PageHeader.tsx'],
          Component: PageHeaderSearchAndFilters,
        },
        {
          id: 'PageHeaderCompact',
          title: 'Compact',
          note: 'Inside a panel, a dialog-sized page or a split view where height is short.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['patterns/structure/PageHeader.tsx'],
          Component: PageHeaderCompact,
        },
      ],
    },
    {
      id: 'record-headers',
      title: 'Record headers',
      description: 'The same skeleton filled in for the records an industrial product is made of.',
      specimens: [
        {
          id: 'PageHeaderAsset',
          title: 'Asset',
          note: 'The full record header: trail, icon, state, key facts, actions and sub-pages.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: [
            'patterns/structure/PageHeader.tsx',
            'navigation/CollapsingBreadcrumb.tsx',
            'display/MetadataList.tsx',
            'display/StatusBadge.tsx',
            'industrial/StatusIndicator.tsx',
          ],
          Component: PageHeaderAsset,
        },
        {
          id: 'PageHeaderWorkOrder',
          title: 'Work order',
          note: 'When the title is a sentence and the next step in the workflow is the primary action.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/structure/PageHeader.tsx', 'navigation/CollapsingBreadcrumb.tsx', 'display/MetadataList.tsx', 'display/StatusBadge.tsx'],
          Component: PageHeaderWorkOrder,
        },
        {
          id: 'PageHeaderPipeline',
          title: 'Pipeline',
          note: 'For something that runs on a schedule: health, cadence, last run and a way to run it now.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/PageHeader.tsx', 'display/MetadataList.tsx'],
          Component: PageHeaderPipeline,
        },
        {
          id: 'PageHeaderDataSet',
          title: 'Data set',
          note: 'For a container of data, where a description and its size say more than a status.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/PageHeader.tsx', 'display/MetadataList.tsx'],
          Component: PageHeaderDataSet,
        },
        {
          id: 'PageHeaderPerson',
          title: 'Person',
          note: 'For a profile page: the avatar replaces the record icon and the role replaces the description.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/PageHeader.tsx', 'display/PersonAvatar.tsx'],
          Component: PageHeaderPerson,
        },
        {
          id: 'PageHeaderAlarm',
          title: 'Alarm',
          note: 'For an event that needs a response: severity, the reading against its limit and the one action.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/PageHeader.tsx', 'display/MetadataList.tsx', 'industrial/StatusIndicator.tsx'],
          Component: PageHeaderAlarm,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'What the header does while editing, loading, locked or short of room.',
      specimens: [
        {
          id: 'PageHeaderEditing',
          title: 'Editing mode',
          note: 'While a page is being edited in place: say so, and swap the actions for save and discard.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['patterns/structure/PageHeader.tsx'],
          Component: PageHeaderEditing,
        },
        {
          id: 'PageHeaderLoading',
          title: 'Loading',
          note: 'While the record loads, hold the header’s shape so the page does not jump when it arrives.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          Component: PageHeaderLoading,
        },
        {
          id: 'PageHeaderReadOnly',
          title: 'Read-only',
          note: 'When the viewer cannot change the page: keep the action visible and explain who can.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/PageHeader.tsx'],
          Component: PageHeaderReadOnly,
        },
        {
          id: 'PageHeaderLongTitle',
          title: 'Long title',
          note: 'Titles truncate on one line so the actions never move; the full text belongs in the content.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/PageHeader.tsx', 'navigation/CollapsingBreadcrumb.tsx', 'display/StatusBadge.tsx'],
          Component: PageHeaderLongTitle,
        },
      ],
    },
    {
      id: 'rich-headers',
      title: 'Rich headers',
      description: 'Headers that carry a band of their own or stay in view while the page scrolls.',
      specimens: [
        {
          id: 'PageHeaderWizardStep',
          title: 'Step in a flow',
          note: 'For one step of a multi-step task: back, where you are and how far there is to go.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/PageHeader.tsx'],
          Component: PageHeaderWizardStep,
        },
        {
          id: 'PageHeaderSticky',
          title: 'Sticky compact header',
          note: 'On long record pages, so the name, state and main action stay in reach. Scroll the list to try.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/PageHeader.tsx', 'display/StatusBadge.tsx'],
          Component: PageHeaderSticky,
        },
        {
          id: 'PageHeaderKpiStrip',
          title: 'With KPI strip',
          note: 'For a site or area landing page, where four figures answer most visits before any scrolling.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: [
            'patterns/structure/PageHeader.tsx',
            'display/StatusBadge.tsx',
            'industrial/ValueReadout.tsx',
            'industrial/TrendDelta.tsx',
          ],
          Component: PageHeaderKpiStrip,
        },
        {
          id: 'PageHeaderDashboard',
          title: 'Dashboard header',
          note: 'Everything a dashboard needs up top: freshness, time range, sharing, editing and its pages.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/structure/PageHeader.tsx', 'navigation/CollapsingBreadcrumb.tsx'],
          Component: PageHeaderDashboard,
        },
      ],
    },
  ],
});
