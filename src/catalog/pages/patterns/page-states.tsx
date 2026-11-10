import { Alert, AlertActions, AlertButton, AlertDescription } from '@cognite/aura/components/alert';
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
import { Label } from '@cognite/aura/components/label';
import { Loader } from '@cognite/aura/components/loader';
import { Search } from '@cognite/aura/components/search';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import { Skeleton } from '@cognite/aura/components/skeleton';
import {
  IconAlertTriangle,
  IconAlertTriangleFilled,
  IconCheck,
  IconCircleCheck,
  IconExternalLink,
  IconLockFilled,
  IconPlus,
  IconRefresh,
  IconSparkles,
  IconToggleLeft,
  IconWifiOff,
  IconX,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { AsyncButton } from '../../../library/actions/AsyncButton';
import { StatusBadge } from '../../../library/display/StatusBadge';
import { Delayed } from '../../../library/feedback/Delayed';
import { LabelledProgress } from '../../../library/feedback/LabelledProgress';
import { RetryBlock } from '../../../library/feedback/RetryBlock';
import { SkeletonCard } from '../../../library/feedback/SkeletonCard';
import { SkeletonList } from '../../../library/feedback/SkeletonList';
import { SkeletonTable } from '../../../library/feedback/SkeletonTable';
import { StateBlock } from '../../../library/patterns/states/StateBlock';
import type { RegionStatus } from '../../../library/patterns/states/StateBlock';
import { ALARMS, ASSETS, PLANT_KPIS, SENSORS, WORK_ORDERS, findAsset, findPerson } from '../../data/plant';
import { formatDate } from '../../data/series';
import { definePage } from '../../types';

import source from './page-states.tsx?raw';

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

const EQUIPMENT = ASSETS.filter((asset) => asset.type !== 'site' && asset.type !== 'area' && asset.type !== 'system');

const OPEN_ORDERS = WORK_ORDERS.filter((order) => order.status !== 'done').slice(0, 4);

const COMPRESSOR_SENSORS = SENSORS.filter((sensor) => sensor.assetId === '23-ka-9101').slice(0, 3);

const DETAIL_FIELDS = ['Tag', 'Type', 'State', 'Criticality', 'Parent', 'Health score'] as const;

const REGION_STATUSES: readonly { value: RegionStatus; label: string }[] = [
  { value: 'ready', label: 'Content' },
  { value: 'loading', label: 'Loading' },
  { value: 'empty', label: 'Empty' },
  { value: 'error', label: 'Error' },
  { value: 'no-access', label: 'No access' },
];

function isRegionStatus(value: unknown): value is RegionStatus {
  return REGION_STATUSES.some((status) => status.value === value);
}

/** The frame of a page region: a titled panel whose body is replaced by the state. */
function PageStatePanel({
  title,
  meta,
  action,
  children,
}: {
  title: string;
  meta?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex w-full flex-col rounded-xl border border-default">
      <header className="flex min-h-14 items-center justify-between gap-4 px-4">
        <div className="flex min-w-0 items-baseline gap-2">
          <h4 className="truncate text-sm font-medium text-base-foreground">{title}</h4>
          {meta ? <span className="shrink-0 text-xs text-muted-foreground">{meta}</span> : null}
        </div>
        {action}
      </header>
      <div className="flex flex-1 flex-col px-4 pb-4">{children}</div>
    </section>
  );
}

/** Rows of the work order table, shared by the specimens that show real content. */
function PageStateOrderTable({ orders }: { orders: readonly (typeof WORK_ORDERS)[number][] }) {
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-default text-xs text-muted-foreground">
          <th className="whitespace-nowrap py-2 pr-4 font-medium">Work order</th>
          <th className="py-2 pr-4 font-medium">Title</th>
          <th className="py-2 pr-4 font-medium">Status</th>
          <th className="py-2 font-medium">Due</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr key={order.id} className="border-b border-default last:border-b-0">
            <td className="whitespace-nowrap py-2 pr-4 tabular-nums text-muted-foreground">{order.id}</td>
            <td className="max-w-0 w-full truncate py-2 pr-4 text-base-foreground">{order.title}</td>
            <td className="py-2 pr-4">
              <StatusBadge status={order.status} outline />
            </td>
            <td className="whitespace-nowrap py-2 text-muted-foreground">{formatDate(order.dueAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PageStateListSkeleton() {
  return (
    <PageStatePanel title="Active alarms">
      <SkeletonList rows={4} trailing label="Loading alarms" />
    </PageStatePanel>
  );
}

function PageStateTableSkeleton() {
  return (
    <PageStatePanel title="Work orders">
      <SkeletonTable rows={4} columns={['Work order', 'Title', 'Status', 'Due']} label="Loading work orders" />
    </PageStatePanel>
  );
}

function PageStateChartSkeleton() {
  return (
    <PageStatePanel title="Discharge pressure" meta="23-PT-92531" action={<Skeleton className="h-7 w-28" />}>
      <div role="status" aria-label="Loading chart" className="flex flex-col gap-3">
        <div className="flex gap-3">
          <div className="flex flex-col justify-between py-1">
            <Skeleton className="h-3 w-6" />
            <Skeleton className="h-3 w-6" />
            <Skeleton className="h-3 w-6" />
          </div>
          <Skeleton className="h-36 flex-1" />
        </div>
        <div className="flex justify-between gap-4 pl-9">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-10" />
        </div>
      </div>
    </PageStatePanel>
  );
}

function PageStateDetailSkeleton() {
  return (
    <div role="status" aria-label="Loading asset details" className="flex w-full flex-col gap-6 rounded-xl border border-default p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 shrink-0" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-7 w-20" />
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
        {DETAIL_FIELDS.map((field, index) => (
          <div key={field} className="flex flex-col gap-2">
            <dt className="text-xs text-muted-foreground">{field}</dt>
            <dd>
              <Skeleton className={`h-4 ${index % 2 === 0 ? 'w-24' : 'w-16'}`} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function PageStateCardGridSkeleton() {
  return (
    <div aria-busy="true" className="grid w-full grid-cols-2 gap-4 xl:grid-cols-4">
      <SkeletonCard media lines={2} label="Loading dashboard 1 of 4" />
      <SkeletonCard media lines={2} label="Loading dashboard 2 of 4" />
      <SkeletonCard media lines={2} label="Loading dashboard 3 of 4" />
      <SkeletonCard media lines={2} label="Loading dashboard 4 of 4" />
    </div>
  );
}

function PageStateLoader() {
  return <Loader variant="page" header="Opening Nordkapp" description="Loading the asset hierarchy and live values." />;
}

function PageStateDelayedLoader() {
  const [phase, setPhase] = useState<'idle' | 'loading' | 'done'>('idle');
  const [duration, setDuration] = useState(0);

  const load = (ms: number) => {
    setDuration(ms);
    setPhase('loading');
    void wait(ms).then(() => setPhase('done'));
  };

  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-4">
      <div className="flex h-12 items-center justify-center text-sm text-muted-foreground" aria-live="polite">
        {phase === 'idle' ? 'Pick a response time.' : null}
        {phase === 'loading' ? (
          <Delayed delayMs={300}>
            <div role="status" className="flex items-center gap-2">
              <Loader variant="inline" /> Loading alarms…
            </div>
          </Delayed>
        ) : null}
        {phase === 'done' ? `8 alarms loaded in ${duration} ms.` : null}
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={phase === 'loading'} onClick={() => load(150)}>
          Fast, 150 ms
        </Button>
        <Button variant="secondary" size="sm" disabled={phase === 'loading'} onClick={() => load(1500)}>
          Slow, 1.5 s
        </Button>
      </div>
    </div>
  );
}

function PageStateRefreshing() {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshes, setRefreshes] = useState(0);

  const refresh = () => {
    setRefreshing(true);
    void wait(1400).then(() => {
      setRefreshing(false);
      setRefreshes((count) => count + 1);
    });
  };

  return (
    <section aria-busy={refreshing} className="flex w-full max-w-xs flex-col gap-3">
      <header className="flex h-7 items-center justify-between gap-4">
        <h4 className="text-sm font-medium text-base-foreground">1st stage compressor</h4>
        {refreshing ? (
          <div role="status" className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader variant="inline" size={14} /> Updating…
          </div>
        ) : (
          <Button variant="ghost" size="sm" onClick={refresh}>
            <IconRefresh /> Refresh
          </Button>
        )}
      </header>
      <ul className="flex flex-col gap-2 text-sm">
        {COMPRESSOR_SENSORS.map((sensor) => (
          <li key={sensor.id} className="flex items-baseline justify-between gap-4">
            <span className="min-w-0 truncate text-muted-foreground">{sensor.name}</span>
            <span className="shrink-0 tabular-nums text-base-foreground">
              {(sensor.value + refreshes * 0.2).toFixed(sensor.decimals)} {sensor.unit}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PageStateFirstUse() {
  return (
    <EmptyState variant="full" type="new-object">
      <EmptyStateIcon />
      <div className="flex flex-col gap-2">
        <EmptyStateTitle as="h4">No alarm rules yet</EmptyStateTitle>
        <EmptyStateDescription>Create a rule to be notified when a sensor crosses a limit.</EmptyStateDescription>
      </div>
      <EmptyStateActions className="flex-row">
        <Button>
          <IconPlus /> Create alarm rule
        </Button>
        <Button
          variant="ghost"
          render={<a href="https://docs.cognite.com/cdf/" target="_blank" rel="noreferrer" />}
        >
          Read the guide <IconExternalLink />
        </Button>
      </EmptyStateActions>
    </EmptyState>
  );
}

function PageStateNoResults() {
  const [query, setQuery] = useState('recompresor');
  const matches = EQUIPMENT.filter((asset) => `${asset.name} ${asset.tag}`.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <Search
        aria-label="Search equipment"
        placeholder="Search equipment"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onClear={() => setQuery('')}
      />
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {matches.length} of {EQUIPMENT.length} equipment
      </p>
      <div className="flex h-52 flex-col">
        {matches.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState type="no-results">
              <EmptyStateIcon />
              <EmptyStateTitle as="h4">No equipment matches &quot;{query}&quot;</EmptyStateTitle>
              <EmptyStateDescription>Check the spelling, or search by tag such as 23-KA-9103.</EmptyStateDescription>
              <EmptyStateActions>
                <Button variant="secondary" size="sm" onClick={() => setQuery('')}>
                  Clear search
                </Button>
              </EmptyStateActions>
            </EmptyState>
          </div>
        ) : (
          <ul className="flex flex-col gap-3 overflow-y-auto text-sm">
            {matches.map((asset) => (
              <li key={asset.id} className="flex items-baseline justify-between gap-4">
                <span className="min-w-0 truncate text-base-foreground">{asset.name}</span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{asset.tag}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function PageStateFilteredEmpty() {
  const [filters, setFilters] = useState<readonly string[]>(['Priority: P1', 'Status: Waiting']);
  const filtered = filters.length > 0;

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex min-h-7 flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">Filters</span>
        {filters.map((filter) => (
          <Badge
            key={filter}
            variant="closable"
            render={<button type="button" />}
            onClick={() => setFilters(filters.filter((other) => other !== filter))}
          >
            {filter} <IconX aria-label="Remove filter" />
          </Badge>
        ))}
        {filtered ? null : (
          <Button variant="ghost" size="sm" onClick={() => setFilters(['Priority: P1', 'Status: Waiting'])}>
            Apply example filters
          </Button>
        )}
        <span className="ml-auto text-xs tabular-nums text-muted-foreground" aria-live="polite">
          {filtered ? 0 : OPEN_ORDERS.length} of {OPEN_ORDERS.length} work orders
        </span>
      </div>
      <PageStateOrderTable orders={filtered ? [] : OPEN_ORDERS} />
      {filtered ? (
        <div className="flex justify-center py-6">
          <EmptyState type="no-results">
            <EmptyStateIcon />
            <EmptyStateTitle as="h4">No work orders match these filters</EmptyStateTitle>
            <EmptyStateDescription>
              {OPEN_ORDERS.length} work orders are hidden. Remove a filter to see more.
            </EmptyStateDescription>
            <EmptyStateActions>
              <Button variant="secondary" size="sm" onClick={() => setFilters([])}>
                Clear filters
              </Button>
            </EmptyStateActions>
          </EmptyState>
        </div>
      ) : null}
    </div>
  );
}

function PageStateAllClear() {
  return (
    <div className="flex flex-col items-center gap-4">
      <EmptyState>
        <EmptyStateIcon>
          <IconCircleCheck />
        </EmptyStateIcon>
        <EmptyStateTitle as="h4">No active alarms</EmptyStateTitle>
        <EmptyStateDescription>All 16 assets are within their limits. New alarms appear here.</EmptyStateDescription>
      </EmptyState>
      <p className="text-xs text-muted-foreground">Last checked 14:00</p>
    </div>
  );
}

function PageStateErrorRetry() {
  const [attempts, setAttempts] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const retry = () =>
    wait(1400).then(() => {
      setAttempts(attempts + 1);
      if (attempts >= 1) {
        setLoaded(true);
        return;
      }
      throw new Error('Service unavailable');
    });

  const reset = () => {
    setAttempts(0);
    setLoaded(false);
  };

  return (
    <PageStatePanel
      title="Maintenance history"
      action={
        loaded ? (
          <Button variant="ghost" size="sm" onClick={reset}>
            Reset example
          </Button>
        ) : null
      }
    >
      <div className="flex min-h-48 items-center justify-center">
        {loaded ? (
          <p className="text-sm text-muted-foreground">14 maintenance records loaded.</p>
        ) : (
          <RetryBlock
            title="Couldn't load maintenance history"
            description="The maintenance system did not answer. Your filters are kept."
            onRetry={retry}
          />
        )}
      </div>
    </PageStatePanel>
  );
}

function PageStateNoAccess() {
  const [requested, setRequested] = useState(false);
  const owner = findPerson('lw');

  return (
    <PageStatePanel title="Gas compression" meta="Restricted area">
      <div className="flex min-h-48 items-center justify-center">
        <EmptyState type="no-access">
          <EmptyStateIcon />
          <EmptyStateTitle as="h4">{requested ? 'Access requested' : 'You need access to this area'}</EmptyStateTitle>
          <EmptyStateDescription>
            {requested
              ? `${owner?.name ?? 'The owner'} has been asked. You get a notification when she answers.`
              : `Gas compression is limited to the operations group. ${owner?.name ?? 'The owner'} can add you.`}
          </EmptyStateDescription>
          <EmptyStateActions>
            {requested ? (
              <Button variant="ghost" size="sm" onClick={() => setRequested(false)}>
                Withdraw request
              </Button>
            ) : (
              <Button size="sm" onClick={() => setRequested(true)}>
                Request access
              </Button>
            )}
          </EmptyStateActions>
        </EmptyState>
      </div>
    </PageStatePanel>
  );
}

function PageStatePartialFailure() {
  const [loaded, setLoaded] = useState(false);

  const tiles = [
    { id: 'availability', label: 'Availability', value: `${PLANT_KPIS.availability.value} ${PLANT_KPIS.availability.unit}` },
    { id: 'export', label: 'Gas export', value: `${PLANT_KPIS.gasExport.value} ${PLANT_KPIS.gasExport.unit}` },
    { id: 'orders', label: 'Open work orders', value: String(PLANT_KPIS.openWorkOrders.value) },
  ];

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex min-h-7 items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {loaded ? 'All 4 widgets loaded.' : '3 of 4 widgets loaded. The rest of the dashboard is up to date.'}
        </p>
        {loaded ? (
          <Button variant="ghost" size="sm" onClick={() => setLoaded(false)}>
            Reset example
          </Button>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.id} className="flex min-h-28 flex-col justify-between gap-3 rounded-xl border border-default p-4">
            <span className="text-xs text-muted-foreground">{tile.label}</span>
            <span className="text-2xl font-semibold tabular-nums text-base-foreground">{tile.value}</span>
          </div>
        ))}
        <div className="flex min-h-28 flex-col justify-between gap-3 rounded-xl border border-default p-4">
          <span className="text-xs text-muted-foreground">Active alarms</span>
          {loaded ? (
            <span className="text-2xl font-semibold tabular-nums text-base-foreground">{PLANT_KPIS.activeAlarms.value}</span>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2 text-sm text-medium-foreground">
                <IconAlertTriangle aria-hidden className="size-4 shrink-0 text-critical-foreground-strong" />
                <span className="truncate">Couldn&apos;t load</span>
              </span>
              <AsyncButton
                variant="secondary"
                size="sm"
                pendingLabel="Retrying…"
                onAction={() => wait(1200).then(() => setLoaded(true))}
              >
                Try again
              </AsyncButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PageStateFeatureNotEnabled() {
  const [requested, setRequested] = useState(false);

  return (
    <EmptyState>
      <EmptyStateIcon>
        <IconToggleLeft />
      </EmptyStateIcon>
      <EmptyStateTitle as="h4">Anomaly detection is turned off</EmptyStateTitle>
      <EmptyStateDescription>
        {requested
          ? 'Your project admin has been asked to turn it on for Nordkapp.'
          : 'A project admin can turn it on for Nordkapp in project settings.'}
      </EmptyStateDescription>
      <EmptyStateActions>
        {requested ? (
          <span className="flex h-7 items-center gap-2 text-sm text-muted-foreground" role="status">
            <IconCheck aria-hidden className="size-4" /> Request sent
          </span>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setRequested(true)}>
            Ask an admin
          </Button>
        )}
      </EmptyStateActions>
    </EmptyState>
  );
}

function PageStateUpgrade() {
  return (
    <section className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-default p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted-background text-medium-foreground">
          <IconSparkles aria-hidden className="size-4" />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h4 className="text-sm font-medium text-base-foreground">Data quality monitoring</h4>
          <p className="text-sm text-muted-foreground">Part of the Enterprise plan. Your project is on Standard.</p>
        </div>
      </div>
      <ul className="flex flex-col gap-2 text-sm text-medium-foreground">
        {['Rules for gaps, flatlines and out-of-range values', 'A quality score on every time series', 'Alerts when an extractor falls behind'].map(
          (benefit) => (
            <li key={benefit} className="flex items-start gap-2">
              <IconCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              {benefit}
            </li>
          )
        )}
      </ul>
      <div className="flex gap-2">
        <Button size="sm">Contact your account owner</Button>
        <Button variant="ghost" size="sm">
          Compare plans
        </Button>
      </div>
    </section>
  );
}

function PageStateOffline() {
  const [reconnected, setReconnected] = useState(false);

  return (
    <div className="flex w-full flex-col gap-4">
      {reconnected ? (
        <div className="flex min-h-10 items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground" role="status">
            Back online. Values are live again.
          </p>
          <Button variant="ghost" size="sm" onClick={() => setReconnected(false)}>
            Reset example
          </Button>
        </div>
      ) : (
        <Banner variant="warning" inset>
          <BannerIcon icon={IconWifiOff} />
          <BannerTitle>
            <span className="truncate text-base-foreground">You are offline. Showing values from 13:42.</span>
          </BannerTitle>
          <BannerActions>
            <BannerAction onClick={() => setReconnected(true)}>Reconnect</BannerAction>
          </BannerActions>
        </Banner>
      )}
      <ul className="flex flex-col gap-3 text-sm">
        {COMPRESSOR_SENSORS.map((sensor) => (
          <li key={sensor.id} className="flex items-baseline justify-between gap-4">
            <span className="min-w-0 truncate text-medium-foreground">{sensor.name}</span>
            <span className="flex shrink-0 items-baseline gap-3">
              <span className="text-xs text-muted-foreground">{reconnected ? 'Live' : '13:42'}</span>
              <span className={`tabular-nums ${reconnected ? 'text-base-foreground' : 'text-muted-foreground'}`}>
                {sensor.value.toFixed(sensor.decimals)} {sensor.unit}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PageStateStale() {
  const [fresh, setFresh] = useState(false);

  return (
    <div className="flex w-full flex-col gap-4">
      <Alert variant="warning" alertStyle="strip" visible={!fresh}>
        <AlertDescription>The extractor has not reported since 13:42. Values below may be out of date.</AlertDescription>
        <AlertActions>
          <AlertButton variant="ghost" onClick={() => setFresh(true)}>
            Refresh data
          </AlertButton>
        </AlertActions>
      </Alert>
      <PageStateOrderTable orders={OPEN_ORDERS.slice(0, 3)} />
      <div className="flex min-h-7 items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">{fresh ? 'Updated 14:00' : 'Updated 13:42'}</p>
        {fresh ? (
          <Button variant="ghost" size="sm" onClick={() => setFresh(false)}>
            Reset example
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function PageStateReadOnly() {
  return (
    <div className="flex w-full flex-col gap-4">
      <Banner inset>
        <BannerIcon icon={IconLockFilled} />
        <BannerTitle>
          <span className="truncate text-base-foreground">Read-only until 15:00 while the shift handover is signed.</span>
        </BannerTitle>
      </Banner>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="page-state-readonly-high">High limit, barg</Label>
          <Input id="page-state-readonly-high" readOnly value="52.0" />
        </div>
        <div>
          <Label htmlFor="page-state-readonly-trip">Trip limit, barg</Label>
          <Input id="page-state-readonly-trip" readOnly value="55.0" />
        </div>
      </div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">Limits for 23-PT-92531. You can still view and export.</p>
        <Button variant="secondary" size="sm">
          Export limits
        </Button>
      </div>
    </div>
  );
}

function PageStateBackfill() {
  const steps = [38, 62, 87, 100];
  const [step, setStep] = useState(1);
  const value = steps[step];
  const done = value === 100;

  return (
    <PageStatePanel
      title="Discharge pressure history"
      meta="23-PT-92531"
      action={
        <Button variant="ghost" size="sm" onClick={() => setStep(done ? 0 : step + 1)}>
          {done ? 'Reset example' : 'Advance example'}
        </Button>
      }
    >
      <div className="flex min-h-36 flex-col justify-center gap-4">
        {done ? (
          <p className="flex items-center gap-2 text-sm text-medium-foreground" role="status">
            <IconCircleCheck aria-hidden className="size-4 text-success-foreground-strong" />
            History loaded. All 6 years are available.
          </p>
        ) : (
          <LabelledProgress
            label="Loading history from 2019"
            value={value}
            hint="You can keep working. The last 30 days are ready now, and older data fills in as it arrives."
          />
        )}
      </div>
    </PageStatePanel>
  );
}

function PageStateSwitcher() {
  const [status, setStatus] = useState<RegionStatus>('loading');
  const activeAlarms = ALARMS.filter((alarm) => alarm.state === 'active');

  return (
    <div className="flex w-full flex-col gap-4">
      <SegmentedControl
        value={status}
        onValueChange={(value) => {
          if (isRegionStatus(value)) setStatus(value);
        }}
      >
        <SegmentedControlList aria-label="Region state" size="small">
          {REGION_STATUSES.map((option) => (
            <SegmentedControlButton key={option.value} value={option.value} tabContent="label-only" size="small">
              {option.label}
            </SegmentedControlButton>
          ))}
        </SegmentedControlList>
      </SegmentedControl>
      <PageStatePanel title="Active alarms" meta={status === 'ready' ? `${activeAlarms.length} alarms` : undefined}>
        <div className="flex min-h-56 flex-col">
          <StateBlock
            status={status}
            loading={<SkeletonList rows={3} trailing label="Loading alarms" />}
            empty={{
              title: 'No active alarms',
              description: 'All 16 assets are within their limits. New alarms appear here.',
            }}
            error={{
              title: "Couldn't load alarms",
              description: 'The alarm service did not answer. Try again.',
              onRetry: () => wait(1200).then(() => setStatus('ready')),
            }}
            noAccess={{
              title: 'You need access to alarms',
              description: 'Alarms are limited to the operations group. Ask a shift supervisor to add you.',
              action: <Button size="sm">Request access</Button>,
            }}
          >
            <ul className="flex flex-col gap-4">
              {activeAlarms.map((alarm) => (
                <li key={alarm.id} className="flex items-center gap-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate text-sm text-base-foreground">{alarm.message}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {findAsset(alarm.assetId)?.name} · {alarm.sensorTag}
                    </span>
                  </div>
                  <span className="shrink-0 text-sm tabular-nums text-muted-foreground">{alarm.value}</span>
                </li>
              ))}
            </ul>
          </StateBlock>
        </div>
      </PageStatePanel>
    </div>
  );
}

function PageStateReloadCycle() {
  const [loading, setLoading] = useState(false);

  const reload = () => {
    setLoading(true);
    void wait(1300).then(() => setLoading(false));
  };

  return (
    <div className="flex w-full max-w-60 flex-col gap-3">
      <div aria-busy={loading} className="flex min-h-28 flex-col justify-between gap-3 rounded-xl border border-default p-4">
        <span className="text-xs text-muted-foreground">Availability, last 30 days</span>
        {loading ? (
          <div role="status" aria-label="Loading availability" className="flex flex-col gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <span className="text-2xl font-semibold tabular-nums text-base-foreground">
              {PLANT_KPIS.availability.value} {PLANT_KPIS.availability.unit}
            </span>
            <span className="text-xs text-muted-foreground">Target {PLANT_KPIS.availability.target} %</span>
          </div>
        )}
      </div>
      <Button variant="secondary" size="sm" disabled={loading} onClick={reload}>
        <IconRefresh /> Reload tile
      </Button>
    </div>
  );
}

function PageStateWarningSummary() {
  return (
    <div className="flex w-full flex-col gap-4">
      <Banner variant="destructive" inset>
        <BannerIcon icon={IconAlertTriangleFilled} />
        <BannerTitle>
          <span className="truncate text-base-foreground">Live values are paused. The extractor is disconnected.</span>
        </BannerTitle>
        <BannerActions>
          <BannerAction>View extractor</BannerAction>
        </BannerActions>
      </Banner>
      <PageStateOrderTable orders={OPEN_ORDERS.slice(0, 2)} />
    </div>
  );
}

export default definePage({
  id: 'page-states',
  title: 'Page states',
  summary:
    'What a page or region shows when its content is not there: loading, empty, failed, forbidden, stale or still on its way. Each state keeps the frame, says what is going on and offers the one action that helps.',
  guidance: {
    use: [
      'A skeleton that mirrors the layout when the shape is known; a loader when it is not.',
      'A different empty state for "nothing yet", "nothing matches" and "nothing wrong".',
      'Errors scoped to the region that failed, with a retry in place.',
      'A notice above content that is stale, offline or read-only, while the content stays visible.',
    ],
    avoid: [
      'A blank region, or a spinner that replaces a layout the user already knows.',
      'Failing the whole page because one widget did not load.',
      'An action the user cannot take, such as Create without permission.',
      'Hiding stale data without saying when it was last correct.',
    ],
  },
  source,
  sections: [
    {
      id: 'loading',
      title: 'Loading',
      description: 'Skeletons that keep the frame and real labels, and loaders for when the layout is unknown.',
      specimens: [
        {
          id: 'PageStateListSkeleton',
          title: 'List skeleton',
          note: 'A list is loading: keep the panel title and show rows shaped like the real ones.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['feedback/SkeletonList.tsx'],
          Component: PageStateListSkeleton,
        },
        {
          id: 'PageStateTableSkeleton',
          title: 'Table skeleton',
          note: 'A table is loading: the real column headers are already in place, only cells are placeholders.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['feedback/SkeletonTable.tsx'],
          Component: PageStateTableSkeleton,
        },
        {
          id: 'PageStateChartSkeleton',
          title: 'Chart skeleton',
          note: 'A chart is loading: title and tag are known, the plot and axis ticks are reserved.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: PageStateChartSkeleton,
        },
        {
          id: 'PageStateDetailSkeleton',
          title: 'Detail skeleton',
          note: 'A record is loading: field labels are fixed, so only the values wait.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: PageStateDetailSkeleton,
        },
        {
          id: 'PageStateCardGridSkeleton',
          title: 'Card grid skeleton',
          note: 'A gallery is loading: show as many cards as the first row holds, each with its preview block.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['feedback/SkeletonCard.tsx'],
          Component: PageStateCardGridSkeleton,
        },
        {
          id: 'PageStateLoader',
          title: 'Loader for unknown layout',
          note: 'The app or a whole page is starting and the layout is not known yet.',
          origin: 'custom',
          Component: PageStateLoader,
        },
        {
          id: 'PageStateDelayedLoader',
          title: 'Delayed loader',
          note: 'Responses are usually fast: hold the loader back 300 ms so quick ones never flash. Click to try.',
          origin: 'custom',
          uses: ['feedback/Delayed.tsx'],
          Component: PageStateDelayedLoader,
        },
        {
          id: 'PageStateRefreshing',
          title: 'Refreshing in place',
          note: 'Content is already on screen: keep it and say it is updating instead of swapping in a skeleton.',
          origin: 'custom',
          Component: PageStateRefreshing,
        },
      ],
    },
    {
      id: 'empty',
      title: 'Empty',
      description: 'Three different reasons for an empty region, each with its own message and action.',
      specimens: [
        {
          id: 'PageStateFirstUse',
          title: 'First use',
          note: 'Nothing has been created yet: explain what belongs here and lead with the action that creates it.',
          origin: 'custom',
          size: 'md',
          Component: PageStateFirstUse,
        },
        {
          id: 'PageStateNoResults',
          title: 'No results, with reset',
          note: 'A search matched nothing: repeat the query, suggest a fix and offer to clear it. Type to try.',
          origin: 'custom',
          size: 'md',
          Component: PageStateNoResults,
        },
        {
          id: 'PageStateFilteredEmpty',
          title: 'Filtered to nothing',
          note: 'Filters removed every row: keep headers and filters visible and say how many rows are hidden.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['display/StatusBadge.tsx'],
          Component: PageStateFilteredEmpty,
        },
        {
          id: 'PageStateAllClear',
          title: 'All clear',
          note: 'Empty is the good outcome: confirm it, say what would appear, and when it was last checked.',
          origin: 'custom',
          Component: PageStateAllClear,
        },
      ],
    },
    {
      id: 'failure-and-access',
      title: 'Failure and access',
      description: 'The content exists but cannot be shown: it failed, it is restricted, or the feature is not available.',
      specimens: [
        {
          id: 'PageStateErrorRetry',
          title: 'Error with retry',
          note: 'A region failed to load: retry in place, with progress and a second-failure message. Click to try.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['feedback/RetryBlock.tsx'],
          Component: PageStateErrorRetry,
        },
        {
          id: 'PageStateNoAccess',
          title: 'No access, with request',
          note: 'The user lacks permission: name who can grant it and confirm the request in place.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: PageStateNoAccess,
        },
        {
          id: 'PageStatePartialFailure',
          title: 'Partial failure',
          note: 'One widget failed: the others stay usable and the failed one retries on its own.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['actions/AsyncButton.tsx'],
          Component: PageStatePartialFailure,
        },
        {
          id: 'PageStateFeatureNotEnabled',
          title: 'Feature not enabled',
          note: 'The feature exists but is switched off for this project: say who can turn it on.',
          origin: 'custom',
          size: 'md',
          Component: PageStateFeatureNotEnabled,
        },
        {
          id: 'PageStateUpgrade',
          title: 'Not in this plan',
          note: 'The feature needs another plan: say what it includes and who to talk to, without a sales pitch.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: PageStateUpgrade,
        },
      ],
    },
    {
      id: 'notices',
      title: 'Notices over content',
      description: 'The content stays on screen, with one notice saying why it cannot be fully trusted or changed.',
      specimens: [
        {
          id: 'PageStateOffline',
          title: 'Offline',
          note: 'The connection dropped: keep the last values, mark them with their time and offer to reconnect.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: PageStateOffline,
        },
        {
          id: 'PageStateStale',
          title: 'Stale data',
          note: 'The source stopped reporting: warn once above the content and let the user refresh.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: PageStateStale,
        },
        {
          id: 'PageStateReadOnly',
          title: 'Read-only mode',
          note: 'Editing is locked for a while: say why and until when, and leave viewing and export working.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: PageStateReadOnly,
        },
        {
          id: 'PageStateBackfill',
          title: 'Still processing',
          note: 'A backfill is running: show measurable progress and what is usable already. Click to advance.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['feedback/LabelledProgress.tsx'],
          Component: PageStateBackfill,
        },
      ],
    },
    {
      id: 'lifecycle',
      title: 'One region, every state',
      description: 'The states above wired to one region, so it keeps its frame and size as it moves between them.',
      specimens: [
        {
          id: 'PageStateSwitcher',
          title: 'State switch for a region',
          note: 'Every data region needs all five states: one component switches between them. Pick a state.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['patterns/states/StateBlock.tsx', 'feedback/SkeletonList.tsx'],
          Component: PageStateSwitcher,
        },
        {
          id: 'PageStateReloadCycle',
          title: 'Reload cycle',
          note: 'A tile reloads: its label stays, the value becomes a skeleton of the same size. Click to try.',
          origin: 'custom',
          Component: PageStateReloadCycle,
        },
        {
          id: 'PageStateWarningSummary',
          title: 'Degraded source',
          note: 'A source the whole page depends on is down: one banner says so, and the content stays below it.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['display/StatusBadge.tsx'],
          Component: PageStateWarningSummary,
        },
      ],
    },
  ],
});
