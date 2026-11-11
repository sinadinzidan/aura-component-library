
import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardHeaderCenter,
  CardTitle,
} from '@cognite/aura/components/card';
import { CheckboxGroup, CheckboxItem, CheckboxItemControl, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from '@cognite/aura/components/empty-state';
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@cognite/aura/components/item';
import { ScrollArea } from '@cognite/aura/components/scroll-area';
import { Skeleton } from '@cognite/aura/components/skeleton';
import { Tabs, TabsLabel, TabsList, TabsTrigger } from '@cognite/aura/components/tabs';
import { IconArrowUp, IconBellOff, IconEngine, IconGauge, IconStack2 } from '@cognite/aura/icons';
import { useEffect, useRef, useState } from 'react';

import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { StatusBadge } from '../../../library/display/StatusBadge';
import { Table } from '../../../library/primitives/table/Table';
import { TableBody } from '../../../library/primitives/table/TableBody';
import { TableCell } from '../../../library/primitives/table/TableCell';
import { TableHead } from '../../../library/primitives/table/TableHead';
import { TableHeader } from '../../../library/primitives/table/TableHeader';
import { TableRow } from '../../../library/primitives/table/TableRow';
import { ALARMS, ASSETS, PEOPLE, SENSORS, WORK_ORDERS, childrenOf, findAsset, findPerson } from '../../data/plant';
import type { Sensor, WorkOrder } from '../../data/plant';
import { formatAgo, formatDate, formatTime } from '../../data/series';
import { definePage } from '../../types';

import source from './scroll-area.tsx?raw';

const SCROLL_AREA_PANEL = 'w-full max-w-sm overflow-hidden rounded-xl border border-default';

const SCROLL_AREA_AREAS = ASSETS.filter((asset) => asset.type === 'area' || asset.type === 'system');

const SCROLL_AREA_EQUIPMENT = ASSETS.filter((asset) => !['site', 'area', 'system'].includes(asset.type));

const SCROLL_AREA_BOARD: readonly { status: WorkOrder['status']; title: string }[] = [
  { status: 'open', title: 'Open' },
  { status: 'planned', title: 'Planned' },
  { status: 'in-progress', title: 'In progress' },
  { status: 'waiting', title: 'Waiting' },
  { status: 'done', title: 'Done' },
];

const SCROLL_AREA_PROCEDURE = [
  'Confirm with the control room that the recompressor is isolated and that the permit to work is active for 23-KA-9103.',
  'Verify zero energy on the drive: lock out the motor breaker, close and tag the suction and discharge block valves, and depressurise the casing to flare.',
  'Remove the drive-end bearing housing cover. Record the as-found clearance at four points before disturbing the bearing.',
  'Inspect the journal and the bearing pads for scoring, wiping and discolouration. Photograph every finding and attach the photos to the work order.',
  'Fit the replacement bearing, torque the housing bolts in a star pattern and record the as-left clearance.',
  'Hand the equipment back to operations and stay on site for the first 30 minutes of the restart to watch the vibration trend.',
];

function formatSensorValue(sensor: Sensor): string {
  if (sensor.quality === 'bad') return 'No signal';
  const value = sensor.value.toLocaleString('en-GB', {
    minimumFractionDigits: sensor.decimals,
    maximumFractionDigits: sensor.decimals,
  });
  return `${value} ${sensor.unit}`;
}

function ScrollAreaSensorRows() {
  return (
    <ul className="divide-y divide-default px-4">
      {SENSORS.map((sensor) => (
        <li key={sensor.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
          <span className="min-w-0">
            <span className="block truncate text-base-foreground">{sensor.name}</span>
            <span className="block font-mono text-xs text-muted-foreground">{sensor.tag}</span>
          </span>
          <span className="shrink-0 tabular-nums text-medium-foreground">{formatSensorValue(sensor)}</span>
        </li>
      ))}
    </ul>
  );
}

function ScrollAreaAlarmRows() {
  return (
    <ul className="divide-y divide-default px-4">
      {ALARMS.map((alarm) => (
        <li key={alarm.id} className="py-2.5 text-sm">
          <span className="block text-base-foreground">{alarm.message}</span>
          <span className="block text-xs text-muted-foreground">
            {alarm.sensorTag} · {formatAgo(alarm.raisedAt)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ScrollAreaVertical() {
  return (
    <div className={SCROLL_AREA_PANEL}>
      <ScrollArea className="h-56 w-full" aria-label="Sensors">
        <ScrollAreaSensorRows />
      </ScrollArea>
    </div>
  );
}

function ScrollAreaHorizontal() {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-xl border border-default">
      <ScrollArea className="w-full" aria-label="Compressor readings">
        <div className="flex w-max gap-3 p-4">
          {SENSORS.slice(0, 7).map((sensor) => (
            <div key={sensor.id} className="w-40 rounded-lg bg-muted-background p-3">
              <p className="truncate text-xs text-muted-foreground">{sensor.name}</p>
              <p className="pt-1 text-xl font-medium tabular-nums text-base-foreground">{formatSensorValue(sensor)}</p>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function ScrollAreaBothAxes() {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-xl border border-default">
      <ScrollArea className="h-56 w-full" aria-label="Sensor limits">
        <Table label="Sensors" className="w-max">
          <TableHeader>
            <TableRow>
              <TableHead>Tag</TableHead>
              <TableHead>Name</TableHead>
              <TableHead numeric>Value</TableHead>
              <TableHead numeric>Low</TableHead>
              <TableHead numeric>High</TableHead>
              <TableHead numeric>Range</TableHead>
              <TableHead>Quality</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {SENSORS.map((sensor) => (
              <TableRow key={sensor.id}>
                <TableCell mono>{sensor.tag}</TableCell>
                <TableCell wrap="nowrap">{sensor.name}</TableCell>
                <TableCell numeric>{formatSensorValue(sensor)}</TableCell>
                <TableCell numeric>{sensor.lowLimit}</TableCell>
                <TableCell numeric>{sensor.highLimit}</TableCell>
                <TableCell numeric>
                  {sensor.rangeMin}–{sensor.rangeMax}
                </TableCell>
                <TableCell>{sensor.quality}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}

function ScrollAreaFits() {
  return (
    <div className={SCROLL_AREA_PANEL}>
      <ScrollArea className="h-56 w-full" aria-label="Sites">
        <ul className="divide-y divide-default px-4">
          {SCROLL_AREA_AREAS.map((area) => (
            <li key={area.id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-base-foreground">{area.name}</span>
              <span className="font-mono text-xs text-muted-foreground">{area.tag}</span>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}

function ScrollAreaTagRow() {
  return (
    <div className="w-full max-w-xs">
      <ScrollArea className="w-full" aria-label="Equipment tags">
        <div className="flex w-max gap-2 pb-3">
          {SCROLL_AREA_EQUIPMENT.map((asset) => (
            <Badge key={asset.id} variant="secondary">
              {asset.tag}
            </Badge>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function ScrollAreaLongText() {
  return (
    <div className={SCROLL_AREA_PANEL}>
      <ScrollArea className="h-56 w-full" aria-label="Bearing inspection procedure">
        <ol className="list-decimal space-y-3 py-4 pr-5 pl-9 text-sm leading-5 text-medium-foreground">
          {SCROLL_AREA_PROCEDURE.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </ScrollArea>
    </div>
  );
}

function ScrollAreaEventLog() {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-xl bg-muted-background">
      <ScrollArea className="h-48 w-full" aria-label="Alarm event log">
        <pre className="w-max p-4 font-mono text-xs leading-5 text-medium-foreground">
          {ALARMS.map(
            (alarm) =>
              `${formatDate(alarm.raisedAt)} ${formatTime(alarm.raisedAt)}  ${alarm.severity.toUpperCase().padEnd(8)}  ${alarm.sensorTag.padEnd(12)}  ${alarm.message} (${alarm.value}, limit ${alarm.limit})`
          ).join('\n')}
        </pre>
      </ScrollArea>
    </div>
  );
}

function ScrollAreaOptionList() {
  const [checked, setChecked] = useState<readonly string[]>(['23-ka-9101', '23-ka-9103']);
  const toggle = (id: string) =>
    setChecked((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));

  return (
    <div className="w-full max-w-xs overflow-hidden rounded-xl border border-default">
      <p className="px-4 pt-3 pb-1 text-xs font-medium text-muted-foreground">Filter by equipment</p>
      <ScrollArea className="h-48 w-full">
        <CheckboxGroup aria-label="Filter by equipment" className="px-2 pb-2">
          {SCROLL_AREA_EQUIPMENT.map((asset) => (
            <CheckboxItem key={asset.id}>
              <CheckboxItemControl checked={checked.includes(asset.id)} onCheckedChange={() => toggle(asset.id)} />
              <CheckboxItemLabel>{asset.name}</CheckboxItemLabel>
            </CheckboxItem>
          ))}
        </CheckboxGroup>
      </ScrollArea>
    </div>
  );
}

function ScrollAreaWideTabs() {
  return (
    <div className="w-full max-w-xs">
      <ScrollArea className="w-full" aria-label="Equipment sections">
        <Tabs defaultValue="overview">
          <TabsList className="w-max pb-3">
            <TabsTrigger value="overview">
              <TabsLabel>Overview</TabsLabel>
            </TabsTrigger>
            <TabsTrigger value="sensors">
              <TabsLabel>Sensors</TabsLabel>
            </TabsTrigger>
            <TabsTrigger value="alarms">
              <TabsLabel>Alarms</TabsLabel>
            </TabsTrigger>
            <TabsTrigger value="work-orders">
              <TabsLabel>Work orders</TabsLabel>
            </TabsTrigger>
            <TabsTrigger value="documents">
              <TabsLabel>Documents</TabsLabel>
            </TabsTrigger>
            <TabsTrigger value="history">
              <TabsLabel>History</TabsLabel>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </ScrollArea>
    </div>
  );
}

function ScrollAreaStickyGroups() {
  return (
    <div className={SCROLL_AREA_PANEL}>
      <ScrollArea className="h-64 w-full" aria-label="Equipment by area">
        {SCROLL_AREA_AREAS.map((area) => (
          <section key={area.id}>
            <h4 className="sticky top-0 z-10 bg-muted-background px-4 py-1.5 text-xs font-medium text-muted-foreground">
              {area.name}
            </h4>
            <ul className="px-4">
              {childrenOf(area.id).map((asset) => (
                <li key={asset.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="truncate text-base-foreground">{asset.name}</span>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">{asset.tag}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </ScrollArea>
    </div>
  );
}

function ScrollAreaStickyTableHeader() {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-xl border border-default">
      <ScrollArea className="h-56 w-full" aria-label="Work orders">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-base-background text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">Work order</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 text-right font-medium">Hours</th>
            </tr>
          </thead>
          <tbody>
            {WORK_ORDERS.map((order) => (
              <tr key={order.id} className="border-t border-default">
                <td className="max-w-0 w-full truncate px-4 py-2 text-base-foreground">{order.title}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={order.status} showIcon={false} />
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-medium-foreground">{order.estimatedHours}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  );
}

function ScrollAreaFadeEdge() {
  return (
    <div className={`relative ${SCROLL_AREA_PANEL}`}>
      <ScrollArea className="h-56 w-full" aria-label="Alarms">
        <ScrollAreaAlarmRows />
        <div className="h-8" aria-hidden="true" />
      </ScrollArea>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-base-background to-transparent"
      />
    </div>
  );
}

function ScrollAreaStartAtLatest() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = rootRef.current?.querySelector('[data-slot="scroll-area-viewport"]');
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  }, []);

  return (
    <div className={SCROLL_AREA_PANEL}>
      <ScrollArea ref={rootRef} className="h-56 w-full" aria-label="Alarm history, oldest first">
        <ul className="space-y-3 p-4">
          {[...ALARMS].reverse().map((alarm) => (
            <li key={alarm.id} className="text-sm">
              <span className="block text-xs tabular-nums text-muted-foreground">
                {formatDate(alarm.raisedAt)}, {formatTime(alarm.raisedAt)}
              </span>
              <span className="block text-base-foreground">{alarm.message}</span>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}

function ScrollAreaBackToTop() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  const scrollToTop = () => {
    const viewport = wrapperRef.current?.querySelector('[data-slot="scroll-area-viewport"]');
    viewport?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      ref={wrapperRef}
      className={`relative ${SCROLL_AREA_PANEL}`}
      onScrollCapture={(event) => {
        if (event.target instanceof HTMLElement) setScrolled(event.target.scrollTop > 48);
      }}
    >
      <ScrollArea className="h-56 w-full" aria-label="Sensors">
        <ScrollAreaSensorRows />
      </ScrollArea>
      {scrolled ? (
        <div className="absolute right-4 bottom-3">
          <Button variant="secondary" size="sm" onClick={scrollToTop}>
            <IconArrowUp /> Back to top
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function ScrollAreaEmpty() {
  return (
    <div className={SCROLL_AREA_PANEL}>
      <ScrollArea className="h-56 w-full" aria-label="Shelved alarms">
        <div className="flex h-56 items-center justify-center p-4">
          <EmptyState>
            <EmptyStateIcon>
              <IconBellOff />
            </EmptyStateIcon>
            <EmptyStateTitle as="p">No shelved alarms</EmptyStateTitle>
            <EmptyStateDescription>Alarms you shelve stay here until they return.</EmptyStateDescription>
          </EmptyState>
        </div>
      </ScrollArea>
    </div>
  );
}

function ScrollAreaLoading() {
  return (
    <div className={SCROLL_AREA_PANEL}>
      <ScrollArea className="h-56 w-full" aria-label="Sensors" aria-busy="true">
        <ul className="divide-y divide-default px-4">
          {SENSORS.slice(0, 8).map((sensor) => (
            <li key={sensor.id} className="flex items-center justify-between gap-4 py-3">
              <span className="flex flex-col gap-1.5">
                <Skeleton className="h-3.5 w-36" />
                <Skeleton className="h-3 w-20" />
              </span>
              <Skeleton className="h-3.5 w-14" />
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
}

function ScrollAreaWithFooter() {
  return (
    <div className={SCROLL_AREA_PANEL}>
      <ScrollArea className="h-48 w-full" aria-label="Sensors">
        <ScrollAreaSensorRows />
      </ScrollArea>
      <p className="border-t border-default px-4 py-2 text-xs text-muted-foreground">
        {SENSORS.length} sensors · 1 without signal
      </p>
    </div>
  );
}

function ScrollAreaInCard() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Active alarms</CardTitle>
          <CardDescription>Gas compression, last 3 days</CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-52 w-full" aria-label="Active alarms">
          <ItemGroup className="pr-3">
            {ALARMS.map((alarm) => (
              <Item key={alarm.id}>
                <ItemContent>
                  <ItemTitle>{alarm.message}</ItemTitle>
                  <ItemDescription>
                    {findAsset(alarm.assetId)?.name} · {formatAgo(alarm.raisedAt)}
                  </ItemDescription>
                </ItemContent>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{alarm.value}</span>
              </Item>
            ))}
          </ItemGroup>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function ScrollAreaSidePanel() {
  const [selected, setSelected] = useState('23-ka-9101');

  return (
    <div className="flex h-64 w-full max-w-xs flex-col overflow-hidden rounded-xl bg-muted-background">
      <p className="px-4 pt-4 pb-2 text-sm font-medium text-base-foreground">Equipment</p>
      <ScrollArea className="min-h-0 w-full flex-1">
        <ItemGroup aria-label="Equipment" className="flex flex-col gap-0.5 px-2 pb-2">
          {SCROLL_AREA_EQUIPMENT.map((asset) => (
            <Item key={asset.id} selected={asset.id === selected}>
              <button
                type="button"
                aria-current={asset.id === selected ? 'true' : undefined}
                onClick={() => setSelected(asset.id)}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-md text-left outline-none focus-visible:shadow-focus-ring"
              >
                <ItemMedia>{asset.type === 'compressor' ? <IconEngine /> : <IconGauge />}</ItemMedia>
                <ItemContent>
                  <ItemTitle>{asset.name}</ItemTitle>
                </ItemContent>
              </button>
            </Item>
          ))}
        </ItemGroup>
      </ScrollArea>
    </div>
  );
}

function ScrollAreaPeopleList() {
  return (
    <div className={SCROLL_AREA_PANEL}>
      <ScrollArea className="h-56 w-full" aria-label="On shift">
        <ItemGroup className="flex flex-col gap-0.5 p-2">
          {PEOPLE.map((person) => (
            <Item key={person.id}>
              <ItemMedia>
                <PersonAvatar name={person.name} initials={person.initials} colorKey={person.id} sizes="xsm" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{person.name}</ItemTitle>
                <ItemDescription>{person.role}</ItemDescription>
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      </ScrollArea>
    </div>
  );
}

function ScrollAreaBoard() {
  return (
    <div className="w-full overflow-hidden rounded-xl bg-muted-background">
      <ScrollArea className="w-full" aria-label="Work order board">
        <div className="flex w-max items-start gap-3 p-4">
          {SCROLL_AREA_BOARD.map((column) => {
            const orders = WORK_ORDERS.filter((order) => order.status === column.status);
            return (
              <section key={column.status} className="flex w-60 flex-col gap-2">
                <h4 className="flex items-center gap-2 text-sm font-medium text-base-foreground">
                  {column.title}
                  <span className="text-xs tabular-nums text-muted-foreground">{orders.length}</span>
                </h4>
                {orders.map((order) => (
                  <article key={order.id} className="flex flex-col gap-2 rounded-lg bg-base-background p-3">
                    <p className="text-sm text-base-foreground">{order.title}</p>
                    <p className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-mono">{order.id}</span>
                      <span>{findPerson(order.assigneeId)?.name ?? 'Unassigned'}</span>
                    </p>
                  </article>
                ))}
              </section>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

function ScrollAreaListDetail() {
  const [selectedId, setSelectedId] = useState(WORK_ORDERS[0].id);
  const order = WORK_ORDERS.find((candidate) => candidate.id === selectedId) ?? WORK_ORDERS[0];

  return (
    <div className="flex h-64 w-full overflow-hidden rounded-xl border border-default">
      <ScrollArea className="h-full w-64 shrink-0 bg-muted-background">
        <ItemGroup aria-label="Work orders" className="flex flex-col gap-0.5 p-2">
          {WORK_ORDERS.map((candidate) => (
            <Item key={candidate.id} selected={candidate.id === selectedId}>
              <button
                type="button"
                aria-current={candidate.id === selectedId ? 'true' : undefined}
                onClick={() => setSelectedId(candidate.id)}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-md text-left outline-none focus-visible:shadow-focus-ring"
              >
                <ItemMedia>
                  <IconStack2 />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{candidate.title}</ItemTitle>
                  <ItemDescription>{candidate.id}</ItemDescription>
                </ItemContent>
              </button>
            </Item>
          ))}
        </ItemGroup>
      </ScrollArea>
      <ScrollArea className="h-full min-w-0 flex-1" aria-label="Work order detail">
        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <h4 className="text-base font-medium text-base-foreground">{order.title}</h4>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-sm text-medium-foreground">
            {findAsset(order.assetId)?.name} · {order.type} · {order.priority} · due {formatDate(order.dueAt)}
          </p>
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-5 text-medium-foreground">
            {SCROLL_AREA_PROCEDURE.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </ScrollArea>
    </div>
  );
}

export default definePage({
  id: 'scroll-area',
  title: 'Scroll area',
  summary:
    'A scroll area keeps long content inside a fixed region and replaces the native scrollbars with thin themed ones that look the same on every platform.',
  docsSlug: 'scroll-area',
  guidance: {
    use: [
      'A region with a fixed height or width inside a panel, card or popover.',
      'Give the scroll area a size; the content inside decides which bars appear.',
      'Name the region with aria-label when it is not labelled by a visible heading.',
      'Keep one obvious scroll direction per region.',
    ],
    avoid: [
      'Wrapping the whole page — let the document scroll natively.',
      'Nested regions that scroll in the same direction.',
      'Hiding content that people must read, such as errors, below the fold of a small region.',
      'Using it for rows in the thousands; use a virtualised data grid.',
    ],
  },
  source,
  sections: [
    {
      id: 'direction',
      title: 'Direction',
      description: 'The content decides: bars appear only on the axes that overflow.',
      specimens: [
        {
          id: 'ScrollAreaVertical',
          title: 'Vertical',
          note: 'A list that is longer than the panel that holds it.',
          origin: 'aura',
          align: 'stretch',
          Component: ScrollAreaVertical,
        },
        {
          id: 'ScrollAreaHorizontal',
          title: 'Horizontal',
          note: 'A single row of tiles that should not wrap onto a second line.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ScrollAreaHorizontal,
        },
        {
          id: 'ScrollAreaBothAxes',
          title: 'Both axes',
          note: 'A small table that is wider and taller than its slot.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx'],
          Component: ScrollAreaBothAxes,
        },
        {
          id: 'ScrollAreaFits',
          title: 'Content that fits',
          note: 'No bars are shown when nothing overflows, so it is safe to wrap lists of unknown length.',
          origin: 'aura',
          align: 'stretch',
          Component: ScrollAreaFits,
        },
      ],
    },
    {
      id: 'content',
      title: 'Content',
      description: 'What usually ends up inside a scroll area.',
      specimens: [
        {
          id: 'ScrollAreaTagRow',
          title: 'Tag row',
          note: 'Many tags in a narrow column where wrapping would push content down.',
          origin: 'aura',
          Component: ScrollAreaTagRow,
        },
        {
          id: 'ScrollAreaWideTabs',
          title: 'Tabs wider than the panel',
          note: 'More tabs than fit in a side panel; the row scrolls instead of wrapping.',
          origin: 'aura',
          Component: ScrollAreaWideTabs,
        },
        {
          id: 'ScrollAreaOptionList',
          title: 'Option list',
          note: 'A long set of filter options in a popover or filter panel.',
          origin: 'aura',
          align: 'stretch',
          Component: ScrollAreaOptionList,
        },
        {
          id: 'ScrollAreaLongText',
          title: 'Long text',
          note: 'A procedure or description that must stay next to the form it belongs to.',
          origin: 'aura',
          align: 'stretch',
          Component: ScrollAreaLongText,
        },
        {
          id: 'ScrollAreaPeopleList',
          title: 'People list',
          note: 'Rows with avatars, such as who is on shift or who can access a data set.',
          origin: 'custom',
          align: 'stretch',
          uses: ['display/PersonAvatar.tsx'],
          Component: ScrollAreaPeopleList,
        },
        {
          id: 'ScrollAreaEventLog',
          title: 'Event log',
          note: 'Monospaced log lines that must not wrap, on a tinted surface.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ScrollAreaEventLog,
        },
      ],
    },
    {
      id: 'structure',
      title: 'Sticky parts and hints',
      description: 'Keeping context in view and showing that there is more to see.',
      specimens: [
        {
          id: 'ScrollAreaStickyGroups',
          title: 'Sticky group headers',
          note: 'Grouped lists where people need to know which group they are in.',
          origin: 'aura',
          align: 'stretch',
          Component: ScrollAreaStickyGroups,
        },
        {
          id: 'ScrollAreaStickyTableHeader',
          title: 'Sticky table header',
          note: 'A short read-only table where column names must stay visible.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/StatusBadge.tsx'],
          Component: ScrollAreaStickyTableHeader,
        },
        {
          id: 'ScrollAreaFadeEdge',
          title: 'Fade at the edge',
          note: 'Hints that the list continues when the last visible row happens to end cleanly.',
          origin: 'custom',
          align: 'stretch',
          Component: ScrollAreaFadeEdge,
        },
        {
          id: 'ScrollAreaWithFooter',
          title: 'Fixed footer',
          note: 'A count or summary that stays put while the rows scroll.',
          origin: 'aura',
          align: 'stretch',
          Component: ScrollAreaWithFooter,
        },
        {
          id: 'ScrollAreaStartAtLatest',
          title: 'Start at the latest',
          note: 'Logs and histories read oldest to newest, opened at the newest entry.',
          origin: 'custom',
          align: 'stretch',
          Component: ScrollAreaStartAtLatest,
        },
        {
          id: 'ScrollAreaBackToTop',
          title: 'Back to top',
          note: 'Long lists where the controls live above the region. Scroll to see the button.',
          origin: 'custom',
          align: 'stretch',
          Component: ScrollAreaBackToTop,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'The region keeps its size while content is loading or missing.',
      specimens: [
        {
          id: 'ScrollAreaLoading',
          title: 'Loading',
          note: 'Skeleton rows in the same rhythm as the real ones, so nothing jumps when data arrives.',
          origin: 'aura',
          align: 'stretch',
          Component: ScrollAreaLoading,
        },
        {
          id: 'ScrollAreaEmpty',
          title: 'Empty',
          note: 'The region holds its height and centres an empty state.',
          origin: 'aura',
          align: 'stretch',
          Component: ScrollAreaEmpty,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'Scroll areas inside cards, panels and split layouts.',
      specimens: [
        {
          id: 'ScrollAreaInCard',
          title: 'Card list',
          note: 'A dashboard card whose list must not make the card taller than its neighbours.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ScrollAreaInCard,
        },
        {
          id: 'ScrollAreaSidePanel',
          title: 'Side panel navigation',
          note: 'A fixed heading with a scrolling list below it that fills the remaining height.',
          origin: 'aura',
          align: 'stretch',
          surface: 'base',
          Component: ScrollAreaSidePanel,
        },
        {
          id: 'ScrollAreaBoard',
          title: 'Board',
          note: 'Columns of a fixed width that scroll sideways when the board is wider than the page.',
          origin: 'aura',
          size: 'lg',
          align: 'stretch',
          Component: ScrollAreaBoard,
        },
        {
          id: 'ScrollAreaListDetail',
          title: 'List and detail',
          note: 'Two regions that scroll independently, so the list keeps its place while the detail is read.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['display/StatusBadge.tsx'],
          Component: ScrollAreaListDetail,
        },
      ],
    },
  ],
});
