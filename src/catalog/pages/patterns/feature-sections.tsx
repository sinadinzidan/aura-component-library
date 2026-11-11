import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@cognite/aura/components/accordion';
import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import {
  IconArrowRight,
  IconBell,
  IconBinaryTree,
  IconCalendarStats,
  IconChartLine,
  IconCheck,
  IconEngine,
  IconFileText,
  IconLock,
  IconMinus,
  IconPlugConnected,
  IconSearch,
  IconTool,
  IconUserCog,
} from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { TrendChart } from '../../../library/industrial/charts/TrendChart';
import { KpiTile } from '../../../library/industrial/KpiTile';
import { LinearGauge } from '../../../library/industrial/LinearGauge';
import { Sparkline } from '../../../library/industrial/Sparkline';
import { severityStatus } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { CapabilityMatrix } from '../../../library/patterns/people/CapabilityMatrix';
import { FeatureCard } from '../../../library/patterns/product/FeatureCard';
import { StatsBand } from '../../../library/patterns/product/StatsBand';
import { SectionHeader } from '../../../library/patterns/structure/SectionHeader';
import { Table } from '../../../library/primitives/table/Table';
import { TableBody } from '../../../library/primitives/table/TableBody';
import { TableCaption } from '../../../library/primitives/table/TableCaption';
import { TableCell } from '../../../library/primitives/table/TableCell';
import { TableHead } from '../../../library/primitives/table/TableHead';
import { TableHeader } from '../../../library/primitives/table/TableHeader';
import { TableRow } from '../../../library/primitives/table/TableRow';
import { ALARMS, PEOPLE, PLANT_KPIS, SENSORS } from '../../data/plant';
import { formatAgo, makeSeries, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './feature-sections.tsx?raw';

const FEATURE_VIBRATION = SENSORS[3];
const FEATURE_VIBRATION_SERIES = makeSeries({ seed: FEATURE_VIBRATION.seed, points: 48, base: 5.9, amplitude: 0.3, noise: 0.15, drift: 0.9 });
const FEATURE_AVAILABILITY = makeValues({ seed: 41, points: 30, base: 96.8, amplitude: 0.6, noise: 0.25, drift: -0.4, max: 100 });
const FEATURE_ALARMS = ALARMS.filter((alarm) => alarm.state === 'active').slice(0, 3);
const FEATURE_OPERATOR = PEOPLE[4];

const FEATURE_CORE = [
  {
    id: 'context',
    icon: IconBinaryTree,
    title: 'Data in the context of the asset',
    description: 'Every tag, alarm, work order and drawing is linked to the equipment it belongs to, from site down to instrument.',
  },
  {
    id: 'limits',
    icon: IconChartLine,
    title: 'Trends with their limits',
    description: 'Operating and trip limits come from the alarm system and are drawn on every chart that shows the tag.',
  },
  {
    id: 'search',
    icon: IconSearch,
    title: 'One search across sources',
    description: 'Type a tag, a work order number or a phrase from a procedure and get results from all connected systems.',
  },
] as const;

const FEATURE_MORE = [
  { id: 'alarms', icon: IconBell, title: 'Alarm history', description: 'Every alarm with the value, the limit and who acknowledged it.' },
  { id: 'orders', icon: IconTool, title: 'Work orders', description: 'Open, planned and overdue work per asset, read from SAP PM.' },
  { id: 'docs', icon: IconFileText, title: 'Documents', description: 'P&IDs and procedures, opened at the page that mentions the tag.' },
  { id: 'access', icon: IconLock, title: 'Access per site', description: 'Data owners grant access by site and data set, not per screen.' },
] as const;

const FEATURE_CHECKS = [
  'Read-only connection to the historian; nothing is written back',
  'Tags keep their original names and units',
  'Limits are synchronised from the alarm system every hour',
  'Each value shows its source and signal quality',
  'Access follows your existing directory groups',
] as const;

const FEATURE_STEPS = [
  { id: 'connect', title: 'Connect a source', description: 'Install an extractor next to the historian and point it at the tags you want.' },
  { id: 'map', title: 'Map tags to assets', description: 'Matching by tag pattern suggests links; an engineer confirms the ones that are unsure.' },
  { id: 'publish', title: 'Publish a view', description: 'Pick KPIs and trends for an area and share the overview with the shift.' },
] as const;

const FEATURE_ROLES = [
  {
    id: 'operator',
    icon: IconEngine,
    role: 'Control room operator',
    title: 'See what changed and why',
    points: ['Active alarms with value and limit', 'The trend for the hour before a trip', 'Shift log linked to the asset'],
  },
  {
    id: 'engineer',
    icon: IconUserCog,
    role: 'Rotating equipment engineer',
    title: 'Compare equipment over time',
    points: ['Vibration and temperature side by side', 'Previous trips on the same machine', 'Export to a notebook for analysis'],
  },
  {
    id: 'planner',
    icon: IconCalendarStats,
    role: 'Maintenance planner',
    title: 'Plan from condition, not calendar',
    points: ['Health score per asset', 'Overdue and waiting work in one list', 'Remaining hours per discipline'],
  },
] as const;

const FEATURE_INTEGRATIONS = [
  { group: 'Historians and control', items: ['OPC UA', 'AVEVA PI', 'Honeywell PHD', 'Modbus TCP', 'MQTT'] },
  { group: 'Maintenance and ERP', items: ['SAP PM', 'IBM Maximo', 'IFS'] },
  { group: 'Documents and engineering', items: ['SharePoint', 'Documentum', 'AVEVA E3D', 'P&ID (PDF, DWG)'] },
  { group: 'Analytics', items: ['Python SDK', 'Power BI', 'Grafana', 'REST API'] },
] as const;

const FEATURE_COMPARISON = [
  { id: 'find', task: 'Find the trend for an alarmed tag', manual: 'Look up the tag in the historian client', here: 'Opens from the alarm row' },
  { id: 'limits', task: 'See the limit the value crossed', manual: 'Read it from the alarm configuration list', here: 'Drawn on the chart' },
  { id: 'orders', task: 'Check whether work is already planned', manual: 'Search SAP by functional location', here: 'Listed on the asset page' },
  { id: 'docs', task: 'Open the P&ID for the equipment', manual: 'Find the drawing number, then the archive', here: 'One click from the asset' },
  { id: 'share', task: 'Share the finding with the next shift', manual: 'Screenshot into the handover email', here: 'Link to the saved view' },
] as const;

const FEATURE_MATRIX_ROLES = [
  { id: 'operations', label: 'Operations' },
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'engineering', label: 'Engineering' },
] as const;

const FEATURE_MATRIX_GROUPS = [
  {
    label: 'Monitoring',
    capabilities: [
      { id: 'live', label: 'Live values and trends' },
      { id: 'alarms', label: 'Alarm list and history' },
      { id: 'wall', label: 'Wall display layouts' },
    ],
  },
  {
    label: 'Work management',
    capabilities: [
      { id: 'orders', label: 'Work order lists per asset' },
      { id: 'plan', label: 'Weekly plan and backlog' },
    ],
  },
  {
    label: 'Analysis',
    capabilities: [
      { id: 'compare', label: 'Compare equipment and periods' },
      { id: 'export', label: 'Export to notebooks and BI tools' },
    ],
  },
] as const;

const FEATURE_MATRIX_GRANTS = {
  operations: ['live', 'alarms', 'wall', 'orders'],
  maintenance: ['live', 'alarms', 'orders', 'plan'],
  engineering: ['live', 'alarms', 'orders', 'compare', 'export'],
} as const;

const FEATURE_FACTS = [
  { id: 'series', value: '1,284', label: 'Time series from Nordkapp', detail: 'Updated every 10 seconds' },
  { id: 'assets', value: '412', label: 'Assets in the hierarchy' },
  { id: 'docs', value: '3,950', label: 'Documents indexed', detail: 'P&IDs, procedures, datasheets' },
  { id: 'sources', value: '6', label: 'Source systems connected' },
] as const;

const FEATURE_FAQ = [
  {
    id: 'write',
    question: 'Does it write anything back to the control system?',
    answer: 'No. Extractors read from the historian over a one-way connection. Nothing is written to the control system or the historian.',
  },
  {
    id: 'delay',
    question: 'How old is the data I am looking at?',
    answer: 'Time series are updated every 10 seconds. Work orders are synchronised every 15 minutes and documents once a night. Each view shows when it was last updated.',
  },
  {
    id: 'access',
    question: 'Who decides what I can see?',
    answer: 'The data owner for each site grants access per data set, using your existing directory groups.',
  },
  {
    id: 'units',
    question: 'Are tags renamed or units converted?',
    answer: 'Tags keep their names from the source. Units are stored as delivered and converted only for display, with the original shown on hover.',
  },
] as const;

function FeatureVisualFrame({ children }: { children: ReactNode }) {
  return <div className="flex w-full min-w-0 flex-col gap-3 rounded-xl bg-card-background p-4">{children}</div>;
}

function FeatureAlarmVisual() {
  return (
    <FeatureVisualFrame>
      <span className="text-xs text-muted-foreground">Active alarms, gas compression</span>
      <ul className="flex flex-col gap-3">
        {FEATURE_ALARMS.map((alarm) => (
          <li key={alarm.id} className="flex flex-col gap-0.5">
            <StatusIndicator size="sm" {...severityStatus(alarm.severity)} detail={formatAgo(alarm.raisedAt)} />
            <span className="text-sm text-base-foreground">{alarm.message}</span>
            <span className="text-xs tabular-nums text-muted-foreground">
              <span className="font-mono">{alarm.sensorTag}</span> · {alarm.value}, limit {alarm.limit}
            </span>
          </li>
        ))}
      </ul>
    </FeatureVisualFrame>
  );
}

function FeatureTrendVisual() {
  return (
    <FeatureVisualFrame>
      <span className="text-xs text-muted-foreground">
        {FEATURE_VIBRATION.name} <span className="font-mono">{FEATURE_VIBRATION.tag}</span>
      </span>
      <TrendChart
        label="Drive-end vibration over 48 hours, rising towards its high limit of 7.1 mm/s"
        series={[{ key: 'vibration', label: FEATURE_VIBRATION.name, points: FEATURE_VIBRATION_SERIES }]}
        limits={[{ value: FEATURE_VIBRATION.highLimit, label: `High ${FEATURE_VIBRATION.highLimit}`, tone: 'warning' }]}
        unit={FEATURE_VIBRATION.unit}
        yDomain={[4, 8]}
        maxTicks={4}
        showLast
        heightClassName="h-40"
      />
    </FeatureVisualFrame>
  );
}

function FeatureCheckItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm text-base-foreground">
      <IconCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <span>{children}</span>
    </li>
  );
}

function FeatureSectionThreeUp() {
  return (
    <div className="grid w-full grid-cols-3 gap-8">
      {FEATURE_CORE.map((feature) => (
        <FeatureCard key={feature.id} icon={<feature.icon />} title={feature.title} description={feature.description} />
      ))}
    </div>
  );
}

function FeatureSectionGridWithLinks() {
  return (
    <div className="flex w-full flex-col gap-8">
      <SectionHeader size="lg" overline="Also included" title="What comes with every project" description="No add-ons to enable. These read from the same data model." />
      <div className="grid grid-cols-4 gap-6">
        {FEATURE_MORE.map((feature) => (
          <FeatureCard key={feature.id} icon={<feature.icon />} title={feature.title} description={feature.description}>
            <Button variant="ghost" size="sm" className="-ml-2">
              Learn more <IconArrowRight />
            </Button>
          </FeatureCard>
        ))}
      </div>
    </div>
  );
}

function FeatureSectionCheckList() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <SectionHeader title="How the connection works" description="What is true for every source, whichever system it is." />
      <ul className="flex flex-col gap-3">
        {FEATURE_CHECKS.map((line) => (
          <FeatureCheckItem key={line}>{line}</FeatureCheckItem>
        ))}
      </ul>
    </div>
  );
}

function FeatureSectionIconList() {
  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      {FEATURE_MORE.slice(0, 3).map((feature) => (
        <FeatureCard key={feature.id} layout="inline" icon={<feature.icon />} title={feature.title} description={feature.description} />
      ))}
    </div>
  );
}

function FeatureSectionAlternating() {
  return (
    <div className="flex w-full flex-col gap-12">
      <div className="grid grid-cols-2 items-center gap-10">
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-muted-foreground">Alarms</span>
          <h3 className="text-2xl font-semibold tracking-tight text-base-foreground">Each alarm arrives with its evidence</h3>
          <p className="text-base text-medium-foreground">
            The row shows the value against the limit, the tag and how long it has been active. The trend for the hour before is one click away.
          </p>
        </div>
        <FeatureAlarmVisual />
      </div>
      <div className="grid grid-cols-2 items-center gap-10">
        <FeatureTrendVisual />
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-muted-foreground">Trends</span>
          <h3 className="text-2xl font-semibold tracking-tight text-base-foreground">See the drift before the limit</h3>
          <p className="text-base text-medium-foreground">
            Drive-end vibration on the 1st stage compressor has risen 0.9 mm/s in 48 hours. The limit line shows how much margin is left.
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureSectionSteps() {
  return (
    <div className="flex w-full flex-col gap-8">
      <SectionHeader size="lg" overline="How it works" title="From historian to shared view in three steps" />
      <ol className="grid grid-cols-3 gap-8">
        {FEATURE_STEPS.map((step, index) => (
          <li key={step.id}>
            <FeatureCard marker={String(index + 1)} title={step.title} description={step.description} />
          </li>
        ))}
      </ol>
    </div>
  );
}

function FeatureSectionStepsVertical() {
  return (
    <ol className="flex w-full max-w-md flex-col">
      {FEATURE_STEPS.map((step, index) => (
        <li key={step.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted-background text-sm font-semibold tabular-nums text-base-foreground"
            >
              {index + 1}
            </span>
            {index < FEATURE_STEPS.length - 1 ? <span aria-hidden="true" className="w-px flex-1 bg-chart-gridlines" /> : null}
          </div>
          <div className="flex flex-col gap-1 pb-6">
            <h3 className="pt-1 text-base font-semibold text-base-foreground">{step.title}</h3>
            <p className="text-sm text-medium-foreground">{step.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function FeatureSectionLiveComponent() {
  const kpi = PLANT_KPIS.availability;

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <FeatureCard
        title="KPIs that explain themselves"
        description="A tile carries its change, its target and its trend, so nobody has to ask whether 96.4 % is good."
      />
      <KpiTile
        label="Availability"
        value={kpi.value}
        unit="%"
        decimals={1}
        status={{ tone: 'warning', label: 'Below target' }}
        delta={{ reference: kpi.previous, goodDirection: 'up', caption: 'vs yesterday' }}
        target={{ value: kpi.target }}
        trend={{ values: FEATURE_AVAILABILITY, label: 'Availability, last 30 days', limit: kpi.target }}
      >
        <LinearGauge label="Availability against target" value={kpi.value} min={90} max={100} target={kpi.target} unit="%" decimals={1} showHeader={false} showScale />
      </KpiTile>
    </div>
  );
}

function FeatureSectionBento() {
  return (
    <div className="grid w-full grid-cols-3 gap-4">
      <FeatureCard
        surface="card"
        className="col-span-2"
        title="Trends with their limits"
        description="The high limit is read from the alarm system. Hover the chart to read a value."
      >
        <TrendChart
          label="Drive-end vibration over 48 hours with its high limit"
          series={[{ key: 'vibration', label: FEATURE_VIBRATION.name, points: FEATURE_VIBRATION_SERIES, variant: 'area' }]}
          limits={[{ value: FEATURE_VIBRATION.highLimit, label: `High ${FEATURE_VIBRATION.highLimit}`, tone: 'warning' }]}
          unit={FEATURE_VIBRATION.unit}
          yDomain={[4, 8]}
          maxTicks={5}
          heightClassName="h-40"
        />
      </FeatureCard>
      <FeatureCard surface="card" icon={<IconBinaryTree />} title="Asset hierarchy" description="412 assets at Nordkapp, from the plant down to single instruments.">
        <ul className="flex flex-col gap-1 font-mono text-xs text-medium-foreground">
          <li>NK</li>
          <li className="pl-4">NK-23 Gas compression</li>
          <li className="pl-8">23-KA-9101</li>
          <li className="pl-12">23-VT-92540</li>
        </ul>
      </FeatureCard>
      <FeatureCard surface="card" icon={<IconSearch />} title="One search" description="Tags, work orders and documents in the same result list." />
      <FeatureCard surface="card" icon={<IconPlugConnected />} title="Six sources" description="Historian, alarm system, SAP PM and three document archives." />
      <FeatureCard surface="card" title="Availability" description="The plant KPI, with the last 30 days behind it.">
        <div className="flex items-end justify-between gap-4">
          <span className="text-2xl font-semibold tabular-nums text-base-foreground">
            {PLANT_KPIS.availability.value}
            <span className="ml-1 text-sm font-normal text-muted-foreground">%</span>
          </span>
          <Sparkline values={FEATURE_AVAILABILITY} label="Availability, last 30 days" unit="%" width={112} height={32} showLast />
        </div>
      </FeatureCard>
    </div>
  );
}

function FeatureSectionRoleCards() {
  return (
    <div className="grid w-full grid-cols-3 gap-4">
      {FEATURE_ROLES.map((role) => (
        <FeatureCard key={role.id} surface="card" icon={<role.icon />} title={role.title} description={`For the ${role.role.toLowerCase()}.`}>
          <ul className="flex flex-col gap-2">
            {role.points.map((point) => (
              <FeatureCheckItem key={point}>{point}</FeatureCheckItem>
            ))}
          </ul>
        </FeatureCard>
      ))}
    </div>
  );
}

function FeatureSectionIntegrations() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <SectionHeader title="Connects to what you run" description="Extractors maintained with the product. Others connect through the API." />
      <ul aria-label="Supported sources" className="flex flex-wrap gap-2">
        {FEATURE_INTEGRATIONS.flatMap((group) => group.items).map((item) => (
          <li key={item}>
            <Badge variant="secondary">{item}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FeatureSectionIntegrationsGrouped() {
  return (
    <dl className="flex w-full max-w-md flex-col gap-4">
      {FEATURE_INTEGRATIONS.map((group) => (
        <div key={group.group} className="flex flex-col gap-2">
          <dt className="text-xs font-medium text-muted-foreground">{group.group}</dt>
          <dd className="flex flex-wrap gap-2">
            {group.items.map((item) => (
              <Badge key={item} variant="secondary">
                {item}
              </Badge>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function FeatureSectionComparisonTable() {
  return (
    <Table density="comfortable" hover={false}>
      <TableCaption srOnly>Common tasks: across separate systems, and with the plant overview</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Task</TableHead>
          <TableHead>Across separate systems</TableHead>
          <TableHead>With the plant overview</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {FEATURE_COMPARISON.map((row) => (
          <TableRow key={row.id}>
            <TableCell rowHeader className="align-top">
              {row.task}
            </TableCell>
            <TableCell muted className="align-top">
              {row.manual}
            </TableCell>
            <TableCell className="align-top">
              <span className="text-base-foreground">{row.here}</span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function FeatureSectionBeforeAfter() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">Before</span>
        <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <IconMinus aria-hidden className="mt-0.5 size-4 shrink-0" /> Four systems to check one alarm
          </li>
          <li className="flex items-start gap-2">
            <IconMinus aria-hidden className="mt-0.5 size-4 shrink-0" /> Limits kept in a spreadsheet
          </li>
        </ul>
      </div>
      <div className="flex flex-col gap-2 border-t border-default pt-4">
        <span className="text-xs font-medium text-muted-foreground">Now</span>
        <ul className="flex flex-col gap-2">
          <FeatureCheckItem>One page per asset</FeatureCheckItem>
          <FeatureCheckItem>Limits drawn on the trend</FeatureCheckItem>
        </ul>
      </div>
    </div>
  );
}

function FeatureSectionCapabilityMatrix() {
  return (
    <div className="flex w-full flex-col gap-4">
      <SectionHeader title="What each workspace includes" description="All three read the same data. They differ in the tools on top." />
      <CapabilityMatrix caption="Capabilities by workspace" roles={FEATURE_MATRIX_ROLES} groups={FEATURE_MATRIX_GROUPS} grants={FEATURE_MATRIX_GRANTS} />
    </div>
  );
}

function FeatureSectionStatsBand() {
  return <StatsBand label="Nordkapp data model in numbers" stats={FEATURE_FACTS} />;
}

function FeatureSectionQuote() {
  return (
    <figure className="flex w-full max-w-md flex-col gap-4 border-l-2 border-emphasized pl-4">
      <blockquote className="text-lg text-pretty text-base-foreground">
        On a vibration alarm: open the trend, check the hour before against the limit, and note the reading in the shift log before you acknowledge.
      </blockquote>
      <figcaption className="flex items-center gap-3">
        <PersonAvatar name={FEATURE_OPERATOR.name} sizes="xsm" />
        <span className="flex flex-col">
          <span className="text-sm font-medium text-base-foreground">{FEATURE_OPERATOR.name}</span>
          <span className="text-xs text-muted-foreground">{FEATURE_OPERATOR.role}, standing instruction for Nordkapp</span>
        </span>
      </figcaption>
    </figure>
  );
}

function FeatureSectionResultQuote() {
  return (
    <figure className="flex w-full max-w-md flex-col gap-3 rounded-xl bg-muted-background p-6">
      <span className="text-xs font-medium text-muted-foreground">Result, January to March</span>
      <blockquote className="text-lg text-pretty text-base-foreground">
        Median time from a high alarm to an opened trend fell from 6 minutes to under 1, measured over 128 alarms in gas compression.
      </blockquote>
      <figcaption className="text-xs text-muted-foreground">Source: alarm and audit logs, Nordkapp control room</figcaption>
    </figure>
  );
}

function FeatureSectionFaq() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <SectionHeader title="Questions people ask first" />
      <Accordion collapsible defaultValue="write" className="w-full">
        {FEATURE_FAQ.map((item) => (
          <AccordionItem key={item.id} value={item.id}>
            <AccordionTrigger>{item.question}</AccordionTrigger>
            <AccordionContent>{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

function FeatureSectionCtaInline() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4 rounded-xl bg-card-background p-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-base-foreground">Still deciding?</h3>
        <p className="text-sm text-medium-foreground">Load the Nordkapp sample project and try every view with realistic data. Nothing to install.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button>Load sample project</Button>
        <Button variant="ghost">Read the setup guide</Button>
      </div>
    </div>
  );
}

function FeatureSectionCtaBand() {
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-6 rounded-xl bg-muted-background p-8">
      <div className="flex max-w-xl flex-col gap-2">
        <h3 className="font-marketing text-2xl font-semibold tracking-tight text-base-foreground">Connect your first source today</h3>
        <p className="text-base text-medium-foreground">Most historians are connected in under an hour. The connection is read-only.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="lg">Connect a source</Button>
        <Button size="lg" variant="ghost">
          Talk to the data owner
        </Button>
      </div>
    </div>
  );
}

function FeatureSectionFullBlock() {
  return (
    <div className="flex w-full flex-col gap-10">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
        <span className="text-sm font-medium text-muted-foreground">Plant overview</span>
        <h2 className="font-marketing text-4xl font-semibold tracking-tighter text-balance text-base-foreground">What the control room gets on day one</h2>
        <p className="text-base text-medium-foreground">Three things that work as soon as the historian is connected, with no dashboards to build first.</p>
      </div>
      <div className="grid grid-cols-3 gap-8">
        {FEATURE_CORE.map((feature) => (
          <FeatureCard key={feature.id} icon={<feature.icon />} title={feature.title} description={feature.description} />
        ))}
      </div>
      <StatsBand label="Nordkapp data model in numbers" stats={FEATURE_FACTS} surface="muted" align="center" />
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button size="lg">Open the plant overview</Button>
        <Button size="lg" variant="ghost">
          See what is connected <IconArrowRight />
        </Button>
      </div>
    </div>
  );
}

export default definePage({
  id: 'feature-sections',
  title: 'Feature sections',
  summary:
    'The blocks under a hero that say what a product does: feature grids, steps, comparisons, integrations and a closing action, written as facts and shown with live components.',
  guidance: {
    use: [
      'Three or four features per grid, each a short title and one concrete sentence.',
      'Neutral icon tiles; let the words differentiate the features.',
      'A live component wherever a feature can demonstrate itself.',
      'Comparisons against the manual process, stated as tasks and steps.',
    ],
    avoid: [
      'A different decorative colour for every feature icon.',
      'Invented testimonials, star ratings and customer logos.',
      'Comparison tables that name competitors or use ticks against crosses in status colours.',
      'More than one closing call to action on a page.',
    ],
  },
  source,
  sections: [
    {
      id: 'grids-and-lists',
      title: 'Grids and lists',
      description: 'The basic ways to set out a handful of features.',
      specimens: [
        {
          id: 'FeatureSectionThreeUp',
          title: 'Three-up grid with icons',
          note: 'The default: three features of equal weight directly under a hero.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/product/FeatureCard.tsx'],
          Component: FeatureSectionThreeUp,
        },
        {
          id: 'FeatureSectionGridWithLinks',
          title: 'Four-up grid with header and links',
          note: 'Secondary features that each have somewhere to go for detail.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/product/FeatureCard.tsx', 'patterns/structure/SectionHeader.tsx'],
          Component: FeatureSectionGridWithLinks,
        },
        {
          id: 'FeatureSectionCheckList',
          title: 'Feature list with check marks',
          note: 'Short statements that are all true at once, such as guarantees or inclusions.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/SectionHeader.tsx'],
          Component: FeatureSectionCheckList,
        },
        {
          id: 'FeatureSectionIconList',
          title: 'Feature list with icons',
          note: 'A narrow column or side panel where a grid would not fit.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/product/FeatureCard.tsx'],
          Component: FeatureSectionIconList,
        },
      ],
    },
    {
      id: 'rows-and-steps',
      title: 'Rows and steps',
      description: 'Features that need room to explain themselves, or that happen in an order.',
      specimens: [
        {
          id: 'FeatureSectionAlternating',
          title: 'Alternating text and visual rows',
          note: 'Two or three features that each deserve a live visual; sides alternate to keep the eye moving.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx', 'industrial/StatusIndicator.tsx'],
          Component: FeatureSectionAlternating,
        },
        {
          id: 'FeatureSectionSteps',
          title: 'Numbered steps',
          note: 'How it works, when the order matters and there are three or four steps.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/product/FeatureCard.tsx', 'patterns/structure/SectionHeader.tsx'],
          Component: FeatureSectionSteps,
        },
        {
          id: 'FeatureSectionStepsVertical',
          title: 'Numbered steps, vertical',
          note: 'The same steps in a narrow column, joined by a rule to show they are a sequence.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: FeatureSectionStepsVertical,
        },
        {
          id: 'FeatureSectionLiveComponent',
          title: 'Feature with embedded live component',
          note: 'When the feature is a component: show it working under one sentence of explanation.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/product/FeatureCard.tsx', 'industrial/KpiTile.tsx', 'industrial/LinearGauge.tsx'],
          Component: FeatureSectionLiveComponent,
        },
      ],
    },
    {
      id: 'mosaics-and-audiences',
      title: 'Mosaics, roles and integrations',
      description: 'Features on their own surfaces, grouped by who they are for or what they connect to.',
      specimens: [
        {
          id: 'FeatureSectionBento',
          title: 'Bento mosaic',
          note: 'Features of unequal weight: the main one gets two columns and a live chart.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/product/FeatureCard.tsx', 'industrial/charts/TrendChart.tsx', 'industrial/Sparkline.tsx'],
          Component: FeatureSectionBento,
        },
        {
          id: 'FeatureSectionRoleCards',
          title: 'Use cases by role',
          note: 'The same product explained three times, once per person who uses it.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/product/FeatureCard.tsx'],
          Component: FeatureSectionRoleCards,
        },
        {
          id: 'FeatureSectionIntegrations',
          title: 'Integrations as text chips',
          note: 'A flat list of what connects, named in text; no logos to license or keep current.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/SectionHeader.tsx'],
          Component: FeatureSectionIntegrations,
        },
        {
          id: 'FeatureSectionIntegrationsGrouped',
          title: 'Integrations by category',
          note: 'More than ten integrations: group them by the kind of system.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: FeatureSectionIntegrationsGrouped,
        },
      ],
    },
    {
      id: 'comparisons',
      title: 'Comparisons',
      description: 'Side-by-side statements. Rows are tasks, cells are what a person actually does.',
      specimens: [
        {
          id: 'FeatureSectionComparisonTable',
          title: 'Comparison with the manual process',
          note: 'Shows the difference task by task, in words, without scoring either column.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx'],
          Component: FeatureSectionComparisonTable,
        },
        {
          id: 'FeatureSectionBeforeAfter',
          title: 'Before and now',
          note: 'The short form of a comparison for a card or a side column.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          Component: FeatureSectionBeforeAfter,
        },
        {
          id: 'FeatureSectionCapabilityMatrix',
          title: 'Capability matrix',
          note: 'Which capability belongs to which workspace or edition; checks and dashes with spoken equivalents.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/people/CapabilityMatrix.tsx', 'patterns/structure/SectionHeader.tsx'],
          Component: FeatureSectionCapabilityMatrix,
        },
      ],
    },
    {
      id: 'proof-and-close',
      title: 'Proof and closing',
      description: 'Facts, quotes, answers and the one action a feature page ends on.',
      specimens: [
        {
          id: 'FeatureSectionStatsBand',
          title: 'Stats band',
          note: 'Four checkable numbers between two sections, each with its source or period.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/product/StatsBand.tsx'],
          Component: FeatureSectionStatsBand,
        },
        {
          id: 'FeatureSectionQuote',
          title: 'Quote block, instruction',
          note: 'A real instruction from a named role, in place of a testimonial.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/PersonAvatar.tsx'],
          Component: FeatureSectionQuote,
        },
        {
          id: 'FeatureSectionResultQuote',
          title: 'Quote block, measured result',
          note: 'A result with its period, sample and source stated, so it can be checked.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: FeatureSectionResultQuote,
        },
        {
          id: 'FeatureSectionFaq',
          title: 'FAQ accordion',
          note: 'The four or five questions that block a decision, with the first one open.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/SectionHeader.tsx'],
          Component: FeatureSectionFaq,
        },
        {
          id: 'FeatureSectionCtaInline',
          title: 'Call to action card',
          note: 'A low-commitment next step beside other content, such as an FAQ.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: FeatureSectionCtaInline,
        },
        {
          id: 'FeatureSectionCtaBand',
          title: 'Call to action band',
          note: 'The single closing action of a page, full width, with one quieter alternative.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          Component: FeatureSectionCtaBand,
        },
        {
          id: 'FeatureSectionFullBlock',
          title: 'Complete feature section',
          note: 'Centred intro, three features, a band of facts and the action, as one block.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/product/FeatureCard.tsx', 'patterns/product/StatsBand.tsx'],
          Component: FeatureSectionFullBlock,
        },
      ],
    },
  ],
});
