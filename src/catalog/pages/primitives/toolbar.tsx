import { Badge } from '@cognite/aura/components/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@cognite/aura/components/dropdown-menu';
import { Search } from '@cognite/aura/components/search';
import { Toggle } from '@cognite/aura/components/toggle';
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarSegmentedControl,
  ToolbarSegmentedControlButton,
  ToolbarSeparator,
  ToolbarTitle,
} from '@cognite/aura/components/toolbar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconColumns,
  IconDots,
  IconDownload,
  IconExternalLink,
  IconFilter,
  IconGridDots,
  IconHandStop,
  IconLock,
  IconMaximize,
  IconMessage,
  IconPlus,
  IconPointer,
  IconRefresh,
  IconRuler,
  IconShare,
  IconZoomIn,
  IconZoomOut,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { ALARMS, WORK_ORDERS } from '../../data/plant';
import { definePage } from '../../types';

import source from './toolbar.tsx?raw';

const ACTIVE_ALARM_COUNT = ALARMS.filter((alarm) => alarm.state === 'active').length;

const CANVAS_TOOLS = [
  { id: 'select', label: 'Select', icon: <IconPointer /> },
  { id: 'pan', label: 'Pan', icon: <IconHandStop /> },
  { id: 'measure', label: 'Measure', icon: <IconRuler /> },
  { id: 'comment', label: 'Comment', icon: <IconMessage /> },
];

type ToolbarIconButtonProps = {
  label: string;
  children: ReactNode;
  side?: 'top' | 'right';
  disabled?: boolean;
  pressed?: boolean;
  onClick?: () => void;
};

/** An icon-only toolbar button with its accessible name and tooltip. */
function ToolbarIconButton({ label, children, side = 'top', disabled, pressed, onClick }: ToolbarIconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <ToolbarButton
            size="icon"
            variant={pressed ? 'secondary' : 'ghost'}
            aria-label={label}
            aria-pressed={pressed}
            disabled={disabled}
            onClick={onClick}
          >
            {children}
          </ToolbarButton>
        }
      />
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  );
}

function ToolbarFloating() {
  return (
    <Toolbar aria-label="Canvas tools">
      <ToolbarIconButton label="Undo">
        <IconArrowBackUp />
      </ToolbarIconButton>
      <ToolbarIconButton label="Redo">
        <IconArrowForwardUp />
      </ToolbarIconButton>
      <ToolbarSeparator />
      <ToolbarIconButton label="Zoom out">
        <IconZoomOut />
      </ToolbarIconButton>
      <ToolbarIconButton label="Zoom in">
        <IconZoomIn />
      </ToolbarIconButton>
    </Toolbar>
  );
}

function ToolbarInline() {
  return (
    <Toolbar floating={false} aria-label="Data set actions">
      <ToolbarButton>
        <IconFilter /> Filter
      </ToolbarButton>
      <ToolbarButton>
        <IconShare /> Share
      </ToolbarButton>
      <ToolbarButton>
        <IconDownload /> Export
      </ToolbarButton>
    </Toolbar>
  );
}

function ToolbarVertical() {
  return (
    <Toolbar orientation="vertical" aria-label="Drawing tools">
      <ToolbarIconButton label="Select" side="right">
        <IconPointer />
      </ToolbarIconButton>
      <ToolbarIconButton label="Pan" side="right">
        <IconHandStop />
      </ToolbarIconButton>
      <ToolbarSeparator />
      <ToolbarIconButton label="Measure" side="right">
        <IconRuler />
      </ToolbarIconButton>
    </Toolbar>
  );
}

function ToolbarWithGroups() {
  return (
    <Toolbar aria-label="Chart tools">
      <ToolbarGroup aria-label="History">
        <ToolbarIconButton label="Undo">
          <IconArrowBackUp />
        </ToolbarIconButton>
        <ToolbarIconButton label="Redo">
          <IconArrowForwardUp />
        </ToolbarIconButton>
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup aria-label="Zoom">
        <ToolbarIconButton label="Zoom out">
          <IconZoomOut />
        </ToolbarIconButton>
        <ToolbarIconButton label="Zoom in">
          <IconZoomIn />
        </ToolbarIconButton>
        <ToolbarIconButton label="Fit to view">
          <IconMaximize />
        </ToolbarIconButton>
      </ToolbarGroup>
    </Toolbar>
  );
}

function ToolbarWithTitle() {
  return (
    <Toolbar aria-label="Trend">
      <ToolbarTitle>Discharge pressure</ToolbarTitle>
      <ToolbarSeparator />
      <ToolbarIconButton label="Refresh data">
        <IconRefresh />
      </ToolbarIconButton>
      <ToolbarIconButton label="Download chart">
        <IconDownload />
      </ToolbarIconButton>
    </Toolbar>
  );
}

function ToolbarTitleWithBadge() {
  return (
    <Toolbar aria-label="Alarms">
      <ToolbarTitle badge={<Badge variant="secondary">{ACTIVE_ALARM_COUNT} active</Badge>}>Alarms</ToolbarTitle>
      <ToolbarSeparator />
      <ToolbarIconButton label="Filter alarms">
        <IconFilter />
      </ToolbarIconButton>
    </Toolbar>
  );
}

function ToolbarTitleDropdown() {
  const [area, setArea] = useState('Gas compression');

  return (
    <Toolbar aria-label="Area">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <ToolbarButton>
              <ToolbarTitle dropdown>{area}</ToolbarTitle>
            </ToolbarButton>
          }
        />
        <DropdownMenuContent>
          <DropdownMenuRadioGroup value={area} onValueChange={(value) => setArea(String(value))}>
            <DropdownMenuRadioItem value="Inlet and separation">Inlet and separation</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="Gas compression">Gas compression</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="Gas export">Gas export</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <ToolbarSeparator />
      <ToolbarIconButton label="Refresh data">
        <IconRefresh />
      </ToolbarIconButton>
    </Toolbar>
  );
}

function ToolbarWithSegmentedControl() {
  return (
    <Toolbar aria-label="Trend range">
      <ToolbarSegmentedControl defaultValue="24h" aria-label="Time range">
        <ToolbarSegmentedControlButton value="1h" tabContent="label-only">
          1h
        </ToolbarSegmentedControlButton>
        <ToolbarSegmentedControlButton value="24h" tabContent="label-only">
          24h
        </ToolbarSegmentedControlButton>
        <ToolbarSegmentedControlButton value="7d" tabContent="label-only">
          7d
        </ToolbarSegmentedControlButton>
      </ToolbarSegmentedControl>
      <ToolbarSeparator />
      <ToolbarIconButton label="Refresh data">
        <IconRefresh />
      </ToolbarIconButton>
    </Toolbar>
  );
}

function ToolbarSmall() {
  return (
    <Toolbar aria-label="Trend range">
      <ToolbarSegmentedControl defaultValue="chart" size="small" aria-label="View">
        <ToolbarSegmentedControlButton value="chart" tabContent="label-only">
          Chart
        </ToolbarSegmentedControlButton>
        <ToolbarSegmentedControlButton value="table" tabContent="label-only">
          Table
        </ToolbarSegmentedControlButton>
      </ToolbarSegmentedControl>
      <ToolbarSeparator />
      <ToolbarButton size="icon-sm" aria-label="Refresh data">
        <IconRefresh />
      </ToolbarButton>
      <ToolbarButton size="icon-sm" aria-label="Download chart">
        <IconDownload />
      </ToolbarButton>
    </Toolbar>
  );
}

function ToolbarLabelledButtons() {
  return (
    <Toolbar aria-label="Table tools">
      <ToolbarButton>
        <IconFilter /> Filter
      </ToolbarButton>
      <ToolbarButton>
        <IconColumns /> Columns
      </ToolbarButton>
      <ToolbarButton>
        <IconDownload /> Export
      </ToolbarButton>
    </Toolbar>
  );
}

function ToolbarWithPrimaryAction() {
  return (
    <Toolbar aria-label="Work order tools">
      <ToolbarButton>
        <IconDownload /> Export
      </ToolbarButton>
      <ToolbarSeparator />
      <ToolbarButton variant="default">
        <IconPlus /> Create work order
      </ToolbarButton>
    </Toolbar>
  );
}

function ToolbarWithLink() {
  return (
    <Toolbar aria-label="Asset links">
      <ToolbarTitle>23-KA-9101</ToolbarTitle>
      <ToolbarSeparator />
      <ToolbarButton
        nativeButton={false}
        render={<a href="https://docs.cognite.com/cdf/flows" target="_blank" rel="noreferrer" />}
      >
        Open in Fusion <IconExternalLink />
      </ToolbarButton>
    </Toolbar>
  );
}

function ToolbarDisabledButton() {
  return (
    <div className="flex flex-col items-center gap-2">
      <Toolbar aria-label="History">
        <ToolbarIconButton label="Undo">
          <IconArrowBackUp />
        </ToolbarIconButton>
        <ToolbarIconButton label="Redo" disabled>
          <IconArrowForwardUp />
        </ToolbarIconButton>
        <ToolbarSeparator />
        <ToolbarIconButton label="Download chart">
          <IconDownload />
        </ToolbarIconButton>
      </Toolbar>
      <p className="text-sm text-muted-foreground">Nothing to redo yet.</p>
    </div>
  );
}

function ToolbarAllDisabled() {
  return (
    <div className="flex flex-col items-center gap-2">
      <Toolbar disabled aria-label="Table tools">
        <ToolbarButton>
          <IconFilter /> Filter
        </ToolbarButton>
        <ToolbarButton>
          <IconColumns /> Columns
        </ToolbarButton>
        <ToolbarButton>
          <IconDownload /> Export
        </ToolbarButton>
      </Toolbar>
      <p className="text-sm text-muted-foreground">Tools unlock when the query finishes.</p>
    </div>
  );
}

function ToolbarActiveTool() {
  const [tool, setTool] = useState('select');

  return (
    <Toolbar aria-label="Canvas tools">
      {CANVAS_TOOLS.map((item) => (
        <ToolbarIconButton key={item.id} label={item.label} pressed={tool === item.id} onClick={() => setTool(item.id)}>
          {item.icon}
        </ToolbarIconButton>
      ))}
    </Toolbar>
  );
}

function ToolbarWithToggles() {
  const [grid, setGrid] = useState(true);
  const [locked, setLocked] = useState(false);

  return (
    <Toolbar aria-label="View options">
      <ToolbarButton
        render={<Toggle icon={<IconGridDots />} label="Grid" pressed={grid} onPressedChange={setGrid} />}
      />
      <ToolbarButton
        render={<Toggle icon={<IconLock />} label="Lock axis" pressed={locked} onPressedChange={setLocked} />}
      />
    </Toolbar>
  );
}

function ToolbarWithOverflowMenu() {
  return (
    <Toolbar aria-label="Pipeline actions">
      <ToolbarButton>
        <IconRefresh /> Run now
      </ToolbarButton>
      <ToolbarButton>
        <IconShare /> Share
      </ToolbarButton>
      <ToolbarSeparator />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <ToolbarButton size="icon" aria-label="More pipeline actions">
              <IconDots />
            </ToolbarButton>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
          <DropdownMenuItem>View run history</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Delete pipeline</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Toolbar>
  );
}

function ToolbarTableHeader() {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="w-full max-w-xs">
          <Search aria-label="Search work orders" placeholder="Search work orders" />
        </div>
        <Toolbar floating={false} aria-label="Work order tools">
          <ToolbarButton>
            <IconFilter /> Filter
          </ToolbarButton>
          <ToolbarButton>
            <IconColumns /> Columns
          </ToolbarButton>
          <ToolbarButton>
            <IconDownload /> Export
          </ToolbarButton>
          <ToolbarSeparator />
          <ToolbarButton variant="default">
            <IconPlus /> Create work order
          </ToolbarButton>
        </Toolbar>
      </div>
      <ul className="flex flex-col gap-2">
        {WORK_ORDERS.slice(0, 5).map((order) => (
          <li key={order.id} className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-base-foreground">{order.title}</span>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{order.id}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ToolbarChartHeader() {
  const [range, setRange] = useState('24h');

  return (
    <div className="flex w-full max-w-md flex-col gap-4 rounded-xl bg-muted-background p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-base-foreground">Drive-end vibration</p>
          <p className="text-xs text-muted-foreground">23-VT-92540 · last {range}</p>
        </div>
        <Toolbar floating={false} aria-label="Chart tools">
          <ToolbarSegmentedControl value={range} onValueChange={setRange} size="small" aria-label="Time range">
            <ToolbarSegmentedControlButton value="1h" tabContent="label-only">
              1h
            </ToolbarSegmentedControlButton>
            <ToolbarSegmentedControlButton value="24h" tabContent="label-only">
              24h
            </ToolbarSegmentedControlButton>
            <ToolbarSegmentedControlButton value="7d" tabContent="label-only">
              7d
            </ToolbarSegmentedControlButton>
          </ToolbarSegmentedControl>
          <ToolbarButton size="icon-sm" aria-label="Download chart">
            <IconDownload />
          </ToolbarButton>
        </Toolbar>
      </div>
      <p className="text-2xl font-semibold text-base-foreground tabular-nums">
        6.8 <span className="text-sm font-medium text-muted-foreground">mm/s</span>
      </p>
    </div>
  );
}

function ToolbarOverCanvas() {
  const [tool, setTool] = useState('pan');

  return (
    <div className="relative h-56 w-full rounded-xl bg-medium-background">
      <p className="absolute left-4 top-4 text-xs text-muted-foreground">Gas compression · P&amp;ID 23-001</p>
      <div className="absolute left-4 top-1/2 -translate-y-1/2">
        <Toolbar orientation="vertical" aria-label="Drawing tools">
          {CANVAS_TOOLS.map((item) => (
            <ToolbarIconButton
              key={item.id}
              label={item.label}
              side="right"
              pressed={tool === item.id}
              onClick={() => setTool(item.id)}
            >
              {item.icon}
            </ToolbarIconButton>
          ))}
        </Toolbar>
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <Toolbar aria-label="Zoom">
          <ToolbarIconButton label="Zoom out">
            <IconZoomOut />
          </ToolbarIconButton>
          <ToolbarTitle>
            <span className="tabular-nums">100%</span>
          </ToolbarTitle>
          <ToolbarIconButton label="Zoom in">
            <IconZoomIn />
          </ToolbarIconButton>
          <ToolbarSeparator />
          <ToolbarIconButton label="Fit to view">
            <IconMaximize />
          </ToolbarIconButton>
        </Toolbar>
      </div>
    </div>
  );
}

function ToolbarOnMuted() {
  return (
    <Toolbar aria-label="Dashboard tools">
      <ToolbarTitle>Shift handover</ToolbarTitle>
      <ToolbarSeparator />
      <ToolbarButton>
        <IconShare /> Share
      </ToolbarButton>
      <ToolbarButton>
        <IconDownload /> Export
      </ToolbarButton>
    </Toolbar>
  );
}

function ToolbarSplitEnds() {
  return (
    <Toolbar className="w-full max-w-md" aria-label="Report tools">
      <ToolbarTitle>Weekly reliability report</ToolbarTitle>
      <ToolbarGroup className="ml-auto">
        <ToolbarIconButton label="Share report">
          <IconShare />
        </ToolbarIconButton>
        <ToolbarIconButton label="Download report">
          <IconDownload />
        </ToolbarIconButton>
      </ToolbarGroup>
    </Toolbar>
  );
}

export default definePage({
  id: 'toolbar',
  title: 'Toolbar',
  summary:
    'A toolbar is a persistent strip of tools or filters for a page or region. Everything in it works on the whole view, with no selection needed.',
  docsSlug: 'toolbar',
  guidance: {
    use: [
      'Page-level tools: filter, columns, export, create.',
      'Floating over a canvas, chart or map; inline above a table or in a card header.',
      'Separators and groups to split tools by purpose.',
      'Ghost buttons throughout, with at most one filled action at the end.',
    ],
    avoid: [
      'Actions that only apply to selected rows — use an action toolbar.',
      'More tools than fit — move the rare ones into an overflow menu.',
      'Mixing icon-only and labelled buttons at random within one group.',
      'Icon-only buttons without an accessible name and a tooltip.',
    ],
  },
  source,
  sections: [
    {
      id: 'layout',
      title: 'Layout',
      description: 'Floating or inline, horizontal or vertical.',
      specimens: [
        {
          id: 'ToolbarFloating',
          title: 'Floating',
          note: 'The default: its own surface, for tools that sit on top of a canvas or chart.',
          origin: 'aura',
          Component: ToolbarFloating,
        },
        {
          id: 'ToolbarInline',
          title: 'Inline',
          note: 'No surface of its own; sits in a page or card header above the content it controls.',
          origin: 'aura',
          Component: ToolbarInline,
        },
        {
          id: 'ToolbarVertical',
          title: 'Vertical',
          note: 'Docked to the side of a canvas, where height is cheaper than width.',
          origin: 'aura',
          Component: ToolbarVertical,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts and content',
      description: 'Buttons, groups, separators, a title and a segmented control.',
      specimens: [
        {
          id: 'ToolbarWithGroups',
          title: 'Groups and separator',
          note: 'Tools split by purpose, each group named for assistive technology.',
          origin: 'aura',
          Component: ToolbarWithGroups,
        },
        {
          id: 'ToolbarLabelledButtons',
          title: 'Labelled buttons',
          note: 'Icon plus label when there is room and the tools are not self-evident.',
          origin: 'aura',
          Component: ToolbarLabelledButtons,
        },
        {
          id: 'ToolbarWithPrimaryAction',
          title: 'With primary action',
          note: 'One filled button at the end for the action most visits end with.',
          origin: 'aura',
          Component: ToolbarWithPrimaryAction,
        },
        {
          id: 'ToolbarWithTitle',
          title: 'With title',
          note: 'Names what the tools act on when the toolbar floats away from its content.',
          origin: 'aura',
          Component: ToolbarWithTitle,
        },
        {
          id: 'ToolbarTitleWithBadge',
          title: 'Title with badge',
          note: 'A count or status that belongs to the title, not to a tool.',
          origin: 'aura',
          Component: ToolbarTitleWithBadge,
        },
        {
          id: 'ToolbarTitleDropdown',
          title: 'Title as a menu',
          note: 'The title doubles as a switcher for what the toolbar is scoped to.',
          origin: 'aura',
          Component: ToolbarTitleDropdown,
        },
        {
          id: 'ToolbarWithSegmentedControl',
          title: 'With segmented control',
          note: 'A view or range switch that stays part of the single toolbar tab stop.',
          origin: 'aura',
          Component: ToolbarWithSegmentedControl,
        },
        {
          id: 'ToolbarSmall',
          title: 'Small controls',
          note: '28px buttons and segments for card headers and dense panels.',
          origin: 'aura',
          Component: ToolbarSmall,
        },
        {
          id: 'ToolbarWithLink',
          title: 'With a link',
          note: 'A tool that navigates away is rendered as a real anchor.',
          origin: 'aura',
          Component: ToolbarWithLink,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'Unavailable and active tools.',
      specimens: [
        {
          id: 'ToolbarDisabledButton',
          title: 'One tool disabled',
          note: 'The tool keeps its place and stays reachable by keyboard, so the strip never shifts.',
          origin: 'aura',
          Component: ToolbarDisabledButton,
        },
        {
          id: 'ToolbarAllDisabled',
          title: 'Whole toolbar disabled',
          note: 'While the content the tools act on is not ready.',
          origin: 'aura',
          Component: ToolbarAllDisabled,
        },
        {
          id: 'ToolbarActiveTool',
          title: 'Active tool',
          note: 'Exclusive canvas modes: the current tool stays filled.',
          origin: 'custom',
          Component: ToolbarActiveTool,
        },
      ],
    },
    {
      id: 'in-context',
      title: 'In context',
      description: 'Toolbars placed where they are used.',
      specimens: [
        {
          id: 'ToolbarWithToggles',
          title: 'With toggles',
          note: 'View options that stay on, rendered as toggles inside the toolbar.',
          origin: 'aura',
          Component: ToolbarWithToggles,
        },
        {
          id: 'ToolbarWithOverflowMenu',
          title: 'With overflow menu',
          note: 'Frequent tools visible, rare and destructive ones behind the last button.',
          origin: 'aura',
          Component: ToolbarWithOverflowMenu,
        },
        {
          id: 'ToolbarOnMuted',
          title: 'On a muted page',
          note: 'The floating surface lifts the toolbar off a grey dashboard background.',
          origin: 'aura',
          surface: 'muted',
          Component: ToolbarOnMuted,
        },
        {
          id: 'ToolbarSplitEnds',
          title: 'Title left, tools right',
          note: 'A full-width bar: what it is on one side, what you can do on the other.',
          origin: 'aura',
          size: 'md',
          Component: ToolbarSplitEnds,
        },
        {
          id: 'ToolbarChartHeader',
          title: 'Chart card header',
          note: 'Inline toolbar in a card header that scopes and exports the chart below.',
          origin: 'custom',
          size: 'md',
          Component: ToolbarChartHeader,
        },
        {
          id: 'ToolbarTableHeader',
          title: 'Above a table',
          note: 'Search on the left, inline tools and the create action on the right.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          Component: ToolbarTableHeader,
        },
        {
          id: 'ToolbarOverCanvas',
          title: 'Over a canvas',
          note: 'A vertical tool palette and a zoom bar floating over a drawing.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          Component: ToolbarOverCanvas,
        },
      ],
    },
  ],
});
