import { Badge } from '@cognite/aura/components/badge';
import { Banner, BannerAction, BannerActions, BannerIcon, BannerTitle } from '@cognite/aura/components/banner';
import { Button } from '@cognite/aura/components/button';
import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
import { Search } from '@cognite/aura/components/search';
import {
  IconArrowRight,
  IconBinaryTree,
  IconChartLine,
  IconCheck,
  IconDatabase,
  IconFileText,
  IconInfoCircleFilled,
  IconLayoutDashboard,
  IconPlugConnected,
  IconPlus,
  IconTool,
} from '@cognite/aura/icons';
import { useState } from 'react';

import { TrendChart } from '../../../library/industrial/charts/TrendChart';
import { KpiTile } from '../../../library/industrial/KpiTile';
import { Sparkline } from '../../../library/industrial/Sparkline';
import { severityStatus } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { BrowserFrame } from '../../../library/patterns/product/BrowserFrame';
import { Hero } from '../../../library/patterns/product/Hero';
import { StatsBand } from '../../../library/patterns/product/StatsBand';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { ALARMS, PLANT_KPIS, SENSORS, SITES, WORK_ORDERS } from '../../data/plant';
import { formatAgo, makeSeries, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './hero-sections.tsx?raw';

const HERO_PRESSURE = SENSORS[0];
const HERO_PRESSURE_SERIES = makeSeries({ seed: HERO_PRESSURE.seed, points: 48, base: 47.6, amplitude: 1.6, noise: 0.5, drift: 1.2, cycles: 2 });
const HERO_AVAILABILITY = makeValues({ seed: 41, points: 30, base: 96.8, amplitude: 0.6, noise: 0.25, drift: -0.4, max: 100 });
const HERO_EXPORT = makeValues({ seed: 31, points: 30, base: 4.3, amplitude: 0.12, noise: 0.04, drift: 0.15, decimals: 2 });
const HERO_ACTIVE_ALARMS = ALARMS.filter((alarm) => alarm.state === 'active').slice(0, 3);

const HERO_FACTS = [
  { id: 'series', value: '1,284', label: 'Time series from Nordkapp', detail: 'Updated every 10 seconds' },
  { id: 'assets', value: '412', label: 'Assets in the hierarchy', detail: 'From site down to instrument' },
  { id: 'sources', value: '6', label: 'Source systems connected', detail: 'Historian, maintenance, documents' },
  { id: 'sites', value: String(SITES.length), label: 'Sites on one data model' },
] as const;

const HERO_CHECKLIST = [
  'Tags, alarms and work orders linked to the asset they belong to',
  'Trends with operating limits drawn in, not looked up',
  'One search across historian, maintenance system and documents',
] as const;

const HERO_QUICK_LINKS = [
  { id: 'trip', label: 'Recompressor trip, 13:46', icon: IconChartLine },
  { id: 'orders', label: 'Overdue work orders', icon: IconTool },
  { id: 'pid', label: 'P&ID NK-23-0041', icon: IconFileText },
  { id: 'tree', label: 'Gas compression assets', icon: IconBinaryTree },
] as const;

const HERO_FLOW = [
  { id: 'sources', title: 'Sources', items: ['OPC UA historian', 'SAP PM', 'Document archive'], icon: IconPlugConnected },
  { id: 'model', title: 'Data model', items: ['Assets', 'Time series', 'Events and files'], icon: IconDatabase },
  { id: 'apps', title: 'Applications', items: ['Operations overview', 'Maintenance planning', 'Assistant'], icon: IconLayoutDashboard },
] as const;

function HeroChecklist() {
  return (
    <ul className="flex flex-col gap-2">
      {HERO_CHECKLIST.map((line) => (
        <li key={line} className="flex items-start gap-2 text-sm text-medium-foreground">
          <IconCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-base-foreground" />
          {line}
        </li>
      ))}
    </ul>
  );
}

function HeroKpiVisual() {
  const { availability, gasExport } = PLANT_KPIS;

  return (
    <div className="grid w-full grid-cols-2 gap-4">
      <KpiTile
        label="Availability"
        value={availability.value}
        unit="%"
        decimals={1}
        delta={{ reference: availability.previous, goodDirection: 'up', caption: 'vs yesterday' }}
        trend={{ values: HERO_AVAILABILITY, label: 'Availability, last 30 days' }}
      />
      <KpiTile
        label="Gas export"
        value={gasExport.value}
        unit={gasExport.unit}
        decimals={2}
        delta={{ reference: gasExport.previous, goodDirection: 'up', caption: 'vs yesterday', decimals: 2 }}
        trend={{ values: HERO_EXPORT, label: 'Gas export, last 30 days' }}
      />
      <div className="col-span-2 flex flex-col gap-2 rounded-xl bg-card-background p-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {HERO_PRESSURE.name} <span className="font-mono">{HERO_PRESSURE.tag}</span>
          </span>
          <span className="text-sm font-semibold tabular-nums text-base-foreground">
            {HERO_PRESSURE.value} <span className="font-normal text-muted-foreground">{HERO_PRESSURE.unit}</span>
          </span>
        </div>
        <Sparkline
          values={HERO_PRESSURE_SERIES.map((point) => point.v)}
          label="Discharge pressure, last 48 hours"
          unit={HERO_PRESSURE.unit}
          height={48}
          variant="area"
          limit={HERO_PRESSURE.highLimit}
          showLast
        />
      </div>
    </div>
  );
}

function HeroTrendVisual() {
  return (
    <div className="flex w-full flex-col gap-3 rounded-xl bg-card-background p-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-base-foreground">{HERO_PRESSURE.name}</span>
        <span className="font-mono text-xs text-muted-foreground">{HERO_PRESSURE.tag}</span>
      </div>
      <TrendChart
        label="Discharge pressure on the 1st stage compressor over 48 hours, below its high limit of 52 barg"
        series={[{ key: 'pressure', label: HERO_PRESSURE.name, points: HERO_PRESSURE_SERIES, variant: 'area' }]}
        limits={[{ value: HERO_PRESSURE.highLimit, label: `High ${HERO_PRESSURE.highLimit}`, tone: 'warning' }]}
        unit={HERO_PRESSURE.unit}
        yDomain={[40, 56]}
        maxTicks={4}
        showLast
        heightClassName="h-48"
      />
    </div>
  );
}

function HeroFlowDiagram() {
  return (
    <div role="img" aria-label="Sources feed one data model, which feeds the applications" className="flex w-full items-stretch gap-2">
      {HERO_FLOW.map((column, index) => (
        <div key={column.id} className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-3 self-stretch rounded-xl bg-card-background p-4">
            <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <column.icon aria-hidden className="size-4 shrink-0" />
              {column.title}
            </span>
            <ul className="flex flex-col gap-2">
              {column.items.map((item) => (
                <li key={item} className="rounded-md bg-muted-background px-2 py-1.5 text-xs text-base-foreground">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          {index < HERO_FLOW.length - 1 ? <IconArrowRight aria-hidden className="size-4 shrink-0 text-muted-foreground" /> : null}
        </div>
      ))}
    </div>
  );
}

function HeroMiniDashboard() {
  const { availability, activeAlarms, openWorkOrders } = PLANT_KPIS;

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-3 gap-4">
        <KpiTile
          size="compact"
          label="Availability"
          value={availability.value}
          unit="%"
          decimals={1}
          delta={{ reference: availability.previous, goodDirection: 'up' }}
        />
        <KpiTile size="compact" label="Active alarms" value={activeAlarms.value} delta={{ reference: activeAlarms.previous, goodDirection: 'down', decimals: 0 }} />
        <KpiTile
          size="compact"
          label="Open work orders"
          value={openWorkOrders.value}
          delta={{ reference: openWorkOrders.previous, goodDirection: 'down', decimals: 0 }}
        />
      </div>
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 flex min-w-0 flex-col gap-2 rounded-xl bg-card-background p-4">
          <span className="text-xs text-muted-foreground">
            {HERO_PRESSURE.name} <span className="font-mono">{HERO_PRESSURE.tag}</span>
          </span>
          <TrendChart
            label="Discharge pressure over 48 hours, below its high limit"
            series={[{ key: 'pressure', label: HERO_PRESSURE.name, points: HERO_PRESSURE_SERIES }]}
            limits={[{ value: HERO_PRESSURE.highLimit, label: `High ${HERO_PRESSURE.highLimit}`, tone: 'warning' }]}
            unit={HERO_PRESSURE.unit}
            yDomain={[40, 56]}
            maxTicks={4}
            heightClassName="h-36"
          />
        </div>
        <div className="col-span-2 flex min-w-0 flex-col gap-3 rounded-xl bg-card-background p-4">
          <span className="text-xs text-muted-foreground">Active alarms</span>
          <ul className="flex flex-col gap-3">
            {HERO_ACTIVE_ALARMS.map((alarm) => (
              <li key={alarm.id} className="flex flex-col gap-0.5">
                <StatusIndicator size="sm" {...severityStatus(alarm.severity)} detail={formatAgo(alarm.raisedAt)} />
                <span className="text-sm text-base-foreground">{alarm.message}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function HeroSectionCentred() {
  return (
    <Hero
      align="center"
      title="Every tag, alarm and work order in the context of its asset"
      description="Nordkapp's historian, maintenance system and documents on one data model, so a trend opens with its limits, its alarms and the work already planned."
      actions={<Button size="lg">Open the plant overview</Button>}
    />
  );
}

function HeroSectionMinimal() {
  return <Hero size="display" title="Industrial data, in context" description="One model of the plant for the people who run it." />;
}

function HeroSectionLeftAligned() {
  return (
    <Hero
      title="Find the cause before the next trip"
      description="Compare the hour before each recompressor trip this year: vibration, discharge temperature and the alarm that fired first."
      actions={
        <Button>
          Compare trips <IconArrowRight />
        </Button>
      }
    />
  );
}

function HeroSectionEyebrow() {
  return (
    <Hero
      align="center"
      eyebrow="Maintenance planning"
      title="Plan work around the condition of the equipment"
      description="Health scores, open alarms and remaining work for every asset in gas compression, in the order they need attention."
      actions={<Button size="lg">View the plan for this week</Button>}
    />
  );
}

function HeroSectionBadge() {
  return (
    <Hero
      align="center"
      eyebrow={
        <span className="flex items-center gap-2">
          <Badge variant="secondary">New in March</Badge>
          Limits on every trend
        </span>
      }
      title="Operating limits now follow the tag"
      description="High, high-high and low limits are read from the alarm system and drawn on every chart that shows the tag."
      actions={<Button size="lg">See a trend with limits</Button>}
    />
  );
}

function HeroSectionTwoActions() {
  return (
    <Hero
      align="center"
      title="From a raw tag to a shared view in an afternoon"
      description="Connect a historian, map tags to assets, and publish an overview the whole shift can open."
      actions={
        <>
          <Button size="lg">Connect a source</Button>
          <Button size="lg" variant="ghost">
            Read the setup guide <IconArrowRight />
          </Button>
        </>
      }
    />
  );
}

function HeroSectionLiveVisual() {
  return (
    <Hero
      eyebrow="Operations overview"
      title="The numbers the morning meeting asks for"
      description="Availability, export and the trends behind them, read from live data. These tiles are the real components, not a picture of them."
      actions={
        <>
          <Button>Open overview</Button>
          <Button variant="ghost">Choose KPIs</Button>
        </>
      }
      visual={<HeroKpiVisual />}
    />
  );
}

function HeroSectionTrendVisual() {
  return (
    <Hero
      title="A trend that already knows its limits"
      description="Discharge pressure on the 1st stage compressor over the last 48 hours, with the high limit from the alarm system drawn in."
      actions={
        <Button>
          Open in charts <IconArrowRight />
        </Button>
      }
      visual={<HeroTrendVisual />}
    />
  );
}

function HeroSectionChecklist() {
  return (
    <Hero
      eyebrow="For control room and maintenance"
      title="One place to look when something changes"
      description="What an operator needs within a minute of an alarm, without opening four systems."
      actions={<Button>Open the plant overview</Button>}
      footer={<HeroChecklist />}
      visual={<HeroKpiVisual />}
    />
  );
}

function HeroSectionDiagram() {
  return (
    <Hero
      eyebrow="How it fits together"
      title="Six systems in, one model out"
      description="Source systems keep their role. The data model links what they hold, and every application reads from it."
      actions={
        <Button variant="secondary">
          Browse the data model <IconArrowRight />
        </Button>
      }
      visual={<HeroFlowDiagram />}
    />
  );
}

function HeroSectionProductPreview() {
  return (
    <Hero
      align="center"
      title="The plant overview, as the shift sees it"
      description="Live figures for Nordkapp. Hover the chart to read a value."
      actions={<Button size="lg">Open the plant overview</Button>}
      visual={
        <BrowserFrame address="fusion.cognite.test/nordkapp/overview" label="Preview of the Nordkapp plant overview">
          <HeroMiniDashboard />
        </BrowserFrame>
      }
    />
  );
}

function HeroSectionStatsRow() {
  return (
    <Hero
      title="Nordkapp, connected end to end"
      description="What is in the data model today. Each number links to the list behind it."
      actions={<Button>Browse the data model</Button>}
      footer={<StatsBand label="Nordkapp data model in numbers" stats={HERO_FACTS.slice(0, 3)} />}
      visual={<HeroFlowDiagram />}
    />
  );
}

function HeroSectionTrustLine() {
  return (
    <Hero
      align="center"
      title="Built for plants that cannot stop to look for data"
      description="The same model serves the control room, the maintenance office and the engineers on call."
      actions={<Button size="lg">Open the plant overview</Button>}
      footer={
        <p className="text-center text-sm text-muted-foreground">
          4 sites · 1,284 time series · 10-second updates · Data stays in your own project
        </p>
      }
    />
  );
}

function HeroSectionSearch() {
  const [query, setQuery] = useState('');

  return (
    <Hero
      align="center"
      title="What are you looking for?"
      description="Search assets, tags, work orders and documents across all four sites."
      footer={
        <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-3">
          <Search
            aria-label="Search the plant"
            placeholder="Try 23-KA-9101 or bearing inspection"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onClear={() => setQuery('')}
          />
          <div className="flex flex-wrap justify-center gap-2">
            {HERO_QUICK_LINKS.slice(0, 3).map((link) => (
              <Button key={link.id} variant="outline" size="sm" onClick={() => setQuery(link.label)}>
                <link.icon /> {link.label}
              </Button>
            ))}
          </div>
        </div>
      }
    />
  );
}

function HeroSectionAnnouncement() {
  return (
    <div className="flex w-full flex-col gap-10">
      <Banner variant="info" inset>
        <BannerIcon icon={IconInfoCircleFilled} />
        <BannerTitle>
          <span className="text-base-foreground">Hammerfest LNG was connected on 9 March. Its tags are now searchable.</span>
        </BannerTitle>
        <BannerActions>
          <BannerAction>View site</BannerAction>
        </BannerActions>
      </Banner>
      <Hero
        align="center"
        title="Four sites on one data model"
        description="Compare the same equipment class across sites, with the same tags, units and limits."
        actions={<Button size="lg">Compare compressors</Button>}
      />
    </div>
  );
}

function HeroSectionRequestAccess() {
  return (
    <Hero
      title="Ask for access to the Nordkapp project"
      description="Access is granted per site by the data owner. Requests are usually answered within one working day."
      footer={
        <form className="flex w-full max-w-md flex-col" onSubmit={(event) => event.preventDefault()}>
          <Label htmlFor="hero-request-email">Work email</Label>
          <div className="flex gap-2">
            <Input id="hero-request-email" type="email" placeholder="name@company.test" className="flex-1" />
            <Button type="submit">Request access</Button>
          </div>
          <p className="pt-2 text-xs text-muted-foreground">Used only to tell you when access is granted.</p>
        </form>
      }
      visual={<HeroFlowDiagram />}
    />
  );
}

function HeroSectionCompactOpener() {
  return (
    <Hero
      as="h1"
      size="compact"
      eyebrow="Nordkapp · Thursday 12 March, day shift"
      title="Good afternoon, Ingrid"
      description="One compressor is tripped and two alarms are waiting for acknowledgement."
      actions={
        <>
          <Button size="sm">Review active alarms</Button>
          <Button size="sm" variant="secondary">
            Open shift log
          </Button>
        </>
      }
    />
  );
}

function HeroSectionCompactKpis() {
  const { availability, activeAlarms, openWorkOrders } = PLANT_KPIS;

  return (
    <Hero
      size="compact"
      eyebrow="Operations"
      title="Plant overview"
      description="Live status for Nordkapp. Figures refresh every 10 seconds."
      actions={
        <Button size="sm" variant="secondary">
          <IconPlus /> Add widget
        </Button>
      }
      visual={
        <div className="grid w-full grid-cols-3 gap-4">
          <KpiTile size="compact" label="Availability" value={availability.value} unit="%" decimals={1} />
          <KpiTile size="compact" label="Active alarms" value={activeAlarms.value} />
          <KpiTile size="compact" label="Open work orders" value={openWorkOrders.value} />
        </div>
      }
    />
  );
}

function HeroSectionCompactRecent() {
  return (
    <Hero
      size="compact"
      title="Pick up where you left off"
      description="The views and work orders you opened most recently."
      actions={
        <Button size="sm" variant="secondary">
          View all recent
        </Button>
      }
      visual={
        <ul className="grid w-full grid-cols-2 gap-3">
          {WORK_ORDERS.slice(0, 4).map((order) => (
            <li key={order.id}>
              <button
                type="button"
                className="flex w-full flex-col gap-1 rounded-xl bg-card-background p-3 text-left outline-none hover:bg-muted-background focus-visible:shadow-focus-ring"
              >
                <span className="font-mono text-xs text-muted-foreground">{order.id}</span>
                <span className="text-sm text-base-foreground">{order.title}</span>
              </button>
            </li>
          ))}
        </ul>
      }
    />
  );
}

function HeroSectionCompactFirstRun() {
  return (
    <Hero
      size="compact"
      eyebrow="Getting started"
      title="This project has no data yet"
      description="Connect a source to bring in tags and assets. You can add more sources later."
      actions={
        <>
          <Button size="sm">
            <IconPlugConnected /> Connect a source
          </Button>
          <Button size="sm" variant="ghost">
            Load the Nordkapp sample
          </Button>
        </>
      }
      footer={<p className="text-xs text-muted-foreground">Most historians are connected in under an hour.</p>}
    />
  );
}

function HeroSectionDarkChrome() {
  return (
    <ThemeScope preset="aura-dark" className="w-full py-6">
      <Hero
        align="center"
        size="display"
        eyebrow="Control room"
        title="Built to be read from across the room"
        description="A dark, high-contrast view of the plant for wall displays and night shifts."
        actions={
          <>
            <Button size="lg">Open wall display</Button>
            <Button size="lg" variant="ghost">
              Choose a layout
            </Button>
          </>
        }
      />
    </ThemeScope>
  );
}

function HeroSectionDarkVisual() {
  return (
    <ThemeScope preset="aura-dark" className="w-full py-4">
      <Hero
        eyebrow="Night shift"
        title="The same numbers, easier on the eyes at 03:00"
        description="Every component follows the theme, so the dark view is the full product and not a reduced one."
        actions={<Button>Switch to dark theme</Button>}
        visual={<HeroKpiVisual />}
      />
    </ThemeScope>
  );
}

function HeroSectionFullLanding() {
  return (
    <div className="flex w-full flex-col gap-12">
      <Hero
        as="h1"
        align="center"
        size="display"
        eyebrow={
          <span className="flex items-center gap-2">
            <Badge variant="secondary">Nordkapp</Badge>
            Gas processing plant
          </span>
        }
        title="Run the plant from one picture of it"
        description="Operations, maintenance and engineering work from the same assets, tags and limits. Open the overview, or ask the assistant about anything on it."
        actions={
          <>
            <Button size="lg">Open the plant overview</Button>
            <Button size="lg" variant="ghost">
              See what is connected <IconArrowRight />
            </Button>
          </>
        }
        visual={
          <BrowserFrame address="fusion.cognite.test/nordkapp/overview" label="Preview of the Nordkapp plant overview">
            <HeroMiniDashboard />
          </BrowserFrame>
        }
      />
      <StatsBand label="Nordkapp data model in numbers" stats={HERO_FACTS} surface="muted" align="center" />
    </div>
  );
}

export default definePage({
  id: 'hero-sections',
  title: 'Hero sections',
  summary:
    'The opening block of a landing page or an in-app home: one headline, one sentence, one action, and where it helps a live piece of the product instead of a picture.',
  guidance: {
    use: [
      'One headline that states a fact about the product, and one primary action.',
      'A live component as the visual: a real tile or chart says more than a screenshot.',
      'The display typeface for the headline only; everything else stays in the UI typeface.',
      'The compact size for pages inside the app, where the hero is an opener and not a pitch.',
    ],
    avoid: [
      'Superlatives, exclamation marks and claims nobody could check.',
      'More than two actions, or two actions of equal weight.',
      'Decorative colour, gradients or stock imagery behind the headline.',
      'A marketing-size hero on a page people open every day.',
    ],
  },
  source,
  sections: [
    {
      id: 'headline-and-action',
      title: 'Headline and action',
      description: 'Text-only heroes. Pick by alignment and by how much sits around the headline.',
      specimens: [
        {
          id: 'HeroSectionCentred',
          title: 'Centred, one action',
          note: 'The default opener for a landing page with a single thing to do next.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/product/Hero.tsx'],
          Component: HeroSectionCentred,
        },
        {
          id: 'HeroSectionMinimal',
          title: 'Minimal, text only',
          note: 'A section opener or a page whose actions live in the navigation.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/product/Hero.tsx'],
          Component: HeroSectionMinimal,
        },
        {
          id: 'HeroSectionLeftAligned',
          title: 'Left-aligned',
          note: 'When the page below is left-aligned too, such as documentation or a report.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/product/Hero.tsx'],
          Component: HeroSectionLeftAligned,
        },
        {
          id: 'HeroSectionEyebrow',
          title: 'With eyebrow',
          note: 'Names the product area above the headline so the headline can stay short.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/product/Hero.tsx'],
          Component: HeroSectionEyebrow,
        },
        {
          id: 'HeroSectionBadge',
          title: 'With badge',
          note: 'Announces something new; the badge dates the claim so it can be retired.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/product/Hero.tsx'],
          Component: HeroSectionBadge,
        },
        {
          id: 'HeroSectionTwoActions',
          title: 'Two actions',
          note: 'A primary action and a quieter way to learn more; the second is always ghost.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/product/Hero.tsx'],
          Component: HeroSectionTwoActions,
        },
      ],
    },
    {
      id: 'with-visual',
      title: 'With a live visual',
      description: 'Text on the left, a working component on the right. The visual is real data, not an image.',
      specimens: [
        {
          id: 'HeroSectionLiveVisual',
          title: 'KPI tiles as the visual',
          note: 'When the product is about figures: show the figures.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/product/Hero.tsx', 'industrial/KpiTile.tsx', 'industrial/Sparkline.tsx'],
          Component: HeroSectionLiveVisual,
        },
        {
          id: 'HeroSectionTrendVisual',
          title: 'Chart as the visual',
          note: 'When one chart makes the point of the headline better than a sentence.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/product/Hero.tsx', 'industrial/charts/TrendChart.tsx'],
          Component: HeroSectionTrendVisual,
        },
        {
          id: 'HeroSectionChecklist',
          title: 'Split with checklist',
          note: 'Three concrete things the reader gets, each one checkable in the product.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/product/Hero.tsx', 'industrial/KpiTile.tsx', 'industrial/Sparkline.tsx'],
          Component: HeroSectionChecklist,
        },
        {
          id: 'HeroSectionDiagram',
          title: 'Diagram as the visual',
          note: 'Explains how parts relate when there is no single screen to show.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/product/Hero.tsx'],
          Component: HeroSectionDiagram,
        },
        {
          id: 'HeroSectionProductPreview',
          title: 'Product preview frame',
          note: 'A live mini dashboard inside a browser-like frame, in place of a screenshot.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/product/Hero.tsx', 'patterns/product/BrowserFrame.tsx', 'industrial/KpiTile.tsx', 'industrial/charts/TrendChart.tsx'],
          Component: HeroSectionProductPreview,
        },
      ],
    },
    {
      id: 'supporting-content',
      title: 'Supporting content',
      description: 'What can sit under or above the headline: facts, a search, an announcement, a form.',
      specimens: [
        {
          id: 'HeroSectionStatsRow',
          title: 'With supporting stats',
          note: 'Backs the headline with three numbers the reader can verify.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/product/Hero.tsx', 'patterns/product/StatsBand.tsx'],
          Component: HeroSectionStatsRow,
        },
        {
          id: 'HeroSectionTrustLine',
          title: 'With a line of facts',
          note: 'Plain text facts where a row of customer logos would otherwise go.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/product/Hero.tsx'],
          Component: HeroSectionTrustLine,
        },
        {
          id: 'HeroSectionSearch',
          title: 'With search',
          note: 'A home page whose main action is finding something. Starter queries fill the field.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/product/Hero.tsx'],
          Component: HeroSectionSearch,
        },
        {
          id: 'HeroSectionAnnouncement',
          title: 'With announcement banner',
          note: 'Time-limited news above the hero, so the headline itself does not have to change.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/product/Hero.tsx'],
          Component: HeroSectionAnnouncement,
        },
        {
          id: 'HeroSectionRequestAccess',
          title: 'With a one-field form',
          note: 'When the next step needs one piece of information before anything can happen.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/product/Hero.tsx'],
          Component: HeroSectionRequestAccess,
        },
      ],
    },
    {
      id: 'in-app-openers',
      title: 'In-app page openers',
      description: 'The compact size, in the UI typeface, for a home or landing page inside the product.',
      specimens: [
        {
          id: 'HeroSectionCompactOpener',
          title: 'Compact greeting',
          note: 'A personal home page: who, where, when, and the one thing that needs attention.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/product/Hero.tsx'],
          Component: HeroSectionCompactOpener,
        },
        {
          id: 'HeroSectionCompactKpis',
          title: 'Compact with figures',
          note: 'A section landing page that opens with its three headline numbers.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/product/Hero.tsx', 'industrial/KpiTile.tsx'],
          Component: HeroSectionCompactKpis,
        },
        {
          id: 'HeroSectionCompactRecent',
          title: 'Compact with recent items',
          note: 'A returning user who most likely wants the thing they had open last.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/product/Hero.tsx'],
          Component: HeroSectionCompactRecent,
        },
        {
          id: 'HeroSectionCompactFirstRun',
          title: 'Compact first run',
          note: 'An empty project: says what is missing and offers the first step and a sample.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/product/Hero.tsx'],
          Component: HeroSectionCompactFirstRun,
        },
      ],
    },
    {
      id: 'dark-and-full',
      title: 'Dark chrome and full blocks',
      description: 'Heroes on a fixed-dark surface, and a complete landing opener assembled from the parts above.',
      specimens: [
        {
          id: 'HeroSectionDarkChrome',
          title: 'On dark chrome',
          note: 'A dark hero that stays dark in both themes, for control-room and wall-display products.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'chrome',
          uses: ['patterns/product/Hero.tsx', 'themes/ThemeScope.tsx'],
          Component: HeroSectionDarkChrome,
        },
        {
          id: 'HeroSectionDarkVisual',
          title: 'On dark chrome, with live visual',
          note: 'Shows that the live components follow the dark scope along with the text.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'chrome',
          uses: ['patterns/product/Hero.tsx', 'themes/ThemeScope.tsx', 'industrial/KpiTile.tsx'],
          Component: HeroSectionDarkVisual,
        },
        {
          id: 'HeroSectionFullLanding',
          title: 'Full landing opener',
          note: 'Badge, display headline, two actions, product preview and a band of facts in one block.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/product/Hero.tsx', 'patterns/product/BrowserFrame.tsx', 'patterns/product/StatsBand.tsx', 'industrial/KpiTile.tsx'],
          Component: HeroSectionFullLanding,
        },
      ],
    },
  ],
});
