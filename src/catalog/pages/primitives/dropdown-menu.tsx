import { Avatar, AvatarFallback } from '@cognite/aura/components/avatar';
import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
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
  DropdownMenuSectionLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@cognite/aura/components/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import {
  IconArrowsSort,
  IconChartLine,
  IconChevronDown,
  IconChevronUp,
  IconColumns,
  IconCopy,
  IconDots,
  IconDotsVertical,
  IconDownload,
  IconExternalLink,
  IconFilter,
  IconLogout,
  IconPencil,
  IconPlus,
  IconSettings,
  IconShare,
  IconTool,
  IconTrash,
  IconUser,
  IconUserPlus,
} from '@cognite/aura/icons';
import { useState } from 'react';

import { SplitButton } from '../../../library/actions/SplitButton';
import { ALARMS, ASSETS, PEOPLE, WORK_ORDERS } from '../../data/plant';
import { definePage } from '../../types';

import source from './dropdown-menu.tsx?raw';

const OPERATOR = PEOPLE[0];
const ORDER = WORK_ORDERS[0];
const EQUIPMENT = ASSETS.filter((asset) => asset.type !== 'site' && asset.type !== 'area' && asset.type !== 'system');

const SORT_LABELS: Record<string, string> = {
  due: 'Due date',
  priority: 'Priority',
  updated: 'Last updated',
};

const SEVERITIES = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

function toggleValue(values: readonly string[], value: string): string[] {
  return values.includes(value) ? values.filter((current) => current !== value) : [...values, value];
}

function DropdownMenuBasic() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline">
            Actions <IconChevronDown />
          </Button>
        }
      />
      <DropdownMenuContent>
        <DropdownMenuItem>Edit details</DropdownMenuItem>
        <DropdownMenuItem>Duplicate</DropdownMenuItem>
        <DropdownMenuItem>Move to data set</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DropdownMenuIconTrigger() {
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="More actions">
                  <IconDots />
                </Button>
              }
            />
          }
        />
        <TooltipContent>More actions</TooltipContent>
      </Tooltip>
      <DropdownMenuContent>
        <DropdownMenuItem>Edit details</DropdownMenuItem>
        <DropdownMenuItem>Duplicate</DropdownMenuItem>
        <DropdownMenuItem>Move to data set</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DropdownMenuPrimaryTrigger() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button>
            <IconPlus /> Create <IconChevronDown />
          </Button>
        }
      />
      <DropdownMenuContent>
        <DropdownMenuItem>
          <IconTool /> Work order
        </DropdownMenuItem>
        <DropdownMenuItem>
          <IconChartLine /> Chart
        </DropdownMenuItem>
        <DropdownMenuItem>
          <IconUserPlus /> Shift handover
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DropdownMenuAlignEnd() {
  return (
    <div className="flex w-full max-w-xs justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline">
              Export <IconChevronDown />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Export as CSV</DropdownMenuItem>
          <DropdownMenuItem>Export as Parquet</DropdownMenuItem>
          <DropdownMenuItem>Copy as JSON</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function DropdownMenuSideTop() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline">
            Rows per page <IconChevronUp />
          </Button>
        }
      />
      <DropdownMenuContent side="top">
        <DropdownMenuItem>25 rows</DropdownMenuItem>
        <DropdownMenuItem>50 rows</DropdownMenuItem>
        <DropdownMenuItem>100 rows</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DropdownMenuSideRight() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Asset actions">
            <IconDotsVertical />
          </Button>
        }
      />
      <DropdownMenuContent side="right" align="start">
        <DropdownMenuItem>Open asset</DropdownMenuItem>
        <DropdownMenuItem>Add to watch list</DropdownMenuItem>
        <DropdownMenuItem>Copy tag</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DropdownMenuWithIcons() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline">
            Chart actions <IconChevronDown />
          </Button>
        }
      />
      <DropdownMenuContent>
        <DropdownMenuItem>
          <IconPencil /> Rename
        </DropdownMenuItem>
        <DropdownMenuItem>
          <IconCopy /> Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem>
          <IconShare /> Share
        </DropdownMenuItem>
        <DropdownMenuItem>
          <IconDownload /> Download as PNG
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DropdownMenuDestructive() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline">
            Pipeline <IconChevronDown />
          </Button>
        }
      />
      <DropdownMenuContent>
        <DropdownMenuItem>
          <IconPencil /> Edit schedule
        </DropdownMenuItem>
        <DropdownMenuItem>
          <IconCopy /> Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <IconTrash /> Delete pipeline
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DropdownMenuWithShortcuts() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline">
            Edit <IconChevronDown />
          </Button>
        }
      />
      <DropdownMenuContent className="w-52">
        <DropdownMenuItem>
          Undo <DropdownMenuShortcut>⌘Z</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          Redo <DropdownMenuShortcut>⇧⌘Z</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          Duplicate <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive">
          Delete <DropdownMenuShortcut>⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DropdownMenuWithGroups() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline">
            Work order <IconChevronDown />
          </Button>
        }
      />
      <DropdownMenuContent className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Plan</DropdownMenuLabel>
          <DropdownMenuItem>Assign technician</DropdownMenuItem>
          <DropdownMenuItem>Change due date</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Status</DropdownMenuLabel>
          <DropdownMenuItem>Put on hold</DropdownMenuItem>
          <DropdownMenuItem>Mark as done</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DropdownMenuWithHeader() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline">
            {ORDER.id} <IconChevronDown />
          </Button>
        }
      />
      <DropdownMenuContent className="w-64">
        <DropdownMenuHeader>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-base-foreground">{ORDER.title}</p>
            <p className="text-xs text-muted-foreground">
              {ORDER.id} · {ORDER.priority}
            </p>
          </div>
        </DropdownMenuHeader>
        <DropdownMenuItem>Open work order</DropdownMenuItem>
        <DropdownMenuItem>Copy link</DropdownMenuItem>
        <DropdownMenuItem>Print job card</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DropdownMenuWithSubmenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline">
            Alarm <IconChevronDown />
          </Button>
        }
      />
      <DropdownMenuContent className="w-48">
        <DropdownMenuItem>Acknowledge</DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Shelve for</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>1 hour</DropdownMenuItem>
            <DropdownMenuItem>Rest of shift</DropdownMenuItem>
            <DropdownMenuItem>24 hours</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem>Create work order</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DropdownMenuInset() {
  const [live, setLive] = useState(true);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline">
            Trend options <IconChevronDown />
          </Button>
        }
      />
      <DropdownMenuContent className="w-52">
        <DropdownMenuCheckboxItem checked={live} onCheckedChange={setLive}>
          Live update
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem inset>Reset zoom</DropdownMenuItem>
        <DropdownMenuItem inset>Download as PNG</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DropdownMenuLongList() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline">
            Go to equipment <IconChevronDown />
          </Button>
        }
      />
      <DropdownMenuContent className="max-h-64 w-64">
        <DropdownMenuSectionLabel>Nordkapp plant</DropdownMenuSectionLabel>
        {EQUIPMENT.map((asset) => (
          <DropdownMenuItem key={asset.id}>
            <span className="truncate">{asset.name}</span>
            <span className="ml-auto text-xs text-muted-foreground">{asset.tag}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DropdownMenuItemLink() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline">
            Help <IconChevronDown />
          </Button>
        }
      />
      <DropdownMenuContent className="w-52">
        <DropdownMenuItem render={<a href="https://docs.cognite.com/cdf/flows" target="_blank" rel="noreferrer" />}>
          Flows documentation <IconExternalLink className="ml-auto" />
        </DropdownMenuItem>
        <DropdownMenuItem
          render={<a href="https://docs.cognite.com/aura-design-system/primitives" target="_blank" rel="noreferrer" />}
        >
          Aura design system <IconExternalLink className="ml-auto" />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Keyboard shortcuts</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DropdownMenuCheckboxItems() {
  const [columns, setColumns] = useState<string[]>(['asset', 'priority', 'due']);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline">
            <IconColumns /> Columns
            <Badge variant="secondary">{columns.length}</Badge>
          </Button>
        }
      />
      <DropdownMenuContent className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Show columns</DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={columns.includes('asset')}
            onCheckedChange={() => setColumns(toggleValue(columns, 'asset'))}
          >
            Asset
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={columns.includes('priority')}
            onCheckedChange={() => setColumns(toggleValue(columns, 'priority'))}
          >
            Priority
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={columns.includes('due')}
            onCheckedChange={() => setColumns(toggleValue(columns, 'due'))}
          >
            Due date
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={columns.includes('assignee')}
            onCheckedChange={() => setColumns(toggleValue(columns, 'assignee'))}
          >
            Assignee
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DropdownMenuRadioItems() {
  const [sort, setSort] = useState('due');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline">
            <IconArrowsSort /> Sort: {SORT_LABELS[sort]}
          </Button>
        }
      />
      <DropdownMenuContent className="w-48">
        <DropdownMenuRadioGroup value={sort} onValueChange={(value) => setSort(String(value))}>
          <DropdownMenuRadioItem value="due">Due date</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="priority">Priority</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="updated">Last updated</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DropdownMenuMixedSelection() {
  const [density, setDensity] = useState('comfortable');
  const [showDone, setShowDone] = useState(false);
  const [showTags, setShowTags] = useState(true);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline">
            <IconSettings /> View
          </Button>
        }
      />
      <DropdownMenuContent className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Density</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={density} onValueChange={(value) => setDensity(String(value))}>
            <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="comfortable">Comfortable</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Show</DropdownMenuLabel>
          <DropdownMenuCheckboxItem checked={showDone} onCheckedChange={setShowDone}>
            Done work orders
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={showTags} onCheckedChange={setShowTags}>
            Asset tags
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DropdownMenuDisabledItem() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline">
            Compressor <IconChevronDown />
          </Button>
        }
      />
      <DropdownMenuContent className="w-64">
        <DropdownMenuItem>Open trend</DropdownMenuItem>
        <DropdownMenuItem>Create work order</DropdownMenuItem>
        <DropdownMenuItem disabled>
          Reset trip
          <span className="ml-auto text-xs">Needs supervisor</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DropdownMenuDisabledTrigger() {
  return (
    <div className="flex flex-col items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled
          render={
            <Button variant="outline" disabled>
              Bulk actions <IconChevronDown />
            </Button>
          }
        />
        <DropdownMenuContent>
          <DropdownMenuItem>Assign</DropdownMenuItem>
          <DropdownMenuItem>Export</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <p className="text-sm text-muted-foreground">Select at least one work order.</p>
    </div>
  );
}

function DropdownMenuActionFeedback() {
  const [status, setStatus] = useState('Open');

  return (
    <div className="flex flex-col items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline">
              Change status <IconChevronDown />
            </Button>
          }
        />
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setStatus('Planned')}>Mark as planned</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setStatus('In progress')}>Start work</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setStatus('Done')}>Mark as done</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {ORDER.id} is <span className="font-medium text-base-foreground">{status.toLowerCase()}</span>.
      </p>
    </div>
  );
}

function DropdownMenuControlled() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-3">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          render={
            <Button variant="outline">
              Share chart <IconChevronDown />
            </Button>
          }
        />
        <DropdownMenuContent>
          <DropdownMenuItem>Copy link</DropdownMenuItem>
          <DropdownMenuItem>Send to shift log</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Menu is {open ? 'open' : 'closed'}.
      </p>
    </div>
  );
}

function DropdownMenuRowActions() {
  return (
    <div className="flex w-full max-w-md items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-base-foreground">{ORDER.title}</p>
        <p className="text-xs text-muted-foreground">
          {ORDER.id} · {ORDER.priority} · in progress
        </p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${ORDER.id}`}>
              <IconDots />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <IconPencil /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem>
            <IconUserPlus /> Reassign
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">
            <IconTrash /> Cancel work order
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function DropdownMenuAccount() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" aria-label={`Account menu for ${OPERATOR.name}`}>
            <Avatar sizes="xsm">
              <AvatarFallback>{OPERATOR.initials}</AvatarFallback>
            </Avatar>
            {OPERATOR.name} <IconChevronDown />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuHeader>
          <Avatar>
            <AvatarFallback>{OPERATOR.initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-base-foreground">{OPERATOR.name}</p>
            <p className="truncate text-xs text-muted-foreground">{OPERATOR.role}</p>
          </div>
        </DropdownMenuHeader>
        <DropdownMenuItem>
          <IconUser /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem>
          <IconSettings /> Preferences
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <IconLogout /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DropdownMenuSplit() {
  return (
    <SplitButton
      onClick={() => undefined}
      menuLabel="More acknowledge options"
      options={[
        { id: 'comment', label: 'Acknowledge with comment', onSelect: () => undefined },
        { id: 'all', label: 'Acknowledge all on this asset', onSelect: () => undefined },
      ]}
    >
      Acknowledge
    </SplitButton>
  );
}

function DropdownMenuFilter() {
  const [severities, setSeverities] = useState<string[]>(['critical', 'high']);
  const matching = ALARMS.filter((alarm) => severities.includes(alarm.severity)).length;

  return (
    <div className="flex flex-col items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline">
              <IconFilter /> Severity
              {severities.length > 0 ? <Badge variant="secondary">{severities.length}</Badge> : null}
            </Button>
          }
        />
        <DropdownMenuContent className="w-48">
          {SEVERITIES.map((severity) => (
            <DropdownMenuCheckboxItem
              key={severity.value}
              checked={severities.includes(severity.value)}
              onCheckedChange={() => setSeverities(toggleValue(severities, severity.value))}
            >
              {severity.label}
            </DropdownMenuCheckboxItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem inset disabled={severities.length === 0} onClick={() => setSeverities([])}>
            Clear filter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <p className="text-sm text-muted-foreground tabular-nums" aria-live="polite">
        {severities.length === 0 ? `All ${ALARMS.length} alarms` : `${matching} of ${ALARMS.length} alarms`}
      </p>
    </div>
  );
}

export default definePage({
  id: 'dropdown-menu',
  title: 'Dropdown menu',
  summary:
    'A dropdown menu lists related actions or options behind a button. It keeps secondary and overflow actions out of the way until they are needed. Open each one to see its contents.',
  docsSlug: 'dropdown-menu',
  guidance: {
    use: [
      'Secondary and overflow actions for a row, card or page.',
      'Several actions of equal weight behind one clearly labelled trigger.',
      'View options: checkbox items for what to show, radio items for how to sort.',
      'Destructive items last, below a separator.',
    ],
    avoid: [
      'Hiding the primary action of a view in a menu.',
      'Picking a value for a form field — use a select or combobox.',
      'Options that need descriptions or search — use a select panel or command.',
      'Menus more than one submenu deep.',
    ],
  },
  source,
  sections: [
    {
      id: 'trigger-and-placement',
      title: 'Trigger and placement',
      description: 'What opens the menu, and where the menu opens relative to it.',
      specimens: [
        {
          id: 'DropdownMenuBasic',
          title: 'Button trigger',
          note: 'The default: a labelled button with a chevron, menu below and start-aligned.',
          origin: 'aura',
          Component: DropdownMenuBasic,
        },
        {
          id: 'DropdownMenuIconTrigger',
          title: 'Icon trigger',
          note: 'Overflow actions where space is tight; needs an accessible name and a tooltip.',
          origin: 'aura',
          Component: DropdownMenuIconTrigger,
        },
        {
          id: 'DropdownMenuPrimaryTrigger',
          title: 'Primary trigger',
          note: 'A create button that first asks what to create.',
          origin: 'aura',
          Component: DropdownMenuPrimaryTrigger,
        },
        {
          id: 'DropdownMenuAlignEnd',
          title: 'Aligned to the end',
          note: 'For triggers at the right edge of a header or row, so the menu stays inside.',
          origin: 'aura',
          Component: DropdownMenuAlignEnd,
        },
        {
          id: 'DropdownMenuSideTop',
          title: 'Opens upward',
          note: 'For triggers at the bottom of a view, such as a table footer.',
          origin: 'aura',
          Component: DropdownMenuSideTop,
        },
        {
          id: 'DropdownMenuSideRight',
          title: 'Opens to the side',
          note: 'For triggers in a narrow sidebar or tree, where below would cover the next rows.',
          origin: 'aura',
          Component: DropdownMenuSideRight,
        },
      ],
    },
    {
      id: 'items',
      title: 'Items and structure',
      description: 'What a menu can hold, from plain actions to groups, headers and submenus.',
      specimens: [
        {
          id: 'DropdownMenuWithIcons',
          title: 'Items with icons',
          note: 'Icons speed up scanning; give every item one, or none.',
          origin: 'aura',
          Component: DropdownMenuWithIcons,
        },
        {
          id: 'DropdownMenuDestructive',
          title: 'Destructive item',
          note: 'Irreversible actions go last, below a separator, in the destructive variant.',
          origin: 'aura',
          Component: DropdownMenuDestructive,
        },
        {
          id: 'DropdownMenuWithShortcuts',
          title: 'With shortcuts',
          note: 'Teaches the keyboard shortcut next to the action it triggers.',
          origin: 'aura',
          Component: DropdownMenuWithShortcuts,
        },
        {
          id: 'DropdownMenuWithGroups',
          title: 'Labelled groups',
          note: 'More than five or six items: split them by purpose and name each group.',
          origin: 'aura',
          Component: DropdownMenuWithGroups,
        },
        {
          id: 'DropdownMenuWithHeader',
          title: 'With header',
          note: 'Says which record the actions apply to when the trigger alone does not.',
          origin: 'aura',
          Component: DropdownMenuWithHeader,
        },
        {
          id: 'DropdownMenuWithSubmenu',
          title: 'With submenu',
          note: 'One action that needs a second choice; keep it to a single level.',
          origin: 'aura',
          Component: DropdownMenuWithSubmenu,
        },
        {
          id: 'DropdownMenuInset',
          title: 'Inset items',
          note: 'Plain actions line up with checkbox or radio items in the same menu.',
          origin: 'aura',
          Component: DropdownMenuInset,
        },
        {
          id: 'DropdownMenuLongList',
          title: 'Long list',
          note: 'The menu scrolls once it reaches its height limit; consider a combobox beyond this.',
          origin: 'aura',
          Component: DropdownMenuLongList,
        },
        {
          id: 'DropdownMenuItemLink',
          title: 'Items as links',
          note: 'Items that navigate are real anchors, so they open in a new tab on demand.',
          origin: 'aura',
          Component: DropdownMenuItemLink,
        },
      ],
    },
    {
      id: 'selection',
      title: 'Selection',
      description: 'Checkbox and radio items keep the menu open, so several can be changed in one visit.',
      specimens: [
        {
          id: 'DropdownMenuCheckboxItems',
          title: 'Checkbox items',
          note: 'Independent on and off options, such as visible table columns.',
          origin: 'aura',
          Component: DropdownMenuCheckboxItems,
        },
        {
          id: 'DropdownMenuRadioItems',
          title: 'Radio items',
          note: 'One of a few exclusive options; the trigger shows the current choice.',
          origin: 'aura',
          Component: DropdownMenuRadioItems,
        },
        {
          id: 'DropdownMenuMixedSelection',
          title: 'View options',
          note: 'Radio and checkbox groups together behind a single view button.',
          origin: 'aura',
          Component: DropdownMenuMixedSelection,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'Unavailable items and triggers, and feedback after an action runs.',
      specimens: [
        {
          id: 'DropdownMenuDisabledItem',
          title: 'Disabled item with reason',
          note: 'An action the user should know exists; the hint says what unlocks it.',
          origin: 'aura',
          Component: DropdownMenuDisabledItem,
        },
        {
          id: 'DropdownMenuDisabledTrigger',
          title: 'Disabled trigger',
          note: 'When no item could apply yet; say what the user has to do first.',
          origin: 'aura',
          Component: DropdownMenuDisabledTrigger,
        },
        {
          id: 'DropdownMenuActionFeedback',
          title: 'Action with feedback',
          note: 'The menu closes on select, so the result has to show in the view.',
          origin: 'aura',
          Component: DropdownMenuActionFeedback,
        },
        {
          id: 'DropdownMenuControlled',
          title: 'Controlled open state',
          note: 'When something else needs to know, or decide, whether the menu is open.',
          origin: 'aura',
          Component: DropdownMenuControlled,
        },
      ],
    },
    {
      id: 'in-context',
      title: 'In context',
      description: 'Menus where they usually live.',
      specimens: [
        {
          id: 'DropdownMenuSplit',
          title: 'Split button',
          note: 'One default action with close alternatives behind the caret.',
          origin: 'custom',
          uses: ['actions/SplitButton.tsx'],
          Component: DropdownMenuSplit,
        },
        {
          id: 'DropdownMenuFilter',
          title: 'Filter menu',
          note: 'A multi-select filter over a short fixed set, with the count on the trigger.',
          origin: 'custom',
          Component: DropdownMenuFilter,
        },
        {
          id: 'DropdownMenuAccount',
          title: 'Account menu',
          note: 'Identity in the header, personal actions below, sign out last.',
          origin: 'custom',
          Component: DropdownMenuAccount,
        },
        {
          id: 'DropdownMenuRowActions',
          title: 'Row actions',
          note: 'Per-row actions behind one quiet icon button at the end of the row.',
          origin: 'custom',
          size: 'md',
          Component: DropdownMenuRowActions,
        },
      ],
    },
  ],
});
