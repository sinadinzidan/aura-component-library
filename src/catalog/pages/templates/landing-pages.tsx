import { Avatar, AvatarFallback } from '@cognite/aura/components/avatar';
import { Button } from '@cognite/aura/components/button';
import { Search } from '@cognite/aura/components/search';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import {
  IconAlertTriangle,
  IconArrowRight,
  IconBell,
  IconBook,
  IconChartLine,
  IconClipboardList,
  IconCode,
  IconDatabase,
  IconFileText,
  IconFlame,
  IconHome,
  IconLayoutDashboard,
  IconListCheck,
  IconPlayerPlay,
  IconReport,
  IconRobot,
  IconRocket,
  IconSchool,
  IconSettings,
  IconSparkles,
  IconTool,
  IconUsers,
} from '@cognite/aura/icons';
import { useState } from 'react';

import { AppFrame, type AppFrameNavItem } from '../../../library/kit/AppFrame';
import { DetailList } from '../../../library/kit/auth-pages/DetailList';
import { Bars } from '../../../library/kit/Bars';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { Donut } from '../../../library/kit/Donut';
import { Grid } from '../../../library/kit/Grid';
import { HeatStrip, type HeatRow } from '../../../library/kit/HeatStrip';
import { IconChip } from '../../../library/kit/IconChip';
import { BrowserFrame } from '../../../library/kit/landing-pages/BrowserFrame';
import { ChecklistItem } from '../../../library/kit/landing-pages/ChecklistItem';
import { FeatureCard } from '../../../library/kit/landing-pages/FeatureCard';
import { Hero } from '../../../library/kit/landing-pages/Hero';
import { PriceCard, type PriceFeature } from '../../../library/kit/landing-pages/PriceCard';
import { PullQuote } from '../../../library/kit/landing-pages/PullQuote';
import { ReleaseEntry } from '../../../library/kit/landing-pages/ReleaseEntry';
import { ListRow } from '../../../library/kit/ListRow';
import { Panel } from '../../../library/kit/Panel';
import { RingGauge } from '../../../library/kit/RingGauge';
import { SparkLine } from '../../../library/kit/SparkLine';
import { Stat } from '../../../library/kit/Stat';
import { StatGroup } from '../../../library/kit/StatGroup';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import type { Tone } from '../../../library/kit/tones';
import { TrendArea } from '../../../library/kit/TrendArea';
import { TrendLine } from '../../../library/kit/TrendLine';
import { PEOPLE, PLANT_KPIS, WORK_ORDERS, findAsset } from '../../data/plant';
import { formatDate, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './landing-pages.tsx?raw';

const LAND_APP_NAV: AppFrameNavItem[] = [
  { id: 'home', label: 'Home', icon: <IconHome /> },
  { id: 'overview', label: 'Plant overview', icon: <IconLayoutDashboard /> },
  { id: 'alarms', label: 'Alarms', icon: <IconBell />, badge: '4' },
  { id: 'trends', label: 'Trends', icon: <IconChartLine /> },
  { id: 'work', label: 'Work orders', icon: <IconClipboardList /> },
  { id: 'reports', label: 'Reports', icon: <IconReport /> },
];

const LAND_RAIL_NAV: AppFrameNavItem[] = [
  { id: 'team', label: 'Team', icon: <IconUsers /> },
  { id: 'overview', label: 'Plant overview', icon: <IconLayoutDashboard /> },
  { id: 'alarms', label: 'Alarms', icon: <IconBell />, badge: '4' },
  { id: 'work', label: 'Work orders', icon: <IconClipboardList /> },
  { id: 'settings', label: 'Settings', icon: <IconSettings /> },
];

const LAND_SITE_NAV: AppFrameNavItem[] = [
  { id: 'product', label: 'Product' },
  { id: 'solutions', label: 'Solutions' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'docs', label: 'Docs' },
];

const LAND_ROLE_NAV: AppFrameNavItem[] = [
  { id: 'problem', label: 'The problem' },
  { id: 'method', label: 'The method' },
  { id: 'proof', label: 'The proof' },
  { id: 'start', label: 'Getting started' },
];

const LAND_DOCS_NAV: AppFrameNavItem[] = [
  { id: 'guides', label: 'Guides', icon: <IconBook /> },
  { id: 'api', label: 'API reference', icon: <IconCode /> },
  { id: 'learn', label: 'Courses', icon: <IconSchool /> },
];

const LAND_CATALOGUE_NAV: AppFrameNavItem[] = [
  { id: 'catalogue', label: 'Catalogue', icon: <IconDatabase /> },
  { id: 'mine', label: 'My products', icon: <IconListCheck /> },
  { id: 'requests', label: 'Requests', icon: <IconFileText />, badge: '2' },
];

const LAND_RELEASE_NAV: AppFrameNavItem[] = [
  { id: '2026.3', label: '2026.3 · March' },
  { id: '2026.2', label: '2026.2 · February' },
  { id: '2026.1', label: '2026.1 · January' },
  { id: '2025.12', label: '2025.12 · December' },
  { id: '2025.11', label: '2025.11 · November' },
];

const LAND_AVAILABILITY = makeValues({
  seed: 41,
  points: 28,
  base: 96.8,
  amplitude: 0.6,
  noise: 0.25,
});

const LAND_DAYS = Array.from({ length: 28 }, (_, index) => `${index + 13 > 28 ? index - 15 : index + 13} ${index + 13 > 28 ? 'Mar' : 'Feb'}`);

const LAND_VIBRATION = [5.9, 6.0, 6.0, 6.1, 6.1, 6.2, 6.3, 6.3, 6.5, 6.6, 6.8, 7.0, 7.3, 7.7];

const LAND_VIBRATION_DAYS = ['27 Feb', '28 Feb', '1 Mar', '2 Mar', '3 Mar', '4 Mar', '5 Mar', '6 Mar', '7 Mar', '8 Mar', '9 Mar', '10 Mar', '11 Mar', '12 Mar'];

type LandRecent = { id: string; name: string; kind: string; when: string };

const LAND_RECENT: LandRecent[] = [
  {
    id: 'r1',
    name: 'Recompressor vibration, last 24 h',
    kind: 'Trend',
    when: '14 min ago',
  },
  {
    id: 'r2',
    name: 'Day shift handover, 12 March',
    kind: 'Handover note',
    when: '31 min ago',
  },
  {
    id: 'r3',
    name: 'Inspect recompressor drive-end bearing',
    kind: 'Work order',
    when: '1 h ago',
  },
  {
    id: 'r4',
    name: 'Weekly production report, week 10',
    kind: 'Report',
    when: 'Yesterday',
  },
  {
    id: 'r5',
    name: 'Compression train P&ID, sheet 3',
    kind: 'Drawing',
    when: 'Tuesday',
  },
];

const LAND_RECENT_COLUMNS: DataTableColumn<LandRecent>[] = [
  { id: 'name', header: 'Name', cell: (row) => row.name },
  {
    id: 'kind',
    header: 'Type',
    nowrap: true,
    muted: true,
    cell: (row) => row.kind,
  },
  {
    id: 'when',
    header: 'Opened',
    nowrap: true,
    numeric: true,
    cell: (row) => row.when,
  },
];

const LAND_MY_ORDERS = WORK_ORDERS.filter((order) => order.status !== 'done').slice(0, 4);

type LandStep = { id: string; title: string; detail: string };

const LAND_STEPS: LandStep[] = [
  {
    id: 'profile',
    title: 'Finish your profile',
    detail: 'Role, shift and a photo. 1 minute.',
  },
  {
    id: 'sites',
    title: 'Pick the sites you follow',
    detail: 'Their alarms and handovers land on your home page.',
  },
  {
    id: 'alarm',
    title: 'Acknowledge your first alarm',
    detail: 'Open the alarm list and work one through. 3 minutes.',
  },
  {
    id: 'trend',
    title: 'Build a trend and save it',
    detail: 'Three series from the compression train. 4 minutes.',
  },
  {
    id: 'handover',
    title: 'Write a handover note',
    detail: 'Start from the draft the shift log prepared. 2 minutes.',
  },
];

type LandProduct = {
  id: string;
  name: string;
  kind: 'Dashboard' | 'Data set' | 'Agent';
  owner: string;
  summary: string;
  state: string;
  tone: Tone;
  updated: string;
  size: string;
};

const LAND_PRODUCTS: LandProduct[] = [
  {
    id: 'p1',
    name: 'Plant overview',
    kind: 'Dashboard',
    owner: 'Operations',
    summary: 'KPIs, alarms and work for the whole plant on one screen.',
    state: 'Live',
    tone: 'success',
    updated: '14:00',
    size: '64 users',
  },
  {
    id: 'p2',
    name: 'Compressor telemetry',
    kind: 'Data set',
    owner: 'Rotating equipment',
    summary: 'Pressure, temperature and vibration for three compressor stages.',
    state: 'Live',
    tone: 'success',
    updated: '13:59',
    size: '412 series',
  },
  {
    id: 'p3',
    name: 'Trip review',
    kind: 'Agent',
    owner: 'Reliability',
    summary: 'Reads alarms and trends after a trip and drafts the review.',
    state: 'Running',
    tone: 'info',
    updated: '13:47',
    size: '3 runs today',
  },
  {
    id: 'p4',
    name: 'Maintenance backlog',
    kind: 'Dashboard',
    owner: 'Maintenance',
    summary: 'Open work by priority, age and area, with the overdue list.',
    state: 'Live',
    tone: 'success',
    updated: '13:30',
    size: '23 users',
  },
  {
    id: 'p5',
    name: 'Work order history',
    kind: 'Data set',
    owner: 'Maintenance',
    summary: 'Every order since 2019 with cost, hours and failure codes.',
    state: 'Stale',
    tone: 'warning',
    updated: '10 Mar',
    size: '48 200 rows',
  },
  {
    id: 'p6',
    name: 'Handover writer',
    kind: 'Agent',
    owner: 'Operations',
    summary: 'Drafts the shift handover from the log and the open alarms.',
    state: 'Paused',
    tone: 'neutral',
    updated: '06:00',
    size: '2 runs today',
  },
];

const LAND_PRICE_BASE: PriceFeature[] = [
  { label: 'Alarms, trends and work orders', included: true },
  { label: 'Shift handover with sign-off', included: true },
  { label: 'Agents and notebooks', included: false },
  { label: 'Single sign-on and audit log', included: false },
];

const LAND_PRICE_PLANT: PriceFeature[] = [
  { label: 'Everything in Team', included: true },
  { label: 'Agents and notebooks', included: true },
  { label: 'Single sign-on and audit log', included: true },
  { label: 'Dedicated region and support desk', included: false },
];

const LAND_PRICE_FLEET: PriceFeature[] = [
  { label: 'Everything in Plant', included: true },
  { label: 'Fleet views across all sites', included: true },
  { label: 'Dedicated region and support desk', included: true },
  { label: 'Named reliability engineer', included: true },
];

type LandCompare = {
  id: string;
  feature: string;
  team: string;
  plant: string;
  fleet: string;
};

const LAND_COMPARE: LandCompare[] = [
  {
    id: 'c1',
    feature: 'Time series kept',
    team: '2 years',
    plant: '10 years',
    fleet: 'Unlimited',
  },
  {
    id: 'c2',
    feature: 'People included',
    team: '15',
    plant: '80',
    fleet: 'Unlimited',
  },
  {
    id: 'c3',
    feature: 'Agent runs per month',
    team: 'None',
    plant: '2 000',
    fleet: '20 000',
  },
  {
    id: 'c4',
    feature: 'Support response',
    team: 'Next working day',
    plant: '4 hours',
    fleet: '30 minutes, all hours',
  },
];

const LAND_COMPARE_COLUMNS: DataTableColumn<LandCompare>[] = [
  { id: 'feature', header: 'What you get', cell: (row) => row.feature },
  {
    id: 'team',
    header: 'Team',
    numeric: true,
    width: 'w-1/4',
    cell: (row) => row.team,
  },
  {
    id: 'plant',
    header: 'Plant',
    numeric: true,
    width: 'w-1/4',
    cell: (row) => row.plant,
  },
  {
    id: 'fleet',
    header: 'Fleet',
    numeric: true,
    width: 'w-1/4',
    cell: (row) => row.fleet,
  },
];

type LandService = {
  id: string;
  name: string;
  state: string;
  tone: Tone;
  detail: string;
};

const LAND_SERVICES: LandService[] = [
  {
    id: 's1',
    name: 'Web application',
    state: 'Operational',
    tone: 'success',
    detail: '100 % · 90 days',
  },
  {
    id: 's2',
    name: 'Time series API',
    state: 'Operational',
    tone: 'success',
    detail: '99.99 % · 90 days',
  },
  {
    id: 'ingest',
    name: 'Data ingestion',
    state: 'Degraded',
    tone: 'warning',
    detail: 'Up to 4 min delay',
  },
  {
    id: 's4',
    name: 'Alarms',
    state: 'Operational',
    tone: 'success',
    detail: '99.98 % · 90 days',
  },
  {
    id: 's5',
    name: 'Agents',
    state: 'Operational',
    tone: 'success',
    detail: '99.91 % · 90 days',
  },
  {
    id: 's6',
    name: 'Sign-in',
    state: 'Operational',
    tone: 'success',
    detail: '100 % · 90 days',
  },
];

const LAND_UPTIME: HeatRow[] = [
  {
    label: 'Web application',
    values: makeValues({
      seed: 71,
      points: 30,
      base: 0.1,
      amplitude: 0.1,
      noise: 0.1,
      min: 0,
      decimals: 0,
    }),
    tone: 'success',
  },
  {
    label: 'Time series API',
    values: makeValues({
      seed: 72,
      points: 30,
      base: 0.3,
      amplitude: 0.4,
      noise: 0.5,
      min: 0,
      decimals: 0,
    }),
    tone: 'success',
  },
  {
    label: 'Data ingestion',
    values: [
      ...makeValues({
        seed: 73,
        points: 29,
        base: 0.6,
        amplitude: 0.8,
        noise: 0.9,
        min: 0,
        decimals: 0,
      }),
      4,
    ],
    tone: 'warning',
  },
  {
    label: 'Agents',
    values: makeValues({
      seed: 74,
      points: 30,
      base: 0.5,
      amplitude: 0.6,
      noise: 0.8,
      min: 0,
      decimals: 0,
    }),
    tone: 'success',
  },
];

function LandUser() {
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

function LandSiteActions() {
  return (
    <>
      <Button variant="ghost" size="sm">
        Sign in
      </Button>
      <Button size="sm">Book a demo</Button>
    </>
  );
}

function LandingTemplateInAppHome() {
  return (
    <BrowserFrame url="nordkapp.test/home" look="studio" minHeight={760}>
      <AppFrame
        variant="sidebar"
        brand={{ name: 'Nordkapp', detail: 'Operations', mark: <IconFlame /> }}
        nav={LAND_APP_NAV}
        current="home"
        tools={<LandUser />}
        title="Good afternoon, Ingrid"
        subtitle="Thursday 12 March · day shift ends at 14:00 · 4 alarms need you"
        actions={<Search className="w-64" aria-label="Search Nordkapp" placeholder="Search assets, tags, orders" />}
      >
        <Grid className="h-full grid-rows-[auto_auto_minmax(0,1fr)]">
          <Panel
            className="col-span-8"
            tone="warning"
            title="Nordkapp is at reduced capacity"
            subtitle="Recompressor 23-KA-9103 tripped at 13:46"
            icon={
              <IconChip tone="warning">
                <IconAlertTriangle />
              </IconChip>
            }
            actions={
              <Button size="sm">
                Open plant overview <IconArrowRight />
              </Button>
            }
          >
            <div className="grid grid-cols-3 gap-6">
              <Stat variant="plain" size="md" label="Gas export" value={PLANT_KPIS.gasExport.value} decimals={2} unit="MSm³/d" target="Plan 4.50" />
              <Stat variant="plain" size="md" label="Availability" value={PLANT_KPIS.availability.value} decimals={1} unit="%" target="Target 97.5 %" />
              <Stat variant="plain" size="md" label="Active alarms" value={PLANT_KPIS.activeAlarms.value} tone="critical" target="1 critical, 2 high" />
            </div>
          </Panel>
          <Panel className="col-span-4" title="Your shift" subtitle="Control room 1">
            <DetailList
              items={[
                { label: 'Hands over to', value: 'Liv Wold, 14:00' },
                {
                  label: 'Handover note',
                  value: <StatusPill tone="warning">Draft</StatusPill>,
                },
                { label: 'Rounds done', value: '3 of 4' },
              ]}
            />
          </Panel>

          <FeatureCard
            className="col-span-3"
            tone="pink"
            icon={<IconBell />}
            title="Work the alarm list"
            body="4 active, the oldest raised 2 days ago."
            action={
              <Button variant="outline" size="sm">
                Open alarms
              </Button>
            }
          />
          <FeatureCard
            className="col-span-3"
            tone="blue"
            icon={<IconFileText />}
            title="Finish the handover"
            body="The draft has 6 entries from the shift log."
            action={
              <Button variant="outline" size="sm">
                Open draft
              </Button>
            }
          />
          <FeatureCard
            className="col-span-3"
            tone="teal"
            icon={<IconListCheck />}
            title="Start the last round"
            body="Compression deck, 12 checkpoints, 25 minutes."
            action={
              <Button variant="outline" size="sm">
                Start round
              </Button>
            }
          />
          <FeatureCard
            className="col-span-3"
            tone="amber"
            icon={<IconTool />}
            title="Report a fault"
            body="Creates a work order with the asset attached."
            action={
              <Button variant="outline" size="sm">
                New work order
              </Button>
            }
          />

          <Panel className="col-span-7" title="Continue where you left off" subtitle="Opened by you, newest first" padding="none">
            <DataTable label="Recently opened" flush columns={LAND_RECENT_COLUMNS} rows={LAND_RECENT} rowKey={(row) => row.id} />
          </Panel>
          <Panel
            className="col-span-5"
            title="Work near you"
            subtitle="Open orders on gas compression"
            actions={
              <Button variant="ghost" size="sm">
                View all
              </Button>
            }
          >
            <ul className="flex flex-1 flex-col justify-between">
              {LAND_MY_ORDERS.map((order) => (
                <ListRow
                  key={order.id}
                  tone={order.priority === 'P1' ? 'critical' : 'neutral'}
                  title={order.title}
                  meta={
                    <>
                      <TagId>{findAsset(order.assetId)?.tag ?? ''}</TagId>
                      <span>due {formatDate(order.dueAt)}</span>
                    </>
                  }
                  trailing={<StatusPill tone={order.priority === 'P1' ? 'critical' : 'neutral'}>{order.priority}</StatusPill>}
                />
              ))}
            </ul>
          </Panel>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function LandingTemplateGettingStarted() {
  const [done, setDone] = useState<readonly string[]>(['profile', 'sites']);
  const toggle = (id: string, on: boolean) => setDone((current) => (on ? [...current, id] : current.filter((item) => item !== id)));
  const percent = Math.round((done.length / LAND_STEPS.length) * 100);
  return (
    <BrowserFrame url="nordkapp.test/welcome" look="soft" minHeight={800}>
      <AppFrame
        variant="topbar"
        brand={{ name: 'Nordkapp', detail: 'Operations', mark: <IconFlame /> }}
        tools={
          <Button variant="ghost" size="sm">
            Skip for now
          </Button>
        }
        title="Welcome to Nordkapp, Ingrid"
        subtitle="Five small steps and you have done everything a first shift needs."
      >
        <Grid className="h-full grid-rows-[minmax(0,1fr)_auto]">
          <Panel className="col-span-4" tone="purple" title="Your progress" subtitle={`${done.length} of ${LAND_STEPS.length} steps done`}>
            <div className="flex flex-1 flex-col items-center justify-between gap-5">
              <RingGauge label="Getting started" value={percent} size={168} tone="purple" hideLabel />
              <p className="text-center text-base font-semibold">
                {done.length === LAND_STEPS.length ? 'All done. Have a good shift.' : `About ${(LAND_STEPS.length - done.length) * 3} minutes left`}
              </p>
              <div className="flex w-full items-center gap-3 rounded-(--kit-radius-sm) bg-(--kit-surface) p-4">
                <Avatar variant="decorative-4" aria-label="Liv Wold">
                  <AvatarFallback>LW</AvatarFallback>
                </Avatar>
                <p className="text-sm">
                  <span className="font-semibold">Liv Wold</span> is your shift supervisor. Ask her anything.
                </p>
              </div>
            </div>
          </Panel>
          <Panel className="col-span-8" title="Your first five steps" subtitle="Tick them off as you go; each links to the right place">
            <ul className="flex flex-1 flex-col *:flex-1">
              {LAND_STEPS.map((step) => (
                <ChecklistItem
                  key={step.id}
                  title={step.title}
                  detail={step.detail}
                  done={done.includes(step.id)}
                  onToggle={(on) => toggle(step.id, on)}
                  action={
                    <Button variant="outline" size="sm">
                      Start <IconArrowRight />
                    </Button>
                  }
                />
              ))}
            </ul>
          </Panel>

          <FeatureCard
            className="col-span-4"
            tone="blue"
            icon={<IconPlayerPlay />}
            title="Three-minute tour"
            body="A walk through the alarm list, trends and handover."
            action={
              <Button variant="outline" size="sm">
                Watch the tour
              </Button>
            }
          />
          <FeatureCard
            className="col-span-4"
            tone="teal"
            icon={<IconBook />}
            title="Operator guide"
            body="How Nordkapp names tags, areas and priorities."
            action={
              <Button variant="outline" size="sm">
                Read the guide
              </Button>
            }
          />
          <FeatureCard
            className="col-span-4"
            tone="amber"
            icon={<IconSparkles />}
            title="Ask Atlas"
            body="The assistant answers from the plant's own data."
            action={
              <Button variant="outline" size="sm">
                Ask a question
              </Button>
            }
          />
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function LandingTemplateTeamHome() {
  return (
    <BrowserFrame url="nordkapp.test/teams/day-shift" look="glass" minHeight={820}>
      <AppFrame
        variant="rail"
        brand={{ name: 'Nordkapp', mark: <IconFlame /> }}
        nav={LAND_RAIL_NAV}
        current="team"
        title="Day shift, control room 1"
        subtitle="6 people · Nordkapp gas processing · week 11"
        status={
          <StatusPill tone="success" size="lg">
            4 on shift now
          </StatusPill>
        }
        actions={
          <Button size="sm">
            <IconUsers /> Invite
          </Button>
        }
      >
        <Grid className="h-full grid-rows-[auto_minmax(0,1fr)]">
          <Panel className="col-span-8" title="Our four weeks" subtitle="Plant availability on the day shift, per cent">
            <TrendArea
              label="Plant availability on the day shift over the last four weeks against the target"
              labels={LAND_DAYS}
              unit="%"
              decimals={1}
              height={210}
              series={[
                {
                  id: 'availability',
                  label: 'Availability',
                  values: LAND_AVAILABILITY,
                  tone: 'accent',
                },
              ]}
              limits={[{ value: 97.5, label: 'Target', tone: 'warning' }]}
              headline={
                <div className="flex gap-10">
                  <Stat variant="plain" size="md" label="This week" value={96.4} decimals={1} unit="%" delta={{ value: -0.7, caption: 'vs last week' }} />
                  <Stat
                    variant="plain"
                    size="md"
                    label="Alarms handled"
                    value={71}
                    delta={{
                      value: -12,
                      decimals: 0,
                      good: 'down',
                      caption: 'vs last week',
                    }}
                  />
                  <Stat variant="plain" size="md" label="Handovers signed" value="5 of 5" />
                </div>
              }
            />
          </Panel>
          <Panel className="col-span-4" title="People" subtitle="Who is where">
            <ul className="flex flex-1 flex-col justify-between">
              {PEOPLE.slice(0, 5).map((person, index) => (
                <ListRow
                  key={person.id}
                  leading={
                    <Avatar variant={index % 2 === 0 ? 'decorative-2' : 'decorative-5'} aria-label={person.name}>
                      <AvatarFallback>{person.initials}</AvatarFallback>
                    </Avatar>
                  }
                  title={person.name}
                  meta={person.role}
                  trailing={<StatusPill tone={index < 4 ? 'success' : 'neutral'}>{index < 4 ? 'On shift' : 'Off'}</StatusPill>}
                />
              ))}
            </ul>
          </Panel>

          <FeatureCard
            className="col-span-4"
            tone="sky"
            icon={<IconLayoutDashboard />}
            title="Compression watch"
            body="The team's pinned board: three stages, their limits and the open alarms."
            figure={{ value: '4', caption: 'alarms open' }}
            action={
              <Button variant="outline" size="sm">
                Open board
              </Button>
            }
          />
          <FeatureCard
            className="col-span-4"
            tone="purple"
            icon={<IconFileText />}
            title="Handover, 12 March"
            body="Draft by Ingrid Haugen. Recompressor trip and bearing inspection lead the note."
            figure={{ value: '6', caption: 'entries so far' }}
            action={
              <Button variant="outline" size="sm">
                Open draft
              </Button>
            }
          />
          <Panel className="col-span-4" title="Latest in the team" subtitle="Today">
            <ul className="flex flex-1 flex-col justify-between">
              <ListRow tone="critical" title="Ingrid acknowledged the recompressor trip" trailing="13:47" />
              <ListRow tone="info" title="Tomás started WO-104482" trailing="13:52" />
              <ListRow tone="success" title="Jonas finished the compression round" trailing="12:30" />
            </ul>
          </Panel>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function LandingTemplateCatalogue() {
  const [kind, setKind] = useState('All');
  const shown = LAND_PRODUCTS.filter((product) => kind === 'All' || product.kind === kind);
  return (
    <BrowserFrame url="nordkapp.test/catalogue" look="console" minHeight={720}>
      <AppFrame
        variant="topbar"
        brand={{ name: 'Nordkapp', detail: 'Catalogue', mark: <IconFlame /> }}
        nav={LAND_CATALOGUE_NAV}
        current="catalogue"
        padding="none"
        tools={
          <>
            <span>{LAND_PRODUCTS.length} products</span>
            <span className="font-medium tabular-nums">14:00:00 UTC</span>
          </>
        }
      >
        <Grid className="h-full grid-rows-[auto_minmax(0,1fr)]">
          <div className="col-span-12 flex items-center gap-4 bg-base-background px-3.5 py-2.5">
            <p className="text-xl font-semibold">Data and apps for Nordkapp</p>
            <p className="flex-1 text-sm text-medium-foreground">
              Showing {shown.length} of {LAND_PRODUCTS.length}
            </p>
            <SegmentedControl value={kind} onValueChange={(next) => setKind(String(next))}>
              <SegmentedControlList size="small" aria-label="Kind of product">
                <SegmentedControlButton value="All">All</SegmentedControlButton>
                <SegmentedControlButton value="Dashboard">Dashboards</SegmentedControlButton>
                <SegmentedControlButton value="Data set">Data sets</SegmentedControlButton>
                <SegmentedControlButton value="Agent">Agents</SegmentedControlButton>
              </SegmentedControlList>
            </SegmentedControl>
            <Search className="w-56" aria-label="Search the catalogue" placeholder="Search the catalogue" />
          </div>
          <div className="col-span-12 grid auto-rows-fr grid-cols-3 gap-px">
            {shown.map((product, index) => (
              <Panel
                key={product.id}
                tone={product.tone === 'success' ? 'neutral' : product.tone}
                title={product.name}
                subtitle={product.kind}
                actions={<StatusPill tone={product.tone}>{product.state}</StatusPill>}
                footer={
                  <span className="flex w-full items-center justify-between gap-3">
                    <span>Owned by {product.owner}</span>
                    <Button variant="outline" size="sm">
                      Open
                    </Button>
                  </span>
                }
              >
                <div className="flex flex-1 flex-col justify-between gap-4">
                  <p className="text-sm text-medium-foreground">{product.summary}</p>
                  <div className="flex flex-col gap-1.5">
                    <p className="text-xs text-medium-foreground">Opens per day, last 14 days</p>
                    <SparkLine
                      values={makeValues({
                        seed: 80 + index,
                        points: 14,
                        base: 30,
                        amplitude: 9,
                        noise: 5,
                        min: 2,
                        decimals: 0,
                      })}
                      label={`Opens per day of ${product.name}, last 14 days`}
                      tone={product.tone === 'success' ? 'accent' : product.tone}
                      className="h-14 w-full"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Stat variant="plain" size="sm" label="Updated" value={product.updated} />
                    <Stat variant="plain" size="sm" label={product.kind === 'Data set' ? 'Size' : 'Use'} value={product.size} />
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function LandingTemplateProduct() {
  return (
    <BrowserFrame url="nordkapp.test" look="poster" minHeight={860}>
      <AppFrame
        variant="masthead"
        brand={{ name: 'Nordkapp' }}
        nav={LAND_SITE_NAV}
        current="product"
        tools={<LandSiteActions />}
        title="Run the plant from one screen."
        subtitle="Alarms, trends, work orders and handover for process plants. Live in a week, on the data you already have."
      >
        <Grid className="h-full">
          <Panel className="col-span-5" tone="pink" title="See it on your own data" subtitle="A working plant overview in the first session">
            <div className="flex flex-1 flex-col justify-between gap-6">
              <p className="text-xl leading-snug font-bold">
                Bring one compressor train. Leave with its alarms, limits and work orders on a screen your operators can read from the door.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg">
                  Book a demo <IconArrowRight />
                </Button>
                <Button size="lg" variant="outline">
                  Take the tour
                </Button>
              </div>
            </div>
          </Panel>
          <Panel className="col-span-7" title="Seven days of export" subtitle="MSm³ per day against the 4.50 plan, as the plant overview shows it">
            <Bars
              label="Gas export per day over seven days against the plan"
              categories={['Fri 6', 'Sat 7', 'Sun 8', 'Mon 9', 'Tue 10', 'Wed 11', 'Thu 12']}
              series={[
                {
                  id: 'export',
                  label: 'Gas export',
                  values: [4.52, 4.49, 4.55, 4.47, 4.41, 4.21, 4.38],
                },
              ]}
              tones={['blue', 'blue', 'blue', 'blue', 'blue', 'pink', 'pink']}
              decimals={2}
              limit={{ value: 4.5, label: 'Plan' }}
              showValues
              height={230}
            />
          </Panel>

          <Stat className="col-span-4" size="lg" tone="amber" label="Fewer nuisance alarms" value={38} unit="%" target="After six months at Nordkapp" />
          <Stat className="col-span-4" size="lg" tone="teal" label="Faster shift handover" value={12} unit="min" target="Per shift, three shifts a day" />
          <Stat className="col-span-4" size="lg" tone="blue" label="Time series on one screen" value="212 600" target="Without moving the historian" />

          <FeatureCard
            className="col-span-4"
            tone="green"
            icon={<IconBell />}
            title="Alarms that mean something"
            body="Group, shelve and rationalise, with the trend behind every alarm one click away."
          />
          <FeatureCard
            className="col-span-4"
            tone="purple"
            icon={<IconTool />}
            title="Work that follows the asset"
            body="Every order, document and drawing hangs on the equipment it belongs to."
          />
          <FeatureCard
            className="col-span-4"
            tone="sky"
            icon={<IconRobot />}
            title="Agents that show their work"
            body="Trip reviews and handovers drafted from your data, with sources and an approval step."
          />
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function LandingTemplateRoleSolution() {
  return (
    <BrowserFrame url="nordkapp.test/solutions/reliability" look="editorial" minHeight={860}>
      <AppFrame
        variant="masthead"
        brand={{ name: 'Nordkapp' }}
        nav={LAND_ROLE_NAV}
        current="problem"
        tools={<LandSiteActions />}
        title="For the reliability engineer who is done exporting to spreadsheets."
        subtitle="Find the bearing two weeks before it finds you, with the trends, the history and the work order in one place."
      >
        <Grid className="h-full">
          <StatGroup columns={3} label="Results at Nordkapp" className="col-span-12">
            <Stat variant="plain" size="lg" label="Mean time between failures" value={PLANT_KPIS.mtbf.value} unit="h" delta={{ value: 16, decimals: 0, caption: 'vs last year' }} />
            <Stat variant="plain" size="lg" label="Trips seen coming" value="7 of 9" target="Flagged at least a week ahead" />
            <Stat variant="plain" size="lg" label="Hours per review" value={1.5} decimals={1} unit="h" delta={{ value: -4.5, good: 'down', caption: 'from 6 hours' }} />
          </StatGroup>

          <Panel className="col-span-8" title="The climb is there two weeks early" subtitle="Drive-end vibration on the 1st stage compressor, mm/s, daily average.">
            <TrendLine
              label="Daily drive-end vibration on the 1st stage compressor over two weeks against its high limit"
              labels={LAND_VIBRATION_DAYS}
              unit="mm/s"
              decimals={1}
              height={250}
              series={[
                {
                  id: 'vibration',
                  label: 'Drive-end vibration',
                  values: LAND_VIBRATION,
                  tone: 'accent',
                },
              ]}
              limits={[{ value: 7.1, label: 'High limit', tone: 'warning' }]}
              notes={
                <>
                  <p>
                    <span className="font-semibold">5 March.</span> The slope changes. Nordkapp flags it and opens a survey order.
                  </p>
                  <p>
                    <span className="font-semibold">12 March.</span> The same bearing type fails on the recompressor. This one is already planned.
                  </p>
                </>
              }
            />
          </Panel>
          <div className="col-span-4 flex flex-col gap-(--kit-gap)">
            <PullQuote
              className="flex-1"
              quote="I stopped building the same vibration chart every Monday. It is just there, with the limit and the history."
              name="Aisha Khan"
              role="Rotating equipment engineer, Nordkapp"
              avatar={
                <Avatar variant="decorative-3" aria-label="Aisha Khan">
                  <AvatarFallback>AK</AvatarFallback>
                </Avatar>
              }
            />
            <div className="flex flex-wrap gap-3">
              <Button size="lg">
                Book a working session <IconArrowRight />
              </Button>
              <Button size="lg" variant="outline">
                Read the method
              </Button>
            </div>
          </div>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function LandingTemplatePricing() {
  const [billing, setBilling] = useState('yearly');
  const yearly = billing === 'yearly';
  return (
    <BrowserFrame url="nordkapp.test/pricing" look="studio" minHeight={860}>
      <AppFrame
        variant="topbar"
        brand={{ name: 'Nordkapp', detail: 'Operations', mark: <IconFlame /> }}
        nav={LAND_SITE_NAV}
        current="pricing"
        tools={<LandSiteActions />}
        title="Priced per site, not per person"
        subtitle="Everyone on the plant can sign in. Pay for the sites you connect."
        actions={
          <SegmentedControl value={billing} onValueChange={(next) => setBilling(String(next))}>
            <SegmentedControlList size="small" aria-label="Billing period">
              <SegmentedControlButton value="monthly">Monthly</SegmentedControlButton>
              <SegmentedControlButton value="yearly">Yearly, 2 months free</SegmentedControlButton>
            </SegmentedControlList>
          </SegmentedControl>
        }
      >
        <Grid className="h-full grid-rows-[minmax(0,1fr)_auto]">
          <PriceCard
            className="col-span-4"
            name="Team"
            description="One unit or one control room getting started."
            price={yearly ? '€ 750' : '€ 900'}
            period="per site, per month"
            features={LAND_PRICE_BASE}
            action={<Button variant="outline">Start a 30-day trial</Button>}
          />
          <PriceCard
            className="col-span-4"
            featured
            featuredLabel="Most plants pick this"
            name="Plant"
            description="A whole site, with agents and single sign-on."
            price={yearly ? '€ 1 900' : '€ 2 280'}
            period="per site, per month"
            features={LAND_PRICE_PLANT}
            action={<Button>Start a 30-day trial</Button>}
          />
          <PriceCard
            className="col-span-4"
            name="Fleet"
            description="Several sites, compared and run as one."
            price="Let's talk"
            period="from 4 sites"
            features={LAND_PRICE_FLEET}
            action={<Button variant="outline">Talk to sales</Button>}
          />
          <Panel className="col-span-12" title="Compare the plans" subtitle={yearly ? 'Yearly billing, prices exclude VAT' : 'Monthly billing, prices exclude VAT'} padding="none">
            <DataTable label="Plan comparison" flush columns={LAND_COMPARE_COLUMNS} rows={LAND_COMPARE} rowKey={(row) => row.id} />
          </Panel>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function LandDocList({ items }: { items: readonly { title: string; minutes: string }[] }) {
  return (
    <ul className="flex flex-1 flex-col justify-between">
      {items.map((item) => (
        <ListRow key={item.title} title={item.title} trailing={item.minutes} />
      ))}
    </ul>
  );
}

function LandingTemplateDocsHome() {
  return (
    <BrowserFrame url="docs.nordkapp.test" look="blueprint" minHeight={820}>
      <AppFrame
        variant="topbar"
        brand={{
          name: 'Nordkapp',
          detail: 'Documentation',
          mark: <IconBook />,
        }}
        nav={LAND_DOCS_NAV}
        current="guides"
        tools={
          <>
            <span>
              Version <span className="font-medium tabular-nums">2026.3</span>
            </span>
            <span>
              Updated <span className="font-medium tabular-nums">10 Mar 2026</span>
            </span>
          </>
        }
      >
        <Grid className="h-full grid-rows-[auto_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="col-span-12 flex items-end justify-between gap-8">
            <Hero title="How do I…?" lead="Guides, reference and courses for operators, engineers and developers on Nordkapp." />
            <div className="flex w-96 shrink-0 flex-col gap-2">
              <Search aria-label="Search the documentation" placeholder="Search 412 articles" />
              <p className="text-sm text-(color:--kit-text-2)">Popular: alarm shelving, tag naming, trend limits</p>
            </div>
          </div>

          <Panel className="col-span-4" title="Get started" subtitle="5 guides" icon={<IconRocket className="size-4.5" aria-hidden="true" />}>
            <LandDocList
              items={[
                { title: 'Your first shift in Nordkapp', minutes: '6 min' },
                { title: 'How tags and areas are named', minutes: '4 min' },
                { title: 'Set up your home page', minutes: '3 min' },
              ]}
            />
          </Panel>
          <Panel className="col-span-4" title="Alarms and trends" subtitle="18 guides" icon={<IconBell className="size-4.5" aria-hidden="true" />}>
            <LandDocList
              items={[
                { title: 'Acknowledge, shelve and suppress', minutes: '5 min' },
                { title: 'Add limits and bands to a trend', minutes: '4 min' },
                { title: 'Compare two periods', minutes: '3 min' },
              ]}
            />
          </Panel>
          <Panel className="col-span-4" title="Popular this week" subtitle="By readers" icon={<IconChartLine className="size-4.5" aria-hidden="true" />}>
            <Bars
              label="Most read articles this week"
              orientation="horizontal"
              categories={['Alarm shelving', 'Tag naming', 'Trend limits', 'Handover sign-off']}
              series={[
                {
                  id: 'readers',
                  label: 'Readers',
                  values: [212, 164, 131, 97],
                },
              ]}
              showValues
              height={150}
            />
          </Panel>

          <Panel className="col-span-4" title="Work and handover" subtitle="11 guides" icon={<IconClipboardList className="size-4.5" aria-hidden="true" />}>
            <LandDocList
              items={[
                {
                  title: 'Create a work order from an alarm',
                  minutes: '3 min',
                },
                { title: 'Write and sign a handover note', minutes: '5 min' },
                { title: 'Plan an inspection round', minutes: '7 min' },
              ]}
            />
          </Panel>
          <Panel className="col-span-4" title="Build with the API" subtitle="42 references" icon={<IconCode className="size-4.5" aria-hidden="true" />}>
            <LandDocList
              items={[
                {
                  title: 'Authenticate with a service account',
                  minutes: '4 min',
                },
                { title: 'Read time series in bulk', minutes: '8 min' },
                { title: 'Model assets and relationships', minutes: '12 min' },
              ]}
            />
          </Panel>
          <Panel className="col-span-4" title="Need a person?" subtitle="Support desk" icon={<IconUsers className="size-4.5" aria-hidden="true" />}>
            <div className="flex flex-1 flex-col justify-between gap-4">
              <DetailList
                items={[
                  { label: 'Open now', value: '06:00 to 22:00 UTC' },
                  { label: 'Typical reply', value: '35 minutes' },
                  {
                    label: 'API status',
                    value: <StatusPill tone="success">Operational</StatusPill>,
                  },
                ]}
              />
              <Button variant="outline" className="w-full">
                Contact support
              </Button>
            </div>
          </Panel>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function LandingTemplateReleaseNotes() {
  const [version, setVersion] = useState('2026.3');
  return (
    <BrowserFrame url="nordkapp.test/whats-new" look="soft" minHeight={840}>
      <AppFrame
        variant="sidebar"
        brand={{
          name: 'Nordkapp',
          detail: "What's new",
          mark: <IconSparkles />,
        }}
        nav={LAND_RELEASE_NAV}
        current={version}
        onNavigate={setVersion}
        tools={
          <Button variant="outline" className="w-full">
            <IconBell /> Email me releases
          </Button>
        }
        title="What's new in Nordkapp"
        subtitle={`Showing ${version} and the two releases before it. A release ships on the second Tuesday of each month.`}
      >
        <Grid className="h-full">
          <div className="col-span-8 flex flex-col gap-(--kit-gap)">
            <Panel className="h-auto" tone="purple">
              <ReleaseEntry
                latest
                version="2026.3"
                date="10 March 2026"
                title="Shift handover with sign-off"
                summary="The outgoing and incoming operator both sign the note, and open alarms are carried over automatically."
                changes={[
                  {
                    kind: 'new',
                    text: 'Sign a handover note as the outgoing and the incoming operator',
                  },
                  {
                    kind: 'new',
                    text: 'Open alarms and running work orders are added to the draft',
                  },
                  {
                    kind: 'improved',
                    text: 'Trends keep their limits and bands when shared',
                  },
                  {
                    kind: 'fixed',
                    text: 'Alarm counts on the home page now match the alarm list',
                  },
                ]}
              />
            </Panel>
            <Panel className="h-auto">
              <ReleaseEntry
                version="2026.2"
                date="10 February 2026"
                title="Faster trends on long ranges"
                changes={[
                  {
                    kind: 'improved',
                    text: 'A year of one-minute data opens in under two seconds',
                  },
                  {
                    kind: 'new',
                    text: 'Compare any two periods on the same axis',
                  },
                  {
                    kind: 'fixed',
                    text: 'The legend no longer covers the last value',
                  },
                ]}
              />
            </Panel>
            <Panel className="flex-1">
              <ReleaseEntry
                version="2026.1"
                date="13 January 2026"
                title="Agents ask before they act"
                changes={[
                  {
                    kind: 'new',
                    text: 'Review and approve every change an agent proposes',
                  },
                  {
                    kind: 'improved',
                    text: 'Agent runs show their steps and sources as they go',
                  },
                ]}
              />
            </Panel>
          </div>
          <div className="col-span-4 flex flex-col gap-(--kit-gap)">
            <Panel className="h-auto" tone="teal" title="This quarter" subtitle="Changes by kind">
              <Donut
                label="Changes shipped this quarter by kind"
                segments={[
                  { label: 'New', value: 5, tone: 'green' },
                  { label: 'Improved', value: 4, tone: 'blue' },
                  { label: 'Fixed', value: 9, tone: 'amber' },
                ]}
                centerCaption="changes"
                size={132}
                legend="bottom"
                className="w-full"
              />
            </Panel>
            <Panel className="flex-1" tone="amber" title="Coming next" subtitle="Planned for April">
              <ul className="flex flex-1 flex-col justify-between">
                <ListRow
                  title="Inspection rounds on a phone"
                  meta={
                    <>
                      <StatusPill tone="info">In test</StatusPill>
                      <span>Offline, with photos</span>
                    </>
                  }
                />
                <ListRow
                  title="Alarm rationalisation review"
                  meta={
                    <>
                      <StatusPill tone="neutral">Planned</StatusPill>
                      <span>Chattering and stale alarms</span>
                    </>
                  }
                />
                <ListRow
                  title="Fleet view for four sites"
                  meta={
                    <>
                      <StatusPill tone="neutral">Planned</StatusPill>
                      <span>All of Nordkapp Energi</span>
                    </>
                  }
                />
              </ul>
            </Panel>
          </div>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

function LandingTemplateStatus() {
  return (
    <BrowserFrame url="status.nordkapp.test" look="signal" minHeight={800}>
      <AppFrame
        brand={{ name: 'Nordkapp' }}
        title="Nordkapp status"
        subtitle="Region westeurope-1 · Thursday 12 March · 14:00 UTC"
        status={
          <>
            <StatusPill tone="success" size="lg">
              5 operational
            </StatusPill>
            <StatusPill tone="warning" size="lg">
              1 degraded
            </StatusPill>
          </>
        }
      >
        <Grid className="h-full grid-rows-[auto_auto_minmax(0,1fr)]">
          <Panel className="col-span-8" tone="warning">
            <div className="flex flex-1 flex-col justify-between gap-5">
              <p className="text-lg font-semibold">Right now</p>
              <div className="flex items-center gap-5">
                <IconAlertTriangle className="size-16 shrink-0" stroke={2.2} aria-hidden="true" />
                <p className="text-6xl leading-none font-extrabold tracking-tighter">Data is arriving late</p>
              </div>
              <p className="max-w-2xl text-xl font-medium">
                Time series from two sites are up to 4 minutes behind since 13:20. Alarms, sign-in and the application are not affected.
              </p>
            </div>
          </Panel>
          <Stat className="col-span-4" size="hero" tone="success" label="Uptime, last 90 days" value={99.96} decimals={2} unit="%" target="Commitment 99.9 %" />

          <div className="col-span-12 grid grid-cols-6 gap-(--kit-gap)">
            {LAND_SERVICES.map((service) => (
              <Stat key={service.id} size="sm" tone={service.tone} label={service.name} state={service.state} value={service.detail} />
            ))}
          </div>

          <Panel className="col-span-7" title="Incidents per day" subtitle="Last 30 days, minutes of disruption">
            <div className="flex flex-1 flex-col justify-center">
              <HeatStrip label="Minutes of disruption per day by service over the last 30 days" rows={LAND_UPTIME} axis={['30 days ago', 'Today']} size="lg" />
            </div>
          </Panel>
          <Panel className="col-span-5" title="Updates" subtitle="This incident">
            <ul className="flex flex-1 flex-col justify-between">
              <ListRow tone="warning" title="Backlog is draining; delay down to 4 minutes" trailing="13:55" />
              <ListRow tone="warning" title="Cause found: a full queue on one ingestion node" trailing="13:38" />
              <ListRow tone="critical" title="Investigating delayed time series from two sites" trailing="13:24" />
            </ul>
          </Panel>
        </Grid>
      </AppFrame>
    </BrowserFrame>
  );
}

export default definePage({
  id: 'landing-pages',
  title: 'Landing pages',
  summary:
    'The first page of a product, a space or a site: in-app homes, onboarding, catalogues, marketing pages, documentation, release notes and status. Each is a whole page in a different look, with the chrome and composition that look calls for.',
  guidance: {
    use: [
      'Lead with the one thing the reader came for: the state of the plant, the next step, the promise, the search box.',
      'Give every block a job and an action; a landing page is a set of doors.',
      'Use real figures and names from the product instead of slogans.',
      'Match the look to the reader: studio for daily use, poster and editorial for persuasion, signal for status.',
    ],
    avoid: [
      'A hero with a headline and nothing under it but white space.',
      'More than one primary action competing in the same view.',
      'Feature grids of identical cards with stock icons and no evidence.',
    ],
  },
  source,
  sections: [
    {
      id: 'in-app',
      title: 'Inside the app',
      description: 'Where a signed-in person lands.',
      specimens: [
        {
          id: 'LandingTemplateInAppHome',
          title: 'In-app home',
          note: 'Pick it as the first page after sign-in: the state of the plant, what needs you and where you left off.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: [
            'kit/landing-pages/BrowserFrame.tsx',
            'kit/AppFrame.tsx',
            'kit/landing-pages/FeatureCard.tsx',
            'kit/Panel.tsx',
            'kit/DataTable.tsx',
            'kit/ListRow.tsx',
            'kit/auth-pages/DetailList.tsx',
          ],
          Component: LandingTemplateInAppHome,
        },
        {
          id: 'LandingTemplateGettingStarted',
          title: 'Getting started',
          note: 'Pick it for a new person in their first week: a short checklist with progress and somewhere to learn more.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/landing-pages/BrowserFrame.tsx', 'kit/AppFrame.tsx', 'kit/landing-pages/ChecklistItem.tsx', 'kit/landing-pages/FeatureCard.tsx', 'kit/RingGauge.tsx'],
          Component: LandingTemplateGettingStarted,
        },
        {
          id: 'LandingTemplateTeamHome',
          title: 'Team space home',
          note: 'Pick it as the home of a team or shift: its numbers, its people and what it has pinned.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/landing-pages/BrowserFrame.tsx', 'kit/AppFrame.tsx', 'kit/TrendArea.tsx', 'kit/landing-pages/FeatureCard.tsx', 'kit/ListRow.tsx', 'kit/Stat.tsx'],
          Component: LandingTemplateTeamHome,
        },
        {
          id: 'LandingTemplateCatalogue',
          title: 'Catalogue grid',
          note: 'Pick it to browse dashboards, data sets and agents: dense tiles with owner, freshness and state, filtered by kind.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/landing-pages/BrowserFrame.tsx', 'kit/AppFrame.tsx', 'kit/Panel.tsx', 'kit/Stat.tsx', 'kit/SparkLine.tsx', 'kit/StatusPill.tsx'],
          Component: LandingTemplateCatalogue,
        },
      ],
    },
    {
      id: 'product',
      title: 'Product pages',
      description: 'Pages that persuade someone who is not a user yet.',
      specimens: [
        {
          id: 'LandingTemplateProduct',
          title: 'Product landing',
          note: 'Pick it as the front page of a product: one promise, one action, proof in numbers and three reasons.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/landing-pages/BrowserFrame.tsx', 'kit/AppFrame.tsx', 'kit/landing-pages/FeatureCard.tsx', 'kit/Bars.tsx', 'kit/Stat.tsx', 'kit/Panel.tsx'],
          Component: LandingTemplateProduct,
        },
        {
          id: 'LandingTemplateRoleSolution',
          title: 'Solution page for a role',
          note: 'Pick it to speak to one role: their problem in their words, an annotated chart as proof and a colleague quoted.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/landing-pages/BrowserFrame.tsx', 'kit/AppFrame.tsx', 'kit/landing-pages/PullQuote.tsx', 'kit/TrendLine.tsx', 'kit/StatGroup.tsx'],
          Component: LandingTemplateRoleSolution,
        },
        {
          id: 'LandingTemplatePricing',
          title: 'Pricing',
          note: 'Pick it when plans differ by scope: three cards with one recommended, a billing switch and a comparison table.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/landing-pages/BrowserFrame.tsx', 'kit/AppFrame.tsx', 'kit/landing-pages/PriceCard.tsx', 'kit/DataTable.tsx'],
          Component: LandingTemplatePricing,
        },
      ],
    },
    {
      id: 'reference',
      title: 'Reference pages',
      description: 'Pages people come back to for answers.',
      specimens: [
        {
          id: 'LandingTemplateDocsHome',
          title: 'Documentation home',
          note: 'Pick it as the front page of documentation: search first, then sections with their most useful articles.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/landing-pages/BrowserFrame.tsx', 'kit/AppFrame.tsx', 'kit/landing-pages/Hero.tsx', 'kit/Panel.tsx', 'kit/ListRow.tsx', 'kit/Bars.tsx'],
          Component: LandingTemplateDocsHome,
        },
        {
          id: 'LandingTemplateReleaseNotes',
          title: 'Release notes',
          note: 'Pick it for a changelog people read: versions in the sidebar, each change labelled new, improved or fixed.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/landing-pages/BrowserFrame.tsx', 'kit/AppFrame.tsx', 'kit/landing-pages/ReleaseEntry.tsx', 'kit/Donut.tsx', 'kit/ListRow.tsx'],
          Component: LandingTemplateReleaseNotes,
        },
        {
          id: 'LandingTemplateStatus',
          title: 'Status page',
          note: 'Pick it for service status: the state in words first, every service as a tile in its state, then the history.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/landing-pages/BrowserFrame.tsx', 'kit/AppFrame.tsx', 'kit/Stat.tsx', 'kit/HeatStrip.tsx', 'kit/ListRow.tsx', 'kit/Panel.tsx'],
          Component: LandingTemplateStatus,
        },
      ],
    },
  ],
});
