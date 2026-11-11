import { Avatar, AvatarFallback } from '@cognite/aura/components/avatar';
import { Button } from '@cognite/aura/components/button';
import { Search } from '@cognite/aura/components/search';
import {
  IconAlertTriangle,
  IconArchive,
  IconArrowLeft,
  IconArrowRight,
  IconBell,
  IconChartLine,
  IconCircleCheck,
  IconClipboardList,
  IconCloudOff,
  IconFileText,
  IconFlame,
  IconHome,
  IconLayoutDashboard,
  IconLock,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconSettings,
  IconSparkles,
  IconTemplate,
  IconTool,
  IconTopologyStar3,
  IconX,
} from '@cognite/aura/icons';
import { useState } from 'react';

import { AppFrame, type AppFrameNavItem } from '../../../library/kit/AppFrame';
import { DetailList } from '../../../library/kit/auth-pages/DetailList';
import { StepRail } from '../../../library/kit/auth-pages/StepRail';
import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { Grid } from '../../../library/kit/Grid';
import { BrowserFrame } from '../../../library/kit/landing-pages/BrowserFrame';
import { FeatureCard } from '../../../library/kit/landing-pages/FeatureCard';
import { ListRow } from '../../../library/kit/ListRow';
import { Meter } from '../../../library/kit/Meter';
import { Panel } from '../../../library/kit/Panel';
import { RingGauge } from '../../../library/kit/RingGauge';
import { Stat } from '../../../library/kit/Stat';
import { PageBanner } from '../../../library/kit/state-pages/PageBanner';
import { Placeholder } from '../../../library/kit/state-pages/Placeholder';
import { StateMessage } from '../../../library/kit/state-pages/StateMessage';
import { StatGroup } from '../../../library/kit/StatGroup';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import type { Tone } from '../../../library/kit/tones';
import { TrendArea } from '../../../library/kit/TrendArea';
import { SENSORS, WORK_ORDERS, findAsset, findPerson, type WorkOrder } from '../../data/plant';
import { formatDate, formatTime, makeSeries } from '../../data/series';
import { definePage } from '../../types';

import source from './state-pages.tsx?raw';

const STATE_APP_NAV: AppFrameNavItem[] = [
  { id: 'home', label: 'Home', icon: <IconHome /> },
  { id: 'overview', label: 'Plant overview', icon: <IconLayoutDashboard /> },
  { id: 'alarms', label: 'Alarms', icon: <IconBell />, badge: '4' },
  { id: 'trends', label: 'Trends', icon: <IconChartLine /> },
  { id: 'work', label: 'Work orders', icon: <IconClipboardList /> },
  { id: 'assets', label: 'Assets', icon: <IconTopologyStar3 /> },
];

const STATE_TOP_NAV: AppFrameNavItem[] = [
  { id: 'overview', label: 'Overview', icon: <IconLayoutDashboard /> },
  { id: 'alarms', label: 'Alarms', icon: <IconBell />, badge: '4' },
  { id: 'trends', label: 'Trends', icon: <IconChartLine /> },
  { id: 'work', label: 'Work orders', icon: <IconClipboardList /> },
];

const STATE_RAIL_NAV: AppFrameNavItem[] = [
  { id: 'overview', label: 'Overview', icon: <IconLayoutDashboard /> },
  { id: 'alarms', label: 'Alarms', icon: <IconBell />, badge: '4' },
  { id: 'work', label: 'Work orders', icon: <IconClipboardList /> },
  { id: 'budget', label: 'Budgets', icon: <IconFileText /> },
  { id: 'settings', label: 'Settings', icon: <IconSettings /> },
];

const STATE_LOST_NAV: AppFrameNavItem[] = [
  { id: 'home', label: 'Home' },
  { id: 'alarms', label: 'Alarms' },
  { id: 'trends', label: 'Trends' },
  { id: 'work', label: 'Work orders' },
];

const STATE_RECORD_NAV: AppFrameNavItem[] = [
  { id: 'record', label: 'Record' },
  { id: 'history', label: 'History' },
  { id: 'documents', label: 'Documents' },
];

const STATE_SAMPLE = makeSeries({
  seed: 11,
  points: 25,
  base: 48.2,
  amplitude: 1.6,
  noise: 0.5,
  cycles: 1.4,
  decimals: 1,
});

const STATE_SAMPLE_HOURS = STATE_SAMPLE.map((point) => formatTime(point.t));

const STATE_SAMPLE_VALUES = STATE_SAMPLE.map((point) => point.v);

const STATE_COMPRESSOR_SENSORS = SENSORS.filter((sensor) => sensor.assetId === '23-ka-9101').slice(0, 4);

const STATE_ORDER_LABEL: Record<WorkOrder['status'], string> = {
  open: 'Open',
  planned: 'Planned',
  'in-progress': 'In progress',
  waiting: 'Waiting',
  done: 'Done',
};

const STATE_ORDER_TONE: Record<WorkOrder['status'], Tone> = {
  open: 'neutral',
  planned: 'info',
  'in-progress': 'success',
  waiting: 'warning',
  done: 'neutral',
};

const STATE_ORDER_COLUMNS: DataTableColumn<WorkOrder>[] = [
  { id: 'order', header: 'Work order', cell: (order) => order.title },
  {
    id: 'id',
    header: 'Order',
    nowrap: true,
    cell: (order) => <TagId>{order.id}</TagId>,
  },
  {
    id: 'asset',
    header: 'Asset',
    nowrap: true,
    cell: (order) => <TagId>{findAsset(order.assetId)?.tag ?? ''}</TagId>,
  },
  {
    id: 'status',
    header: 'Status',
    nowrap: true,
    cell: (order) => <StatusPill tone={STATE_ORDER_TONE[order.status]}>{STATE_ORDER_LABEL[order.status]}</StatusPill>,
  },
  {
    id: 'due',
    header: 'Due',
    numeric: true,
    cell: (order) => formatDate(order.dueAt),
  },
];

const STATE_FILTERS = ['Status: Done', 'Area: Cooling water', 'Priority: P1'];

type StateImportRow = {
  id: string;
  row: string;
  tag: string;
  problem: string;
  fix: string;
};

const STATE_IMPORT_FAILURES: StateImportRow[] = [
  {
    id: 'f1',
    row: '212',
    tag: '23-PT-92531',
    problem: 'Unit "bar g" is not recognised',
    fix: 'Map to barg',
  },
  {
    id: 'f2',
    row: '388',
    tag: '23-TT-92532',
    problem: 'High limit is below the low limit',
    fix: 'Swap the limits',
  },
  {
    id: 'f3',
    row: '401',
    tag: '40-TT-40015',
    problem: 'Asset 40-PA-4002 does not exist',
    fix: 'Link to 40-PA-4001',
  },
  {
    id: 'f4',
    row: '617',
    tag: '27-IT-20013',
    problem: 'Duplicate of row 96',
    fix: 'Skip the row',
  },
  {
    id: 'f5',
    row: '904',
    tag: '20-LT-10012',
    problem: 'Range maximum is missing',
    fix: 'Use 100 %',
  },
];

function StateUser() {
  return (
    <div className="flex items-center gap-2.5">
      <Avatar variant="decorative-2" aria-label="Ingrid Haugen">
        <AvatarFallback>IH</AvatarFallback>
      </Avatar>
      <div className="text-sm leading-tight">
        <p className="font-medium">Ingrid Haugen</p>
        <p className="text-(color:--kit-text-3)">Day shift</p>
      </div>
    </div>
  );
}

function StateSkeletonStat() {
  return (
    <Panel className="col-span-3">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <Placeholder shape="block" className="size-8" />
          <Placeholder className="w-24" />
        </div>
        <Placeholder shape="block" className="h-8 w-28" />
        <Placeholder className="w-36" />
      </div>
    </Panel>
  );
}

function StateSkeletonRows({ rows, widths }: { rows: number; widths: readonly string[] }) {
  return (
    <div className="flex flex-1 flex-col">
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="flex flex-1 items-center gap-6 border-b border-(--kit-rule) px-(--kit-panel-pad) py-3.5 last:border-b-0">
          <Placeholder className={row % 2 === 0 ? 'mr-auto w-64' : 'mr-auto w-48'} />
          {widths.map((width, column) => (
            <Placeholder key={column} className={width} />
          ))}
        </div>
      ))}
    </div>
  );
}

function StateTemplateLoadingList() {
  return (
    <BrowserFrame url="nordkapp.test/work-orders" look="studio" minHeight={780}>
      <AppFrame
        variant="sidebar"
        brand={{ name: 'Nordkapp', detail: 'Operations', mark: <IconFlame /> }}
        nav={STATE_APP_NAV}
        current="work"
        tools={<StateUser />}
        title="Work orders"
        subtitle="Gas compression · all priorities"
        status={
          <div role="status">
            <StatusPill tone="info" size="lg" icon={<IconRefresh />}>
              Loading work orders
            </StatusPill>
          </div>
        }
        actions={
          <Button size="sm" disabled aria-describedby="state-loading-list-reason">
            <IconPlus /> New work order
          </Button>
        }
      >
        <Grid className="h-full grid-rows-[auto_minmax(0,1fr)]">
          <StateSkeletonStat />
          <StateSkeletonStat />
          <StateSkeletonStat />
          <StateSkeletonStat />
          <Panel
            className="col-span-12"
            title="All work orders"
            subtitle="Sorted by due date"
            padding="none"
            footer={<span id="state-loading-list-reason">Actions become available when the list has loaded. This usually takes two seconds.</span>}
          >
            <div className="flex items-center gap-6 border-y border-(--kit-rule) bg-(--kit-well) px-(--kit-panel-pad) py-2.5 text-sm font-medium text-(color:--kit-text-2)">
              <span className="mr-auto">Work order</span>
              <span className="w-24">Order</span>
              <span className="w-24">Asset</span>
              <span className="w-24">Status</span>
              <span className="w-16 text-right">Due</span>
            </div>
            <StateSkeletonRows rows={7} widths={['w-24', 'w-24', 'w-24', 'w-16']} />
          </Panel>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function StateTemplateLoadingDetail() {
  return (
    <BrowserFrame url="nordkapp.test/assets/23-KA-9101" look="console" minHeight={760}>
      <AppFrame
        variant="topbar"
        brand={{ name: 'Nordkapp', detail: 'Assets', mark: <IconFlame /> }}
        nav={STATE_TOP_NAV}
        current="overview"
        padding="none"
        tools={
          <>
            <span>23-KA-9101</span>
            <span className="font-medium tabular-nums">14:00:02 UTC</span>
          </>
        }
      >
        <Grid className="h-full grid-rows-[auto_auto_minmax(0,1fr)]">
          <div role="status" className="col-span-12 flex items-stretch bg-base-background">
            <div className="flex items-center gap-3 bg-info-foreground px-4 py-3 text-base-background">
              <IconRefresh className="size-6" aria-hidden="true" />
              <span className="text-xl font-semibold">Loading 1st stage compressor</span>
            </div>
            <div className="flex flex-1 items-center px-4">
              <Meter className="w-full" label="Sources loaded" value={2} max={5} unit="of 5" tone="info" hideScale />
            </div>
            <div className="flex items-center gap-2 px-4">
              <StatusPill tone="success">Identity</StatusPill>
              <StatusPill tone="success">Live values</StatusPill>
              <StatusPill tone="neutral">Trend</StatusPill>
              <StatusPill tone="neutral">Work</StatusPill>
              <StatusPill tone="neutral">Documents</StatusPill>
            </div>
          </div>

          <Panel className="col-span-4" title="Identity" subtitle="Loaded">
            <DetailList
              items={[
                { label: 'Tag', value: <TagId>23-KA-9101</TagId> },
                { label: 'Area', value: 'Gas compression' },
                { label: 'Criticality', value: 'A' },
                {
                  label: 'State',
                  value: <StatusPill tone="success">Running</StatusPill>,
                },
              ]}
            />
          </Panel>
          <Panel className="col-span-8" title="Live values" subtitle="Loaded 14:00:01">
            <StatGroup columns={4} label="Live values">
              {STATE_COMPRESSOR_SENSORS.map((sensor) => (
                <Stat
                  key={sensor.id}
                  variant="plain"
                  size="md"
                  label={sensor.name}
                  value={sensor.value}
                  decimals={sensor.decimals}
                  unit={sensor.unit}
                  target={`High ${sensor.highLimit}`}
                  tone={sensor.value > sensor.highLimit * 0.95 ? 'warning' : 'neutral'}
                />
              ))}
            </StatGroup>
          </Panel>

          <Panel className="col-span-8" title="Trend" subtitle="Loading 24 hours of 4 series">
            <div className="flex flex-1 gap-3">
              <div className="flex flex-col justify-between py-1">
                <Placeholder className="w-8" />
                <Placeholder className="w-8" />
                <Placeholder className="w-8" />
                <Placeholder className="w-8" />
              </div>
              <div className="flex min-h-48 flex-1 flex-col justify-between border-b border-l border-(--kit-rule) p-3">
                <Placeholder className="h-px w-full" />
                <Placeholder className="h-px w-full" />
                <Placeholder className="h-px w-full" />
                <Placeholder shape="block" className="h-10 w-full" />
              </div>
            </div>
          </Panel>
          <div className="col-span-4 flex flex-col gap-px">
            <Panel className="flex-1" title="Work orders" subtitle="Loading" padding="none">
              <StateSkeletonRows rows={3} widths={['w-16']} />
            </Panel>
            <Panel className="flex-1" title="Documents" subtitle="Loading" padding="none">
              <StateSkeletonRows rows={3} widths={['w-12']} />
            </Panel>
          </div>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function StateTemplateFirstUse() {
  return (
    <BrowserFrame url="nordkapp.test/trends" look="soft" minHeight={780}>
      <AppFrame variant="topbar" brand={{ name: 'Nordkapp', detail: 'Operations', mark: <IconFlame /> }} nav={STATE_TOP_NAV} current="trends" tools={<StateUser />}>
        <Grid className="h-full grid-rows-[minmax(0,1fr)_auto]">
          <Panel className="col-span-5" tone="purple">
            <StateMessage
              className="flex-1 justify-center"
              icon={<IconChartLine />}
              tone="purple"
              code="Trends"
              title="You have no saved trends yet"
              description="A trend keeps a set of time series, their limits and a time range together, so the same view is one click away on every shift."
              actions={
                <>
                  <Button size="lg">
                    <IconPlus /> Build a trend
                  </Button>
                  <Button size="lg" variant="ghost">
                    Watch how
                  </Button>
                </>
              }
            />
          </Panel>
          <Panel className="col-span-7" title="What a saved trend looks like" subtitle="Sample: discharge pressure, 1st stage compressor">
            <TrendArea
              label="Sample trend of discharge pressure over 24 hours with its high limit"
              labels={STATE_SAMPLE_HOURS}
              unit="barg"
              decimals={1}
              height={250}
              series={[
                {
                  id: 'pressure',
                  label: 'Discharge pressure',
                  values: STATE_SAMPLE_VALUES,
                  tone: 'accent',
                },
              ]}
              limits={[{ value: 52, label: 'High limit', tone: 'warning' }]}
            />
          </Panel>

          <FeatureCard
            className="col-span-4"
            tone="blue"
            icon={<IconTemplate />}
            title="Start from a template"
            body="Compressor train, separator or pump: the usual series and limits, ready to adjust."
            action={
              <Button variant="outline" size="sm">
                Browse 12 templates
              </Button>
            }
          />
          <FeatureCard
            className="col-span-4"
            tone="teal"
            icon={<IconTopologyStar3 />}
            title="Start from an asset"
            body="Pick equipment and choose from the time series that hang on it."
            action={
              <Button variant="outline" size="sm">
                Pick an asset
              </Button>
            }
          />
          <FeatureCard
            className="col-span-4"
            tone="amber"
            icon={<IconSparkles />}
            title="Ask Atlas for one"
            body="Describe what you want to watch and get a trend with limits already set."
            action={
              <Button variant="outline" size="sm">
                Describe a trend
              </Button>
            }
          />
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function StateTemplateNoResults() {
  const [filters, setFilters] = useState<readonly string[]>(STATE_FILTERS);
  const matches = filters.length === 0 ? WORK_ORDERS : filters.length === 1 ? WORK_ORDERS.filter((order) => order.status === 'done') : [];
  return (
    <BrowserFrame url="nordkapp.test/work-orders?q=bearing" look="blueprint" minHeight={700}>
      <AppFrame
        variant="topbar"
        brand={{
          name: 'Nordkapp',
          detail: 'Work order register',
          mark: <IconFlame />,
        }}
        nav={STATE_TOP_NAV.slice(2)}
        current="work"
        tools={
          <>
            <span>
              Matches <span className="font-medium tabular-nums">{matches.length}</span>
            </span>
            <span>
              Filters <span className="font-medium tabular-nums">{filters.length}</span>
            </span>
          </>
        }
      >
        <Grid className="h-full grid-rows-[auto_minmax(0,1fr)]">
          <Panel className="col-span-12" title="Search" subtitle={`${WORK_ORDERS.length} orders in the register`} icon={<IconSearch className="size-4.5" aria-hidden="true" />}>
            <div className="flex flex-wrap items-center gap-3">
              <Search className="w-72" aria-label="Search work orders" defaultValue="bearing" />
              {filters.map((filter) => (
                <Button
                  key={filter}
                  variant="outline"
                  size="sm"
                  aria-label={`Remove filter ${filter}`}
                  onClick={() => setFilters((current) => current.filter((item) => item !== filter))}
                >
                  {filter} <IconX />
                </Button>
              ))}
              {filters.length < STATE_FILTERS.length ? (
                <Button variant="ghost" size="sm" onClick={() => setFilters(STATE_FILTERS)}>
                  Reset the example
                </Button>
              ) : null}
            </div>
          </Panel>

          {matches.length === 0 ? (
            <>
              <Panel className="col-span-7" title="Results" subtitle="0 matches">
                <StateMessage
                  className="flex-1 justify-center"
                  code="0 of 8 orders"
                  title="No work orders match all three filters"
                  description="Nothing in cooling water is both done and priority P1. Remove a filter above, or let the register relax them for you."
                  actions={
                    <>
                      <Button onClick={() => setFilters([STATE_FILTERS[0] ?? ''])}>Keep only “Status: Done”</Button>
                      <Button variant="outline" onClick={() => setFilters([])}>
                        Clear all filters
                      </Button>
                    </>
                  }
                />
              </Panel>
              <Panel className="col-span-5" title="Closest matches" subtitle="Filters matched, of 3">
                <ul className="flex flex-1 flex-col justify-between">
                  <ListRow title="Replace bearing temperature transmitter" meta="Cooling water · P2 · planned" trailing={<StatusPill tone="info">2 of 3</StatusPill>} />
                  <ListRow title="Inspect recompressor drive-end bearing" meta="Gas compression · P1 · in progress" trailing={<StatusPill tone="info">1 of 3</StatusPill>} />
                  <ListRow title="Calibrate separator level transmitter" meta="Inlet and separation · P3 · done" trailing={<StatusPill tone="info">1 of 3</StatusPill>} />
                  <ListRow title="Partial stroke test, inlet shutdown valve" meta="Inlet and separation · P2 · done" trailing={<StatusPill tone="info">1 of 3</StatusPill>} />
                  <ListRow title="Vibration survey, 1st stage compressor" meta="Gas compression · P2 · open" trailing={<StatusPill tone="neutral">0 of 3</StatusPill>} />
                </ul>
              </Panel>
            </>
          ) : (
            <Panel className="col-span-12" title="Results" subtitle={`${matches.length} matches`} padding="none">
              <DataTable label="Matching work orders" flush columns={STATE_ORDER_COLUMNS} rows={matches} rowKey={(order) => order.id} />
            </Panel>
          )}
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function StateTemplateServerError() {
  return (
    <BrowserFrame url="nordkapp.test/trends/recompressor" look="poster" minHeight={700}>
      <Canvas className="flex flex-col">
        <Grid className="flex-1 grid-rows-[minmax(0,1fr)_auto]">
          <Panel className="col-span-7" tone="pink">
            <div data-tone="pink" className="-m-(--kit-panel-pad) flex flex-1 flex-col justify-between gap-6 bg-(--t-pop) p-(--kit-panel-pad) text-(color:--t-on-pop)">
              <StateMessage
                className="flex-1 justify-center"
                tone="pink"
                code="500"
                title="Something broke on our side."
                description="The trend service did not answer. It is not your connection and nothing you did. We have been told and are looking at it."
                actions={
                  <>
                    <Button size="lg">
                      <IconRefresh /> Try again
                    </Button>
                    <Button size="lg" variant="secondary">
                      Open the status page
                    </Button>
                  </>
                }
              />
            </div>
          </Panel>
          <div className="col-span-5 flex flex-col gap-(--kit-gap)">
            <Panel className="flex-1" tone="amber" title="What we know" subtitle="Updated 14:00 UTC">
              <DetailList
                items={[
                  { label: 'Incident', value: 'NK-INC-0412' },
                  { label: 'Started', value: '13:57 UTC' },
                  { label: 'Affects', value: 'Trends and charts' },
                  {
                    label: 'Still working',
                    value: 'Alarms, work orders, handover',
                  },
                ]}
              />
            </Panel>
            <Stat size="lg" tone="green" label="Your unsaved trend" value="Kept" target="Stored in this browser at 13:56" />
          </div>
          <Stat className="col-span-4" size="md" tone="blue" label="Trying again automatically in" value="0:20" />
          <Stat className="col-span-4" size="md" tone="teal" label="Reference for support" value="7f3a-92c1" />
          <Panel className="col-span-4">
            <div className="flex flex-1 items-center justify-between gap-4">
              <p className="text-base font-bold">Rather go somewhere that works?</p>
              <Button variant="outline">
                <IconArrowLeft /> Plant overview
              </Button>
            </div>
          </Panel>
        </Grid>
      </Canvas>
    </BrowserFrame>
  );
}

function StateTemplateNotFound() {
  return (
    <BrowserFrame url="nordkapp.test/assets/23-KA-9109" look="editorial" minHeight={760}>
      <AppFrame
        variant="masthead"
        brand={{ name: 'Nordkapp' }}
        nav={STATE_LOST_NAV}
        tools={<span>Error 404 · nordkapp.test/assets/23-KA-9109</span>}
        title="There is no asset 23-KA-9109 at Nordkapp."
        subtitle="The link may be mistyped, or the equipment was renumbered. Nothing is broken; this page simply does not exist."
      >
        <Grid className="h-full">
          <Panel className="col-span-7" title="Were you looking for one of these?" subtitle="Compressors with a similar tag.">
            <ul className="flex flex-1 flex-col justify-between">
              <ListRow
                title="1st stage compressor"
                meta={<TagId>23-KA-9101</TagId>}
                trailing={
                  <Button variant="outline" size="sm">
                    Open <IconArrowRight />
                  </Button>
                }
              />
              <ListRow
                title="2nd stage compressor"
                meta={<TagId>23-KA-9102</TagId>}
                trailing={
                  <Button variant="outline" size="sm">
                    Open <IconArrowRight />
                  </Button>
                }
              />
              <ListRow
                title="Recompressor"
                meta={<TagId>23-KA-9103</TagId>}
                trailing={
                  <Button variant="outline" size="sm">
                    Open <IconArrowRight />
                  </Button>
                }
              />
            </ul>
          </Panel>
          <Panel className="col-span-5" title="Or find it yourself" subtitle="Search 18 420 assets by tag or name.">
            <div className="flex flex-1 flex-col justify-between gap-6">
              <Search aria-label="Search assets" defaultValue="23-KA-91" />
              <DetailList
                items={[
                  { label: 'You came from', value: 'Shift handover, 11 March' },
                  {
                    label: 'Link reported',
                    value: 'Automatically, to the note’s author',
                  },
                ]}
              />
              <div className="flex flex-wrap gap-3">
                <Button size="lg">
                  <IconHome /> Go to home
                </Button>
                <Button size="lg" variant="outline">
                  <IconArrowLeft /> Back to the note
                </Button>
              </div>
            </div>
          </Panel>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function StateTemplateNoAccess() {
  return (
    <BrowserFrame url="nordkapp.test/budgets/maintenance-2026" look="glass" minHeight={760}>
      <AppFrame
        variant="rail"
        brand={{ name: 'Nordkapp', mark: <IconFlame /> }}
        nav={STATE_RAIL_NAV}
        current="budget"
        title="Maintenance budget 2026"
        subtitle="Nordkapp gas processing · restricted"
      >
        <Grid className="h-full grid-rows-[minmax(0,1fr)_auto]">
          <Panel className="col-span-7" tone="amber">
            <StateMessage
              className="flex-1 justify-center"
              icon={<IconLock />}
              tone="amber"
              code="403"
              title="This page is for maintenance planners"
              description="You are signed in as a control room operator. Budgets are limited to the planning role; your access to work orders is not affected."
              actions={
                <>
                  <Button size="lg">Ask for the planner role</Button>
                  <Button size="lg" variant="outline">
                    <IconArrowLeft /> Back to work orders
                  </Button>
                </>
              }
            />
          </Panel>
          <div className="col-span-5 flex flex-col gap-(--kit-gap)">
            <Panel className="h-auto" title="Who can let you in" subtitle="Owners of the planning role">
              <ul>
                <ListRow
                  leading={
                    <Avatar variant="decorative-5" aria-label="Magnus Solberg">
                      <AvatarFallback>MS</AvatarFallback>
                    </Avatar>
                  }
                  title="Magnus Solberg"
                  meta={findPerson('ms')?.role}
                  trailing={<StatusPill tone="success">Online</StatusPill>}
                />
                <ListRow
                  leading={
                    <Avatar variant="decorative-3" aria-label="Liv Wold">
                      <AvatarFallback>LW</AvatarFallback>
                    </Avatar>
                  }
                  title="Liv Wold"
                  meta={findPerson('lw')?.role}
                  trailing={<StatusPill tone="neutral">In a meeting</StatusPill>}
                />
              </ul>
            </Panel>
            <Panel className="flex-1" title="Your access today" subtitle="Control room operator">
              <DetailList
                items={[
                  {
                    label: 'Alarms and trends',
                    value: <StatusPill tone="success">Full</StatusPill>,
                  },
                  {
                    label: 'Work orders',
                    value: <StatusPill tone="success">Create and comment</StatusPill>,
                  },
                  {
                    label: 'Budgets',
                    value: <StatusPill tone="warning">None</StatusPill>,
                  },
                ]}
              />
            </Panel>
          </div>
          <FeatureCard
            className="col-span-4"
            tone="sky"
            icon={<IconClipboardList />}
            title="Open work orders"
            body="23 open on the plant, 6 on gas compression."
            action={
              <Button variant="outline" size="sm">
                Open list
              </Button>
            }
          />
          <FeatureCard
            className="col-span-4"
            tone="pink"
            icon={<IconTool />}
            title="Maintenance backlog"
            body="The shared dashboard needs no extra role."
            action={
              <Button variant="outline" size="sm">
                Open dashboard
              </Button>
            }
          />
          <FeatureCard
            className="col-span-4"
            tone="teal"
            icon={<IconFileText />}
            title="Cost per order"
            body="Estimated hours and parts are on each work order."
            action={
              <Button variant="outline" size="sm">
                See an example
              </Button>
            }
          />
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function StateTemplateOffline() {
  return (
    <BrowserFrame url="nordkapp.test/rounds/compression-deck" look="signal" minHeight={760}>
      <AppFrame
        brand={{ name: 'Nordkapp' }}
        title="Compression deck round"
        subtitle="Tablet 7 · Jonas Nyberg · checkpoint 9 of 12"
        status={
          <StatusPill tone="critical" size="lg">
            No connection
          </StatusPill>
        }
      >
        <Grid className="h-full grid-rows-[minmax(0,1fr)_auto_auto]">
          <Panel className="col-span-8" tone="critical">
            <div className="flex flex-1 flex-col justify-between gap-5">
              <p className="text-lg font-semibold">Connection</p>
              <div className="flex items-center gap-5">
                <IconCloudOff className="size-20 shrink-0" stroke={2.2} aria-hidden="true" />
                <p className="text-7xl leading-none font-extrabold tracking-tighter">Offline</p>
              </div>
              <p className="max-w-2xl text-xl font-medium">
                Keep going. Your readings are saved on this tablet and sent when the network is back. Live values on this screen are frozen at 13:58.
              </p>
            </div>
          </Panel>
          <Stat className="col-span-4" size="hero" tone="warning" label="Trying again in" value="0:12" target="Attempt 4 · last tried 13:59:48" />

          <Stat className="col-span-4" size="lg" tone="info" label="Waiting to be sent" state="3 readings" value="2" unit="photos" />
          <Stat className="col-span-4" size="lg" tone="success" label="Saved on this tablet" state="Safe" stateIcon={<IconCircleCheck />} value="13:59" unit="last save" />
          <Stat className="col-span-4" size="lg" tone="neutral" label="Last in sync" state="13:58" value="2" unit="min ago" />

          <Panel className="col-span-12">
            <div className="flex flex-1 items-center justify-between gap-6">
              <p className="text-base font-medium">For anything urgent, call the control room on channel 4 or +47 78 40 12 00.</p>
              <div className="flex shrink-0 gap-2.5">
                <Button size="lg">
                  <IconRefresh /> Try now
                </Button>
                <Button size="lg" variant="secondary">
                  Continue the round offline
                </Button>
              </div>
            </div>
          </Panel>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function StateTemplateMaintenance() {
  return (
    <BrowserFrame url="nordkapp.test" look="studio" minHeight={760}>
      <AppFrame
        variant="topbar"
        brand={{ name: 'Nordkapp', detail: 'Operations', mark: <IconFlame /> }}
        tools={
          <Button variant="ghost" size="sm">
            Status page
          </Button>
        }
        title="Nordkapp is being upgraded"
        subtitle="Planned maintenance, Saturday 14 March, 02:00 to 04:00 UTC. Announced on 7 March."
        status={
          <StatusPill tone="info" size="lg" icon={<IconTool />}>
            Back at about 04:00
          </StatusPill>
        }
      >
        <Grid className="h-full grid-rows-[auto_minmax(0,1fr)]">
          <Panel className="col-span-12">
            <StepRail
              label="Maintenance plan"
              orientation="horizontal"
              current={2}
              steps={[
                { id: 'backup', label: 'Back up', detail: 'Done 02:14' },
                {
                  id: 'upgrade',
                  label: 'Upgrade the database',
                  detail: 'Done 03:05',
                },
                {
                  id: 'verify',
                  label: 'Verify the data',
                  detail: 'Running, 18 minutes left',
                },
                {
                  id: 'open',
                  label: 'Open for everyone',
                  detail: 'About 04:00',
                },
              ]}
            />
          </Panel>
          <Panel className="col-span-4" tone="blue" title="Progress" subtitle="Step 3 of 4">
            <div className="flex flex-1 flex-col items-center justify-between gap-4">
              <RingGauge label="Upgrade progress" value={72} size={160} tone="blue" hideLabel />
              <p className="text-center text-sm text-(color:--kit-text-2)">This page checks every 30 seconds and opens the app by itself when the upgrade is done.</p>
            </div>
          </Panel>
          <Panel className="col-span-4" title="What still works" subtitle="During the upgrade">
            <ul className="flex flex-1 flex-col justify-between">
              <ListRow title="Control room alarm panel" meta="Independent of this application" trailing={<StatusPill tone="success">Working</StatusPill>} />
              <ListRow title="Data collection" meta="Buffered and filled in afterwards" trailing={<StatusPill tone="success">Working</StatusPill>} />
              <ListRow title="Trends and dashboards" meta="Back at about 04:00" trailing={<StatusPill tone="warning">Paused</StatusPill>} />
              <ListRow title="Work orders" meta="Read only until 04:00" trailing={<StatusPill tone="warning">Read only</StatusPill>} />
            </ul>
          </Panel>
          <Panel className="col-span-4" title="Need something now?" subtitle="People on call tonight">
            <div className="flex flex-1 flex-col justify-between gap-4">
              <DetailList
                items={[
                  { label: 'Control room', value: '+47 78 40 12 00' },
                  { label: 'On call', value: 'Liv Wold' },
                  { label: 'Paper handover', value: 'Form NK-HO-2' },
                ]}
              />
              <Button variant="outline" className="w-full">
                <IconBell /> Tell me when it is back
              </Button>
            </div>
          </Panel>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function StateTemplateSuccess() {
  return (
    <BrowserFrame url="nordkapp.test/handover/2026-03-12/signed" look="soft" minHeight={700}>
      <Canvas className="flex flex-col items-center justify-center gap-(--kit-gap)">
        <Panel className="h-auto w-full max-w-3xl flex-none" tone="green">
          <div className="grid grid-cols-5 gap-8 p-2">
            <StateMessage
              className="col-span-3"
              icon={<IconCircleCheck />}
              tone="success"
              code="Shift handover"
              title="Handover signed and sent"
              description="Liv Wold has the note for the evening shift. You can still add a remark until she countersigns it."
              actions={
                <>
                  <Button size="lg">
                    Done <IconArrowRight />
                  </Button>
                  <Button size="lg" variant="outline">
                    View the note
                  </Button>
                </>
              }
            />
            <div className="col-span-2 flex flex-col justify-center rounded-(--kit-radius-sm) bg-(--kit-surface) p-5">
              <DetailList
                items={[
                  { label: 'Signed', value: '13:59 UTC' },
                  { label: 'By', value: 'Ingrid Haugen' },
                  { label: 'To', value: 'Liv Wold' },
                  { label: 'Entries', value: '6' },
                  { label: 'Open alarms', value: '4 carried over' },
                ]}
              />
            </div>
          </div>
        </Panel>
        <div className="grid w-full max-w-3xl grid-cols-3 gap-(--kit-gap)">
          <FeatureCard
            className="h-auto"
            tone="blue"
            icon={<IconFileText />}
            title="Download a copy"
            body="A PDF with both signatures once it is countersigned."
            action={
              <Button variant="outline" size="sm">
                Download
              </Button>
            }
          />
          <FeatureCard
            className="h-auto"
            tone="amber"
            icon={<IconBell />}
            title="Follow the trip"
            body="Get a message when the bearing inspection is done."
            action={
              <Button variant="outline" size="sm">
                Follow
              </Button>
            }
          />
          <FeatureCard
            className="h-auto"
            tone="purple"
            icon={<IconHome />}
            title="Sign out"
            body="Your shift ended at 14:00. See you tomorrow."
            action={
              <Button variant="outline" size="sm">
                Sign out
              </Button>
            }
          />
        </div>
      </Canvas>
    </BrowserFrame>
  );
}

function StateTemplatePartialFailure() {
  const [fixed, setFixed] = useState<readonly string[]>(['f1']);
  const left = STATE_IMPORT_FAILURES.length - fixed.length;
  const columns: DataTableColumn<StateImportRow>[] = [
    {
      id: 'row',
      header: 'Row',
      numeric: true,
      width: 'w-16',
      cell: (row) => row.row,
    },
    {
      id: 'tag',
      header: 'Tag',
      nowrap: true,
      cell: (row) => <TagId>{row.tag}</TagId>,
    },
    { id: 'problem', header: 'Problem', cell: (row) => row.problem },
    {
      id: 'fix',
      header: 'Suggested fix',
      nowrap: true,
      muted: true,
      cell: (row) => row.fix,
    },
    {
      id: 'state',
      header: 'State',
      nowrap: true,
      cell: (row) => (fixed.includes(row.id) ? <StatusPill tone="success">Imported</StatusPill> : <StatusPill tone="critical">Failed</StatusPill>),
    },
    {
      id: 'action',
      header: 'Action',
      align: 'end',
      nowrap: true,
      cell: (row) =>
        fixed.includes(row.id) ? (
          <Button variant="ghost" size="sm" onClick={() => setFixed((current) => current.filter((id) => id !== row.id))}>
            Undo
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setFixed((current) => [...current, row.id])}>
            Apply fix
          </Button>
        ),
    },
  ];
  return (
    <BrowserFrame url="nordkapp.test/imports/sensor-limits-march" look="console" minHeight={680}>
      <AppFrame
        variant="topbar"
        brand={{ name: 'Nordkapp', detail: 'Imports', mark: <IconFlame /> }}
        nav={STATE_TOP_NAV.slice(0, 3)}
        padding="none"
        tools={
          <>
            <span>sensor-limits-march.csv</span>
            <span className="font-medium tabular-nums">14:00:00 UTC</span>
          </>
        }
      >
        <Grid className="h-full grid-rows-[auto_auto_minmax(0,1fr)_auto]">
          <PageBanner
            className="col-span-12"
            tone={left === 0 ? 'success' : 'warning'}
            icon={left === 0 ? <IconCircleCheck /> : <IconAlertTriangle />}
            title={left === 0 ? 'Import complete' : `Import finished, ${left} ${left === 1 ? 'row' : 'rows'} still failing`}
            action={
              <Button variant="secondary" size="sm">
                Download failed rows
              </Button>
            }
          >
            1,204 rows are live. The failed rows changed nothing; fix them here or in the file.
          </PageBanner>
          <StatGroup columns={4} label="Import result" className="col-span-12">
            <Stat variant="plain" size="lg" label="Imported" value={1204 + fixed.length} tone="success" target="Of 1,221 rows" />
            <Stat variant="plain" size="lg" label="Failed" value={left} tone={left === 0 ? 'neutral' : 'critical'} target="Fix below" />
            <Stat variant="plain" size="lg" label="Skipped" value={12} target="Unchanged since February" />
            <Stat variant="plain" size="lg" label="Duration" value="0:48" unit="min" target="Finished 13:59" />
          </StatGroup>
          <Panel className="col-span-12" title="Rows that failed" subtitle={`${left} left · suggested fixes are applied one row at a time`} padding="none">
            <DataTable
              label="Failed import rows"
              flush
              columns={columns}
              rows={STATE_IMPORT_FAILURES}
              rowKey={(row) => row.id}
              rowTone={(row) => (fixed.includes(row.id) ? 'success' : 'critical')}
              density="default"
            />
          </Panel>
          <div className="col-span-12 flex items-center justify-between gap-4 bg-base-background px-3.5 py-3">
            <p className="text-sm text-medium-foreground">Imported by Aisha Khan · every applied fix is written to the audit log.</p>
            <div className="flex gap-2.5">
              <Button variant="outline" onClick={() => setFixed([])}>
                Undo all fixes
              </Button>
              <Button disabled={left === 0} onClick={() => setFixed(STATE_IMPORT_FAILURES.map((row) => row.id))}>
                Apply all {left} suggested fixes
              </Button>
            </div>
          </div>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function StateTemplateArchived() {
  const [restored, setRestored] = useState(false);
  return (
    <BrowserFrame url="nordkapp.test/work-orders/WO-104431" look="editorial" minHeight={800}>
      <AppFrame
        variant="masthead"
        brand={{ name: 'Nordkapp' }}
        nav={STATE_RECORD_NAV}
        current="record"
        tools={<span>WO-104431 · inspection · P2</span>}
        title="Partial stroke test, inlet shutdown valve"
        subtitle="Completed on 10 March by Tomás Barros. The valve closed to 20 per cent in 1.8 seconds, inside the 2.5 second requirement."
      >
        <Grid className="h-full grid-rows-[auto_minmax(0,1fr)]">
          <PageBanner
            className="col-span-12"
            tone={restored ? 'success' : 'warning'}
            icon={restored ? <IconCircleCheck /> : <IconArchive />}
            title={restored ? 'Restored. This work order can be edited again.' : 'Archived on 11 March by Magnus Solberg. This record is read only.'}
            action={
              <Button variant="outline" onClick={() => setRestored((current) => !current)}>
                {restored ? 'Archive again' : 'Restore'}
              </Button>
            }
          >
            {restored
              ? 'The change is in the history below and Magnus Solberg has been told.'
              : 'Archived records stay searchable and keep their history. Restoring needs the planner role, which you have.'}
          </PageBanner>
          <Panel className="col-span-7" title="What was done" subtitle="As recorded when the order was closed.">
            <div className="flex flex-1 flex-col justify-between gap-6">
              <DetailList
                layout="columns"
                columns={3}
                items={[
                  { label: 'Asset', value: <TagId>20-XV-1105</TagId> },
                  { label: 'Type', value: 'Inspection' },
                  { label: 'Priority', value: 'P2' },
                  { label: 'Estimated', value: '1 h' },
                  { label: 'Actual', value: '0.8 h' },
                  { label: 'Result', value: 'Passed' },
                ]}
              />
              <p className="max-w-[60ch] text-base leading-relaxed">
                The valve was stroked from the control room with the operator at the valve. Travel and timing were read from the positioner. No sticking, no abnormal noise. Next
                test is due in six months.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="lg" disabled={!restored} aria-describedby="state-archived-reason">
                  Edit the record
                </Button>
                <Button size="lg" variant="outline">
                  Copy to a new order
                </Button>
                <p id="state-archived-reason" className="text-sm text-(color:--kit-text-2)">
                  {restored ? 'Editing is open.' : 'Restore the record to edit it.'}
                </p>
              </div>
            </div>
          </Panel>
          <Panel className="col-span-5" title="History" subtitle="Newest first.">
            <ul className="flex flex-1 flex-col justify-between">
              {restored ? <ListRow tone="success" title="Restored" meta="Ingrid Haugen" trailing="12 Mar 14:00" /> : null}
              <ListRow tone="warning" title="Archived" meta="Magnus Solberg · yearly clean-up" trailing="11 Mar 09:12" />
              <ListRow title="Closed as passed" meta="Tomás Barros" trailing="10 Mar 15:40" />
              <ListRow title="Test carried out" meta="Tomás Barros with Ingrid Haugen" trailing="10 Mar 14:55" />
              <ListRow title="Planned" meta="Magnus Solberg" trailing="3 Mar 08:30" />
            </ul>
          </Panel>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

export default definePage({
  id: 'state-pages',
  title: 'State pages',
  summary:
    'Whole pages for the moments when the content is not simply there: loading, empty, failed, forbidden, offline, under maintenance, done, partly done and archived. Each is a full page in a different look, and each keeps a way forward on screen.',
  guidance: {
    use: [
      'Say the state in words at the size the look gives its headline; add a code only as a reference.',
      'Keep the page chrome and anything already known on screen while the rest loads or fails.',
      'Always offer the next step: retry, relax a filter, ask a named person, go somewhere that works.',
      'Tell people what is safe: saved drafts, queued readings, unchanged data.',
    ],
    avoid: [
      'A spinner alone on a blank page; show the shape of what is coming.',
      'Blaming the reader for a server error, or hiding that it is on your side.',
      'An empty state with a heading and nothing to do.',
    ],
  },
  source,
  sections: [
    {
      id: 'loading',
      title: 'Loading',
      description: 'The page before its data has arrived.',
      specimens: [
        {
          id: 'StateTemplateLoadingList',
          title: 'Page loading, list',
          note: 'Pick it while a list page loads: the chrome and headings are real, tiles and rows are placeholders in their final shape.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/landing-pages/BrowserFrame.tsx', 'kit/AppFrame.tsx', 'kit/state-pages/Placeholder.tsx', 'kit/Panel.tsx', 'kit/StatusPill.tsx'],
          Component: StateTemplateLoadingList,
        },
        {
          id: 'StateTemplateLoadingDetail',
          title: 'Page loading, detail',
          note: 'Pick it when a detail page loads from several sources: show each panel as soon as it arrives and say how many are left.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: [
            'kit/landing-pages/BrowserFrame.tsx',
            'kit/AppFrame.tsx',
            'kit/state-pages/Placeholder.tsx',
            'kit/Meter.tsx',
            'kit/StatGroup.tsx',
            'kit/auth-pages/DetailList.tsx',
          ],
          Component: StateTemplateLoadingDetail,
        },
      ],
    },
    {
      id: 'empty',
      title: 'Empty',
      description: 'Nothing to show, for two very different reasons.',
      specimens: [
        {
          id: 'StateTemplateFirstUse',
          title: 'First-use empty page',
          note: 'Pick it when a section has never been used: say what it is for, show what it will look like and offer three ways to start.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/landing-pages/BrowserFrame.tsx', 'kit/AppFrame.tsx', 'kit/state-pages/StateMessage.tsx', 'kit/landing-pages/FeatureCard.tsx', 'kit/TrendArea.tsx'],
          Component: StateTemplateFirstUse,
        },
        {
          id: 'StateTemplateNoResults',
          title: 'No results',
          note: 'Pick it when filters leave nothing: name the filters, offer to relax them and show the closest matches.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/landing-pages/BrowserFrame.tsx', 'kit/AppFrame.tsx', 'kit/state-pages/StateMessage.tsx', 'kit/DataTable.tsx', 'kit/ListRow.tsx'],
          Component: StateTemplateNoResults,
        },
      ],
    },
    {
      id: 'errors',
      title: 'Errors',
      description: 'Something stands between the reader and the page.',
      specimens: [
        {
          id: 'StateTemplateServerError',
          title: 'Error page, 500',
          note: 'Pick it when the service fails: own the fault, say what is affected and what is safe, and retry by itself.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/landing-pages/BrowserFrame.tsx', 'kit/Canvas.tsx', 'kit/state-pages/StateMessage.tsx', 'kit/auth-pages/DetailList.tsx', 'kit/Stat.tsx'],
          Component: StateTemplateServerError,
        },
        {
          id: 'StateTemplateNotFound',
          title: 'Not found',
          note: 'Pick it for a link that leads nowhere: say what was not found in the reader’s terms and suggest what they probably meant.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/landing-pages/BrowserFrame.tsx', 'kit/AppFrame.tsx', 'kit/ListRow.tsx', 'kit/auth-pages/DetailList.tsx'],
          Component: StateTemplateNotFound,
        },
        {
          id: 'StateTemplateNoAccess',
          title: 'No access',
          note: 'Pick it when the role does not allow the page: name the role, the people who grant it and what the reader can open instead.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/landing-pages/BrowserFrame.tsx', 'kit/AppFrame.tsx', 'kit/state-pages/StateMessage.tsx', 'kit/landing-pages/FeatureCard.tsx', 'kit/ListRow.tsx'],
          Component: StateTemplateNoAccess,
        },
      ],
    },
    {
      id: 'connection',
      title: 'Connection and service',
      description: 'The network or the service is away for a while.',
      specimens: [
        {
          id: 'StateTemplateOffline',
          title: 'Offline, reconnecting',
          note: 'Pick it on field tablets and wall screens: the state fills the screen, with what is saved and when it tries again.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/landing-pages/BrowserFrame.tsx', 'kit/AppFrame.tsx', 'kit/Panel.tsx', 'kit/Stat.tsx'],
          Component: StateTemplateOffline,
        },
        {
          id: 'StateTemplateMaintenance',
          title: 'Maintenance',
          note: 'Pick it during a planned upgrade: where it is in the plan, when it ends and what still works meanwhile.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/landing-pages/BrowserFrame.tsx', 'kit/AppFrame.tsx', 'kit/auth-pages/StepRail.tsx', 'kit/RingGauge.tsx', 'kit/ListRow.tsx', 'kit/auth-pages/DetailList.tsx'],
          Component: StateTemplateMaintenance,
        },
      ],
    },
    {
      id: 'outcomes',
      title: 'Outcomes and locks',
      description: 'A flow has ended, fully or partly, or a record is closed.',
      specimens: [
        {
          id: 'StateTemplateSuccess',
          title: 'Confirmation after a flow',
          note: 'Pick it as the last page of a flow: what was done, the facts worth keeping and what to do next.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/landing-pages/BrowserFrame.tsx', 'kit/Canvas.tsx', 'kit/state-pages/StateMessage.tsx', 'kit/landing-pages/FeatureCard.tsx', 'kit/auth-pages/DetailList.tsx'],
          Component: StateTemplateSuccess,
        },
        {
          id: 'StateTemplatePartialFailure',
          title: 'Partially failed page',
          note: 'Pick it when most of a job worked: count what did, list what did not with its reason and let each row be fixed.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/landing-pages/BrowserFrame.tsx', 'kit/AppFrame.tsx', 'kit/state-pages/PageBanner.tsx', 'kit/DataTable.tsx', 'kit/StatGroup.tsx'],
          Component: StateTemplatePartialFailure,
        },
        {
          id: 'StateTemplateArchived',
          title: 'Read-only, archived record',
          note: 'Pick it for a record that can be read but not changed: a banner says why and how to restore it, and edits say why they are off.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/landing-pages/BrowserFrame.tsx', 'kit/AppFrame.tsx', 'kit/state-pages/PageBanner.tsx', 'kit/auth-pages/DetailList.tsx', 'kit/ListRow.tsx'],
          Component: StateTemplateArchived,
        },
      ],
    },
  ],
});
