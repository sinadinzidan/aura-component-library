import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardFooterEnd,
  CardFooterStart,
  CardHeader,
  CardHeaderCenter,
  CardHeaderEnd,
  CardTitle,
} from '@cognite/aura/components/card';
import { DropdownMenuItem } from '@cognite/aura/components/dropdown-menu';
import { ItemGroup } from '@cognite/aura/components/item';
import { Tabs, TabsList, TabsPanel, TabsTrigger } from '@cognite/aura/components/tabs';
import {
  IconArrowRight,
  IconBuildingFactory2,
  IconChartLine,
  IconCheck,
  IconDatabase,
  IconEngine,
  IconLayoutDashboard,
  IconMapPin,
  IconPhoto,
  IconPlugConnected,
  IconPlus,
  IconSchema,
  IconTimeline,
  IconTool,
  IconUpload,
} from '@cognite/aura/icons';
import { useState } from 'react';

import { AvatarGroup } from '../../../library/display/AvatarGroup';
import { MetadataList } from '../../../library/display/MetadataList';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { StatusBadge } from '../../../library/display/StatusBadge';
import { RetryBlock } from '../../../library/feedback/RetryBlock';
import { SkeletonCard } from '../../../library/feedback/SkeletonCard';
import { Sparkline } from '../../../library/industrial/Sparkline';
import { formatReading, healthStatus, severityStatus } from '../../../library/industrial/status';
import { StatusDot } from '../../../library/industrial/StatusDot';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { TrendDelta } from '../../../library/industrial/TrendDelta';
import { EntityCard } from '../../../library/patterns/collections/EntityCard';
import { EntityRow } from '../../../library/patterns/collections/EntityRow';
import { useSelection } from '../../../library/patterns/collections/useSelection';
import { ALARMS, ASSETS, PEOPLE, PLANT_KPIS, SENSORS, SITES, WORK_ORDERS, findAsset, sensorsOf } from '../../data/plant';
import { formatAgo, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './card-layouts.tsx?raw';

const CARD_LAYOUT_COMPRESSOR = ASSETS[8];
const CARD_LAYOUT_COMPRESSORS = ASSETS.filter((asset) => asset.type === 'compressor');
const CARD_LAYOUT_PUMPS = ASSETS.filter((asset) => asset.type === 'pump');
const CARD_LAYOUT_EQUIPMENT = ASSETS.filter((asset) => asset.parentId === 'nk-23' || asset.parentId === 'nk-27').slice(0, 6);
const CARD_LAYOUT_PRESSURE = makeValues({ seed: 11, points: 40, base: 48, amplitude: 2.5, noise: 0.8 });
const CARD_LAYOUT_EXPORT = makeValues({ seed: 31, points: 30, base: 4.3, amplitude: 0.12, noise: 0.04, drift: 0.15, decimals: 2 });

const CARD_LAYOUT_DASHBOARDS = [
  { id: 'compression', name: 'Compression overview', detail: '12 charts · Gas compression', updated: '2 h ago', tone: 'bg-decorative-2-background text-decorative-2-foreground', Icon: IconChartLine },
  { id: 'energy', name: 'Energy and flaring', detail: '8 charts · Nordkapp', updated: '1 d ago', tone: 'bg-decorative-5-background text-decorative-5-foreground', Icon: IconLayoutDashboard },
  { id: 'pid', name: 'P&ID 23-KA-9101 rev C', detail: 'Drawing · 2.4 MB', updated: '8 d ago', tone: 'bg-decorative-6-background text-decorative-6-foreground', Icon: IconSchema },
  { id: 'borescope', name: 'Drive-end bearing, borescope', detail: 'Photo · 5.1 MB', updated: '14 min ago', tone: 'bg-decorative-3-background text-decorative-3-foreground', Icon: IconPhoto },
] as const;

const CARD_LAYOUT_SITE_STATS = [
  { siteId: 'nordkapp', assets: '12,406', alarms: 4, availability: 96.4 },
  { siteId: 'valhall-sor', assets: '8,912', alarms: 1, availability: 98.1 },
  { siteId: 'hammerfest', assets: '21,340', alarms: 0, availability: 99.2 },
  { siteId: 'stord', assets: '3,118', alarms: 2, availability: 97.6 },
] as const;

/** A token-coloured stand-in for a thumbnail. Swap for an image or a rendered preview. */
function CardLayoutThumb({ tone, Icon }: { tone: string; Icon: typeof IconPhoto }) {
  return (
    <div className={`flex aspect-video w-full items-center justify-center rounded-lg ${tone}`}>
      <Icon aria-hidden="true" className="size-8" />
    </div>
  );
}

function CardLayoutAsset() {
  const asset = CARD_LAYOUT_COMPRESSOR;

  return (
    <EntityCard
      title={asset.name}
      description={asset.tag}
      icon={<IconEngine />}
      menuLabel={`Actions for ${asset.name}`}
      menu={
        <>
          <DropdownMenuItem>Open in asset explorer</DropdownMenuItem>
          <DropdownMenuItem>Create work order</DropdownMenuItem>
        </>
      }
    >
      <MetadataList
        items={[
          { label: 'State', value: <StatusBadge status={asset.state} /> },
          { label: 'Health score', value: asset.healthScore },
          { label: 'Criticality', value: asset.criticality },
        ]}
      />
    </EntityCard>
  );
}

function CardLayoutDataSet() {
  return (
    <EntityCard
      title="Compressor telemetry"
      description="Data set · Nordkapp"
      icon={<IconDatabase />}
      footerNote="Updated 2 min ago"
      footerActions={
        <Button variant="outline" size="sm">
          Open
        </Button>
      }
    >
      <MetadataList
        items={[
          { label: 'Time series', value: '1,284' },
          { label: 'Events', value: '48,210' },
          { label: 'Owner', value: 'Aisha Khan' },
        ]}
      />
    </EntityCard>
  );
}

function CardLayoutPipeline() {
  return (
    <EntityCard
      title="SAP work orders"
      description="Extraction pipeline"
      icon={<IconPlugConnected />}
      footerNote="Next run 15:00"
      footerActions={
        <Button variant="outline" size="sm">
          Run now
        </Button>
      }
    >
      <MetadataList
        items={[
          { label: 'Last run', value: <Badge variant="success">Succeeded</Badge> },
          { label: 'Duration', value: '4 min 12 s' },
          { label: 'Schedule', value: 'Every hour' },
        ]}
      />
    </EntityCard>
  );
}

function CardLayoutDashboard() {
  const dashboard = CARD_LAYOUT_DASHBOARDS[0];

  return (
    <EntityCard
      title={dashboard.name}
      description={dashboard.detail}
      media={<CardLayoutThumb tone={dashboard.tone} Icon={dashboard.Icon} />}
      footerNote={`Edited ${dashboard.updated}`}
      footerActions={<AvatarGroup people={PEOPLE.slice(0, 3)} sizes="xsm" label="Editors" />}
    />
  );
}

function CardLayoutPerson() {
  const person = PEOPLE[2];

  return (
    <EntityCard
      title={person.name}
      description={person.role}
      leading={<PersonAvatar name={person.name} initials={person.initials} />}
      footerActions={
        <Button variant="outline" size="sm">
          View profile
        </Button>
      }
      footerNote="On shift until 19:00"
    >
      <MetadataList
        items={[
          { label: 'Site', value: 'Nordkapp' },
          { label: 'Open work orders', value: 3 },
        ]}
      />
    </EntityCard>
  );
}

function CardLayoutSite() {
  const site = SITES[0];
  const stats = CARD_LAYOUT_SITE_STATS[0];

  return (
    <EntityCard
      title={site.name}
      description={site.region}
      icon={<IconMapPin />}
      footerActions={
        <Button variant="outline" size="sm">
          Open site <IconArrowRight />
        </Button>
      }
      footerNote={`${stats.alarms} active alarms`}
    >
      <MetadataList
        items={[
          { label: 'Assets', value: stats.assets },
          { label: 'Availability', value: `${stats.availability} %` },
        ]}
      />
    </EntityCard>
  );
}

function CardLayoutMedia() {
  const file = CARD_LAYOUT_DASHBOARDS[3];

  return (
    <EntityCard
      title={file.name}
      description={file.detail}
      media={<CardLayoutThumb tone={file.tone} Icon={file.Icon} />}
      menuLabel={`Actions for ${file.name}`}
      menu={
        <>
          <DropdownMenuItem>Download</DropdownMenuItem>
          <DropdownMenuItem>Link to asset</DropdownMenuItem>
          <DropdownMenuItem variant="destructive">Delete file</DropdownMenuItem>
        </>
      }
    />
  );
}

function CardLayoutStat() {
  const kpi = PLANT_KPIS.gasExport;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardHeaderCenter>
          <CardDescription>Gas export, last 30 days</CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardContent>
        <div className="flex w-full items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-3xl font-semibold tabular-nums text-base-foreground">
              {kpi.value.toFixed(2)}
              <span className="ml-1 text-sm font-normal text-muted-foreground">{kpi.unit}</span>
            </span>
            <TrendDelta value={kpi.value} reference={kpi.previous} format="percent" goodDirection="up" caption="vs previous 30 days" />
          </div>
          <Sparkline values={CARD_LAYOUT_EXPORT} label="Gas export, last 30 days" unit={kpi.unit} decimals={2} width={96} height={40} variant="area" />
        </div>
      </CardContent>
    </Card>
  );
}

function CardLayoutAction() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Connect a data source</CardTitle>
          <CardDescription>Bring time series, events and files from your historian into Nordkapp.</CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardFooter>
        <CardFooterStart>
          <Button size="sm">
            <IconPlugConnected /> Connect source
          </Button>
          <Button variant="ghost" size="sm">
            Read the guide
          </Button>
        </CardFooterStart>
      </CardFooter>
    </Card>
  );
}

function CardLayoutHorizontal() {
  const dashboard = CARD_LAYOUT_DASHBOARDS[1];

  return (
    <EntityCard
      orientation="horizontal"
      title={dashboard.name}
      description={dashboard.detail}
      media={<CardLayoutThumb tone={dashboard.tone} Icon={dashboard.Icon} />}
      footerNote={`Edited ${dashboard.updated}`}
      footerActions={
        <Button variant="outline" size="sm">
          Open dashboard
        </Button>
      }
    >
      <p className="text-sm text-medium-foreground">Fuel gas, power draw and flared volume against this month's targets.</p>
    </EntityCard>
  );
}

function CardLayoutListInCard() {
  const alarms = ALARMS.filter((alarm) => alarm.state === 'active' || alarm.state === 'acknowledged').slice(0, 4);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Open alarms</CardTitle>
          <CardDescription>Gas compression and export</CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <Button variant="ghost" size="sm">
            View all
          </Button>
        </CardHeaderEnd>
      </CardHeader>
      <CardContent>
        <ItemGroup className="-mx-2 w-auto self-stretch" aria-label="Open alarms">
          {alarms.map((alarm) => {
            const severity = severityStatus(alarm.severity);
            return (
              <EntityRow
                key={alarm.id}
                leading={<StatusDot tone={severity.tone} shape={severity.shape} label={`${severity.label} severity`} />}
                title={alarm.message}
                description={findAsset(alarm.assetId)?.name}
                meta={<span className="tabular-nums">{formatAgo(alarm.raisedAt)}</span>}
              />
            );
          })}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}

function CardLayoutWithTabs() {
  const asset = CARD_LAYOUT_COMPRESSOR;
  const sensors = sensorsOf(asset.id).slice(0, 4);
  const orders = WORK_ORDERS.filter((order) => order.assetId === asset.id || order.assetId === '23-ka-9103');

  return (
    <Card className="w-full">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>{asset.name}</CardTitle>
          <CardDescription>{asset.tag}</CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <StatusBadge status={asset.state} />
        </CardHeaderEnd>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="readings" className="w-full">
          <TabsList size="small" showSeparator className="w-full">
            <TabsTrigger size="small" value="readings">
              Readings
            </TabsTrigger>
            <TabsTrigger size="small" value="orders">
              Work orders
            </TabsTrigger>
            <TabsTrigger size="small" value="details">
              Details
            </TabsTrigger>
          </TabsList>
          <TabsPanel value="readings" className="pt-4">
            <MetadataList
              items={sensors.map((sensor) => ({
                label: sensor.name,
                value: <span className="tabular-nums">{formatReading(sensor.value, sensor.unit, sensor.decimals)}</span>,
              }))}
            />
          </TabsPanel>
          <TabsPanel value="orders" className="pt-4">
            <MetadataList items={orders.map((order) => ({ label: order.id, value: <StatusBadge status={order.status} /> }))} />
          </TabsPanel>
          <TabsPanel value="details" className="pt-4">
            <MetadataList
              items={[
                { label: 'Area', value: 'Gas compression' },
                { label: 'Criticality', value: asset.criticality },
                { label: 'Health score', value: asset.healthScore },
              ]}
            />
          </TabsPanel>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function CardLayoutFooterActions() {
  const order = WORK_ORDERS[1];

  return (
    <EntityCard
      title={order.title}
      description={`${order.id} · ${findAsset(order.assetId)?.name ?? ''}`}
      icon={<IconTool />}
      status={<StatusBadge status={order.status} />}
      footerNote="Due 13 Mar"
      footerActions={
        <>
          <Button variant="ghost" size="sm">
            Reassign
          </Button>
          <Button size="sm">Start work</Button>
        </>
      }
    >
      <p className="text-sm text-medium-foreground">
        Signal lost on 40-TT-40015 since 05:00. Transmitter and spare cable gland are in stores, bin C-14.
      </p>
    </EntityCard>
  );
}

function CardLayoutStatusBadge() {
  const asset = ASSETS[10];
  const health = healthStatus(asset.health);

  return (
    <EntityCard title={asset.name} description={asset.tag} icon={<IconEngine />} status={<StatusBadge status={asset.state} />}>
      <MetadataList
        items={[
          { label: 'Health', value: <StatusIndicator {...health} size="sm" detail={String(asset.healthScore)} /> },
          { label: 'Tripped', value: '13:46, high vibration' },
        ]}
      />
    </EntityCard>
  );
}

function CardLayoutClickable() {
  const [opened, setOpened] = useState<string | null>(null);

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="grid w-full grid-cols-3 gap-4">
        {CARD_LAYOUT_PUMPS.map((asset) => (
          <button
            key={asset.id}
            type="button"
            onClick={() => setOpened(asset.name)}
            className="group rounded-xl text-left outline-none focus-visible:shadow-focus-ring"
          >
            <Card className="h-full">
              <CardHeader>
                <CardHeaderCenter>
                  <CardTitle as="h4">{asset.name}</CardTitle>
                  <CardDescription>{asset.tag}</CardDescription>
                </CardHeaderCenter>
                <CardHeaderEnd>
                  <IconArrowRight aria-hidden="true" className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </CardHeaderEnd>
              </CardHeader>
              <CardContent>
                <StatusBadge status={asset.state} />
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {opened ? `Opened ${opened}` : 'The whole card is one target.'}
      </p>
    </div>
  );
}

function CardLayoutSelectable() {
  const selection = useSelection(
    CARD_LAYOUT_COMPRESSORS.map((asset) => asset.id),
    [CARD_LAYOUT_COMPRESSORS[0].id]
  );

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="grid w-full grid-cols-3 gap-4">
        {CARD_LAYOUT_COMPRESSORS.map((asset) => (
          <EntityCard
            key={asset.id}
            title={asset.name}
            description={asset.tag}
            selection={{
              checked: selection.isSelected(asset.id),
              onChange: (checked) => selection.toggle(asset.id, checked),
              label: `Select ${asset.name}`,
            }}
          >
            <StatusBadge status={asset.state} />
          </EntityCard>
        ))}
      </div>
      <p className="text-xs tabular-nums text-muted-foreground" aria-live="polite">
        {selection.count} of {CARD_LAYOUT_COMPRESSORS.length} compressors selected for comparison
      </p>
    </div>
  );
}

function CardLayoutComparison() {
  const [a, b] = CARD_LAYOUT_COMPRESSORS;
  const rows = [
    { label: 'Health score', values: [a.healthScore, b.healthScore], unit: '', better: 'higher' },
    { label: 'Discharge temperature', values: [141.2, 128.6], unit: '°C', better: 'lower' },
    { label: 'Drive-end vibration', values: [6.8, 3.1], unit: 'mm/s', better: 'lower' },
    { label: 'Run hours since overhaul', values: [11840, 4260], unit: 'h', better: 'lower' },
  ] as const;

  return (
    <div className="grid w-full grid-cols-2 gap-4">
      {[a, b].map((asset, index) => (
        <Card key={asset.id}>
          <CardHeader>
            <CardHeaderCenter>
              <CardTitle as="h4">{asset.name}</CardTitle>
              <CardDescription>{asset.tag}</CardDescription>
            </CardHeaderCenter>
            <CardHeaderEnd>
              <StatusBadge status={asset.state} />
            </CardHeaderEnd>
          </CardHeader>
          <CardContent>
            <dl className="flex w-full flex-col gap-2 text-sm">
              {rows.map((row) => {
                const value = row.values[index];
                const other = row.values[1 - index];
                const wins = row.better === 'higher' ? value > other : value < other;
                return (
                  <div key={row.label} className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd className="flex items-center gap-1.5 font-medium tabular-nums text-base-foreground">
                      {wins ? <IconCheck aria-label="Better of the two" className="size-3.5 text-muted-foreground" /> : null}
                      {formatReading(value, row.unit, Number.isInteger(value) ? 0 : 1)}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CardLayoutGridThree() {
  return (
    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
      {CARD_LAYOUT_EQUIPMENT.map((asset) => (
        <EntityCard
          key={asset.id}
          title={asset.name}
          description={asset.tag}
          icon={<IconEngine />}
          status={<StatusBadge status={asset.state} />}
          footerNote={`Criticality ${asset.criticality}`}
          footerActions={
            <Button variant="outline" size="sm">
              View asset
            </Button>
          }
        >
          <MetadataList
            items={[
              { label: 'Health score', value: asset.healthScore },
              { label: 'Sensors', value: sensorsOf(asset.id).length || undefined },
            ]}
          />
        </EntityCard>
      ))}
    </div>
  );
}

function CardLayoutGridFour() {
  return (
    <div className="grid w-full grid-cols-2 gap-4 lg:grid-cols-4">
      {SITES.map((site, index) => {
        const stats = CARD_LAYOUT_SITE_STATS[index];
        return (
          <EntityCard key={site.id} title={site.name} description={site.region} icon={<IconBuildingFactory2 />}>
            <MetadataList
              items={[
                { label: 'Assets', value: stats.assets },
                { label: 'Availability', value: `${stats.availability} %` },
                { label: 'Active alarms', value: stats.alarms },
              ]}
            />
          </EntityCard>
        );
      })}
    </div>
  );
}

function CardLayoutMediaGrid() {
  return (
    <div className="grid w-full grid-cols-2 gap-4 lg:grid-cols-4">
      {CARD_LAYOUT_DASHBOARDS.map((item) => (
        <EntityCard
          key={item.id}
          title={item.name}
          description={item.detail}
          media={<CardLayoutThumb tone={item.tone} Icon={item.Icon} />}
          footerNote={`Edited ${item.updated}`}
        />
      ))}
    </div>
  );
}

function CardLayoutCreateNew() {
  return (
    <button
      type="button"
      className="flex min-h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-emphasized p-4 text-center outline-none transition-colors hover:bg-base-background-hover focus-visible:shadow-focus-ring"
    >
      <IconPlus aria-hidden="true" className="size-5 text-muted-foreground" />
      <span className="text-sm font-medium text-base-foreground">Create dashboard</span>
      <span className="text-xs text-muted-foreground">Start from a blank canvas or a template</span>
    </button>
  );
}

function CardLayoutLoading() {
  return <SkeletonCard media lines={2} label="Loading dashboard card" />;
}

function CardLayoutEmpty() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Attached files</CardTitle>
          <CardDescription>{CARD_LAYOUT_COMPRESSOR.name}</CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardContent>
        <div className="flex w-full flex-col items-center gap-3 py-4 text-center">
          <p className="text-sm text-muted-foreground">No drawings, procedures or photos are linked to this asset yet.</p>
          <Button variant="secondary" size="sm">
            <IconUpload /> Upload file
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CardLayoutError() {
  const [attempts, setAttempts] = useState(0);

  return (
    <div className="w-full rounded-xl border border-default p-4">
      <RetryBlock
        title="Couldn't load readings"
        description="The time series service did not answer. Your other cards are not affected."
        onRetry={() => {
          setAttempts(attempts + 1);
          return Promise.reject(new Error('Still unavailable'));
        }}
      />
    </div>
  );
}

function CardLayoutTrend() {
  const sensor = SENSORS[0];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>{sensor.name}</CardTitle>
          <CardDescription>Last 40 hours</CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <span className="text-lg font-semibold tabular-nums text-base-foreground">
            {formatReading(sensor.value, sensor.unit, sensor.decimals)}
          </span>
        </CardHeaderEnd>
      </CardHeader>
      <CardContent>
        <Sparkline
          values={CARD_LAYOUT_PRESSURE}
          label={`${sensor.name}, last 40 hours`}
          unit={sensor.unit}
          height={72}
          variant="area"
          limit={sensor.highLimit}
          showLast
        />
      </CardContent>
      <CardFooter>
        <CardFooterStart>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <IconTimeline aria-hidden="true" className="size-3.5" /> High limit {sensor.highLimit} {sensor.unit}
          </span>
        </CardFooterStart>
        <CardFooterEnd>
          <Button variant="outline" size="sm">
            Open chart
          </Button>
        </CardFooterEnd>
      </CardFooter>
    </Card>
  );
}

export default definePage({
  id: 'card-layouts',
  title: 'Card layouts',
  summary:
    'Cards for the entities and summaries a page is assembled from: assets, data sets, pipelines, dashboards, people and sites. Every card shares one anatomy, so a grid of them reads as a set.',
  guidance: {
    use: [
      'Use a card when an item has enough of its own content to stand apart: a preview, a few facts, an action.',
      'Keep one anatomy per grid: icon and name on top, facts in the middle, one action at the bottom.',
      'Show state with a badge in the header.',
      'Give a grid equal-height cards and a gap of 16px.',
    ],
    avoid: [
      'Cards for rows of comparable attributes; use a table.',
      'Coloured borders or stripes to signal status.',
      'More than one primary action, or unrelated actions, in one card.',
      'Cards nested inside cards.',
    ],
  },
  source,
  sections: [
    {
      id: 'entities',
      title: 'Entity cards',
      description: 'One card per kind of thing, all on the same anatomy.',
      specimens: [
        {
          id: 'CardLayoutAsset',
          title: 'Asset',
          note: 'Name and tag in the header, the three facts an engineer checks first in the body.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/collections/EntityCard.tsx', 'display/MetadataList.tsx', 'display/StatusBadge.tsx'],
          Component: CardLayoutAsset,
        },
        {
          id: 'CardLayoutDataSet',
          title: 'Data set',
          note: 'Counts of what it holds and who owns it, with freshness in the footer.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/collections/EntityCard.tsx', 'display/MetadataList.tsx'],
          Component: CardLayoutDataSet,
        },
        {
          id: 'CardLayoutPipeline',
          title: 'Pipeline',
          note: 'Last outcome, duration and schedule, with the next run and a manual trigger.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/collections/EntityCard.tsx', 'display/MetadataList.tsx'],
          Component: CardLayoutPipeline,
        },
        {
          id: 'CardLayoutDashboard',
          title: 'Dashboard',
          note: 'Lead with a preview when people recognise the item by how it looks.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/collections/EntityCard.tsx', 'display/AvatarGroup.tsx'],
          Component: CardLayoutDashboard,
        },
        {
          id: 'CardLayoutPerson',
          title: 'Person',
          note: 'Avatar, name and role, with where they are and what they carry.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/collections/EntityCard.tsx', 'display/PersonAvatar.tsx', 'display/MetadataList.tsx'],
          Component: CardLayoutPerson,
        },
        {
          id: 'CardLayoutSite',
          title: 'Site',
          note: 'An entry point to a plant: two headline figures and one way in.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/collections/EntityCard.tsx', 'display/MetadataList.tsx'],
          Component: CardLayoutSite,
        },
      ],
    },
    {
      id: 'content',
      title: 'Content arrangements',
      description: 'What goes inside: media, a figure, an action, a list, tabs.',
      specimens: [
        {
          id: 'CardLayoutMedia',
          title: 'Media thumbnail',
          note: 'For files and photos; the placeholder stands in until the preview loads.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/collections/EntityCard.tsx'],
          Component: CardLayoutMedia,
        },
        {
          id: 'CardLayoutStat',
          title: 'Stat card',
          note: 'One figure with its change and recent shape, for the top row of a dashboard.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/TrendDelta.tsx', 'industrial/Sparkline.tsx'],
          Component: CardLayoutStat,
        },
        {
          id: 'CardLayoutAction',
          title: 'Action card',
          note: 'A next step the page wants the user to take, with one primary button.',
          origin: 'custom',
          align: 'stretch',
          Component: CardLayoutAction,
        },
        {
          id: 'CardLayoutHorizontal',
          title: 'Horizontal',
          note: 'Preview beside the text when cards sit one per row or two across.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/EntityCard.tsx'],
          Component: CardLayoutHorizontal,
        },
        {
          id: 'CardLayoutFooterActions',
          title: 'Footer actions',
          note: 'A due date at the start of the footer and at most two actions at the end.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/EntityCard.tsx', 'display/StatusBadge.tsx'],
          Component: CardLayoutFooterActions,
        },
        {
          id: 'CardLayoutListInCard',
          title: 'List in a card',
          note: 'A short list with a header and a link to the full view; rows are not boxed.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/EntityRow.tsx', 'industrial/StatusDot.tsx'],
          Component: CardLayoutListInCard,
        },
        {
          id: 'CardLayoutWithTabs',
          title: 'With tabs',
          note: 'Small tabs inside a card when one record has two or three facets of equal weight.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/MetadataList.tsx', 'display/StatusBadge.tsx'],
          Component: CardLayoutWithTabs,
        },
        {
          id: 'CardLayoutTrend',
          title: 'Trend card',
          note: 'The latest reading in the header and its recent trend against the limit below.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/Sparkline.tsx'],
          Component: CardLayoutTrend,
        },
        {
          id: 'CardLayoutComparison',
          title: 'Comparison cards',
          note: 'Two records side by side with the same rows, so differences line up.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['display/StatusBadge.tsx'],
          Component: CardLayoutComparison,
        },
      ],
    },
    {
      id: 'interaction',
      title: 'Status and interaction',
      description: 'Cards that carry a state, open something or can be picked.',
      specimens: [
        {
          id: 'CardLayoutStatusBadge',
          title: 'Status as a badge',
          note: 'State goes in a header badge with a word and an icon, never a coloured edge.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/collections/EntityCard.tsx', 'display/StatusBadge.tsx', 'industrial/StatusIndicator.tsx'],
          Component: CardLayoutStatusBadge,
        },
        {
          id: 'CardLayoutSelectable',
          title: 'Selectable',
          note: 'A checkbox in the header and an outline while checked, for picking cards to compare or act on.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['patterns/collections/EntityCard.tsx', 'patterns/collections/useSelection.ts', 'display/StatusBadge.tsx'],
          Component: CardLayoutSelectable,
        },
        {
          id: 'CardLayoutClickable',
          title: 'Clickable',
          note: 'The whole card is one link when opening it is the only thing to do.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['display/StatusBadge.tsx'],
          Component: CardLayoutClickable,
        },
        {
          id: 'CardLayoutCreateNew',
          title: 'Create new',
          note: 'A dashed placeholder as the last cell of a grid, for adding the next item.',
          origin: 'custom',
          align: 'stretch',
          Component: CardLayoutCreateNew,
        },
      ],
    },
    {
      id: 'grids',
      title: 'Card grids',
      description: 'Equal-height cards on a 16px gap.',
      specimens: [
        {
          id: 'CardLayoutGridThree',
          title: 'Three across',
          note: 'The default grid for entity cards with a body and a footer action.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/collections/EntityCard.tsx', 'display/MetadataList.tsx', 'display/StatusBadge.tsx'],
          Component: CardLayoutGridThree,
        },
        {
          id: 'CardLayoutGridFour',
          title: 'Four across',
          note: 'Compact cards without a footer, for a short set such as sites or areas.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/collections/EntityCard.tsx', 'display/MetadataList.tsx'],
          Component: CardLayoutGridFour,
        },
        {
          id: 'CardLayoutMediaGrid',
          title: 'Media grid',
          note: 'Thumbnail cards for a gallery of dashboards, drawings and photos.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/collections/EntityCard.tsx'],
          Component: CardLayoutMediaGrid,
        },
      ],
    },
    {
      id: 'states',
      title: 'Loading, empty and error',
      description: 'A card keeps its place and its header when its content is late or missing.',
      specimens: [
        {
          id: 'CardLayoutLoading',
          title: 'Loading',
          note: 'A skeleton in the shape of the card while its content loads.',
          origin: 'custom',
          align: 'stretch',
          uses: ['feedback/SkeletonCard.tsx'],
          Component: CardLayoutLoading,
        },
        {
          id: 'CardLayoutEmpty',
          title: 'Empty card',
          note: 'Keep the title, say what is missing and offer the action that fills it.',
          origin: 'custom',
          align: 'stretch',
          Component: CardLayoutEmpty,
        },
        {
          id: 'CardLayoutError',
          title: 'Failed card',
          note: 'When one card fails, it says so and retries on its own; the rest of the page stays usable.',
          origin: 'custom',
          align: 'stretch',
          uses: ['feedback/RetryBlock.tsx'],
          Component: CardLayoutError,
        },
      ],
    },
  ],
});
