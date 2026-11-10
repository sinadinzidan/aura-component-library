import { Avatar, AvatarIcon } from '@cognite/aura/components/avatar';
import { Badge } from '@cognite/aura/components/badge';
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbEllipsisButton,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@cognite/aura/components/breadcrumb';
import { Button } from '@cognite/aura/components/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@cognite/aura/components/command';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuHeader,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@cognite/aura/components/dropdown-menu';
import { Tabs, TabsLabel, TabsList, TabsTrigger } from '@cognite/aura/components/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import {
  IconAdjustmentsHorizontal,
  IconBell,
  IconBook,
  IconBuildingFactory2,
  IconChartLine,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconClipboardList,
  IconCopy,
  IconDatabase,
  IconDots,
  IconExternalLink,
  IconEngine,
  IconFileText,
  IconGridDots,
  IconHelpCircle,
  IconKeyboard,
  IconLayoutDashboard,
  IconLogout,
  IconMenu2,
  IconMessageCircle,
  IconPencil,
  IconPlus,
  IconRoute,
  IconSettings,
  IconSitemap,
  IconSpeakerphone,
  IconTool,
  IconTrash,
  IconUser,
  IconUserPlus,
  IconX,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';

import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { StatusBadge } from '../../../library/display/StatusBadge';
import { severityStatus } from '../../../library/industrial/status';
import { StatusDot } from '../../../library/industrial/StatusDot';
import { MenuPanel } from '../../../library/patterns/structure/MenuPanel';
import { SidebarNav } from '../../../library/patterns/structure/SidebarNav';
import type { SidebarNavGroup } from '../../../library/patterns/structure/SidebarNav';
import { ALARMS, ASSETS, PEOPLE, SITES, WORK_ORDERS } from '../../data/plant';
import { formatAgo } from '../../data/series';
import { definePage } from '../../types';

import source from './navigation-menus.tsx?raw';

const OPERATOR = PEOPLE[0];
const OPERATOR_EMAIL = 'ingrid.haugen@nordkapp.test';
const ROW_ORDERS = WORK_ORDERS.slice(0, 3);
const NOTIFICATIONS = ALARMS.slice(0, 4);
const HIDDEN_LEVELS = ['Nordkapp plant', 'Gas compression', 'Compression train 1'];

const WORKSPACES = [
  { id: 'operations', name: 'Operations', detail: '42 members' },
  { id: 'maintenance', name: 'Maintenance', detail: '18 members' },
  { id: 'reliability', name: 'Reliability engineering', detail: '7 members' },
];

const APPS = [
  { id: 'operate', name: 'Operations', icon: <IconLayoutDashboard />, variant: 'decorative-2' },
  { id: 'maintain', name: 'Maintenance', icon: <IconTool />, variant: 'decorative-3' },
  { id: 'trends', name: 'Trends', icon: <IconChartLine />, variant: 'decorative-4' },
  { id: 'assets', name: 'Asset explorer', icon: <IconSitemap />, variant: 'decorative-5' },
  { id: 'data', name: 'Data catalog', icon: <IconDatabase />, variant: 'decorative-6' },
  { id: 'pipelines', name: 'Pipelines', icon: <IconRoute />, variant: 'decorative-7' },
] as const;

const COLUMNS = [
  { id: 'status', label: 'Status' },
  { id: 'priority', label: 'Priority' },
  { id: 'assignee', label: 'Assignee' },
  { id: 'due', label: 'Due date' },
  { id: 'estimate', label: 'Estimate' },
];

const DENSITIES = [
  { id: 'comfortable', label: 'Comfortable' },
  { id: 'compact', label: 'Compact' },
];

const THEMES = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'Match system' },
];

const MOBILE_GROUPS: readonly SidebarNavGroup[] = [
  {
    id: 'main',
    items: [
      { id: 'overview', label: 'Overview', icon: <IconLayoutDashboard /> },
      { id: 'alarms', label: 'Alarms', icon: <IconBell />, count: 3 },
      { id: 'work-orders', label: 'Work orders', icon: <IconTool />, count: 23 },
      { id: 'assets', label: 'Assets', icon: <IconSitemap /> },
      { id: 'trends', label: 'Trends', icon: <IconChartLine /> },
    ],
  },
];

const BOTTOM_TABS = [
  { id: 'overview', label: 'Overview', icon: <IconLayoutDashboard /> },
  { id: 'alarms', label: 'Alarms', icon: <IconBell /> },
  { id: 'work', label: 'Work', icon: <IconTool /> },
  { id: 'more', label: 'More', icon: <IconMenu2 /> },
];

const MEGA_SECTIONS = [
  {
    id: 'monitor',
    title: 'Monitor',
    links: [
      { id: 'overview', label: 'Plant overview', detail: 'KPIs and state of every area', icon: <IconLayoutDashboard /> },
      { id: 'alarms', label: 'Alarms', detail: 'Active, shelved and cleared', icon: <IconBell /> },
      { id: 'trends', label: 'Trends', detail: 'Compare time series', icon: <IconChartLine /> },
    ],
  },
  {
    id: 'equipment',
    title: 'Equipment',
    links: [
      { id: 'assets', label: 'Asset hierarchy', detail: 'Browse by functional location', icon: <IconSitemap /> },
      { id: 'rotating', label: 'Rotating equipment', detail: 'Compressors, pumps and turbines', icon: <IconEngine /> },
      { id: 'documents', label: 'Documents', detail: 'Drawings and procedures', icon: <IconFileText /> },
    ],
  },
  {
    id: 'shift',
    title: 'Shift',
    links: [
      { id: 'handover', label: 'Shift handover', detail: 'Notes for the next shift', icon: <IconClipboardList /> },
      { id: 'log', label: 'Operator log', detail: 'Events entered by the crew', icon: <IconPencil /> },
    ],
  },
];

const FOOTER_GROUPS = [
  { id: 'product', title: 'Product', links: ['Overview', 'Alarms', 'Work orders', 'Trends'] },
  { id: 'data', title: 'Data', links: ['Data sets', 'Pipelines', 'Data quality'] },
  { id: 'help', title: 'Help', links: ['Documentation', 'Keyboard shortcuts', 'Contact support', 'Release notes'] },
  { id: 'legal', title: 'Legal', links: ['Privacy', 'Terms of use', 'Third-party licences'] },
];

/** Link styling for plain navigation links. */
const NAV_LINK =
  'rounded-sm text-sm text-medium-foreground outline-none hover:text-base-foreground hover:underline focus-visible:shadow-focus-ring';

function navMenuToggle(values: readonly string[], value: string): string[] {
  return values.includes(value) ? values.filter((current) => current !== value) : [...values, value];
}

/** Keeps the demo on the page: these are real links in a product. */
const stay = (event: MouseEvent) => event.preventDefault();

/** A menu list that grows with its rows instead of scrolling, for menus drawn in place. */
function NavMenuList({ children }: { children: ReactNode }) {
  return <CommandList className="max-h-none">{children}</CommandList>;
}

/** Two lines in a menu row: what it is, and one quiet detail. */
function NavMenuRowText({ title, detail }: { title: string; detail: string }) {
  return (
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="truncate">{title}</span>
      <span className="truncate text-xs text-muted-foreground">{detail}</span>
    </span>
  );
}

/** A check that keeps its column when the row is not selected, so labels stay aligned. */
function NavMenuCheck({ checked }: { checked: boolean }) {
  return <IconCheck aria-hidden="true" className={checked ? '' : 'invisible'} />;
}

/** The person block that heads an account menu. */
function NavMenuAccountHeader() {
  return (
    <div className="flex items-center gap-3 border-b border-default p-3">
      <PersonAvatar name={OPERATOR.name} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-popover-foreground">{OPERATOR.name}</p>
        <p className="truncate text-xs text-muted-foreground">{OPERATOR_EMAIL}</p>
      </div>
    </div>
  );
}

/** A narrow phone-sized frame for mobile navigation. */
function NavMenuPhone({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto flex h-104 w-72 max-w-full flex-col overflow-hidden rounded-xl border border-default bg-muted-background">
      {children}
    </div>
  );
}

function NavMenuAccount() {
  return (
    <MenuPanel
      label="Account menu"
      width="md"
      trigger={(props) => (
        <Button variant="ghost" {...props} aria-label={`Account menu for ${OPERATOR.name}`}>
          <PersonAvatar name={OPERATOR.name} sizes="xsm" /> {OPERATOR.name} <IconChevronDown />
        </Button>
      )}
    >
      <NavMenuAccountHeader />
      <Command label="Account menu" tabIndex={0}>
        <NavMenuList>
          <CommandGroup>
            <CommandItem>
              <IconUser /> Profile
            </CommandItem>
            <CommandItem>
              <IconSettings /> Preferences
            </CommandItem>
            <CommandItem>
              <IconKeyboard /> Keyboard shortcuts
              <CommandShortcut>?</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup>
            <CommandItem>
              <IconLogout /> Sign out
            </CommandItem>
          </CommandGroup>
        </NavMenuList>
      </Command>
    </MenuPanel>
  );
}

function NavMenuWorkspaceSwitcher() {
  const [workspaceId, setWorkspaceId] = useState('operations');
  const workspace = WORKSPACES.find((candidate) => candidate.id === workspaceId) ?? WORKSPACES[0];

  return (
    <MenuPanel
      label="Workspaces"
      width="md"
      trigger={(props) => (
        <Button variant="outline" {...props}>
          {workspace.name} <IconChevronDown />
        </Button>
      )}
    >
      <Command label="Workspaces" tabIndex={0}>
        <NavMenuList>
          <CommandGroup heading="Workspaces">
            {WORKSPACES.map((candidate) => (
              <CommandItem key={candidate.id} onSelect={() => setWorkspaceId(candidate.id)}>
                <NavMenuRowText title={candidate.name} detail={candidate.detail} />
                <NavMenuCheck checked={candidate.id === workspaceId} />
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup>
            <CommandItem>
              <IconPlus /> Create workspace
            </CommandItem>
            <CommandItem>
              <IconSettings /> Manage workspaces
            </CommandItem>
          </CommandGroup>
        </NavMenuList>
      </Command>
    </MenuPanel>
  );
}

function NavMenuSitePicker() {
  const [siteId, setSiteId] = useState(SITES[0].id);
  const site = SITES.find((candidate) => candidate.id === siteId) ?? SITES[0];

  return (
    <MenuPanel
      label="Sites"
      width="md"
      trigger={(props) => (
        <Button variant="outline" {...props}>
          <IconBuildingFactory2 /> {site.name} <IconChevronDown />
        </Button>
      )}
    >
      <Command label="Sites">
        <CommandInput placeholder="Search sites" />
        <NavMenuList>
          <CommandEmpty>No sites match the search.</CommandEmpty>
          {SITES.map((candidate) => (
            <CommandItem key={candidate.id} value={`${candidate.name} ${candidate.region}`} onSelect={() => setSiteId(candidate.id)}>
              <NavMenuRowText title={candidate.name} detail={candidate.region} />
              <NavMenuCheck checked={candidate.id === siteId} />
            </CommandItem>
          ))}
        </NavMenuList>
      </Command>
    </MenuPanel>
  );
}

function NavMenuNotifications() {
  const [readIds, setReadIds] = useState<readonly string[]>([NOTIFICATIONS[2].id, NOTIFICATIONS[3].id]);
  const unread = NOTIFICATIONS.filter((alarm) => !readIds.includes(alarm.id)).length;

  return (
    <MenuPanel
      label="Notifications"
      width="lg"
      align="end"
      trigger={(props) => (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon" {...props} aria-label={`Notifications, ${unread} unread`}>
                <IconBell />
              </Button>
            }
          />
          <TooltipContent>Notifications</TooltipContent>
        </Tooltip>
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-default py-2 pr-2 pl-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-popover-foreground">
          Notifications {unread > 0 ? <Badge variant="secondary">{unread}</Badge> : null}
        </h3>
        <Button variant="ghost" size="sm" onClick={() => setReadIds(NOTIFICATIONS.map((alarm) => alarm.id))}>
          Mark all as read
        </Button>
      </div>
      <ul className="flex flex-col p-1">
        {NOTIFICATIONS.map((alarm) => {
          const isUnread = !readIds.includes(alarm.id);
          return (
            <li key={alarm.id}>
              <button
                type="button"
                onClick={() => setReadIds((current) => (current.includes(alarm.id) ? current : [...current, alarm.id]))}
                className="flex w-full items-start gap-3 rounded-lg p-2 text-left outline-none transition-colors hover:bg-popover-background-hover focus-visible:shadow-focus-ring"
              >
                <span className="flex h-5 w-2 shrink-0 items-center">
                  {isUnread ? <StatusDot tone="info" size="sm" label="Unread" /> : null}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className={`truncate text-sm text-popover-foreground ${isUnread ? 'font-medium' : ''}`}>{alarm.message}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {severityStatus(alarm.severity).label} · {alarm.sensorTag} · {formatAgo(alarm.raisedAt)}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-default p-1">
        <Button variant="ghost" size="sm" className="w-full">
          View all notifications
        </Button>
      </div>
    </MenuPanel>
  );
}

function NavMenuAppSwitcher() {
  const [appId, setAppId] = useState('operate');

  return (
    <MenuPanel
      label="Apps"
      width="lg"
      trigger={(props) => (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon" {...props} aria-label="Switch app">
                <IconGridDots />
              </Button>
            }
          />
          <TooltipContent>Switch app</TooltipContent>
        </Tooltip>
      )}
    >
      <ul className="grid grid-cols-3 gap-1 p-2">
        {APPS.map((app) => (
          <li key={app.id}>
            <button
              type="button"
              aria-current={app.id === appId ? 'page' : undefined}
              onClick={() => setAppId(app.id)}
              className={`flex w-full flex-col items-center gap-2 rounded-lg px-2 py-3 text-center outline-none transition-colors focus-visible:shadow-focus-ring ${
                app.id === appId ? 'bg-secondary-background' : 'hover:bg-popover-background-hover'
              }`}
            >
              <Avatar variant={app.variant} aria-hidden="true">
                <AvatarIcon>{app.icon}</AvatarIcon>
              </Avatar>
              <span className="text-xs font-medium text-popover-foreground">{app.name}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="border-t border-default p-1">
        <Button variant="ghost" size="sm" className="w-full">
          Browse all apps
        </Button>
      </div>
    </MenuPanel>
  );
}

function NavMenuHelp() {
  return (
    <MenuPanel
      label="Help menu"
      trigger={(props) => (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon" {...props} aria-label="Help">
                <IconHelpCircle />
              </Button>
            }
          />
          <TooltipContent>Help</TooltipContent>
        </Tooltip>
      )}
    >
      <Command label="Help menu" tabIndex={0}>
        <NavMenuList>
          <CommandGroup>
            <CommandItem>
              <IconBook /> Documentation
              <IconExternalLink className="ml-auto" aria-label="Opens in a new tab" />
            </CommandItem>
            <CommandItem>
              <IconKeyboard /> Keyboard shortcuts
            </CommandItem>
            <CommandItem>
              <IconSpeakerphone /> What is new
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup>
            <CommandItem>
              <IconMessageCircle /> Contact support
            </CommandItem>
          </CommandGroup>
        </NavMenuList>
      </Command>
      <p className="border-t border-default px-3 py-2 text-xs text-muted-foreground">Version 4.12.0 · All systems normal</p>
    </MenuPanel>
  );
}

function NavMenuCreate() {
  return (
    <MenuPanel
      label="Create menu"
      trigger={(props) => (
        <Button {...props}>
          <IconPlus /> Create <IconChevronDown />
        </Button>
      )}
    >
      <Command label="Create menu" tabIndex={0}>
        <NavMenuList>
          <CommandItem>
            <IconTool /> Work order
            <CommandShortcut>W</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <IconChartLine /> Chart
            <CommandShortcut>C</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <IconLayoutDashboard /> Dashboard
            <CommandShortcut>D</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <IconClipboardList /> Handover note
            <CommandShortcut>N</CommandShortcut>
          </CommandItem>
        </NavMenuList>
      </Command>
    </MenuPanel>
  );
}

function NavMenuPreferences() {
  const [theme, setTheme] = useState('system');
  const [density, setDensity] = useState('comfortable');

  return (
    <MenuPanel
      label="Display preferences"
      trigger={(props) => (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon" {...props} aria-label="Display preferences">
                <IconAdjustmentsHorizontal />
              </Button>
            }
          />
          <TooltipContent>Display preferences</TooltipContent>
        </Tooltip>
      )}
    >
      <Command label="Display preferences" tabIndex={0} defaultValue="Match system">
        <NavMenuList>
          <CommandGroup heading="Theme">
            {THEMES.map((option) => (
              <CommandItem key={option.id} onSelect={() => setTheme(option.id)}>
                <NavMenuCheck checked={option.id === theme} /> {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Density">
            {DENSITIES.map((option) => (
              <CommandItem key={option.id} onSelect={() => setDensity(option.id)}>
                <NavMenuCheck checked={option.id === density} /> {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </NavMenuList>
      </Command>
    </MenuPanel>
  );
}

function NavMenuRowContext() {
  const [targetId, setTargetId] = useState(ROW_ORDERS[1].id);
  const offsets = ['top-12', 'top-24', 'top-36'];
  const targetIndex = Math.max(
    0,
    ROW_ORDERS.findIndex((order) => order.id === targetId)
  );

  return (
    <div className="relative h-80 w-full">
      <ul className="flex flex-col">
        {ROW_ORDERS.map((order) => (
          <li key={order.id}>
            <button
              type="button"
              aria-pressed={order.id === targetId}
              onClick={() => setTargetId(order.id)}
              onContextMenu={(event) => {
                event.preventDefault();
                setTargetId(order.id);
              }}
              className={`flex h-12 w-full items-center justify-between gap-4 rounded-lg px-3 text-left outline-none transition-colors focus-visible:shadow-focus-ring ${
                order.id === targetId ? 'bg-secondary-background' : 'hover:bg-base-background-hover'
              }`}
            >
              <span className="min-w-0 truncate text-sm text-base-foreground">
                <span className="text-muted-foreground">{order.id}</span> · {order.title}
              </span>
              <StatusBadge status={order.status} outline />
            </button>
          </li>
        ))}
      </ul>
      <div className={`absolute left-24 ${offsets[targetIndex]}`}>
        <MenuPanel label={`Actions for ${targetId}`}>
          <Command label={`Actions for ${targetId}`} tabIndex={0}>
            <NavMenuList>
              <CommandGroup>
                <CommandItem>
                  <IconExternalLink /> Open in new tab
                </CommandItem>
                <CommandItem>
                  <IconUserPlus /> Assign
                </CommandItem>
                <CommandItem>
                  <IconCopy /> Copy link
                </CommandItem>
                <CommandItem>
                  <IconPencil /> Edit work order
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem>
                  <span className="flex items-center gap-2 text-critical-foreground-strong">
                    <IconTrash aria-hidden="true" className="size-4" /> Cancel work order
                  </span>
                </CommandItem>
              </CommandGroup>
            </NavMenuList>
          </Command>
        </MenuPanel>
      </div>
    </div>
  );
}

function NavMenuSubmenu() {
  return (
    <div className="flex items-start gap-1">
      <MenuPanel
        label="Work order actions"
        trigger={(props) => (
          <Button variant="outline" {...props}>
            Actions <IconChevronDown />
          </Button>
        )}
      >
        <Command label="Work order actions" tabIndex={0} defaultValue="Move to">
          <NavMenuList>
            <CommandItem>
              <IconPencil /> Edit
            </CommandItem>
            <CommandItem>
              <IconCopy /> Duplicate
            </CommandItem>
            <CommandItem value="Move to">
              <IconSitemap /> Move to
              <IconChevronRight className="ml-auto" aria-hidden="true" />
            </CommandItem>
            <CommandItem>
              <IconUserPlus /> Assign
            </CommandItem>
          </NavMenuList>
        </Command>
      </MenuPanel>
      <div className="pt-28">
        <MenuPanel label="Move to area">
          <Command label="Move to area" tabIndex={0}>
            <NavMenuList>
              {ASSETS.filter((asset) => asset.parentId === 'nk').map((area) => (
                <CommandItem key={area.id}>{area.name}</CommandItem>
              ))}
            </NavMenuList>
          </Command>
        </MenuPanel>
      </div>
    </div>
  );
}

function NavMenuBreadcrumbOverflow() {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex w-full flex-col gap-1">
      <Breadcrumb>
        <BreadcrumbList className="flex-nowrap">
          <BreadcrumbItem>
            <BreadcrumbLink href="/assets" onClick={stay}>
              Assets
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbEllipsis>
            <BreadcrumbEllipsisButton
              aria-label="Show hidden levels"
              aria-expanded={open}
              onClick={() => setOpen((current) => !current)}
            />
          </BreadcrumbEllipsis>
          <BreadcrumbSeparator />
          <BreadcrumbItem className="whitespace-nowrap">
            <BreadcrumbPage>1st stage compressor</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {open ? (
        <div className="pl-16">
          <MenuPanel label="Hidden levels">
            <Command label="Hidden levels" tabIndex={0}>
              <NavMenuList>
                {HIDDEN_LEVELS.map((level) => (
                  <CommandItem key={level}>{level}</CommandItem>
                ))}
              </NavMenuList>
            </Command>
          </MenuPanel>
        </div>
      ) : null}
    </div>
  );
}

function NavMenuViewOptions() {
  const [columns, setColumns] = useState<readonly string[]>(['status', 'priority', 'due']);
  const [density, setDensity] = useState('compact');

  return (
    <MenuPanel
      label="View options"
      align="end"
      trigger={(props) => (
        <Button variant="outline" {...props}>
          <IconAdjustmentsHorizontal /> View
        </Button>
      )}
    >
      <Command label="View options" tabIndex={0}>
        <NavMenuList>
          <CommandGroup heading="Columns">
            {COLUMNS.map((column) => (
              <CommandItem key={column.id} onSelect={() => setColumns((current) => navMenuToggle(current, column.id))}>
                <NavMenuCheck checked={columns.includes(column.id)} /> {column.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Density">
            {DENSITIES.map((option) => (
              <CommandItem key={option.id} onSelect={() => setDensity(option.id)}>
                <NavMenuCheck checked={option.id === density} /> {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </NavMenuList>
      </Command>
    </MenuPanel>
  );
}

function NavMenuItemStates() {
  return (
    <MenuPanel
      label="Pipeline actions"
      width="md"
      trigger={(props) => (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon" {...props} aria-label="Pipeline actions">
                <IconDots />
              </Button>
            }
          />
          <TooltipContent>Pipeline actions</TooltipContent>
        </Tooltip>
      )}
    >
      <Command label="Pipeline actions" tabIndex={0}>
        <NavMenuList>
          <CommandGroup>
            <CommandItem>
              <IconRoute /> Run now
              <CommandShortcut>R</CommandShortcut>
            </CommandItem>
            <CommandItem>
              <IconFileText /> View run log
              <IconExternalLink className="ml-auto" aria-label="Opens in a new tab" />
            </CommandItem>
            <CommandItem disabled>
              <IconPencil />
              <NavMenuRowText title="Edit schedule" detail="Only the owner can edit" />
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup>
            <CommandItem>
              <span className="flex items-center gap-2 text-critical-foreground-strong">
                <IconTrash aria-hidden="true" className="size-4" /> Delete pipeline
              </span>
            </CommandItem>
          </CommandGroup>
        </NavMenuList>
      </Command>
    </MenuPanel>
  );
}

function NavMenuQuickSwitcher() {
  return (
    <MenuPanel label="Quick switcher" width="full">
      <Command label="Quick switcher">
        <CommandInput placeholder="Go to an asset, work order or page" />
        <NavMenuList>
          <CommandEmpty>Nothing matches. Try a tag or a work order number.</CommandEmpty>
          <CommandGroup heading="Recent">
            <CommandItem value="23-KA-9101 1st stage compressor">
              <IconEngine /> 1st stage compressor
              <CommandShortcut>23-KA-9101</CommandShortcut>
            </CommandItem>
            <CommandItem value="WO-104482 Inspect recompressor drive-end bearing">
              <IconTool /> Inspect recompressor drive-end bearing
              <CommandShortcut>WO-104482</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Go to">
            <CommandItem>
              <IconBell /> Alarms
              <CommandShortcut>G A</CommandShortcut>
            </CommandItem>
            <CommandItem>
              <IconTool /> Work orders
              <CommandShortcut>G W</CommandShortcut>
            </CommandItem>
            <CommandItem>
              <IconChartLine /> Trends
              <CommandShortcut>G T</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Actions">
            <CommandItem>
              <IconPlus /> Create work order
            </CommandItem>
          </CommandGroup>
        </NavMenuList>
      </Command>
    </MenuPanel>
  );
}

function NavMenuAssignPicker() {
  const [assigneeId, setAssigneeId] = useState('tb');
  const assignee = PEOPLE.find((person) => person.id === assigneeId) ?? PEOPLE[0];

  return (
    <MenuPanel
      label="Assign work order"
      width="md"
      trigger={(props) => (
        <Button variant="outline" {...props}>
          <PersonAvatar name={assignee.name} sizes="xxsm" /> {assignee.name} <IconChevronDown />
        </Button>
      )}
    >
      <Command label="Assign work order" defaultValue={`${assignee.name} ${assignee.role}`}>
        <CommandInput placeholder="Search people" />
        <NavMenuList>
          <CommandEmpty>No people match the search.</CommandEmpty>
          {PEOPLE.slice(0, 5).map((person) => (
            <CommandItem key={person.id} value={`${person.name} ${person.role}`} onSelect={() => setAssigneeId(person.id)}>
              <PersonAvatar name={person.name} sizes="xsm" />
              <NavMenuRowText title={person.name} detail={person.role} />
              <NavMenuCheck checked={person.id === assigneeId} />
            </CommandItem>
          ))}
        </NavMenuList>
      </Command>
    </MenuPanel>
  );
}

function NavMenuTabsOverflow() {
  const [tab, setTab] = useState('overview');
  const hidden = [
    { id: 'documents', label: 'Documents' },
    { id: 'relationships', label: 'Relationships' },
    { id: 'audit', label: 'Audit log' },
  ];

  return (
    <div className="relative h-48 w-full">
      <div className="border-b border-default pr-32">
        <Tabs
          value={hidden.some((item) => item.id === tab) ? null : tab}
          onValueChange={(next) => {
            if (typeof next === 'string') setTab(next);
          }}
        >
          <TabsList>
            <TabsTrigger value="overview">
              <TabsLabel>Overview</TabsLabel>
            </TabsTrigger>
            <TabsTrigger value="sensors">
              <TabsLabel>Sensors</TabsLabel>
            </TabsTrigger>
            <TabsTrigger value="alarms">
              <TabsLabel>Alarms</TabsLabel>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="absolute top-0 right-0 -mt-1">
        <MenuPanel
          label="More tabs"
          align="end"
          trigger={(props) => (
            <Button variant="ghost" size="sm" {...props}>
              {hidden.find((item) => item.id === tab)?.label ?? 'More'} <IconChevronDown />
            </Button>
          )}
        >
          <Command label="More tabs" tabIndex={0}>
            <NavMenuList>
              {hidden.map((item) => (
                <CommandItem key={item.id} onSelect={() => setTab(item.id)}>
                  <span className="flex-1">{item.label}</span>
                  <NavMenuCheck checked={item.id === tab} />
                </CommandItem>
              ))}
            </NavMenuList>
          </Command>
        </MenuPanel>
      </div>
    </div>
  );
}

function NavMenuMobileDrawer() {
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState('alarms');

  return (
    <NavMenuPhone>
      <div className="flex items-center gap-2 border-b border-default bg-base-background p-2">
        <Button variant="ghost" size="icon" aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen(true)}>
          <IconMenu2 />
        </Button>
        <span className="text-sm font-semibold text-base-foreground">Alarms</span>
      </div>
      {open ? (
        <>
          <div aria-hidden="true" className="absolute inset-0 bg-base-background-overlay" />
          <div className="absolute inset-y-0 left-0 flex w-60 flex-col bg-base-background shadow-md">
            <div className="flex items-center justify-between gap-2 border-b border-default p-2 pl-4">
              <span className="text-sm font-semibold text-base-foreground">Plant operations</span>
              <Button variant="ghost" size="icon" aria-label="Close navigation" onClick={() => setOpen(false)}>
                <IconX />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              <SidebarNav label="Main" groups={MOBILE_GROUPS} activeId={active} onSelect={setActive} />
            </div>
            <div className="flex items-center gap-2 border-t border-default p-3">
              <PersonAvatar name={OPERATOR.name} sizes="xsm" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-base-foreground">{OPERATOR.name}</span>
            </div>
          </div>
        </>
      ) : null}
    </NavMenuPhone>
  );
}

function NavMenuBottomBar() {
  const [active, setActive] = useState('alarms');
  const title = BOTTOM_TABS.find((tab) => tab.id === active)?.label ?? '';

  return (
    <NavMenuPhone>
      <div className="flex-1 p-4">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
      </div>
      <nav aria-label="Primary" className="grid grid-cols-4 border-t border-default bg-base-background p-1">
        {BOTTOM_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-current={tab.id === active ? 'page' : undefined}
            onClick={() => setActive(tab.id)}
            className={`flex flex-col items-center gap-1 rounded-lg py-2 text-xs outline-none transition-colors focus-visible:shadow-focus-ring [&>svg]:size-5 ${
              tab.id === active ? 'bg-secondary-background font-medium text-secondary-foreground' : 'text-muted-foreground hover:text-base-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>
    </NavMenuPhone>
  );
}

function NavMenuMegaMenu() {
  return (
    <MenuPanel
      label="Operate"
      width="full"
      trigger={(props) => (
        <nav aria-label="Product areas" className="flex items-center gap-1">
          <Button variant="ghost" {...props}>
            Operate <IconChevronDown />
          </Button>
          <Button variant="ghost">
            Maintain <IconChevronDown />
          </Button>
          <Button variant="ghost">
            Data <IconChevronDown />
          </Button>
          <Button variant="ghost">Documentation</Button>
        </nav>
      )}
    >
      <div className="grid grid-cols-1 gap-6 p-4 md:grid-cols-3">
        {MEGA_SECTIONS.map((section) => (
          <section key={section.id} aria-labelledby={`mega-${section.id}`} className="flex flex-col gap-2">
            <h3 id={`mega-${section.id}`} className="px-2 text-xs font-medium text-muted-foreground">
              {section.title}
            </h3>
            <ul className="flex flex-col gap-1">
              {section.links.map((link) => (
                <li key={link.id}>
                  <a
                    href={`/${link.id}`}
                    onClick={stay}
                    className="flex items-start gap-3 rounded-lg p-2 outline-none transition-colors hover:bg-popover-background-hover focus-visible:shadow-focus-ring [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-muted-foreground"
                  >
                    {link.icon}
                    <span className="flex min-w-0 flex-col">
                      <span className="text-sm font-medium text-popover-foreground">{link.label}</span>
                      <span className="text-xs text-muted-foreground">{link.detail}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </MenuPanel>
  );
}

function NavMenuFooterLinks() {
  return (
    <footer className="flex w-full flex-col gap-6 rounded-xl border border-default bg-base-background p-6">
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {FOOTER_GROUPS.map((group) => (
          <nav key={group.id} aria-labelledby={`footer-${group.id}`} className="flex flex-col gap-3">
            <h3 id={`footer-${group.id}`} className="text-xs font-medium text-muted-foreground">
              {group.title}
            </h3>
            <ul className="flex flex-col gap-2">
              {group.links.map((link) => (
                <li key={link}>
                  <a href="/" onClick={stay} className={NAV_LINK}>
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-default pt-4 text-xs text-muted-foreground">
        <span>Plant operations · Version 4.12.0</span>
        <span>Nordkapp gas processing plant</span>
      </div>
    </footer>
  );
}

function NavMenuLiveAccount() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" aria-label={`Account menu for ${OPERATOR.name}`}>
            <PersonAvatar name={OPERATOR.name} sizes="xsm" /> {OPERATOR.name} <IconChevronDown />
          </Button>
        }
      />
      <DropdownMenuContent className="w-64">
        <DropdownMenuHeader>
          <PersonAvatar name={OPERATOR.name} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-popover-foreground">{OPERATOR.name}</p>
            <p className="truncate text-xs text-muted-foreground">{OPERATOR_EMAIL}</p>
          </div>
        </DropdownMenuHeader>
        <DropdownMenuItem>
          <IconUser /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem>
          <IconSettings /> Preferences
        </DropdownMenuItem>
        <DropdownMenuItem>
          <IconKeyboard /> Keyboard shortcuts
          <DropdownMenuShortcut>?</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <IconLogout /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavMenuLiveCreate() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button>
            <IconPlus /> Create <IconChevronDown />
          </Button>
        }
      />
      <DropdownMenuContent className="w-56">
        <DropdownMenuItem>
          <IconTool /> Work order
          <DropdownMenuShortcut>W</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <IconChartLine /> Chart
          <DropdownMenuShortcut>C</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <IconLayoutDashboard /> Dashboard
          <DropdownMenuShortcut>D</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <IconClipboardList /> Handover note
          <DropdownMenuShortcut>N</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavMenuLiveViewOptions() {
  const [columns, setColumns] = useState<readonly string[]>(['status', 'priority', 'due']);
  const [density, setDensity] = useState('compact');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline">
            <IconAdjustmentsHorizontal /> View
          </Button>
        }
      />
      <DropdownMenuContent className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Columns</DropdownMenuLabel>
          {COLUMNS.map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={columns.includes(column.id)}
              closeOnClick={false}
              onCheckedChange={() => setColumns((current) => navMenuToggle(current, column.id))}
            >
              {column.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Density</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={density}
            onValueChange={(next) => {
              if (typeof next === 'string') setDensity(next);
            }}
          >
            {DENSITIES.map((option) => (
              <DropdownMenuRadioItem key={option.id} value={option.id} closeOnClick={false}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default definePage({
  id: 'navigation-menus',
  title: 'Navigation menus',
  summary:
    'The menus an app shell is made of: account, workspace and site switchers, notifications, help, create and context menus. Most are drawn open and in place so they can be compared; the last section has the same content in real dropdown menus.',
  guidance: {
    use: [
      'A menu for a short list of destinations or actions that belong to one trigger.',
      'Group with separators and short labels; put the destructive action last, on its own.',
      'A check for the current choice, a shortcut for the frequent action, a chevron for a submenu.',
      'A search field once a list of choices is longer than about eight.',
    ],
    avoid: [
      'Mixing row actions, page actions and global actions in one menu.',
      'Icons on some rows of a group and not on others.',
      'A menu for two actions. Show two buttons instead.',
      'Shipping the in-place panels as overlays. Use DropdownMenu or Popover for real menus.',
    ],
  },
  source,
  sections: [
    {
      id: 'account-and-scope',
      title: 'Account and scope',
      description: 'Who is signed in, and which workspace and site everything else is scoped to.',
      specimens: [
        {
          id: 'NavMenuAccount',
          title: 'User account menu',
          note: 'Behind the avatar in a topbar or sidebar footer: identity first, sign out last and alone.',
          origin: 'custom',
          uses: ['patterns/structure/MenuPanel.tsx', 'display/PersonAvatar.tsx'],
          Component: NavMenuAccount,
        },
        {
          id: 'NavMenuWorkspaceSwitcher',
          title: 'Workspace switcher',
          note: 'When people belong to a few workspaces: list them, check the current one, manage below.',
          origin: 'custom',
          uses: ['patterns/structure/MenuPanel.tsx'],
          Component: NavMenuWorkspaceSwitcher,
        },
        {
          id: 'NavMenuSitePicker',
          title: 'Site picker with search',
          note: 'When the list of sites is long or grows: type to narrow it down.',
          origin: 'custom',
          uses: ['patterns/structure/MenuPanel.tsx'],
          Component: NavMenuSitePicker,
        },
      ],
    },
    {
      id: 'global-utilities',
      title: 'Global utilities',
      description: 'The menus behind the icons on the right of a topbar.',
      specimens: [
        {
          id: 'NavMenuNotifications',
          title: 'Notification menu',
          note: 'A short inbox behind the bell: unread first, one line of context, and a way to the full list.',
          origin: 'custom',
          size: 'md',
          uses: ['patterns/structure/MenuPanel.tsx', 'industrial/StatusDot.tsx'],
          Component: NavMenuNotifications,
        },
        {
          id: 'NavMenuAppSwitcher',
          title: 'App switcher',
          note: 'For a suite of apps: a grid of named tiles, with colour only to tell the apps apart.',
          origin: 'custom',
          size: 'md',
          uses: ['patterns/structure/MenuPanel.tsx'],
          Component: NavMenuAppSwitcher,
        },
        {
          id: 'NavMenuHelp',
          title: 'Help menu',
          note: 'Documentation, shortcuts, news and support in one place, with the version underneath.',
          origin: 'custom',
          uses: ['patterns/structure/MenuPanel.tsx'],
          Component: NavMenuHelp,
        },
        {
          id: 'NavMenuCreate',
          title: 'Create new menu',
          note: 'When one button starts several kinds of thing. Show the shortcut for each.',
          origin: 'custom',
          uses: ['patterns/structure/MenuPanel.tsx'],
          Component: NavMenuCreate,
        },
        {
          id: 'NavMenuPreferences',
          title: 'Display preferences',
          note: 'For two or three single-choice settings people change often, without a trip to settings.',
          origin: 'custom',
          uses: ['patterns/structure/MenuPanel.tsx'],
          Component: NavMenuPreferences,
        },
      ],
    },
    {
      id: 'contextual',
      title: 'Contextual menus',
      description: 'Menus that belong to a row, a level in a trail or a view.',
      specimens: [
        {
          id: 'NavMenuRowContext',
          title: 'Context menu on a row',
          note: 'Right-click or the row’s more button: only actions for that row. Right-click a row to move it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/MenuPanel.tsx', 'display/StatusBadge.tsx'],
          Component: NavMenuRowContext,
        },
        {
          id: 'NavMenuSubmenu',
          title: 'With submenu',
          note: 'When one action needs a second choice from a short list. One level only.',
          origin: 'custom',
          size: 'md',
          uses: ['patterns/structure/MenuPanel.tsx'],
          Component: NavMenuSubmenu,
        },
        {
          id: 'NavMenuBreadcrumbOverflow',
          title: 'Breadcrumb overflow',
          note: 'When a trail is too deep to show: the middle levels move behind the ellipsis.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/structure/MenuPanel.tsx'],
          Component: NavMenuBreadcrumbOverflow,
        },
        {
          id: 'NavMenuViewOptions',
          title: 'View options',
          note: 'Columns to show and a density to pick: several checks in one group, one check in the other.',
          origin: 'custom',
          uses: ['patterns/structure/MenuPanel.tsx'],
          Component: NavMenuViewOptions,
        },
        {
          id: 'NavMenuItemStates',
          title: 'Item states',
          note: 'Shortcut, external link, disabled with its reason, and the destructive action last.',
          origin: 'custom',
          uses: ['patterns/structure/MenuPanel.tsx'],
          Component: NavMenuItemStates,
        },
      ],
    },
    {
      id: 'search-and-pick',
      title: 'Search and pick',
      description: 'Menus that start with a text field.',
      specimens: [
        {
          id: 'NavMenuQuickSwitcher',
          title: 'Quick switcher',
          note: 'For people who know where they are going: recent records, pages and actions from one field.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['patterns/structure/MenuPanel.tsx'],
          Component: NavMenuQuickSwitcher,
        },
        {
          id: 'NavMenuAssignPicker',
          title: 'Person picker',
          note: 'To assign something to one person from a list too long to scan.',
          origin: 'custom',
          uses: ['patterns/structure/MenuPanel.tsx', 'display/PersonAvatar.tsx'],
          Component: NavMenuAssignPicker,
        },
      ],
    },
    {
      id: 'navigation-structures',
      title: 'Navigation structures',
      description: 'Menus that are part of the page layout rather than behind a button.',
      specimens: [
        {
          id: 'NavMenuTabsOverflow',
          title: 'Tabs overflow',
          note: 'When there are more tabs than fit: the rest go behind a More button that names the current one.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/structure/MenuPanel.tsx'],
          Component: NavMenuTabsOverflow,
        },
        {
          id: 'NavMenuMobileDrawer',
          title: 'Mobile navigation drawer',
          note: 'On narrow screens the sidebar becomes a drawer over the page. A look-alike of the open state.',
          origin: 'custom',
          surface: 'muted',
          uses: ['patterns/structure/SidebarNav.tsx', 'display/PersonAvatar.tsx'],
          Component: NavMenuMobileDrawer,
        },
        {
          id: 'NavMenuBottomBar',
          title: 'Mobile bottom bar',
          note: 'For three to five primary sections on a phone, with the rest behind More.',
          origin: 'custom',
          surface: 'muted',
          Component: NavMenuBottomBar,
        },
        {
          id: 'NavMenuMegaMenu',
          title: 'Mega menu',
          note: 'For a product area with many destinations: columns of links, each with a line of explanation.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/structure/MenuPanel.tsx'],
          Component: NavMenuMegaMenu,
        },
        {
          id: 'NavMenuFooterLinks',
          title: 'Footer link groups',
          note: 'At the bottom of documentation and public pages: every destination, grouped and labelled.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          Component: NavMenuFooterLinks,
        },
      ],
    },
    {
      id: 'live-menus',
      title: 'Live dropdown menus',
      description: 'The same content in real dropdown menus. Press a trigger to open it.',
      specimens: [
        {
          id: 'NavMenuLiveAccount',
          title: 'Account dropdown',
          note: 'The account menu as it ships: a header, grouped items and keyboard support from DropdownMenu.',
          origin: 'custom',
          uses: ['display/PersonAvatar.tsx'],
          Component: NavMenuLiveAccount,
        },
        {
          id: 'NavMenuLiveCreate',
          title: 'Create dropdown',
          note: 'The create menu as it ships, opening from the primary button.',
          origin: 'custom',
          Component: NavMenuLiveCreate,
        },
        {
          id: 'NavMenuLiveViewOptions',
          title: 'View options dropdown',
          note: 'Checkbox and radio items keep the menu open, so several can be changed in one visit.',
          origin: 'custom',
          Component: NavMenuLiveViewOptions,
        },
      ],
    },
  ],
});
