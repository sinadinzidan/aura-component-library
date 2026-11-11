import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { CheckboxGroup, CheckboxItem, CheckboxItemControl, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@cognite/aura/components/dropdown-menu';
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from '@cognite/aura/components/empty-state';
import { Search } from '@cognite/aura/components/search';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import { Separator } from '@cognite/aura/components/separator';
import { Switch } from '@cognite/aura/components/switch';
import { Tabs, TabsList, TabsTrigger } from '@cognite/aura/components/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import {
  IconArrowsSort,
  IconBookmark,
  IconChevronDown,
  IconColumns3,
  IconDownload,
  IconFilter,
  IconPlus,
  IconRefresh,
  IconSortAscending,
  IconSortDescending,
} from '@cognite/aura/icons';
import { useState } from 'react';

import { ToggleGroup } from '../../../library/actions/ToggleGroup';
import { StatusBadge } from '../../../library/display/StatusBadge';
import { DebouncedSearch } from '../../../library/forms/DebouncedSearch';
import { severityStatus } from '../../../library/industrial/status';
import { StatusDot } from '../../../library/industrial/StatusDot';
import { DateRangePresetPicker } from '../../../library/navigation/DateRangePresetPicker';
import type { DateRange } from '../../../library/navigation/DateRangePresetPicker';
import { FilterPopover } from '../../../library/overlays/FilterPopover';
import { FilterBar } from '../../../library/patterns/data-entry/FilterBar';
import { OptionSelect } from '../../../library/patterns/data-entry/OptionSelect';
import { Table } from '../../../library/primitives/table/Table';
import { TableBody } from '../../../library/primitives/table/TableBody';
import { TableCell } from '../../../library/primitives/table/TableCell';
import { TableHead } from '../../../library/primitives/table/TableHead';
import { TableHeader } from '../../../library/primitives/table/TableHeader';
import { TableMessageRow } from '../../../library/primitives/table/TableMessageRow';
import { TableRow } from '../../../library/primitives/table/TableRow';
import { Tag } from '../../../library/primitives/tag/Tag';
import type { Severity } from '../../data/plant';
import { ALARMS, ASSETS, PEOPLE, SITES, WORK_ORDERS, findAsset, findPerson } from '../../data/plant';
import { REFERENCE_NOW, formatAgo, formatDate } from '../../data/series';
import { definePage } from '../../types';

import source from './filter-bars.tsx?raw';

const ROW = 'border-t border-default';

const ALL = 'all';

const STATUS_OPTIONS = [
  { value: ALL, label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'planned', label: 'Planned' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'done', label: 'Done' },
];

const PRIORITY_OPTIONS = [
  { value: ALL, label: 'All priorities' },
  { value: 'P1', label: 'P1' },
  { value: 'P2', label: 'P2' },
  { value: 'P3', label: 'P3' },
  { value: 'P4', label: 'P4' },
];

const TYPE_LABELS: Record<string, string> = {
  corrective: 'Corrective',
  preventive: 'Preventive',
  inspection: 'Inspection',
  modification: 'Modification',
  compressor: 'Compressor',
  pump: 'Pump',
  separator: 'Separator',
  exchanger: 'Heat exchanger',
  valve: 'Valve',
  turbine: 'Turbine',
};

const WORK_ORDER_GROUPS = [
  {
    id: 'priority',
    label: 'Priority',
    options: ['P1', 'P2', 'P3', 'P4'].map((priority) => ({ id: priority, label: priority })),
  },
  {
    id: 'type',
    label: 'Type',
    options: ['corrective', 'preventive', 'inspection', 'modification'].map((type) => ({
      id: type,
      label: TYPE_LABELS[type] ?? type,
    })),
  },
];

const AREAS = ASSETS.filter((asset) => asset.type === 'area' || asset.type === 'system');

const EQUIPMENT = ASSETS.filter((asset) => asset.parentId !== null && asset.parentId !== 'nk');

const EQUIPMENT_TYPES = [...new Set(EQUIPMENT.map((asset) => asset.type))];

const SEVERITIES: readonly Severity[] = ['critical', 'high', 'medium', 'low'];

const NOW = new Date(REFERENCE_NOW);

const SORT_OPTIONS = [
  { value: 'due', label: 'Due date' },
  { value: 'priority', label: 'Priority' },
  { value: 'asset', label: 'Asset' },
];

const GROUP_OPTIONS = [
  { value: 'none', label: 'No grouping' },
  { value: 'status', label: 'Status' },
  { value: 'assignee', label: 'Assignee' },
  { value: 'area', label: 'Area' },
];

const COLUMN_LABELS: Record<string, string> = {
  asset: 'Asset',
  priority: 'Priority',
  status: 'Status',
  due: 'Due',
};

function toggleIn(list: readonly string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function matchesQuery(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.trim().toLowerCase());
}

function assetLabel(assetId: string): string {
  const asset = findAsset(assetId);
  return asset ? `${asset.tag} ${asset.name}` : assetId;
}

function FilterBarSearchOnly() {
  const [query, setQuery] = useState('');
  const matches = ASSETS.filter((asset) => matchesQuery(`${asset.tag} ${asset.name}`, query));
  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <DebouncedSearch aria-label="Search assets" placeholder="Search assets" onSearch={setQuery} />
      <output aria-live="polite" className="text-sm tabular-nums text-muted-foreground">
        {query === '' ? `${ASSETS.length} assets` : `${matches.length} of ${ASSETS.length} assets`}
      </output>
    </div>
  );
}

function FilterBarSearchAndButton() {
  const [value, setValue] = useState<Record<string, string[]>>({ priority: ['P1', 'P2'], type: [] });
  return (
    <FilterBar label="Filter work orders">
      <div className="min-w-0 flex-1">
        <Search aria-label="Search work orders" placeholder="Search" />
      </div>
      <FilterPopover groups={WORK_ORDER_GROUPS} value={value} onApply={setValue} align="end" />
    </FilterBar>
  );
}

function FilterBarQuickToggles() {
  const [value, setValue] = useState(['mine']);
  return (
    <ToggleGroup
      label="Quick filters"
      variant="outline"
      size="sm"
      value={value}
      onValueChange={setValue}
      options={[
        { value: 'mine', label: 'Mine', count: 2 },
        { value: 'overdue', label: 'Overdue', count: 1 },
        { value: 'unassigned', label: 'Unassigned', count: 2 },
      ]}
    />
  );
}

function FilterBarInlineSelects() {
  const [status, setStatus] = useState(ALL);
  const [priority, setPriority] = useState('P2');
  const count = WORK_ORDERS.filter(
    (order) => (status === ALL || order.status === status) && (priority === ALL || order.priority === priority)
  ).length;
  return (
    <FilterBar label="Filter work orders" summary={`${count} of ${WORK_ORDERS.length} work orders`}>
      <div className="w-48">
        <Search aria-label="Search work orders" placeholder="Search" />
      </div>
      <div className="w-36">
        <OptionSelect
          aria-label="Status"
          options={STATUS_OPTIONS}
          value={status}
          onValueChange={setStatus}
          width="compact"
        />
      </div>
      <div className="w-36">
        <OptionSelect
          aria-label="Priority"
          options={PRIORITY_OPTIONS}
          value={priority}
          onValueChange={setPriority}
          width="compact"
        />
      </div>
    </FilterBar>
  );
}

function FilterBarStatusTabs() {
  const open = WORK_ORDERS.filter((order) => order.status === 'open' || order.status === 'planned').length;
  const active = WORK_ORDERS.filter((order) => order.status === 'in-progress' || order.status === 'waiting').length;
  const done = WORK_ORDERS.filter((order) => order.status === 'done').length;
  return (
    <div className="flex w-full flex-col gap-3">
      <Tabs defaultValue="all">
        <TabsList showSeparator>
          <TabsTrigger value="all" badge={WORK_ORDERS.length}>
            All
          </TabsTrigger>
          <TabsTrigger value="open" badge={open}>
            Not started
          </TabsTrigger>
          <TabsTrigger value="active" badge={active}>
            Active
          </TabsTrigger>
          <TabsTrigger value="done" badge={done}>
            Done
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="flex items-center gap-3">
        <div className="w-56">
          <Search aria-label="Search work orders" placeholder="Search" />
        </div>
        <div className="w-36">
          <OptionSelect aria-label="Priority" options={PRIORITY_OPTIONS} defaultValue={ALL} width="compact" />
        </div>
      </div>
    </div>
  );
}

function FilterBarChips() {
  const initial = [
    { id: 'site', label: 'Site', value: 'Nordkapp' },
    { id: 'area', label: 'Area', value: 'Gas compression' },
    { id: 'priority', label: 'Priority', value: 'P1, P2' },
    { id: 'due', label: 'Due', value: 'Next 7 days' },
  ];
  const [chips, setChips] = useState(initial);
  const shown = [3, 4, 5, 6, 8][4 - chips.length] ?? 8;
  return (
    <FilterBar
      label="Filter work orders"
      chips={chips}
      onRemoveChip={(id) => setChips((current) => current.filter((chip) => chip.id !== id))}
      onClearAll={() => setChips([])}
      summary={`${shown} of ${WORK_ORDERS.length} work orders`}
      end={
        chips.length === 0 ? (
          <Button variant="ghost" size="sm" onClick={() => setChips(initial)}>
            Restore filters
          </Button>
        ) : null
      }
    >
      <div className="w-64">
        <Search aria-label="Search work orders" placeholder="Search work orders" />
      </div>
      <Button variant="outline">
        <IconPlus /> Add filter
      </Button>
    </FilterBar>
  );
}

function FilterBarChipAnatomy() {
  const [visible, setVisible] = useState(['single', 'multi', 'range']);
  const hide = (id: string) => setVisible((current) => current.filter((item) => item !== id));
  return (
    <div className="flex flex-col items-start gap-2">
      {visible.includes('single') ? (
        <Tag size="lg" removeLabel="Remove filter Site: Nordkapp" onRemove={() => hide('single')}>
          Site: Nordkapp
        </Tag>
      ) : null}
      {visible.includes('multi') ? (
        <Tag size="lg" removeLabel="Remove filter Type: 3 selected" onRemove={() => hide('multi')}>
          Type: 3 selected
        </Tag>
      ) : null}
      {visible.includes('range') ? (
        <Tag size="lg" removeLabel="Remove filter Health score: 40–80" onRemove={() => hide('range')}>
          Health score: 40–80
        </Tag>
      ) : null}
      {visible.length === 0 ? (
        <Button variant="ghost" size="sm" onClick={() => setVisible(['single', 'multi', 'range'])}>
          Restore filters
        </Button>
      ) : null}
    </div>
  );
}

function FilterBarActiveSummary() {
  const [applied, setApplied] = useState(true);
  return (
    <div className="flex w-full items-center justify-between gap-4 rounded-lg bg-muted-background px-4 py-3">
      <p aria-live="polite" className="min-w-0 text-sm text-base-foreground">
        {applied ? (
          <>
            <span className="font-medium tabular-nums">3 of 8</span> work orders match{' '}
            <span className="text-muted-foreground">Nordkapp · P1 or P2 · due in 7 days</span>
          </>
        ) : (
          <span className="tabular-nums">8 work orders, no filters</span>
        )}
      </p>
      {applied ? (
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="sm">
            Edit filters
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setApplied(false)}>
            Reset
          </Button>
        </div>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setApplied(true)}>
          Restore filters
        </Button>
      )}
    </div>
  );
}

function FilterBarNoResults() {
  const initial = [
    { id: 'query', label: 'Search', value: '23-KA-91O1' },
    { id: 'state', label: 'State', value: 'Tripped' },
  ];
  const [chips, setChips] = useState(initial);
  return (
    <div className="flex w-full flex-col gap-4">
      <FilterBar
        label="Filter assets"
        chips={chips}
        onRemoveChip={(id) => setChips((current) => current.filter((chip) => chip.id !== id))}
        onClearAll={() => setChips([])}
        summary={chips.length === 0 ? `${EQUIPMENT.length} assets` : '0 assets'}
      >
        <div className="w-64">
          <Search aria-label="Search assets" placeholder="Search assets" defaultValue="23-KA-91O1" />
        </div>
      </FilterBar>
      {chips.length > 0 ? (
        <EmptyState type="no-results">
          <EmptyStateIcon />
          <EmptyStateTitle as="h4">No assets match these filters</EmptyStateTitle>
          <EmptyStateDescription>
            Check the tag for typos, or reset the filters to see every asset.
          </EmptyStateDescription>
          <EmptyStateActions>
            <Button variant="secondary" size="sm" onClick={() => setChips([])}>
              Reset filters
            </Button>
          </EmptyStateActions>
        </EmptyState>
      ) : (
        <div className="flex justify-center py-6">
          <Button variant="ghost" size="sm" onClick={() => setChips(initial)}>
            Show the empty result again
          </Button>
        </div>
      )}
    </div>
  );
}

function FilterBarDateRange() {
  const [range, setRange] = useState<DateRange>([new Date(NOW.getTime() - 6 * 86_400_000), NOW]);
  return (
    <FilterBar label="Filter alarm history">
      <DateRangePresetPicker value={range} onChange={setRange} now={NOW} label="Alarm history range" />
    </FilterBar>
  );
}

function FilterBarPopoverApply() {
  const [value, setValue] = useState<Record<string, string[]>>({
    priority: ['P1'],
    type: ['corrective', 'inspection'],
  });
  const chips = WORK_ORDER_GROUPS.flatMap((group) => {
    const selected = value[group.id] ?? [];
    if (selected.length === 0) return [];
    const labels = group.options.filter((option) => selected.includes(option.id)).map((option) => option.label);
    return [{ id: group.id, label: group.label, value: labels.join(', ') }];
  });
  return (
    <FilterBar
      label="Filter work orders"
      chips={chips}
      onRemoveChip={(id) => setValue((current) => ({ ...current, [id]: [] }))}
      onClearAll={() => setValue({ priority: [], type: [] })}
    >
      <FilterPopover groups={WORK_ORDER_GROUPS} value={value} onApply={setValue} />
      <div className="min-w-0 flex-1">
        <Search aria-label="Search work orders" placeholder="Search work orders" />
      </div>
    </FilterBar>
  );
}

function FilterBarSavedViews() {
  const [view, setView] = useState('my-open');
  const [modified, setModified] = useState(true);
  const views = [
    { id: 'all', label: 'All work orders' },
    { id: 'my-open', label: 'My open work orders' },
    { id: 'p1', label: 'P1 this week' },
    { id: 'compression', label: 'Gas compression backlog' },
  ];
  const current = views.find((item) => item.id === view);
  return (
    <FilterBar
      label="Saved views"
      end={
        modified ? (
          <>
            <Button variant="ghost" size="sm" onClick={() => setModified(false)}>
              Reset
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setModified(false)}>
              Save view
            </Button>
          </>
        ) : null
      }
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline">
              <IconBookmark /> {current?.label ?? 'Select a view'} <IconChevronDown />
            </Button>
          }
        />
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Saved views</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={view}
              onValueChange={(next) => {
                if (typeof next === 'string') {
                  setView(next);
                  setModified(false);
                }
              }}
            >
              {views.map((item) => (
                <DropdownMenuRadioItem key={item.id} value={item.id}>
                  {item.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setModified(true)}>
            <IconPlus /> Save current filters as a view
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {modified ? <Badge variant="secondary">Edited</Badge> : null}
    </FilterBar>
  );
}

function FilterBarSortAndGroup() {
  const [sort, setSort] = useState('due');
  const [ascending, setAscending] = useState(true);
  const [group, setGroup] = useState('status');
  const directionLabel = ascending ? 'Ascending. Sort descending' : 'Descending. Sort ascending';
  return (
    <div
      role="group"
      aria-label="Sort and group work orders"
      className="flex w-full flex-wrap items-center gap-x-6 gap-y-3"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Sort by</span>
        <div className="w-36">
          <OptionSelect
            aria-label="Sort by"
            options={SORT_OPTIONS}
            value={sort}
            onValueChange={setSort}
            width="compact"
          />
        </div>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label={directionLabel}
                onClick={() => setAscending((value) => !value)}
              >
                {ascending ? <IconSortAscending /> : <IconSortDescending />}
              </Button>
            }
          />
          <TooltipContent>{directionLabel}</TooltipContent>
        </Tooltip>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Group by</span>
        <div className="w-40">
          <OptionSelect
            aria-label="Group by"
            options={GROUP_OPTIONS}
            value={group}
            onValueChange={setGroup}
            width="compact"
          />
        </div>
      </div>
    </div>
  );
}

function FilterBarColumnVisibility() {
  const [columns, setColumns] = useState(['asset', 'priority', 'due']);
  const order = WORK_ORDERS[0];
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm tabular-nums text-muted-foreground">
          {columns.length + 1} of {Object.keys(COLUMN_LABELS).length + 1} columns shown
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="sm">
                <IconColumns3 /> Columns
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Show columns</DropdownMenuLabel>
              {Object.entries(COLUMN_LABELS).map(([id, label]) => (
                <DropdownMenuCheckboxItem
                  key={id}
                  checked={columns.includes(id)}
                  onCheckedChange={() => setColumns(toggleIn(columns, id))}
                >
                  {label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem inset onClick={() => setColumns(Object.keys(COLUMN_LABELS))}>
              Show all columns
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Table label="Work orders" layout="fixed">
        <TableHeader>
          <TableRow>
            <TableHead>Work order</TableHead>
            {Object.entries(COLUMN_LABELS).map(([id, label]) => (columns.includes(id) ? <TableHead key={id}>{label}</TableHead> : null))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell rowHeader wrap="truncate">
              {order.id}
            </TableCell>
            {columns.includes('asset') ? <TableCell wrap="truncate">{findAsset(order.assetId)?.tag}</TableCell> : null}
            {columns.includes('priority') ? <TableCell>{order.priority}</TableCell> : null}
            {columns.includes('status') ? (
              <TableCell>
                <StatusBadge status={order.status} outline />
              </TableCell>
            ) : null}
            {columns.includes('due') ? (
              <TableCell>
                <span className="tabular-nums">{formatDate(order.dueAt)}</span>
              </TableCell>
            ) : null}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

function FilterBarAddFilter() {
  const available = [
    { id: 'assignee', label: 'Assignee', options: PEOPLE.map((person) => ({ value: person.id, label: person.name })) },
    { id: 'site', label: 'Site', options: SITES.map((site) => ({ value: site.id, label: site.name })) },
    { id: 'area', label: 'Area', options: AREAS.map((area) => ({ value: area.id, label: area.name })) },
  ];
  const [active, setActive] = useState(['assignee']);
  const remaining = available.filter((filter) => !active.includes(filter.id));
  return (
    <FilterBar label="Filter work orders">
      {available
        .filter((filter) => active.includes(filter.id))
        .map((filter) => (
          <div key={filter.id} className="w-40">
            <OptionSelect
              aria-label={filter.label}
              options={filter.options}
              placeholder={filter.label}
              width="compact"
            />
          </div>
        ))}
      {remaining.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost">
                <IconPlus /> Add filter
              </Button>
            }
          />
          <DropdownMenuContent align="start">
            {remaining.map((filter) => (
              <DropdownMenuItem key={filter.id} onClick={() => setActive((current) => [...current, filter.id])}>
                {filter.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
      {active.length > 1 ? (
        <Button variant="ghost" onClick={() => setActive(['assignee'])}>
          Reset
        </Button>
      ) : null}
    </FilterBar>
  );
}

function FilterBarViewSwitch() {
  const [value, setValue] = useState<Record<string, string[]>>({ priority: ['P1'], type: [] });
  return (
    <FilterBar
      label="Work order view and filters"
      end={<FilterPopover groups={WORK_ORDER_GROUPS} value={value} onApply={setValue} align="end" />}
    >
      <SegmentedControl defaultValue="list">
        <SegmentedControlList aria-label="View">
          <SegmentedControlButton value="list" tabContent="label-only">
            List
          </SegmentedControlButton>
          <SegmentedControlButton value="board" tabContent="label-only">
            Board
          </SegmentedControlButton>
          <SegmentedControlButton value="calendar" tabContent="label-only">
            Calendar
          </SegmentedControlButton>
        </SegmentedControlList>
      </SegmentedControl>
    </FilterBar>
  );
}

function FilterBarCollapsed() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <Search aria-label="Search work orders" placeholder="Search" />
        </div>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="outline" size="icon" aria-label="Filters, 3 applied">
                <IconFilter />
              </Button>
            }
          />
          <TooltipContent>Filters, 3 applied</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="outline" size="icon" aria-label="Sort by due date">
                <IconArrowsSort />
              </Button>
            }
          />
          <TooltipContent>Sort by due date</TooltipContent>
        </Tooltip>
      </div>
      <p className="text-xs text-muted-foreground">3 filters · sorted by due date</p>
    </div>
  );
}

function FilterBarCompactTable() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState(ALL);
  const rows = WORK_ORDERS.filter(
    (order) =>
      (status === ALL || order.status === status) &&
      matchesQuery(`${order.id} ${order.title} ${assetLabel(order.assetId)}`, query)
  ).slice(0, 4);
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="w-56">
          <Search
            aria-label="Search work orders"
            placeholder="Search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onClear={() => setQuery('')}
          />
        </div>
        <div className="w-36">
          <OptionSelect
            aria-label="Status"
            options={STATUS_OPTIONS}
            value={status}
            onValueChange={setStatus}
            width="compact"
          />
        </div>
        <output aria-live="polite" className="pl-1 text-sm tabular-nums text-muted-foreground">
          {rows.length} shown
        </output>
        <div className="ml-auto flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="Refresh work orders">
                  <IconRefresh />
                </Button>
              }
            />
            <TooltipContent>Refresh work orders</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="Choose columns">
                  <IconColumns3 />
                </Button>
              }
            />
            <TooltipContent>Choose columns</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="Export as CSV">
                  <IconDownload />
                </Button>
              }
            />
            <TooltipContent>Export as CSV</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <Table label="Work orders">
        <TableHeader>
          <TableRow>
            <TableHead>Work order</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Asset</TableHead>
            <TableHead>Status</TableHead>
            <TableHead numeric>Due</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((order) => (
            <TableRow key={order.id}>
              <TableCell rowHeader wrap="nowrap">
                {order.id}
              </TableCell>
              <TableCell>{order.title}</TableCell>
              <TableCell muted wrap="nowrap">
                {findAsset(order.assetId)?.tag}
              </TableCell>
              <TableCell>
                <StatusBadge status={order.status} outline />
              </TableCell>
              <TableCell numeric>{formatDate(order.dueAt)}</TableCell>
            </TableRow>
          ))}
          {rows.length === 0 ? <TableMessageRow colSpan={5}>No work orders match. Clear the search or pick another status.</TableMessageRow> : null}
        </TableBody>
      </Table>
    </div>
  );
}

function FilterBarFacetedSidebar() {
  const [types, setTypes] = useState(['compressor', 'pump']);
  const [states, setStates] = useState<string[]>([]);
  const stateIds = ['running', 'standby', 'tripped', 'maintenance'];
  const rows = EQUIPMENT.filter(
    (asset) =>
      (types.length === 0 || types.includes(asset.type)) && (states.length === 0 || states.includes(asset.state))
  );
  const applied = types.length + states.length;
  return (
    <div className="flex w-full gap-8">
      <div role="search" aria-label="Filter assets" className="flex w-52 shrink-0 flex-col gap-4">
        <div className="flex h-7 items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-base-foreground">Filters</h3>
          {applied > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTypes([]);
                setStates([]);
              }}
            >
              Clear all
            </Button>
          ) : null}
        </div>
        <div className="flex flex-col">
          <span id="filter-bar-facet-type" className="pb-1 text-xs font-medium text-muted-foreground">
            Type
          </span>
          <CheckboxGroup aria-labelledby="filter-bar-facet-type">
            {EQUIPMENT_TYPES.map((type) => (
              <CheckboxItem key={type}>
                <CheckboxItemControl
                  checked={types.includes(type)}
                  onCheckedChange={() => setTypes(toggleIn(types, type))}
                />
                <CheckboxItemLabel className="flex items-center justify-between gap-2">
                  {TYPE_LABELS[type] ?? type}
                  <span className="text-xs font-normal tabular-nums text-muted-foreground">
                    {EQUIPMENT.filter((asset) => asset.type === type).length}
                  </span>
                </CheckboxItemLabel>
              </CheckboxItem>
            ))}
          </CheckboxGroup>
        </div>
        <Separator />
        <div className="flex flex-col">
          <span id="filter-bar-facet-state" className="pb-1 text-xs font-medium text-muted-foreground">
            State
          </span>
          <CheckboxGroup aria-labelledby="filter-bar-facet-state">
            {stateIds.map((state) => (
              <CheckboxItem key={state}>
                <CheckboxItemControl
                  checked={states.includes(state)}
                  onCheckedChange={() => setStates(toggleIn(states, state))}
                />
                <CheckboxItemLabel className="flex items-center justify-between gap-2">
                  <span className="capitalize">{state}</span>
                  <span className="text-xs font-normal tabular-nums text-muted-foreground">
                    {EQUIPMENT.filter((asset) => asset.state === state).length}
                  </span>
                </CheckboxItemLabel>
              </CheckboxItem>
            ))}
          </CheckboxGroup>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <output aria-live="polite" className="flex h-7 items-center text-sm tabular-nums text-muted-foreground">
          {rows.length} of {EQUIPMENT.length} assets
        </output>
        <Table label="Assets">
          <TableHeader>
            <TableRow>
              <TableHead>Tag</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>State</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.slice(0, 7).map((asset) => (
              <TableRow key={asset.id}>
                <TableCell rowHeader wrap="nowrap">
                  {asset.tag}
                </TableCell>
                <TableCell>{asset.name}</TableCell>
                <TableCell muted>{TYPE_LABELS[asset.type] ?? asset.type}</TableCell>
                <TableCell>
                  <StatusBadge status={asset.state} outline />
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 ? <TableMessageRow colSpan={4}>No assets match. Clear a filter to see more.</TableMessageRow> : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function FilterBarAlarmList() {
  const [severities, setSeverities] = useState<string[]>(['critical', 'high']);
  const [activeOnly, setActiveOnly] = useState(false);
  const [query, setQuery] = useState('');
  const rows = ALARMS.filter(
    (alarm) =>
      (severities.length === 0 || severities.includes(alarm.severity)) &&
      (!activeOnly || alarm.state === 'active') &&
      matchesQuery(`${alarm.message} ${alarm.sensorTag}`, query)
  );
  return (
    <div className="flex w-full flex-col gap-3">
      <FilterBar
        label="Filter alarms"
        summary={`${rows.length} of ${ALARMS.length} alarms`}
        end={
          <label className="flex cursor-pointer items-center gap-2 text-sm text-base-foreground">
            <Switch checked={activeOnly} onCheckedChange={setActiveOnly} />
            Unacknowledged only
          </label>
        }
      >
        <ToggleGroup
          label="Severity"
          variant="outline"
          value={severities}
          onValueChange={setSeverities}
          options={SEVERITIES.map((severity) => {
            const status = severityStatus(severity);
            return {
              value: severity,
              label: status.label,
              icon: <StatusDot tone={status.tone} shape={status.shape} size="sm" />,
              count: ALARMS.filter((alarm) => alarm.severity === severity).length,
            };
          })}
        />
        <div className="w-56">
          <Search
            aria-label="Search alarms"
            placeholder="Search alarms"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onClear={() => setQuery('')}
          />
        </div>
      </FilterBar>
      <ul className="flex list-none flex-col">
        {rows.slice(0, 4).map((alarm) => {
          const status = severityStatus(alarm.severity);
          return (
            <li key={alarm.id} className={`flex items-center gap-3 py-2 ${ROW}`}>
              <StatusDot tone={status.tone} shape={status.shape} label={status.label} />
              <span className="min-w-0 flex-1 truncate text-sm text-base-foreground">{alarm.message}</span>
              <span className="shrink-0 text-sm text-muted-foreground">{alarm.sensorTag}</span>
              <span className="w-20 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                {formatAgo(alarm.raisedAt)}
              </span>
            </li>
          );
        })}
        {rows.length === 0 ? (
          <li className={`py-6 text-center text-sm text-muted-foreground ${ROW}`}>
            No alarms match. Select another severity or clear the search.
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function FilterBarAssetCascade() {
  const [site, setSite] = useState('nordkapp');
  const [area, setArea] = useState('nk-23');
  const [type, setType] = useState('compressor');
  const areaOptions = [
    { value: ALL, label: 'All systems' },
    ...AREAS.map((item) => ({ value: item.id, label: item.name })),
  ];
  const typeOptions = [
    { value: ALL, label: 'All types' },
    ...EQUIPMENT_TYPES.filter(
      (item) => area === ALL || EQUIPMENT.some((asset) => asset.parentId === area && asset.type === item)
    ).map((item) => ({ value: item, label: TYPE_LABELS[item] ?? item })),
  ];
  const atNordkapp = site === 'nordkapp';
  const count = atNordkapp
    ? EQUIPMENT.filter((asset) => (area === ALL || asset.parentId === area) && (type === ALL || asset.type === type))
        .length
    : 0;
  const chips = [
    ...(area === ALL
      ? []
      : [{ id: 'area', label: 'System', value: AREAS.find((item) => item.id === area)?.name ?? area }]),
    ...(type === ALL ? [] : [{ id: 'type', label: 'Type', value: TYPE_LABELS[type] ?? type }]),
  ];
  return (
    <FilterBar
      label="Filter assets by location"
      chips={chips}
      onRemoveChip={(id) => (id === 'area' ? setArea(ALL) : setType(ALL))}
      onClearAll={() => {
        setArea(ALL);
        setType(ALL);
      }}
      summary={`${count} ${count === 1 ? 'asset' : 'assets'}`}
    >
      <div className="w-44">
        <OptionSelect
          aria-label="Site"
          options={SITES.map((item) => ({ value: item.id, label: item.name }))}
          value={site}
          onValueChange={(next) => {
            setSite(next);
            setArea(ALL);
            setType(ALL);
          }}
          width="compact"
        />
      </div>
      <div className="w-48">
        <OptionSelect
          aria-label="System"
          options={areaOptions}
          value={area}
          onValueChange={(next) => {
            setArea(next);
            setType(ALL);
          }}
          disabled={!atNordkapp}
          width="compact"
        />
      </div>
      <div className="w-44">
        <OptionSelect
          aria-label="Type"
          options={typeOptions}
          value={type}
          onValueChange={setType}
          disabled={!atNordkapp}
          width="compact"
        />
      </div>
      {atNordkapp ? null : <p className="text-sm text-muted-foreground">No systems are mapped for this site yet.</p>}
    </FilterBar>
  );
}

function FilterBarTrendToolbar() {
  const [live, setLive] = useState(true);
  return (
    <FilterBar
      label="Trend controls"
      end={
        <label className="flex cursor-pointer items-center gap-2 text-sm text-base-foreground">
          <Switch checked={live} onCheckedChange={setLive} />
          Live
        </label>
      }
    >
      <SegmentedControl defaultValue="24h">
        <SegmentedControlList aria-label="Time range" size="small">
          <SegmentedControlButton value="1h" tabContent="label-only" size="small">
            1 h
          </SegmentedControlButton>
          <SegmentedControlButton value="24h" tabContent="label-only" size="small">
            24 h
          </SegmentedControlButton>
          <SegmentedControlButton value="7d" tabContent="label-only" size="small">
            7 d
          </SegmentedControlButton>
          <SegmentedControlButton value="30d" tabContent="label-only" size="small">
            30 d
          </SegmentedControlButton>
        </SegmentedControlList>
      </SegmentedControl>
      <div className="w-36">
        <OptionSelect
          aria-label="Aggregate"
          size="sm"
          options={[
            { value: 'average', label: 'Average' },
            { value: 'min', label: 'Minimum' },
            { value: 'max', label: 'Maximum' },
          ]}
          defaultValue="average"
          width="compact"
        />
      </div>
    </FilterBar>
  );
}

function FilterBarAssigneeMenu() {
  const [assignees, setAssignees] = useState(['tb']);
  const names = assignees.map((id) => findPerson(id)?.name ?? id);
  return (
    <FilterBar
      label="Filter by assignee"
      chips={assignees.length === 0 ? [] : [{ id: 'assignee', label: 'Assignee', value: names.join(', ') }]}
      onRemoveChip={() => setAssignees([])}
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline">
              Assignee
              {assignees.length > 0 ? <Badge variant="secondary">{assignees.length}</Badge> : null}
              <IconChevronDown />
            </Button>
          }
        />
        <DropdownMenuContent align="start" className="w-56">
          {PEOPLE.slice(0, 5).map((person) => (
            <DropdownMenuCheckboxItem
              key={person.id}
              checked={assignees.includes(person.id)}
              onCheckedChange={() => setAssignees(toggleIn(assignees, person.id))}
            >
              {person.name}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </FilterBar>
  );
}

function FilterBarRunHistory() {
  const [result, setResult] = useState('failed');
  const runs: Record<string, number> = { all: 96, failed: 3, succeeded: 93 };
  return (
    <FilterBar label="Filter pipeline runs" summary={`${runs[result] ?? 0} runs in the last 24 hours`}>
      <SegmentedControl
        value={result}
        onValueChange={(next) => {
          if (typeof next === 'string') setResult(next);
        }}
      >
        <SegmentedControlList aria-label="Run result">
          <SegmentedControlButton value="all" tabContent="label-only">
            All
          </SegmentedControlButton>
          <SegmentedControlButton value="failed" tabContent="label-only">
            Failed
          </SegmentedControlButton>
          <SegmentedControlButton value="succeeded" tabContent="label-only">
            Succeeded
          </SegmentedControlButton>
        </SegmentedControlList>
      </SegmentedControl>
      <div className="w-44">
        <OptionSelect
          aria-label="Pipeline"
          options={[
            { value: ALL, label: 'All pipelines' },
            { value: 'telemetry', label: 'Compressor telemetry ingest' },
            { value: 'lab', label: 'Lab results import' },
          ]}
          defaultValue={ALL}
          width="compact"
        />
      </div>
    </FilterBar>
  );
}

export default definePage({
  id: 'filter-bars',
  title: 'Filter bars',
  summary:
    'The row of controls above a list, table or chart: search, filters, sorting and view switches, plus the chips and counts that say what is applied. A filter bar always answers two questions: what am I looking at, and how do I get back to everything.',
  guidance: {
    use: [
      'Search first, then the two or three filters people use most; the rest go behind "Filters" or "Add filter".',
      'Show what is applied as chips or a count, with one action that clears everything.',
      'Say how many results match, and announce the count when it changes.',
      'Inline selects that apply at once for one or two filters; a popover with Apply for many.',
    ],
    avoid: [
      'Filters that hide rows without any visible sign that a filter is on.',
      'An empty result with no way to reset from where the user is looking.',
      'Icon-only filter buttons without a name, a tooltip and the applied count.',
      'Using tabs and a status filter for the same property in one bar.',
    ],
  },
  source,
  sections: [
    {
      id: 'search-and-quick-filters',
      title: 'Search and quick filters',
      description: 'The smallest bars: one or two controls that apply as soon as they change.',
      specimens: [
        {
          id: 'FilterBarSearchOnly',
          title: 'Search with result count',
          note: 'When a list is short enough that typing is the only filter people need.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['forms/DebouncedSearch.tsx'],
          Component: FilterBarSearchOnly,
        },
        {
          id: 'FilterBarSearchAndButton',
          title: 'Search and filter button',
          note: 'The default above a table: search stays visible and the filter button carries the number applied.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['patterns/data-entry/FilterBar.tsx', 'overlays/FilterPopover.tsx'],
          Component: FilterBarSearchAndButton,
        },
        {
          id: 'FilterBarQuickToggles',
          title: 'Quick filter toggles',
          note: 'For two or three yes-or-no filters people flip all day, each with the number of matches.',
          origin: 'custom',
          size: 'sm',
          uses: ['actions/ToggleGroup.tsx'],
          Component: FilterBarQuickToggles,
        },
        {
          id: 'FilterBarInlineSelects',
          title: 'Inline select filters',
          note: 'When one or two properties are filtered constantly; each select applies at once and reads "All …" when unset.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/data-entry/FilterBar.tsx', 'patterns/data-entry/OptionSelect.tsx'],
          Component: FilterBarInlineSelects,
        },
        {
          id: 'FilterBarStatusTabs',
          title: 'Status tabs above the bar',
          note: 'When one property splits the list into a few fixed groups people move between; the counts sit on the tabs.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/data-entry/OptionSelect.tsx'],
          Component: FilterBarStatusTabs,
        },
      ],
    },
    {
      id: 'applied-filters',
      title: 'Applied filters',
      description: 'Saying what is filtered, and getting back to everything.',
      specimens: [
        {
          id: 'FilterBarChips',
          title: 'Chips with clear all',
          note: 'Whenever filters are set somewhere out of sight: each one becomes a removable chip next to the result count.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['patterns/data-entry/FilterBar.tsx', 'patterns/data-entry/FilterChip.tsx'],
          Component: FilterBarChips,
        },
        {
          id: 'FilterBarChipAnatomy',
          title: 'Chip values',
          note: 'How to word a chip: one value as text, many as a count, a range with its two ends.',
          origin: 'custom',
          size: 'sm',
          uses: ['primitives/tag/Tag.tsx'],
          Component: FilterBarChipAnatomy,
        },
        {
          id: 'FilterBarActiveSummary',
          title: 'Active filter summary',
          note: 'When the filter controls live elsewhere, such as a side panel, and the list needs one line that says what is applied.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: FilterBarActiveSummary,
        },
        {
          id: 'FilterBarNoResults',
          title: 'No results with reset',
          note: 'When filters match nothing: keep the bar, explain the empty list and offer the reset where the user is looking.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/data-entry/FilterBar.tsx'],
          Component: FilterBarNoResults,
        },
      ],
    },
    {
      id: 'menus-and-popovers',
      title: 'Menus and popovers',
      description: 'Filters, views, sorting and columns that open from the bar.',
      specimens: [
        {
          id: 'FilterBarDateRange',
          title: 'Date range with presets',
          note: 'For history views: one click for the common ranges, the picker for the rest.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['navigation/DateRangePresetPicker.tsx', 'patterns/data-entry/FilterBar.tsx'],
          Component: FilterBarDateRange,
        },
        {
          id: 'FilterBarPopoverApply',
          title: 'Filter popover with apply',
          note: 'When several filters are usually changed together, so the list reloads once instead of on every tick.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['overlays/FilterPopover.tsx', 'patterns/data-entry/FilterBar.tsx'],
          Component: FilterBarPopoverApply,
        },
        {
          id: 'FilterBarSavedViews',
          title: 'Saved views',
          note: 'When people return to the same few filter sets; an edited view is flagged and can be saved or reset.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/data-entry/FilterBar.tsx'],
          Component: FilterBarSavedViews,
        },
        {
          id: 'FilterBarSortAndGroup',
          title: 'Sort and group',
          note: 'For lists and boards without sortable column headers: the property, its direction and the grouping.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/data-entry/OptionSelect.tsx'],
          Component: FilterBarSortAndGroup,
        },
        {
          id: 'FilterBarColumnVisibility',
          title: 'Column visibility',
          note: 'For wide tables where each role needs different columns; the identifying column cannot be hidden.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx', 'display/StatusBadge.tsx'],
          Component: FilterBarColumnVisibility,
        },
        {
          id: 'FilterBarAddFilter',
          title: 'Add filter',
          note: 'When there are many filterable properties but any one user needs a few: start with one and let them add more.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/data-entry/FilterBar.tsx', 'patterns/data-entry/OptionSelect.tsx'],
          Component: FilterBarAddFilter,
        },
      ],
    },
    {
      id: 'layouts',
      title: 'Layouts',
      description: 'Where the bar sits relative to the content it filters.',
      specimens: [
        {
          id: 'FilterBarViewSwitch',
          title: 'View switch and filters',
          note: 'When the same records can be shown as a list, board or calendar: the switch leads and filters go to the far end.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/data-entry/FilterBar.tsx', 'overlays/FilterPopover.tsx'],
          Component: FilterBarViewSwitch,
        },
        {
          id: 'FilterBarCollapsed',
          title: 'Collapsed for narrow panels',
          note: 'In a side panel or on a phone: search keeps its width, everything else folds into named icon buttons.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: FilterBarCollapsed,
        },
        {
          id: 'FilterBarCompactTable',
          title: 'Compact table toolbar',
          note: 'Directly above a dense table: search and one filter at the start, refresh, columns and export as icons at the end.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/data-entry/OptionSelect.tsx', 'primitives/table/Table.tsx', 'primitives/table/TableMessageRow.tsx', 'display/StatusBadge.tsx'],
          Component: FilterBarCompactTable,
        },
        {
          id: 'FilterBarFacetedSidebar',
          title: 'Faceted sidebar',
          note: 'For browsing a large catalogue by several properties at once; counts show what each choice would return.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx', 'primitives/table/TableMessageRow.tsx', 'display/StatusBadge.tsx'],
          Component: FilterBarFacetedSidebar,
        },
      ],
    },
    {
      id: 'domain-bars',
      title: 'Domain bars',
      description: 'Bars for alarms, assets, trends and work orders.',
      specimens: [
        {
          id: 'FilterBarAlarmList',
          title: 'Alarm list filter bar',
          note: 'For an alarm list: severity is a set of toggles with counts, because operators flip them far more than any other filter.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: [
            'patterns/data-entry/FilterBar.tsx',
            'actions/ToggleGroup.tsx',
            'industrial/StatusDot.tsx',
            'industrial/status.ts',
          ],
          Component: FilterBarAlarmList,
        },
        {
          id: 'FilterBarAssetCascade',
          title: 'Asset filter by site, system and type',
          note: 'For hierarchy filters: each select narrows the next, and changing a parent resets its children.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['patterns/data-entry/FilterBar.tsx', 'patterns/data-entry/OptionSelect.tsx'],
          Component: FilterBarAssetCascade,
        },
        {
          id: 'FilterBarAssigneeMenu',
          title: 'Multi-select menu filter',
          note: 'For a filter with a handful of values where several are often picked, such as assignees; the button shows the count.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['patterns/data-entry/FilterBar.tsx'],
          Component: FilterBarAssigneeMenu,
        },
        {
          id: 'FilterBarTrendToolbar',
          title: 'Trend toolbar',
          note: 'Above a chart: time range as a segmented control, the aggregate as a small select and live mode as a switch.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/data-entry/FilterBar.tsx', 'patterns/data-entry/OptionSelect.tsx'],
          Component: FilterBarTrendToolbar,
        },
        {
          id: 'FilterBarRunHistory',
          title: 'Run history bar',
          note: 'For logs where one outcome matters most: the result is a segmented control and the count names the time window.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/data-entry/FilterBar.tsx', 'patterns/data-entry/OptionSelect.tsx'],
          Component: FilterBarRunHistory,
        },
      ],
    },
  ],
});
