import { Alert, AlertActions, AlertButton, AlertDescription, AlertTitle } from '@cognite/aura/components/alert';
import { Badge } from '@cognite/aura/components/badge';
import { Banner, BannerAction, BannerActions, BannerIcon, BannerTitle } from '@cognite/aura/components/banner';
import { Button } from '@cognite/aura/components/button';
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from '@cognite/aura/components/empty-state';
import { Input } from '@cognite/aura/components/input';
import { Search } from '@cognite/aura/components/search';
import { Skeleton } from '@cognite/aura/components/skeleton';
import {
  IconAlarm,
  IconArchive,
  IconBarrierBlock,
  IconBinaryTree,
  IconChartLine,
  IconCircleCheck,
  IconExternalLink,
  IconLayoutDashboard,
  IconPlus,
  IconRefresh,
  IconTool,
  IconWifiOff,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { AsyncButton } from '../../../library/actions/AsyncButton';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { StatusBadge } from '../../../library/display/StatusBadge';
import { RetryBlock } from '../../../library/feedback/RetryBlock';
import { SkeletonTable } from '../../../library/feedback/SkeletonTable';
import { SkeletonText } from '../../../library/feedback/SkeletonText';
import { FormField } from '../../../library/forms/FormField';
import { Sparkline } from '../../../library/industrial/Sparkline';
import { ErrorPage } from '../../../library/patterns/states/ErrorPage';
import { PageHeader } from '../../../library/patterns/structure/PageHeader';
import { PropertyList } from '../../../library/patterns/structure/PropertyList';
import type { SidebarNavGroup } from '../../../library/patterns/structure/SidebarNav';
import { PageFrame } from '../../../library/templates-b/PageFrame';
import { ShellPage } from '../../../library/templates-b/ShellPage';
import { ALARMS, ASSETS, PEOPLE, PLANT_KPIS, SENSORS, WORK_ORDERS, findAsset, findPerson } from '../../data/plant';
import { formatAgo, formatDate, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './state-pages.tsx?raw';

const STATE_USER = PEOPLE[0];
const STATE_COMPRESSOR = ASSETS[8];
const STATE_ORDERS = WORK_ORDERS.slice(0, 6);
const STATE_ORDER = WORK_ORDERS[6];
const STATE_SENSORS = SENSORS.filter((sensor) => sensor.assetId === STATE_COMPRESSOR.id).slice(0, 4);
const STATE_ALARMS = ALARMS.filter((alarm) => alarm.state === 'active').slice(0, 3);
const STATE_EXPORT = makeValues({ seed: 61, points: 30, base: 4.3, amplitude: 0.08, noise: 0.04, drift: 0.1, decimals: 2 });
const STATE_ORDER_COLUMNS = ['Work order', 'Title', 'Equipment', 'Status', 'Due'];
const STATE_DETAIL_FIELDS = ['Tag', 'Type', 'State', 'Criticality', 'Parent', 'Health score'] as const;

const STATE_NAV: readonly SidebarNavGroup[] = [
  {
    id: 'main',
    items: [
      { id: 'overview', label: 'Overview', icon: <IconLayoutDashboard /> },
      { id: 'alarms', label: 'Alarms', icon: <IconAlarm />, count: PLANT_KPIS.activeAlarms.value },
      { id: 'assets', label: 'Assets', icon: <IconBinaryTree /> },
      { id: 'trends', label: 'Trends', icon: <IconChartLine /> },
      { id: 'orders', label: 'Work orders', icon: <IconTool />, count: PLANT_KPIS.openWorkOrders.value },
    ],
  },
];

const STATE_NAV_DISABLED: readonly SidebarNavGroup[] = STATE_NAV.map((group) => ({
  ...group,
  items: group.items.map((item) => ({ ...item, count: undefined, disabled: true })),
}));

const STATE_NEARBY = [
  { id: 'n1', title: 'Gas compression overview', detail: 'Dashboard · opened 2 h ago' },
  { id: 'n2', title: 'Alarm performance', detail: 'Dashboard · opened yesterday' },
  { id: 'n3', title: 'All dashboards', detail: '14 dashboards' },
];

const stateWait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/** The shell every state on this page sits in, so only the content area differs. */
function StateShell({
  activeId,
  trail,
  banner,
  center = false,
  collapsed = false,
  nav = STATE_NAV,
  children,
}: {
  activeId: string;
  trail: readonly string[];
  banner?: ReactNode;
  center?: boolean;
  collapsed?: boolean;
  nav?: readonly SidebarNavGroup[];
  children: ReactNode;
}) {
  return (
    <ShellPage
      product="Nordkapp"
      nav={nav}
      activeId={activeId}
      collapsed={collapsed}
      trail={trail}
      banner={banner}
      contentAlign={center ? 'center' : 'start'}
      topbarEnd={<PersonAvatar name={STATE_USER.name} sizes="xsm" />}
    >
      {children}
    </ShellPage>
  );
}

function StateOrderTable({ orders }: { orders: readonly (typeof WORK_ORDERS)[number][] }) {
  return (
    <table className="w-full text-left text-sm">
      <caption className="sr-only">Work orders</caption>
      <thead>
        <tr className="border-b border-default text-xs text-muted-foreground">
          {STATE_ORDER_COLUMNS.map((column) => (
            <th key={column} className="py-2 pr-4 font-medium whitespace-nowrap last:pr-0">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr key={order.id} className="border-b border-default last:border-b-0">
            <td className="py-2 pr-4 font-mono text-xs whitespace-nowrap text-muted-foreground">{order.id}</td>
            <td className="w-full max-w-0 truncate py-2 pr-4 text-base-foreground">{order.title}</td>
            <td className="py-2 pr-4 font-mono text-xs whitespace-nowrap text-muted-foreground">{findAsset(order.assetId)?.tag}</td>
            <td className="py-2 pr-4">
              <StatusBadge status={order.status} outline />
            </td>
            <td className="py-2 whitespace-nowrap tabular-nums text-muted-foreground">{formatDate(order.dueAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function StateTemplateLoadingList() {
  const [loaded, setLoaded] = useState(false);

  return (
    <PageFrame title="Page loading, list" address="nordkapp.example/work-orders">
      <StateShell activeId="orders" trail={['Maintenance', 'Work orders']}>
        <div className="flex w-full flex-col gap-4" aria-busy={!loaded}>
          <PageHeader
            as="h1"
            title="Work orders"
            description={loaded ? `${PLANT_KPIS.openWorkOrders.value} open, 1 overdue` : 'Loading work orders…'}
            actions={
              <Button variant="ghost" size="sm" onClick={() => setLoaded(!loaded)}>
                {loaded ? 'Show loading state' : 'Show loaded page'}
              </Button>
            }
          />
          {loaded ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <div className="w-full max-w-xs">
                  <Search aria-label="Search work orders" placeholder="Search work orders" />
                </div>
                <Button size="sm">
                  <IconPlus /> Create work order
                </Button>
              </div>
              <StateOrderTable orders={STATE_ORDERS} />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-9 w-full max-w-xs" />
                <Skeleton className="h-8 w-40" />
              </div>
              <SkeletonTable rows={6} columns={STATE_ORDER_COLUMNS} label="Loading work orders" />
            </>
          )}
        </div>
      </StateShell>
    </PageFrame>
  );
}

function StateTemplateLoadingDetail() {
  return (
    <PageFrame title="Page loading, detail" address="nordkapp.example/assets/23-KA-9101">
      <StateShell activeId="assets" collapsed trail={['Assets', 'Gas compression', STATE_COMPRESSOR.tag]}>
        <div role="status" aria-label="Loading asset" className="grid w-full grid-cols-1 gap-8 @3xl:grid-cols-3">
          <div className="flex flex-col gap-6 @3xl:col-span-2">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 shrink-0" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-6 w-56" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
            <div className="flex gap-4 border-b border-default pb-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex gap-3">
              <div className="flex flex-col justify-between py-1">
                <Skeleton className="h-3 w-6" />
                <Skeleton className="h-3 w-6" />
                <Skeleton className="h-3 w-6" />
              </div>
              <Skeleton className="h-44 flex-1" />
            </div>
            <SkeletonText lines={3} label={null} />
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-xs font-medium text-muted-foreground">Properties</span>
            <dl className="flex flex-col gap-4">
              {STATE_DETAIL_FIELDS.map((field, index) => (
                <div key={field} className="flex flex-col gap-2">
                  <dt className="text-xs text-muted-foreground">{field}</dt>
                  <dd>
                    <Skeleton className={`h-4 ${index % 2 === 0 ? 'w-28' : 'w-16'}`} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </StateShell>
    </PageFrame>
  );
}

function StateTemplateFirstUse() {
  return (
    <PageFrame title="First-use empty page" address="nordkapp.example/alarm-rules">
      <StateShell activeId="alarms" trail={['Alarms', 'Alarm rules']}>
        <div className="flex w-full flex-1 flex-col gap-4">
          <PageHeader as="h1" title="Alarm rules" description="Rules decide which limits raise an alarm and who is told." />
          <div className="flex flex-1 items-center justify-center">
            <EmptyState variant="full" type="new-object">
              <EmptyStateIcon />
              <div className="flex flex-col gap-2">
                <EmptyStateTitle as="h2">No alarm rules yet</EmptyStateTitle>
                <EmptyStateDescription>Create a rule to be notified when a sensor crosses a limit. Start from a tag or from a template.</EmptyStateDescription>
              </div>
              <EmptyStateActions className="flex-row">
                <Button>
                  <IconPlus /> Create alarm rule
                </Button>
                <Button variant="ghost" render={<a href="https://docs.cognite.com/cdf/" target="_blank" rel="noreferrer" />}>
                  Read the guide <IconExternalLink />
                </Button>
              </EmptyStateActions>
            </EmptyState>
          </div>
        </div>
      </StateShell>
    </PageFrame>
  );
}

function StateTemplateNoResults() {
  const [query, setQuery] = useState('gearbox');
  const [openOnly, setOpenOnly] = useState(true);
  const term = query.trim().toLowerCase();
  const matches = STATE_ORDERS.filter(
    (order) => (!openOnly || order.status === 'open') && `${order.id} ${order.title}`.toLowerCase().includes(term)
  );
  const clear = () => {
    setQuery('');
    setOpenOnly(false);
  };

  return (
    <PageFrame title="No results" address="nordkapp.example/work-orders?q=gearbox">
      <StateShell activeId="orders" trail={['Maintenance', 'Work orders']}>
        <div className="flex w-full flex-1 flex-col gap-4">
          <PageHeader as="h1" title="Work orders" />
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-full max-w-xs">
              <Search
                aria-label="Search work orders"
                placeholder="Search work orders"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onClear={() => setQuery('')}
              />
            </div>
            <Button variant={openOnly ? 'secondary' : 'outline'} size="sm" aria-pressed={openOnly} onClick={() => setOpenOnly(!openOnly)}>
              Open only
            </Button>
            <span role="status" className="ml-auto text-xs tabular-nums text-muted-foreground">
              {matches.length} of {STATE_ORDERS.length} work orders
            </span>
          </div>
          {matches.length > 0 ? (
            <StateOrderTable orders={matches} />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState variant="full" type="no-results">
                <EmptyStateIcon />
                <div className="flex flex-col gap-2">
                  <EmptyStateTitle as="h2">No work orders match</EmptyStateTitle>
                  <EmptyStateDescription>
                    {term ? `Nothing matches "${query.trim()}"${openOnly ? ' among open work orders' : ''}.` : 'No open work orders right now.'} Check
                    the spelling or widen the filters.
                  </EmptyStateDescription>
                </div>
                <EmptyStateActions>
                  <Button variant="secondary" onClick={clear}>
                    Clear search and filters
                  </Button>
                </EmptyStateActions>
              </EmptyState>
            </div>
          )}
        </div>
      </StateShell>
    </PageFrame>
  );
}

function StateTemplateServerError() {
  return (
    <PageFrame title="Error page, 500" address="nordkapp.example/trends">
      <StateShell activeId="trends" trail={['Trends']} center>
        <ErrorPage
          type="error-generic"
          code="500"
          title="This page could not be loaded"
          description="Something went wrong on our side. Nothing you entered is lost. Try again, and contact support with the reference if it keeps happening."
          actions={
            <AsyncButton pendingLabel="Reloading…" onAction={() => stateWait(1200)}>
              <IconRefresh /> Try again
            </AsyncButton>
          }
          reference="req-7f3a91c2"
        />
      </StateShell>
    </PageFrame>
  );
}

function StateTemplateNotFound() {
  return (
    <PageFrame title="Not found" address="nordkapp.example/dashboards/gas-compresion">
      <StateShell activeId="dashboards" trail={['Dashboards', 'Unknown']}>
        <div className="mx-auto grid w-full max-w-3xl flex-1 grid-cols-1 items-center gap-8 @3xl:grid-cols-2">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium tabular-nums text-muted-foreground">404</p>
            <h1 className="text-2xl font-semibold tracking-tight text-base-foreground">Dashboard not found</h1>
            <p className="text-sm text-medium-foreground">
              It may have been deleted or renamed, or the link is incomplete. The address ends in{' '}
              <span className="font-mono text-xs">gas-compresion</span>.
            </p>
            <div>
              <Button>View all dashboards</Button>
            </div>
          </div>
          <section aria-labelledby="state-template-nearby" className="flex flex-col gap-2">
            <h2 id="state-template-nearby" className="text-xs font-medium text-muted-foreground">
              Did you mean
            </h2>
            <ul className="flex flex-col rounded-xl border border-default">
              {STATE_NEARBY.map((item) => (
                <li key={item.id} className="border-b border-default last:border-b-0">
                  <a
                    href={`#${item.id}`}
                    onClick={(event) => event.preventDefault()}
                    className="flex flex-col px-4 py-3 outline-none hover:bg-base-background-hover focus-visible:shadow-focus-ring"
                  >
                    <span className="text-sm font-medium text-base-foreground">{item.title}</span>
                    <span className="text-xs text-muted-foreground">{item.detail}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </StateShell>
    </PageFrame>
  );
}

function StateTemplateNoAccess() {
  const [requested, setRequested] = useState(false);

  return (
    <PageFrame title="No access" address="nordkapp.example/assets/hammerfest">
      <StateShell activeId="assets" trail={['Assets', 'Hammerfest LNG']} center>
        <ErrorPage
          type="no-access"
          title="You do not have access to Hammerfest LNG"
          description={
            requested
              ? 'Your request was sent to Liv Wold. You get a notification when it is answered.'
              : 'Your role covers Nordkapp only. Ask the area owner for access, or go back to the assets you can open.'
          }
          details={
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex items-baseline justify-between gap-8">
                <dt className="text-muted-foreground">Area owner</dt>
                <dd className="text-base-foreground">Liv Wold</dd>
              </div>
              <div className="flex items-baseline justify-between gap-8">
                <dt className="text-muted-foreground">Your role</dt>
                <dd className="text-base-foreground">Operator, Nordkapp</dd>
              </div>
            </dl>
          }
          actions={
            <>
              {requested ? (
                <Button variant="secondary" onClick={() => setRequested(false)}>
                  Withdraw request
                </Button>
              ) : (
                <AsyncButton pendingLabel="Sending…" onAction={() => stateWait(900).then(() => setRequested(true))}>
                  Request access
                </AsyncButton>
              )}
              <Button variant="ghost">Back to assets</Button>
            </>
          }
        />
      </StateShell>
    </PageFrame>
  );
}

function StateTemplateOffline() {
  const [online, setOnline] = useState(false);

  return (
    <PageFrame title="Offline, reconnecting" address="nordkapp.example/assets/23-KA-9101">
      <StateShell
        activeId="assets"
        trail={['Assets', 'Gas compression', STATE_COMPRESSOR.tag]}
        banner={
          online ? undefined : (
            <Banner variant="warning">
              <BannerIcon icon={IconWifiOff} />
              <BannerTitle>
                <span className="text-base-foreground">You are offline. Showing values from 13:42.</span>
              </BannerTitle>
              <BannerActions>
                <BannerAction onClick={() => setOnline(true)}>Reconnect</BannerAction>
              </BannerActions>
            </Banner>
          )
        }
      >
        <div className="flex w-full flex-col gap-6">
          <PageHeader
            as="h1"
            title={STATE_COMPRESSOR.name}
            meta={<span className="font-mono text-xs">{STATE_COMPRESSOR.tag}</span>}
            status={<Badge variant={online ? 'success' : 'archived'}>{online ? 'Live' : 'Last known values'}</Badge>}
            actions={
              online ? (
                <Button variant="ghost" size="sm" onClick={() => setOnline(false)}>
                  Reset example
                </Button>
              ) : (
                <Button size="sm" disabled>
                  Create work order
                </Button>
              )
            }
          />
          {online ? null : <p className="text-xs text-muted-foreground">Creating and editing are paused until the connection is back.</p>}
          <ul className="grid grid-cols-1 gap-x-8 @3xl:grid-cols-2">
            {STATE_SENSORS.map((sensor) => (
              <li key={sensor.id} className="flex items-center justify-between gap-4 border-b border-default py-3">
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm text-base-foreground">{sensor.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{sensor.tag}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end">
                  <span className={`text-base font-semibold tabular-nums ${online ? 'text-base-foreground' : 'text-muted-foreground'}`}>
                    {sensor.value.toFixed(sensor.decimals)} <span className="text-xs font-normal">{sensor.unit}</span>
                  </span>
                  <span className="text-xs tabular-nums text-muted-foreground">{online ? 'Live' : 'At 13:42'}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </StateShell>
    </PageFrame>
  );
}

function StateTemplateMaintenance() {
  return (
    <PageFrame title="Maintenance" address="nordkapp.example/overview">
      <StateShell activeId="overview" trail={['Overview']} nav={STATE_NAV_DISABLED} center>
        <ErrorPage
          type="unknown"
          icon={<IconBarrierBlock />}
          code="Scheduled maintenance"
          title="Nordkapp is being upgraded"
          description="The workspace is unavailable while the project is upgraded. Ingestion continues in the background and catches up when the work is done."
          details={
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex items-baseline justify-between gap-8">
                <dt className="text-muted-foreground">Started</dt>
                <dd className="tabular-nums text-base-foreground">Sat 14 March, 02:00 CET</dd>
              </div>
              <div className="flex items-baseline justify-between gap-8">
                <dt className="text-muted-foreground">Expected back</dt>
                <dd className="tabular-nums text-base-foreground">Sat 14 March, 04:00 CET</dd>
              </div>
            </dl>
          }
          actions={<Button variant="secondary">View status page</Button>}
        />
      </StateShell>
    </PageFrame>
  );
}

function StateTemplateSuccess() {
  return (
    <PageFrame title="Confirmation after a flow" address="nordkapp.example/work-orders/new/done">
      <StateShell activeId="orders" trail={['Maintenance', 'Work orders', 'New']}>
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6">
          <div className="flex flex-col gap-3" role="status">
            <IconCircleCheck aria-hidden className="size-8 text-success-foreground-strong" />
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight text-base-foreground">Work order created</h1>
              <p className="text-sm text-medium-foreground">
                <span className="font-mono text-xs">WO-104490</span> is in the backlog and has been sent to SAP PM. Magnus Solberg has been
                notified to plan it.
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-default p-4">
            <PropertyList
              columns={2}
              layout="stacked"
              items={[
                { label: 'Title', value: 'Inspect drive-end bearing' },
                { label: 'Equipment', value: <span className="font-mono text-xs">{STATE_COMPRESSOR.tag}</span> },
                { label: 'Priority', value: 'P2' },
                { label: 'Due', value: '14 Mar 2026' },
              ]}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button>Open work order</Button>
            <Button variant="secondary">Create another</Button>
            <Button variant="ghost">Back to work orders</Button>
          </div>
        </div>
      </StateShell>
    </PageFrame>
  );
}

function StatePanel({ title, meta, children }: { title: string; meta?: string; children: ReactNode }) {
  return (
    <section className="flex min-h-48 flex-col rounded-xl border border-default">
      <header className="flex min-h-12 items-baseline justify-between gap-4 px-4 pt-3">
        <h2 className="text-sm font-medium text-base-foreground">{title}</h2>
        {meta ? <span className="text-xs tabular-nums text-muted-foreground">{meta}</span> : null}
      </header>
      <div className="flex flex-1 flex-col justify-center px-4 pb-4">{children}</div>
    </section>
  );
}

function StateTemplatePartialFailure() {
  const [failed, setFailed] = useState<readonly string[]>(['alarms', 'orders']);
  const recover = (id: string) => stateWait(1000).then(() => setFailed((current) => current.filter((item) => item !== id)));

  return (
    <PageFrame title="Partially failed page" address="nordkapp.example/overview" height="lg">
      <StateShell activeId="overview" collapsed trail={['Overview']}>
        <div className="flex w-full flex-col gap-4">
          <PageHeader as="h1" title="Plant overview" description="Nordkapp · updated 14:00" />
          <Alert variant="warning" visible={failed.length > 0}>
            <AlertTitle>
              {failed.length} of 4 sections could not be loaded
            </AlertTitle>
            <AlertDescription>The rest of the page is up to date. Retry a section, or all of them at once.</AlertDescription>
            <AlertActions>
              <AlertButton onClick={() => setFailed([])}>Retry all</AlertButton>
            </AlertActions>
          </Alert>
          {failed.length === 0 ? (
            <div className="flex items-center justify-between gap-4">
              <p role="status" className="text-sm text-muted-foreground">
                All 4 sections loaded.
              </p>
              <Button variant="ghost" size="sm" onClick={() => setFailed(['alarms', 'orders'])}>
                Reset example
              </Button>
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-4 @3xl:grid-cols-2">
            <StatePanel title="Gas export" meta="Last 30 days">
              <div className="flex flex-col gap-2">
                <span className="text-2xl font-semibold tabular-nums text-base-foreground">
                  {PLANT_KPIS.gasExport.value} <span className="text-sm font-normal text-muted-foreground">{PLANT_KPIS.gasExport.unit}</span>
                </span>
                <Sparkline values={STATE_EXPORT} label="Gas export, last 30 days" unit={PLANT_KPIS.gasExport.unit} decimals={2} height={56} variant="area" showLast />
              </div>
            </StatePanel>
            <StatePanel title="Active alarms" meta={failed.includes('alarms') ? undefined : `${STATE_ALARMS.length} active`}>
              {failed.includes('alarms') ? (
                <RetryBlock title="Couldn't load alarms" description="The alarm service did not answer." onRetry={() => recover('alarms')} />
              ) : (
                <ul className="flex flex-col">
                  {STATE_ALARMS.map((alarm) => (
                    <li key={alarm.id} className="flex items-center justify-between gap-4 border-b border-default py-2 last:border-b-0">
                      <span className="min-w-0 truncate text-sm text-base-foreground">{alarm.message}</span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{formatAgo(alarm.raisedAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </StatePanel>
            <StatePanel title="Availability" meta="Today">
              <span className="text-2xl font-semibold tabular-nums text-base-foreground">
                {PLANT_KPIS.availability.value} <span className="text-sm font-normal text-muted-foreground">%</span>
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">Target {PLANT_KPIS.availability.target} %</span>
            </StatePanel>
            <StatePanel title="Work due this week" meta={failed.includes('orders') ? undefined : '3 work orders'}>
              {failed.includes('orders') ? (
                <RetryBlock title="Couldn't load work orders" description="SAP PM took too long to respond." onRetry={() => recover('orders')} />
              ) : (
                <ul className="flex flex-col">
                  {STATE_ORDERS.slice(0, 3).map((order) => (
                    <li key={order.id} className="flex items-center justify-between gap-4 border-b border-default py-2 last:border-b-0">
                      <span className="min-w-0 truncate text-sm text-base-foreground">{order.title}</span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{formatDate(order.dueAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </StatePanel>
          </div>
        </div>
      </StateShell>
    </PageFrame>
  );
}

function StateTemplateArchived() {
  const [archived, setArchived] = useState(true);
  const assignee = findPerson(STATE_ORDER.assigneeId);

  return (
    <PageFrame title="Read-only, archived record" address="nordkapp.example/work-orders/WO-104431">
      <StateShell
        activeId="orders"
        trail={['Maintenance', 'Work orders', STATE_ORDER.id]}
        banner={
          archived ? (
            <Banner>
              <BannerIcon icon={IconArchive} />
              <BannerTitle>
                <span className="text-base-foreground">Archived on 10 March 2026 by Magnus Solberg. This work order is read-only.</span>
              </BannerTitle>
              <BannerActions>
                <BannerAction onClick={() => setArchived(false)}>Restore</BannerAction>
              </BannerActions>
            </Banner>
          ) : undefined
        }
      >
        <div className="flex w-full max-w-3xl flex-col gap-6">
          <PageHeader
            as="h1"
            title={STATE_ORDER.title}
            meta={<span className="font-mono text-xs">{STATE_ORDER.id}</span>}
            status={archived ? <Badge variant="archived">Archived</Badge> : <StatusBadge status={STATE_ORDER.status} />}
            actions={
              archived ? (
                <Button variant="secondary" size="sm">
                  Export as PDF
                </Button>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setArchived(true)}>
                    Archive again
                  </Button>
                  <Button size="sm">Save changes</Button>
                </>
              )
            }
          />
          <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2">
            <FormField label="Title">{(control) => <Input {...control} readOnly={archived} defaultValue={STATE_ORDER.title} />}</FormField>
            <FormField label="Equipment">
              {(control) => <Input {...control} readOnly={archived} defaultValue={findAsset(STATE_ORDER.assetId)?.tag} />}
            </FormField>
            <FormField label="Assignee">{(control) => <Input {...control} readOnly={archived} defaultValue={assignee?.name} />}</FormField>
            <FormField label="Estimated hours">
              {(control) => <Input {...control} readOnly={archived} inputMode="decimal" defaultValue={String(STATE_ORDER.estimatedHours)} />}
            </FormField>
          </div>
          <p className="text-xs text-muted-foreground">
            {archived ? 'Fields can be read and copied. Restore the work order to change it.' : 'Restored. Fields can be edited again.'}
          </p>
        </div>
      </StateShell>
    </PageFrame>
  );
}

export default definePage({
  id: 'state-pages',
  title: 'State pages',
  summary:
    'What a whole page shows when it is not showing its normal content: loading, empty, failed, unavailable, finished or locked. Every state sits inside the app shell, so navigation stays where it was and only the content area changes.',
  guidance: {
    use: [
      'Keep the shell and the page title; replace only the content area with the state.',
      'Make skeletons mirror the layout that is about to appear, column for column.',
      'Say what happened, what is unaffected and the one thing to do next.',
      'Use a banner strip for a condition that covers the whole page: offline, archived, maintenance.',
    ],
    avoid: [
      'A full-screen spinner or error that removes the navigation.',
      'Failing the whole page when one section failed; let the rest render.',
      'An empty page with no action, or an error with no way forward.',
    ],
  },
  source,
  sections: [
    {
      id: 'loading',
      title: 'Loading',
      description: 'Skeletons that mirror the page about to appear.',
      specimens: [
        {
          id: 'StateTemplateLoadingList',
          title: 'Page loading, list',
          note: 'Use while a list page loads: the title and column headers are real, only the rows are placeholders.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['templates-b/PageFrame.tsx', 'templates-b/ShellPage.tsx', 'feedback/SkeletonTable.tsx', 'patterns/structure/PageHeader.tsx'],
          Component: StateTemplateLoadingList,
        },
        {
          id: 'StateTemplateLoadingDetail',
          title: 'Page loading, detail',
          note: 'Use while a record loads and even its name is unknown: header, tabs, chart and properties are all placeholders.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['templates-b/PageFrame.tsx', 'templates-b/ShellPage.tsx', 'feedback/SkeletonText.tsx'],
          Component: StateTemplateLoadingDetail,
        },
      ],
    },
    {
      id: 'empty',
      title: 'Empty',
      description: 'Nothing to show, for two different reasons.',
      specimens: [
        {
          id: 'StateTemplateFirstUse',
          title: 'First-use empty page',
          note: 'Pick it when nothing has been created yet: explain what belongs here and offer the action that creates the first one.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['templates-b/PageFrame.tsx', 'templates-b/ShellPage.tsx', 'patterns/structure/PageHeader.tsx'],
          Component: StateTemplateFirstUse,
        },
        {
          id: 'StateTemplateNoResults',
          title: 'No results',
          note: 'Use when a search or filter removed every row: keep the controls in place and offer to clear them.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['templates-b/PageFrame.tsx', 'templates-b/ShellPage.tsx', 'patterns/structure/PageHeader.tsx', 'display/StatusBadge.tsx'],
          Component: StateTemplateNoResults,
        },
      ],
    },
    {
      id: 'errors',
      title: 'Errors',
      description: 'The page cannot be shown.',
      specimens: [
        {
          id: 'StateTemplateServerError',
          title: 'Error page, 500',
          note: 'Use when the page failed for a reason the user cannot fix: retry in place and a reference for support.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['templates-b/PageFrame.tsx', 'templates-b/ShellPage.tsx', 'patterns/states/ErrorPage.tsx', 'actions/AsyncButton.tsx'],
          Component: StateTemplateServerError,
        },
        {
          id: 'StateTemplateNotFound',
          title: 'Not found',
          note: 'Pick it for a wrong or old address: say what was looked for and list the nearest things that do exist.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['templates-b/PageFrame.tsx', 'templates-b/ShellPage.tsx'],
          Component: StateTemplateNotFound,
        },
        {
          id: 'StateTemplateNoAccess',
          title: 'No access',
          note: 'Use when the page exists but the role does not cover it: name the owner and let people ask from the page.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['templates-b/PageFrame.tsx', 'templates-b/ShellPage.tsx', 'patterns/states/ErrorPage.tsx', 'actions/AsyncButton.tsx'],
          Component: StateTemplateNoAccess,
        },
      ],
    },
    {
      id: 'service',
      title: 'Connection and service',
      description: 'The page works, but something around it does not.',
      specimens: [
        {
          id: 'StateTemplateOffline',
          title: 'Offline, reconnecting',
          note: 'Use when the connection drops: keep the last values, say how old they are and pause the actions that need the server.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['templates-b/PageFrame.tsx', 'templates-b/ShellPage.tsx', 'patterns/structure/PageHeader.tsx'],
          Component: StateTemplateOffline,
        },
        {
          id: 'StateTemplateMaintenance',
          title: 'Maintenance',
          note: 'Pick it for planned downtime: when it started, when it ends, and navigation switched off rather than removed.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['templates-b/PageFrame.tsx', 'templates-b/ShellPage.tsx', 'patterns/states/ErrorPage.tsx'],
          Component: StateTemplateMaintenance,
        },
      ],
    },
    {
      id: 'outcomes',
      title: 'Outcomes and locks',
      description: 'A flow that ended, a page that half loaded and a record that can no longer change.',
      specimens: [
        {
          id: 'StateTemplateSuccess',
          title: 'Confirmation after a flow',
          note: 'Use as the last page of a wizard: what was created, where it went and the two or three places to go next.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['templates-b/PageFrame.tsx', 'templates-b/ShellPage.tsx', 'patterns/structure/PropertyList.tsx'],
          Component: StateTemplateSuccess,
        },
        {
          id: 'StateTemplatePartialFailure',
          title: 'Partially failed page',
          note: 'Pick it when sections load independently: the ones that failed retry on their own and the summary counts them.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['templates-b/PageFrame.tsx', 'templates-b/ShellPage.tsx', 'feedback/RetryBlock.tsx', 'industrial/Sparkline.tsx'],
          Component: StateTemplatePartialFailure,
        },
        {
          id: 'StateTemplateArchived',
          title: 'Read-only, archived record',
          note: 'Use for a record that is archived or locked: a banner says why, fields stay readable and restoring is one action.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['templates-b/PageFrame.tsx', 'templates-b/ShellPage.tsx', 'patterns/structure/PageHeader.tsx', 'forms/FormField.tsx', 'display/StatusBadge.tsx'],
          Component: StateTemplateArchived,
        },
      ],
    },
  ],
});
