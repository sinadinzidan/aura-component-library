import { Badge } from '@cognite/aura/components/badge';
import {
  BreadcrumbEllipsis,
  BreadcrumbEllipsisButton,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbPageButton,
  BreadcrumbSeparator,
} from '@cognite/aura/components/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@cognite/aura/components/dropdown-menu';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import { Skeleton } from '@cognite/aura/components/skeleton';
import { Tabs, TabsList, TabsPanel, TabsTrigger } from '@cognite/aura/components/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import {
  Topbar,
  TopbarAction,
  TopbarBreadcrumbs,
  TopbarCenter,
  TopbarIcon,
  TopbarLeft,
  TopbarMetadata,
  TopbarRight,
  TopbarThemeSwitcher,
} from '@cognite/aura/components/topbar';
import type { TopbarTheme } from '@cognite/aura/components/topbar';
import {
  IconBell,
  IconBuildingFactory2,
  IconChevronDown,
  IconDots,
  IconPlus,
  IconShare,
  IconSparkles,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';

import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { CommandPalette } from '../../../library/navigation/CommandPalette';
import { ALARMS, PEOPLE, PLANT_KPIS } from '../../data/plant';
import { definePage } from '../../types';

import source from './topbar.tsx?raw';

/** Keeps the catalog on this page. In an app, drop it and let the router follow the link. */
const stay = (event: MouseEvent) => event.preventDefault();

const OPERATOR = PEOPLE[0];

/** The bar on top of a stub page, so its bottom border and rounded top corners read in context. */
function TopbarShell({ children, body }: { children: ReactNode; body?: ReactNode }) {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-default">
      {children}
      <div className="flex min-h-16 items-center justify-center p-4 text-sm text-muted-foreground">{body}</div>
    </div>
  );
}

type TopbarIconActionProps = {
  label: string;
  children: ReactNode;
  onClick?: () => void;
  pressed?: boolean;
};

/** An icon-only system control: ghost, small, named and with a tooltip. */
function TopbarIconAction({ label, children, onClick, pressed }: TopbarIconActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <TopbarAction
            variant={pressed ? 'secondary' : 'ghost'}
            size="icon-sm"
            aria-label={label}
            aria-pressed={pressed}
            onClick={onClick}
          >
            {children}
          </TopbarAction>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function TopbarAppOnly() {
  return (
    <TopbarShell>
      <Topbar>
        <TopbarLeft>
          <TopbarIcon>
            <IconBuildingFactory2 />
          </TopbarIcon>
          <TopbarBreadcrumbs>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Asset health</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </TopbarBreadcrumbs>
        </TopbarLeft>
      </Topbar>
    </TopbarShell>
  );
}

function TopbarWithBreadcrumbs() {
  return (
    <TopbarShell>
      <Topbar>
        <TopbarLeft>
          <TopbarIcon>
            <IconBuildingFactory2 />
          </TopbarIcon>
          <TopbarBreadcrumbs>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/" onClick={stay}>
                  Asset health
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/assets/nk-23" onClick={stay}>
                  Gas compression
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>1st stage compressor</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </TopbarBreadcrumbs>
        </TopbarLeft>
      </Topbar>
    </TopbarShell>
  );
}

function TopbarWithMetadata() {
  return (
    <TopbarShell>
      <Topbar>
        <TopbarLeft>
          <TopbarIcon>
            <IconBuildingFactory2 />
          </TopbarIcon>
          <TopbarBreadcrumbs>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboards" onClick={stay}>
                  Dashboards
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Compression overview</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </TopbarBreadcrumbs>
          <TopbarMetadata>Saved 2 min ago</TopbarMetadata>
        </TopbarLeft>
      </Topbar>
    </TopbarShell>
  );
}

function TopbarRightStrip() {
  const [theme, setTheme] = useState<TopbarTheme>('light');

  return (
    <TopbarShell>
      <Topbar>
        <TopbarLeft>
          <TopbarIcon>
            <IconBuildingFactory2 />
          </TopbarIcon>
          <TopbarBreadcrumbs>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Asset health</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </TopbarBreadcrumbs>
        </TopbarLeft>
        <TopbarRight>
          <TopbarIconAction label="Share">
            <IconShare />
          </TopbarIconAction>
          <TopbarIconAction label="Notifications">
            <IconBell />
          </TopbarIconAction>
          <TopbarThemeSwitcher theme={theme} onThemeChange={setTheme} />
          <TopbarIconAction label="Ask Atlas">
            <IconSparkles />
          </TopbarIconAction>
        </TopbarRight>
      </Topbar>
    </TopbarShell>
  );
}

function TopbarCenterTabs() {
  return (
    <Tabs defaultValue="overview">
      <TopbarShell
        body={
          <>
            <TabsPanel value="overview">Plant overview</TabsPanel>
            <TabsPanel value="alarms">Alarm list</TabsPanel>
            <TabsPanel value="work">Work orders</TabsPanel>
            <TabsPanel value="reports">Reports</TabsPanel>
          </>
        }
      >
        <Topbar>
          <TopbarLeft>
            <TopbarIcon>
              <IconBuildingFactory2 />
            </TopbarIcon>
            <TopbarBreadcrumbs>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Asset health</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </TopbarBreadcrumbs>
          </TopbarLeft>
          <TopbarCenter>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="alarms">Alarms</TabsTrigger>
              <TabsTrigger value="work">Work orders</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>
          </TopbarCenter>
          <TopbarRight>
            <TopbarIconAction label="Notifications">
              <IconBell />
            </TopbarIconAction>
          </TopbarRight>
        </Topbar>
      </TopbarShell>
    </Tabs>
  );
}

function TopbarCenterSegmented() {
  const [mode, setMode] = useState('live');

  return (
    <TopbarShell body={mode === 'live' ? 'Live values, updating every 5 s' : 'Replay of the last 24 hours'}>
      <Topbar>
        <TopbarLeft>
          <TopbarIcon>
            <IconBuildingFactory2 />
          </TopbarIcon>
          <TopbarBreadcrumbs>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Control room</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </TopbarBreadcrumbs>
        </TopbarLeft>
        <TopbarCenter>
          <SegmentedControl
            value={mode}
            onValueChange={(next) => {
              if (typeof next === 'string') setMode(next);
            }}
          >
            <SegmentedControlList size="small" aria-label="Data mode">
              <SegmentedControlButton value="live">Live</SegmentedControlButton>
              <SegmentedControlButton value="replay">Replay</SegmentedControlButton>
            </SegmentedControlList>
          </SegmentedControl>
        </TopbarCenter>
        <TopbarRight>
          <TopbarIconAction label="Notifications">
            <IconBell />
          </TopbarIconAction>
        </TopbarRight>
      </Topbar>
    </TopbarShell>
  );
}

function TopbarAllRegions() {
  const [theme, setTheme] = useState<TopbarTheme>('light');

  return (
    <Tabs defaultValue="overview">
      <TopbarShell>
        <Topbar>
          <TopbarLeft>
            <TopbarIcon>
              <IconBuildingFactory2 />
            </TopbarIcon>
            <TopbarBreadcrumbs>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/" onClick={stay}>
                    Asset health
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Nordkapp</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </TopbarBreadcrumbs>
            <TopbarMetadata>Updated 14:00 UTC</TopbarMetadata>
          </TopbarLeft>
          <TopbarCenter>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="alarms">Alarms</TabsTrigger>
              <TabsTrigger value="work">Work orders</TabsTrigger>
            </TabsList>
          </TopbarCenter>
          <TopbarRight>
            <TopbarIconAction label="Share">
              <IconShare />
            </TopbarIconAction>
            <TopbarIconAction label="Notifications">
              <IconBell />
            </TopbarIconAction>
            <TopbarThemeSwitcher theme={theme} onThemeChange={setTheme} />
            <TopbarIconAction label="Ask Atlas">
              <IconSparkles />
            </TopbarIconAction>
          </TopbarRight>
        </Topbar>
      </TopbarShell>
    </Tabs>
  );
}

function TopbarCollapsedTrail() {
  return (
    <TopbarShell>
      <Topbar>
        <TopbarLeft>
          <TopbarIcon>
            <IconBuildingFactory2 />
          </TopbarIcon>
          <TopbarBreadcrumbs>
            <BreadcrumbList className="flex-nowrap">
              <BreadcrumbItem>
                <BreadcrumbLink href="/" onClick={stay}>
                  Asset health
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbEllipsis>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<BreadcrumbEllipsisButton aria-label="Show hidden pages" />} />
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem>Nordkapp plant</DropdownMenuItem>
                    <DropdownMenuItem>Gas compression</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </BreadcrumbEllipsis>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/assets/23-ka-9101" onClick={stay}>
                  23-KA-9101
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Discharge pressure</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </TopbarBreadcrumbs>
        </TopbarLeft>
      </Topbar>
    </TopbarShell>
  );
}

function TopbarPageMenu() {
  return (
    <TopbarShell>
      <Topbar>
        <TopbarLeft>
          <TopbarIcon>
            <IconBuildingFactory2 />
          </TopbarIcon>
          <TopbarBreadcrumbs>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboards" onClick={stay}>
                  Dashboards
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <BreadcrumbPageButton>
                        Compression overview <IconChevronDown className="size-4 text-muted-foreground" />
                      </BreadcrumbPageButton>
                    }
                  />
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem>Rename</DropdownMenuItem>
                    <DropdownMenuItem>Duplicate</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive">Delete dashboard</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </BreadcrumbItem>
            </BreadcrumbList>
          </TopbarBreadcrumbs>
        </TopbarLeft>
      </Topbar>
    </TopbarShell>
  );
}

function TopbarWithStatusBadge() {
  return (
    <TopbarShell>
      <Topbar>
        <TopbarLeft>
          <TopbarIcon>
            <IconBuildingFactory2 />
          </TopbarIcon>
          <TopbarBreadcrumbs>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/work-orders" onClick={stay}>
                  Work orders
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>WO-104482</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </TopbarBreadcrumbs>
          <Badge variant="inProgress">In progress</Badge>
          <TopbarMetadata>Due in 6 hr</TopbarMetadata>
        </TopbarLeft>
      </Topbar>
    </TopbarShell>
  );
}

function TopbarProjectMetadata() {
  return (
    <TopbarShell>
      <Topbar>
        <TopbarLeft>
          <TopbarIcon>
            <IconBuildingFactory2 />
          </TopbarIcon>
          <TopbarBreadcrumbs>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Asset health</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </TopbarBreadcrumbs>
          <TopbarMetadata>
            <span className="font-mono">nordkapp-test</span> · Test data, not for operations
          </TopbarMetadata>
        </TopbarLeft>
      </Topbar>
    </TopbarShell>
  );
}

function TopbarTruncatedTitle() {
  return (
    <TopbarShell>
      <Topbar>
        <TopbarLeft>
          <TopbarIcon>
            <IconBuildingFactory2 />
          </TopbarIcon>
          <TopbarBreadcrumbs className="min-w-0">
            <BreadcrumbList className="flex-nowrap">
              <BreadcrumbItem>
                <BreadcrumbLink href="/work-orders" onClick={stay}>
                  Work orders
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="min-w-0">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <BreadcrumbPage className="min-w-0">
                        <span className="block max-w-48 truncate">Inspect recompressor drive-end bearing</span>
                      </BreadcrumbPage>
                    }
                  />
                  <TooltipContent>Inspect recompressor drive-end bearing</TooltipContent>
                </Tooltip>
              </BreadcrumbItem>
            </BreadcrumbList>
          </TopbarBreadcrumbs>
        </TopbarLeft>
        <TopbarRight>
          <TopbarIconAction label="Share">
            <IconShare />
          </TopbarIconAction>
        </TopbarRight>
      </Topbar>
    </TopbarShell>
  );
}

function TopbarThemeControl() {
  const [theme, setTheme] = useState<TopbarTheme>('light');

  return (
    <TopbarShell body={`Selected theme: ${theme}`}>
      <Topbar>
        <TopbarLeft>
          <TopbarIcon>
            <IconBuildingFactory2 />
          </TopbarIcon>
          <TopbarBreadcrumbs>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Asset health</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </TopbarBreadcrumbs>
        </TopbarLeft>
        <TopbarRight>
          <TopbarThemeSwitcher theme={theme} onThemeChange={setTheme} />
        </TopbarRight>
      </Topbar>
    </TopbarShell>
  );
}

function TopbarSingleTheme() {
  return (
    <TopbarShell body="This app ships a light theme only">
      <Topbar>
        <TopbarLeft>
          <TopbarIcon>
            <IconBuildingFactory2 />
          </TopbarIcon>
          <TopbarBreadcrumbs>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Shift report</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </TopbarBreadcrumbs>
        </TopbarLeft>
        <TopbarRight>
          <TopbarIconAction label="Notifications">
            <IconBell />
          </TopbarIconAction>
          <TopbarThemeSwitcher theme="light" availableThemes={['light']} />
          <TopbarIconAction label="Ask Atlas">
            <IconSparkles />
          </TopbarIconAction>
        </TopbarRight>
      </Topbar>
    </TopbarShell>
  );
}

function TopbarUnreadNotifications() {
  const active = ALARMS.filter((alarm) => alarm.state === 'active');
  const [unread, setUnread] = useState(active.length);

  return (
    <TopbarShell body={unread > 0 ? `${unread} unread alarm notifications` : 'All caught up'}>
      <Topbar>
        <TopbarLeft>
          <TopbarIcon>
            <IconBuildingFactory2 />
          </TopbarIcon>
          <TopbarBreadcrumbs>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Asset health</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </TopbarBreadcrumbs>
        </TopbarLeft>
        <TopbarRight>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <TopbarAction
                  variant="ghost"
                  size="sm"
                  aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
                >
                  <IconBell />
                  {unread > 0 ? (
                    <Badge variant="error" className="tabular-nums">
                      {unread}
                    </Badge>
                  ) : null}
                </TopbarAction>
              }
            />
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Active alarms</DropdownMenuLabel>
              {active.map((alarm) => (
                <DropdownMenuItem key={alarm.id}>{alarm.message}</DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setUnread(0)}>Mark all as read</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TopbarRight>
      </Topbar>
    </TopbarShell>
  );
}

function TopbarAtlasLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <TopbarShell body={open ? 'Atlas sidebar is open' : 'Atlas sidebar is closed'}>
      <Topbar>
        <TopbarLeft>
          <TopbarIcon>
            <IconBuildingFactory2 />
          </TopbarIcon>
          <TopbarBreadcrumbs>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Asset health</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </TopbarBreadcrumbs>
        </TopbarLeft>
        <TopbarRight>
          <TopbarIconAction label={open ? 'Close Atlas' : 'Ask Atlas'} pressed={open} onClick={() => setOpen(!open)}>
            <IconSparkles />
          </TopbarIconAction>
        </TopbarRight>
      </Topbar>
    </TopbarShell>
  );
}

function TopbarUserMenu() {
  return (
    <TopbarShell>
      <Topbar>
        <TopbarLeft>
          <TopbarIcon>
            <IconBuildingFactory2 />
          </TopbarIcon>
          <TopbarBreadcrumbs>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Asset health</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </TopbarBreadcrumbs>
        </TopbarLeft>
        <TopbarRight>
          <TopbarIconAction label="Notifications">
            <IconBell />
          </TopbarIconAction>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<TopbarAction variant="ghost" size="icon-sm" aria-label={`Account, ${OPERATOR.name}`} />}
            >
              <PersonAvatar name={OPERATOR.name} initials={OPERATOR.initials} sizes="xxsm" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {OPERATOR.name} · {OPERATOR.role}
              </DropdownMenuLabel>
              <DropdownMenuItem>Profile and preferences</DropdownMenuItem>
              <DropdownMenuItem>Switch project</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TopbarRight>
      </Topbar>
    </TopbarShell>
  );
}

function TopbarGlobalAction() {
  return (
    <TopbarShell>
      <Topbar>
        <TopbarLeft>
          <TopbarIcon>
            <IconBuildingFactory2 />
          </TopbarIcon>
          <TopbarBreadcrumbs>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Data onboarding</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </TopbarBreadcrumbs>
        </TopbarLeft>
        <TopbarRight>
          <TopbarAction variant="secondary" size="sm">
            <IconPlus /> Add data
          </TopbarAction>
          <TopbarIconAction label="Notifications">
            <IconBell />
          </TopbarIconAction>
        </TopbarRight>
      </Topbar>
    </TopbarShell>
  );
}

function TopbarLoading() {
  return (
    <TopbarShell body="Loading work order…">
      <Topbar aria-busy="true">
        <TopbarLeft>
          <TopbarIcon>
            <IconBuildingFactory2 />
          </TopbarIcon>
          <TopbarBreadcrumbs>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/work-orders" onClick={stay}>
                  Work orders
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage aria-label="Loading work order">
                  <Skeleton className="h-4 w-32" />
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </TopbarBreadcrumbs>
        </TopbarLeft>
        <TopbarRight>
          <TopbarIconAction label="Notifications">
            <IconBell />
          </TopbarIconAction>
        </TopbarRight>
      </Topbar>
    </TopbarShell>
  );
}

function TopbarNarrow() {
  const [theme, setTheme] = useState<TopbarTheme>('light');

  return (
    <div className="w-full max-w-xs">
      <TopbarShell>
        <Topbar>
          <TopbarLeft>
            <TopbarIcon>
              <IconBuildingFactory2 />
            </TopbarIcon>
            <TopbarBreadcrumbs>
              <BreadcrumbList className="flex-nowrap">
                <BreadcrumbItem>
                  <BreadcrumbPage>23-KA-9101</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </TopbarBreadcrumbs>
          </TopbarLeft>
          <TopbarRight>
            <TopbarIconAction label="Notifications">
              <IconBell />
            </TopbarIconAction>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <TopbarAction variant="ghost" size="icon-sm" aria-label="More">
                    <IconDots />
                  </TopbarAction>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Share</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
                  Switch to {theme === 'light' ? 'dark' : 'light'} mode
                </DropdownMenuItem>
                <DropdownMenuItem>Ask Atlas</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TopbarRight>
        </Topbar>
      </TopbarShell>
    </div>
  );
}

function TopbarWithCommandSearch() {
  const [last, setLast] = useState('Nothing run yet');

  return (
    <TopbarShell body={last}>
      <Topbar>
        <TopbarLeft>
          <TopbarIcon>
            <IconBuildingFactory2 />
          </TopbarIcon>
          <TopbarBreadcrumbs>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Asset health</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </TopbarBreadcrumbs>
        </TopbarLeft>
        <TopbarCenter>
          <div className="w-full max-w-xs">
            <CommandPalette
              triggerLabel="Search assets and actions"
              triggerSize="sm"
              groups={[
                {
                  id: 'go',
                  heading: 'Go to',
                  items: [
                    { id: 'alarms', label: 'Go to alarms', onSelect: () => setLast('Opened alarms') },
                    { id: 'orders', label: 'Go to work orders', onSelect: () => setLast('Opened work orders') },
                  ],
                },
                {
                  id: 'actions',
                  heading: 'Actions',
                  items: [
                    { id: 'create', label: 'Create work order', onSelect: () => setLast('Started a work order') },
                  ],
                },
              ]}
            />
          </div>
        </TopbarCenter>
        <TopbarRight>
          <TopbarIconAction label="Notifications">
            <IconBell />
          </TopbarIconAction>
        </TopbarRight>
      </Topbar>
    </TopbarShell>
  );
}

function TopbarAppShell() {
  const [theme, setTheme] = useState<TopbarTheme>('light');

  return (
    <Tabs defaultValue="overview">
      <div className="w-full overflow-hidden rounded-lg border border-default">
        <Topbar>
          <TopbarLeft>
            <TopbarIcon>
              <IconBuildingFactory2 />
            </TopbarIcon>
            <TopbarBreadcrumbs>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/" onClick={stay}>
                    Asset health
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Nordkapp</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </TopbarBreadcrumbs>
            <TopbarMetadata>Updated 14:00 UTC</TopbarMetadata>
          </TopbarLeft>
          <TopbarCenter>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="alarms" badge={PLANT_KPIS.activeAlarms.value}>
                Alarms
              </TabsTrigger>
              <TabsTrigger value="work" badge={PLANT_KPIS.openWorkOrders.value}>
                Work orders
              </TabsTrigger>
            </TabsList>
          </TopbarCenter>
          <TopbarRight>
            <TopbarIconAction label="Share">
              <IconShare />
            </TopbarIconAction>
            <TopbarIconAction label="Notifications">
              <IconBell />
            </TopbarIconAction>
            <TopbarThemeSwitcher theme={theme} onThemeChange={setTheme} />
            <TopbarIconAction label="Ask Atlas">
              <IconSparkles />
            </TopbarIconAction>
            <PersonAvatar name={OPERATOR.name} initials={OPERATOR.initials} sizes="xxsm" />
          </TopbarRight>
        </Topbar>
        <div className="p-6">
          <TabsPanel value="overview" className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-muted-foreground">Availability</p>
              <p className="text-2xl font-semibold tabular-nums text-base-foreground">
                {PLANT_KPIS.availability.value}%
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gas export</p>
              <p className="text-2xl font-semibold tabular-nums text-base-foreground">
                {PLANT_KPIS.gasExport.value} <span className="text-sm font-medium">{PLANT_KPIS.gasExport.unit}</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Days since incident</p>
              <p className="text-2xl font-semibold tabular-nums text-base-foreground">
                {PLANT_KPIS.daysSinceIncident.value}
              </p>
            </div>
          </TabsPanel>
          <TabsPanel value="alarms" className="text-sm text-medium-foreground">
            {PLANT_KPIS.activeAlarms.value} active alarms, one critical: recompressor tripped on high vibration.
          </TabsPanel>
          <TabsPanel value="work" className="text-sm text-medium-foreground">
            {PLANT_KPIS.openWorkOrders.value} open work orders, one overdue.
          </TabsPanel>
        </div>
      </div>
    </Tabs>
  );
}

export default definePage({
  id: 'topbar',
  title: 'Topbar',
  summary:
    'The one persistent bar at the top of every authenticated screen. Three fixed regions: where you are on the left, optional app-wide navigation in the middle, system controls on the right.',
  docsSlug: 'topbar',
  guidance: {
    use: [
      'Once per app, on every authenticated screen.',
      'Left: the app mark, the breadcrumb trail, and optional short metadata.',
      'Middle: Tabs for top-level pages, or a Segmented Control for modes. Leave it out for single-view apps.',
      'Right, in this order: Share, Notifications, Theme, Atlas.',
    ],
    avoid: [
      'Page-specific actions in the bar — they belong in the page header or toolbar.',
      'Reordering or restyling the system controls between apps.',
      'A second bar under the first, or duplicating its navigation in the page.',
      'A topbar on sign-in screens and full-screen flows that hide the app chrome.',
    ],
  },
  source,
  sections: [
    {
      id: 'regions',
      title: 'Regions',
      description: 'Left, middle and right, added one at a time.',
      specimens: [
        {
          id: 'TopbarAppOnly',
          title: 'App mark and name',
          note: 'A single-view app: the bar only says which app this is.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: TopbarAppOnly,
        },
        {
          id: 'TopbarWithBreadcrumbs',
          title: 'With breadcrumbs',
          note: 'Any app with pages below the top level; the trail starts at the app name.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: TopbarWithBreadcrumbs,
        },
        {
          id: 'TopbarWithMetadata',
          title: 'With metadata',
          note: 'One short fact about the page that is always relevant, such as the save state.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: TopbarWithMetadata,
        },
        {
          id: 'TopbarRightStrip',
          title: 'System controls',
          note: 'The fixed right-hand order: Share, Notifications, Theme, Atlas.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: TopbarRightStrip,
        },
        {
          id: 'TopbarCenterSegmented',
          title: 'Segmented control in the middle',
          note: 'One page seen in different modes, such as live and replay.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: TopbarCenterSegmented,
        },
        {
          id: 'TopbarGlobalAction',
          title: 'App-wide action',
          note: 'An action that applies on every page of the app. One at most, never page-specific.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: TopbarGlobalAction,
        },
        {
          id: 'TopbarCenterTabs',
          title: 'Tabs in the middle',
          note: 'Two or more top-level pages that people switch between all day.',
          origin: 'aura',
          size: 'full',
          align: 'stretch',
          Component: TopbarCenterTabs,
        },
        {
          id: 'TopbarAllRegions',
          title: 'All three regions',
          note: 'The full bar of a multi-page app.',
          origin: 'aura',
          size: 'full',
          align: 'stretch',
          Component: TopbarAllRegions,
        },
      ],
    },
    {
      id: 'left',
      title: 'Left region',
      description: 'Deep trails, long titles and the metadata slot.',
      specimens: [
        {
          id: 'TopbarCollapsedTrail',
          title: 'Collapsed trail',
          note: 'More than four levels: the middle folds into a menu so the bar never wraps.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: TopbarCollapsedTrail,
        },
        {
          id: 'TopbarTruncatedTitle',
          title: 'Truncated title',
          note: 'User-written page names: cut with an ellipsis, full text in a tooltip.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: TopbarTruncatedTitle,
        },
        {
          id: 'TopbarPageMenu',
          title: 'Page menu on the title',
          note: 'Rename, duplicate and delete for the open document, without spending a button on them.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: TopbarPageMenu,
        },
        {
          id: 'TopbarWithStatusBadge',
          title: 'Status and metadata',
          note: 'Pages for one object with a lifecycle; the state stays visible while the page scrolls.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: TopbarWithStatusBadge,
        },
        {
          id: 'TopbarProjectMetadata',
          title: 'Project and environment',
          note: 'Apps opened against several projects, where acting on the wrong one is costly.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: TopbarProjectMetadata,
        },
        {
          id: 'TopbarLoading',
          title: 'Page name loading',
          note: 'The bar renders at once from the route; only the unknown label waits.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: TopbarLoading,
        },
      ],
    },
    {
      id: 'right',
      title: 'Right region',
      description: 'The system controls one by one. Open the menus to try them.',
      specimens: [
        {
          id: 'TopbarThemeControl',
          title: 'Theme switcher',
          note: 'Every app that supports light and dark. The specimen only records the choice.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: TopbarThemeControl,
        },
        {
          id: 'TopbarSingleTheme',
          title: 'One theme only',
          note: 'With fewer than two themes the switcher renders nothing; the other controls keep their order.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: TopbarSingleTheme,
        },
        {
          id: 'TopbarUnreadNotifications',
          title: 'Unread notifications',
          note: 'A count on the bell when something needs attention; it clears when read.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: TopbarUnreadNotifications,
        },
        {
          id: 'TopbarAtlasLauncher',
          title: 'Atlas launcher',
          note: 'Opens the Atlas sidebar; shown as pressed while the sidebar is open.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: TopbarAtlasLauncher,
        },
        {
          id: 'TopbarUserMenu',
          title: 'User avatar menu',
          note: 'Standalone apps that own sign-out and preferences; last on the right.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/PersonAvatar.tsx'],
          Component: TopbarUserMenu,
        },
        {
          id: 'TopbarNarrow',
          title: 'Narrow width',
          note: 'Side-by-side or tablet layouts: keep the current page and the bell, fold the rest into a menu.',
          origin: 'custom',
          size: 'md',
          Component: TopbarNarrow,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'The bar with the things it usually carries.',
      specimens: [
        {
          id: 'TopbarWithCommandSearch',
          title: 'Command search in the middle',
          note: 'Apps with too many destinations for tabs: search takes the middle region instead.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['navigation/CommandPalette.tsx'],
          Component: TopbarWithCommandSearch,
        },
        {
          id: 'TopbarAppShell',
          title: 'App shell',
          note: 'The whole bar driving a page: tabs with counts switch the content under it.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['display/PersonAvatar.tsx'],
          Component: TopbarAppShell,
        },
      ],
    },
  ],
});
