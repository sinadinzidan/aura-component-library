import { Avatar, AvatarFallback } from '@cognite/aura/components/avatar';
import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { Card, CardContent, CardHeader, CardHeaderCenter, CardHeaderEnd, CardTitle } from '@cognite/aura/components/card';
import { Count, CountValue } from '@cognite/aura/components/count';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@cognite/aura/components/dropdown-menu';
import {
  Item,
  ItemActions,
  ItemCheckbox,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSectionHeader,
  ItemSectionHeaderChevron,
  ItemSectionHeaderTitle,
  ItemTitle,
} from '@cognite/aura/components/item';
import { Separator } from '@cognite/aura/components/separator';
import { Switch } from '@cognite/aura/components/switch';
import {
  IconBell,
  IconChartLine,
  IconChevronRight,
  IconDatabase,
  IconDots,
  IconDownload,
  IconEngine,
  IconFileText,
  IconFolder,
  IconLayoutGrid,
  IconPencil,
  IconSettings,
  IconTimeline,
  IconTool,
  IconTrash,
} from '@cognite/aura/icons';
import { useState } from 'react';

import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { StatusBadge } from '../../../library/display/StatusBadge';
import { ALARMS, ASSETS, PEOPLE, SENSORS, WORK_ORDERS } from '../../data/plant';
import type { Severity } from '../../data/plant';
import { formatAgo } from '../../data/series';
import { definePage } from '../../types';

import source from './item.tsx?raw';

const AREAS = ASSETS.filter((asset) => asset.type === 'area');
const COMPRESSORS = ASSETS.filter((asset) => asset.type === 'compressor');
const PUMPS = ASSETS.filter((asset) => asset.type === 'pump');
const INGRID = PEOPLE[0];

const SEVERITY_BADGE: Record<Severity, { label: string; variant: 'error' | 'warning' | 'archived' }> = {
  critical: { label: 'Critical', variant: 'error' },
  high: { label: 'High', variant: 'warning' },
  medium: { label: 'Medium', variant: 'warning' },
  low: { label: 'Low', variant: 'archived' },
};

/** Wrapper classes that centre a width-capped list in a stretched frame. */
const FRAME = 'mx-auto w-full max-w-sm self-center';

/** Makes the whole row clickable while the `li` stays a list item. */
const ROW_BUTTON = 'flex min-w-0 flex-1 items-center gap-2 text-left outline-none';

function ItemTitleOnly() {
  return (
    <ItemGroup className={FRAME}>
      <Item>
        <ItemContent>
          <ItemTitle>Inlet and separation</ItemTitle>
        </ItemContent>
      </Item>
      <Item>
        <ItemContent>
          <ItemTitle>Gas compression</ItemTitle>
        </ItemContent>
      </Item>
      <Item>
        <ItemContent>
          <ItemTitle>Gas export</ItemTitle>
        </ItemContent>
      </Item>
    </ItemGroup>
  );
}

function ItemWithDescription() {
  return (
    <ItemGroup className={FRAME}>
      {AREAS.map((area) => (
        <Item key={area.id}>
          <ItemContent>
            <ItemTitle>{area.name}</ItemTitle>
            <ItemDescription>
              {area.tag} · Health score {area.healthScore}
            </ItemDescription>
          </ItemContent>
        </Item>
      ))}
    </ItemGroup>
  );
}

function ItemWithIcon() {
  return (
    <ItemGroup className={FRAME}>
      <Item>
        <ItemMedia>
          <IconDatabase />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Compressor telemetry</ItemTitle>
        </ItemContent>
      </Item>
      <Item>
        <ItemMedia>
          <IconTimeline />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>23-PT-92531</ItemTitle>
        </ItemContent>
      </Item>
      <Item>
        <ItemMedia>
          <IconFileText />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Bearing inspection procedure</ItemTitle>
        </ItemContent>
      </Item>
    </ItemGroup>
  );
}

function ItemWithAvatar() {
  return (
    <ItemGroup className={FRAME}>
      <Item>
        <ItemMedia>
          <Avatar variant="decorative-2" sizes="xsm" aria-hidden="true">
            <AvatarFallback>{INGRID.initials}</AvatarFallback>
          </Avatar>
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{INGRID.name}</ItemTitle>
          <ItemDescription>{INGRID.role}</ItemDescription>
        </ItemContent>
      </Item>
    </ItemGroup>
  );
}

function ItemWithCheckbox() {
  const [checked, setChecked] = useState(true);

  return (
    <ItemGroup className={FRAME}>
      <Item>
        <ItemCheckbox aria-label="Include compressor telemetry" checked={checked} onCheckedChange={setChecked} />
        <ItemContent>
          <ItemTitle>Compressor telemetry</ItemTitle>
          <ItemDescription>1,284 time series</ItemDescription>
        </ItemContent>
      </Item>
    </ItemGroup>
  );
}

function ItemSelected() {
  const [current, setCurrent] = useState(AREAS[1].id);

  return (
    <ItemGroup className={FRAME} aria-label="Plant areas">
      {AREAS.map((area) => (
        <Item key={area.id} selected={current === area.id}>
          <button
            type="button"
            className={ROW_BUTTON}
            aria-current={current === area.id ? 'true' : undefined}
            onClick={() => setCurrent(area.id)}
          >
            <ItemMedia>
              <IconFolder />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{area.name}</ItemTitle>
            </ItemContent>
          </button>
        </Item>
      ))}
    </ItemGroup>
  );
}

function ItemDisabled() {
  return (
    <ItemGroup className={FRAME}>
      <Item>
        <ItemMedia>
          <IconDatabase />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Compressor telemetry</ItemTitle>
          <ItemDescription>1,284 time series</ItemDescription>
        </ItemContent>
      </Item>
      <Item disabled aria-disabled="true">
        <ItemMedia>
          <IconDatabase />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Maintenance history</ItemTitle>
          <ItemDescription>You need read access to open this data set.</ItemDescription>
        </ItemContent>
      </Item>
    </ItemGroup>
  );
}

function ItemHoverActions() {
  return (
    <ItemGroup className={FRAME}>
      {SENSORS.slice(0, 3).map((sensor) => (
        <Item key={sensor.id}>
          <ItemMedia>
            <IconTimeline />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{sensor.name}</ItemTitle>
          </ItemContent>
          <ItemActions>
            <Button variant="ghost" size="icon-sm" aria-label={`Rename ${sensor.name}`}>
              <IconPencil />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label={`Remove ${sensor.name}`}>
              <IconTrash />
            </Button>
          </ItemActions>
        </Item>
      ))}
    </ItemGroup>
  );
}

function ItemTruncated() {
  return (
    <ItemGroup className="mx-auto w-full max-w-60 self-center">
      <Item>
        <ItemMedia>
          <IconFileText />
        </ItemMedia>
        <ItemContent>
          <ItemTitle title="Recompressor drive-end bearing inspection procedure rev 4">
            Recompressor drive-end bearing inspection procedure rev 4
          </ItemTitle>
          <ItemDescription>Updated by Tomás Barros on 4 March after the last overhaul</ItemDescription>
        </ItemContent>
      </Item>
    </ItemGroup>
  );
}

function ItemMultiSelect() {
  const orders = WORK_ORDERS.slice(0, 4);
  const [selected, setSelected] = useState<readonly string[]>([orders[1].id]);

  return (
    <div className={`flex flex-col gap-2 ${FRAME}`}>
      <ItemGroup>
        {orders.map((order) => (
          <Item key={order.id} selected={selected.includes(order.id)}>
            <ItemCheckbox
              aria-label={`Select ${order.title}`}
              checked={selected.includes(order.id)}
              onCheckedChange={(checked) =>
                setSelected(checked ? [...selected, order.id] : selected.filter((other) => other !== order.id))
              }
            />
            <ItemContent>
              <ItemTitle>{order.title}</ItemTitle>
            </ItemContent>
          </Item>
        ))}
      </ItemGroup>
      <p className="px-2 text-xs text-muted-foreground" aria-live="polite">
        {selected.length} of {orders.length} selected
      </p>
    </div>
  );
}

function ItemWithBadge() {
  return (
    <ItemGroup className={FRAME}>
      {COMPRESSORS.map((asset) => (
        <Item key={asset.id}>
          <ItemMedia>
            <IconEngine />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{asset.name}</ItemTitle>
            <ItemDescription>{asset.tag}</ItemDescription>
          </ItemContent>
          <StatusBadge status={asset.state} />
        </Item>
      ))}
    </ItemGroup>
  );
}

function ItemWithCount() {
  return (
    <ItemGroup className={FRAME}>
      {AREAS.map((area) => (
        <Item key={area.id}>
          <ItemMedia>
            <IconFolder />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{area.name}</ItemTitle>
            <ItemDescription>{area.tag}</ItemDescription>
          </ItemContent>
          <Count aria-label={`${ASSETS.filter((asset) => asset.parentId === area.id).length} assets`}>
            <CountValue>{ASSETS.filter((asset) => asset.parentId === area.id).length}</CountValue>
          </Count>
        </Item>
      ))}
    </ItemGroup>
  );
}

function ItemWithSwitch() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({ alarms: true, orders: true, reports: false });
  const rows = [
    { id: 'alarms', title: 'Critical alarms', description: 'As soon as an alarm is raised' },
    { id: 'orders', title: 'Work orders assigned to me', description: 'When I am added or the status changes' },
    { id: 'reports', title: 'Daily production report', description: 'Every morning at 06:00' },
  ];

  return (
    <ItemGroup className={FRAME}>
      {rows.map((row) => (
        <Item key={row.id}>
          <ItemContent>
            <ItemTitle>{row.title}</ItemTitle>
            <ItemDescription>{row.description}</ItemDescription>
          </ItemContent>
          <Switch
            aria-label={row.title}
            checked={enabled[row.id]}
            onCheckedChange={(checked) => setEnabled({ ...enabled, [row.id]: checked })}
          />
        </Item>
      ))}
    </ItemGroup>
  );
}

function ItemWithMenu() {
  return (
    <ItemGroup className={FRAME}>
      {['Compression overview', 'Vibration watchlist'].map((name) => (
        <Item key={name}>
          <ItemMedia>
            <IconChartLine />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{name}</ItemTitle>
          </ItemContent>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${name}`}>
                  <IconDots />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Rename</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Item>
      ))}
    </ItemGroup>
  );
}

function ItemDrillIn() {
  return (
    <ItemGroup className={FRAME}>
      {AREAS.map((area) => (
        <Item key={area.id}>
          <button type="button" className={ROW_BUTTON}>
            <ItemContent>
              <ItemTitle>{area.name}</ItemTitle>
              <ItemDescription>{ASSETS.filter((asset) => asset.parentId === area.id).length} assets</ItemDescription>
            </ItemContent>
            <IconChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </button>
        </Item>
      ))}
    </ItemGroup>
  );
}

function ItemSectionHeaders() {
  return (
    <div className={`flex flex-col gap-3 ${FRAME}`}>
      <div>
        <ItemSectionHeader>
          <ItemSectionHeaderTitle>Compressors</ItemSectionHeaderTitle>
        </ItemSectionHeader>
        <ItemGroup>
          {COMPRESSORS.map((asset) => (
            <Item key={asset.id}>
              <ItemMedia>
                <IconEngine />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{asset.name}</ItemTitle>
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      </div>
      <div>
        <ItemSectionHeader>
          <ItemSectionHeaderTitle>Pumps</ItemSectionHeaderTitle>
        </ItemSectionHeader>
        <ItemGroup>
          {PUMPS.map((asset) => (
            <Item key={asset.id}>
              <ItemMedia>
                <IconTool />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{asset.name}</ItemTitle>
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      </div>
    </div>
  );
}

function ItemCollapsibleSection() {
  const [open, setOpen] = useState(true);

  return (
    <div className={`pl-3 ${FRAME}`}>
      <ItemSectionHeader>
        <button
          type="button"
          className={ROW_BUTTON}
          aria-expanded={open}
          aria-controls="item-collapsible-compressors"
          onClick={() => setOpen(!open)}
        >
          <ItemSectionHeaderChevron open={open} />
          <ItemSectionHeaderTitle>Compressors</ItemSectionHeaderTitle>
        </button>
        <Badge variant="secondary" dot>
          {COMPRESSORS.length}
        </Badge>
      </ItemSectionHeader>
      <ItemGroup id="item-collapsible-compressors" hidden={!open}>
        {COMPRESSORS.map((asset) => (
          <Item key={asset.id}>
            <ItemMedia>
              <IconEngine />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{asset.name}</ItemTitle>
            </ItemContent>
          </Item>
        ))}
      </ItemGroup>
    </div>
  );
}

function ItemSeparatedGroups() {
  return (
    <div className={`flex flex-col gap-1 ${FRAME}`}>
      <ItemGroup>
        <Item>
          <ItemMedia>
            <IconLayoutGrid />
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
            <IconTool />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Work orders</ItemTitle>
          </ItemContent>
        </Item>
      </ItemGroup>
      <Separator />
      <ItemGroup>
        <Item>
          <ItemMedia>
            <IconSettings />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Settings</ItemTitle>
          </ItemContent>
        </Item>
      </ItemGroup>
    </div>
  );
}

function ItemInCard() {
  return (
    <Card className={FRAME}>
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Linked time series</CardTitle>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <Button variant="ghost" size="sm">
            View all
          </Button>
        </CardHeaderEnd>
      </CardHeader>
      <CardContent>
        <ItemGroup className="-mx-2 w-full">
          {SENSORS.slice(0, 3).map((sensor) => (
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

function ItemPeopleList() {
  return (
    <ItemGroup className={FRAME}>
      {PEOPLE.slice(0, 4).map((person, index) => (
        <Item key={person.id}>
          <ItemMedia>
            <PersonAvatar name={person.name} colorKey={person.id} sizes="xsm" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{person.name}</ItemTitle>
            <ItemDescription>{person.role}</ItemDescription>
          </ItemContent>
          {index === 0 ? (
            <Badge variant="secondary">Owner</Badge>
          ) : (
            <ItemActions>
              <Button variant="ghost" size="sm">
                Remove
              </Button>
            </ItemActions>
          )}
        </Item>
      ))}
    </ItemGroup>
  );
}

function ItemAlarmList() {
  return (
    <ItemGroup className="mx-auto w-full max-w-md self-center">
      {ALARMS.slice(0, 4).map((alarm) => (
        <Item key={alarm.id}>
          <ItemContent>
            <ItemTitle>{alarm.message}</ItemTitle>
            <ItemDescription>
              {alarm.sensorTag} · {alarm.value} · {formatAgo(alarm.raisedAt)}
            </ItemDescription>
          </ItemContent>
          <Badge variant={SEVERITY_BADGE[alarm.severity].variant}>{SEVERITY_BADGE[alarm.severity].label}</Badge>
        </Item>
      ))}
    </ItemGroup>
  );
}

function ItemFileList() {
  const files = [
    { name: 'Bearing inspection procedure.pdf', detail: 'PDF · 1.2 MB' },
    { name: '23-KA-9103 datasheet.pdf', detail: 'PDF · 640 kB' },
    { name: 'Vibration survey 2026-03.csv', detail: 'CSV · 88 kB' },
  ];

  return (
    <ItemGroup className={FRAME}>
      {files.map((file) => (
        <Item key={file.name}>
          <ItemMedia>
            <IconFileText />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{file.name}</ItemTitle>
            <ItemDescription>{file.detail}</ItemDescription>
          </ItemContent>
          <Button variant="ghost" size="icon-sm" aria-label={`Download ${file.name}`}>
            <IconDownload />
          </Button>
        </Item>
      ))}
    </ItemGroup>
  );
}

function ItemSearchResults() {
  const results = [
    { id: 'asset', icon: IconEngine, title: 'Recompressor', detail: 'Asset · 23-KA-9103' },
    { id: 'series', icon: IconTimeline, title: 'Recompressor vibration', detail: 'Time series · 23-VT-92740' },
    { id: 'order', icon: IconTool, title: 'Inspect recompressor drive-end bearing', detail: 'Work order · WO-104482' },
    { id: 'file', icon: IconFileText, title: '23-KA-9103 datasheet.pdf', detail: 'Document · 640 kB' },
  ];

  return (
    <div className={`flex flex-col gap-1 ${FRAME}`}>
      <p className="px-2 text-xs text-muted-foreground">4 results for “recompressor”</p>
      <ItemGroup>
        {results.map((result) => (
          <Item key={result.id}>
            <button type="button" className={ROW_BUTTON}>
              <ItemMedia>
                <result.icon />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{result.title}</ItemTitle>
                <ItemDescription>{result.detail}</ItemDescription>
              </ItemContent>
            </button>
          </Item>
        ))}
      </ItemGroup>
    </div>
  );
}

function ItemNavigation() {
  const [current, setCurrent] = useState('alarms');
  const destinations = [
    { id: 'overview', label: 'Overview', icon: IconLayoutGrid, count: 0 },
    { id: 'alarms', label: 'Alarms', icon: IconBell, count: 3 },
    { id: 'work-orders', label: 'Work orders', icon: IconTool, count: 6 },
    { id: 'trends', label: 'Trends', icon: IconChartLine, count: 0 },
  ];

  return (
    <nav aria-label="Asset sections" className="mx-auto w-full max-w-56 self-center">
      <ItemGroup>
        {destinations.map((destination) => (
          <Item key={destination.id} selected={current === destination.id}>
            <button
              type="button"
              className={ROW_BUTTON}
              aria-current={current === destination.id ? 'page' : undefined}
              onClick={() => setCurrent(destination.id)}
            >
              <ItemMedia>
                <destination.icon />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{destination.label}</ItemTitle>
              </ItemContent>
              {destination.count > 0 ? (
                <Badge variant="secondary" dot>
                  {destination.count}
                </Badge>
              ) : null}
            </button>
          </Item>
        ))}
      </ItemGroup>
    </nav>
  );
}

export default definePage({
  id: 'item',
  title: 'Item',
  summary:
    'An item is a compact row: a title, an optional description, leading media and trailing content or actions. Items compose into groups for lists, navigation, cards and popovers.',
  docsSlug: 'item',
  guidance: {
    use: [
      'Rows in a list or tree that people select, open or act on.',
      'One line for the title and one for the description; both truncate.',
      'Buttons and links inside the row, so the list keeps its semantics.',
      'Section headers next to the group, not inside it, to label a set of rows.',
    ],
    avoid: [
      'An item as a general container — that is a Card.',
      'Many columns of data in one row — use a data grid.',
      'Hover-only actions as the single way to do something; touch has no hover.',
      'A disabled row without saying why it is unavailable.',
    ],
  },
  source,
  sections: [
    {
      id: 'anatomy',
      title: 'Anatomy',
      description: 'The parts of a row, from a bare title to leading media.',
      specimens: [
        {
          id: 'ItemTitleOnly',
          title: 'Title only',
          note: 'The densest list: short names that need no explanation.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ItemTitleOnly,
        },
        {
          id: 'ItemWithDescription',
          title: 'With description',
          note: 'A second line for the detail that tells similar rows apart.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ItemWithDescription,
        },
        {
          id: 'ItemWithIcon',
          title: 'With icon',
          note: 'Mixed lists where the icon says what kind of thing each row is.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ItemWithIcon,
        },
        {
          id: 'ItemWithAvatar',
          title: 'With avatar',
          note: 'A person or team; the avatar sets its own size.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ItemWithAvatar,
        },
        {
          id: 'ItemWithCheckbox',
          title: 'With checkbox',
          note: 'A row the user can include or leave out.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ItemWithCheckbox,
        },
        {
          id: 'ItemTruncated',
          title: 'Truncated',
          note: 'Long names in a narrow panel: one line each, with the full title on hover.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ItemTruncated,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'Selected, unavailable, and rows that reveal more on hover or focus.',
      specimens: [
        {
          id: 'ItemSelected',
          title: 'Selected',
          note: 'Marks the current row in a master list. Click a row to try.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ItemSelected,
        },
        {
          id: 'ItemDisabled',
          title: 'Disabled with reason',
          note: 'A row that exists but cannot be used; the description says why.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ItemDisabled,
        },
        {
          id: 'ItemHoverActions',
          title: 'Actions on hover',
          note: 'Secondary row actions that would be noise if always visible. Hover or tab into a row.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ItemHoverActions,
        },
        {
          id: 'ItemMultiSelect',
          title: 'Multi-select',
          note: 'Picking several rows for a bulk action; selected rows are also highlighted.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ItemMultiSelect,
        },
      ],
    },
    {
      id: 'trailing-content',
      title: 'Trailing content',
      description: 'What can close a row: status, a number, a control, a menu or a direction.',
      specimens: [
        {
          id: 'ItemWithBadge',
          title: 'With status badge',
          note: 'The state of each row, aligned at the end so it scans as a column.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/StatusBadge.tsx'],
          Component: ItemWithBadge,
        },
        {
          id: 'ItemWithCount',
          title: 'With count',
          note: 'How many things each row contains.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ItemWithCount,
        },
        {
          id: 'ItemWithSwitch',
          title: 'With switch',
          note: 'Settings that take effect immediately, one per row.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ItemWithSwitch,
        },
        {
          id: 'ItemWithMenu',
          title: 'With overflow menu',
          note: 'Three or more row actions, always reachable, including on touch.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ItemWithMenu,
        },
        {
          id: 'ItemDrillIn',
          title: 'Drill-in',
          note: 'The whole row opens a deeper level; the chevron says so.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ItemDrillIn,
        },
        {
          id: 'ItemFileList',
          title: 'With a visible action',
          note: 'One primary action per row that should not hide behind hover, such as download.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ItemFileList,
        },
      ],
    },
    {
      id: 'groups',
      title: 'Groups',
      description: 'Labelling, collapsing and dividing sets of rows.',
      specimens: [
        {
          id: 'ItemSectionHeaders',
          title: 'Section headers',
          note: 'A long list that falls into a few named groups.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ItemSectionHeaders,
        },
        {
          id: 'ItemCollapsibleSection',
          title: 'Collapsible section',
          note: 'Groups the user may want out of the way; the chevron follows the open state. Click to try.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ItemCollapsibleSection,
        },
        {
          id: 'ItemSeparatedGroups',
          title: 'Groups with a separator',
          note: 'Two unrelated sets that need no label, such as destinations and settings.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ItemSeparatedGroups,
        },
        {
          id: 'ItemInCard',
          title: 'In a card',
          note: 'A short list under a card heading; the rows bleed to the card padding so hover lines up.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ItemInCard,
        },
      ],
    },
    {
      id: 'in-context',
      title: 'In context',
      description: 'Rows as they appear in real panels.',
      specimens: [
        {
          id: 'ItemNavigation',
          title: 'Section navigation',
          note: 'Secondary navigation inside a page, with counts on the sections that have something waiting.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ItemNavigation,
        },
        {
          id: 'ItemPeopleList',
          title: 'Members',
          note: 'People with access: role on the second line, the owner marked, remove on hover.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/PersonAvatar.tsx'],
          Component: ItemPeopleList,
        },
        {
          id: 'ItemSearchResults',
          title: 'Search results',
          note: 'Mixed result types in one list: the icon and second line say what each hit is.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ItemSearchResults,
        },
        {
          id: 'ItemAlarmList',
          title: 'Alarm list',
          note: 'Events in a side panel: message first, source and age below, severity at the end.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: ItemAlarmList,
        },
      ],
    },
  ],
});
