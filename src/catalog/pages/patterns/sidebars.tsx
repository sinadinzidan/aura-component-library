import { Avatar, AvatarIcon } from '@cognite/aura/components/avatar';
import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import {
  CheckboxGroup,
  CheckboxItem,
  CheckboxItemControl,
  CheckboxItemLabel,
} from '@cognite/aura/components/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@cognite/aura/components/dropdown-menu';
import { ItemContent, ItemDescription, ItemTitle } from '@cognite/aura/components/item';
import { Search } from '@cognite/aura/components/search';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import {
  IconBell,
  IconBuildingFactory2,
  IconChartLine,
  IconClipboardList,
  IconDatabase,
  IconEngine,
  IconFileText,
  IconHelpCircle,
  IconKey,
  IconLayoutDashboard,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconPalette,
  IconPlugConnected,
  IconRoute,
  IconSelector,
  IconSettings,
  IconShieldCheck,
  IconSitemap,
  IconTool,
  IconUsers,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { FilterableTree } from '../../../library/data/FilterableTree';
import { MetadataList } from '../../../library/display/MetadataList';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { StatusBadge } from '../../../library/display/StatusBadge';
import { severityStatus } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { PageHeader } from '../../../library/patterns/structure/PageHeader';
import { SectionHeader } from '../../../library/patterns/structure/SectionHeader';
import { Sidebar } from '../../../library/patterns/structure/Sidebar';
import { SidebarNav } from '../../../library/patterns/structure/SidebarNav';
import type { SidebarNavGroup, SidebarNavItem } from '../../../library/patterns/structure/SidebarNav';
import { ALARMS, ASSETS, PEOPLE, PLANT_KPIS, SENSORS, SITES, WORK_ORDERS } from '../../data/plant';
import type { Asset } from '../../data/plant';
import { formatAgo } from '../../data/series';
import { definePage } from '../../types';

import source from './sidebars.tsx?raw';

type SidebarTone = 'light' | 'dark';

const OPERATOR = PEOPLE[0];
const COMPRESSOR = ASSETS.find((asset) => asset.id === '23-ka-9101') ?? ASSETS[0];
const ACTIVE_ALARMS = ALARMS.filter((alarm) => alarm.state === 'active');
const OPEN_ORDERS = PLANT_KPIS.openWorkOrders.value;

const OVERVIEW: SidebarNavItem = { id: 'overview', label: 'Overview', icon: <IconLayoutDashboard /> };
const ALARM_ITEM: SidebarNavItem = { id: 'alarms', label: 'Alarms', icon: <IconBell /> };
const TRENDS: SidebarNavItem = { id: 'trends', label: 'Trends', icon: <IconChartLine /> };
const ASSET_ITEM: SidebarNavItem = { id: 'assets', label: 'Assets', icon: <IconSitemap /> };
const ORDERS: SidebarNavItem = { id: 'work-orders', label: 'Work orders', icon: <IconTool /> };
const INSPECTIONS: SidebarNavItem = { id: 'inspections', label: 'Inspections', icon: <IconClipboardList /> };
const DOCUMENTS: SidebarNavItem = { id: 'documents', label: 'Documents', icon: <IconFileText /> };
const DATA_SETS: SidebarNavItem = { id: 'data-sets', label: 'Data sets', icon: <IconDatabase /> };
const PIPELINES: SidebarNavItem = { id: 'pipelines', label: 'Pipelines', icon: <IconRoute /> };

/** One flat list: the five places an operator moves between. */
const FLAT_GROUPS: readonly SidebarNavGroup[] = [
  { id: 'main', items: [OVERVIEW, ALARM_ITEM, TRENDS, ASSET_ITEM, ORDERS] },
];

/** The same destinations in three named groups. */
const GROUPS: readonly SidebarNavGroup[] = [
  { id: 'operate', label: 'Operate', items: [OVERVIEW, ALARM_ITEM, TRENDS, ASSET_ITEM] },
  { id: 'maintain', label: 'Maintain', items: [ORDERS, INSPECTIONS] },
  { id: 'data', label: 'Data', items: [DATA_SETS, PIPELINES] },
];

const COUNTED_GROUPS: readonly SidebarNavGroup[] = [
  {
    id: 'operate',
    label: 'Operate',
    items: [OVERVIEW, { ...ALARM_ITEM, count: ACTIVE_ALARMS.length }, TRENDS, ASSET_ITEM],
  },
  { id: 'maintain', label: 'Maintain', items: [{ ...ORDERS, count: OPEN_ORDERS }, { ...INSPECTIONS, count: 5 }, DOCUMENTS] },
];

const FOLDABLE_GROUPS: readonly SidebarNavGroup[] = GROUPS.map((group) => ({ ...group, collapsible: true }));

const NESTED_GROUPS: readonly SidebarNavGroup[] = [
  {
    id: 'main',
    items: [
      OVERVIEW,
      ALARM_ITEM,
      {
        ...ASSET_ITEM,
        children: [
          { id: 'nk-20', label: 'Inlet and separation' },
          { id: 'nk-23', label: 'Gas compression' },
          { id: 'nk-27', label: 'Gas export' },
        ],
      },
      {
        ...ORDERS,
        children: [
          { id: 'orders-open', label: 'Open' },
          { id: 'orders-planned', label: 'Planned' },
        ],
      },
      PIPELINES,
    ],
  },
];

const SETTINGS_GROUPS: readonly SidebarNavGroup[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    items: [
      { id: 'general', label: 'General', icon: <IconSettings /> },
      { id: 'members', label: 'Members', icon: <IconUsers /> },
      { id: 'permissions', label: 'Permissions', icon: <IconShieldCheck /> },
      { id: 'integrations', label: 'Integrations', icon: <IconPlugConnected /> },
    ],
  },
  {
    id: 'account',
    label: 'Your account',
    items: [
      { id: 'appearance', label: 'Appearance', icon: <IconPalette /> },
      { id: 'notifications', label: 'Notifications', icon: <IconBell /> },
      { id: 'tokens', label: 'API keys', icon: <IconKey /> },
    ],
  },
];

const PINNED_GROUPS: readonly SidebarNavGroup[] = [
  { id: 'main', items: [OVERVIEW, ALARM_ITEM, ORDERS] },
  {
    id: 'pinned',
    label: 'Pinned',
    collapsible: true,
    items: [
      { id: '23-ka-9101', label: '1st stage compressor', icon: <IconEngine /> },
      { id: '23-ka-9103', label: 'Recompressor', icon: <IconEngine /> },
      { id: 'compression-overview', label: 'Compression overview', icon: <IconLayoutDashboard /> },
    ],
  },
  {
    id: 'recent',
    label: 'Recent',
    collapsible: true,
    items: [
      { id: 'wo-104482', label: 'WO-104482', icon: <IconTool /> },
      { id: 'historian', label: 'Process historian', icon: <IconDatabase /> },
    ],
  },
];

const CONTENTS_GROUPS: readonly SidebarNavGroup[] = [
  {
    id: 'contents',
    label: 'On this page',
    items: [
      { id: 'summary', label: 'Summary' },
      { id: 'readings', label: 'Readings' },
      { id: 'alarms', label: 'Alarms' },
      { id: 'maintenance', label: 'Maintenance history' },
      { id: 'documents', label: 'Documents' },
    ],
  },
];

/** Rail destinations and the pages each one opens in the second column. */
const RAIL_GROUPS: readonly SidebarNavGroup[] = [
  {
    id: 'apps',
    items: [
      { id: 'operate', label: 'Operate', icon: <IconLayoutDashboard /> },
      { id: 'maintain', label: 'Maintain', icon: <IconTool /> },
      { id: 'data', label: 'Data', icon: <IconDatabase /> },
    ],
  },
  { id: 'system', label: 'System', items: [{ id: 'settings', label: 'Settings', icon: <IconSettings /> }] },
];

const RAIL_PAGES: Record<string, { title: string; groups: readonly SidebarNavGroup[] }> = {
  operate: {
    title: 'Operate',
    groups: [{ id: 'pages', items: [{ id: 'overview', label: 'Overview' }, { id: 'alarms', label: 'Alarms', count: ACTIVE_ALARMS.length }, { id: 'trends', label: 'Trends' }, { id: 'handover', label: 'Shift handover' }] }],
  },
  maintain: {
    title: 'Maintain',
    groups: [{ id: 'pages', items: [{ id: 'work-orders', label: 'Work orders', count: OPEN_ORDERS }, { id: 'inspections', label: 'Inspections' }, { id: 'spares', label: 'Spare parts' }] }],
  },
  data: {
    title: 'Data',
    groups: [{ id: 'pages', items: [{ id: 'data-sets', label: 'Data sets' }, { id: 'pipelines', label: 'Pipelines' }, { id: 'quality', label: 'Data quality' }] }],
  },
  settings: {
    title: 'Settings',
    groups: [{ id: 'pages', items: [{ id: 'general', label: 'General' }, { id: 'members', label: 'Members' }, { id: 'permissions', label: 'Permissions' }] }],
  },
};

const ASSET_NODES: Record<string, Asset> = Object.fromEntries(ASSETS.map((asset) => [asset.id, asset]));
const assetChildren = (asset: Asset) => ASSETS.filter((candidate) => candidate.parentId === asset.id).map((child) => child.id);
const assetName = (asset: Asset) => asset.name;
const assetTag = (asset: Asset) => asset.tag;

const ORDER_STATUSES = [
  { id: 'open', label: 'Open' },
  { id: 'planned', label: 'Planned' },
  { id: 'in-progress', label: 'In progress' },
  { id: 'waiting', label: 'Waiting' },
  { id: 'done', label: 'Done' },
];
const ORDER_PRIORITIES = ['P1', 'P2', 'P3', 'P4'];

function sidebarLabel(groups: readonly SidebarNavGroup[], id: string): string {
  const items = groups.flatMap((group) => group.items).flatMap((item) => [item, ...(item.children ?? [])]);
  return items.find((item) => item.id === id)?.label ?? '';
}

function sidebarToggle(values: readonly string[], value: string): string[] {
  return values.includes(value) ? values.filter((current) => current !== value) : [...values, value];
}

/** A slice of an app window: the sidebar next to the page it navigates. */
function SidebarStage({ title, children, side = 'left' }: { title: string; children: ReactNode; side?: 'left' | 'right' }) {
  const page = (
    <div className="min-w-0 flex-1 bg-muted-background p-4">
      <p className="truncate text-sm font-medium text-muted-foreground">{title}</p>
    </div>
  );

  return (
    <div className="flex h-104 w-full overflow-hidden rounded-xl border border-default">
      {side === 'right' ? page : null}
      {children}
      {side === 'left' ? page : null}
    </div>
  );
}

/** The product mark and name that top a sidebar. */
function SidebarBrand({ tone = 'light', collapsed = false }: { tone?: SidebarTone; collapsed?: boolean }) {
  return (
    <div className={`flex min-h-9 items-center gap-2 ${collapsed ? 'justify-center' : 'px-2'}`}>
      <Avatar variant="overflow" sizes="xsm" aria-hidden="true">
        <AvatarIcon>
          <IconBuildingFactory2 />
        </AvatarIcon>
      </Avatar>
      {collapsed ? null : (
        <span className={`truncate text-sm font-semibold ${tone === 'dark' ? 'text-popover-foreground-fixed-dark' : 'text-base-foreground'}`}>
          Plant operations
        </span>
      )}
    </div>
  );
}

/** Site switcher for the sidebar header: the current site, and a menu of the others. */
function SidebarSiteSwitcher({ tone = 'light' }: { tone?: SidebarTone }) {
  const [siteId, setSiteId] = useState(SITES[0].id);
  const site = SITES.find((candidate) => candidate.id === siteId) ?? SITES[0];
  const colors =
    tone === 'dark'
      ? { row: 'hover:bg-base-background-hover-fixed-dark', title: 'text-popover-foreground-fixed-dark', quiet: 'text-muted-foreground-fixed-dark' }
      : { row: 'hover:bg-base-background-hover', title: 'text-base-foreground', quiet: 'text-muted-foreground' };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={`Switch site, current site ${site.name}`}
            className={`flex w-full items-center gap-2 rounded-lg p-2 text-left outline-none transition-colors focus-visible:shadow-focus-ring ${colors.row}`}
          >
            <Avatar variant="overflow" sizes="xsm" aria-hidden="true">
              <AvatarIcon>
                <IconBuildingFactory2 />
              </AvatarIcon>
            </Avatar>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className={`truncate text-sm font-medium ${colors.title}`}>{site.name}</span>
              <span className={`truncate text-xs ${colors.quiet}`}>{site.region}</span>
            </span>
            <IconSelector aria-hidden="true" className={`size-4 shrink-0 ${colors.quiet}`} />
          </button>
        }
      />
      <DropdownMenuContent className="w-56">
        <DropdownMenuRadioGroup
          value={siteId}
          onValueChange={(next) => {
            if (typeof next === 'string') setSiteId(next);
          }}
        >
          {SITES.map((candidate) => (
            <DropdownMenuRadioItem key={candidate.id} value={candidate.id}>
              {candidate.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>View all sites</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The signed-in person at the foot of a sidebar, with the account menu behind the row. */
function SidebarUser({ tone = 'light', collapsed = false }: { tone?: SidebarTone; collapsed?: boolean }) {
  const colors =
    tone === 'dark'
      ? { row: 'hover:bg-base-background-hover-fixed-dark', title: 'text-popover-foreground-fixed-dark', quiet: 'text-muted-foreground-fixed-dark' }
      : { row: 'hover:bg-base-background-hover', title: 'text-base-foreground', quiet: 'text-muted-foreground' };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={`Account menu for ${OPERATOR.name}`}
            className={`flex w-full items-center gap-2 rounded-lg text-left outline-none transition-colors focus-visible:shadow-focus-ring ${colors.row} ${collapsed ? 'justify-center p-1' : 'p-2'}`}
          >
            <PersonAvatar name={OPERATOR.name} sizes="xsm" />
            {collapsed ? null : (
              <>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className={`truncate text-sm font-medium ${colors.title}`}>{OPERATOR.name}</span>
                  <span className={`truncate text-xs ${colors.quiet}`}>{OPERATOR.role}</span>
                </span>
                <IconSelector aria-hidden="true" className={`size-4 shrink-0 ${colors.quiet}`} />
              </>
            )}
          </button>
        }
      />
      <DropdownMenuContent side="top" className="w-56">
        <DropdownMenuItem>Profile and preferences</DropdownMenuItem>
        <DropdownMenuItem>Keyboard shortcuts</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SidebarLabelsOnly() {
  const [active, setActive] = useState('overview');
  const groups: readonly SidebarNavGroup[] = [
    { id: 'main', items: FLAT_GROUPS[0].items.map((item) => ({ id: item.id, label: item.label })) },
  ];

  return (
    <SidebarStage title={sidebarLabel(groups, active)}>
      <Sidebar label="Sidebar">
        <SidebarNav label="Main" groups={groups} activeId={active} onSelect={setActive} />
      </Sidebar>
    </SidebarStage>
  );
}

function SidebarIconAndLabel() {
  const [active, setActive] = useState('alarms');

  return (
    <SidebarStage title={sidebarLabel(FLAT_GROUPS, active)}>
      <Sidebar label="Sidebar" header={<SidebarBrand />}>
        <SidebarNav label="Main" groups={FLAT_GROUPS} activeId={active} onSelect={setActive} />
      </Sidebar>
    </SidebarStage>
  );
}

function SidebarGrouped() {
  const [active, setActive] = useState('work-orders');

  return (
    <SidebarStage title={sidebarLabel(GROUPS, active)}>
      <Sidebar label="Sidebar">
        <SidebarNav label="Main" groups={GROUPS} activeId={active} onSelect={setActive} />
      </Sidebar>
    </SidebarStage>
  );
}

function SidebarWithCounts() {
  const [active, setActive] = useState('overview');
  const groups: readonly SidebarNavGroup[] = COUNTED_GROUPS.map((group) => ({
    ...group,
    items: group.items.map((item) =>
      item.id === 'alarms' ? { ...item, count: undefined, trailing: <Badge variant="error">{ACTIVE_ALARMS.length}</Badge> } : item
    ),
  }));

  return (
    <SidebarStage title={sidebarLabel(groups, active)}>
      <Sidebar label="Sidebar">
        <SidebarNav label="Main" groups={groups} activeId={active} onSelect={setActive} />
      </Sidebar>
    </SidebarStage>
  );
}

function SidebarNested() {
  const [active, setActive] = useState('nk-23');

  return (
    <SidebarStage title={sidebarLabel(NESTED_GROUPS, active)}>
      <Sidebar label="Sidebar">
        <SidebarNav label="Main" groups={NESTED_GROUPS} activeId={active} onSelect={setActive} />
      </Sidebar>
    </SidebarStage>
  );
}

function SidebarFoldableGroups() {
  const [active, setActive] = useState('trends');

  return (
    <SidebarStage title={sidebarLabel(FOLDABLE_GROUPS, active)}>
      <Sidebar label="Sidebar">
        <SidebarNav
          label="Main"
          groups={FOLDABLE_GROUPS}
          activeId={active}
          onSelect={setActive}
          defaultCollapsedGroupIds={['data']}
        />
      </Sidebar>
    </SidebarStage>
  );
}

function SidebarWithSiteSwitcher() {
  const [active, setActive] = useState('overview');

  return (
    <SidebarStage title={sidebarLabel(FLAT_GROUPS, active)}>
      <Sidebar label="Sidebar" header={<SidebarSiteSwitcher />}>
        <SidebarNav label="Main" groups={FLAT_GROUPS} activeId={active} onSelect={setActive} />
      </Sidebar>
    </SidebarStage>
  );
}

function SidebarWithSearch() {
  const [active, setActive] = useState('overview');
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const groups = GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.label.toLowerCase().includes(needle)),
  })).filter((group) => group.items.length > 0);

  return (
    <SidebarStage title={sidebarLabel(GROUPS, active)}>
      <Sidebar
        label="Sidebar"
        header={
          <Search
            aria-label="Search navigation"
            placeholder="Search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onClear={() => setQuery('')}
            className="w-full"
          />
        }
      >
        {groups.length > 0 ? (
          <SidebarNav label="Main" groups={groups} activeId={active} onSelect={setActive} />
        ) : (
          <p className="p-2 text-sm text-muted-foreground">No pages match the search.</p>
        )}
      </Sidebar>
    </SidebarStage>
  );
}

function SidebarWithUserFooter() {
  const [active, setActive] = useState('overview');

  return (
    <SidebarStage title={sidebarLabel(FLAT_GROUPS, active)}>
      <Sidebar label="Sidebar" header={<SidebarBrand />} footer={<SidebarUser />}>
        <SidebarNav label="Main" groups={FLAT_GROUPS} activeId={active} onSelect={setActive} />
      </Sidebar>
    </SidebarStage>
  );
}

function SidebarRail() {
  const [active, setActive] = useState('alarms');

  return (
    <SidebarStage title={sidebarLabel(GROUPS, active)}>
      <Sidebar label="Sidebar" collapsed header={<SidebarBrand collapsed />} footer={<SidebarUser collapsed />}>
        <SidebarNav label="Main" groups={GROUPS} activeId={active} onSelect={setActive} collapsed />
      </Sidebar>
    </SidebarStage>
  );
}

function SidebarDark() {
  const [active, setActive] = useState('overview');

  return (
    <SidebarStage title={sidebarLabel(COUNTED_GROUPS, active)}>
      <Sidebar label="Sidebar" tone="dark" header={<SidebarBrand tone="dark" />}>
        <SidebarNav label="Main" groups={COUNTED_GROUPS} activeId={active} onSelect={setActive} tone="dark" />
      </Sidebar>
    </SidebarStage>
  );
}

function SidebarDarkRail() {
  const [active, setActive] = useState('work-orders');

  return (
    <SidebarStage title={sidebarLabel(GROUPS, active)}>
      <Sidebar
        label="Sidebar"
        tone="dark"
        collapsed
        header={<SidebarBrand tone="dark" collapsed />}
        footer={<SidebarUser tone="dark" collapsed />}
      >
        <SidebarNav label="Main" groups={GROUPS} activeId={active} onSelect={setActive} tone="dark" collapsed />
      </Sidebar>
    </SidebarStage>
  );
}

function SidebarCollapseToggle() {
  const [active, setActive] = useState('overview');
  const [collapsed, setCollapsed] = useState(false);
  const label = collapsed ? 'Expand sidebar' : 'Collapse sidebar';

  return (
    <SidebarStage title={sidebarLabel(GROUPS, active)}>
      <Sidebar
        label="Sidebar"
        collapsed={collapsed}
        header={<SidebarBrand collapsed={collapsed} />}
        footer={
          <div className={`flex ${collapsed ? 'justify-center' : 'justify-end'}`}>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={label}
                    aria-expanded={!collapsed}
                    onClick={() => setCollapsed((current) => !current)}
                  >
                    {collapsed ? <IconLayoutSidebarLeftExpand /> : <IconLayoutSidebarLeftCollapse />}
                  </Button>
                }
              />
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          </div>
        }
      >
        <SidebarNav label="Main" groups={GROUPS} activeId={active} onSelect={setActive} collapsed={collapsed} />
      </Sidebar>
    </SidebarStage>
  );
}

function SidebarDarkComplete() {
  const [active, setActive] = useState('alarms');

  return (
    <SidebarStage title={sidebarLabel(COUNTED_GROUPS, active)}>
      <Sidebar label="Sidebar" tone="dark" header={<SidebarSiteSwitcher tone="dark" />} footer={<SidebarUser tone="dark" />}>
        <SidebarNav label="Main" groups={COUNTED_GROUPS} activeId={active} onSelect={setActive} tone="dark" />
      </Sidebar>
    </SidebarStage>
  );
}

function SidebarSettingsNav() {
  const [active, setActive] = useState('members');

  return (
    <SidebarStage title={sidebarLabel(SETTINGS_GROUPS, active)}>
      <Sidebar label="Settings sections">
        <SidebarNav label="Settings" groups={SETTINGS_GROUPS} activeId={active} onSelect={setActive} />
      </Sidebar>
    </SidebarStage>
  );
}

function SidebarFilters() {
  const [statuses, setStatuses] = useState<readonly string[]>(['open', 'in-progress']);
  const [priorities, setPriorities] = useState<readonly string[]>(['P1', 'P2']);
  const matches = WORK_ORDERS.filter((order) => statuses.includes(order.status) && priorities.includes(order.priority)).length;
  const clear = () => {
    setStatuses([]);
    setPriorities([]);
  };

  return (
    <SidebarStage title={`${matches} work orders`}>
      <Sidebar
        label="Filters"
        header={
          <div className="flex min-h-9 items-center justify-between gap-2 pl-2">
            <h3 className="text-sm font-semibold text-base-foreground">Filters</h3>
            <Button variant="ghost" size="sm" onClick={clear}>
              Clear all
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-6 p-2">
          <div className="flex flex-col gap-2">
            <SectionHeader size="sm" as="h4" title="Status" />
            <CheckboxGroup aria-label="Status">
              {ORDER_STATUSES.map((status) => (
                <CheckboxItem key={status.id}>
                  <CheckboxItemControl
                    checked={statuses.includes(status.id)}
                    onCheckedChange={() => setStatuses((current) => sidebarToggle(current, status.id))}
                  />
                  <CheckboxItemLabel>{status.label}</CheckboxItemLabel>
                </CheckboxItem>
              ))}
            </CheckboxGroup>
          </div>
          <div className="flex flex-col gap-2">
            <SectionHeader size="sm" as="h4" title="Priority" />
            <CheckboxGroup aria-label="Priority">
              {ORDER_PRIORITIES.map((priority) => (
                <CheckboxItem key={priority}>
                  <CheckboxItemControl
                    checked={priorities.includes(priority)}
                    onCheckedChange={() => setPriorities((current) => sidebarToggle(current, priority))}
                  />
                  <CheckboxItemLabel>{priority}</CheckboxItemLabel>
                </CheckboxItem>
              ))}
            </CheckboxGroup>
          </div>
        </div>
      </Sidebar>
    </SidebarStage>
  );
}

function SidebarAssetTree() {
  return (
    <SidebarStage title="Assets">
      <Sidebar label="Asset hierarchy">
        <FilterableTree
          rootItemId="nk"
          items={ASSET_NODES}
          getChildren={assetChildren}
          getItemName={assetName}
          getSearchText={assetTag}
          searchLabel="Search assets"
          placeholder="Search assets"
          defaultExpandedItems={['nk-23']}
        >
          {(item) => (
            <ItemContent>
              <ItemTitle>{item.getItemName()}</ItemTitle>
              {item.isFolder() ? null : <ItemDescription>{item.getItemData().tag}</ItemDescription>}
            </ItemContent>
          )}
        </FilterableTree>
      </Sidebar>
    </SidebarStage>
  );
}

function SidebarPinnedAndRecent() {
  const [active, setActive] = useState('23-ka-9101');

  return (
    <SidebarStage title={sidebarLabel(PINNED_GROUPS, active)}>
      <Sidebar label="Sidebar">
        <SidebarNav label="Main" groups={PINNED_GROUPS} activeId={active} onSelect={setActive} />
      </Sidebar>
    </SidebarStage>
  );
}

function SidebarContextPanel() {
  const readings = SENSORS.filter((sensor) => sensor.assetId === COMPRESSOR.id && sensor.name.length < 20).slice(0, 4);

  return (
    <SidebarStage title="Trend" side="right">
      <Sidebar label="Selected asset" side="right">
        <div className="flex flex-col gap-6 p-2">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold text-base-foreground">{COMPRESSOR.name}</h3>
              <p className="text-xs text-muted-foreground">{COMPRESSOR.tag}</p>
            </div>
            <div>
              <StatusBadge status={COMPRESSOR.state} />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <SectionHeader size="sm" as="h4" title="Readings" />
            <MetadataList
              items={readings.map((sensor) => ({
                label: sensor.name,
                value: <ValueReadout value={sensor.value} unit={sensor.unit} decimals={sensor.decimals} size="xs" />,
              }))}
            />
          </div>
          <Button variant="secondary" size="sm" className="w-full">
            Open asset
          </Button>
        </div>
      </Sidebar>
    </SidebarStage>
  );
}

function SidebarTableOfContents() {
  const [active, setActive] = useState('readings');

  return (
    <SidebarStage title={COMPRESSOR.name} side="right">
      <Sidebar label="Page contents" side="right">
        <SidebarNav label="On this page" groups={CONTENTS_GROUPS} activeId={active} onSelect={setActive} />
      </Sidebar>
    </SidebarStage>
  );
}

function SidebarWithStatusFooter() {
  const [active, setActive] = useState('overview');

  return (
    <SidebarStage title={sidebarLabel(FLAT_GROUPS, active)}>
      <Sidebar
        label="Sidebar"
        header={<SidebarBrand />}
        footer={
          <div className="flex flex-col gap-2 p-2">
            <StatusIndicator tone="success" label="Historian connected" size="sm" />
            <p className="text-xs text-muted-foreground">Last sample {formatAgo(ALARMS[0].raisedAt + 13 * 60_000)}</p>
            <a
              href="https://docs.cognite.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-sm text-xs font-medium text-link-foreground outline-none hover:underline focus-visible:shadow-focus-ring"
            >
              <IconHelpCircle aria-hidden="true" className="size-3.5" /> Help and documentation
            </a>
          </div>
        }
      >
        <SidebarNav label="Main" groups={FLAT_GROUPS} activeId={active} onSelect={setActive} />
      </Sidebar>
    </SidebarStage>
  );
}

function SidebarRailAndPanel() {
  const [area, setArea] = useState('operate');
  const [page, setPage] = useState('alarms');
  const section = RAIL_PAGES[area] ?? RAIL_PAGES.operate;
  const openArea = (next: string) => {
    setArea(next);
    setPage((RAIL_PAGES[next] ?? RAIL_PAGES.operate).groups[0].items[0].id);
  };

  return (
    <SidebarStage title={sidebarLabel(section.groups, page)}>
      <Sidebar label="Product areas" tone="dark" collapsed header={<SidebarBrand tone="dark" collapsed />} footer={<SidebarUser tone="dark" collapsed />}>
        <SidebarNav label="Product areas" groups={RAIL_GROUPS} activeId={area} onSelect={openArea} tone="dark" collapsed />
      </Sidebar>
      <Sidebar
        label={`${section.title} pages`}
        header={
          <div className="flex min-h-9 items-center px-2">
            <h3 className="text-sm font-semibold text-base-foreground">{section.title}</h3>
          </div>
        }
      >
        <SidebarNav label={section.title} groups={section.groups} activeId={page} onSelect={setPage} />
      </Sidebar>
    </SidebarStage>
  );
}

function SidebarAppShell() {
  const [active, setActive] = useState('alarms');
  const title = sidebarLabel(COUNTED_GROUPS, active);

  return (
    <div className="flex h-112 w-full overflow-hidden rounded-xl border border-default">
      <Sidebar label="Sidebar" header={<SidebarSiteSwitcher />} footer={<SidebarUser />}>
        <SidebarNav label="Main" groups={COUNTED_GROUPS} activeId={active} onSelect={setActive} />
      </Sidebar>
      <main className="flex min-w-0 flex-1 flex-col gap-6 overflow-y-auto bg-base-background p-6">
        <PageHeader
          as="h2"
          title={title}
          description={active === 'alarms' ? `${ACTIVE_ALARMS.length} active, 2 acknowledged` : 'Nordkapp plant'}
          actions={<Button variant="secondary">Export list</Button>}
          divider
        />
        <ul className="flex flex-col gap-4">
          {ALARMS.slice(0, 5).map((alarm) => (
            <li key={alarm.id} className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-base-foreground">{alarm.message}</p>
                <p className="text-xs text-muted-foreground">
                  {alarm.sensorTag} · {alarm.value} · {formatAgo(alarm.raisedAt)}
                </p>
              </div>
              <StatusIndicator {...severityStatus(alarm.severity)} size="sm" />
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}

export default definePage({
  id: 'sidebars',
  title: 'Sidebars',
  summary:
    'Navigation and context that stay beside the page: the main sidebar of an app, its collapsed rail, and the secondary panels for settings, filters, hierarchies and the current selection.',
  guidance: {
    use: [
      'For three or more top-level destinations that people move between all day.',
      'Group by task, label the groups, and keep each to seven rows or fewer.',
      'Mark the current page with fill and weight, and with aria-current for assistive tech.',
      'Fixed-dark chrome only for the app-level sidebar, never for panels inside the page.',
    ],
    avoid: [
      'Two sidebars that both navigate the whole app. One navigates, the other gives context.',
      'More than one nested level. Deeper structures belong in a tree or on the page.',
      'Status colour for counts that are not a problem. A quiet number is enough.',
      'Icons on some rows of a group and not on others.',
    ],
  },
  source,
  sections: [
    {
      id: 'basics',
      title: 'Basics',
      description: 'A list of destinations, with icons and groups as the list grows.',
      specimens: [
        {
          id: 'SidebarLabelsOnly',
          title: 'Labels only',
          note: 'For a handful of destinations with clear names. The quietest form.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/structure/Sidebar.tsx', 'patterns/structure/SidebarNav.tsx'],
          Component: SidebarLabelsOnly,
        },
        {
          id: 'SidebarIconAndLabel',
          title: 'Icon and label',
          note: 'The default for an app sidebar, and required if it can collapse to a rail.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/structure/Sidebar.tsx', 'patterns/structure/SidebarNav.tsx'],
          Component: SidebarIconAndLabel,
        },
        {
          id: 'SidebarGrouped',
          title: 'Grouped sections',
          note: 'Once there are more than seven destinations: group them by task and label each group.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/structure/Sidebar.tsx', 'patterns/structure/SidebarNav.tsx'],
          Component: SidebarGrouped,
        },
      ],
    },
    {
      id: 'rows',
      title: 'Counts, nesting and folding',
      description: 'What a row can carry, and how a long list stays short.',
      specimens: [
        {
          id: 'SidebarWithCounts',
          title: 'With counts and badge',
          note: 'Quiet numbers for how much is waiting; a status badge only where a count means trouble.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/structure/Sidebar.tsx', 'patterns/structure/SidebarNav.tsx'],
          Component: SidebarWithCounts,
        },
        {
          id: 'SidebarNested',
          title: 'Nested',
          note: 'When a destination has a few fixed sub-pages. The parent opens and closes; children navigate.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/structure/Sidebar.tsx', 'patterns/structure/SidebarNav.tsx'],
          Component: SidebarNested,
        },
        {
          id: 'SidebarFoldableGroups',
          title: 'Foldable groups',
          note: 'When some groups are used daily and others rarely, let people fold the rare ones away.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/structure/Sidebar.tsx', 'patterns/structure/SidebarNav.tsx'],
          Component: SidebarFoldableGroups,
        },
      ],
    },
    {
      id: 'header-and-footer',
      title: 'Header and footer',
      description: 'What stays pinned above and below the list while it scrolls.',
      specimens: [
        {
          id: 'SidebarWithSiteSwitcher',
          title: 'With site switcher',
          note: 'When everything in the app is scoped to one site, plant or workspace at a time.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/structure/Sidebar.tsx', 'patterns/structure/SidebarNav.tsx'],
          Component: SidebarWithSiteSwitcher,
        },
        {
          id: 'SidebarWithSearch',
          title: 'With search',
          note: 'For a long navigation, such as documentation or settings with many sections.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/structure/Sidebar.tsx', 'patterns/structure/SidebarNav.tsx'],
          Component: SidebarWithSearch,
        },
        {
          id: 'SidebarWithUserFooter',
          title: 'With user footer',
          note: 'When the app has no topbar of its own to hold the account menu.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/structure/Sidebar.tsx', 'patterns/structure/SidebarNav.tsx', 'display/PersonAvatar.tsx'],
          Component: SidebarWithUserFooter,
        },
      ],
    },
    {
      id: 'rail-and-dark',
      title: 'Rail and dark chrome',
      description: 'The collapsed icon rail, and the fixed-dark shell that stays dark in both themes.',
      specimens: [
        {
          id: 'SidebarRail',
          title: 'Collapsed rail',
          note: 'When the page needs the width: icons only, with every label in a tooltip.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/structure/Sidebar.tsx', 'patterns/structure/SidebarNav.tsx', 'display/PersonAvatar.tsx'],
          Component: SidebarRail,
        },
        {
          id: 'SidebarDark',
          title: 'Dark chrome',
          note: 'For the app-level sidebar when the product separates shell from content by tone.',
          origin: 'custom',
          align: 'stretch',
          surface: 'chrome',
          uses: ['patterns/structure/Sidebar.tsx', 'patterns/structure/SidebarNav.tsx'],
          Component: SidebarDark,
        },
        {
          id: 'SidebarDarkRail',
          title: 'Dark rail',
          note: 'The collapsed form of the dark sidebar, for wall screens and dense workspaces.',
          origin: 'custom',
          align: 'stretch',
          surface: 'chrome',
          uses: ['patterns/structure/Sidebar.tsx', 'patterns/structure/SidebarNav.tsx', 'display/PersonAvatar.tsx'],
          Component: SidebarDarkRail,
        },
        {
          id: 'SidebarCollapseToggle',
          title: 'Collapse toggle',
          note: 'Let people choose between labels and width. Press the button in the footer to try.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/Sidebar.tsx', 'patterns/structure/SidebarNav.tsx'],
          Component: SidebarCollapseToggle,
        },
        {
          id: 'SidebarDarkComplete',
          title: 'Dark with switcher and user',
          note: 'The full dark sidebar: site switcher, grouped rows with counts and the account row.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'chrome',
          uses: ['patterns/structure/Sidebar.tsx', 'patterns/structure/SidebarNav.tsx', 'display/PersonAvatar.tsx'],
          Component: SidebarDarkComplete,
        },
      ],
    },
    {
      id: 'secondary-panels',
      title: 'Secondary panels',
      description: 'Side panels that are not the app navigation: settings, filters, hierarchies and context.',
      specimens: [
        {
          id: 'SidebarSettingsNav',
          title: 'Settings navigation',
          note: 'For a settings area with more sections than tabs can hold.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/structure/Sidebar.tsx', 'patterns/structure/SidebarNav.tsx'],
          Component: SidebarSettingsNav,
        },
        {
          id: 'SidebarFilters',
          title: 'Filter sidebar',
          note: 'When a list has several multi-value filters that people adjust again and again.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/structure/Sidebar.tsx', 'patterns/structure/SectionHeader.tsx'],
          Component: SidebarFilters,
        },
        {
          id: 'SidebarAssetTree',
          title: 'Tree navigation',
          note: 'For a deep hierarchy such as assets: a searchable tree instead of nested rows.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/structure/Sidebar.tsx', 'data/FilterableTree.tsx'],
          Component: SidebarAssetTree,
        },
        {
          id: 'SidebarPinnedAndRecent',
          title: 'Pinned and recent',
          note: 'When people return to the same few records: keep their own shortcuts under the main rows.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/structure/Sidebar.tsx', 'patterns/structure/SidebarNav.tsx'],
          Component: SidebarPinnedAndRecent,
        },
        {
          id: 'SidebarContextPanel',
          title: 'Context panel',
          note: 'On the right of a canvas or chart: a short summary of what is selected, and a way to open it.',
          origin: 'custom',
          align: 'stretch',
          uses: [
            'patterns/structure/Sidebar.tsx',
            'patterns/structure/SectionHeader.tsx',
            'display/MetadataList.tsx',
            'display/StatusBadge.tsx',
            'industrial/ValueReadout.tsx',
          ],
          Component: SidebarContextPanel,
        },
        {
          id: 'SidebarTableOfContents',
          title: 'On this page',
          note: 'On a long record or document page, to jump between its sections.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/structure/Sidebar.tsx', 'patterns/structure/SidebarNav.tsx'],
          Component: SidebarTableOfContents,
        },
      ],
    },
    {
      id: 'in-the-shell',
      title: 'In the shell',
      description: 'Sidebars with the rest of the frame around them.',
      specimens: [
        {
          id: 'SidebarRailAndPanel',
          title: 'Rail and section panel',
          note: 'For a product with several areas: the rail picks the area, the panel lists its pages.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['patterns/structure/Sidebar.tsx', 'patterns/structure/SidebarNav.tsx', 'display/PersonAvatar.tsx'],
          Component: SidebarRailAndPanel,
        },
        {
          id: 'SidebarWithStatusFooter',
          title: 'With status footer',
          note: 'When the connection to the plant matters on every page, and help should be one press away.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/structure/Sidebar.tsx', 'patterns/structure/SidebarNav.tsx', 'industrial/StatusIndicator.tsx'],
          Component: SidebarWithStatusFooter,
        },
        {
          id: 'SidebarAppShell',
          title: 'Sidebar and page',
          note: 'The whole arrangement: switcher, navigation and account on the left, page header and content on the right.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: [
            'patterns/structure/Sidebar.tsx',
            'patterns/structure/SidebarNav.tsx',
            'patterns/structure/PageHeader.tsx',
            'industrial/StatusIndicator.tsx',
            'display/PersonAvatar.tsx',
          ],
          Component: SidebarAppShell,
        },
      ],
    },
  ],
});
