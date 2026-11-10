import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { Search } from '@cognite/aura/components/search';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import {
  IconAlarm,
  IconArrowRight,
  IconBinaryTree,
  IconBook2,
  IconChartLine,
  IconClipboardList,
  IconCode,
  IconDatabase,
  IconLayoutDashboard,
  IconLifebuoy,
  IconPlugConnected,
  IconShieldCheck,
  IconSparkles,
  IconTool,
  IconUsers,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { AvatarGroup } from '../../../library/display/AvatarGroup';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { StatusBadge } from '../../../library/display/StatusBadge';
import { KpiTile } from '../../../library/industrial/KpiTile';
import { severityStatus } from '../../../library/industrial/status';
import type { Tone } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { StatRow } from '../../../library/patterns/collections/StatRow';
import { BillingToggle } from '../../../library/patterns/product/BillingToggle';
import type { BillingPeriod } from '../../../library/patterns/product/BillingToggle';
import { FeatureCard } from '../../../library/patterns/product/FeatureCard';
import { Hero } from '../../../library/patterns/product/Hero';
import { PlanCard } from '../../../library/patterns/product/PlanCard';
import { StatsBand } from '../../../library/patterns/product/StatsBand';
import { SetupChecklist } from '../../../library/patterns/states/SetupChecklist';
import type { SetupStep } from '../../../library/patterns/states/SetupChecklist';
import { PageHeader } from '../../../library/patterns/structure/PageHeader';
import { SectionHeader } from '../../../library/patterns/structure/SectionHeader';
import type { SidebarNavGroup } from '../../../library/patterns/structure/SidebarNav';
import { BrandMark } from '../../../library/templates-b/BrandMark';
import { PageFrame } from '../../../library/templates-b/PageFrame';
import { ShellPage } from '../../../library/templates-b/ShellPage';
import { SiteBand } from '../../../library/templates-b/SiteBand';
import { SitePage } from '../../../library/templates-b/SitePage';
import { ALARMS, PEOPLE, PLANT_KPIS, SENSORS, WORK_ORDERS, findAsset } from '../../data/plant';
import { formatAgo, formatDate, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './landing-pages.tsx?raw';

const LANDING_LINK =
  'rounded-sm font-medium text-link-foreground underline-offset-4 outline-none hover:underline focus-visible:shadow-focus-ring';

const LANDING_SITE_LINKS = [
  { id: 'product', label: 'Product' },
  { id: 'solutions', label: 'Solutions' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'docs', label: 'Docs' },
];

const LANDING_AVAILABILITY = makeValues({ seed: 51, points: 30, base: 96.8, amplitude: 0.5, noise: 0.25, drift: -0.4, decimals: 1 });
const LANDING_EXPORT = makeValues({ seed: 52, points: 30, base: 4.3, amplitude: 0.08, noise: 0.04, drift: 0.1, decimals: 2 });

const LANDING_SHELL_NAV: readonly SidebarNavGroup[] = [
  {
    id: 'main',
    items: [
      { id: 'home', label: 'Home', icon: <IconLayoutDashboard /> },
      { id: 'alarms', label: 'Alarms', icon: <IconAlarm />, count: PLANT_KPIS.activeAlarms.value },
      { id: 'assets', label: 'Assets', icon: <IconBinaryTree /> },
      { id: 'trends', label: 'Trends', icon: <IconChartLine /> },
      { id: 'orders', label: 'Work orders', icon: <IconTool />, count: PLANT_KPIS.openWorkOrders.value },
    ],
  },
];

const LANDING_QUICK_ACTIONS = [
  { id: 'ack', label: 'Work the alarm list', detail: '2 unacknowledged', icon: IconAlarm },
  { id: 'order', label: 'Create a work order', detail: 'From an asset or an alarm', icon: IconTool },
  { id: 'trend', label: 'Open a trend', detail: 'Any tag, last 24 hours', icon: IconChartLine },
  { id: 'handover', label: 'Start shift handover', detail: 'Due at 15:00', icon: IconClipboardList },
] as const;

const LANDING_RECENT = [
  { id: 'r1', kind: 'Trend', title: 'Drive-end vibration, 23-KA-9101', when: '12 min ago', icon: IconChartLine },
  { id: 'r2', kind: 'Work order', title: 'WO-104482 Inspect recompressor drive-end bearing', when: '40 min ago', icon: IconTool },
  { id: 'r3', kind: 'Dashboard', title: 'Gas compression overview', when: '2 h ago', icon: IconLayoutDashboard },
  { id: 'r4', kind: 'Asset', title: '23-HA-9114 Interstage cooler', when: 'Yesterday', icon: IconBinaryTree },
] as const;

const LANDING_MY_ORDERS = WORK_ORDERS.filter((order) => order.status !== 'done').slice(0, 4);

const LANDING_FEATURES = [
  { id: 'model', icon: <IconBinaryTree />, title: 'One model of the plant', description: 'Assets, tags, documents and work orders are linked, so every screen starts from the same equipment.' },
  { id: 'live', icon: <IconChartLine />, title: 'Live and historical together', description: 'Trends open at the current value and scroll back years without changing tools.' },
  { id: 'alarms', icon: <IconAlarm />, title: 'Alarms with their context', description: 'Each alarm shows the trend that raised it, the limit it crossed and the work already planned.' },
  { id: 'assistant', icon: <IconSparkles />, title: 'An assistant that cites', description: 'Ask in plain words. Answers point to the tags, events and documents they rest on.' },
  { id: 'access', icon: <IconShieldCheck />, title: 'Access by area', description: 'People see the parts of the plant they work on. Writing to other systems always asks first.' },
  { id: 'connect', icon: <IconPlugConnected />, title: 'Connected to what you run', description: 'Historians, SAP PM and document stores are read in place through extractors you can monitor.' },
];

const LANDING_FACTS = [
  { id: 'series', value: '12 400', label: 'Time series', detail: 'Updated every second' },
  { id: 'assets', value: '3 180', label: 'Assets in the hierarchy', detail: 'Across 4 sites' },
  { id: 'docs', value: '41 000', label: 'Documents linked', detail: 'P&IDs, datasheets, procedures' },
  { id: 'uptime', value: '99.95', unit: '%', label: 'Service availability', detail: 'Last 12 months' },
];

type LandingRole = 'operator' | 'engineer' | 'planner';

const LANDING_ROLES: Record<LandingRole, { label: string; title: string; description: string; day: readonly { id: string; title: string; description: string }[] }> = {
  operator: {
    label: 'Operator',
    title: 'See what needs you, in the order it needs you',
    description: 'The alarm list, the trend behind each alarm and the handover log in one place, built for the console.',
    day: [
      { id: 'a', title: 'Start from the alarm list', description: 'Most severe first, with value against limit on every row.' },
      { id: 'b', title: 'Open the trend in one step', description: 'Each alarm leads to the tag that raised it, limits drawn in.' },
      { id: 'c', title: 'Hand over what changed', description: 'The shift log is drafted from the alarms and work you touched.' },
    ],
  },
  engineer: {
    label: 'Engineer',
    title: 'Find the cause without collecting the data first',
    description: 'Compare tags across equipment, overlay events and keep the analysis as a notebook others can read.',
    day: [
      { id: 'a', title: 'Compare equipment side by side', description: 'The same measurement across all three compressors on one axis.' },
      { id: 'b', title: 'Overlay alarms and work', description: 'See what happened on the trend, not in a separate list.' },
      { id: 'c', title: 'Change a limit with review', description: 'Limit changes carry a reason and an approver.' },
    ],
  },
  planner: {
    label: 'Planner',
    title: 'Plan the week around the condition of the plant',
    description: 'Open work, due dates and equipment health in one backlog, so the urgent jobs are the ones that matter.',
    day: [
      { id: 'a', title: 'Sort the backlog by risk', description: 'Priority, criticality and health score on every work order.' },
      { id: 'b', title: 'See what is overdue', description: 'Overdue jobs are marked in words, with the days they slipped.' },
      { id: 'c', title: 'Assign from the same screen', description: 'Technicians and their load next to the unassigned work.' },
    ],
  },
};

const LANDING_RELEASES = [
  {
    version: '2026.3',
    date: '10 Mar 2026',
    summary: 'Notebooks for analyses you keep, and quicker alarm handling.',
    changes: [
      { id: 'a', type: 'New', text: 'Notebooks: numbered questions with the chart and answer under each.' },
      { id: 'b', type: 'Improved', text: 'Acknowledge several alarms at once from the alarm list.' },
      { id: 'c', type: 'Fixed', text: 'Trend cursors no longer drift when a series has gaps.' },
    ],
  },
  {
    version: '2026.2',
    date: '11 Feb 2026',
    summary: 'Limit changes go through review.',
    changes: [
      { id: 'a', type: 'New', text: 'Alarm limit changes need a reason and an approver.' },
      { id: 'b', type: 'Improved', text: 'Work order rows show the permit state.' },
    ],
  },
  {
    version: '2026.1',
    date: '14 Jan 2026',
    summary: 'A faster asset tree and fixes to export.',
    changes: [
      { id: 'a', type: 'Improved', text: 'The asset tree opens 3 180 assets without paging.' },
      { id: 'b', type: 'Fixed', text: 'CSV export keeps the unit column for every tag.' },
      { id: 'c', type: 'Fixed', text: 'Shelved alarms return at the time shown, in the plant time zone.' },
    ],
  },
] as const;

const LANDING_CHANGE_TYPES = ['All', 'New', 'Improved', 'Fixed'] as const;

const LANDING_DOC_TOPICS = [
  { id: 'start', icon: IconBook2, title: 'Getting started', description: 'Sign in, find an asset, open your first trend.', articles: 8 },
  { id: 'alarms', icon: IconAlarm, title: 'Alarms', description: 'Severity, acknowledging, shelving and alarm rules.', articles: 14 },
  { id: 'trends', icon: IconChartLine, title: 'Trends and charts', description: 'Limits, overlays, comparing tags and exporting.', articles: 21 },
  { id: 'work', icon: IconTool, title: 'Work orders', description: 'Creating, planning and closing work with SAP PM.', articles: 12 },
  { id: 'data', icon: IconDatabase, title: 'Data and extractors', description: 'Connecting historians and monitoring freshness.', articles: 17 },
  { id: 'api', icon: IconCode, title: 'API and SDK', description: 'Query time series, assets and events from code.', articles: 33 },
] as const;

const LANDING_DOC_POPULAR = [
  'Acknowledge and shelve an alarm',
  'Compare the same tag across equipment',
  'Create a work order from an alarm',
  'Change an alarm limit with review',
];

const LANDING_SETUP: readonly SetupStep[] = [
  { id: 'project', title: 'Open your project', done: true },
  { id: 'source', title: 'Connect a data source', done: true },
  {
    id: 'area',
    title: 'Choose your area of the plant',
    description: 'The overview, alarm list and work orders start filtered to it. You can change it at any time.',
    done: false,
    actionLabel: 'Choose area',
    hint: 'About 1 min',
  },
  {
    id: 'alerts',
    title: 'Set up alarm notifications',
    description: 'Pick the severities you want to hear about when you are away from the console.',
    done: false,
    actionLabel: 'Set up notifications',
    hint: 'About 2 min',
  },
  { id: 'team', title: 'Invite your shift', description: 'Add the people you hand over to.', done: false, actionLabel: 'Invite people', hint: 'Optional' },
];

type LandingApp = { id: string; name: string; category: string; description: string; author: string; icon: typeof IconTool };

const LANDING_APPS: readonly LandingApp[] = [
  { id: 'compression', name: 'Gas compression overview', category: 'Operations', description: 'Stage pressures, temperatures and vibration for all three compressors.', author: 'Aisha Khan', icon: IconLayoutDashboard },
  { id: 'alarm-kpi', name: 'Alarm performance', category: 'Operations', description: 'Alarm rate, standing alarms and chattering tags per shift.', author: 'Liv Wold', icon: IconAlarm },
  { id: 'backlog', name: 'Maintenance backlog', category: 'Maintenance', description: 'Open work by priority, age and equipment criticality.', author: 'Magnus Solberg', icon: IconTool },
  { id: 'energy', name: 'Energy intensity', category: 'Energy', description: 'kWh per boe by area, against the monthly target.', author: 'Aisha Khan', icon: IconChartLine },
  { id: 'health', name: 'Rotating equipment health', category: 'Maintenance', description: 'Health scores and bearing trends for pumps and compressors.', author: 'Aisha Khan', icon: IconShieldCheck },
  { id: 'freshness', name: 'Data freshness', category: 'Data', description: 'Extractor lag and tags that stopped reporting.', author: 'Jonas Nyberg', icon: IconDatabase },
];

const LANDING_APP_CATEGORIES = ['All', 'Operations', 'Maintenance', 'Energy', 'Data'] as const;

type LandingService = { id: string; name: string; tone: Tone; state: string; uptime: number; badDays: readonly number[] };

const LANDING_SERVICES: readonly LandingService[] = [
  { id: 'app', name: 'Web application', tone: 'success', state: 'Operational', uptime: 100, badDays: [] },
  { id: 'ingest', name: 'Time series ingestion', tone: 'warning', state: 'Degraded', uptime: 99.62, badDays: [17, 29] },
  { id: 'api', name: 'API', tone: 'success', state: 'Operational', uptime: 99.98, badDays: [17] },
  { id: 'assistant', name: 'Plant assistant', tone: 'success', state: 'Operational', uptime: 99.91, badDays: [8] },
  { id: 'sap', name: 'SAP PM connection', tone: 'success', state: 'Operational', uptime: 100, badDays: [] },
];

const LANDING_DAYS = Array.from({ length: 30 }, (_, index) => index);

const LANDING_INCIDENTS = [
  { id: 'i1', date: '12 Mar, 13:20', title: 'Time series ingestion delayed', text: 'Values from the Nordkapp historian arrive up to 4 minutes late. The extractor is being restarted.', state: 'Investigating' },
  { id: 'i2', date: '28 Feb, 02:10', title: 'API and ingestion interrupted', text: 'A database failover took 11 minutes. No data was lost; the backlog was ingested by 02:40.', state: 'Resolved' },
];

const LANDING_PLANS = [
  {
    id: 'team',
    name: 'Team',
    description: 'One site, one control room.',
    monthly: 1400,
    features: [
      { id: 'a', label: 'Up to 25 people' },
      { id: 'b', label: '5 000 time series' },
      { id: 'c', label: 'Alarms, trends and work orders' },
      { id: 'd', label: 'Plant assistant', included: false },
    ],
  },
  {
    id: 'plant',
    name: 'Plant',
    description: 'A whole plant, operations and maintenance.',
    monthly: 3900,
    highlight: 'Most plants pick this',
    features: [
      { id: 'a', label: 'Up to 150 people' },
      { id: 'b', label: '25 000 time series' },
      { id: 'c', label: 'Everything in Team' },
      { id: 'd', label: 'Plant assistant with approvals' },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Several sites with shared engineering.',
    monthly: null,
    features: [
      { id: 'a', label: 'Unlimited people and sites' },
      { id: 'b', label: 'Time series by agreement' },
      { id: 'c', label: 'Everything in Plant' },
      { id: 'd', label: 'Single sign-on and audit export' },
    ],
  },
] as const;

const LANDING_TEAM = PEOPLE.slice(0, 5);

const LANDING_PINNED = [
  { id: 'p1', name: 'Gas compression overview', kind: 'Dashboard', updated: 'Updated 2 h ago' },
  { id: 'p2', name: 'Compressor vibration, week 11', kind: 'Notebook', updated: 'Updated today' },
  { id: 'p3', name: 'Bearing inspection procedure', kind: 'Document', updated: 'Rev. 4, Jan 2026' },
];

const LANDING_ACTIVITY = [
  { id: 'a1', person: PEOPLE[2], text: 'added a question to Compressor vibration, week 11', when: '13:58' },
  { id: 'a2', person: PEOPLE[3], text: 'updated WO-104482 to 35 % done', when: '13:10' },
  { id: 'a3', person: PEOPLE[4], text: 'pinned Gas compression overview', when: '09:42' },
  { id: 'a4', person: PEOPLE[1], text: 'planned WO-104479 for tomorrow', when: 'Yesterday' },
];

function isLandingRole(value: unknown): value is LandingRole {
  return value === 'operator' || value === 'engineer' || value === 'planner';
}

function landingPrice(monthly: number | null, period: BillingPeriod): string {
  if (monthly === null) return 'Custom';
  const value = period === 'annual' ? Math.round((monthly * 10) / 12) : monthly;
  return `€ ${value.toLocaleString('en-GB').replace(',', ' ')}`;
}

function LandingSiteFooter() {
  return (
    <>
      <span>Nordkapp operations workspace</span>
      <span className="flex items-center gap-4">
        <a href="#privacy" className={LANDING_LINK} onClick={(event) => event.preventDefault()}>
          Privacy
        </a>
        <a href="#terms" className={LANDING_LINK} onClick={(event) => event.preventDefault()}>
          Terms
        </a>
        <a href="#status" className={LANDING_LINK} onClick={(event) => event.preventDefault()}>
          Status
        </a>
      </span>
    </>
  );
}

/** A panel with a title on the base surface: the unit the in-app pages are laid out from. */
function LandingPanel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-2">
      <SectionHeader title={title} size="sm" as="h2" actions={action} />
      {children}
    </section>
  );
}

function LandingTemplateInAppHome() {
  const [picked, setPicked] = useState<string | null>(null);
  const { availability, gasExport, activeAlarms, openWorkOrders } = PLANT_KPIS;

  return (
    <PageFrame title="In-app home" address="nordkapp.example/home" height="lg">
      <ShellPage
        product="Nordkapp"
        nav={LANDING_SHELL_NAV}
        activeId="home"
        trail={['Nordkapp', 'Home']}
        topbarEnd={<PersonAvatar name={PEOPLE[0].name} sizes="xsm" />}
      >
        <div className="flex w-full flex-col gap-8">
          <PageHeader as="h1" title="Home" description="Nordkapp production · day shift, 12 March" />
          <StatRow
            label="Plant status now"
            stats={[
              { id: 'availability', label: 'Availability', value: availability.value.toFixed(1), unit: '%', detail: `Target ${availability.target} %` },
              { id: 'export', label: 'Gas export', value: gasExport.value.toFixed(2), unit: gasExport.unit, detail: `Target ${gasExport.target}` },
              { id: 'alarms', label: 'Active alarms', value: activeAlarms.value, detail: '1 critical, unacknowledged' },
              { id: 'orders', label: 'Open work orders', value: openWorkOrders.value, detail: '1 overdue' },
            ]}
          />
          <LandingPanel title="Quick actions">
            <ul className="grid grid-cols-2 gap-3 @4xl:grid-cols-4">
              {LANDING_QUICK_ACTIONS.map((action) => (
                <li key={action.id}>
                  <button
                    type="button"
                    aria-pressed={picked === action.id}
                    onClick={() => setPicked(action.id)}
                    className="flex h-full w-full flex-col gap-2 rounded-xl bg-card-background p-4 text-left outline-none hover:bg-card-background-hover focus-visible:shadow-focus-ring"
                  >
                    <action.icon aria-hidden className="size-5 text-muted-foreground" />
                    <span className="text-sm font-medium text-base-foreground">{action.label}</span>
                    <span className="text-xs text-muted-foreground">{action.detail}</span>
                  </button>
                </li>
              ))}
            </ul>
          </LandingPanel>
          <div className="grid grid-cols-1 gap-8 @4xl:grid-cols-2">
            <LandingPanel
              title="Continue where you left off"
              action={
                <Button variant="ghost" size="sm">
                  View history
                </Button>
              }
            >
              <ul className="flex flex-col">
                {LANDING_RECENT.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 border-b border-default py-2 last:border-b-0">
                    <item.icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm text-base-foreground">{item.title}</span>
                      <span className="text-xs text-muted-foreground">{item.kind}</span>
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{item.when}</span>
                  </li>
                ))}
              </ul>
            </LandingPanel>
            <LandingPanel
              title="Work in your area"
              action={
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              }
            >
              <ul className="flex flex-col">
                {LANDING_MY_ORDERS.map((order) => (
                  <li key={order.id} className="flex items-center gap-3 border-b border-default py-2 last:border-b-0">
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm text-base-foreground">{order.title}</span>
                      <span className="text-xs text-muted-foreground">
                        <span className="font-mono">{order.id}</span> · due {formatDate(order.dueAt)}
                      </span>
                    </span>
                    <StatusBadge status={order.status} outline />
                  </li>
                ))}
              </ul>
            </LandingPanel>
          </div>
        </div>
      </ShellPage>
    </PageFrame>
  );
}

function LandingTemplateProduct() {
  const { availability, gasExport } = PLANT_KPIS;

  return (
    <PageFrame title="Product landing" address="nordkapp.example" height="lg">
      <SitePage
        brand={<BrandMark name="Nordkapp" />}
        links={LANDING_SITE_LINKS}
        activeLinkId="product"
        actions={
          <>
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
            <Button size="sm">Book a walkthrough</Button>
          </>
        }
        footer={<LandingSiteFooter />}
      >
        <SiteBand spacing="lg">
          <Hero
            as="h1"
            align="center"
            size="display"
            eyebrow="Operations workspace for process plants"
            title="Run the plant from one picture of it"
            description="Operations, maintenance and engineering work from the same assets, tags and limits, with every number traceable to its source."
            actions={
              <>
                <Button size="lg">Book a walkthrough</Button>
                <Button size="lg" variant="ghost">
                  See how it connects <IconArrowRight />
                </Button>
              </>
            }
            visual={
              <div className="mx-auto grid w-full max-w-2xl grid-cols-1 gap-4 @2xl:grid-cols-2">
                <KpiTile
                  label="Availability"
                  value={availability.value}
                  unit="%"
                  decimals={1}
                  delta={{ reference: availability.previous, goodDirection: 'up', caption: 'vs yesterday' }}
                  trend={{ values: LANDING_AVAILABILITY, label: 'Availability, last 30 days' }}
                />
                <KpiTile
                  label="Gas export"
                  value={gasExport.value}
                  unit={gasExport.unit}
                  decimals={2}
                  delta={{ reference: gasExport.previous, goodDirection: 'up', caption: 'vs yesterday', decimals: 2 }}
                  trend={{ values: LANDING_EXPORT, label: 'Gas export, last 30 days' }}
                />
              </div>
            }
          />
        </SiteBand>
        <SiteBand label="Features">
          <SectionHeader size="lg" as="h2" title="What the workspace gives each shift" description="Six things that are true on every screen." />
          <div className="grid grid-cols-1 gap-x-8 gap-y-8 @2xl:grid-cols-2 @4xl:grid-cols-3">
            {LANDING_FEATURES.map((feature) => (
              <FeatureCard key={feature.id} icon={feature.icon} title={feature.title} description={feature.description} />
            ))}
          </div>
        </SiteBand>
        <SiteBand label="Nordkapp in numbers" spacing="sm">
          <StatsBand label="Nordkapp in numbers" stats={LANDING_FACTS} />
        </SiteBand>
        <SiteBand surface="muted" label="Next step">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-1">
              <h2 className="text-xl font-semibold tracking-tight text-base-foreground">See it on your own tags</h2>
              <p className="text-sm text-medium-foreground">A walkthrough takes 40 minutes and uses a read-only copy of your historian.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button>Book a walkthrough</Button>
              <Button variant="ghost">Read the docs</Button>
            </div>
          </div>
        </SiteBand>
      </SitePage>
    </PageFrame>
  );
}

function LandingRoleVisual({ role }: { role: LandingRole }) {
  if (role === 'operator') {
    return (
      <ul aria-label="Active alarms" className="flex flex-col">
        {ALARMS.filter((alarm) => alarm.state !== 'cleared').slice(0, 4).map((alarm) => (
          <li key={alarm.id} className="flex items-center gap-3 border-b border-default py-2 last:border-b-0">
            <span className="w-20 shrink-0">
              <StatusIndicator size="sm" {...severityStatus(alarm.severity)} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm text-base-foreground">{alarm.message}</span>
              <span className="font-mono text-xs text-muted-foreground">{alarm.sensorTag}</span>
            </span>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{formatAgo(alarm.raisedAt)}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (role === 'engineer') {
    return (
      <ul aria-label="Compressor measurements" className="flex flex-col">
        {SENSORS.slice(0, 4).map((sensor) => (
          <li key={sensor.id} className="flex items-center gap-3 border-b border-default py-2 last:border-b-0">
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm text-base-foreground">{sensor.name}</span>
              <span className="font-mono text-xs text-muted-foreground">{sensor.tag}</span>
            </span>
            <span className="shrink-0 text-sm tabular-nums text-base-foreground">
              {sensor.value.toFixed(sensor.decimals)} <span className="text-muted-foreground">{sensor.unit}</span>
            </span>
            <span className="w-24 shrink-0 text-right text-xs tabular-nums text-muted-foreground">High {sensor.highLimit}</span>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul aria-label="Open work orders" className="flex flex-col">
      {WORK_ORDERS.filter((order) => order.status !== 'done').slice(0, 4).map((order) => (
        <li key={order.id} className="flex items-center gap-3 border-b border-default py-2 last:border-b-0">
          <Badge variant="secondary">{order.priority}</Badge>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm text-base-foreground">{order.title}</span>
            <span className="text-xs text-muted-foreground">{findAsset(order.assetId)?.name}</span>
          </span>
          <StatusBadge status={order.status} outline />
        </li>
      ))}
    </ul>
  );
}

function LandingTemplateRoleSolution() {
  const [role, setRole] = useState<LandingRole>('operator');
  const content = LANDING_ROLES[role];

  return (
    <PageFrame title="Solution page for a role" address="nordkapp.example/solutions">
      <SitePage brand={<BrandMark name="Nordkapp" />} links={LANDING_SITE_LINKS} activeLinkId="solutions" actions={<Button size="sm">Book a walkthrough</Button>}>
        <SiteBand>
          <SegmentedControl
            value={role}
            onValueChange={(value) => {
              if (isLandingRole(value)) setRole(value);
            }}
          >
            <SegmentedControlList aria-label="Role">
              <SegmentedControlButton value="operator" tabContent="label-only">
                Operator
              </SegmentedControlButton>
              <SegmentedControlButton value="engineer" tabContent="label-only">
                Engineer
              </SegmentedControlButton>
              <SegmentedControlButton value="planner" tabContent="label-only">
                Planner
              </SegmentedControlButton>
            </SegmentedControlList>
          </SegmentedControl>
          <div className="grid grid-cols-1 gap-8 @3xl:grid-cols-2">
            <div className="flex flex-col gap-6">
              <Hero as="h1" size="compact" eyebrow={`For the ${content.label.toLowerCase()}`} title={content.title} description={content.description} />
              <ol className="flex flex-col gap-4">
                {content.day.map((item, index) => (
                  <li key={item.id}>
                    <FeatureCard layout="inline" marker={String(index + 1)} title={item.title} description={item.description} as="h4" />
                  </li>
                ))}
              </ol>
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-default p-4">
              <p className="text-xs font-medium text-muted-foreground">
                {role === 'operator' ? 'The alarm list, live' : role === 'engineer' ? 'Measurements on 23-KA-9101' : 'The backlog, by priority'}
              </p>
              <LandingRoleVisual role={role} />
            </div>
          </div>
        </SiteBand>
      </SitePage>
    </PageFrame>
  );
}

function LandingTemplatePricing() {
  const [period, setPeriod] = useState<BillingPeriod>('annual');

  return (
    <PageFrame title="Pricing" address="nordkapp.example/pricing" height="lg">
      <SitePage brand={<BrandMark name="Nordkapp" />} links={LANDING_SITE_LINKS} activeLinkId="pricing" footer={<LandingSiteFooter />}>
        <SiteBand>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0 flex-1">
              <SectionHeader size="lg" as="h2" title="Pricing" description="Priced per plant, not per person. Every plan includes onboarding." />
            </div>
            <BillingToggle value={period} onValueChange={setPeriod} annualNote="Two months free" />
          </div>
          <div className="grid grid-cols-1 gap-4 @3xl:grid-cols-3">
            {LANDING_PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                name={plan.name}
                description={plan.description}
                price={landingPrice(plan.monthly, period)}
                period={plan.monthly === null ? undefined : 'per month'}
                priceNote={plan.monthly === null ? 'Quoted per site' : period === 'annual' ? 'Billed annually' : 'Billed monthly'}
                features={plan.features}
                highlightLabel={'highlight' in plan ? plan.highlight : undefined}
                action={
                  <Button variant={'highlight' in plan ? 'default' : 'secondary'} className="w-full">
                    {plan.monthly === null ? 'Talk to us' : `Choose ${plan.name}`}
                  </Button>
                }
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Prices exclude VAT. Time series above the plan limit are billed per 1 000 per month.</p>
        </SiteBand>
      </SitePage>
    </PageFrame>
  );
}

function LandingTemplateDocsHome() {
  const [query, setQuery] = useState('');
  const term = query.trim().toLowerCase();
  const topics = LANDING_DOC_TOPICS.filter((topic) => `${topic.title} ${topic.description}`.toLowerCase().includes(term));

  return (
    <PageFrame title="Documentation home" address="docs.nordkapp.example" height="lg">
      <SitePage
        brand={<BrandMark name="Nordkapp" section="Docs" />}
        links={[
          { id: 'guides', label: 'Guides' },
          { id: 'api', label: 'API reference' },
          { id: 'releases', label: 'Release notes' },
        ]}
        activeLinkId="guides"
        actions={
          <Button variant="ghost" size="sm">
            Open the app
          </Button>
        }
      >
        <SiteBand surface="muted" width="md">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight text-base-foreground">Documentation</h1>
              <p className="text-sm text-medium-foreground">Guides for the control room, maintenance and the people who connect the data.</p>
            </div>
            <Search
              aria-label="Search the documentation"
              placeholder="Search topics"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onClear={() => setQuery('')}
            />
          </div>
        </SiteBand>
        <SiteBand width="md" label="Topics">
          {topics.length === 0 ? (
            <p className="text-sm text-muted-foreground">No topic matches &ldquo;{query.trim()}&rdquo;. Try a shorter word, such as alarm or trend.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 @2xl:grid-cols-2">
              {topics.map((topic) => (
                <li key={topic.id}>
                  <a
                    href={`#${topic.id}`}
                    onClick={(event) => event.preventDefault()}
                    className="flex h-full items-start gap-3 rounded-xl border border-default p-4 outline-none hover:bg-base-background-hover focus-visible:shadow-focus-ring"
                  >
                    <topic.icon aria-hidden className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="text-sm font-medium text-base-foreground">{topic.title}</span>
                      <span className="text-sm text-medium-foreground">{topic.description}</span>
                      <span className="text-xs tabular-nums text-muted-foreground">{topic.articles} articles</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
          <div className="grid grid-cols-1 gap-6 @2xl:grid-cols-2">
            <LandingPanel title="Popular articles">
              <ul className="flex flex-col gap-2 text-sm">
                {LANDING_DOC_POPULAR.map((article) => (
                  <li key={article}>
                    <a href="#article" className={LANDING_LINK} onClick={(event) => event.preventDefault()}>
                      {article}
                    </a>
                  </li>
                ))}
              </ul>
            </LandingPanel>
            <LandingPanel title="Need a person?">
              <p className="text-sm text-medium-foreground">Support answers on working days, 07:00 to 17:00 CET. Include the page address and the tag.</p>
              <div>
                <Button variant="secondary" size="sm">
                  <IconLifebuoy /> Contact support
                </Button>
              </div>
            </LandingPanel>
          </div>
        </SiteBand>
      </SitePage>
    </PageFrame>
  );
}

function LandingTemplateGettingStarted() {
  const [steps, setSteps] = useState<readonly SetupStep[]>(LANDING_SETUP);

  return (
    <PageFrame title="Getting started" address="nordkapp.example/getting-started">
      <div className="flex min-h-full flex-col bg-muted-background">
        <header className="flex items-center justify-between gap-4 px-6 py-4">
          <BrandMark name="Nordkapp" />
          <Button variant="ghost" size="sm">
            Skip for now
          </Button>
        </header>
        <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-6 px-6 pb-8 @3xl:grid-cols-5">
          <div className="flex flex-col gap-4 rounded-xl bg-base-background p-6 @3xl:col-span-3">
            <SetupChecklist
              title="Get ready for your first shift"
              description="Five steps, about five minutes. You can leave and pick up where you stopped."
              steps={steps}
              onStepAction={(id) => setSteps((current) => current.map((step) => (step.id === id ? { ...step, done: true } : step)))}
              complete={
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-medium-foreground">Everything is set. The overview opens filtered to your area.</p>
                  <div className="flex gap-2">
                    <Button size="sm">Open the overview</Button>
                    <Button variant="ghost" size="sm" onClick={() => setSteps(LANDING_SETUP)}>
                      Reset example
                    </Button>
                  </div>
                </div>
              }
            />
          </div>
          <aside aria-label="Help with setup" className="flex flex-col gap-6 py-6 @3xl:col-span-2">
            <FeatureCard
              layout="inline"
              icon={<IconBook2 />}
              title="Read the five-minute guide"
              description="What the overview, the alarm list and a trend show, with pictures."
              as="h4"
            />
            <FeatureCard
              layout="inline"
              icon={<IconUsers />}
              title="Ask your shift supervisor"
              description={`${PEOPLE[4].name} set up this project and can change what you have access to.`}
              as="h4"
            />
            <FeatureCard
              layout="inline"
              icon={<IconLifebuoy />}
              title="Contact support"
              description="Working days, 07:00 to 17:00 CET."
              as="h4"
            />
          </aside>
        </div>
      </div>
    </PageFrame>
  );
}

function LandingTemplateCatalogue() {
  const [category, setCategory] = useState<(typeof LANDING_APP_CATEGORIES)[number]>('All');
  const [query, setQuery] = useState('');
  const [added, setAdded] = useState<readonly string[]>(['compression']);
  const term = query.trim().toLowerCase();
  const apps = LANDING_APPS.filter(
    (app) => (category === 'All' || app.category === category) && `${app.name} ${app.description}`.toLowerCase().includes(term)
  );
  const toggle = (id: string) => setAdded((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));

  return (
    <PageFrame title="Catalogue grid" address="nordkapp.example/dashboards/catalogue" height="lg">
      <div className="flex min-h-full bg-base-background">
        <nav aria-label="Categories" className="flex w-48 shrink-0 flex-col gap-1 border-r border-default p-4">
          <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">Categories</p>
          {LANDING_APP_CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
              aria-current={item === category ? 'true' : undefined}
              onClick={() => setCategory(item)}
              className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm outline-none hover:bg-base-background-hover focus-visible:shadow-focus-ring ${item === category ? 'bg-secondary-background font-medium text-secondary-foreground' : 'text-medium-foreground'}`}
            >
              {item}
              <span className="text-xs tabular-nums text-muted-foreground">
                {item === 'All' ? LANDING_APPS.length : LANDING_APPS.filter((app) => app.category === item).length}
              </span>
            </button>
          ))}
        </nav>
        <div className="flex min-w-0 flex-1 flex-col gap-4 p-6">
          <PageHeader
            as="h1"
            title="Dashboard catalogue"
            description="Dashboards built by people at Nordkapp. Add one to your sidebar; it stays up to date with the original."
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="w-full max-w-xs">
              <Search
                aria-label="Search dashboards"
                placeholder="Search dashboards"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onClear={() => setQuery('')}
              />
            </div>
            <p className="text-xs tabular-nums text-muted-foreground" role="status">
              {apps.length} of {LANDING_APPS.length} dashboards · {added.length} in your sidebar
            </p>
          </div>
          {apps.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No dashboard matches. Clear the search or pick another category.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3">
              {apps.map((app) => {
                const isAdded = added.includes(app.id);
                return (
                  <li key={app.id} className="flex flex-col gap-3 rounded-xl bg-card-background p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-base-background text-medium-foreground">
                        <app.icon aria-hidden className="size-5" />
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <h2 className="text-sm font-medium text-base-foreground">{app.name}</h2>
                        <span className="text-xs text-muted-foreground">
                          {app.category} · by {app.author}
                        </span>
                      </div>
                    </div>
                    <p className="flex-1 text-sm text-medium-foreground">{app.description}</p>
                    <div className="flex items-center justify-between gap-2">
                      <Button variant={isAdded ? 'ghost' : 'secondary'} size="sm" aria-pressed={isAdded} onClick={() => toggle(app.id)}>
                        {isAdded ? 'Remove from sidebar' : 'Add to sidebar'}
                      </Button>
                      <Button variant="ghost" size="sm">
                        Preview
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </PageFrame>
  );
}

function LandingTemplateReleaseNotes() {
  const [type, setType] = useState<(typeof LANDING_CHANGE_TYPES)[number]>('All');

  return (
    <PageFrame title="Release notes" address="nordkapp.example/releases" height="lg">
      <SitePage brand={<BrandMark name="Nordkapp" section="Releases" />} width="md" actions={<Button variant="ghost" size="sm">Subscribe by email</Button>}>
        <SiteBand width="md">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight text-base-foreground">Release notes</h1>
              <p className="text-sm text-medium-foreground">What changed, newest first. Releases go out on the second Tuesday of the month.</p>
            </div>
            <div role="group" aria-label="Filter by type of change" className="flex items-center gap-1">
              {LANDING_CHANGE_TYPES.map((item) => (
                <Button key={item} variant={item === type ? 'secondary' : 'ghost'} size="sm" aria-pressed={item === type} onClick={() => setType(item)}>
                  {item}
                </Button>
              ))}
            </div>
          </div>
          <ol className="flex flex-col">
            {LANDING_RELEASES.map((release) => {
              const changes = release.changes.filter((change) => type === 'All' || change.type === type);
              return (
                <li key={release.version} className="grid grid-cols-1 gap-x-8 gap-y-2 border-t border-default py-6 @2xl:grid-cols-4">
                  <div className="flex flex-col">
                    <span className="text-base font-semibold tabular-nums text-base-foreground">{release.version}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">{release.date}</span>
                  </div>
                  <div className="flex flex-col gap-3 @2xl:col-span-3">
                    <p className="text-sm font-medium text-base-foreground">{release.summary}</p>
                    {changes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nothing of this type in this release.</p>
                    ) : (
                      <ul className="flex flex-col gap-2">
                        {changes.map((change) => (
                          <li key={change.id} className="flex items-start gap-3 text-sm text-medium-foreground">
                            <span className="w-20 shrink-0">
                              <Badge variant="secondary" outline={change.type !== 'New'}>
                                {change.type}
                              </Badge>
                            </span>
                            <span className="min-w-0 flex-1">{change.text}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </SiteBand>
      </SitePage>
    </PageFrame>
  );
}

function LandingTemplateStatus() {
  return (
    <PageFrame title="Status page" address="status.nordkapp.example" height="lg">
      <SitePage
        brand={<BrandMark name="Nordkapp" section="Status" />}
        width="md"
        actions={<Button variant="secondary" size="sm">Subscribe to updates</Button>}
        footer={<span className="tabular-nums">Checked every minute. Last check 14:00 UTC, 12 Mar 2026.</span>}
      >
        <SiteBand width="md">
          <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-warning-background p-4 text-warning-foreground">
            <div className="flex flex-col gap-1">
              <h1 className="text-base font-semibold">One service is degraded</h1>
              <p className="text-sm">Time series ingestion is delayed by up to 4 minutes. Everything else is working.</p>
            </div>
            <span className="text-xs tabular-nums">Since 13:20 UTC</span>
          </div>
          <section aria-labelledby="landing-status-services" className="flex flex-col gap-2">
            <SectionHeader size="sm" as="h2" title="Services" description="Each bar is one day, oldest on the left. Days with an incident are marked." />
            <ul id="landing-status-services" className="flex flex-col">
              {LANDING_SERVICES.map((service) => (
                <li key={service.id} className="flex flex-col gap-2 border-b border-default py-3 last:border-b-0">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-base-foreground">{service.name}</span>
                    <StatusIndicator size="sm" tone={service.tone} label={service.state} shape={service.tone === 'success' ? 'dot' : 'diamond'} />
                  </div>
                  <div
                    role="img"
                    aria-label={`${service.name}: ${service.uptime.toFixed(2)} % uptime over 30 days, ${service.badDays.length} days with an incident`}
                    className="flex h-6 items-end gap-0.5"
                  >
                    {LANDING_DAYS.map((day) => (
                      <span
                        key={day}
                        className={`flex-1 rounded-sm ${service.badDays.includes(day) ? 'h-6 bg-warning-foreground-strong' : 'h-4 bg-medium-background'}`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between gap-4 text-xs tabular-nums text-muted-foreground">
                    <span>30 days ago</span>
                    <span>
                      {service.uptime.toFixed(2)} % uptime · {service.badDays.length === 0 ? 'no incidents' : `${service.badDays.length} ${service.badDays.length === 1 ? 'day' : 'days'} with an incident`}
                    </span>
                    <span>Today</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <section className="flex flex-col gap-2">
            <SectionHeader size="sm" as="h2" title="Incidents" />
            <ul className="flex flex-col">
              {LANDING_INCIDENTS.map((incident) => (
                <li key={incident.id} className="flex flex-col gap-1 border-b border-default py-3 last:border-b-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium text-base-foreground">{incident.title}</span>
                    <Badge variant={incident.state === 'Resolved' ? 'secondary' : 'warning'}>{incident.state}</Badge>
                  </div>
                  <p className="text-sm text-medium-foreground">{incident.text}</p>
                  <span className="text-xs tabular-nums text-muted-foreground">{incident.date} UTC</span>
                </li>
              ))}
            </ul>
          </section>
        </SiteBand>
      </SitePage>
    </PageFrame>
  );
}

function LandingTemplateTeamHome() {
  const [joined, setJoined] = useState(false);

  return (
    <PageFrame title="Team space home" address="nordkapp.example/spaces/rotating-equipment">
      <div className="flex min-h-full flex-col bg-base-background">
        <div className="bg-muted-background">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-6">
            <PageHeader
              as="h1"
              title="Rotating equipment"
              description="Compressors, pumps and turbines at Nordkapp: their health, the open work and what the team is looking into."
              leading={
                <span className="flex size-10 items-center justify-center rounded-lg bg-base-background text-medium-foreground">
                  <IconUsers aria-hidden className="size-5" />
                </span>
              }
              meta={
                <span className="flex items-center gap-3 text-xs text-muted-foreground">
                  <AvatarGroup people={LANDING_TEAM} max={4} sizes="xsm" label="Members" />
                  <span className="tabular-nums">{LANDING_TEAM.length + (joined ? 1 : 0)} members</span>
                </span>
              }
              actions={
                <Button variant={joined ? 'secondary' : 'default'} size="sm" aria-pressed={joined} onClick={() => setJoined(!joined)}>
                  {joined ? 'Leave space' : 'Join space'}
                </Button>
              }
            />
          </div>
        </div>
        <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-8 px-6 py-6 @3xl:grid-cols-3">
          <div className="flex flex-col gap-8 @3xl:col-span-2">
            <LandingPanel title="Pinned">
              <ul className="grid grid-cols-1 gap-3 @2xl:grid-cols-3">
                {LANDING_PINNED.map((item) => (
                  <li key={item.id} className="flex flex-col gap-1 rounded-xl bg-card-background p-4">
                    <span className="text-xs text-muted-foreground">{item.kind}</span>
                    <span className="text-sm font-medium text-base-foreground">{item.name}</span>
                    <span className="text-xs text-muted-foreground">{item.updated}</span>
                  </li>
                ))}
              </ul>
            </LandingPanel>
            <LandingPanel title="Recent activity">
              <ul className="flex flex-col">
                {LANDING_ACTIVITY.map((entry) => (
                  <li key={entry.id} className="flex items-center gap-3 border-b border-default py-2 last:border-b-0">
                    <PersonAvatar name={entry.person.name} sizes="xsm" />
                    <p className="min-w-0 flex-1 text-sm text-medium-foreground">
                      <span className="font-medium text-base-foreground">{entry.person.name}</span> {entry.text}
                    </p>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{entry.when}</span>
                  </li>
                ))}
              </ul>
            </LandingPanel>
          </div>
          <div className="flex flex-col gap-8">
            <LandingPanel title="Members">
              <ul className="flex flex-col gap-3">
                {LANDING_TEAM.map((person) => (
                  <li key={person.id} className="flex items-center gap-3">
                    <PersonAvatar name={person.name} sizes="xsm" />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm text-base-foreground">{person.name}</span>
                      <span className="truncate text-xs text-muted-foreground">{person.role}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </LandingPanel>
            <LandingPanel title="About">
              <p className="text-sm text-medium-foreground">Owned by {PEOPLE[2].name}. Open to everyone in Nordkapp production.</p>
            </LandingPanel>
          </div>
        </div>
      </div>
    </PageFrame>
  );
}

export default definePage({
  id: 'landing-pages',
  title: 'Landing pages',
  summary:
    'Whole pages people land on: the home inside the app, public product and pricing pages, documentation, release notes, a catalogue and a status page. Each is assembled from the product patterns and framed at page size.',
  guidance: {
    use: [
      'Open an in-app home with status and the next things to do, not with a greeting.',
      'Use a live component as the visual on a product page; it says more than a screenshot.',
      'Keep one primary action per page and repeat it, in the same words, at the end.',
      'Cap text columns at a reading width even when the page is wide.',
    ],
    avoid: [
      'The display typeface anywhere but the hero of the product landing page.',
      'Claims without a number someone could check.',
      'Decorative colour to separate sections; change the surface or add space.',
    ],
  },
  source,
  sections: [
    {
      id: 'in-app',
      title: 'Inside the app',
      description: 'Pages a signed-in person starts from.',
      specimens: [
        {
          id: 'LandingTemplateInAppHome',
          title: 'In-app home',
          note: 'The page behind the product logo: status now, quick actions and recent work, with no greeting.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates-b/PageFrame.tsx',
            'templates-b/ShellPage.tsx',
            'patterns/collections/StatRow.tsx',
            'patterns/structure/PageHeader.tsx',
            'patterns/structure/SectionHeader.tsx',
            'display/StatusBadge.tsx',
          ],
          Component: LandingTemplateInAppHome,
        },
        {
          id: 'LandingTemplateGettingStarted',
          title: 'Getting started',
          note: 'Use for the first visit: a checklist that tracks progress, with help beside it and a way to skip.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['templates-b/PageFrame.tsx', 'templates-b/BrandMark.tsx', 'patterns/states/SetupChecklist.tsx', 'patterns/product/FeatureCard.tsx'],
          Component: LandingTemplateGettingStarted,
        },
        {
          id: 'LandingTemplateTeamHome',
          title: 'Team space home',
          note: 'Pick it for a team or space: who is in it, what is pinned and what happened lately.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['templates-b/PageFrame.tsx', 'patterns/structure/PageHeader.tsx', 'display/AvatarGroup.tsx', 'display/PersonAvatar.tsx'],
          Component: LandingTemplateTeamHome,
        },
        {
          id: 'LandingTemplateCatalogue',
          title: 'Catalogue grid',
          note: 'Use for a marketplace of dashboards or apps: categories on the left, search and a card grid on the right.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['templates-b/PageFrame.tsx', 'patterns/structure/PageHeader.tsx'],
          Component: LandingTemplateCatalogue,
        },
      ],
    },
    {
      id: 'product',
      title: 'Product pages',
      description: 'Public pages that explain and sell.',
      specimens: [
        {
          id: 'LandingTemplateProduct',
          title: 'Product landing',
          note: 'The front page of a product: hero with a live visual, features, numbers and a closing action band.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates-b/PageFrame.tsx',
            'templates-b/SitePage.tsx',
            'templates-b/SiteBand.tsx',
            'templates-b/BrandMark.tsx',
            'patterns/product/Hero.tsx',
            'patterns/product/FeatureCard.tsx',
            'patterns/product/StatsBand.tsx',
            'industrial/KpiTile.tsx',
          ],
          Component: LandingTemplateProduct,
        },
        {
          id: 'LandingTemplateRoleSolution',
          title: 'Solution page for a role',
          note: 'Pick it when the same product is explained to operators, engineers and planners; the role switch changes text and the live example.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates-b/PageFrame.tsx',
            'templates-b/SitePage.tsx',
            'templates-b/SiteBand.tsx',
            'patterns/product/Hero.tsx',
            'patterns/product/FeatureCard.tsx',
            'industrial/StatusIndicator.tsx',
          ],
          Component: LandingTemplateRoleSolution,
        },
        {
          id: 'LandingTemplatePricing',
          title: 'Pricing',
          note: 'Use when plans are public: a billing switch and three plans with one recommended in words.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates-b/PageFrame.tsx',
            'templates-b/SitePage.tsx',
            'templates-b/SiteBand.tsx',
            'patterns/product/PlanCard.tsx',
            'patterns/product/BillingToggle.tsx',
          ],
          Component: LandingTemplatePricing,
        },
      ],
    },
    {
      id: 'reference',
      title: 'Reference pages',
      description: 'Pages people return to for facts.',
      specimens: [
        {
          id: 'LandingTemplateDocsHome',
          title: 'Documentation home',
          note: 'The entrance to the docs: search first, then topics with article counts and a route to a person.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['templates-b/PageFrame.tsx', 'templates-b/SitePage.tsx', 'templates-b/SiteBand.tsx', 'templates-b/BrandMark.tsx'],
          Component: LandingTemplateDocsHome,
        },
        {
          id: 'LandingTemplateReleaseNotes',
          title: 'Release notes',
          note: 'Use for a changelog: versions down the page, changes labelled new, improved or fixed, filterable by type.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['templates-b/PageFrame.tsx', 'templates-b/SitePage.tsx', 'templates-b/SiteBand.tsx', 'templates-b/BrandMark.tsx'],
          Component: LandingTemplateReleaseNotes,
        },
        {
          id: 'LandingTemplateStatus',
          title: 'Status page',
          note: 'Pick it for a public service status: the overall state in words, each service with 30 days of history, then incidents.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'templates-b/PageFrame.tsx',
            'templates-b/SitePage.tsx',
            'templates-b/SiteBand.tsx',
            'industrial/StatusIndicator.tsx',
            'patterns/structure/SectionHeader.tsx',
          ],
          Component: LandingTemplateStatus,
        },
      ],
    },
  ],
});
