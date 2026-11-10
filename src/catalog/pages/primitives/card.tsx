import { Avatar, AvatarIcon } from '@cognite/aura/components/avatar';
import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import {
  Card,
  CardActions,
  CardContent,
  CardDescription,
  CardFooter,
  CardFooterEnd,
  CardFooterStart,
  CardHeader,
  CardHeaderCenter,
  CardHeaderEnd,
  CardHeaderStart,
  CardTitle,
} from '@cognite/aura/components/card';
import { CheckboxItemControl } from '@cognite/aura/components/checkbox';
import { Count, CountValue } from '@cognite/aura/components/count';
import { DropdownMenuItem } from '@cognite/aura/components/dropdown-menu';
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateTitle,
} from '@cognite/aura/components/empty-state';
import { Input } from '@cognite/aura/components/input';
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@cognite/aura/components/item';
import { Label } from '@cognite/aura/components/label';
import { Progress } from '@cognite/aura/components/progress';
import { Skeleton } from '@cognite/aura/components/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import {
  IconAlertTriangle,
  IconArrowUpRight,
  IconChartLine,
  IconDatabase,
  IconEngine,
  IconPhoto,
  IconRefresh,
  IconTimeline,
} from '@cognite/aura/icons';
import { useState } from 'react';

import { MetadataList } from '../../../library/display/MetadataList';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { StatDelta } from '../../../library/display/StatDelta';
import { StatusBadge } from '../../../library/display/StatusBadge';
import { ASSETS, PEOPLE, PLANT_KPIS, SENSORS, WORK_ORDERS } from '../../data/plant';
import { formatDate, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './card.tsx?raw';

const COMPRESSOR = ASSETS.find((asset) => asset.id === '23-ka-9101') ?? ASSETS[0];
const COMPRESSORS = ASSETS.filter((asset) => asset.type === 'compressor');
const COMPRESSOR_SENSORS = SENSORS.filter((sensor) => sensor.assetId === COMPRESSOR.id);
const BEARING_ORDER = WORK_ORDERS[0];
const BEARING_ASSIGNEE = PEOPLE.find((person) => person.id === BEARING_ORDER.assigneeId) ?? PEOPLE[0];
const PRESSURE_TREND = makeValues({ seed: 11, points: 48, base: 48, amplitude: 2.5, noise: 0.8 });

/** Wrapper classes that centre a width-capped card in a stretched frame. */
const FRAME = 'mx-auto w-full max-w-md self-center';

/** SVG polyline points for a small trend, scaled into a 300 × 80 box. */
function trendPoints(values: readonly number[]): string {
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 300;
      const y = 74 - ((value - min) / span) * 68;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function CardPlain() {
  return (
    <Card className={FRAME}>
      <CardContent>
        <p className="text-sm text-base-foreground">
          Gas compression is running on two of three trains. The recompressor tripped on high vibration at 13:46 and
          is isolated for inspection.
        </p>
      </CardContent>
    </Card>
  );
}

function CardTitleAndDescription() {
  return (
    <Card className={FRAME}>
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Shift handover</CardTitle>
          <CardDescription>Day shift, 12 March</CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-base-foreground">
          Recompressor isolated. Bearing inspection is under way and expected to finish before the night shift.
        </p>
      </CardContent>
    </Card>
  );
}

function CardLeadingIcon() {
  return (
    <Card className={FRAME}>
      <CardHeader>
        <CardHeaderStart>
          <Avatar variant="overflow" aria-hidden="true">
            <AvatarIcon>
              <IconDatabase />
            </AvatarIcon>
          </Avatar>
        </CardHeaderStart>
        <CardHeaderCenter>
          <CardTitle>Compressor telemetry</CardTitle>
          <CardDescription>Data set · 1,284 time series</CardDescription>
        </CardHeaderCenter>
      </CardHeader>
    </Card>
  );
}

function CardHeaderWithBadge() {
  return (
    <Card className={FRAME}>
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>{COMPRESSOR.name}</CardTitle>
          <CardDescription>{COMPRESSOR.tag}</CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <StatusBadge status={COMPRESSOR.state} />
        </CardHeaderEnd>
      </CardHeader>
    </Card>
  );
}

function CardHeaderMenu() {
  return (
    <Card className={FRAME}>
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Vibration overview</CardTitle>
          <CardDescription>Gas compression, last 24 hours</CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <CardActions aria-label="Card actions">
            <DropdownMenuItem>Edit chart</DropdownMenuItem>
            <DropdownMenuItem>Duplicate</DropdownMenuItem>
            <DropdownMenuItem variant="destructive">Remove from dashboard</DropdownMenuItem>
          </CardActions>
        </CardHeaderEnd>
      </CardHeader>
    </Card>
  );
}

function CardHeaderButton() {
  return (
    <Card className={FRAME}>
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Extraction pipelines</CardTitle>
          <CardDescription>Last checked 2 min ago</CardDescription>
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
        </CardHeaderEnd>
      </CardHeader>
    </Card>
  );
}

function CardWithFooter() {
  return (
    <Card className={FRAME}>
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Daily production report</CardTitle>
          <CardDescription>Generated from 14 data sets</CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardFooter>
        <CardFooterStart>
          <span className="text-xs text-muted-foreground">Updated 12 Mar, 06:00</span>
        </CardFooterStart>
        <CardFooterEnd>
          <Button variant="outline" size="sm">
            Open report
          </Button>
        </CardFooterEnd>
      </CardFooter>
    </Card>
  );
}

function CardAllSlots() {
  return (
    <Card className={FRAME}>
      <CardHeader>
        <CardHeaderStart>
          <Avatar variant="overflow" aria-hidden="true">
            <AvatarIcon>
              <IconEngine />
            </AvatarIcon>
          </Avatar>
        </CardHeaderStart>
        <CardHeaderCenter>
          <CardTitle>{COMPRESSOR.name}</CardTitle>
          <CardDescription>{COMPRESSOR.tag} · Gas compression</CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <StatusBadge status={COMPRESSOR.state} />
          <CardActions aria-label="Asset actions">
            <DropdownMenuItem>Open in asset explorer</DropdownMenuItem>
            <DropdownMenuItem>Create work order</DropdownMenuItem>
          </CardActions>
        </CardHeaderEnd>
      </CardHeader>
      <CardContent>
        <MetadataList
          items={[
            { label: 'Health score', value: COMPRESSOR.healthScore },
            { label: 'Criticality', value: COMPRESSOR.criticality },
            { label: 'Open work orders', value: 1 },
          ]}
        />
      </CardContent>
      <CardFooter>
        <CardFooterStart>
          <span className="text-xs text-muted-foreground">Last inspected 4 Mar</span>
        </CardFooterStart>
        <CardFooterEnd>
          <Button variant="outline" size="sm">
            View asset
          </Button>
        </CardFooterEnd>
      </CardFooter>
    </Card>
  );
}

function CardWithCount() {
  return (
    <Card className={FRAME}>
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Open work orders</CardTitle>
          <CardDescription>Gas compression</CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <Count>
            <CountValue>{WORK_ORDERS.filter((order) => order.status !== 'done').length}</CountValue>
          </Count>
        </CardHeaderEnd>
      </CardHeader>
    </Card>
  );
}

function CardLongTitle() {
  return (
    <Card className={FRAME}>
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>
            Nordkapp gas compression train A first stage compressor drive-end bearing vibration and temperature
            monitoring overview
          </CardTitle>
          <CardDescription>
            Combines drive-end and non-drive-end vibration with bearing temperature, shaft speed and lube oil pressure
            to flag early signs of bearing wear before the trip limit is reached.
          </CardDescription>
        </CardHeaderCenter>
      </CardHeader>
    </Card>
  );
}

function CardWithMetadata() {
  return (
    <Card className={FRAME}>
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle as="h4">Properties</CardTitle>
        </CardHeaderCenter>
      </CardHeader>
      <CardContent>
        <MetadataList
          items={[
            { label: 'Tag', value: COMPRESSOR.tag },
            { label: 'Type', value: 'Centrifugal compressor' },
            { label: 'Area', value: 'Gas compression' },
            { label: 'Manufacturer' },
            { label: 'Commissioned', value: '2014' },
          ]}
        />
      </CardContent>
    </Card>
  );
}

function CardWithList() {
  return (
    <Card className={FRAME}>
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Linked time series</CardTitle>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <Count>
            <CountValue>{COMPRESSOR_SENSORS.length}</CountValue>
          </Count>
        </CardHeaderEnd>
      </CardHeader>
      <CardContent>
        <ItemGroup className="-mx-2 w-full">
          {COMPRESSOR_SENSORS.slice(0, 4).map((sensor) => (
            <Item key={sensor.id}>
              <ItemMedia>
                <IconTimeline />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{sensor.name}</ItemTitle>
                <ItemDescription>{sensor.tag}</ItemDescription>
              </ItemContent>
              <span className="text-sm text-medium-foreground tabular-nums">
                {sensor.value.toFixed(sensor.decimals)} {sensor.unit}
              </span>
            </Item>
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}

function CardWithChart() {
  return (
    <Card className={FRAME}>
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Discharge pressure</CardTitle>
          <CardDescription>23-PT-92531 · last 24 hours</CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <span className="text-lg font-medium text-base-foreground tabular-nums">48.6 barg</span>
        </CardHeaderEnd>
      </CardHeader>
      <CardContent>
        <svg
          viewBox="0 0 300 80"
          preserveAspectRatio="none"
          role="img"
          aria-label="Discharge pressure over the last 24 hours, steady between 45 and 51 barg"
          className="h-24 w-full"
        >
          <line x1="0" x2="300" y1="40" y2="40" className="stroke-chart-gridlines" vectorEffect="non-scaling-stroke" />
          <polyline
            points={trendPoints(PRESSURE_TREND)}
            fill="none"
            strokeWidth="1.5"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className="stroke-chart-1-450"
          />
        </svg>
      </CardContent>
    </Card>
  );
}

function CardMedia() {
  return (
    <Card className={FRAME}>
      <CardContent>
        <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-medium-background">
          <IconPhoto className="size-8 text-muted-foreground" aria-hidden="true" />
        </div>
      </CardContent>
      <CardFooter>
        <CardFooterStart className="flex-col gap-0">
          <span className="text-sm font-medium text-base-foreground">Recompressor drive end</span>
          <span className="text-xs text-muted-foreground">Inspection photo · 12 Mar, 13:52</span>
        </CardFooterStart>
        <CardFooterEnd>
          <Button variant="outline" size="sm">
            Open
          </Button>
        </CardFooterEnd>
      </CardFooter>
    </Card>
  );
}

function CardLoading() {
  return (
    <Card className={FRAME} aria-busy="true" aria-label="Loading asset">
      <CardHeader>
        <CardHeaderStart>
          <Skeleton className="size-9" />
        </CardHeaderStart>
        <CardHeaderCenter className="gap-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56 max-w-full" />
        </CardHeaderCenter>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
    </Card>
  );
}

function CardEmpty() {
  return (
    <Card className={FRAME}>
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Linked documents</CardTitle>
        </CardHeaderCenter>
      </CardHeader>
      <CardContent className="items-center">
        <EmptyState>
          <EmptyStateTitle as="p">No documents linked</EmptyStateTitle>
          <EmptyStateDescription>Link P&amp;IDs, datasheets or procedures to this asset.</EmptyStateDescription>
          <EmptyStateActions>
            <Button variant="secondary" size="sm">
              Link document
            </Button>
          </EmptyStateActions>
        </EmptyState>
      </CardContent>
    </Card>
  );
}

function CardError() {
  return (
    <Card className={FRAME}>
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Vibration trend</CardTitle>
          <CardDescription>23-VT-92540 · last 24 hours</CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-2">
          <IconAlertTriangle className="mt-0.5 size-4 shrink-0 text-critical-foreground-strong" aria-hidden="true" />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-base-foreground">Could not load the trend</p>
            <p className="text-sm text-muted-foreground">The time series service did not respond. Your data is safe.</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <CardFooterStart />
        <CardFooterEnd>
          <Button variant="outline" size="sm">
            <IconRefresh /> Try again
          </Button>
        </CardFooterEnd>
      </CardFooter>
    </Card>
  );
}

function CardSelectable() {
  const [selected, setSelected] = useState(COMPRESSORS[0].id);

  return (
    <div role="group" aria-label="Compressor to compare" className="mx-auto grid w-full max-w-2xl gap-3 self-center sm:grid-cols-3">
      {COMPRESSORS.map((asset) => (
        <button
          key={asset.id}
          type="button"
          aria-pressed={selected === asset.id}
          onClick={() => setSelected(asset.id)}
          className="rounded-xl text-left outline-none ring-2 ring-transparent transition-shadow focus-visible:shadow-focus-ring aria-pressed:ring-primary-background"
        >
          <Card className="h-full">
            <CardHeader>
              <CardHeaderCenter>
                <CardTitle as="h4">{asset.name}</CardTitle>
                <CardDescription>{asset.tag}</CardDescription>
              </CardHeaderCenter>
            </CardHeader>
            <CardContent>
              <StatusBadge status={asset.state} />
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  );
}

function CardMultiSelect() {
  const sets = [
    { id: 'telemetry', name: 'Compressor telemetry', detail: '1,284 time series' },
    { id: 'maintenance', name: 'Maintenance history', detail: '8,412 events' },
  ];
  const [checked, setChecked] = useState<readonly string[]>(['telemetry']);

  return (
    <div className="mx-auto grid w-full max-w-xs gap-3 self-center">
      {sets.map((set) => (
        <Card key={set.id}>
          <CardHeader>
            <CardHeaderCenter>
              <CardTitle as="h4" id={`card-multi-${set.id}`}>
                {set.name}
              </CardTitle>
              <CardDescription>{set.detail}</CardDescription>
            </CardHeaderCenter>
            <CardHeaderEnd>
              <CheckboxItemControl
                aria-labelledby={`card-multi-${set.id}`}
                checked={checked.includes(set.id)}
                onCheckedChange={(next) =>
                  setChecked(next ? [...checked, set.id] : checked.filter((other) => other !== set.id))
                }
              />
            </CardHeaderEnd>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

function CardLink() {
  return (
    <a
      href="https://docs.cognite.com/cdf/flows"
      target="_blank"
      rel="noreferrer"
      className={`group block rounded-xl outline-none focus-visible:shadow-focus-ring ${FRAME}`}
    >
      <Card>
        <CardHeader>
          <CardHeaderStart>
            <Avatar variant="overflow" aria-hidden="true">
              <AvatarIcon>
                <IconChartLine />
              </AvatarIcon>
            </Avatar>
          </CardHeaderStart>
          <CardHeaderCenter>
            <CardTitle>Compression dashboard</CardTitle>
            <CardDescription>12 charts · updated 5 min ago</CardDescription>
          </CardHeaderCenter>
          <CardHeaderEnd>
            <IconArrowUpRight
              className="size-4 text-muted-foreground transition-colors group-hover:text-base-foreground"
              aria-hidden="true"
            />
          </CardHeaderEnd>
        </CardHeader>
      </Card>
    </a>
  );
}

function CardKpi() {
  return (
    <Card className="mx-auto w-full max-w-xs self-center">
      <CardHeader>
        <CardHeaderCenter>
          <CardDescription>Plant availability</CardDescription>
          <span className="text-2xl font-semibold text-base-foreground tabular-nums">
            {PLANT_KPIS.availability.value} %
          </span>
        </CardHeaderCenter>
      </CardHeader>
      <CardFooter>
        <CardFooterStart>
          <span className="text-xs text-muted-foreground">
            Target {PLANT_KPIS.availability.target} % · was {PLANT_KPIS.availability.previous} % last week
          </span>
        </CardFooterStart>
      </CardFooter>
    </Card>
  );
}

function CardStats() {
  return (
    <Card className={FRAME}>
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>This week</CardTitle>
          <CardDescription>Nordkapp plant</CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardContent>
        <StatDelta
          label="Active alarms"
          value={PLANT_KPIS.activeAlarms.value}
          previous={PLANT_KPIS.activeAlarms.previous}
          betterWhen="lower"
          comparison="vs last week"
        />
        <StatDelta
          label="Open work orders"
          value={PLANT_KPIS.openWorkOrders.value}
          previous={PLANT_KPIS.openWorkOrders.previous}
          betterWhen="lower"
          comparison="vs last week"
        />
        <StatDelta
          label="Mean time between failures"
          value={PLANT_KPIS.mtbf.value}
          previous={PLANT_KPIS.mtbf.previous}
          unit="h"
          betterWhen="higher"
          comparison="vs last week"
        />
      </CardContent>
    </Card>
  );
}

function CardWorkOrder() {
  return (
    <Card className={FRAME}>
      <CardHeader>
        <CardHeaderCenter>
          <CardDescription>{BEARING_ORDER.id}</CardDescription>
          <CardTitle>{BEARING_ORDER.title}</CardTitle>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <Badge variant="secondary">{BEARING_ORDER.priority}</Badge>
        </CardHeaderEnd>
      </CardHeader>
      <CardContent>
        <div className="flex w-full flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <StatusBadge status={BEARING_ORDER.status} />
            <span className="text-muted-foreground tabular-nums">{BEARING_ORDER.progress} %</span>
          </div>
          <Progress value={BEARING_ORDER.progress} size="sm" aria-label="Work order progress" />
        </div>
      </CardContent>
      <CardFooter>
        <CardFooterStart className="items-center">
          <PersonAvatar name={BEARING_ASSIGNEE.name} colorKey={BEARING_ASSIGNEE.id} sizes="xxsm" />
          <span className="text-sm text-medium-foreground">{BEARING_ASSIGNEE.name}</span>
        </CardFooterStart>
        <CardFooterEnd>
          <span className="text-xs text-muted-foreground">Due {formatDate(BEARING_ORDER.dueAt)}</span>
        </CardFooterEnd>
      </CardFooter>
    </Card>
  );
}

function CardForm() {
  return (
    <Card className={FRAME}>
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Alarm limits</CardTitle>
          <CardDescription>23-PT-92531 · Discharge pressure</CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardContent>
        <div className="grid w-full grid-cols-2 gap-4">
          <div>
            <Label htmlFor="card-form-high">High limit (barg)</Label>
            <Input id="card-form-high" defaultValue="52.0" inputMode="decimal" />
          </div>
          <div>
            <Label htmlFor="card-form-trip">Trip limit (barg)</Label>
            <Input id="card-form-trip" defaultValue="55.0" inputMode="decimal" />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <CardFooterStart />
        <CardFooterEnd className="gap-2">
          <Button variant="ghost" size="sm">
            Cancel
          </Button>
          <Button size="sm">Save limits</Button>
        </CardFooterEnd>
      </CardFooter>
    </Card>
  );
}

function CardGrid() {
  return (
    <div className="grid w-full gap-4 self-center sm:grid-cols-3">
      {COMPRESSORS.map((asset) => (
        <Card key={asset.id}>
          <CardHeader>
            <CardHeaderCenter>
              <CardTitle as="h4">{asset.name}</CardTitle>
              <CardDescription>{asset.tag}</CardDescription>
            </CardHeaderCenter>
          </CardHeader>
          <CardContent>
            <MetadataList
              items={[
                { label: 'Health', value: asset.healthScore },
                { label: 'Criticality', value: asset.criticality },
              ]}
            />
          </CardContent>
          <CardFooter>
            <CardFooterStart>
              <StatusBadge status={asset.state} />
            </CardFooterStart>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export default definePage({
  id: 'card',
  title: 'Card',
  summary:
    'A card is a structural container that keeps one data artifact, widget or record together with its title and actions. Every slot — header, content, footer — is optional.',
  docsSlug: 'card',
  guidance: {
    use: [
      'One subject per card: a chart, a record, a summary, a small form.',
      'The same structure for every card in a grid, so they compare at a glance.',
      'Header end for a badge, count or menu; footer end for the card’s actions.',
      'Short titles and descriptions — both clamp to two lines.',
    ],
    avoid: [
      'Cards inside cards, or a card where spacing or a Separator would do.',
      'Making the surface interactive, unless the whole card is one link or selection target.',
      'Unrelated actions in the same card.',
      'A card for a compact row in a list — use an Item.',
    ],
  },
  source,
  sections: [
    {
      id: 'anatomy',
      title: 'Anatomy',
      description: 'The slots, added one at a time. Compose only what the content needs.',
      specimens: [
        {
          id: 'CardPlain',
          title: 'Content only',
          note: 'A plain surface that groups a short piece of content with no heading of its own.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CardPlain,
        },
        {
          id: 'CardTitleAndDescription',
          title: 'Title and description',
          note: 'The default: say what the card holds, then show it.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CardTitleAndDescription,
        },
        {
          id: 'CardLeadingIcon',
          title: 'Leading icon',
          note: 'A neutral icon tile that says what kind of thing the card is.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CardLeadingIcon,
        },
        {
          id: 'CardHeaderWithBadge',
          title: 'Header with status',
          note: 'The state of the record, where the eye lands after the title.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/StatusBadge.tsx'],
          Component: CardHeaderWithBadge,
        },
        {
          id: 'CardHeaderMenu',
          title: 'Header with overflow menu',
          note: 'Several secondary actions on the card itself, such as on a dashboard tile.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CardHeaderMenu,
        },
        {
          id: 'CardHeaderButton',
          title: 'Header with icon action',
          note: 'One frequent action that deserves to be visible, such as refresh.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CardHeaderButton,
        },
        {
          id: 'CardWithFooter',
          title: 'Footer with metadata and action',
          note: 'Supporting detail on the left, the action for this card on the right.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CardWithFooter,
        },
        {
          id: 'CardAllSlots',
          title: 'All slots',
          note: 'A full record card: icon, title, status, menu, properties and a footer action.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/StatusBadge.tsx', 'display/MetadataList.tsx'],
          Component: CardAllSlots,
        },
      ],
    },
    {
      id: 'content',
      title: 'Content',
      description: 'What typically goes in the header and body.',
      specimens: [
        {
          id: 'CardWithCount',
          title: 'With count',
          note: 'A card that stands for a number of items.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CardWithCount,
        },
        {
          id: 'CardLongTitle',
          title: 'Long title and description',
          note: 'Shows the two-line clamp; put the detail in the body instead.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CardLongTitle,
        },
        {
          id: 'CardWithMetadata',
          title: 'Properties',
          note: 'Label and value pairs for one record, with a placeholder for what is missing.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/MetadataList.tsx'],
          Component: CardWithMetadata,
        },
        {
          id: 'CardWithList',
          title: 'With a list',
          note: 'Related items under one heading; rows are separated by spacing, not borders.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CardWithList,
        },
        {
          id: 'CardWithChart',
          title: 'With a chart',
          note: 'A dashboard widget: what is plotted in the header, the latest value at the end.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CardWithChart,
        },
        {
          id: 'CardMedia',
          title: 'With media',
          note: 'An image, video or document preview, with its caption and action in the footer.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CardMedia,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'Loading, empty and failed content, and the two cases where the whole card is a target.',
      specimens: [
        {
          id: 'CardLoading',
          title: 'Loading',
          note: 'Skeletons in the shape of the content, so the layout does not jump when data arrives.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CardLoading,
        },
        {
          id: 'CardEmpty',
          title: 'Empty',
          note: 'Nothing to show yet: say so and offer the action that fills it.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CardEmpty,
        },
        {
          id: 'CardError',
          title: 'Failed to load',
          note: 'Keeps the failure inside the widget that failed, with a way to retry.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CardError,
        },
        {
          id: 'CardLink',
          title: 'Whole card as a link',
          note: 'The card leads somewhere and has no other controls inside.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: CardLink,
        },
        {
          id: 'CardSelectable',
          title: 'Single selection',
          note: 'Choosing one of a few options that need more than a label. Click to try.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          Component: CardSelectable,
        },
        {
          id: 'CardMultiSelect',
          title: 'With checkbox',
          note: 'Picking several cards; the checkbox in the header end is the control.',
          origin: 'aura',
          align: 'stretch',
          Component: CardMultiSelect,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'Cards for figures, records and grids.',
      specimens: [
        {
          id: 'CardKpi',
          title: 'Key figure',
          note: 'One number that matters, with its target and previous value underneath.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CardKpi,
        },
        {
          id: 'CardStats',
          title: 'Stats with change',
          note: 'A short summary where each figure shows how it moved.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/StatDelta.tsx'],
          Component: CardStats,
        },
        {
          id: 'CardWorkOrder',
          title: 'Work order',
          note: 'A task card: priority, status, progress, assignee and due date.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/StatusBadge.tsx', 'display/PersonAvatar.tsx'],
          Component: CardWorkOrder,
        },
        {
          id: 'CardForm',
          title: 'With a small form',
          note: 'A few related fields that save together, with the actions in the footer.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: CardForm,
        },
        {
          id: 'CardGrid',
          title: 'Grid of comparable cards',
          note: 'Several records of one kind; identical structure makes the differences stand out.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['display/StatusBadge.tsx', 'display/MetadataList.tsx'],
          Component: CardGrid,
        },
      ],
    },
  ],
});
