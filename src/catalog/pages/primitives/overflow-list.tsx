import { Avatar, AvatarFallback } from '@cognite/aura/components/avatar';
import { Badge } from '@cognite/aura/components/badge';
import {
  Breadcrumb,
  BreadcrumbEllipsisButton,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
} from '@cognite/aura/components/breadcrumb';
import { Button } from '@cognite/aura/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@cognite/aura/components/dropdown-menu';
import { Label } from '@cognite/aura/components/label';
import { OverflowList } from '@cognite/aura/components/overflow-list';
import type { OverflowMeasurement } from '@cognite/aura/components/overflow-list';
import { Popover, PopoverContent, PopoverTrigger } from '@cognite/aura/components/popover';
import { Slider } from '@cognite/aura/components/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import {
  IconCopy,
  IconDownload,
  IconPencil,
  IconShare,
  IconTrash,
  IconUserPlus,
  IconX,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactElement } from 'react';

import { OverflowActions } from '../../../library/data/OverflowActions';
import type { OverflowAction } from '../../../library/data/OverflowActions';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { ASSETS, PEOPLE, SENSORS, sensorsOf } from '../../data/plant';
import { definePage } from '../../types';

import source from './overflow-list.tsx?raw';

type OverflowProps = { items: ReactElement[] };

const OVERFLOW_TAGS = SENSORS.slice(0, 7).map((sensor) => sensor.tag);

const OVERFLOW_LABELS = ['Compressor', 'Criticality A', 'Rotating', 'Gas compression', 'Vibration watch', 'Nordkapp'];

const OVERFLOW_PATH = [
  { id: 'nordkapp', label: 'Nordkapp plant' },
  { id: 'compression', label: 'Gas compression' },
  { id: 'train', label: 'Compression train 1' },
  { id: 'compressor', label: '1st stage compressor' },
  { id: 'bearing', label: 'Drive-end bearing' },
];

const OVERFLOW_NAV = ['Overview', 'Sensors', 'Alarms', 'Work orders', 'Documents', 'History', '3D model'];

const OVERFLOW_ACTIONS: readonly OverflowAction[] = [
  { id: 'assign', label: 'Assign', icon: <IconUserPlus />, onSelect: () => undefined },
  { id: 'edit', label: 'Edit', icon: <IconPencil />, onSelect: () => undefined },
  { id: 'share', label: 'Share', icon: <IconShare />, onSelect: () => undefined },
  { id: 'duplicate', label: 'Duplicate', icon: <IconCopy />, onSelect: () => undefined },
  { id: 'export', label: 'Export', icon: <IconDownload />, onSelect: () => undefined },
  { id: 'delete', label: 'Delete', icon: <IconTrash />, onSelect: () => undefined, destructive: true },
];

const OVERFLOW_EQUIPMENT = ASSETS.filter((asset) => sensorsOf(asset.id).length > 0);

/** OverflowList keys its children like `Children.toArray`, so the original key comes back prefixed. */
function overflowKeys(items: ReactElement[]): string[] {
  return items.map((item) => String(item.key ?? '').replace(/^\.\$/, ''));
}

function OverflowListCount({ items }: OverflowProps) {
  return <Badge variant="secondary">+{items.length}</Badge>;
}

function OverflowListCountWithTooltip({ items }: OverflowProps) {
  const hidden = overflowKeys(items);
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Badge variant="secondary" render={<button type="button" aria-label={`${hidden.length} more: ${hidden.join(', ')}`} />}>
            +{hidden.length}
          </Badge>
        }
      />
      <TooltipContent>{hidden.join(', ')}</TooltipContent>
    </Tooltip>
  );
}

function OverflowListCountWithPopover({ items }: OverflowProps) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="sm">
            +{items.length} more
          </Button>
        }
      />
      <PopoverContent align="end">
        <div className="flex max-w-64 flex-wrap gap-2">{items}</div>
      </PopoverContent>
    </Popover>
  );
}

function OverflowListPathMenu({ items }: OverflowProps) {
  const hidden = overflowKeys(items);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<BreadcrumbEllipsisButton aria-label="Show hidden levels" />} />
      <DropdownMenuContent align="start">
        {OVERFLOW_PATH.filter((level) => hidden.includes(level.id)).map((level) => (
          <DropdownMenuItem key={level.id}>{level.label}</DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function OverflowListNavMenu({ items }: OverflowProps) {
  const hidden = overflowKeys(items);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="sm">
            More
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {hidden.map((label) => (
          <DropdownMenuItem key={label}>{label}</DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function OverflowListAvatarCount({ items }: OverflowProps) {
  const hidden = overflowKeys(items);
  const names = PEOPLE.filter((person) => hidden.includes(person.id)).map((person) => person.name);
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={`${names.length} more: ${names.join(', ')}`}
            className="inline-flex rounded-lg outline-none focus-visible:shadow-focus-ring"
          >
            <Avatar variant="overflow" aria-hidden="true">
              <AvatarFallback>+{names.length}</AvatarFallback>
            </Avatar>
          </button>
        }
      />
      <TooltipContent>{names.join(', ')}</TooltipContent>
    </Tooltip>
  );
}

function OverflowListMetaCount({ items }: OverflowProps) {
  return <span className="text-muted-foreground">+{items.length} more</span>;
}

function OverflowListFromEnd() {
  return (
    <div className="w-64">
      <OverflowList collapseOrder="desc" overflowComponent={OverflowListCount} className="gap-2">
        {OVERFLOW_TAGS.map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
          </Badge>
        ))}
      </OverflowList>
    </div>
  );
}

function OverflowListFromStart() {
  return (
    <div className="w-64">
      <OverflowList collapseOrder="asc" overflowComponent={OverflowListCount} className="gap-2">
        {OVERFLOW_TAGS.map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
          </Badge>
        ))}
      </OverflowList>
    </div>
  );
}

function OverflowListFromStartCountAtEnd() {
  return (
    <div className="w-64">
      <OverflowList collapseOrder="asc" overflowPosition="end" overflowComponent={OverflowListCount} className="gap-2">
        {OVERFLOW_TAGS.map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
          </Badge>
        ))}
      </OverflowList>
    </div>
  );
}

function OverflowListKeepFirstAndLast() {
  return (
    <div className="w-md max-w-full">
      <OverflowList
        collapseOrder="innerAscFirstKeepLast"
        overflowComponent={OverflowListCount}
        separator={<span className="px-1.5 text-muted-foreground">/</span>}
      >
        {OVERFLOW_PATH.map((level) => (
          <span key={level.id} className="text-sm text-medium-foreground">
            {level.label}
          </span>
        ))}
      </OverflowList>
    </div>
  );
}

function OverflowListKeepLast() {
  return (
    <div className="w-md max-w-full">
      <OverflowList
        collapseOrder="innerDescFirstKeepLast"
        overflowComponent={OverflowListCount}
        separator={<span className="px-1.5 text-muted-foreground">/</span>}
      >
        {OVERFLOW_PATH.map((level) => (
          <span key={level.id} className="text-sm text-medium-foreground">
            {level.label}
          </span>
        ))}
      </OverflowList>
    </div>
  );
}

function OverflowListPriority() {
  return (
    <div className="w-64">
      <OverflowList collapseOrder={[5, 3, 2, 4, 1]} overflowPosition="end" overflowComponent={OverflowListCount} className="gap-2">
        {OVERFLOW_LABELS.map((label, index) => (
          <Badge key={label} variant={index === 0 ? 'decorative-1' : 'secondary'}>
            {label}
          </Badge>
        ))}
      </OverflowList>
    </div>
  );
}

function OverflowListGroupedUnits() {
  return (
    <div className="w-72">
      <OverflowList
        collapseOrder={[
          [4, 5],
          [2, 3],
        ]}
        overflowPosition="end"
        overflowComponent={OverflowListMetaCount}
        className="gap-1.5"
      >
        <span className="text-muted-foreground">Pressure</span>
        <span className="pr-2 tabular-nums text-base-foreground">48.6 barg</span>
        <span className="text-muted-foreground">Temperature</span>
        <span className="pr-2 tabular-nums text-base-foreground">141.2 °C</span>
        <span className="text-muted-foreground">Vibration</span>
        <span className="tabular-nums text-base-foreground">6.8 mm/s</span>
      </OverflowList>
    </div>
  );
}

function OverflowListWithSeparator() {
  return (
    <div className="w-64">
      <OverflowList
        collapseOrder="desc"
        overflowComponent={OverflowListMetaCount}
        separator={<span className="px-1.5 text-muted-foreground">·</span>}
      >
        <span className="text-medium-foreground">Corrective</span>
        <span className="text-medium-foreground">Priority 1</span>
        <span className="text-medium-foreground">8 h estimated</span>
        <span className="text-medium-foreground">Due 12 Mar</span>
        <span className="text-medium-foreground">Tomás Barros</span>
      </OverflowList>
    </div>
  );
}

function OverflowListVertical() {
  return (
    <div className="h-32 w-56">
      <OverflowList
        orientation="vertical"
        collapseOrder="desc"
        overflowComponent={OverflowListMetaCount}
        className="h-full gap-2"
      >
        {SENSORS.slice(0, 7).map((sensor) => (
          <span key={sensor.id} className="flex justify-between gap-4 text-medium-foreground">
            {sensor.name}
            <span className="font-mono text-xs text-muted-foreground">{sensor.tag}</span>
          </span>
        ))}
      </OverflowList>
    </div>
  );
}

function OverflowListFits() {
  return (
    <div className="w-64">
      <OverflowList collapseOrder="desc" overflowComponent={OverflowListCount} className="gap-2">
        {OVERFLOW_TAGS.slice(0, 2).map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
          </Badge>
        ))}
      </OverflowList>
    </div>
  );
}

function OverflowListWidths() {
  return (
    <div className="flex w-full flex-col gap-4">
      {[
        { label: '160px', width: 'w-40' },
        { label: '288px', width: 'w-72' },
        { label: '448px', width: 'w-md' },
        { label: 'Full width', width: 'w-full' },
      ].map((row) => (
        <div key={row.label} className="flex items-center gap-4">
          <span className="w-20 shrink-0 text-xs tabular-nums text-muted-foreground">{row.label}</span>
          <div className={`min-w-0 ${row.width}`}>
            <OverflowList collapseOrder="desc" overflowComponent={OverflowListCount} className="gap-2">
              {OVERFLOW_TAGS.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </OverflowList>
          </div>
        </div>
      ))}
    </div>
  );
}

function OverflowListResizable() {
  const [width, setWidth] = useState(320);
  const [measurement, setMeasurement] = useState<OverflowMeasurement | null>(null);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="max-w-xs">
        <Label htmlFor="overflow-list-width">Container width</Label>
        <Slider
          id="overflow-list-width"
          min={80}
          max={640}
          step={8}
          value={[width]}
          onValueChange={(next) => setWidth(next[0] ?? 320)}
        />
      </div>
      <div style={{ width }} className="max-w-full rounded-lg bg-muted-background p-2">
        <OverflowList
          collapseOrder="desc"
          overflowComponent={OverflowListCount}
          className="gap-2"
          onMeasure={setMeasurement}
        >
          {OVERFLOW_TAGS.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </OverflowList>
      </div>
      <p className="text-xs tabular-nums text-muted-foreground" aria-live="polite">
        {measurement
          ? `List is ${Math.round(measurement.size)}px wide and can shrink to ${measurement.collapsedSize}px.`
          : 'Drag the slider to resize the list.'}
      </p>
    </div>
  );
}

function OverflowListTooltipCount() {
  return (
    <div className="w-64">
      <OverflowList collapseOrder="desc" overflowComponent={OverflowListCountWithTooltip} className="gap-2">
        {OVERFLOW_TAGS.map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
          </Badge>
        ))}
      </OverflowList>
    </div>
  );
}

function OverflowListPopoverCount() {
  return (
    <div className="w-72">
      <OverflowList collapseOrder="desc" overflowComponent={OverflowListCountWithPopover} className="gap-2">
        {OVERFLOW_LABELS.map((label) => (
          <Badge key={label} variant="secondary">
            {label}
          </Badge>
        ))}
      </OverflowList>
    </div>
  );
}

function OverflowListTextCount() {
  return (
    <div className="w-64">
      <OverflowList
        collapseOrder="desc"
        overflowComponent={OverflowListMetaCount}
        separator={<span className="pr-1 text-muted-foreground">,</span>}
      >
        {PEOPLE.map((person) => (
          <span key={person.id} className="text-medium-foreground">
            {person.name}
          </span>
        ))}
      </OverflowList>
    </div>
  );
}

function OverflowListAvatars() {
  return (
    <div className="w-40">
      <OverflowList collapseOrder="desc" overflowComponent={OverflowListAvatarCount} className="gap-1">
        {PEOPLE.map((person) => (
          <PersonAvatar key={person.id} name={person.name} initials={person.initials} colorKey={person.id} />
        ))}
      </OverflowList>
    </div>
  );
}

function OverflowListBreadcrumb() {
  const last = OVERFLOW_PATH.length - 1;
  return (
    <div className="w-full max-w-sm">
      <Breadcrumb aria-label="Asset path">
        <OverflowList
          as="ol"
          collapseOrder="innerAscFirstKeepLast"
          overflowComponent={OverflowListPathMenu}
          separator={<span className="text-muted-foreground">/</span>}
        >
          {OVERFLOW_PATH.map((level, index) => (
            <BreadcrumbItem key={level.id}>
              {index === last ? (
                <BreadcrumbPage>{level.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink render={<button type="button" />}>{level.label}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          ))}
        </OverflowList>
      </Breadcrumb>
    </div>
  );
}

function OverflowListNavigation() {
  const [active, setActive] = useState('Overview');
  return (
    <nav aria-label="Equipment sections" className="w-full max-w-sm">
      <OverflowList collapseOrder="desc" overflowPosition="end" overflowComponent={OverflowListNavMenu} className="gap-1">
        {OVERFLOW_NAV.map((label) => (
          <Button
            key={label}
            variant={label === active ? 'secondary' : 'ghost'}
            size="sm"
            aria-current={label === active ? 'page' : undefined}
            onClick={() => setActive(label)}
          >
            {label}
          </Button>
        ))}
      </OverflowList>
    </nav>
  );
}

function OverflowListToolbarActions() {
  return (
    <div className="w-full max-w-xs">
      <OverflowActions label="Work order actions" actions={OVERFLOW_ACTIONS} />
    </div>
  );
}

function OverflowListHeaderActions() {
  return (
    <div className="flex w-full max-w-lg items-center gap-4 rounded-xl bg-muted-background p-4">
      <div className="shrink-0">
        <p className="text-sm font-medium text-base-foreground">WO-104482</p>
        <p className="text-xs text-muted-foreground">Inspect recompressor bearing</p>
      </div>
      <div className="flex min-w-0 flex-1 justify-end">
        <OverflowActions label="Work order actions" actions={OVERFLOW_ACTIONS} />
      </div>
    </div>
  );
}

function OverflowListFilterChips() {
  const [filters, setFilters] = useState<readonly string[]>([
    'Status: Running',
    'Area: Gas compression',
    'Criticality: A',
    'Health: Watch',
    'Type: Compressor',
  ]);

  return (
    <div className="flex w-full max-w-md items-center gap-2">
      <div className="min-w-0 flex-1">
        <OverflowList collapseOrder="desc" overflowComponent={OverflowListCount} className="gap-2">
          {filters.map((filter) => (
            <Badge
              key={filter}
              variant="closable"
              render={
                <button
                  type="button"
                  aria-label={`Remove filter ${filter}`}
                  onClick={() => setFilters((current) => current.filter((value) => value !== filter))}
                />
              }
            >
              {filter}
              <IconX aria-hidden="true" />
            </Badge>
          ))}
        </OverflowList>
      </div>
      <Button variant="ghost" size="sm" disabled={filters.length === 0} onClick={() => setFilters([])}>
        Clear all
      </Button>
    </div>
  );
}

function OverflowListTableCell() {
  return (
    <table className="w-full max-w-lg table-fixed text-left text-sm">
      <thead>
        <tr className="text-xs text-muted-foreground">
          <th className="w-2/5 py-2 pr-4 font-medium">Equipment</th>
          <th className="py-2 font-medium">Sensors</th>
        </tr>
      </thead>
      <tbody>
        {OVERFLOW_EQUIPMENT.map((asset) => (
          <tr key={asset.id} className="border-t border-default">
            <td className="truncate py-2 pr-4 text-base-foreground">{asset.name}</td>
            <td className="py-2">
              <OverflowList collapseOrder="desc" overflowComponent={OverflowListCount} className="gap-1.5">
                {sensorsOf(asset.id).map((sensor) => (
                  <Badge key={sensor.id} variant="secondary">
                    {sensor.tag}
                  </Badge>
                ))}
              </OverflowList>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default definePage({
  id: 'overflow-list',
  title: 'Overflow list',
  summary:
    'An overflow list keeps a row of items on one line. It measures its container and replaces the items that do not fit with one overflow element, such as "+3" or a menu.',
  docsSlug: 'overflow-list',
  guidance: {
    use: [
      'Tags, people, breadcrumbs or actions in a space whose width you do not control.',
      'Pick the collapse order by what matters: the first items, the last, or both ends.',
      'Make the overflow element say how many items are hidden and give a way to reach them.',
      'Give every child a stable key so the overflow element can tell which items it replaced.',
    ],
    avoid: [
      'Hiding the only route to an action or value — always keep hidden items reachable.',
      'Using it where wrapping onto a second line is acceptable and simpler.',
      'Long lists of dozens of items; show a count and link to a full view.',
      'Putting it in a container that cannot shrink (add min-w-0 in a flex row).',
    ],
  },
  source,
  sections: [
    {
      id: 'collapse-order',
      title: 'Collapse order',
      description: 'Which items give way first when the row runs out of room.',
      specimens: [
        {
          id: 'OverflowListFromEnd',
          title: 'From the end',
          note: 'The first items matter most, as with tags sorted by relevance.',
          origin: 'aura',
          Component: OverflowListFromEnd,
        },
        {
          id: 'OverflowListFromStart',
          title: 'From the start',
          note: 'The most recent items are at the end and should stay visible.',
          origin: 'aura',
          Component: OverflowListFromStart,
        },
        {
          id: 'OverflowListFromStartCountAtEnd',
          title: 'From the start, count at the end',
          note: 'The count always sits in the same place, whichever items are hidden.',
          origin: 'aura',
          Component: OverflowListFromStartCountAtEnd,
        },
        {
          id: 'OverflowListKeepFirstAndLast',
          title: 'Keep first and last',
          note: 'Paths: the root and the current level stay, the middle collapses first.',
          origin: 'aura',
          size: 'md',
          Component: OverflowListKeepFirstAndLast,
        },
        {
          id: 'OverflowListKeepLast',
          title: 'Keep last',
          note: 'Paths where the current level and its nearest parents matter more than the root.',
          origin: 'aura',
          size: 'md',
          Component: OverflowListKeepLast,
        },
        {
          id: 'OverflowListPriority',
          title: 'Custom priority',
          note: 'An explicit order, with the most important item left out so it never collapses.',
          origin: 'aura',
          Component: OverflowListPriority,
        },
        {
          id: 'OverflowListGroupedUnits',
          title: 'Grouped units',
          note: 'Items that only make sense together, such as a label and its value, collapse as one.',
          origin: 'aura',
          Component: OverflowListGroupedUnits,
        },
      ],
    },
    {
      id: 'layout',
      title: 'Layout',
      description: 'Separators, direction and how the list responds to its container.',
      specimens: [
        {
          id: 'OverflowListWithSeparator',
          title: 'With separator',
          note: 'Inline metadata; separators are added and removed with the items.',
          origin: 'aura',
          Component: OverflowListWithSeparator,
        },
        {
          id: 'OverflowListVertical',
          title: 'Vertical',
          note: 'A fixed-height slot that shows as many rows as fit.',
          origin: 'aura',
          Component: OverflowListVertical,
        },
        {
          id: 'OverflowListFits',
          title: 'Everything fits',
          note: 'No overflow element is rendered when all items fit.',
          origin: 'aura',
          Component: OverflowListFits,
        },
        {
          id: 'OverflowListWidths',
          title: 'At four container widths',
          note: 'The same seven tags; only the container changes.',
          origin: 'aura',
          size: 'lg',
          align: 'stretch',
          Component: OverflowListWidths,
        },
        {
          id: 'OverflowListResizable',
          title: 'Live resize',
          note: 'Reports its width and the smallest width it can collapse to, for layouts that need to react.',
          origin: 'aura',
          size: 'lg',
          align: 'stretch',
          Component: OverflowListResizable,
        },
      ],
    },
    {
      id: 'overflow-element',
      title: 'Overflow element',
      description: 'What stands in for the hidden items, from a plain count to a menu.',
      specimens: [
        {
          id: 'OverflowListTextCount',
          title: 'Text count',
          note: 'Inline text lists, where a badge would be too heavy.',
          origin: 'aura',
          Component: OverflowListTextCount,
        },
        {
          id: 'OverflowListTooltipCount',
          title: 'Count with tooltip',
          note: 'Short hidden values that can be read from a tooltip.',
          origin: 'aura',
          Component: OverflowListTooltipCount,
        },
        {
          id: 'OverflowListPopoverCount',
          title: 'Count with popover',
          note: 'Hidden items that people need to see as they are, or interact with.',
          origin: 'aura',
          Component: OverflowListPopoverCount,
        },
        {
          id: 'OverflowListAvatars',
          title: 'Avatars',
          note: 'People on a record in a narrow column; the overflow avatar names who is hidden.',
          origin: 'custom',
          uses: ['display/PersonAvatar.tsx'],
          Component: OverflowListAvatars,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'Overflow lists as breadcrumbs, navigation, toolbars and table cells.',
      specimens: [
        {
          id: 'OverflowListBreadcrumb',
          title: 'Breadcrumb',
          note: 'Deep asset paths: middle levels move into a menu behind the ellipsis.',
          origin: 'aura',
          size: 'md',
          Component: OverflowListBreadcrumb,
        },
        {
          id: 'OverflowListNavigation',
          title: 'Section navigation',
          note: 'Page sections that collapse into a "More" menu on narrow screens.',
          origin: 'aura',
          size: 'md',
          Component: OverflowListNavigation,
        },
        {
          id: 'OverflowListToolbarActions',
          title: 'Actions into a menu',
          note: 'Row actions in priority order; the least important move into the menu first.',
          origin: 'custom',
          uses: ['data/OverflowActions.tsx'],
          Component: OverflowListToolbarActions,
        },
        {
          id: 'OverflowListHeaderActions',
          title: 'Header with actions',
          note: 'The title keeps its width and the actions take whatever room is left.',
          origin: 'custom',
          size: 'lg',
          uses: ['data/OverflowActions.tsx'],
          Component: OverflowListHeaderActions,
        },
        {
          id: 'OverflowListFilterChips',
          title: 'Active filters',
          note: 'Removable filter chips beside a fixed "Clear all" button.',
          origin: 'aura',
          size: 'md',
          Component: OverflowListFilterChips,
        },
        {
          id: 'OverflowListTableCell',
          title: 'In table cells',
          note: 'A tag column where rows have very different numbers of tags.',
          origin: 'aura',
          size: 'lg',
          align: 'stretch',
          Component: OverflowListTableCell,
        },
      ],
    },
  ],
});
