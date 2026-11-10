import { Avatar, AvatarIcon } from '@cognite/aura/components/avatar';
import { Button } from '@cognite/aura/components/button';
import {
  Card,
  CardActions,
  CardContent,
  CardDescription,
  CardHeader,
  CardHeaderCenter,
  CardHeaderEnd,
  CardHeaderStart,
  CardTitle,
} from '@cognite/aura/components/card';
import { DropdownMenuItem } from '@cognite/aura/components/dropdown-menu';
import { Input } from '@cognite/aura/components/input';
import {
  Item,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemSectionHeader,
  ItemSectionHeaderTitle,
  ItemTitle,
} from '@cognite/aura/components/item';
import { Search } from '@cognite/aura/components/search';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import { Tabs, TabsLabel, TabsList, TabsPanel, TabsTrigger } from '@cognite/aura/components/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import {
  IconArrowRight,
  IconBell,
  IconChartLine,
  IconDatabase,
  IconExternalLink,
  IconLayoutDashboard,
  IconPlus,
  IconRefresh,
  IconRoute,
  IconTool,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { MetadataList } from '../../../library/display/MetadataList';
import { StatusBadge } from '../../../library/display/StatusBadge';
import { FormField } from '../../../library/forms/FormField';
import { KpiTile } from '../../../library/industrial/KpiTile';
import { severityStatus } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { InfoTooltip } from '../../../library/overlays/InfoTooltip';
import { CollapsibleSection } from '../../../library/patterns/structure/CollapsibleSection';
import { SectionHeader } from '../../../library/patterns/structure/SectionHeader';
import { ALARMS, ASSETS, PLANT_KPIS, SENSORS, WORK_ORDERS } from '../../data/plant';
import type { WorkOrder } from '../../data/plant';
import { DAY, REFERENCE_NOW, formatAgo, formatDate } from '../../data/series';
import { definePage } from '../../types';

import source from './section-headers.tsx?raw';

const COMPRESSOR = ASSETS.find((asset) => asset.id === '23-ka-9101') ?? ASSETS[0];
const READINGS = SENSORS.filter((sensor) => sensor.assetId === COMPRESSOR.id);
const OPEN_ORDERS = WORK_ORDERS.filter((order) => order.status !== 'done');
const DONE_ORDERS = WORK_ORDERS.filter((order) => order.status === 'done');
const TODAY_ALARMS = ALARMS.filter((alarm) => alarm.raisedAt > REFERENCE_NOW - DAY);
const EARLIER_ALARMS = ALARMS.filter((alarm) => alarm.raisedAt <= REFERENCE_NOW - DAY);

/** Link styling for a section action that navigates. */
const LINK =
  'inline-flex items-center gap-1 rounded-sm text-sm font-medium text-link-foreground outline-none hover:text-link-foreground-hover hover:underline focus-visible:shadow-focus-ring [&>svg]:size-4';

/** Keeps the demo on the page: these are real links in a product. */
const stay = (event: { preventDefault: () => void }) => event.preventDefault();

/** A few work order rows, so a header is seen with the content it introduces. */
function SectionHeaderOrders({ orders }: { orders: readonly WorkOrder[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {orders.map((order) => (
        <li key={order.id} className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-sm text-base-foreground">{order.title}</p>
            <p className="text-xs text-muted-foreground">
              {order.id} · Due {formatDate(order.dueAt)}
            </p>
          </div>
          <StatusBadge status={order.status} outline />
        </li>
      ))}
    </ul>
  );
}

/** Sensor readings as label and value rows. */
function SectionHeaderReadings({ count }: { count: number }) {
  return (
    <MetadataList
      items={READINGS.slice(0, count).map((sensor) => ({
        label: sensor.name,
        value: <ValueReadout value={sensor.value} unit={sensor.unit} decimals={sensor.decimals} size="xs" />,
      }))}
    />
  );
}

/** Header and content with the standard gap between them. */
function SectionHeaderBlock({ children }: { children: ReactNode }) {
  return <section className="flex w-full flex-col gap-4">{children}</section>;
}

function SectionHeaderTitleOnly() {
  return (
    <SectionHeaderBlock>
      <SectionHeader title="Readings" />
      <SectionHeaderReadings count={3} />
    </SectionHeaderBlock>
  );
}

function SectionHeaderWithDescription() {
  return (
    <SectionHeaderBlock>
      <SectionHeader title="Readings" description="Latest values from the sensors on this asset." />
      <SectionHeaderReadings count={3} />
    </SectionHeaderBlock>
  );
}

function SectionHeaderOverline() {
  return (
    <SectionHeaderBlock>
      <SectionHeader overline="Condition monitoring" title="Readings" />
      <SectionHeaderReadings count={3} />
    </SectionHeaderBlock>
  );
}

function SectionHeaderWithCount() {
  return (
    <SectionHeaderBlock>
      <SectionHeader title="Open work orders" count={OPEN_ORDERS.length} />
      <SectionHeaderOrders orders={OPEN_ORDERS.slice(0, 2)} />
    </SectionHeaderBlock>
  );
}

function SectionHeaderWithInfo() {
  return (
    <SectionHeaderBlock>
      <SectionHeader
        title="Health score"
        info={
          <InfoTooltip label="About health score">
            0 to 100, from vibration, temperature and open corrective work. Below 50 the asset needs attention.
          </InfoTooltip>
        }
      />
      <div className="flex items-baseline gap-2">
        <ValueReadout value={COMPRESSOR.healthScore} size="lg" />
        <span className="text-sm text-muted-foreground">of 100 · Watch</span>
      </div>
    </SectionHeaderBlock>
  );
}

function SectionHeaderWithHelpLink() {
  return (
    <SectionHeaderBlock>
      <SectionHeader
        title="Alarm limits"
        description={
          <>
            Limits come from the safety system and are read-only here.{' '}
            <a href="https://docs.cognite.com" target="_blank" rel="noreferrer" className={LINK}>
              Learn about limits <IconExternalLink aria-hidden="true" />
            </a>
          </>
        }
      />
      <MetadataList
        items={[
          { label: 'High', value: '145.0 °C' },
          { label: 'High high', value: '155.0 °C' },
        ]}
      />
    </SectionHeaderBlock>
  );
}

function SectionHeaderWithLink() {
  return (
    <SectionHeaderBlock>
      <SectionHeader
        title="Open work orders"
        count={OPEN_ORDERS.length}
        actions={
          <a href="/maintenance/work-orders" onClick={stay} className={LINK}>
            View all <IconArrowRight aria-hidden="true" />
          </a>
        }
      />
      <SectionHeaderOrders orders={OPEN_ORDERS.slice(0, 3)} />
    </SectionHeaderBlock>
  );
}

function SectionHeaderWithButton() {
  return (
    <SectionHeaderBlock>
      <SectionHeader
        title="Documents"
        description="Drawings, data sheets and procedures linked to this asset."
        actions={
          <Button size="sm" variant="secondary">
            <IconPlus /> Link document
          </Button>
        }
      />
      <MetadataList
        items={[
          { label: 'P&ID, compression train 1', value: 'Rev. F' },
          { label: 'Compressor data sheet', value: 'Rev. C' },
          { label: 'Start-up procedure', value: 'Rev. 12' },
        ]}
      />
    </SectionHeaderBlock>
  );
}

function SectionHeaderWithTabs() {
  return (
    <Tabs defaultValue="open" className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-2">
        <SectionHeader title="Work orders" />
        <TabsList showSeparator className="w-full">
          <TabsTrigger value="open" badge={String(OPEN_ORDERS.length)}>
            <TabsLabel>Open</TabsLabel>
          </TabsTrigger>
          <TabsTrigger value="done" badge={String(DONE_ORDERS.length)}>
            <TabsLabel>Done</TabsLabel>
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsPanel value="open">
        <SectionHeaderOrders orders={OPEN_ORDERS.slice(0, 2)} />
      </TabsPanel>
      <TabsPanel value="done">
        <SectionHeaderOrders orders={DONE_ORDERS} />
      </TabsPanel>
    </Tabs>
  );
}

function SectionHeaderWithSegmented() {
  const [range, setRange] = useState('24h');
  const points = range === '24h' ? 2 : range === '7d' ? 3 : 4;

  return (
    <SectionHeaderBlock>
      <SectionHeader
        title="Readings"
        description="Latest value per sensor in the period."
        actions={
          <SegmentedControl
            value={range}
            onValueChange={(next) => {
              if (typeof next === 'string') setRange(next);
            }}
          >
            <SegmentedControlList size="small" aria-label="Period">
              <SegmentedControlButton value="24h" tabContent="label-only">
                24 h
              </SegmentedControlButton>
              <SegmentedControlButton value="7d" tabContent="label-only">
                7 d
              </SegmentedControlButton>
              <SegmentedControlButton value="30d" tabContent="label-only">
                30 d
              </SegmentedControlButton>
            </SegmentedControlList>
          </SegmentedControl>
        }
      />
      <SectionHeaderReadings count={points} />
    </SectionHeaderBlock>
  );
}

function SectionHeaderCollapsible() {
  return (
    <div className="flex w-full flex-col gap-2">
      <CollapsibleSection title="Readings" count={READINGS.length}>
        <div className="px-3 pb-2">
          <SectionHeaderReadings count={3} />
        </div>
      </CollapsibleSection>
      <CollapsibleSection
        title="Documents"
        count={3}
        defaultOpen={false}
        actions={
          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Link document">
                  <IconPlus />
                </Button>
              }
            />
            <TooltipContent>Link document</TooltipContent>
          </Tooltip>
        }
      >
        <p className="px-3 pb-2">P&amp;ID, data sheet and start-up procedure.</p>
      </CollapsibleSection>
    </div>
  );
}

function SectionHeaderWithSearch() {
  const [query, setQuery] = useState('');
  const matches = WORK_ORDERS.filter((order) => order.title.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <SectionHeaderBlock>
      <SectionHeader
        title="Work orders"
        count={matches.length}
        actions={
          <Search
            aria-label="Search work orders"
            placeholder="Search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onClear={() => setQuery('')}
            className="w-48"
          />
        }
      />
      {matches.length > 0 ? (
        <SectionHeaderOrders orders={matches.slice(0, 2)} />
      ) : (
        <p className="text-sm text-muted-foreground">No work orders match the search.</p>
      )}
    </SectionHeaderBlock>
  );
}

function SectionHeaderSizes() {
  return (
    <div className="flex w-full flex-col gap-6">
      <SectionHeader size="lg" title="Maintenance" description="A major region of a page." />
      <SectionHeader size="md" title="Open work orders" description="A section of a page." />
      <SectionHeader size="sm" as="h3" title="Assigned to you" description="A group inside a card or panel." />
    </div>
  );
}

function SectionHeaderNested() {
  return (
    <div className="flex w-full flex-col gap-6">
      <SectionHeader title="Condition" description="How the compressor is doing right now." />
      <section className="flex flex-col gap-3">
        <SectionHeader size="sm" as="h3" title="Process" />
        <SectionHeaderReadings count={2} />
      </section>
      <section className="flex flex-col gap-3">
        <SectionHeader size="sm" as="h3" title="Mechanical" />
        <MetadataList
          items={READINGS.slice(3, 5).map((sensor) => ({
            label: sensor.name,
            value: <ValueReadout value={sensor.value} unit={sensor.unit} decimals={sensor.decimals} size="xs" />,
          }))}
        />
      </section>
    </div>
  );
}

function SectionHeaderDivider() {
  return (
    <div className="flex w-full flex-col gap-8">
      <SectionHeaderBlock>
        <SectionHeader size="sm" as="h3" title="Spacing only" />
        <SectionHeaderReadings count={2} />
      </SectionHeaderBlock>
      <SectionHeaderBlock>
        <SectionHeader size="sm" as="h3" title="With a rule" divider />
        <SectionHeaderReadings count={2} />
      </SectionHeaderBlock>
    </div>
  );
}

function SectionHeaderCard() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Readings</CardTitle>
          <CardDescription>{COMPRESSOR.tag}</CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardContent>
        <SectionHeaderReadings count={3} />
      </CardContent>
    </Card>
  );
}

function SectionHeaderCardWithAction() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Extraction pipelines</CardTitle>
          <CardDescription>Checked {formatAgo(REFERENCE_NOW - 2 * 60_000)}</CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Refresh pipelines">
                  <IconRefresh />
                </Button>
              }
            />
            <TooltipContent>Refresh pipelines</TooltipContent>
          </Tooltip>
          <CardActions aria-label="Pipeline card actions">
            <DropdownMenuItem>View run history</DropdownMenuItem>
            <DropdownMenuItem>Manage pipelines</DropdownMenuItem>
          </CardActions>
        </CardHeaderEnd>
      </CardHeader>
      <CardContent>
        <MetadataList
          items={[
            { label: 'SAP work order sync', value: 'Healthy' },
            { label: 'Historian backfill', value: 'Healthy' },
            { label: 'Document index', value: 'Delayed' },
          ]}
        />
      </CardContent>
    </Card>
  );
}

function SectionHeaderCardWithIcon() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardHeaderStart>
          <Avatar variant="overflow" aria-hidden="true">
            <AvatarIcon>
              <IconDatabase />
            </AvatarIcon>
          </Avatar>
        </CardHeaderStart>
        <CardHeaderCenter>
          <CardTitle>Process historian</CardTitle>
          <CardDescription>Data set</CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardContent>
        <MetadataList
          items={[
            { label: 'Time series', value: '4,812' },
            { label: 'Updated', value: formatAgo(REFERENCE_NOW - 60_000) },
            { label: 'Owner', value: 'Aisha Khan' },
          ]}
        />
      </CardContent>
    </Card>
  );
}

function SectionHeaderFormSection() {
  return (
    <form className="flex w-full flex-col gap-8" onSubmit={stay}>
      <fieldset className="flex flex-col gap-4">
        <legend className="contents">
          <SectionHeader title="Job" description="What needs doing and where." />
        </legend>
        <FormField label="Title" required>
          {(control) => <Input {...control} defaultValue="Inspect drive-end bearing" />}
        </FormField>
        <FormField label="Asset" helper="Functional location tag.">
          {(control) => <Input {...control} defaultValue="23-KA-9103" />}
        </FormField>
      </fieldset>
      <fieldset className="flex flex-col gap-4">
        <legend className="contents">
          <SectionHeader title="Planning" description="Leave empty to plan it later." />
        </legend>
        <FormField label="Estimated hours" optional>
          {(control) => <Input {...control} type="number" defaultValue={8} />}
        </FormField>
      </fieldset>
    </form>
  );
}

function SectionHeaderFormAside() {
  return (
    <form className="flex w-full flex-col gap-6" onSubmit={stay}>
      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-2">
          <SectionHeader size="sm" as="h3" title="Schedule" description="When the pipeline runs and how it retries." />
        </div>
        <div className="col-span-3 flex flex-col gap-4">
          <FormField label="Run every">
            {(control) => <Input {...control} defaultValue="15 minutes" />}
          </FormField>
          <FormField label="Retries">{(control) => <Input {...control} type="number" defaultValue={3} />}</FormField>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-6 border-t border-default pt-6">
        <div className="col-span-2">
          <SectionHeader size="sm" as="h3" title="Notifications" description="Who hears about a failed run." />
        </div>
        <div className="col-span-3">
          <FormField label="Email">{(control) => <Input {...control} type="email" defaultValue="operations@nordkapp.test" />}</FormField>
        </div>
      </div>
    </form>
  );
}

function SectionHeaderSidebarGroups() {
  return (
    <nav aria-label="Workspace" className="flex w-full max-w-60 flex-col gap-4">
      <div className="flex flex-col gap-1">
        <ItemSectionHeader>
          <ItemSectionHeaderTitle>Operate</ItemSectionHeaderTitle>
        </ItemSectionHeader>
        <ItemGroup>
          <Item selected>
            <ItemMedia>
              <IconLayoutDashboard />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Overview</ItemTitle>
            </ItemContent>
          </Item>
          <Item>
            <ItemMedia>
              <IconBell />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Alarms</ItemTitle>
            </ItemContent>
          </Item>
          <Item>
            <ItemMedia>
              <IconChartLine />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Trends</ItemTitle>
            </ItemContent>
          </Item>
        </ItemGroup>
      </div>
      <div className="flex flex-col gap-1">
        <ItemSectionHeader>
          <ItemSectionHeaderTitle>Maintain</ItemSectionHeaderTitle>
        </ItemSectionHeader>
        <ItemGroup>
          <Item>
            <ItemMedia>
              <IconTool />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Work orders</ItemTitle>
            </ItemContent>
          </Item>
          <Item>
            <ItemMedia>
              <IconRoute />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Pipelines</ItemTitle>
            </ItemContent>
          </Item>
        </ItemGroup>
      </div>
    </nav>
  );
}

function SectionHeaderStickyGroups() {
  const groups = [
    { id: 'today', label: 'Last 24 hours', alarms: TODAY_ALARMS },
    { id: 'earlier', label: 'Earlier', alarms: EARLIER_ALARMS },
  ];

  return (
    <div className="h-64 w-full overflow-y-auto rounded-xl border border-default">
      {groups.map((group) => (
        <section key={group.id} aria-labelledby={`alarm-group-${group.id}`}>
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-default bg-muted-background px-4 py-2">
            <h3 id={`alarm-group-${group.id}`} className="text-xs font-medium text-medium-foreground">
              {group.label}
            </h3>
            <span className="text-xs text-muted-foreground tabular-nums">{group.alarms.length}</span>
          </div>
          <ul className="flex flex-col gap-3 px-4 py-3">
            {group.alarms.map((alarm) => (
              <li key={alarm.id} className="flex flex-col gap-1">
                <p className="truncate text-sm text-base-foreground">{alarm.message}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <StatusIndicator {...severityStatus(alarm.severity)} size="sm" />
                  <span>· {formatAgo(alarm.raisedAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function SectionHeaderEmptySection() {
  return (
    <SectionHeaderBlock>
      <SectionHeader
        title="Documents"
        count={0}
        actions={
          <Button size="sm" variant="secondary">
            <IconPlus /> Link document
          </Button>
        }
      />
      <p className="text-sm text-muted-foreground">
        No documents are linked to this asset yet. Link drawings and procedures so they are at hand during work.
      </p>
    </SectionHeaderBlock>
  );
}

function SectionHeaderDashboardRow() {
  const kpi = PLANT_KPIS;

  return (
    <SectionHeaderBlock>
      <SectionHeader
        overline="Nordkapp plant"
        title="Production"
        description="Plant-level figures against target."
        info={<InfoTooltip label="About production figures">Rolling values, recalculated every 15 minutes.</InfoTooltip>}
        actions={
          <>
            <SegmentedControl defaultValue="week">
              <SegmentedControlList size="small" aria-label="Comparison period">
                <SegmentedControlButton value="day" tabContent="label-only">
                  Day
                </SegmentedControlButton>
                <SegmentedControlButton value="week" tabContent="label-only">
                  Week
                </SegmentedControlButton>
                <SegmentedControlButton value="month" tabContent="label-only">
                  Month
                </SegmentedControlButton>
              </SegmentedControlList>
            </SegmentedControl>
            <a href="/dashboards/production" onClick={stay} className={LINK}>
              Open dashboard <IconArrowRight aria-hidden="true" />
            </a>
          </>
        }
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiTile
          label="Availability"
          value={kpi.availability.value}
          unit="%"
          decimals={1}
          delta={{ reference: kpi.availability.previous, goodDirection: 'up', caption: 'vs last week' }}
          target={{ value: kpi.availability.target }}
        />
        <KpiTile
          label="Gas export"
          value={kpi.gasExport.value}
          unit={kpi.gasExport.unit}
          decimals={2}
          delta={{ reference: kpi.gasExport.previous, goodDirection: 'up', caption: 'vs last week', decimals: 2 }}
          target={{ value: kpi.gasExport.target }}
        />
        <KpiTile
          label="Energy intensity"
          value={kpi.energyIntensity.value}
          unit={kpi.energyIntensity.unit}
          decimals={1}
          delta={{ reference: kpi.energyIntensity.previous, goodDirection: 'down', caption: 'vs last week' }}
          target={{ value: kpi.energyIntensity.target }}
        />
      </div>
    </SectionHeaderBlock>
  );
}

export default definePage({
  id: 'section-headers',
  title: 'Section headers',
  summary:
    'Headings inside a page, card or panel. They name a block of content, say how much is in it and carry the actions that belong to that block only.',
  guidance: {
    use: [
      'Above every block of content that is not self-explanatory, with a real heading element.',
      'A count when the section is a list; an action only when it acts on this section.',
      'Space above the header and a smaller gap below, so it belongs to its content.',
      'One size per level, picked from the page outline.',
    ],
    avoid: [
      'A rule under every header. Use spacing first; a rule only above dense content.',
      'Page-level actions in a section header, or a primary button in every section.',
      'Headings that only repeat the page title or the tab label above them.',
      'All caps or status colour to make a heading stand out.',
    ],
  },
  source,
  sections: [
    {
      id: 'basics',
      title: 'Basics',
      description: 'A title, and the two lines that can go with it.',
      specimens: [
        {
          id: 'SectionHeaderTitleOnly',
          title: 'Title only',
          note: 'The default, when the title says everything about the block.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/structure/SectionHeader.tsx'],
          Component: SectionHeaderTitleOnly,
        },
        {
          id: 'SectionHeaderWithDescription',
          title: 'With description',
          note: 'When people need one line on what the section holds or where it comes from.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/structure/SectionHeader.tsx'],
          Component: SectionHeaderWithDescription,
        },
        {
          id: 'SectionHeaderOverline',
          title: 'Overline and title',
          note: 'When sections of several categories share a page and the category helps scanning.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/structure/SectionHeader.tsx'],
          Component: SectionHeaderOverline,
        },
      ],
    },
    {
      id: 'additions',
      title: 'Counts, hints and actions',
      description: 'Small additions on the title line and at the end of the row.',
      specimens: [
        {
          id: 'SectionHeaderWithCount',
          title: 'With count',
          note: 'For a list, so people know how much there is before they scroll.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/structure/SectionHeader.tsx', 'display/StatusBadge.tsx'],
          Component: SectionHeaderWithCount,
        },
        {
          id: 'SectionHeaderWithInfo',
          title: 'With info tooltip',
          note: 'When the title is a term of art and a short definition is enough.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/structure/SectionHeader.tsx', 'overlays/InfoTooltip.tsx'],
          Component: SectionHeaderWithInfo,
        },
        {
          id: 'SectionHeaderWithHelpLink',
          title: 'With help link',
          note: 'When the explanation is longer than a tooltip and lives in the documentation.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/structure/SectionHeader.tsx'],
          Component: SectionHeaderWithHelpLink,
        },
        {
          id: 'SectionHeaderWithLink',
          title: 'With action link',
          note: 'When the section is a preview and the full list has its own page.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/SectionHeader.tsx', 'display/StatusBadge.tsx'],
          Component: SectionHeaderWithLink,
        },
        {
          id: 'SectionHeaderWithButton',
          title: 'With button',
          note: 'When people add to or change this section from here. Secondary and small, never primary.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/SectionHeader.tsx', 'display/MetadataList.tsx'],
          Component: SectionHeaderWithButton,
        },
      ],
    },
    {
      id: 'controls',
      title: 'Controls',
      description: 'Headers that switch, filter or fold the content below them.',
      specimens: [
        {
          id: 'SectionHeaderWithTabs',
          title: 'With tabs',
          note: 'When the section has two or three sub-lists and only one is needed at a time.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/SectionHeader.tsx', 'display/StatusBadge.tsx'],
          Component: SectionHeaderWithTabs,
        },
        {
          id: 'SectionHeaderWithSegmented',
          title: 'With segmented control',
          note: 'When the same content is shown for a different period or mode.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/SectionHeader.tsx', 'display/MetadataList.tsx', 'industrial/ValueReadout.tsx'],
          Component: SectionHeaderWithSegmented,
        },
        {
          id: 'SectionHeaderCollapsible',
          title: 'Collapsible',
          note: 'For detail that most visits do not need. The count stays visible when the section is closed.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/CollapsibleSection.tsx'],
          Component: SectionHeaderCollapsible,
        },
        {
          id: 'SectionHeaderWithSearch',
          title: 'With search',
          note: 'For a long list inside a page that has other sections, so the search clearly belongs to it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/SectionHeader.tsx', 'display/StatusBadge.tsx'],
          Component: SectionHeaderWithSearch,
        },
      ],
    },
    {
      id: 'hierarchy',
      title: 'Hierarchy and separation',
      description: 'Three sizes, and when a rule earns its place.',
      specimens: [
        {
          id: 'SectionHeaderSizes',
          title: 'Sizes',
          note: 'Large for a region, medium for a section, small for a group inside a card or panel.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/structure/SectionHeader.tsx'],
          Component: SectionHeaderSizes,
        },
        {
          id: 'SectionHeaderNested',
          title: 'Section with groups',
          note: 'When a section splits into named groups: one step down in size and heading level.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/structure/SectionHeader.tsx', 'display/MetadataList.tsx'],
          Component: SectionHeaderNested,
        },
        {
          id: 'SectionHeaderDivider',
          title: 'Spacing or rule',
          note: 'Spacing is the default. Add the rule when the content below is a dense list or table.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/structure/SectionHeader.tsx', 'display/MetadataList.tsx'],
          Component: SectionHeaderDivider,
        },
      ],
    },
    {
      id: 'cards-and-forms',
      title: 'In cards and forms',
      description: 'The same job done by a card header and by a form section heading.',
      specimens: [
        {
          id: 'SectionHeaderCard',
          title: 'Card header',
          note: 'When the section is a card: the card header is the section header, so do not add another.',
          origin: 'custom',
          align: 'stretch',
          uses: ['display/MetadataList.tsx', 'industrial/ValueReadout.tsx'],
          Component: SectionHeaderCard,
        },
        {
          id: 'SectionHeaderCardWithAction',
          title: 'Card header with actions',
          note: 'For a dashboard card with one quick action and a short menu.',
          origin: 'custom',
          align: 'stretch',
          uses: ['display/MetadataList.tsx'],
          Component: SectionHeaderCardWithAction,
        },
        {
          id: 'SectionHeaderCardWithIcon',
          title: 'Card header with icon',
          note: 'When cards for different kinds of thing sit side by side and the icon tells them apart.',
          origin: 'custom',
          align: 'stretch',
          uses: ['display/MetadataList.tsx'],
          Component: SectionHeaderCardWithIcon,
        },
        {
          id: 'SectionHeaderFormSection',
          title: 'Form section headings',
          note: 'For a form with more than five or six fields: group them and name each group.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/SectionHeader.tsx', 'forms/FormField.tsx'],
          Component: SectionHeaderFormSection,
        },
        {
          id: 'SectionHeaderFormAside',
          title: 'Form heading beside fields',
          note: 'For settings pages with room to spare: the heading column explains, the field column acts.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/SectionHeader.tsx', 'forms/FormField.tsx'],
          Component: SectionHeaderFormAside,
        },
      ],
    },
    {
      id: 'lists-and-dashboards',
      title: 'In lists and dashboards',
      description: 'Group labels in navigation and long lists, and a full dashboard section.',
      specimens: [
        {
          id: 'SectionHeaderSidebarGroups',
          title: 'Sidebar group labels',
          note: 'To split a navigation list into two or three named groups.',
          origin: 'custom',
          Component: SectionHeaderSidebarGroups,
        },
        {
          id: 'SectionHeaderStickyGroups',
          title: 'Sticky list group headers',
          note: 'In a long grouped list, so the group name stays in view. Scroll the list to try.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/StatusIndicator.tsx'],
          Component: SectionHeaderStickyGroups,
        },
        {
          id: 'SectionHeaderEmptySection',
          title: 'Empty section',
          note: 'Keep the header and its action when there is nothing yet, and say what will appear.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/structure/SectionHeader.tsx'],
          Component: SectionHeaderEmptySection,
        },
        {
          id: 'SectionHeaderDashboardRow',
          title: 'Dashboard section',
          note: 'A full section header over a row of tiles: category, title, hint, period and a way in.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/structure/SectionHeader.tsx', 'overlays/InfoTooltip.tsx', 'industrial/KpiTile.tsx'],
          Component: SectionHeaderDashboardRow,
        },
      ],
    },
  ],
});
